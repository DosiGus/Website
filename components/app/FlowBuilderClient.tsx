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
  MessageSquare,
  Plus,
  Search,
  Settings2,
  Shapes,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import FlowBuilderCanvas from "./FlowBuilderCanvas";
import FlowListBuilder from "./FlowListBuilder";
import InspectorSlideOver from "./InspectorSlideOver";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import {
  defaultNodes,
  defaultEdges,
  defaultTriggers,
  defaultMetadata,
} from "../../lib/defaultFlow";
import { lintFlow, FlowLintWarning } from "../../lib/flowLint";
import type { FlowMetadata, FlowTrigger, FlowQuickReply } from "../../lib/flowTypes";
import useAccountVertical from "../../lib/useAccountVertical";
import { getBookingLabels } from "../../lib/verticals";

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
type InputMode = "buttons" | "free_text";

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
      inputMode: data.inputMode,
      placeholder: data.placeholder ?? "",
      collects: data.collects ?? "",
    },
  };
};

const deriveInputMode = (node: Node, edges: Edge[]): InputMode => {
  const configured = (node.data as any)?.inputMode as InputMode | undefined;
  if (configured) return configured;
  const quickReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
  if (quickReplies.length > 0) return "buttons";
  const hasFreeTextEdge = edges.some(
    (edge) => edge.source === node.id && !(edge.data as any)?.quickReplyId,
  );
  return hasFreeTextEdge ? "free_text" : "buttons";
};

const ensureInputMode = (nodes: Node[], edges: Edge[]): Node[] =>
  nodes.map((node) => {
    const inputMode = deriveInputMode(node, edges);
    return {
      ...node,
      data: {
        ...node.data,
        inputMode,
      },
    };
  });

const buildFreeTextDefaults = (label?: string) => {
  const lower = (label ?? "").toLowerCase();
  if (lower.includes("datum")) {
    return {
      text: "Bitte gib dein Wunschdatum ein.",
      collects: "date",
      placeholder: "z. B. 14. Februar",
    };
  }
  if (lower.includes("uhr") || lower.includes("zeit")) {
    return {
      text: "Bitte gib deine Wunschzeit ein.",
      collects: "time",
      placeholder: "z. B. 18:30",
    };
  }
  if (lower.includes("name")) {
    return {
      text: "Wie lautet dein Name?",
      collects: "name",
      placeholder: "z. B. Maria",
    };
  }
  if (lower.includes("telefon") || lower.includes("phone")) {
    return {
      text: "Wie lautet deine Telefonnummer?",
      collects: "phone",
      placeholder: "z. B. 0176 12345678",
    };
  }
  if (lower.includes("mail")) {
    return {
      text: "Wie lautet deine E-Mail-Adresse?",
      collects: "email",
      placeholder: "z. B. maria@example.com",
    };
  }
  return {
    text: "Bitte gib deine Antwort ein.",
    collects: "",
    placeholder: "Antwort eingeben…",
  };
};

export default function FlowBuilderClient({ flowId }: { flowId: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initialEdges = useMemo(() => defaultEdges.map(ensureEdgeMeta), []);
  const initialNodes = useMemo(
    () => ensureInputMode(defaultNodes.map(normalizeNode), initialEdges),
    [initialEdges],
  );
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [triggers, setTriggers] = useState<FlowTrigger[]>(defaultTriggers);
  const [metadata, setMetadata] = useState<FlowMetadata>(defaultMetadata);
  const [flowName, setFlowName] = useState("Neuer Flow");
  const [status, setStatus] = useState<"Entwurf" | "Aktiv">("Entwurf");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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
  const [isInspectorOpen, setInspectorOpen] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const { vertical } = useAccountVertical();
  const labels = getBookingLabels(vertical);
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    if (!token) {
      router.replace("/login");
      return null;
    }
    if (token !== accessToken) {
      setAccessToken(token);
    }
    return token;
  }, [accessToken, router, supabase]);

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
        label: `${labels.bookingSingular} (Standard)`,
        text: `Ich benötige Name, Datum, Uhrzeit und ${labels.participantsCountLabel}, um ${labels.bookingAccusativeArticle} ${labels.bookingSingular} einzutragen.`,
      },
    ],
    [labels.bookingAccusativeArticle, labels.bookingSingular, labels.participantsCountLabel],
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

  const currentSnapshot = useMemo(() => {
    try {
      return JSON.stringify({ flowName, status, nodes, edges, triggers, metadata });
    } catch {
      return "";
    }
  }, [flowName, status, nodes, edges, triggers, metadata]);

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
    setInspectorOpen(true);
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
      setInspectorOpen(false);
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
    if (loading) return;
    if (!lastSavedSnapshotRef.current) {
      lastSavedSnapshotRef.current = currentSnapshot;
      setHasUnsavedChanges(false);
      return;
    }
    setHasUnsavedChanges(currentSnapshot !== lastSavedSnapshotRef.current);
  }, [currentSnapshot, loading]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase]);

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
      await getAccessToken();
    }
    loadUser();
  }, [router, supabase, getAccessToken]);

  useEffect(() => {
    if (!userId) return;
    async function fetchFlow() {
      setLoading(true);
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/flows/${flowId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 404) {
        setErrorMessage("Flow wurde nicht gefunden oder du hast keinen Zugriff.");
        setLoading(false);
        return;
      }
      const data: FlowResponse = await response.json();
      const statusValue = (data.status as "Entwurf" | "Aktiv") ?? "Entwurf";
      const triggersToUse = Array.isArray(data.triggers) ? (data.triggers as FlowTrigger[]) : defaultTriggers;
      const metadataToUse = (data.metadata as FlowMetadata) ?? defaultMetadata;
      setFlowName(data.name);
      setStatus(statusValue);
      const normalized = ((data.nodes as Node[]) || defaultNodes).map(normalizeNode);
      const incomingEdges =
        Array.isArray(data.edges) && data.edges.length > 0
          ? (data.edges as Edge[])
          : defaultEdges;
      const edgesToUse = incomingEdges.map(ensureEdgeMeta);
      const nodesToUse = ensureInputMode(normalized, edgesToUse);
      setEdges(edgesToUse);
      setNodes(nodesToUse);
      setTriggers(triggersToUse);
      setMetadata(metadataToUse);
      setLoading(false);
      setErrorMessage(null);
      try {
        lastSavedSnapshotRef.current = JSON.stringify({
          flowName: data.name,
          status: statusValue,
          nodes: nodesToUse,
          edges: edgesToUse,
          triggers: triggersToUse,
          metadata: metadataToUse,
        });
        setHasUnsavedChanges(false);
      } catch {
        lastSavedSnapshotRef.current = "";
      }
    }
    fetchFlow();
  }, [flowId, userId, getAccessToken]);

  useEffect(() => {
    setLintWarnings(lintFlow(nodes, edges, triggers).warnings);
  }, [nodes, edges, triggers]);

  // Open inspector when node or edge is selected
  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      setInspectorOpen(true);
    }
  }, [selectedNodeId, selectedEdgeId]);

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

  const getNewNodePosition = useCallback(() => {
    let posX = 200;
    let posY = 200;
    let currentZoom = 1;

    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      currentZoom = viewport.zoom;
      const canvasWidth = 800;
      const canvasHeight = 500;
      posX = (canvasWidth / 2 - viewport.x) / viewport.zoom;
      posY = (canvasHeight / 2 - viewport.y) / viewport.zoom;
      const offset = nodes.length * 20;
      posX += offset % 100;
      posY += offset % 60;
    }

    return { posX, posY, currentZoom };
  }, [reactFlowInstance, nodes.length]);

  const addNode = useCallback((type: "message" | "choice", presetLabel?: string) => {
    const id = uuid();
    const { posX, posY, currentZoom } = getNewNodePosition();

    const newNode: Node = {
      id,
      type: "wesponde",
      position: { x: posX, y: posY },
      data: {
        label: presetLabel ?? (type === "message" ? "Neue Nachricht" : "Auswahl"),
        text: presetLabel ?? (type === "message" ? "Neue Nachricht" : "Auswahl"),
        variant: type,
        quickReplies: [],
        inputMode: "buttons",
        placeholder: "",
        collects: "",
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setInspectorOpen(true);
    setAddMenuOpen(false);

    // Pan to the new node
    setTimeout(() => {
      reactFlowInstance?.setCenter(posX + 75, posY + 50, { zoom: currentZoom, duration: 300 });
    }, 50);
  }, [getNewNodePosition, reactFlowInstance]);

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

  const handleInputModeChange = useCallback(
    (mode: InputMode) => {
      if (!selectedNodeId) return;
      setNodes((prev) =>
        prev.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  inputMode: mode,
                  ...(mode === "free_text"
                    ? (() => {
                        const defaults = buildFreeTextDefaults(
                          (node.data?.label as string | undefined) ?? "",
                        );
                        return {
                          placeholder: node.data?.placeholder || defaults.placeholder,
                          collects: node.data?.collects || defaults.collects,
                        };
                      })()
                    : {}),
                },
              }
            : node,
        ),
      );
    },
    [selectedNodeId],
  );

  const handleFreeTextMetaChange = useCallback(
    (field: "placeholder" | "collects", value: string) => {
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

  const getFreeTextTarget = useCallback(
    (nodeId?: string | null) => {
      if (!nodeId) return null;
      const edge = edges.find(
        (item) => item.source === nodeId && !(item.data as any)?.quickReplyId,
      );
      return edge?.target ?? null;
    },
    [edges],
  );

  const setFreeTextTarget = useCallback(
    (nodeId: string, targetId: string | null) => {
      setEdges((prev) => {
        const filtered = prev.filter(
          (edge) => !(edge.source === nodeId && !(edge.data as any)?.quickReplyId),
        );
        if (!targetId) return filtered;
        return [
          ...filtered,
          {
            id: `ft-${nodeId}-${targetId}`,
            source: nodeId,
            target: targetId,
            data: { tone: "neutral", condition: "Freitext" },
            label: "Freitext",
            markerEnd: { type: MarkerType.ArrowClosed },
          },
        ];
      });
    },
    [],
  );

  const buildFreeTextNode = useCallback(
    (label?: string) => {
      const id = uuid();
      const { posX, posY, currentZoom } = getNewNodePosition();
      const defaults = buildFreeTextDefaults(label);
      const node: Node = {
        id,
        type: "wesponde",
        position: { x: posX, y: posY },
        data: {
          label: label ? `Freitext: ${label}` : "Freitext",
          text: defaults.text,
          variant: "message",
          quickReplies: [],
          inputMode: "free_text",
          placeholder: defaults.placeholder,
          collects: defaults.collects,
        },
      };
      return { node, focus: { x: posX, y: posY, zoom: currentZoom } };
    },
    [getNewNodePosition],
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

  const handleQuickReplyTargetChange = useCallback(
    (replyId: string, targetValue: string, label: string) => {
      if (!selectedNodeId) return;
      if (targetValue === "__NEW_FREETEXT__") {
        const { node: newNode, focus } = buildFreeTextNode(label);
        let updatedReplies: FlowQuickReply[] | null = null;
        setNodes((prev) => {
          const updatedNodes = prev.map((node) => {
            if (node.id !== selectedNodeId) return node;
            const currentReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
            updatedReplies = currentReplies.map((reply) =>
              reply.id === replyId ? { ...reply, targetNodeId: newNode.id } : reply,
            );
            return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
          });
          return [...updatedNodes, newNode];
        });
        if (updatedReplies) {
          syncEdgesForNode(selectedNodeId, updatedReplies);
        }
        setSelectedNodeId(newNode.id);
        setSelectedEdgeId(null);
        setInspectorTab("content");
        setTimeout(() => {
          reactFlowInstance?.setCenter(
            focus.x + 75,
            focus.y + 50,
            { zoom: focus.zoom, duration: 300 },
          );
        }, 50);
        return;
      }
      updateQuickReply(replyId, { targetNodeId: targetValue || null });
    },
    [
      selectedNodeId,
      buildFreeTextNode,
      syncEdgesForNode,
      updateQuickReply,
      reactFlowInstance,
    ],
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
      // If no multi-selection, delete the single selected item
      if (selectedNodeId) {
        handleDeleteNode(selectedNodeId);
      }
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
    setInspectorOpen(false);
  }, [selection, selectedNodeId, handleDeleteNode]);

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
      if (loading) return;
      const token = await getAccessToken();
      if (!token) return;
      if (!silent) setSaveState("saving");
      const response = await fetch(`/api/flows/${flowId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        try {
          lastSavedSnapshotRef.current = JSON.stringify({
            flowName,
            status,
            nodes,
            edges,
            triggers,
            metadata,
          });
          setHasUnsavedChanges(false);
        } catch {
          lastSavedSnapshotRef.current = "";
        }
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
    [loading, flowId, flowName, status, nodes, edges, triggers, metadata, getAccessToken],
  );

  const handleExport = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    setExporting(true);
    try {
      const response = await fetch(`/api/flows/${flowId}/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
  }, [flowId, getAccessToken]);

  const duplicateSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    addNode(
      (selectedNode.data?.variant as "message" | "choice") ?? "message",
      `${selectedNode.data?.label ?? "Kopie"} (Copy)`,
    );
  }, [addNode, selectedNode]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const tagName = target?.tagName;
      if (target?.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
        return;
      }
      const hasSelection =
        Boolean(selectedNodeId || selectedEdgeId) ||
        selection.nodes.length > 0 ||
        selection.edges.length > 0;
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
      if ((event.key === "Delete" || event.key === "Backspace") && hasSelection) {
        event.preventDefault();
        deleteSelection();
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        reactFlowInstance?.fitView({ padding: 0.2, duration: 600 });
      }
      if (event.key === "Escape") {
        setInspectorOpen(false);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    handleCopy,
    handlePaste,
    handleSave,
    duplicateSelectedNode,
    deleteSelection,
    reactFlowInstance,
    selectedNodeId,
    selectedEdgeId,
    selection.nodes.length,
    selection.edges.length,
  ]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!accessToken || loading || !hasUnsavedChanges) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      handleSave(true);
    }, 1500);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [nodes, edges, flowName, status, accessToken, loading, handleSave, hasUnsavedChanges]);

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
    setNodes((prev) =>
      prev.map((node) =>
        node.id === inlineEditNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                text: inlineEditValue,
                label: inlineEditValue,
              },
            }
          : node,
      ),
    );
    setInlineEditNodeId(null);
  }, [inlineEditNodeId, inlineEditValue]);

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
          setInspectorOpen(true);
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
        setInspectorOpen(true);
        reactFlowInstance?.setCenter(
          targetNode.position.x + 50,
          targetNode.position.y,
          { zoom: 1.1, duration: 600 },
        );
      }
    },
    [nodes, edges, reactFlowInstance],
  );

  // Computed values for inspector
  const selectedNodeReplies = ((selectedNode?.data?.quickReplies as FlowQuickReply[]) ?? []);
  const selectedInputMode = selectedNode ? deriveInputMode(selectedNode, edges) : "buttons";
  const selectedFreeTextTarget = getFreeTextTarget(selectedNodeId);

  if (loading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-10 text-center backdrop-blur-xl">
          <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-zinc-400">Flow wird geladen...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-10 text-center max-w-md backdrop-blur-xl">
          <TriangleAlert className="mx-auto h-12 w-12 text-rose-400" />
          <p className="mt-4 text-sm text-rose-400">{errorMessage}</p>
        </div>
      </div>
    );
  }

  const warningBadge =
    lintWarnings.length > 0 ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-400">
        <TriangleAlert className="h-3.5 w-3.5" /> {lintWarnings.length}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> OK
      </span>
    );

  return (
    <div className="relative min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-screen-2xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Flow Name */}
            <div className="flex items-center gap-4">
              <input
                value={flowName}
                onChange={(event) => setFlowName(event.target.value)}
                className="font-display text-2xl font-semibold text-white bg-transparent focus:outline-none focus:ring-0 border-0 p-0"
                style={{ minWidth: '200px' }}
              />
              {warningBadge}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Preview Button */}
              <button
                onClick={() => {
                  setInspectorTab("preview");
                  setInspectorOpen(true);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                Flow Preview
              </button>

              {/* Status */}
              <button
                onClick={() => setStatus(status === "Aktiv" ? "Entwurf" : "Aktiv")}
                className={
                  status === "Aktiv"
                    ? "rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:border-amber-500/50 transition-colors"
                    : "rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all"
                }
              >
                {status === "Aktiv" ? "Archivieren" : "Live stellen"}
              </button>

              {/* Save Button */}
              <button
                onClick={() => handleSave()}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                disabled={saveState === "saving"}
              >
                {saveState === "saving"
                  ? "Speichert..."
                  : saveState === "saved"
                  ? "Gespeichert"
                  : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {/* Toolbar */}
        <div className="mx-auto max-w-screen-2xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Mode Toggle */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                onClick={() => setBuilderMode("simple")}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                  builderMode === "simple"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Einfach
              </button>
              <button
                onClick={() => setBuilderMode("pro")}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                  builderMode === "pro"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Profi
              </button>
            </div>

            <div className="h-6 w-px bg-white/10" />

            {builderMode === "pro" && (
              <>
                <button
                  onClick={runAutoLayout}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-indigo-500/50 hover:text-white transition-colors"
                >
                  <Focus className="h-4 w-4" />
                  Auto-Layout
                </button>
                <button
                  onClick={fitToView}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-indigo-500/50 hover:text-white transition-colors"
                >
                  Zoom to Fit
                </button>
              </>
            )}

            {/* Search */}
            <div className="relative ml-auto">
              <button
                onClick={() => setNodeSearchOpen(!nodeSearchOpen)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-indigo-500/50 hover:text-white transition-colors"
              >
                <Search className="h-4 w-4" />
                Suchen
              </button>
              {nodeSearchOpen && (
                <div className="absolute right-0 top-12 z-20 w-72 rounded-xl border border-white/10 bg-zinc-900 p-3 shadow-2xl animate-scale-in">
                  <input
                    type="text"
                    placeholder="Schritt suchen..."
                    value={nodeSearchQuery}
                    onChange={(e) => setNodeSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                    autoFocus
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                      {searchResults.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => jumpToNode(node.id)}
                          className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors"
                        >
                          <Focus className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                          <div>
                            <p className="font-semibold text-zinc-200">{node.data?.label || "Ohne Titel"}</p>
                            <p className="line-clamp-1 text-xs text-zinc-500">{node.data?.text || ""}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {nodeSearchQuery && searchResults.length === 0 && (
                    <p className="mt-2 text-center text-sm text-zinc-500">Keine Ergebnisse</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="mx-auto max-w-screen-2xl px-6 pb-6">
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
            <div className="h-[calc(100vh-200px)] min-h-[500px] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
              <FlowListBuilder
                nodes={nodes}
                edges={edges}
                startNodeIds={startNodeIds}
                triggers={triggers}
                onOpenTriggerModal={() => openTriggerModal()}
                onNodesChange={handleListNodesChange}
                onEdgesChange={handleListEdgesChange}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => {
                  setSelectedNodeId(id);
                  setInspectorOpen(true);
                }}
                onAddNode={addNode}
                onDeleteNode={handleDeleteNode}
              />
            </div>
          )}

          {/* Inline Editor Overlay */}
          {inlineEditNodeId && (
            <div className="absolute bottom-10 right-10 w-72 rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-2xl animate-scale-in">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Inline bearbeiten
              </p>
              <input
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                value={inlineEditValue}
                onChange={(event) => setInlineEditValue(event.target.value)}
                onKeyDown={(event: ReactKeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyInlineEdit();
                  }
                }}
                autoFocus
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={applyInlineEdit}
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setInlineEditNodeId(null)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Add Button */}
        {builderMode === "pro" && (
          <div className="fixed left-6 top-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <button
                onClick={() => setAddMenuOpen(!isAddMenuOpen)}
                className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 ${
                  isAddMenuOpen ? "rotate-45" : ""
                }`}
              >
                <Plus className="h-6 w-6" />
              </button>

              {/* Add Menu */}
              {isAddMenuOpen && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 w-48 rounded-xl border border-white/10 bg-zinc-900 p-2 shadow-2xl animate-scale-in">
                  <button
                    onClick={() => addNode("message")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    Nachricht
                  </button>
                  <button
                    onClick={() => addNode("choice")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-purple-600">
                      <Shapes className="h-4 w-4 text-white" />
                    </div>
                    Auswahl
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Inspector Slide-Over */}
      <InspectorSlideOver
        isOpen={isInspectorOpen}
        onClose={() => {
          setInspectorOpen(false);
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        inspectorTab={inspectorTab}
        onTabChange={setInspectorTab}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => handleSave()}
        disableBackdropBlur={builderMode === "simple"}
        hidePayloadField={builderMode === "simple"}
        selectedNode={selectedNode}
        selectedNodeReplies={selectedNodeReplies}
        selectedInputMode={selectedInputMode}
        onNodeFieldChange={handleNodeFieldChange}
        onInputModeChange={handleInputModeChange}
        onFreeTextMetaChange={handleFreeTextMetaChange}
        selectedFreeTextTarget={selectedFreeTextTarget}
        onFreeTextTargetChange={setFreeTextTarget}
        onAddQuickReply={addQuickReply}
        onUpdateQuickReply={updateQuickReply}
        onRemoveQuickReply={removeQuickReply}
        onQuickReplyTargetChange={handleQuickReplyTargetChange}
        selectedEdge={selectedEdge}
        onEdgeFieldChange={handleEdgeFieldChange}
        onDeleteSelection={deleteSelection}
        snippets={snippets}
        smartPrompt={smartPrompt}
        onSmartPromptChange={setSmartPrompt}
        onSmartPromptSubmit={handleSmartPrompt}
        onSnippetInsert={handleSnippetInsert}
        nodes={nodes}
        edges={edges}
        triggers={triggers}
        onNodeSelect={setSelectedNodeId}
        lintWarnings={lintWarnings}
        onFocusWarning={focusWarning}
        saveState={saveState}
      />

      {/* Trigger Modal */}
      {isTriggerModalOpen && triggerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-white">
                {editingTriggerId ? "Trigger bearbeiten" : "Neuen Trigger anlegen"}
              </h3>
              <button onClick={closeTriggerModal} className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Existing Triggers List */}
            {!editingTriggerId && triggers.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Bestehende Trigger</p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {triggers.map((trigger) => (
                    <div key={trigger.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-wrap gap-1">
                        {trigger.config.keywords.slice(0, 3).map((keyword) => (
                          <span key={keyword} className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-zinc-300">
                            {keyword}
                          </span>
                        ))}
                        {trigger.config.keywords.length > 3 && (
                          <span className="text-xs text-zinc-500">+{trigger.config.keywords.length - 3}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openTriggerModal(trigger)}
                          className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteTrigger(trigger.id)}
                          className="rounded-full p-1.5 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-semibold text-zinc-300">Keywords</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {triggerForm.config.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-400"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeywordFromTrigger(keyword)}
                        className="text-indigo-400/60 hover:text-indigo-400"
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeywordToTrigger();
                      }
                    }}
                    placeholder="Keyword hinzufügen"
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={addKeywordToTrigger}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-indigo-500/50 hover:text-white transition-colors"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-300">Match Type</label>
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
                  className="app-select mt-2 w-full"
                >
                  <option value="CONTAINS">enthält Schlagwort</option>
                  <option value="EXACT">exaktes Schlagwort</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-300">Start Node</label>
                <select
                  value={triggerForm.startNodeId ?? ""}
                  onChange={(event) =>
                    setTriggerForm((prev) =>
                      prev ? { ...prev, startNodeId: event.target.value || null } : prev,
                    )
                  }
                  className="app-select mt-2 w-full"
                >
                  <option value="">Node wählen...</option>
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
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50"
                disabled={
                  !triggerForm.config.keywords.length || !triggerForm.startNodeId
                }
              >
                Speichern
              </button>
              <button
                onClick={closeTriggerModal}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close add menu */}
      {isAddMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setAddMenuOpen(false)}
        />
      )}
    </div>
  );
}
