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
  ChevronDown,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  ExternalLink,
  Focus,
  BookOpen,
  Info,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  Shapes,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  X,
  Zap,
} from "lucide-react";
import FlowBuilderCanvas from "./FlowBuilderCanvas";
import FlowBuilderGuide from "./FlowBuilderGuide";
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
type InspectorTab = "content" | "flow";
type EdgeTone = "neutral" | "positive" | "negative";
type BuilderMode = "simple" | "pro";
type InputMode = "buttons" | "free_text";

const BUILDER_SHELL_CLASS = "mx-auto w-full max-w-[1880px] px-3 xl:px-4 2xl:px-5";

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
  const [serverLintErrors, setServerLintErrors] = useState<FlowLintWarning[]>([]);
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
  const [editingTriggerId, setEditingTriggerId] = useState<string | null>(null);
  const [triggerForm, setTriggerForm] = useState<FlowTrigger | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [nodeSearchQuery, setNodeSearchQuery] = useState("");
  const [nodeSearchOpen, setNodeSearchOpen] = useState(false);
  const builderMode: BuilderMode = "simple";
  const [isInspectorOpen, setInspectorOpen] = useState(false);
  const [isImportExportMenuOpen, setImportExportMenuOpen] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [triggerTestInput, setTriggerTestInput] = useState("");
  const [cockpitIssuesExpanded, setCockpitIssuesExpanded] = useState(false);
  const [showFallbackInfo, setShowFallbackInfo] = useState(false);
  const [fallbackEnabled, setFallbackEnabled] = useState<boolean | null>(null);
  const [conflictWarnings, setConflictWarnings] = useState<Array<{ keyword: string; conflictingFlowName: string }>>([]);
  const [isAddMenuOpen, setAddMenuOpen] = useState(false);
  const [showPflichtfelderDropdown, setShowPflichtfelderDropdown] = useState(false);
  const [showCustomFieldInput, setShowCustomFieldInput] = useState(false);
  const [customFieldInput, setCustomFieldInput] = useState("");
  const [showBuilderGuide, setShowBuilderGuide] = useState(false);
  const { vertical } = useAccountVertical();
  const labels = getBookingLabels(vertical);
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");
  // Optimistic locking: tracks the server's updated_at that the client last saw
  const serverUpdatedAtRef = useRef<string>("");
  const importInputRef = useRef<HTMLInputElement>(null);
  const importExportMenuRef = useRef<HTMLDivElement>(null);

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
  const requiredFields = useMemo(
    () =>
      outputConfig?.requiredFields ??
      (outputType === "reservation" ? ["name", "date", "time"] : []),
    [outputConfig?.requiredFields, outputType],
  );

  const customFields = outputConfig?.customFields ?? [];

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
    ...Object.fromEntries(customFields.map((f) => [f.key, f.label])),
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
    const guestCountRequired = vertical === "gastro" || !vertical;
    const newRequiredFields =
      newType === "reservation"
        ? (guestCountRequired ? ["name", "date", "time", "guestCount"] : ["name", "date", "time"])
        : [];
    // When switching to reservation for non-gastro verticals, guestCount isn't required
    // but must still default to 1 so bookings are created correctly.
    const newDefaults =
      newType === "reservation" && !guestCountRequired ? { guestCount: 1 } : undefined;
    setMetadata((prev) => ({
      ...prev,
      output_config: {
        type: newType,
        requiredFields: newRequiredFields,
        ...(newDefaults ? { defaults: newDefaults } : {}),
      } as FlowOutputConfig,
    }));
    setHasUnsavedChanges(true);
  };

  const handleToggleRequiredField = (field: string) => {
    const isRemoving = requiredFields.includes(field);

    const FIELD_NODE_DEFAULTS: Record<string, { label: string; text: string }> = {
      name:            { label: "Name abfragen",             text: "Wie ist dein Name?" },
      date:            { label: "Datum abfragen",            text: "Wann möchtest du kommen?" },
      time:            { label: "Uhrzeit abfragen",          text: "Zu welcher Uhrzeit möchtest du kommen?" },
      guestCount:      { label: `${labels.participantsCountLabel} abfragen`, text: `Für wie viele Personen soll ich buchen?` },
      phone:           { label: "Telefonnummer abfragen",    text: "Wie lautet deine Telefonnummer?" },
      email:           { label: "E-Mail abfragen",           text: "Wie lautet deine E-Mail-Adresse?" },
      specialRequests: { label: "Sonderwünsche abfragen",    text: "Hast du besondere Wünsche oder Anmerkungen?" },
    };

    if (isRemoving) {
      const nodeToDelete = nodes.find((n) => (n.data as any)?.collects === field);
      if (nodeToDelete) {
        const fieldLabel = COLLECTS_LABELS[field] ?? field;
        const confirmed = window.confirm(
          `Die Node „${nodeToDelete.data?.label || fieldLabel}" sammelt das Pflichtfeld „${fieldLabel}" und wird beim Entfernen gelöscht. Trotzdem entfernen?`
        );
        if (!confirmed) return;
        setNodes((prev) => prev.filter((n) => n.id !== nodeToDelete.id));
        setEdges((prev) => prev.filter((e) => e.source !== nodeToDelete.id && e.target !== nodeToDelete.id));
      }
    } else {
      const defaults = FIELD_NODE_DEFAULTS[field];
      if (defaults) {
        const id = uuid();
        let posX = 200;
        let posY = 200;
        if (reactFlowInstance) {
          const vp = reactFlowInstance.getViewport();
          posX = (400 - vp.x) / vp.zoom + (nodes.length % 5) * 30;
          posY = (250 - vp.y) / vp.zoom + (nodes.length % 5) * 30;
        } else {
          posX = 200 + nodes.length * 30;
          posY = 200 + nodes.length * 30;
        }
        const newNode: Node = {
          id,
          type: "wesponde",
          position: { x: posX, y: posY },
          data: {
            label: defaults.label,
            text: defaults.text,
            variant: "message" as const,
            quickReplies: [],
            inputMode: "buttons",
            placeholder: "",
            collects: field,
          },
        };
        setNodes((prev) => [...prev, newNode]);
        setTimeout(() => {
          reactFlowInstance?.setCenter(posX + 110, posY + 50, {
            zoom: reactFlowInstance.getViewport().zoom,
            duration: 350,
          });
        }, 50);
      }
    }

    const next = isRemoving
      ? requiredFields.filter((f) => f !== field)
      : [...requiredFields, field];
    setMetadata((prev) => {
      const prevConfig = (prev.output_config as FlowOutputConfig) ?? {};
      const prevDefaults = { ...(prevConfig.defaults ?? {}) };
      // Auto-manage guestCount default: set to 1 when removed from required (so bookings
      // are still created with 1 person), clear the default when added back to required.
      if (field === "guestCount") {
        if (isRemoving) {
          prevDefaults.guestCount = 1;
        } else {
          delete prevDefaults.guestCount;
        }
      }
      const prevCustomFields = prevConfig.customFields ?? [];
      const nextCustomFields = isRemoving
        ? prevCustomFields.filter((f) => f.key !== field)
        : prevCustomFields;
      return {
        ...prev,
        output_config: {
          ...prevConfig,
          requiredFields: next,
          ...(Object.keys(prevDefaults).length > 0 ? { defaults: prevDefaults } : {}),
          ...(nextCustomFields.length > 0 ? { customFields: nextCustomFields } : {}),
        } as FlowOutputConfig,
      };
    });
    setHasUnsavedChanges(true);
  };

  const handleAddCustomField = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const key = "custom_" + trimmed.toLowerCase().replace(/[^a-z0-9äöüß]+/g, "_").replace(/^_|_$/g, "");

    if (requiredFields.includes(key) || customFields.some((f) => f.key === key)) return;

    const id = uuid();
    let posX = 200;
    let posY = 200;
    if (reactFlowInstance) {
      const vp = reactFlowInstance.getViewport();
      posX = (400 - vp.x) / vp.zoom + (nodes.length % 5) * 30;
      posY = (250 - vp.y) / vp.zoom + (nodes.length % 5) * 30;
    } else {
      posX = 200 + nodes.length * 30;
      posY = 200 + nodes.length * 30;
    }
    const newNode: Node = {
      id,
      type: "wesponde",
      position: { x: posX, y: posY },
      data: {
        label: `${trimmed} abfragen`,
        text: `Bitte gib dein/deine ${trimmed} ein.`,
        variant: "message" as const,
        quickReplies: [],
        inputMode: "free_text",
        placeholder: "",
        collects: key,
      },
    };
    setNodes((prev) => [...prev, newNode]);

    setMetadata((prev) => {
      const prevConfig = (prev.output_config as FlowOutputConfig) ?? {};
      return {
        ...prev,
        output_config: {
          ...prevConfig,
          requiredFields: [...(prevConfig.requiredFields ?? []), key],
          customFields: [...(prevConfig.customFields ?? []), { key, label: trimmed }],
        } as FlowOutputConfig,
      };
    });

    setCustomFieldInput("");
    setShowCustomFieldInput(false);
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
      serverUpdatedAtRef.current = data.updated_at ?? "";
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
      if (Array.isArray((data as any).conflict_warnings) && (data as any).conflict_warnings.length > 0) {
        setConflictWarnings((data as any).conflict_warnings);
      }
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
    if (!userId) return;
    async function fetchBotSettings() {
      const token = await getAccessToken();
      if (!token) return;
      try {
        const res = await fetch("/api/account/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFallbackEnabled(data.fallback_enabled !== false);
        }
      } catch {
        // non-critical — banner just won't show
      }
    }
    fetchBotSettings();
  }, [userId, getAccessToken]);

  useEffect(() => {
    setLintWarnings(lintFlow(nodes, edges, triggers, metadata).warnings);
  }, [nodes, edges, triggers, metadata]);


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

  const openTriggerEditor = useCallback(
    (trigger?: FlowTrigger) => {
      if (trigger) {
        setTriggerForm({
          ...trigger,
          config: {
            ...trigger.config,
            keywords: [...trigger.config.keywords],
          },
        });
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
    },
    [nodes],
  );

  const closeTriggerEditor = useCallback(() => {
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
    closeTriggerEditor();
  }, [triggerForm, editingTriggerId, closeTriggerEditor]);

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

  const updateTriggerKeywordInput = useCallback((value: string) => {
    setKeywordInput(value);
  }, []);

  const updateTriggerTestInput = useCallback((value: string) => {
    setTriggerTestInput(value);
  }, []);

  const updateTriggerMatchType = useCallback(
    (matchType: FlowTrigger["config"]["matchType"]) => {
      setTriggerForm((prev) =>
        prev
          ? {
              ...prev,
              config: {
                ...prev.config,
                matchType,
              },
            }
          : prev,
      );
    },
    [],
  );

  const updateTriggerStartNode = useCallback((startNodeId: string | null) => {
    setTriggerForm((prev) => (prev ? { ...prev, startNodeId } : prev));
  }, []);

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
          // Optimistic locking: only for manual saves (not background autosave)
          ...(!silent && serverUpdatedAtRef.current
            ? { expected_updated_at: serverUpdatedAtRef.current }
            : {}),
        }),
      });
      if (response.ok) {
        try {
          const responseData = await response.json();
          // Track the new server timestamp for the next save
          if (responseData.updated_at) {
            serverUpdatedAtRef.current = responseData.updated_at;
          }
          // Show cross-flow keyword conflict warnings if any (non-blocking)
          if (responseData.conflict_warnings?.length > 0) {
            setConflictWarnings(responseData.conflict_warnings);
          } else {
            setConflictWarnings([]);
          }
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
      } else if (response.status === 409) {
        // Concurrent edit detected — show permanent error until user reloads
        setErrorMessage(
          "⚠️ Dieser Flow wurde in einem anderen Tab geändert. Bitte lade die Seite neu, bevor du weiter speicherst.",
        );
        setSaveState("error");
        // Don't auto-clear — user must consciously reload
      } else if (response.status === 422) {
        const error = await response.json().catch(() => ({}));
        if (error.code === "LINT_FAILED") {
          // Server blocked activation due to lint errors — revert status and surface warnings
          setStatus("Entwurf");
          const warnings: FlowLintWarning[] = Array.isArray(error.warnings) ? error.warnings : [];
          setServerLintErrors(warnings);
          setCockpitIssuesExpanded(true);
        } else {
          setErrorMessage(error.error ?? "Ungültige Anfrage");
        }
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 4000);
      } else if (response.status === 403) {
        const error = await response.json().catch(() => ({}));
        if (error.code === "PLAN_LIMIT_EXCEEDED") {
          // Revert local status to Entwurf — activation was rejected by the server
          setStatus("Entwurf");
        }
        setErrorMessage(error.error ?? "Nicht autorisiert");
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 6000);
      } else {
        const error = await response.json().catch(() => ({}));
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

  const handleImport = useCallback(async (file: File) => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported.nodes) || !Array.isArray(imported.edges)) {
        setErrorMessage("Ungültige Flow-Datei. Bitte eine gültige Wesponde-Flow-JSON-Datei wählen.");
        return;
      }
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: `${imported.name ?? "Importierter Flow"} (Import)`,
          nodes: imported.nodes ?? [],
          edges: imported.edges ?? [],
          triggers: imported.triggers ?? [],
          metadata: imported.metadata ?? {},
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setErrorMessage(err.error ?? "Import fehlgeschlagen.");
        return;
      }
      const { id } = await response.json();
      router.push(`/app/flows/${id}`);
    } catch {
      setErrorMessage("Ungültige Flow-Datei. Bitte eine gültige Wesponde-Flow-JSON-Datei wählen.");
    }
  }, [getAccessToken, router]);

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
    function handleClickOutside(event: MouseEvent) {
      if (
        isImportExportMenuOpen &&
        importExportMenuRef.current &&
        !importExportMenuRef.current.contains(event.target as HTMLElement)
      ) {
        setImportExportMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isImportExportMenuOpen]);

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
          setInspectorTab("content");
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
      <div className="app-shell flex min-h-[60vh] items-center justify-center">
        <div className="app-panel p-10 text-center">
          <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-[#2563EB] border-t-transparent" />
          <p className="mt-4 text-sm text-[#475569]">Flow wird geladen...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="app-shell flex min-h-[60vh] items-center justify-center">
        <div className="app-panel max-w-md border-[#FECACA] bg-[#FEF2F2] p-10 text-center">
          <TriangleAlert className="mx-auto h-12 w-12 text-[#DC2626]" />
          <p className="mt-4 text-sm text-[#B91C1C]">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell app-page-enter relative min-h-screen pb-6">
      <header className="sticky top-0 z-20 bg-[var(--app-bg-base)]/90 backdrop-blur-sm">
        <div className={`${BUILDER_SHELL_CLASS} py-4`}>
          <div className="rounded-[22px] border border-[#E2E8F0] bg-white px-6 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
            <div className="flex flex-wrap items-center justify-between gap-5">
              <div className="flex min-w-0 flex-1 items-center gap-4 pr-6">
                <input
                  value={flowName}
                  onChange={(event) => setFlowName(event.target.value)}
                  className="w-full min-w-0 border-0 bg-transparent p-0 text-[2rem] font-semibold leading-tight text-[#0F172A] focus:outline-none focus:ring-0"
                  style={{ minWidth: '280px' }}
                />
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3.5">
                <div ref={importExportMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setNodeSearchOpen(false);
                      setImportExportMenuOpen((current) => !current);
                    }}
                    title="Import und Export"
                    aria-label="Import und Export"
                    aria-haspopup="menu"
                    aria-expanded={isImportExportMenuOpen}
                    className={`rounded-2xl border p-3 transition-colors ${
                      isImportExportMenuOpen
                        ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                        : "border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    }`}
                  >
                    <Download className="h-5.5 w-5.5" />
                  </button>
                  {isImportExportMenuOpen && (
                    <div
                      role="menu"
                      className="animate-scale-in absolute right-0 top-16 z-30 w-52 rounded-2xl border border-[#E2E8F0] bg-white p-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setImportExportMenuOpen(false);
                          handleExport();
                        }}
                        disabled={exporting || loading}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[15px] font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download className="h-4.5 w-4.5" />
                        {exporting ? "Exportiere..." : "Export"}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setImportExportMenuOpen(false);
                          importInputRef.current?.click();
                        }}
                        disabled={loading}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[15px] font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Upload className="h-4.5 w-4.5" />
                        Import
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file);
                    e.target.value = "";
                  }}
                />

              <button
                type="button"
                onClick={() => setShowBuilderGuide(true)}
                title="Flow Builder Guide"
                aria-label="Flow Builder Guide öffnen"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E2E8F0] px-4 py-2.5 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#EFF6FF] hover:border-[#BFDBFE] hover:text-[#2450b2]"
              >
                <BookOpen className="h-4 w-4" />
                <span>Guide</span>
              </button>

              <button
                onClick={() => {
                  setInspectorTab("content");
                  setInspectorOpen(true);
                }}
                title="Flow Preview"
                aria-label="Flow Preview"
                className={`rounded-2xl p-3 transition-colors ${
                  isInspectorOpen && inspectorTab === "content"
                    ? "bg-[#DBEAFE] text-[#2563EB]"
                    : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                }`}
              >
                <Eye className="h-5.5 w-5.5" />
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={status === "Aktiv"}
                  onClick={() => {
                    if (status === "Aktiv") {
                      setStatus("Entwurf");
                    } else if (!isReadyToActivate) {
                      setShowActivationModal(true);
                    } else {
                      setStatus("Aktiv");
                    }
                  }}
                  className={[
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] focus-visible:ring-offset-2",
                    status === "Aktiv" ? "bg-[#1E4FD8]" : "bg-[#CBD5E1]",
                  ].join(" ")}
                  title={status === "Aktiv" ? "Aktiv – klicken zum Deaktivieren" : "Entwurf – klicken zum Aktivieren"}
                >
                  <span
                    className={[
                      "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      status === "Aktiv" ? "translate-x-5" : "translate-x-0",
                    ].join(" ")}
                  />
                </button>
                <span
                  className={[
                    "text-[14px] font-medium",
                    status === "Aktiv" ? "text-[#1E4FD8]" : "text-[#94A3B8]",
                  ].join(" ")}
                >
                  {status}
                </span>
              </div>
              <button
                onClick={() => handleSave()}
                className="rounded-full bg-[#2450b2] px-7 py-3 text-base font-semibold text-white shadow-[0_6px_22px_rgba(36,80,178,0.28)] transition-all hover:bg-[#1a46c4]"
                disabled={saveState === "saving"}
              >
                {saveState === "saving"
                  ? "Speichert..."
                  : saveState === "saved"
                  ? "Gespeichert"
                  : "Speichern"}
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    setImportExportMenuOpen(false);
                    setNodeSearchOpen(!nodeSearchOpen);
                  }}
                  title="Schritte suchen"
                  aria-label="Schritte suchen"
                  className={`inline-flex items-center gap-2.5 rounded-xl border px-5 py-3 text-[15px] font-medium transition-colors ${
                    nodeSearchOpen
                      ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <Search className="h-5 w-5" />
                  <span>Suchen</span>
                </button>
                {nodeSearchOpen && (
                  <div className="animate-scale-in absolute right-0 top-16 z-30 w-80 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                    <input
                      type="text"
                      placeholder="Schritt suchen..."
                      value={nodeSearchQuery}
                      onChange={(e) => setNodeSearchQuery(e.target.value)}
                      className="app-input px-4 py-3 text-[15px] text-[#0F172A] placeholder:text-[#94A3B8]"
                      autoFocus
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
                        {searchResults.map((node) => (
                          <button
                            key={node.id}
                            onClick={() => jumpToNode(node.id)}
                            className="flex w-full items-start gap-2.5 rounded-xl px-3.5 py-3 text-left text-[15px] transition-colors hover:bg-[#F8FAFC]"
                          >
                            <Focus className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#94A3B8]" />
                            <div>
                              <p className="font-semibold text-[#0F172A]">{node.data?.label || "Ohne Titel"}</p>
                              <p className="line-clamp-1 text-[13px] text-[#64748B]">{node.data?.text || ""}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {nodeSearchQuery && searchResults.length === 0 && (
                      <p className="mt-2 text-center text-sm text-[#64748B]">Keine Ergebnisse</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>

          </div>
        </div>
      </header>

      <main className="relative">
        {nodes.length > 0 && (
          <div className={`${BUILDER_SHELL_CLASS} pb-4`}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[22px] border border-[#E2E8F0] bg-white px-6 py-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">

              {/* Flow-Typ: inline segmented control */}
              <div className="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
                <button
                  onClick={() => handleToggleFlowType("reservation")}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[14px] font-semibold transition-all ${
                    outputType === "reservation"
                      ? "bg-white text-[#2563EB] shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <CalendarCheck className="h-4 w-4" />
                  Buchung
                </button>
                <button
                  onClick={() => handleToggleFlowType("custom")}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[14px] font-semibold transition-all ${
                    outputType === "custom"
                      ? "bg-white text-[#7C3AED] shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  Freier Flow
                </button>
              </div>

              {/* Pflichtfelder dropdown — nur bei Buchungs-Flow */}
              {outputType === "reservation" && (
                <>
                  <div className="h-5 w-px bg-[#E2E8F0]" />
                  <div className="relative">
                    <button
                      onClick={() => setShowPflichtfelderDropdown((v) => !v)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-[14px] font-semibold transition-all ${
                        showPflichtfelderDropdown
                          ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                          : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#BFDBFE] hover:text-[#2563EB]"
                      }`}
                    >
                      Pflichtfelder
                      {requiredFields.length > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#2563EB] px-1 text-[11px] font-bold text-white">
                          {requiredFields.length}
                        </span>
                      )}
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showPflichtfelderDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {showPflichtfelderDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => { setShowPflichtfelderDropdown(false); setShowCustomFieldInput(false); setCustomFieldInput(""); }} />
                        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
                          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                            Pflichtfelder aktivieren
                          </p>
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
                                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-all ${
                                  requiredFields.includes(key)
                                    ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]"
                                    : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:border-[#BFDBFE] hover:text-[#2563EB]"
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${requiredFields.includes(key) ? "bg-[#2563EB]" : "bg-[#CBD5E1]"}`} />
                                {label}
                                {key === "guestCount" && !requiredFields.includes(key) && (
                                  <span className="text-[11px] text-[#94A3B8]">Standard: 1</span>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Custom fields */}
                          {customFields.length > 0 && (
                            <>
                              <div className="my-3 h-px bg-[#F1F5F9]" />
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                Eigene Felder
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {customFields.map(({ key, label: cfLabel }) => (
                                  <span
                                    key={key}
                                    className="flex items-center gap-1.5 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-[13px] font-medium text-[#2563EB]"
                                  >
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                                    {cfLabel}
                                    <button
                                      onClick={() => {
                                        const nodeToDelete = nodes.find((n) => (n.data as any)?.collects === key);
                                        if (nodeToDelete) {
                                          const confirmed = window.confirm(
                                            `Die Node „${nodeToDelete.data?.label || cfLabel}" sammelt das Pflichtfeld „${cfLabel}" und wird beim Entfernen gelöscht. Trotzdem entfernen?`
                                          );
                                          if (!confirmed) return;
                                          setNodes((prev) => prev.filter((n) => n.id !== nodeToDelete.id));
                                          setEdges((prev) => prev.filter((e) => e.source !== nodeToDelete.id && e.target !== nodeToDelete.id));
                                        }
                                        setMetadata((prev) => {
                                          const prevConfig = (prev.output_config as FlowOutputConfig) ?? {};
                                          return {
                                            ...prev,
                                            output_config: {
                                              ...prevConfig,
                                              requiredFields: (prevConfig.requiredFields ?? []).filter((r) => r !== key),
                                              customFields: (prevConfig.customFields ?? []).filter((f) => f.key !== key),
                                            } as FlowOutputConfig,
                                          };
                                        });
                                        setHasUnsavedChanges(true);
                                      }}
                                      className="ml-0.5 rounded p-0.5 transition-colors hover:bg-[#BFDBFE]"
                                    >
                                      <X className="h-3 w-3 opacity-60" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Add custom field */}
                          {showCustomFieldInput ? (
                            <div className="mt-3 flex gap-2">
                              <input
                                autoFocus
                                value={customFieldInput}
                                onChange={(e) => setCustomFieldInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddCustomField(customFieldInput);
                                  if (e.key === "Escape") { setShowCustomFieldInput(false); setCustomFieldInput(""); }
                                }}
                                placeholder="z. B. Allergien"
                                maxLength={40}
                                className="min-w-0 flex-1 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-[13px] text-[#1E293B] placeholder-[#CBD5E1] focus:border-[#BFDBFE] focus:outline-none focus:ring-2 focus:ring-[#BFDBFE]/40"
                              />
                              <button
                                onClick={() => handleAddCustomField(customFieldInput)}
                                className="rounded-xl bg-[#2563EB] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowCustomFieldInput(true)}
                              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#BFDBFE] bg-[#F8FBFF] px-3 py-2 text-[12px] font-medium text-[#2563EB] transition-all hover:border-[#93C5FD] hover:bg-[#EFF6FF]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Eigenes Feld hinzufügen
                            </button>
                          )}

                          <p className="mt-3 text-[11px] text-[#94A3B8]">
                            Buchung wird erst erstellt wenn alle aktiven Felder gesammelt wurden.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {uncoveredRequired.length > 0 && (
                <>
                  <div className="h-5 w-px bg-[#E2E8F0]" />
                  <div className="flex items-center gap-2 text-[#B45309]">
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    <span className="text-[14px] font-medium">
                      Fehlt: {uncoveredRequired.map((f) => COLLECTS_LABELS[f] ?? f).join(", ")}
                    </span>
                  </div>
                </>
              )}

              {lintWarnings.length > 0 && (
                <>
                  <div className="h-5 w-px bg-[#E2E8F0]" />
                  <button
                    onClick={() => setCockpitIssuesExpanded((v) => !v)}
                    className="flex items-center gap-2 text-[#B45309] transition-colors hover:text-[#92400E]"
                  >
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    <span className="text-[14px] font-medium">
                      {lintWarnings.length} Problem{lintWarnings.length !== 1 ? "e" : ""}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${cockpitIssuesExpanded ? "rotate-180" : ""}`} />
                  </button>
                </>
              )}

              {isReadyToActivate && status === "Entwurf" && (
                <>
                  <div className="h-5 w-px bg-[#E2E8F0]" />
                  <div className="flex items-center gap-2 text-[#047857]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="text-[14px] font-medium">Bereit zur Aktivierung</span>
                  </div>
                </>
              )}

              {fallbackEnabled !== null && (
                <>
                  <div className="h-5 w-px bg-[#E2E8F0]" />
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => router.push("/app/settings")}
                      className="flex items-center gap-2 text-[#64748B] transition-colors hover:text-[#0F172A]"
                      title="Fallback-Einstellungen öffnen"
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${fallbackEnabled ? "bg-[#10B981]" : "bg-[#94A3B8]"}`} />
                      <span className="text-[14px]">Fallback {fallbackEnabled ? "aktiv" : "deaktiviert"}</span>
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowFallbackInfo((v) => !v)}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#2450b2]"
                        aria-label="Was ist der Fallback?"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                      {showFallbackInfo && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowFallbackInfo(false)} />
                          <div className="absolute left-1/2 top-full z-50 mt-2 w-[280px] -translate-x-1/2 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_8px_32px_rgba(15,23,42,0.12)]">
                            <div className="absolute -top-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-l border-t border-[#E2E8F0] bg-white" />
                            <p className="text-[13px] font-semibold text-[#0F172A]">Was ist der Fallback?</p>
                            <p className="mt-1.5 text-[13px] leading-relaxed text-[#475569]">
                              Wenn eine Nachricht keinen aktiven Flow auslöst, antwortet Wesponde automatisch mit deiner Fallback-Nachricht — z. B. einem freundlichen Hinweis oder einer Kontaktalternative.
                            </p>
                            <p className="mt-2 text-[13px] leading-relaxed text-[#475569]">
                              Den Text kannst du in den <button onClick={() => { setShowFallbackInfo(false); router.push("/app/settings"); }} className="font-semibold text-[#2450b2] underline-offset-2 hover:underline">Einstellungen</button> anpassen.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>

            {conflictWarnings.length > 0 && status === "Aktiv" && (
              <div className="mt-2 rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D97706]" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#B45309]">Keyword-Konflikt mit anderen aktiven Flows</p>
                      <p className="mt-0.5 text-xs text-[#B45309]/70">
                        Folgende Keywords existieren auch in anderen aktiven Flows. Bei Gleichstand gewinnt der zuletzt bearbeitete Flow.
                      </p>
                      <ul className="mt-1.5 space-y-0.5">
                        {conflictWarnings.map((c, i) => (
                          <li key={i} className="text-xs text-[#B45309]/85">
                            <span className="rounded bg-[#FEF3C7] px-1 font-mono">{c.keyword}</span>
                            {" "}→ auch in <span className="font-semibold">{c.conflictingFlowName}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => setConflictWarnings([])}
                    className="shrink-0 text-xs leading-none text-[#B45309]/60 transition-colors hover:text-[#92400E]"
                    title="Schließen"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {cockpitIssuesExpanded && lintWarnings.length > 0 && (
              <div className="mt-2 space-y-2 rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-3">
                {lintWarnings.map((warning) => (
                  <div key={warning.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D97706]" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#B45309]">{warning.message}</p>
                        {warning.suggestion && (
                          <p className="mt-0.5 text-xs text-[#B45309]/70">{warning.suggestion}</p>
                        )}
                      </div>
                    </div>
                    {warning.nodeId && (
                      <button
                        onClick={() => {
                          setSelectedNodeId(warning.nodeId!);
                          setCockpitIssuesExpanded(false);
                        }}
                        className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#B45309] transition-colors hover:text-[#92400E]"
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

        <div className={`${BUILDER_SHELL_CLASS} pb-6`}>
          {builderMode === "simple" ? (
            <div className="app-panel h-[calc(100vh-220px)] min-h-[560px] overflow-y-auto px-8 py-6 xl:px-10 xl:py-6">
              <FlowListBuilder
                nodes={nodes}
                edges={edges}
                startNodeIds={startNodeIds}
                triggers={triggers}
                triggerForm={triggerForm}
                editingTriggerId={editingTriggerId}
                keywordInput={keywordInput}
                triggerTestInput={triggerTestInput}
                onOpenTriggerEditor={openTriggerEditor}
                onCloseTriggerEditor={closeTriggerEditor}
                onSaveTrigger={saveTrigger}
                onDeleteTrigger={deleteTrigger}
                onKeywordInputChange={updateTriggerKeywordInput}
                onTriggerTestInputChange={updateTriggerTestInput}
                onAddKeyword={addKeywordToTrigger}
                onRemoveKeyword={removeKeywordFromTrigger}
                onTriggerMatchTypeChange={updateTriggerMatchType}
                onTriggerStartNodeChange={updateTriggerStartNode}
                onNodesChange={handleListNodesChange}
                onEdgesChange={handleListEdgesChange}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onOpenInspector={handleOpenInspector}
                onAddNode={addNode}
                onDeleteNode={handleDeleteNode}
              />
            </div>
          ) : (
            <div className="relative">
              {selection.nodes.length > 1 && (
                <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white/95 px-4 py-2.5 shadow-[0_18px_36px_rgba(15,23,42,0.14)] backdrop-blur-sm">
                  <span className="text-sm font-semibold text-[#0F172A]">
                    {selection.nodes.length} Schritte ausgewählt
                  </span>
                  <div className="h-4 w-px bg-[#E2E8F0]" />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#0F172A] transition-colors hover:bg-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Kopieren
                  </button>
                  <button
                    onClick={deleteSelection}
                    className="flex items-center gap-1.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-xs font-medium text-[#DC2626] transition-colors hover:bg-[#FEE2E2]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Löschen
                  </button>
                  <div className="h-4 w-px bg-[#E2E8F0]" />
                  <span className="text-xs text-[#64748B]">oder ⌫ Delete</span>
                </div>
              )}
              <FlowBuilderCanvas
                nodes={displayNodes}
                edges={decoratedEdges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                onNodeDoubleClick={(_, node) => {
                  setSelectedNodeId(node.id);
                  setInspectorOpen(true);
                }}
                onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
                onSelectionChange={handleSelectionChange}
                onInit={setReactFlowInstance}
                onFitView={() => reactFlowInstance?.fitView({ padding: 0.2, duration: 600 })}
              />
            </div>
          )}

          {inlineEditNodeId && (
            <div className="animate-scale-in absolute bottom-10 right-10 w-72 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                Inline bearbeiten
              </p>
              <input
                className="app-input mt-2 px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
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
                  className="flex-1 rounded-full bg-[#2450b2] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.16)] transition-all hover:bg-[#1a46c4]"
                >
                  Speichern
                </button>
                <button
                  onClick={() => setInlineEditNodeId(null)}
                  className="flex-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[#475569] transition-colors hover:bg-white hover:text-[#0F172A]"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

      </main>

      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFFBEB]">
                <TriangleAlert className="h-5 w-5 text-[#D97706]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A]">Flow aktivieren?</h3>
                <p className="mt-1 text-sm text-[#475569]">
                  Einige Konfigurationspunkte sind noch nicht vollständig.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {lintWarnings.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-3 py-2">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-[#D97706]" />
                  <p className="text-xs text-[#B45309]">
                    {lintWarnings.length} Konfigurationswarnung{lintWarnings.length !== 1 ? "en" : ""}
                  </p>
                </div>
              )}
              {uncoveredRequired.map((field) => (
                <div key={field} className="flex items-center gap-2 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-3 py-2">
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-[#D97706]" />
                  <p className="text-xs text-[#B45309]">
                    Pflichtfeld <span className="font-semibold">{COLLECTS_LABELS[field] ?? field}</span> wird nicht gesammelt
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowActivationModal(false)}
                className="flex-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm font-medium text-[#475569] transition-colors hover:bg-white hover:text-[#0F172A]"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowActivationModal(false);
                  setStatus("Aktiv");
                }}
                className="flex-1 rounded-md bg-[#10B981] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#059669]"
              >
                Trotzdem aktivieren
              </button>
            </div>
          </div>
        </div>
      )}

      {serverLintErrors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
          <div className="animate-scale-in w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF2F2]">
                <TriangleAlert className="h-5 w-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#0F172A]">Flow kann nicht aktiviert werden</h3>
                <p className="mt-1 text-sm text-[#475569]">
                  Der Server hat die Aktivierung abgewiesen. Bitte behebe die folgenden Probleme zuerst.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {serverLintErrors.map((w, i) => (
                <div key={i} className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5">
                  <p className="text-xs font-semibold text-[#DC2626]">{w.message}</p>
                  {w.suggestion && (
                    <p className="mt-0.5 text-xs text-[#B91C1C]/70">{w.suggestion}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setServerLintErrors([])}
                className="w-full rounded-md bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E293B]"
              >
                Verstanden — Flow bearbeiten
              </button>
            </div>
          </div>
        </div>
      )}

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
        outputType={outputType}
        requiredFields={requiredFields}
        onToggleFlowType={handleToggleFlowType}
        onToggleRequiredField={handleToggleRequiredField}
        saveState={saveState}
      />

      {/* Click outside to close add menu */}
      {isAddMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setAddMenuOpen(false)}
        />
      )}

      {/* Flow Builder Guide */}
      {showBuilderGuide && (
        <FlowBuilderGuide onClose={() => setShowBuilderGuide(false)} />
      )}
    </div>
  );
}
