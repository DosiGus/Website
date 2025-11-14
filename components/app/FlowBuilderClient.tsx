'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  MarkerType,
  ReactFlowInstance,
} from "reactflow";
import {
  CheckCircle2,
  Focus,
  Plus,
  Shapes,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import FlowBuilderCanvas from "./FlowBuilderCanvas";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { defaultNodes, defaultEdges } from "../../lib/defaultFlow";
import { lintFlow, FlowLintWarning } from "../../lib/flowLint";

type FlowResponse = {
  id: string;
  name: string;
  status: string;
  nodes: Node[];
  edges: Edge[];
  updated_at: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type InspectorTab = "content" | "logic" | "variables" | "preview";
type EdgeTone = "neutral" | "positive" | "negative";

const EDGE_TONE_META: Record<EdgeTone, { label: string; bg: string; text: string }> = {
  neutral: { label: "Neutral", bg: "#e2e8f0", text: "#0f172a" },
  positive: { label: "Bestätigt", bg: "#d1fae5", text: "#065f46" },
  negative: { label: "Ablehnung", bg: "#fee2e2", text: "#b91c1c" },
};

const ensureEdgeMeta = (edge: Edge): Edge => {
  const tone = ((edge.data as any)?.tone as EdgeTone) ?? "neutral";
  const condition = (edge.data as any)?.condition ?? edge.label ?? "";
  return {
    ...edge,
    data: {
      ...(edge.data ?? {}),
      tone,
      condition,
    },
    label: condition,
  };
};

const decorateEdgeForCanvas = (edge: Edge): Edge => {
  const tone = ((edge.data as any)?.tone as EdgeTone) ?? "neutral";
  const colors = EDGE_TONE_META[tone];
  return {
    ...edge,
    label: (edge.data as any)?.condition ?? edge.label ?? "",
    labelStyle: {
      fontSize: 12,
      fontWeight: 600,
      color: colors.text,
      fill: colors.text,
    },
    labelBgStyle: {
      fill: colors.bg,
      strokeWidth: 0,
    },
  };
};

export default function FlowBuilderClient({ flowId }: { flowId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);
  const initialEdges = useMemo(() => defaultEdges.map(ensureEdgeMeta), []);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [flowName, setFlowName] = useState("Neuer Flow");
  const [status, setStatus] = useState<"Entwurf" | "Aktiv">("Entwurf");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lintWarnings, setLintWarnings] = useState<FlowLintWarning[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [inlineEditNodeId, setInlineEditNodeId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const [smartPrompt, setSmartPrompt] = useState("");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("content");
  const [selection, setSelection] = useState<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const snippets = useMemo(
    () => [
      {
        label: "Öffnungszeiten",
        text: "Unsere Öffnungszeiten: Mo–Fr 10–22 Uhr, Sa 12–24 Uhr.",
      },
      {
        label: "Adresse",
        text: "Du findest uns in der Musterstraße 5, Berlin-Mitte. Hier der Maps-Link: https://maps.google.com/?q=Musterstraße+5+Berlin",
      },
      {
        label: "Reservierung (Standard)",
        text: "Ich benötige Name, Datum, Uhrzeit und Personenanzahl, um die Reservierung einzutragen.",
      },
    ],
    [],
  );

  const decoratedEdges = useMemo(() => edges.map(decorateEdgeForCanvas), [edges]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId],
  );

  useEffect(() => {
    if (!inlineEditNodeId) return;
    const node = nodes.find((n) => n.id === inlineEditNodeId);
    setInlineEditValue(node?.data?.label ?? "");
  }, [inlineEditNodeId, nodes]);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace("/login");
        return;
      }
      setAccessToken(session.access_token);
    }
    loadUser();
  }, [router, supabase]);

  useEffect(() => {
    if (!userId || !accessToken) return;
    async function fetchFlow() {
      setLoading(true);
      const response = await fetch(`/api/flows/${flowId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 404) {
        setErrorMessage("Flow wurde nicht gefunden oder du hast keinen Zugriff.");
        setLoading(false);
        return;
      }
      const data: FlowResponse = await response.json();
      setFlowName(data.name);
      setStatus((data.status as "Entwurf" | "Aktiv") ?? "Entwurf");
      setNodes((data.nodes as Node[]) || defaultNodes);
      const incomingEdges =
        Array.isArray(data.edges) && data.edges.length > 0
          ? (data.edges as Edge[])
          : defaultEdges;
      setEdges(incomingEdges.map(ensureEdgeMeta));
      setLoading(false);
      setErrorMessage(null);
    }
    fetchFlow();
  }, [flowId, userId, accessToken]);

  useEffect(() => {
    setLintWarnings(lintFlow(nodes, edges).warnings);
  }, [nodes, edges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const handleSelectionChange = useCallback(
    ({ nodes: nodeSelection, edges: edgeSelection }: { nodes: Node[]; edges: Edge[] }) => {
      setSelection({ nodes: nodeSelection, edges: edgeSelection });
      setSelectedNodeId(nodeSelection[0]?.id ?? null);
      setSelectedEdgeId(edgeSelection[0]?.id ?? null);
    },
    [],
  );

  const handleConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            data: { tone: "neutral", condition: "" },
            label: "",
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds,
        ),
      ),
    [],
  );

  const addNode = useCallback((type: "message" | "choice", presetLabel?: string) => {
    const id = uuid();
    const newNode: Node = {
      id,
      type: "default",
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      },
      data: {
        label: presetLabel ?? (type === "message" ? "Neue Nachricht" : "Auswahl"),
        variant: type,
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  }, []);

  const handleNodeFieldChange = useCallback(
    (field: string, value: string) => {
      if (!selectedNodeId) return;
      setNodes((prev) =>
        prev.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  [field]: value,
                },
              }
            : node,
        ),
      );
    },
    [selectedNodeId],
  );

  const handleEdgeFieldChange = useCallback(
    (field: "condition" | "tone", value: string) => {
      if (!selectedEdgeId) return;
      setEdges((prev) =>
        prev.map((edge) =>
          edge.id === selectedEdgeId
            ? {
                ...edge,
                data: {
                  ...(edge.data ?? {}),
                  condition:
                    field === "condition" ? value : (edge.data as any)?.condition ?? edge.label,
                  tone:
                    field === "tone"
                      ? (value as EdgeTone)
                      : (((edge.data as any)?.tone ?? "neutral") as EdgeTone),
                },
                label: field === "condition" ? value : edge.label,
              }
            : edge,
        ),
      );
    },
    [selectedEdgeId],
  );

  const deleteSelection = useCallback(() => {
    if (!selection.nodes.length && !selection.edges.length) {
      return;
    }
    const nodeIds = new Set(selection.nodes.map((node) => node.id));
    const edgeIds = new Set(selection.edges.map((edge) => edge.id));
    setNodes((prev) => prev.filter((node) => !nodeIds.has(node.id)));
    setEdges((prev) =>
      prev.filter(
        (edge) =>
          !edgeIds.has(edge.id) &&
          !nodeIds.has(edge.source) &&
          !nodeIds.has(edge.target),
      ),
    );
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSelection({ nodes: [], edges: [] });
  }, [selection]);

  const handleCopy = useCallback(() => {
    if (!selection.nodes.length) return;
    const nodeIds = new Set(selection.nodes.map((node) => node.id));
    clipboardRef.current = {
      nodes: selection.nodes.map((node) => ({ ...node })),
      edges: edges
        .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
        .map((edge) => ({ ...edge })),
    };
  }, [selection.nodes, edges]);

  const handlePaste = useCallback(() => {
    if (!clipboardRef.current.nodes.length) return;
    const idMap = new Map<string, string>();
    const newNodes = clipboardRef.current.nodes.map((node) => {
      const newId = uuid();
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 40,
          y: node.position.y + 40,
        },
        selected: false,
      };
    });
    const newEdges = clipboardRef.current.edges
      .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
      .map((edge) => ({
        ...edge,
        id: uuid(),
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
      }));
    setNodes((prev) => [...prev, ...newNodes]);
    setEdges((prev) => [...prev, ...newEdges]);
  }, []);

  const handleSave = useCallback(
    async (silent = false) => {
      if (!accessToken || loading) return;
      if (!silent) setSaveState("saving");
      const response = await fetch(`/api/flows/${flowId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: flowName,
          status,
          nodes,
          edges,
        }),
      });
      if (response.ok) {
        if (!silent) {
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 2000);
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.error ?? "Speichern fehlgeschlagen");
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 4000);
      }
    },
    [accessToken, loading, flowId, flowName, status, nodes, edges],
  );

  const duplicateSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    addNode(
      (selectedNode.data?.variant as "message" | "choice") ?? "message",
      `${selectedNode.data?.label ?? "Kopie"} (Copy)`,
    );
  }, [addNode, selectedNode]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT" || (event.target as HTMLElement)?.tagName === "TEXTAREA") {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
        event.preventDefault();
        handleCopy();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v") {
        event.preventDefault();
        handlePaste();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSave();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelectedNode();
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelection();
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        reactFlowInstance?.fitView({ padding: 0.2, duration: 600 });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCopy, handlePaste, handleSave, duplicateSelectedNode, deleteSelection, reactFlowInstance]);

  useEffect(() => {
    if (!accessToken || loading) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      handleSave(true);
    }, 1500);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [nodes, edges, flowName, status, accessToken, loading, handleSave]);

  const fitToView = useCallback(
    () => reactFlowInstance?.fitView({ padding: 0.2, duration: 600 }),
    [reactFlowInstance],
  );

  const runAutoLayout = useCallback(() => {
    if (!nodes.length) return;
    const adjacency = new Map<string, string[]>();
    edges.forEach((edge) => {
      adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
    });
    const startNode = nodes.find((node) => node.type === "input") ?? nodes[0];
    const depthMap = new Map<string, number>();
    if (startNode) {
      const queue = [startNode.id];
      depthMap.set(startNode.id, 0);
      while (queue.length) {
        const current = queue.shift()!;
        const children = adjacency.get(current) ?? [];
        children.forEach((child) => {
          if (!depthMap.has(child)) {
            depthMap.set(child, (depthMap.get(current) ?? 0) + 1);
            queue.push(child);
          }
        });
      }
    }
    nodes.forEach((node) => {
      if (!depthMap.has(node.id)) {
        depthMap.set(node.id, depthMap.size);
      }
    });
    const levelCounters = new Map<number, number>();
    const newPositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => {
      const depth = depthMap.get(node.id) ?? 0;
      const rowIndex = levelCounters.get(depth) ?? 0;
      levelCounters.set(depth, rowIndex + 1);
      newPositions.set(node.id, {
        x: depth * 280,
        y: rowIndex * 160,
      });
    });
    setNodes((prev) =>
      prev.map((node) =>
        newPositions.has(node.id) ? { ...node, position: newPositions.get(node.id)! } : node,
      ),
    );
  }, [nodes, edges]);

  const openInlineEditor = useCallback((node: Node) => {
    setInlineEditNodeId(node.id);
    setInlineEditValue(node.data?.label ?? "");
  }, []);

  const applyInlineEdit = useCallback(() => {
    if (!inlineEditNodeId) return;
    handleNodeFieldChange("label", inlineEditValue);
    setInlineEditNodeId(null);
  }, [handleNodeFieldChange, inlineEditNodeId, inlineEditValue]);

  const handleSnippetInsert = useCallback(
    (text: string) => {
      if (selectedNode) {
        handleNodeFieldChange("label", text);
      } else {
        addNode("message", text);
      }
    },
    [selectedNode, handleNodeFieldChange, addNode],
  );

  const handleSmartPrompt = useCallback(() => {
    if (!selectedNodeId || !smartPrompt.trim()) return;
    handleNodeFieldChange("label", smartPrompt.trim());
    setSmartPrompt("");
  }, [selectedNodeId, smartPrompt, handleNodeFieldChange]);

  const focusWarning = useCallback(
    (warning: FlowLintWarning) => {
      if (!warning.nodeId) return;
      const targetNode = nodes.find((node) => node.id === warning.nodeId);
      if (targetNode) {
        setSelectedNodeId(targetNode.id);
        setSelectedEdgeId(null);
        reactFlowInstance?.setCenter(
          targetNode.position.x + 50,
          targetNode.position.y,
          { zoom: 1.1, duration: 600 },
        );
      }
    },
    [nodes, reactFlowInstance],
  );

  if (loading || !userId) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        Flow wird geladen …
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-700">
        {errorMessage}
      </div>
    );
  }

  const warningBadge =
    lintWarnings.length > 0 ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        <TriangleAlert className="h-3 w-3" /> {lintWarnings.length} Warnungen
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Flow valide
      </span>
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <input
            value={flowName}
            onChange={(event) => setFlowName(event.target.value)}
            className="text-3xl font-semibold text-slate-900 focus:outline-none"
          />
          <p className="text-sm text-slate-500">
            Bearbeite deinen Flow und speichere, um die Änderungen live zu schalten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {warningBadge}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as "Entwurf" | "Aktiv")}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 focus:border-brand focus:outline-none"
          >
            <option value="Entwurf">Entwurf</option>
            <option value="Aktiv">Aktiv</option>
          </select>
          <button
            onClick={() => handleSave()}
            className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30"
            disabled={saveState === "saving"}
          >
            {saveState === "saving"
              ? "Speichert …"
              : saveState === "saved"
              ? "Gespeichert"
              : "Speichern"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => addNode("message")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
            >
              <Plus className="h-4 w-4" />
              Nachricht
            </button>
            <button
              onClick={() => addNode("choice")}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
            >
              <Shapes className="h-4 w-4" />
              Auswahl
            </button>
            <button
              onClick={runAutoLayout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
            >
              <Focus className="h-4 w-4" />
              Auto-Layout
            </button>
            <button
              onClick={fitToView}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
            >
              Zoom to Fit
            </button>
          </div>
          <FlowBuilderCanvas
            nodes={nodes}
            edges={decoratedEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
            }}
            onNodeDoubleClick={(_, node) => {
              setSelectedNodeId(node.id);
              setSelectedEdgeId(null);
              openInlineEditor(node);
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdgeId(edge.id);
              setSelectedNodeId(null);
              setInspectorTab("logic");
            }}
            onSelectionChange={handleSelectionChange}
            onInit={(instance) => setReactFlowInstance(instance)}
            onFitView={fitToView}
          />
          {inlineEditNodeId ? (
            <div className="absolute bottom-6 right-10 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Inline bearbeiten
              </p>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                value={inlineEditValue}
                onChange={(event) => setInlineEditValue(event.target.value)}
                onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyInlineEdit();
                  }
                }}
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={applyInlineEdit}
                  className="flex-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setInlineEditNodeId(null)}
                  className="flex-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold text-slate-600">
            {(["content", "logic", "variables", "preview"] as InspectorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setInspectorTab(tab)}
                className={`flex-1 rounded-full px-3 py-1 capitalize ${
                  inspectorTab === tab ? "bg-white shadow text-slate-900" : ""
                }`}
              >
                {tab === "content"
                  ? "Inhalt"
                  : tab === "logic"
                  ? "Logik"
                  : tab === "variables"
                  ? "Variablen"
                  : "Vorschau"}
              </button>
            ))}
          </div>

          {inspectorTab === "content" && (
            <>
              {selectedNode ? (
                <>
                  <div>
                    <label className="text-sm font-semibold text-slate-500">
                      Nachricht / Label
                    </label>
                    <textarea
                      value={selectedNode.data?.label ?? ""}
                      onChange={(event) => handleNodeFieldChange("label", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                      rows={4}
                    />
                  </div>
                  <button
                    onClick={deleteSelection}
                    className="w-full rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600"
                  >
                    Node entfernen
                  </button>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                  Wähle einen Node im Canvas aus, um die Inhalte zu bearbeiten.
                </div>
              )}
              <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-600">Snippets</p>
                <div className="flex flex-wrap gap-2">
                  {snippets.map((snippet) => (
                    <button
                      key={snippet.label}
                      onClick={() => handleSnippetInsert(snippet.text)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand"
                    >
                      {snippet.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Sparkles className="h-4 w-4 text-brand" />
                  Smart Prompt
                </p>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                  rows={3}
                  placeholder="z. B. 'Erzeuge eine freundliche Begrüßung für ein italienisches Restaurant...'"
                  value={smartPrompt}
                  onChange={(event) => setSmartPrompt(event.target.value)}
                />
                <button
                  onClick={handleSmartPrompt}
                  className="w-full rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-brand"
                >
                  Vorschlag einsetzen
                </button>
              </div>
            </>
          )}

          {inspectorTab === "logic" && (
            <>
              {selectedEdge ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-500">Edge Label</label>
                    <input
                      value={(selectedEdge.data as any)?.condition ?? ""}
                      onChange={(event) => handleEdgeFieldChange("condition", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500">
                      Bedeutung / Ton
                    </label>
                    <select
                      value={((selectedEdge.data as any)?.tone as EdgeTone) ?? "neutral"}
                      onChange={(event) =>
                        handleEdgeFieldChange("tone", event.target.value as EdgeTone)
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none"
                    >
                      {Object.entries(EDGE_TONE_META).map(([value, meta]) => (
                        <option key={value} value={value}>
                          {meta.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Wähle eine Verbindung, um Bedingungen und Labels zu pflegen.
                </p>
              )}
            </>
          )}

          {inspectorTab === "variables" && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Variablen-Support folgt. Plane hier Platzhalter wie {"{{customer_name}}"} ein.
            </div>
          )}

  {inspectorTab === "preview" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Vorschau simuliert die aktuelle Nachricht mit Labels.
              </p>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
                {selectedNode
                  ? selectedNode.data?.label
                  : "Wähle einen Node, um die Ausgabe zu sehen."}
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-sm font-semibold text-slate-600">Qualitäts-Check</p>
            {lintWarnings.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Keine Warnungen
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {lintWarnings.map((warning) => (
                  <li
                    key={warning.id}
                    className="rounded-2xl border border-amber-100 bg-white/70 p-3 text-slate-700"
                  >
                    <p className="font-semibold text-amber-700">{warning.message}</p>
                    {warning.suggestion ? (
                      <p className="text-xs text-slate-500">{warning.suggestion}</p>
                    ) : null}
                    {warning.nodeId ? (
                      <button
                        onClick={() => focusWarning(warning)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand"
                      >
                        <Focus className="h-3 w-3" />
                        Zum Node springen
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {saveState === "saved" && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Änderungen gespeichert
            </div>
          )}
          {saveState === "error" && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              <TriangleAlert className="h-4 w-4" /> Speichern fehlgeschlagen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
