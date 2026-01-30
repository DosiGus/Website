'use client';

import Image from "next/image";
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
  Edit2,
  Focus,
  Plus,
  Search,
  Shapes,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import FlowBuilderCanvas from "./FlowBuilderCanvas";
import FlowListBuilder from "./FlowListBuilder";
import FlowSimulator from "./FlowSimulator";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import {
  defaultNodes,
  defaultEdges,
  defaultTriggers,
  defaultMetadata,
} from "../../lib/defaultFlow";
import { lintFlow, FlowLintWarning } from "../../lib/flowLint";
import type { FlowMetadata, FlowTrigger, FlowQuickReply } from "../../lib/flowTypes";

type FlowResponse = {
  id: string;
  name: string;
  status: string;
  nodes: Node[];
  edges: Edge[];
  updated_at: string;
  triggers?: FlowTrigger[];
  metadata?: FlowMetadata;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type InspectorTab = "content" | "logic" | "variables" | "preview";
type EdgeTone = "neutral" | "positive" | "negative";
type BuilderMode = "simple" | "pro";

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

const normalizeNode = (node: Node): Node => {
  const data = node.data ?? {};
  const quickReplies: FlowQuickReply[] = Array.isArray(data.quickReplies)
    ? data.quickReplies
    : [];
  return {
    ...node,
    type: node.type ?? "wesponde",
    data: {
      ...data,
      label: data.label ?? data.text ?? "Nachricht",
      text: data.text ?? data.label ?? "",
      variant: data.variant ?? "message",
      imageUrl: data.imageUrl ?? null,
      quickReplies,
    },
  };
};

export default function FlowBuilderClient({ flowId }: { flowId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>(defaultNodes.map(normalizeNode));
  const initialEdges = useMemo(() => defaultEdges.map(ensureEdgeMeta), []);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [triggers, setTriggers] = useState<FlowTrigger[]>(defaultTriggers);
  const [metadata, setMetadata] = useState<FlowMetadata>(defaultMetadata);
  const [flowName, setFlowName] = useState("Neuer Flow");
  const [status, setStatus] = useState<"Entwurf" | "Aktiv">("Entwurf");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [exporting, setExporting] = useState(false);
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
  const [isTriggerModalOpen, setTriggerModalOpen] = useState(false);
  const [editingTriggerId, setEditingTriggerId] = useState<string | null>(null);
  const [triggerForm, setTriggerForm] = useState<FlowTrigger | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [nodeSearchQuery, setNodeSearchQuery] = useState("");
  const [nodeSearchOpen, setNodeSearchOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>("simple");
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

  const startNodeIds = useMemo(
    () =>
      new Set(
        triggers
          .map((trigger) => trigger.startNodeId)
          .filter((value): value is string => Boolean(value)),
      ),
    [triggers],
  );

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          quickReplies: node.data?.quickReplies ?? [],
          isStart: startNodeIds.has(node.id),
        },
      })),
    [nodes, startNodeIds],
  );

  const decoratedEdges = useMemo(() => edges.map(decorateEdgeForCanvas), [edges]);

  const searchResults = useMemo(() => {
    if (!nodeSearchQuery.trim()) return [];
    const query = nodeSearchQuery.toLowerCase();
    return nodes.filter((node) => {
      const label = (node.data?.label ?? "").toLowerCase();
      const text = (node.data?.text ?? "").toLowerCase();
      return label.includes(query) || text.includes(query);
    }).slice(0, 8);
  }, [nodes, nodeSearchQuery]);

  const jumpToNode = useCallback((nodeId: string) => {
    const targetNode = nodes.find((node) => node.id === nodeId);
    if (!targetNode) return;
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setNodeSearchOpen(false);
    setNodeSearchQuery("");
    if (reactFlowInstance) {
      reactFlowInstance.setCenter(
        targetNode.position.x + 100,
        targetNode.position.y + 50,
        { zoom: 1.2, duration: 500 }
      );
    }
  }, [nodes, reactFlowInstance]);

  const handleListNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
  }, []);

  const handleListEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

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
    setInlineEditValue(node?.data?.text ?? "");
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
      const normalized = ((data.nodes as Node[]) || defaultNodes).map(normalizeNode);
      setNodes(normalized);
      const incomingEdges =
        Array.isArray(data.edges) && data.edges.length > 0
          ? (data.edges as Edge[])
          : defaultEdges;
      setEdges(incomingEdges.map(ensureEdgeMeta));
      setTriggers(Array.isArray(data.triggers) ? (data.triggers as FlowTrigger[]) : defaultTriggers);
      setMetadata((data.metadata as FlowMetadata) ?? defaultMetadata);
      setLoading(false);
      setErrorMessage(null);
    }
    fetchFlow();
  }, [flowId, userId, accessToken]);

  useEffect(() => {
    setLintWarnings(lintFlow(nodes, edges, triggers).warnings);
  }, [nodes, edges, triggers]);

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

    // Calculate position in the center of visible viewport
    let posX = 200;
    let posY = 200;
    let currentZoom = 1;

    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      currentZoom = viewport.zoom;
      // Get the canvas container dimensions (approximate)
      const canvasWidth = 800;
      const canvasHeight = 500;

      // Convert screen center to flow coordinates
      posX = (canvasWidth / 2 - viewport.x) / viewport.zoom;
      posY = (canvasHeight / 2 - viewport.y) / viewport.zoom;

      // Add small offset to avoid exact overlap with existing nodes
      const offset = nodes.length * 20;
      posX += offset % 100;
      posY += (offset % 60);
    }

    const newNode: Node = {
      id,
      type: "wesponde",
      position: { x: posX, y: posY },
      data: {
        label: presetLabel ?? (type === "message" ? "Neue Nachricht" : "Auswahl"),
        text: presetLabel ?? (type === "message" ? "Neue Nachricht" : "Auswahl"),
        variant: type,
        quickReplies: [],
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);

    // Pan to the new node
    setTimeout(() => {
      reactFlowInstance?.setCenter(posX + 75, posY + 50, { zoom: currentZoom, duration: 300 });
    }, 50);
  }, [reactFlowInstance, nodes.length]);

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
                  ...(field === "label" ? { text: value } : {}),
                  ...(field === "text" ? { label: value } : {}),
                },
              }
            : node,
        ),
      );
    },
    [selectedNodeId],
  );

  const syncEdgesForNode = useCallback(
    (nodeId: string, replies: FlowQuickReply[]) => {
      setEdges((prev) => {
        let next = prev
          .filter((edge) => {
            if (edge.source === nodeId && (edge.data as any)?.quickReplyId) {
              const reply = replies.find(
                (quickReply) => quickReply.id === (edge.data as any)?.quickReplyId,
              );
              return Boolean(reply && reply.targetNodeId);
            }
            return true;
          })
          .map((edge) => {
            if (edge.source === nodeId && (edge.data as any)?.quickReplyId) {
              const reply = replies.find(
                (quickReply) => quickReply.id === (edge.data as any)?.quickReplyId,
              );
              if (!reply || !reply.targetNodeId) {
                return edge;
              }
              return {
                ...edge,
                target: reply.targetNodeId,
                data: {
                  ...(edge.data ?? {}),
                  tone: ((edge.data as any)?.tone as EdgeTone) ?? "neutral",
                  condition: reply.label,
                  quickReplyId: reply.id,
                },
                label: reply.label,
              };
            }
            return edge;
          });
        replies.forEach((reply) => {
          if (!reply.targetNodeId) return;
          const exists = next.some(
            (edge) =>
              edge.source === nodeId && (edge.data as any)?.quickReplyId === reply.id,
          );
          if (!exists) {
            next.push({
              id: `qr-${nodeId}-${reply.id}`,
              source: nodeId,
              target: reply.targetNodeId,
              data: { tone: "neutral", condition: reply.label, quickReplyId: reply.id },
              markerEnd: { type: MarkerType.ArrowClosed },
              label: reply.label,
            });
          }
        });
        return next;
      });
    },
    [],
  );

  const addQuickReply = useCallback(() => {
    if (!selectedNodeId) return;
    let updatedReplies: FlowQuickReply[] | null = null;
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== selectedNodeId) return node;
        const currentReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
        updatedReplies = [
          ...currentReplies,
          { id: uuid(), label: "Neue Option", payload: "", targetNodeId: null },
        ];
        return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
      }),
    );
    if (updatedReplies) {
      syncEdgesForNode(selectedNodeId, updatedReplies);
    }
  }, [selectedNodeId, syncEdgesForNode]);

  const updateQuickReply = useCallback(
    (replyId: string, patch: Partial<FlowQuickReply>) => {
      if (!selectedNodeId) return;
      let updatedReplies: FlowQuickReply[] | null = null;
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== selectedNodeId) return node;
          const currentReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
          updatedReplies = currentReplies.map((reply) =>
            reply.id === replyId ? { ...reply, ...patch } : reply,
          );
          return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
        }),
      );
      if (updatedReplies) {
        syncEdgesForNode(selectedNodeId, updatedReplies);
      }
    },
    [selectedNodeId, syncEdgesForNode],
  );

  const removeQuickReply = useCallback(
    (replyId: string) => {
      if (!selectedNodeId) return;
      let updatedReplies: FlowQuickReply[] | null = null;
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id !== selectedNodeId) return node;
          const currentReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
          updatedReplies = currentReplies.filter((reply) => reply.id !== replyId);
          return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
        }),
      );
      if (updatedReplies) {
        syncEdgesForNode(selectedNodeId, updatedReplies);
      }
    },
    [selectedNodeId, syncEdgesForNode],
  );

  const openTriggerModal = useCallback(
    (trigger?: FlowTrigger) => {
      if (trigger) {
        setTriggerForm(trigger);
        setEditingTriggerId(trigger.id);
      } else {
        setTriggerForm({
          id: uuid(),
          type: "KEYWORD",
          config: { keywords: [], matchType: "CONTAINS" },
          startNodeId: nodes[0]?.id ?? null,
        });
        setEditingTriggerId(null);
      }
      setKeywordInput("");
      setTriggerModalOpen(true);
    },
    [nodes],
  );

  const closeTriggerModal = useCallback(() => {
    setTriggerModalOpen(false);
    setTriggerForm(null);
    setEditingTriggerId(null);
    setKeywordInput("");
  }, []);

  const saveTrigger = useCallback(() => {
    if (!triggerForm) return;
    setTriggers((prev) => {
      if (editingTriggerId) {
        return prev.map((trigger) => (trigger.id === editingTriggerId ? triggerForm : trigger));
      }
      return [...prev, triggerForm];
    });
    closeTriggerModal();
  }, [triggerForm, editingTriggerId, closeTriggerModal]);

  const deleteTrigger = useCallback((id: string) => {
    setTriggers((prev) => prev.filter((trigger) => trigger.id !== id));
  }, []);

  const addKeywordToTrigger = useCallback(() => {
    if (!keywordInput.trim()) return;
    setTriggerForm((prev) => {
      if (!prev) return prev;
      const keyword = keywordInput.trim();
      if (prev.config.keywords.includes(keyword)) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          keywords: [...prev.config.keywords, keyword],
        },
      };
    });
    setKeywordInput("");
  }, [keywordInput]);

  const removeKeywordFromTrigger = useCallback((keyword: string) => {
    setTriggerForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          keywords: prev.config.keywords.filter((item) => item !== keyword),
        },
      };
    });
  }, []);

  const getNodeLabel = useCallback(
    (nodeId?: string | null) =>
      nodes.find((node) => node.id === nodeId)?.data?.label ?? "Nicht gesetzt",
    [nodes],
  );

  const handleEdgeFieldChange = useCallback(
    (field: "condition" | "tone", value: string) => {
      if (!selectedEdgeId) return;
      const edge = edges.find((item) => item.id === selectedEdgeId);
      const quickReplyId = (edge?.data as any)?.quickReplyId;
      const sourceNodeId = edge?.source;

      // Always update the edge directly
      setEdges((prev) =>
        prev.map((item) =>
          item.id === selectedEdgeId
            ? {
                ...item,
                data: {
                  ...(item.data ?? {}),
                  condition:
                    field === "condition" ? value : (item.data as any)?.condition ?? item.label,
                  tone:
                    field === "tone"
                      ? (value as EdgeTone)
                      : (((item.data as any)?.tone ?? "neutral") as EdgeTone),
                },
                label: field === "condition" ? value : item.label,
              }
            : item,
        ),
      );

      // Also update the quick reply label if this edge is linked to one
      if (field === "condition" && quickReplyId && sourceNodeId) {
        setNodes((prev) =>
          prev.map((node) => {
            if (node.id !== sourceNodeId) return node;
            const currentReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
            const updatedReplies = currentReplies.map((reply) =>
              reply.id === quickReplyId ? { ...reply, label: value } : reply,
            );
            return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
          }),
        );
      }
    },
    [selectedEdgeId, edges],
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
          triggers,
          metadata,
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
    [accessToken, loading, flowId, flowName, status, nodes, edges, triggers, metadata],
  );

  const handleExport = useCallback(async () => {
    if (!accessToken) return;
    setExporting(true);
    try {
      const response = await fetch(`/api/flows/${flowId}/export`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `flow-${flowId}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Export fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setExporting(false);
    }
  }, [accessToken, flowId]);

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
    handleNodeFieldChange("text", inlineEditValue);
    setInlineEditNodeId(null);
  }, [handleNodeFieldChange, inlineEditNodeId, inlineEditValue]);

  const handleSnippetInsert = useCallback(
    (text: string) => {
      if (selectedNode) {
        handleNodeFieldChange("text", text);
      } else {
        addNode("message", text);
      }
    },
    [selectedNode, handleNodeFieldChange, addNode],
  );

  const handleSmartPrompt = useCallback(() => {
    if (!selectedNodeId || !smartPrompt.trim()) return;
    handleNodeFieldChange("text", smartPrompt.trim());
    setSmartPrompt("");
  }, [selectedNodeId, smartPrompt, handleNodeFieldChange]);

  const focusWarning = useCallback(
    (warning: FlowLintWarning) => {
      // Handle edge warnings
      if (warning.edgeId) {
        const targetEdge = edges.find((edge) => edge.id === warning.edgeId);
        if (targetEdge) {
          setSelectedEdgeId(targetEdge.id);
          setSelectedNodeId(null);
          setInspectorTab("logic");
          // Focus on the source node of the edge
          const sourceNode = nodes.find((node) => node.id === targetEdge.source);
          if (sourceNode) {
            reactFlowInstance?.setCenter(
              sourceNode.position.x + 100,
              sourceNode.position.y,
              { zoom: 1.1, duration: 600 },
            );
          }
        }
        return;
      }

      // Handle node warnings
      if (!warning.nodeId) return;
      const targetNode = nodes.find((node) => node.id === warning.nodeId);
      if (targetNode) {
        setSelectedNodeId(targetNode.id);
        setSelectedEdgeId(null);
        setInspectorTab("content");
        reactFlowInstance?.setCenter(
          targetNode.position.x + 50,
          targetNode.position.y,
          { zoom: 1.1, duration: 600 },
        );
      }
    },
    [nodes, edges, reactFlowInstance],
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

  const selectedNodeReplies =
    ((selectedNode?.data?.quickReplies as FlowQuickReply[]) ?? []);

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
          <button
            onClick={handleExport}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand"
            disabled={exporting}
          >
            {exporting ? "Exportiert…" : "JSON exportieren"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr,340px]">
        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Trigger</p>
              <h2 className="text-lg font-semibold text-slate-900">Einstiegspunkte</h2>
            </div>
            <button
              onClick={() => openTriggerModal()}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand"
            >
              <Plus className="h-4 w-4" />
              Neuer Trigger
            </button>
          </div>
          {triggers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Noch keine Trigger angelegt. Lege Schlüsselwörter an, um deinen Flow zu starten.
            </p>
          ) : (
            <div className="space-y-3">
              {triggers.map((trigger) => (
                <div key={trigger.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    User sends a message
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {trigger.config.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Match: {trigger.config.matchType === "CONTAINS" ? "enthält" : "exakt"}
                  </p>
                  <p className="text-sm text-slate-600">
                    Startet bei: <span className="font-semibold">{getNodeLabel(trigger.startNodeId)}</span>
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => openTriggerModal(trigger)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      <Edit2 className="h-3 w-3" />
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteTrigger(trigger.id)}
                      className="flex items-center justify-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex rounded-full bg-slate-100 p-1">
              <button
                onClick={() => setBuilderMode("simple")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  builderMode === "simple"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Einfach
              </button>
              <button
                onClick={() => setBuilderMode("pro")}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  builderMode === "pro"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Profi
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            {builderMode === "pro" && (
              <>
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
              </>
            )}
            <div className="relative ml-auto">
              <button
                onClick={() => setNodeSearchOpen(!nodeSearchOpen)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand hover:text-brand"
              >
                <Search className="h-4 w-4" />
                Suchen
              </button>
              {nodeSearchOpen && (
                <div className="absolute right-0 top-12 z-20 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
                  <input
                    type="text"
                    placeholder="Schritt suchen..."
                    value={nodeSearchQuery}
                    onChange={(e) => setNodeSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                    autoFocus
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                      {searchResults.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => jumpToNode(node.id)}
                          className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <Focus className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="font-semibold text-slate-700">{node.data?.label || "Ohne Titel"}</p>
                            <p className="line-clamp-1 text-xs text-slate-400">{node.data?.text || ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {nodeSearchQuery && searchResults.length === 0 && (
                    <p className="mt-2 text-center text-sm text-slate-400">Keine Ergebnisse</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {builderMode === "pro" ? (
            <FlowBuilderCanvas
              nodes={displayNodes}
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
          ) : (
            <div className="h-[640px] overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50/50 p-6">
              <FlowListBuilder
                nodes={nodes}
                edges={edges}
                startNodeIds={startNodeIds}
                onNodesChange={handleListNodesChange}
                onEdgesChange={handleListEdgesChange}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onAddNode={addNode}
                onDeleteNode={handleDeleteNode}
              />
            </div>
          )}
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
                    <label className="text-sm font-semibold text-slate-500">Textnachricht</label>
                    <textarea
                      value={selectedNode.data?.text ?? ""}
                      onChange={(event) => handleNodeFieldChange("text", event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-500">Bild (URL)</label>
                    <input
                      value={selectedNode.data?.imageUrl ?? ""}
                      onChange={(event) => handleNodeFieldChange("imageUrl", event.target.value)}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                    />
                  </div>
                  <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-600">Quick Replies</p>
                      <button
                        onClick={addQuickReply}
                        className="text-xs font-semibold text-brand hover:text-brand-dark"
                      >
                        + Quick Reply
                      </button>
                    </div>
                    {selectedNodeReplies.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Noch keine Buttons. Füge Quick Replies hinzu, um Antworten zu verlinken.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedNodeReplies.map((reply) => (
                          <div
                            key={reply.id}
                            className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Button</span>
                              <button
                                onClick={() => removeQuickReply(reply.id)}
                                className="text-rose-500"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <input
                              value={reply.label}
                              onChange={(event) =>
                                updateQuickReply(reply.id, { label: event.target.value })
                              }
                              placeholder="Button-Text"
                              className="w-full rounded-2xl border border-slate-200 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                            />
                            <input
                              value={reply.payload}
                              onChange={(event) =>
                                updateQuickReply(reply.id, { payload: event.target.value })
                              }
                              placeholder="Payload / interne Aktion"
                              className="w-full rounded-2xl border border-slate-200 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                            />
                            <div>
                              <label className="text-xs font-semibold text-slate-500">
                                Weiterleiten zu
                              </label>
                              <select
                                value={reply.targetNodeId ?? ""}
                                onChange={(event) =>
                                  updateQuickReply(reply.id, {
                                    targetNodeId: event.target.value || null,
                                  })
                                }
                                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
                              >
                                <option value="">Node wählen …</option>
                                {nodes.map((node) => (
                                  <option key={node.id} value={node.id}>
                                    {node.data?.label ?? node.id}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <FlowSimulator
                nodes={nodes}
                edges={edges}
                triggers={triggers}
                onNodeSelect={setSelectedNodeId}
              />
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
                    className={`rounded-2xl border p-3 text-slate-700 ${
                      warning.severity === "info"
                        ? "border-blue-100 bg-blue-50/50"
                        : "border-amber-100 bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold ${
                        warning.severity === "info" ? "text-blue-700" : "text-amber-700"
                      }`}>
                        {warning.message}
                      </p>
                      {(warning as any).action ? (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          warning.severity === "info"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {(warning as any).action}
                        </span>
                      ) : null}
                    </div>
                    {warning.suggestion ? (
                      <p className="mt-1 text-xs text-slate-500">{warning.suggestion}</p>
                    ) : null}
                    {(warning.nodeId || (warning as any).edgeId) ? (
                      <button
                        onClick={() => focusWarning(warning)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
                      >
                        <Focus className="h-3 w-3" />
                        {(warning as any).edgeId ? "Zur Verbindung springen" : "Zum Node springen"}
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

      {isTriggerModalOpen && triggerForm ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                {editingTriggerId ? "Trigger bearbeiten" : "Neuen Trigger anlegen"}
              </h3>
              <button onClick={closeTriggerModal} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-600">Keywords</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {triggerForm.config.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeywordFromTrigger(keyword)}
                        className="text-slate-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    placeholder="Keyword hinzufügen"
                    className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                  />
                  <button
                    onClick={addKeywordToTrigger}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Match Type</label>
                <select
                  value={triggerForm.config.matchType}
                  onChange={(event) =>
                    setTriggerForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            config: {
                              ...prev.config,
                              matchType: event.target.value as FlowTrigger["config"]["matchType"],
                            },
                          }
                        : prev,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="CONTAINS">enthält Schlagwort</option>
                  <option value="EXACT">exaktes Schlagwort</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600">Start Node</label>
                <select
                  value={triggerForm.startNodeId ?? ""}
                  onChange={(event) =>
                    setTriggerForm((prev) =>
                      prev ? { ...prev, startNodeId: event.target.value || null } : prev,
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
                >
                  <option value="">Node wählen …</option>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.data?.label ?? node.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={saveTrigger}
                className="flex-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
                disabled={
                  !triggerForm.config.keywords.length || !triggerForm.startNodeId
                }
              >
                Speichern
              </button>
              <button
                onClick={closeTriggerModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
