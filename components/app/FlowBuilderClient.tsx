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
  CalendarCheck,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Focus,
  Info,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  Shapes,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
  Zap,
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
import type { FlowMetadata, FlowTrigger, FlowQuickReply, FlowOutputConfig } from "../../lib/flowTypes";
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

function testTriggerMatch(message: string, keywords: string[], matchType: "EXACT" | "CONTAINS"): boolean {
  if (!message.trim() || !keywords.length) return false;
  const normalized = message.toLowerCase().trim();
  for (const keyword of keywords) {
    const kw = keyword.toLowerCase().trim();
    if (!kw) continue;
    if (matchType === "EXACT") {
      if (normalized === kw) return true;
    } else {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|\\s|[.,!?])${escaped}($|\\s|[.,!?])`, "i");
      if (regex.test(normalized)) return true;
    }
  }
  return false;
}

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
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [triggerTestInput, setTriggerTestInput] = useState("");
  const [cockpitIssuesExpanded, setCockpitIssuesExpanded] = useState(false);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const [showFlowSettings, setShowFlowSettings] = useState(false);
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

  // Derived output config helpers
  const outputConfig = metadata.output_config as FlowOutputConfig | undefined;
  const outputType = outputConfig?.type ?? "reservation";
  const requiredFields = outputConfig?.requiredFields ?? (outputType === "reservation" ? ["name", "date", "time"] : []);

  const COLLECTS_LABELS: Record<string, string> = {
    name: "Name",
    date: "Datum",
    time: "Uhrzeit",
    guestCount: labels.participantsCountLabel,
    phone: "Telefon",
    email: "E-Mail",
    specialRequests: "Sonderwünsche",
    reviewRating: "Bewertung",
    reviewFeedback: "Feedback",
    googleReviewUrl: "Google-Link",
  };

  const collectedKeys = useMemo(() => {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const node of nodes) {
      const c = (node.data as any)?.collects;
      if (c && typeof c === "string" && c.trim() && c !== "__custom_empty__") {
        if (!seen.has(c)) {
          seen.add(c);
          keys.push(c);
        }
      }
    }
    return keys;
  }, [nodes]);

  const uncoveredRequired = useMemo(
    () => requiredFields.filter((f) => !collectedKeys.includes(f)),
    [requiredFields, collectedKeys],
  );

  const isReadyToActivate = useMemo(
    () => lintWarnings.length === 0 && uncoveredRequired.length === 0,
    [lintWarnings, uncoveredRequired],
  );

  const handleToggleFlowType = (newType: "reservation" | "custom") => {
    if (newType === outputType) return;
    if (newType === "custom") {
      const confirmed = window.confirm(
        "Wenn du auf Freier Flow wechselst, wird die automatische Kalender-Buchung für diesen Flow deaktiviert. Fortfahren?"
      );
      if (!confirmed) return;
    }
    const newRequiredFields =
      newType === "reservation"
        ? (vertical === "gastro" || !vertical ? ["name", "date", "time", "guestCount"] : ["name", "date", "time"])
        : [];
    setMetadata((prev) => ({
      ...prev,
      output_config: { type: newType, requiredFields: newRequiredFields } as FlowOutputConfig,
    }));
    setHasUnsavedChanges(true);
  };

  const handleToggleRequiredField = (field: string) => {
    const current = requiredFields;
    const next = current.includes(field) ? current.filter((f) => f !== field) : [...current, field];
    setMetadata((prev) => ({
      ...prev,
      output_config: { ...((prev.output_config as FlowOutputConfig) ?? {}), requiredFields: next } as FlowOutputConfig,
    }));
    setHasUnsavedChanges(true);
  };

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

  const handleOpenInspector = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setInspectorOpen(true);
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

  // Open inspector when node or edge is selected — only in canvas (pro) mode
  // In simple/list mode the inspector opens only via the explicit Inspect button
  useEffect(() => {
    if (builderMode === "pro" && (selectedNodeId || selectedEdgeId)) {
      setInspectorOpen(true);
    }
  }, [builderMode, selectedNodeId, selectedEdgeId]);

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

  const addNode = useCallback((type: "message" | "choice" | "link" | "info", presetLabel?: string) => {
    const id = uuid();
    const { posX, posY, currentZoom } = getNewNodePosition();

    const defaultLabels: Record<string, string> = {
      message: "Neue Nachricht",
      choice: "Auswahl",
      link: "URL / Link",
      info: "Info-Nachricht",
    };
    const nodeLabel = presetLabel ?? defaultLabels[type] ?? "Neuer Knoten";

    const newNode: Node = {
      id,
      type: "wesponde",
      position: { x: posX, y: posY },
      data: {
        label: nodeLabel,
        text: nodeLabel,
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
    setTriggerTestInput("");
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
            {/* Left: Flow Name + Flow-Type Badge */}
            <div className="flex items-center gap-3">
              <input
                value={flowName}
                onChange={(event) => setFlowName(event.target.value)}
                className="font-display text-2xl font-semibold text-white bg-transparent focus:outline-none focus:ring-0 border-0 p-0"
                style={{ minWidth: '200px' }}
              />
              <button
                onClick={() => setShowFlowSettings(!showFlowSettings)}
                title="Flow-Einstellungen"
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                  outputType === "reservation"
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:border-indigo-500/50"
                    : "border-violet-500/30 bg-violet-500/10 text-violet-400 hover:border-violet-500/50"
                }`}
              >
                {outputType === "reservation"
                  ? <CalendarCheck className="h-3.5 w-3.5" />
                  : <Zap className="h-3.5 w-3.5" />}
                {outputType === "reservation" ? "Buchungs-Flow" : "Freier Flow"}
              </button>
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
                onClick={() => {
                  if (status === "Aktiv") {
                    setStatus("Entwurf");
                  } else if (!isReadyToActivate) {
                    setShowActivationModal(true);
                  } else {
                    setStatus("Aktiv");
                  }
                }}
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

          {/* Flow Settings Panel */}
          {showFlowSettings && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-start gap-8">
                {/* Flow-Typ */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Flow-Typ</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleFlowType("reservation")}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        outputType === "reservation"
                          ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      Buchungs-Flow
                    </button>
                    <button
                      onClick={() => handleToggleFlowType("custom")}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        outputType === "custom"
                          ? "border-violet-500 bg-violet-500/20 text-violet-300"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Freier Flow
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {outputType === "reservation"
                      ? "Erstellt automatisch Buchungen wenn alle Pflichtfelder vorliegen."
                      : "Keine automatische Buchung — freie Konversation."}
                  </p>
                </div>

                {/* Required Fields — only for reservation */}
                {outputType === "reservation" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pflichtfelder</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "name", label: "Name" },
                        { key: "date", label: "Datum" },
                        { key: "time", label: "Uhrzeit" },
                        { key: "guestCount", label: labels.participantsCountLabel },
                        { key: "phone", label: "Telefon" },
                        { key: "email", label: "E-Mail" },
                      ].map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => handleToggleRequiredField(key)}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                            requiredFields.includes(key)
                              ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                              : "border-white/10 bg-white/5 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${requiredFields.includes(key) ? "bg-indigo-400" : "bg-zinc-600"}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">
                      Blau = Pflichtfeld. Buchung wird erst erstellt wenn alle Pflichtfelder vorliegen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        {/* Toolbar */}
        <div className="mx-auto max-w-screen-2xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
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

        {/* Flow Cockpit */}
        {nodes.length > 0 && (
          <div className="mx-auto max-w-screen-2xl px-6 pb-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2.5 text-xs">
              {/* What this flow produces */}
              <div className="flex items-center gap-1.5">
                {outputType === "reservation"
                  ? <CalendarCheck className="h-3.5 w-3.5 text-indigo-400" />
                  : <Zap className="h-3.5 w-3.5 text-violet-400" />}
                <span className="text-zinc-500">Erstellt:</span>
                <span className="font-semibold text-zinc-300">
                  {outputType === "reservation" ? "Buchung" : "Freie Konversation"}
                </span>
              </div>

              <div className="h-4 w-px bg-white/10 hidden sm:block" />

              {/* What it collects */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-500">Sammelt:</span>
                {collectedKeys.length > 0
                  ? collectedKeys.map((key) => (
                      <span
                        key={key}
                        className={`rounded-full border px-2 py-0.5 font-medium ${
                          requiredFields.includes(key)
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-white/10 bg-white/5 text-zinc-400"
                        }`}
                      >
                        {COLLECTS_LABELS[key] ?? key}
                      </span>
                    ))
                  : <span className="text-zinc-600 italic">nichts konfiguriert</span>}
              </div>

              {/* Missing required fields */}
              {uncoveredRequired.length > 0 && (
                <>
                  <div className="h-4 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      Fehlt: {uncoveredRequired.map((f) => COLLECTS_LABELS[f] ?? f).join(", ")}
                    </span>
                  </div>
                </>
              )}

              {/* Lint warnings summary */}
              {lintWarnings.length > 0 && (
                <>
                  <div className="h-4 w-px bg-white/10 hidden sm:block" />
                  <button
                    onClick={() => setCockpitIssuesExpanded((v) => !v)}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <TriangleAlert className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {lintWarnings.length} Problem{lintWarnings.length !== 1 ? "e" : ""}
                    </span>
                    <span className="text-amber-400/60 text-[10px]">
                      {cockpitIssuesExpanded ? "▲" : "▼"}
                    </span>
                  </button>
                </>
              )}

              {/* Ready indicator */}
              {isReadyToActivate && status === "Entwurf" && (
                <>
                  <div className="h-4 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="font-medium">Bereit zur Aktivierung</span>
                  </div>
                </>
              )}
            </div>

            {/* Expanded lint warnings */}
            {cockpitIssuesExpanded && lintWarnings.length > 0 && (
              <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                {lintWarnings.map((warning) => (
                  <div key={warning.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-300">{warning.message}</p>
                        {warning.suggestion && (
                          <p className="text-xs text-amber-300/60 mt-0.5">{warning.suggestion}</p>
                        )}
                      </div>
                    </div>
                    {warning.nodeId && (
                      <button
                        onClick={() => {
                          setSelectedNodeId(warning.nodeId!);
                          setCockpitIssuesExpanded(false);
                        }}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 whitespace-nowrap shrink-0 transition-colors"
                      >
                        Zum Schritt →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Canvas Area */}
        <div className="mx-auto max-w-screen-2xl px-6 pb-6">
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
              onSelectNode={setSelectedNodeId}
              onOpenInspector={handleOpenInspector}
              onAddNode={addNode}
              onDeleteNode={handleDeleteNode}
            />
          </div>

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

      </main>

      {/* Activation Ceremony Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                <TriangleAlert className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Flow aktivieren?</h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Einige Konfigurationspunkte sind noch nicht vollständig.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {lintWarnings.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <p className="text-xs text-amber-300">
                    {lintWarnings.length} Konfigurationswarnung{lintWarnings.length !== 1 ? "en" : ""}
                  </p>
                </div>
              )}
              {uncoveredRequired.map((field) => (
                <div key={field} className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <p className="text-xs text-amber-300">
                    Pflichtfeld <span className="font-semibold">{COLLECTS_LABELS[field] ?? field}</span> wird nicht gesammelt
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowActivationModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowActivationModal(false);
                  setStatus("Aktiv");
                }}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 transition-all"
              >
                Trotzdem aktivieren
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* Test Input */}
              <div>
                <label className="text-sm font-semibold text-zinc-300">Testen</label>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Würde eine Nachricht diesen Trigger auslösen?
                </p>
                <input
                  value={triggerTestInput}
                  onChange={(e) => setTriggerTestInput(e.target.value)}
                  placeholder='z.B. "Ich möchte gerne reservieren"'
                  className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
                {triggerTestInput.trim() && (
                  <div className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                    testTriggerMatch(triggerTestInput, triggerForm.config.keywords, triggerForm.config.matchType)
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  }`}>
                    {testTriggerMatch(triggerTestInput, triggerForm.config.keywords, triggerForm.config.matchType)
                      ? <><CheckCircle2 className="h-4 w-4 shrink-0" /> Würde diesen Flow auslösen</>
                      : <><X className="h-4 w-4 shrink-0" /> Würde diesen Flow NICHT auslösen</>
                    }
                  </div>
                )}
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
