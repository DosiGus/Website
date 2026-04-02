'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Node, Edge } from "reactflow";
import {
  ArrowDown,
  ChevronRight,
  Eye,
  Flag,
  GripVertical,
  Keyboard,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  X,
  ArrowRight,
  Check,
  AlertCircle,
  Zap,
} from "lucide-react";
import FlowSimulator from "./FlowSimulator";
import type { FlowQuickReply, FlowTrigger } from "../../lib/flowTypes";
import useAccountVertical from "../../lib/useAccountVertical";
import { getBookingLabels, type BookingLabels } from "../../lib/verticals";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type FlowListBuilderProps = {
  nodes: Node[];
  edges: Edge[];
  startNodeIds: Set<string>;
  triggers: FlowTrigger[];
  triggerForm: FlowTrigger | null;
  editingTriggerId: string | null;
  keywordInput: string;
  triggerTestInput: string;
  onOpenTriggerEditor: (trigger?: FlowTrigger) => void;
  onCloseTriggerEditor: () => void;
  onSaveTrigger: () => void;
  onDeleteTrigger: (id: string) => void;
  onKeywordInputChange: (value: string) => void;
  onTriggerTestInputChange: (value: string) => void;
  onAddKeyword: () => void;
  onRemoveKeyword: (keyword: string) => void;
  onTriggerMatchTypeChange: (matchType: FlowTrigger["config"]["matchType"]) => void;
  onTriggerStartNodeChange: (nodeId: string | null) => void;
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onOpenInspector: (nodeId: string) => void;
  onAddNode: (type: "message" | "choice", label?: string) => void;
  onDeleteNode: (nodeId: string) => void;
};

// ---------------------------------------------------------------------------
// Drag-and-drop infrastructure
// ---------------------------------------------------------------------------

/** Passes useSortable listeners/attributes down without prop drilling */
const DragHandleCtx = createContext<{
  listeners: ReturnType<typeof useSortable>["listeners"];
  attributes: ReturnType<typeof useSortable>["attributes"] | undefined;
}>({ listeners: undefined, attributes: undefined });

/** Wraps a single node row in sortable behaviour. Restricts movement to vertical axis. */
function SortableNodeWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <DragHandleCtx.Provider value={{ listeners, attributes }}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(
            transform ? { ...transform, x: 0 } : transform,
          ),
          transition,
          zIndex: isDragging ? 10 : undefined,
        }}
        className={isDragging ? "opacity-40" : undefined}
      >
        {children}
      </div>
    </DragHandleCtx.Provider>
  );
}

/** Invisible-until-hover grip handle; must be rendered inside a SortableNodeWrapper */
function NodeDragHandle() {
  const { listeners, attributes } = useContext(DragHandleCtx);
  return (
    <button
      type="button"
      {...listeners}
      {...attributes}
      onClick={e => e.stopPropagation()}
      className="cursor-grab rounded-lg p-2 text-[#CBD5E1] transition-colors hover:bg-[#F1F5F9] hover:text-[#64748B] active:cursor-grabbing"
      title="Reihenfolge per Drag ändern"
    >
      <GripVertical className="h-4.5 w-4.5" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Build a linear flow order starting from trigger nodes
function buildFlowOrder(nodes: Node[], edges: Edge[], startNodeIds: Set<string>): Node[] {
  if (nodes.length === 0) return [];

  const ordered: Node[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build adjacency list
  const adjacency = new Map<string, string[]>();
  edges.forEach(edge => {
    const targets = adjacency.get(edge.source) || [];
    if (!targets.includes(edge.target)) {
      targets.push(edge.target);
    }
    adjacency.set(edge.source, targets);
  });

  // BFS from start nodes
  const queue: string[] = [];

  // Add start nodes first
  startNodeIds.forEach(id => {
    if (nodeMap.has(id) && !visited.has(id)) {
      queue.push(id);
      visited.add(id);
    }
  });

  // If no start nodes, start from first node
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    visited.add(nodes[0].id);
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      ordered.push(node);
    }

    // Add children
    const children = adjacency.get(nodeId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push(childId);
      }
    });
  }

  // Add any unvisited nodes at the end
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  });

  return ordered;
}

const deriveInputMode = (node: Node, edges: Edge[]) => {
  const configured = (node.data as any)?.inputMode as "buttons" | "free_text" | undefined;
  if (configured) return configured;
  const quickReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
  if (quickReplies.length > 0) return "buttons";
  const hasFreeTextEdge = edges.some(
    (edge) => edge.source === node.id && !(edge.data as any)?.quickReplyId,
  );
  return hasFreeTextEdge ? "free_text" : "buttons";
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

const buildFreeTextDefaults = (label: string | undefined, labels: BookingLabels) => {
  const lower = (label ?? "").toLowerCase();
  if (lower.includes("datum")) {
    return { text: "Bitte gib dein Wunschdatum ein.", collects: "date", placeholder: "z. B. 14. Februar" };
  }
  if (lower.includes("uhr") || lower.includes("zeit")) {
    return { text: "Bitte gib deine Wunschzeit ein.", collects: "time", placeholder: "z. B. 18:30" };
  }
  if (lower.includes("name")) {
    return { text: "Wie lautet dein Name?", collects: "name", placeholder: "z. B. Maria" };
  }
  if (lower.includes("telefon") || lower.includes("phone")) {
    return { text: "Wie lautet deine Telefonnummer?", collects: "phone", placeholder: "z. B. 0176 12345678" };
  }
  if (lower.includes("mail")) {
    return { text: "Wie lautet deine E-Mail-Adresse?", collects: "email", placeholder: "z. B. maria@example.com" };
  }
  if (lower.includes("person") || lower.includes("gäste") || lower.includes("gast")) {
    return { text: `Für wie viele ${labels.participantsLabel.toLowerCase()}?`, collects: "guestCount", placeholder: "z. B. 4" };
  }
  return { text: "Bitte gib deine Antwort ein.", collects: "", placeholder: "Antwort eingeben..." };
};

const getCollectsLabels = (labels: BookingLabels): Record<string, string> => ({
  name: "Name",
  date: "Datum",
  time: "Uhrzeit",
  guestCount: labels.participantsLabel,
  phone: "Telefon",
  email: "E-Mail",
  specialRequests: "Wünsche",
});

const PREDEFINED_COLLECTS = ["", "name", "date", "time", "guestCount", "phone", "email", "specialRequests"];

type NodeStatus = { type: "error" | "end" | null; message?: string };

function IPhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto h-[626px] w-[304px]">
      <div className="origin-top scale-[1.15]">
        <div className="relative mx-auto" style={{ width: 264 }}>
          <div className="absolute -left-[3px] top-[96px] h-8 w-[3px] rounded-l-sm bg-[#2F3137]" />
          <div className="absolute -left-[3px] top-[136px] h-14 w-[3px] rounded-l-sm bg-[#2F3137]" />
          <div className="absolute -left-[3px] top-[196px] h-14 w-[3px] rounded-l-sm bg-[#2F3137]" />
          <div className="absolute -right-[3px] top-[156px] h-20 w-[3px] rounded-r-sm bg-[#2F3137]" />

          <div className="relative overflow-hidden rounded-[40px] border-[2px] border-[#2D2F36] bg-[#0B0B0E] shadow-[0_30px_70px_rgba(0,0,0,0.42)]">
            <div
              className="relative flex flex-col"
              style={{
                height: 540,
                background: "linear-gradient(180deg, #121216 0%, #0A0A0D 100%)",
              }}
            >
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

              <div className="absolute left-1/2 top-3 z-20 flex h-[26px] w-[90px] -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-black">
                <div className="h-2.5 w-2.5 rounded-full bg-[#18181B] ring-1 ring-[#27272A]" />
                <div className="h-[5px] w-[5px] rounded-full bg-[#2F2F35]" />
              </div>

              <div className="relative z-10 flex shrink-0 items-center justify-between px-7 pt-4 pb-1">
                <span className="text-[12px] font-semibold text-white">9:41</span>
                <div className="flex items-center gap-[5px]">
                  <div className="flex items-end gap-[2px]">
                    <div className="h-[3px] w-[2px] rounded-sm bg-white" />
                    <div className="h-[5px] w-[2px] rounded-sm bg-white" />
                    <div className="h-[7px] w-[2px] rounded-sm bg-white" />
                    <div className="h-[9px] w-[2px] rounded-sm bg-white" />
                  </div>
                  <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C7.5 3 3.75 4.95 1 8l1.5 1.5C4.75 6.75 8.25 5 12 5s7.25 1.75 9.5 4.5L23 8c-2.75-3.05-6.5-5-11-5zm0 4c-3 0-5.75 1.35-7.5 3.5L6 12c1.25-1.5 3.25-2.5 6-2.5s4.75 1 6 2.5l1.5-1.5C17.75 8.35 15 7 12 7zm0 4c-1.75 0-3.25.75-4.5 2L9 14.5c.75-.75 1.75-1 3-1s2.25.25 3 1L16.5 13c-1.25-1.25-2.75-2-4.5-2zm0 4c-1 0-1.75.5-2.25 1L12 18l2.25-2c-.5-.5-1.25-1-2.25-1z" />
                  </svg>
                  <div className="flex items-center">
                    <div className="h-[10px] w-[20px] rounded-[2px] border border-white p-[1px]">
                      <div className="h-full w-[70%] rounded-[1px] bg-white" />
                    </div>
                    <div className="ml-[1px] h-[3px] w-[1px] rounded-r-sm bg-white" />
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10">
                    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="relative">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold leading-tight text-white">Dein Flow</p>
                    <p className="text-[10px] text-[#22C55E]">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-white/90">
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Chat content */}
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
                {children}
              </div>

              <div className="absolute bottom-1.5 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlowListBuilder({
  nodes,
  edges,
  startNodeIds,
  triggers,
  triggerForm,
  editingTriggerId,
  keywordInput,
  triggerTestInput,
  onOpenTriggerEditor,
  onCloseTriggerEditor,
  onSaveTrigger,
  onDeleteTrigger,
  onKeywordInputChange,
  onTriggerTestInputChange,
  onAddKeyword,
  onRemoveKeyword,
  onTriggerMatchTypeChange,
  onTriggerStartNodeChange,
  onNodesChange,
  onEdgesChange,
  selectedNodeId,
  onSelectNode,
  onOpenInspector,
  onAddNode,
  onDeleteNode,
}: FlowListBuilderProps) {
  const { vertical } = useAccountVertical();
  const labels = getBookingLabels(vertical);
  const collectsLabels = useMemo(() => getCollectsLabels(labels), [labels]);
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);
  const [simulatorCurrentNodeId, setSimulatorCurrentNodeId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const nodeCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  // Tracks the node that was active when preview was opened — no scroll for initial node
  const previewStartNodeRef = useRef<string | null>(null);
  // Ref to the outer wrapper + cached scroll container (found lazily)
  const outerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  // Order nodes by flow path.
  // If displayOrder has been set on all nodes (after a manual drag), use that instead
  // of the BFS traversal so the visual order is always stable regardless of edge topology.
  const orderedNodes = useMemo(() => {
    const hasDisplayOrder = nodes.length > 0 &&
      nodes.every(n => typeof (n.data as any)?.displayOrder === "number");
    if (hasDisplayOrder) {
      return [...nodes].sort(
        (a, b) =>
          ((a.data as any).displayOrder as number) -
          ((b.data as any).displayOrder as number),
      );
    }
    return buildFlowOrder(nodes, edges, startNodeIds);
  }, [nodes, edges, startNodeIds]);
  const triggerKeywords = useMemo(() => {
    const keywords: string[] = [];
    triggers.forEach((trigger) => {
      const list = trigger.config?.keywords ?? [];
      list.forEach((keyword) => {
        const trimmed = keyword.trim();
        if (trimmed) keywords.push(trimmed);
      });
    });
    return Array.from(new Set(keywords));
  }, [triggers]);
  const isTriggerExpanded = Boolean(triggerForm);

  // When simulator moves to a new node, scroll the card into view —
  // but skip the initial node (user is already looking at it when they clicked Eye).
  // Use requestAnimationFrame so we wait for the layout reflow (preview panel appearing)
  // to settle before measuring positions.
  useEffect(() => {
    if (!simulatorCurrentNodeId) return;
    if (simulatorCurrentNodeId === previewStartNodeRef.current) return;
    const raf = requestAnimationFrame(() => {
      const el = nodeCardRefs.current.get(simulatorCurrentNodeId);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => cancelAnimationFrame(raf);
  }, [simulatorCurrentNodeId]);

  // Reset simulator tracking when preview closes
  useEffect(() => {
    if (!previewNodeId) {
      setSimulatorCurrentNodeId(null);
      previewStartNodeRef.current = null;
    }
  }, [previewNodeId]);

  // Auto-expand selected node
  useEffect(() => {
    if (selectedNodeId) {
      setExpandedNodeId(selectedNodeId);
      // Scroll to node
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-node-id="${selectedNodeId}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [selectedNodeId]);

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodeId(prev => prev === nodeId ? null : nodeId);
  }, []);

  // Walk up the DOM to find the nearest scrollable ancestor (cached after first call)
  const getScrollContainer = useCallback((): HTMLElement | null => {
    if (scrollContainerRef.current) return scrollContainerRef.current;
    let el = outerRef.current?.parentElement;
    while (el) {
      const overflow = window.getComputedStyle(el).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') {
        scrollContainerRef.current = el;
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }, []);

  /**
   * Rebuilds the edge array after a drag-and-drop reorder.
   *
   * Strategy:
   *  - QuickReply edges reference node IDs, so they are always valid — keep them.
   *  - Backbone edges (free_text → next node) depend on order — rebuild them from scratch
   *    based on the new sequence, connecting each free_text node to its new successor.
   *  - The last node in the sequence never receives a new outgoing backbone edge, so it
   *    naturally becomes (or stays) the terminal step.
   */
  const rebuildEdgesAfterReorder = useCallback((newOrder: Node[]): Edge[] => {
    const quickReplyEdges = edges.filter(e => Boolean((e.data as any)?.quickReplyId));
    const newBackboneEdges: Edge[] = [];

    for (let i = 0; i < newOrder.length - 1; i++) {
      const src = newOrder[i];
      const tgt = newOrder[i + 1];

      // Only free_text nodes emit backbone (free-flow) edges.
      // Buttons nodes connect exclusively via their quickReply edges.
      if (deriveInputMode(src, edges) !== "free_text") continue;

      // Reuse existing edge metadata (id, label, etc.) when the source already had one.
      const existing = edges.find(
        e => e.source === src.id && !((e.data as any)?.quickReplyId),
      );

      newBackboneEdges.push({
        id: existing?.id ?? `ft-${src.id}-${tgt.id}`,
        source: src.id,
        target: tgt.id,
        type: existing?.type,
        data: {
          tone: "neutral",
          condition: "Freitext",
          ...(existing?.data ?? {}),
        },
        label: existing?.label ?? "Freitext",
      } as Edge);
    }

    return [...quickReplyEdges, ...newBackboneEdges];
  }, [edges]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIdx = orderedNodes.findIndex(n => n.id === active.id);
    const newIdx = orderedNodes.findIndex(n => n.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const newOrder = arrayMove(orderedNodes, oldIdx, newIdx);

    // 1. Persist visual order via displayOrder on each node.
    //    This drives orderedNodes regardless of edge topology so the UI never snaps back.
    const orderMap = new Map(newOrder.map((n, i) => [n.id, i]));
    const updatedNodes = nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        displayOrder: orderMap.get(n.id) ?? (n.data as any)?.displayOrder ?? 999,
      },
    }));
    onNodesChange(updatedNodes);

    // 2. Rewire free_text backbone edges so the "Danach weiter zu" dropdowns stay
    //    consistent with the new visual order. Buttons/choice nodes are not affected
    //    because they have no backbone edges (only quickReply edges).
    onEdgesChange(rebuildEdgesAfterReorder(newOrder));
  }, [orderedNodes, nodes, onNodesChange, onEdgesChange, rebuildEdgesAfterReorder]);

  const getFreeTextTarget = useCallback((nodeId: string) => {
    const edge = edges.find(e => e.source === nodeId && !(e.data as any)?.quickReplyId);
    return edge?.target ?? "";
  }, [edges]);

  const setFreeTextTarget = useCallback((nodeId: string, targetId: string) => {
    const filtered = edges.filter(e => !(e.source === nodeId && !(e.data as any)?.quickReplyId));
    const next = targetId
      ? [...filtered, { id: `ft-${nodeId}-${targetId}`, source: nodeId, target: targetId, data: { tone: "neutral", condition: "Freitext" }, label: "Freitext" }]
      : filtered;
    onEdgesChange(next);
  }, [edges, onEdgesChange]);

  const updateInputMode = useCallback((nodeId: string, mode: "buttons" | "free_text") => {
    const updatedNodes = nodes.map(node =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              inputMode: mode,
              ...(mode === "free_text" ? (() => {
                const defaults = buildFreeTextDefaults((node.data?.label as string) ?? "", labels);
                return {
                  placeholder: (node.data as any)?.placeholder || defaults.placeholder,
                  collects: (node.data as any)?.collects || defaults.collects,
                };
              })() : {}),
            },
          }
        : node
    );
    onNodesChange(updatedNodes);
  }, [labels, nodes, onNodesChange]);

  const updateFreeTextMeta = useCallback((nodeId: string, field: "placeholder" | "collects", value: string) => {
    const updatedNodes = nodes.map(node =>
      node.id === nodeId ? { ...node, data: { ...node.data, [field]: value } } : node
    );
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange]);

  const buildFreeTextNode = useCallback((label?: string) => {
    const defaults = buildFreeTextDefaults(label, labels);
    return {
      id: `ft-${Date.now()}`,
      type: "wesponde",
      position: { x: 120, y: 120 + nodes.length * 140 },
      data: {
        label: label ? `Freitext: ${label}` : "Freitext",
        text: defaults.text,
        variant: "message",
        quickReplies: [],
        inputMode: "free_text",
        placeholder: defaults.placeholder,
        collects: defaults.collects,
      },
    } as Node;
  }, [labels, nodes.length]);

  const syncEdgesForNode = useCallback((nodeId: string, replies: FlowQuickReply[]) => {
    let next = edges
      .filter(edge => {
        if (edge.source === nodeId && (edge.data as any)?.quickReplyId) {
          const reply = replies.find(r => r.id === (edge.data as any)?.quickReplyId);
          return Boolean(reply && reply.targetNodeId);
        }
        return true;
      })
      .map(edge => {
        if (edge.source === nodeId && (edge.data as any)?.quickReplyId) {
          const reply = replies.find(r => r.id === (edge.data as any)?.quickReplyId);
          if (!reply || !reply.targetNodeId) return edge;
          return { ...edge, target: reply.targetNodeId, data: { ...edge.data, tone: "neutral", condition: reply.label, quickReplyId: reply.id }, label: reply.label };
        }
        return edge;
      });

    replies.forEach(reply => {
      if (!reply.targetNodeId) return;
      const exists = next.some(e => e.source === nodeId && (e.data as any)?.quickReplyId === reply.id);
      if (!exists) {
        next.push({ id: `qr-${nodeId}-${reply.id}`, source: nodeId, target: reply.targetNodeId, data: { tone: "neutral", condition: reply.label, quickReplyId: reply.id }, label: reply.label });
      }
    });

    onEdgesChange(next);
  }, [edges, onEdgesChange]);

  const updateNodeText = useCallback((nodeId: string, text: string) => {
    const updatedNodes = nodes.map(node => {
      if (node.id !== nodeId) return node;
      return { ...node, data: { ...node.data, text } };
    });
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange]);

  const updateNodeLabel = useCallback((nodeId: string, label: string) => {
    const updatedNodes = nodes.map(node => {
      if (node.id !== nodeId) return node;
      return { ...node, data: { ...node.data, label } };
    });
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange]);

  const addQuickReply = useCallback((nodeId: string) => {
    let updatedReplies: FlowQuickReply[] = [];
    const updatedNodes = nodes.map(node => {
      if (node.id !== nodeId) return node;
      const current = (node.data?.quickReplies ?? []) as FlowQuickReply[];
      updatedReplies = [...current, { id: `qr-${Date.now()}`, label: "Neue Option", payload: "", targetNodeId: null }];
      return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
    });
    onNodesChange(updatedNodes);
    if (updatedReplies.length > 0) syncEdgesForNode(nodeId, updatedReplies);
  }, [nodes, onNodesChange, syncEdgesForNode]);

  const updateQuickReply = useCallback((nodeId: string, replyId: string, updates: Partial<FlowQuickReply>) => {
    let updatedReplies: FlowQuickReply[] = [];
    const updatedNodes = nodes.map(node => {
      if (node.id !== nodeId) return node;
      const current = (node.data?.quickReplies ?? []) as FlowQuickReply[];
      updatedReplies = current.map(r => r.id === replyId ? { ...r, ...updates } : r);
      return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
    });
    onNodesChange(updatedNodes);
    if (updatedReplies.length > 0) syncEdgesForNode(nodeId, updatedReplies);
  }, [nodes, onNodesChange, syncEdgesForNode]);

  const handleQuickReplyTargetChange = useCallback((nodeId: string, replyId: string, targetValue: string, label: string) => {
    if (targetValue === "__NEW_FREETEXT__") {
      const newNode = buildFreeTextNode(label);
      let updatedReplies: FlowQuickReply[] = [];
      const updatedNodes = nodes.map(node => {
        if (node.id !== nodeId) return node;
        const current = (node.data?.quickReplies ?? []) as FlowQuickReply[];
        updatedReplies = current.map(r => r.id === replyId ? { ...r, targetNodeId: newNode.id } : r);
        return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
      });
      onNodesChange([...updatedNodes, newNode]);
      if (updatedReplies.length > 0) syncEdgesForNode(nodeId, updatedReplies);
      onSelectNode(newNode.id);
      return;
    }
    updateQuickReply(nodeId, replyId, { targetNodeId: targetValue || null });
  }, [buildFreeTextNode, nodes, onNodesChange, onSelectNode, syncEdgesForNode, updateQuickReply]);

  const removeQuickReply = useCallback((nodeId: string, replyId: string) => {
    let updatedReplies: FlowQuickReply[] = [];
    const updatedNodes = nodes.map(node => {
      if (node.id !== nodeId) return node;
      const current = (node.data?.quickReplies ?? []) as FlowQuickReply[];
      updatedReplies = current.filter(r => r.id !== replyId);
      return { ...node, data: { ...node.data, quickReplies: updatedReplies } };
    });
    onNodesChange(updatedNodes);
    syncEdgesForNode(nodeId, updatedReplies);
  }, [nodes, onNodesChange, syncEdgesForNode]);

  // Get target node label
  const getNodeLabel = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || "Ohne Titel";
  }, [nodes]);

  // Classify node state: configuration error, intentional end, or ok
  const getNodeStatus = useCallback((node: Node): NodeStatus => {
    const inputMode = deriveInputMode(node, edges);
    const quickReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];

    if (inputMode === "buttons" && quickReplies.length === 0) {
      return { type: "error", message: "Keine Antwort-Buttons definiert" };
    }
    if (inputMode === "free_text" && !getFreeTextTarget(node.id)) {
      return { type: "end" };
    }
    return { type: null };
  }, [edges, getFreeTextTarget]);

  // Empty State
  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EFF6FF]">
          <MessageSquare className="h-10 w-10 text-[#2563EB]" />
        </div>
        <h3 className="mt-6 text-2xl font-semibold text-[#0F172A]">
          Dein Flow ist noch leer
        </h3>
        <p className="mt-2 max-w-md text-center text-[#475569]">
          Erstelle deinen ersten Schritt, um mit dem Aufbau deines Konversations-Flows zu beginnen.
        </p>
        <button
          onClick={() => onAddNode("message", "Willkommen! Wie kann ich dir heute helfen?")}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#2450b2] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_2px_16px_rgba(0,0,0,0.18)] transition-all hover:bg-[#1a46c4]"
        >
          <Sparkles className="h-4 w-4" />
          Ersten Schritt erstellen
        </button>
      </div>
    );
  }

  return (
    <div ref={outerRef} className="relative flex gap-8">
      {/* Left: node list */}
      <div className={`${previewNodeId ? "flex-1 min-w-0" : "w-full"} space-y-0`}>
      {/* Flow Header Stats */}
      <div className="mb-8 flex items-center justify-between rounded-[22px] border border-[#E2E8F0] bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-base">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF]">
              <MessageSquare className="h-4.5 w-4.5 text-[#2563EB]" />
            </div>
            <span className="text-[17px] font-semibold text-[#0F172A]">{nodes.length}</span>
            <span className="text-[#64748B]">Schritte</span>
          </div>
          <div className="flex items-center gap-3 text-base">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5]">
              <Flag className="h-4.5 w-4.5 text-[#10B981]" />
            </div>
            <span className="text-[17px] font-semibold text-[#0F172A]">{startNodeIds.size}</span>
            <span className="text-[#64748B]">Startpunkte</span>
          </div>
        </div>
        <button
          onClick={() => onAddNode("message")}
          className="inline-flex items-center gap-2.5 rounded-full bg-[#2450b2] px-6 py-3 text-base font-semibold text-white shadow-[0_2px_16px_rgba(0,0,0,0.18)] transition-all hover:bg-[#1a46c4]"
        >
          <Plus className="h-4.5 w-4.5" />
          Neuer Schritt
        </button>
      </div>

      {/* Flow Steps */}
      <div className="relative">
        {/* Vertical Connection Line */}
        <div className="absolute bottom-0 left-10 top-0 w-0.5 bg-gradient-to-b from-[#BFDBFE] via-[#E2E8F0] to-[#E2E8F0]" />

        {/* Trigger Card */}
        <div className="relative mb-5 ml-20">
          <div className="absolute -left-[64px] top-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#2450b2] bg-[#2450b2] text-white">
            <Zap className="h-5 w-5" />
          </div>
          <div
            className={`relative w-full rounded-[22px] border bg-white shadow-sm transition-all duration-300 ${
              isTriggerExpanded
                ? "border-[#86EFAC] shadow-[0_14px_30px_rgba(16,185,129,0.12)]"
                : "border-[#E2E8F0] hover:border-[#A7F3D0] hover:shadow-md"
            }`}
          >
            <div
              onClick={() => {
                if (isTriggerExpanded) {
                  onCloseTriggerEditor();
                } else {
                  onOpenTriggerEditor();
                }
              }}
              className="flex cursor-pointer items-start gap-4 p-5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF]">
                <Zap className="h-5.5 w-5.5 text-[#2450b2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[18px] font-semibold text-[#0F172A]">Trigger</h3>
                  <span className="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
                    {triggers.length}
                  </span>
                </div>
                <p className="mt-1 text-[15px] text-[#475569]">
                  Startpunkt der Unterhaltung – definiert, womit {labels.contactPlural} beginnen.
                </p>
                {triggerKeywords.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {triggerKeywords.slice(0, 5).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-xs font-semibold text-[#2563EB]"
                      >
                        {keyword}
                      </span>
                    ))}
                    {triggerKeywords.length > 5 ? (
                      <span className="text-xs text-[#2563EB]">
                        +{triggerKeywords.length - 5} weitere
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#B45309]">
                    Noch keine Startwörter hinterlegt.
                  </p>
                )}
              </div>
              <ChevronRight className={`h-6 w-6 text-[#94A3B8] transition-transform ${isTriggerExpanded ? "rotate-90" : ""}`} />
            </div>
            {isTriggerExpanded && triggerForm && (
              <div className="animate-fade-in-up space-y-5 border-t border-[#E2E8F0] p-5">
                {!editingTriggerId && triggers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Bestehende Trigger</p>
                    <div className="max-h-44 space-y-2 overflow-y-auto">
                      {triggers.map((trigger) => (
                        <div key={trigger.id} className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                          <div className="flex flex-wrap gap-1">
                            {trigger.config.keywords.slice(0, 3).map((keyword) => (
                              <span key={keyword} className="rounded-full border border-[#E2E8F0] bg-white px-2 py-0.5 text-xs font-semibold text-[#475569]">
                                {keyword}
                              </span>
                            ))}
                            {trigger.config.keywords.length > 3 && (
                              <span className="text-xs text-[#64748B]">+{trigger.config.keywords.length - 3}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenTriggerEditor(trigger)}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-[#475569] transition-colors hover:bg-white hover:text-[#0F172A]"
                            >
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTrigger(trigger.id)}
                              className="rounded-full p-1.5 text-[#64748B] transition-colors hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                              title="Trigger löschen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">Keywords</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {triggerForm.config.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#2563EB]"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => onRemoveKeyword(keyword)}
                          className="text-[#2563EB]/60 hover:text-[#2563EB]"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={keywordInput}
                      onChange={(event) => onKeywordInputChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          onAddKeyword();
                        }
                      }}
                      placeholder="Keyword hinzufügen"
                      className="app-input flex-1 px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                    />
                    <button
                      type="button"
                      onClick={onAddKeyword}
                      className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-white"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#334155]">Match Type</label>
                  <select
                    value={triggerForm.config.matchType}
                    onChange={(event) =>
                      onTriggerMatchTypeChange(event.target.value as FlowTrigger["config"]["matchType"])
                    }
                    className="app-select mt-2 w-full"
                  >
                    <option value="CONTAINS">enthält Schlagwort</option>
                    <option value="EXACT">exaktes Schlagwort</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#334155]">Start Node</label>
                  <select
                    value={triggerForm.startNodeId ?? ""}
                    onChange={(event) => onTriggerStartNodeChange(event.target.value || null)}
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

                <div>
                  <label className="text-sm font-semibold text-[#334155]">Testen</label>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Würde eine Nachricht irgendeinen Trigger dieses Flows auslösen?
                  </p>
                  <input
                    value={triggerTestInput}
                    onChange={(event) => onTriggerTestInputChange(event.target.value)}
                    placeholder='z.B. "Ich möchte gerne reservieren"'
                    className="app-input mt-2 px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                  />
                  {triggerTestInput.trim() && (() => {
                    const persistedTriggers = editingTriggerId
                      ? triggers.filter((trigger) => trigger.id !== editingTriggerId)
                      : triggers;
                    const allTriggers = [
                      ...persistedTriggers,
                      ...(triggerForm.config.keywords.length > 0 ? [triggerForm] : []),
                    ];
                    const matchedTrigger = allTriggers.find((trigger) =>
                      testTriggerMatch(triggerTestInput, trigger.config.keywords, trigger.config.matchType),
                    );
                    return (
                      <div
                        className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                          matchedTrigger
                            ? "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]"
                            : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                        }`}
                      >
                        {matchedTrigger ? (
                          <>
                            <Check className="h-4 w-4 shrink-0" />
                            Würde Flow auslösen ({matchedTrigger.config.keywords[0] ?? "Trigger"})
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 shrink-0" />
                            Würde diesen Flow NICHT auslösen
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onSaveTrigger}
                    className="flex-1 rounded-full bg-[#2450b2] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_2px_16px_rgba(0,0,0,0.18)] transition-all hover:bg-[#1a46c4] disabled:opacity-50"
                    disabled={!triggerForm.config.keywords.length || !triggerForm.startNodeId}
                  >
                    Speichern
                  </button>
                  <button
                    type="button"
                    onClick={onCloseTriggerEditor}
                    className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-sm font-medium text-[#475569] transition-colors hover:bg-white hover:text-[#0F172A]"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedNodes.map(n => n.id)}
            strategy={verticalListSortingStrategy}
          >
        {orderedNodes.map((node, index) => {
          const isStart = startNodeIds.has(node.id);
          const isSelected = selectedNodeId === node.id;
          const isExpanded = expandedNodeId === node.id;
          const inputMode = deriveInputMode(node, edges);
          const quickReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
          const freeTextTarget = getFreeTextTarget(node.id);
          const status = getNodeStatus(node);
          const isLast = index === orderedNodes.length - 1;

          const isSimulatorActive = simulatorCurrentNodeId === node.id && Boolean(previewNodeId);

          return (
            <SortableNodeWrapper key={node.id} id={node.id}>
            <div className="relative" data-node-id={node.id}>
              {/* Step Card */}
              <div
                ref={(el) => {
                  if (el) nodeCardRefs.current.set(node.id, el);
                  else nodeCardRefs.current.delete(node.id);
                }}
                className={`
                  relative ml-20 mb-5 rounded-[22px] border bg-white shadow-sm transition-all duration-300
                  ${isSimulatorActive
                    ? 'border-[#2563EB] shadow-[0_18px_40px_rgba(37,99,235,0.18)] ring-2 ring-[#DBEAFE]'
                    : isSelected
                      ? 'border-[#93C5FD] shadow-[0_14px_30px_rgba(15,23,42,0.10)]'
                      : 'border-[#E2E8F0] hover:border-[#BFDBFE] hover:shadow-md'
                  }
                `}
              >
                {/* Step Number Circle */}
                <div
                  className={`
                    absolute -left-[64px] top-5 flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-300
                    ${isSimulatorActive
                      ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30'
                      : isStart
                        ? 'border-[#10B981] bg-[#10B981] text-white'
                        : isSelected
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]'
                    }
                  `}
                >
                  {isStart ? <Flag className="h-5 w-5" /> : index + 1}
                </div>

                {/* Card Header - Always Visible */}
                <div
                  onClick={() => toggleExpanded(node.id)}
                  className="flex cursor-pointer items-center gap-4 p-5"
                >
                  {/* Node Type Icon */}
                  <div className={`
                    flex h-12 w-12 items-center justify-center rounded-2xl shrink-0
                    ${inputMode === 'free_text'
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'bg-[#EFF6FF] text-[#2563EB]'
                    }
                  `}>
                    {inputMode === 'free_text'
                      ? <Keyboard className="h-5.5 w-5.5" />
                      : <MessageSquare className="h-5.5 w-5.5" />
                    }
                  </div>

                  {/* Title & Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[18px] font-semibold text-[#0F172A]">
                        {node.data?.label || "Ohne Titel"}
                      </h3>
                      {isStart && (
                        <span className="shrink-0 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
                          Start
                        </span>
                      )}
                      {inputMode === 'free_text' && (
                        <span className="shrink-0 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] px-2.5 py-0.5 text-xs font-semibold text-[#475569]">
                          {(() => {
                            const c = (node.data as any)?.collects;
                            if (!c || c === "__custom_empty__") return 'Freitext';
                            return collectsLabels[c] || c;
                          })()}
                        </span>
                      )}
                      {status.type === 'error' && (
                        <span className="shrink-0 text-[#D97706]" title={status.message}>
                          <AlertCircle className="h-4.5 w-4.5" />
                        </span>
                      )}
                      {status.type === 'end' && (
                        <span className="shrink-0 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
                          Ende
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[15px] text-[#475569] truncate">
                      {node.data?.text || "Keine Nachricht"}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <NodeDragHandle />
                    {/* Inspect button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectNode(node.id); onOpenInspector(node.id); }}
                      className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                      title="Inspizieren"
                    >
                      <Settings2 className="h-4.5 w-4.5" />
                    </button>
                    {/* Preview button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Save scroll position BEFORE layout change to prevent
                        // browser scroll-anchoring from jumping the view
                        const container = getScrollContainer();
                        const savedScrollTop = container?.scrollTop ?? 0;
                        const next = previewNodeId === node.id ? null : node.id;
                        setPreviewNodeId(next);
                        if (next) {
                          previewStartNodeRef.current = next;
                          setSimulatorCurrentNodeId(next);
                        }
                        // Restore after React has committed the layout change
                        if (container) {
                          requestAnimationFrame(() => {
                            container.scrollTop = savedScrollTop;
                          });
                        }
                      }}
                      className={`rounded-lg p-2 transition-colors ${
                        previewNodeId === node.id
                          ? 'bg-[#DBEAFE] text-[#2563EB]'
                          : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                      }`}
                      title="Vorschau"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>
                    <ChevronRight className={`h-6 w-6 text-[#94A3B8] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="animate-fade-in-up space-y-5 border-t border-[#E2E8F0] p-5">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Name <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        value={node.data?.label || ""}
                        onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                        placeholder="z.B. Begrüßung, Terminabfrage, Bestätigung..."
                        className="w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#DBEAFE]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Nachricht
                      </label>
                      <textarea
                        value={node.data?.text || ""}
                        onChange={(e) => updateNodeText(node.id, e.target.value)}
                        placeholder="Was soll der Bot sagen?"
                        className="w-full resize-none rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#DBEAFE]"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Wie antwortet der {labels.contactLabel}?
                      </label>
                      <div className="flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
                        <button
                          onClick={() => updateInputMode(node.id, "buttons")}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            inputMode === "buttons"
                              ? "bg-white text-[#0F172A] shadow-sm"
                              : "text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Mit Buttons
                        </button>
                        <button
                          onClick={() => updateInputMode(node.id, "free_text")}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            inputMode === "free_text"
                              ? "bg-white text-[#0F172A] shadow-sm"
                              : "text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          <Keyboard className="h-4 w-4" />
                          Freier Text
                        </button>
                      </div>
                    </div>

                    {inputMode === "free_text" && (
                      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
                        <p className="text-sm text-[#475569]">
                          Der {labels.contactLabel} tippt seine Antwort frei ein.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-[#64748B]">
                              Dieses Feld sammelt
                            </label>
                            {(() => {
                              const collectsVal = (node.data as any)?.collects ?? "";
                              const isCustom = !!collectsVal && !PREDEFINED_COLLECTS.includes(collectsVal);
                              const displayVal = collectsVal === "__custom_empty__" ? "" : collectsVal;
                              return isCustom ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={displayVal}
                                    autoFocus={collectsVal === "__custom_empty__"}
                                    onChange={(e) => updateFreeTextMeta(node.id, "collects", e.target.value || "__custom_empty__")}
                                    placeholder="z. B. lieblingsfarbe"
                                    className="flex-1 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
                                  />
                                  <button
                                    onClick={() => updateFreeTextMeta(node.id, "collects", "")}
                                    className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-white hover:text-[#0F172A]"
                                    title="Zurück zur Auswahl"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <select
                                  value={collectsVal}
                                  onChange={(e) => {
                                    if (e.target.value === "__custom__") {
                                      updateFreeTextMeta(node.id, "collects", "__custom_empty__");
                                    } else {
                                      updateFreeTextMeta(node.id, "collects", e.target.value);
                                    }
                                  }}
                                  className="app-select w-full"
                                >
                                  <option value="">Keine Zuordnung</option>
                                  <option value="name">Name</option>
                                  <option value="date">Datum</option>
                                  <option value="time">Uhrzeit</option>
                                  <option value="guestCount">{labels.participantsCountLabel}</option>
                                  <option value="phone">Telefonnummer</option>
                                  <option value="email">E-Mail-Adresse</option>
                                  <option value="specialRequests">Besondere Wünsche</option>
                                  <option disabled>──────────</option>
                                  <option value="__custom__">+ Eigenes Feld...</option>
                                </select>
                              );
                            })()}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-[#64748B]">
                              Danach weiter zu
                            </label>
                            <select
                              value={freeTextTarget}
                              onChange={(e) => setFreeTextTarget(node.id, e.target.value)}
                              className="app-select w-full"
                            >
                              <option value="">Flow endet hier</option>
                              {nodes.filter(n => n.id !== node.id).map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.data?.label || "Ohne Titel"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {freeTextTarget ? (
                          <div className="flex items-center gap-2 text-sm text-[#64748B]">
                            <ArrowRight className="h-4 w-4" />
                            <span>Weiter zu: <strong>{getNodeLabel(freeTextTarget)}</strong></span>
                          </div>
                        ) : (
                          <p className="flex items-center gap-1.5 text-xs text-[#047857]">
                            <Flag className="h-3 w-3 shrink-0" />
                            Kein nächster Schritt – Konversation endet hier.
                          </p>
                        )}
                      </div>
                    )}

                    {inputMode === "buttons" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                            Antwort-Buttons ({quickReplies.length})
                          </label>
                          <button
                            onClick={() => addQuickReply(node.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#2563EB] transition-colors hover:bg-[#DBEAFE]"
                          >
                            <Plus className="h-3 w-3" />
                            Button
                          </button>
                        </div>

                        {quickReplies.length === 0 ? (
                          <div className="rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center">
                            <p className="text-sm text-[#475569]">
                              Noch keine Buttons. Füge Buttons hinzu, damit der {labels.contactLabel} antworten kann.
                            </p>
                            <button
                              onClick={() => addQuickReply(node.id)}
                              className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
                            >
                              <Plus className="h-4 w-4" />
                              Ersten Button hinzufügen
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {quickReplies.map((reply, replyIndex) => (
                              <div
                                key={reply.id}
                                className="group flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-[#64748B] border border-[#E2E8F0]">
                                  {replyIndex + 1}
                                </div>
                                <input
                                  type="text"
                                  value={reply.label}
                                  onChange={(e) => updateQuickReply(node.id, reply.id, { label: e.target.value })}
                                  placeholder="Button-Text"
                                  className="flex-1 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none"
                                />
                                <ArrowRight className="h-4 w-4 text-[#94A3B8]" />
                                <span className="text-xs font-medium text-[#64748B] whitespace-nowrap">
                                  führt zu
                                </span>
                                <select
                                  value={reply.targetNodeId || ""}
                                  onChange={(e) => handleQuickReplyTargetChange(node.id, reply.id, e.target.value, reply.label)}
                                  className="app-select w-36"
                                >
                                  <option value="">Konversation endet hier</option>
                                  <option value="__NEW_FREETEXT__">+ Neuer Freitext</option>
                                  {nodes.filter(n => n.id !== node.id).map((n) => (
                                    <option key={n.id} value={n.id}>
                                      {n.data?.label || "Ohne Titel"}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => removeQuickReply(node.id, reply.id)}
                                  className="rounded-full p-1.5 text-[#64748B] opacity-0 transition-all group-hover:opacity-100 hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                          <label className="mb-1 block text-xs font-semibold text-[#64748B]">
                            Dieses Feld sammelt
                          </label>
                          <p className="mb-2 text-[11px] text-[#94A3B8]">
                            Welche Buchungsinformation liefert die gewählte Button-Antwort?
                          </p>
                          <select
                            value={(node.data as any)?.collects ?? ""}
                            onChange={(e) => updateFreeTextMeta(node.id, "collects", e.target.value)}
                            className="app-select w-full"
                          >
                            <option value="">Keine Zuordnung</option>
                            <option value="name">Name</option>
                            <option value="date">Datum</option>
                            <option value="time">Uhrzeit</option>
                            <option value="guestCount">{labels.participantsCountLabel}</option>
                            <option value="phone">Telefonnummer</option>
                            <option value="email">E-Mail-Adresse</option>
                            <option value="specialRequests">Besondere Wünsche</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-[#E2E8F0] pt-2">
                      <button
                        onClick={() => onDeleteNode(node.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] py-2.5 text-sm font-medium text-[#DC2626] transition-colors hover:bg-[#FEE2E2]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Schritt löschen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isLast && (
                <div className="absolute -left-[28px] bottom-0 translate-y-1/2 flex h-6 w-6 items-center justify-center">
                  <ArrowDown className="h-4 w-4 text-[#94A3B8]" />
                </div>
              )}
            </div>
            </SortableNodeWrapper>
          );
        })}
          </SortableContext>

          {/* Floating ghost card shown while dragging */}
          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeId && (() => {
              const node = nodes.find(n => n.id === activeId);
              if (!node) return null;
              const im = deriveInputMode(node, edges);
              return (
                <div className="ml-20 rounded-[22px] border border-[#93C5FD] bg-white shadow-[0_12px_40px_rgba(37,99,235,0.20)]">
                  <div className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                      {im === "free_text"
                        ? <Keyboard className="h-5 w-5" />
                        : <MessageSquare className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-[18px] font-semibold text-[#0F172A]">
                        {node.data?.label || "Ohne Titel"}
                      </h3>
                      <p className="mt-1 truncate text-[15px] text-[#475569]">
                        {node.data?.text || "Keine Nachricht"}
                      </p>
                    </div>
                    <GripVertical className="h-5 w-5 text-[#2563EB]" />
                  </div>
                </div>
              );
            })()}
          </DragOverlay>
        </DndContext>

        <div className="relative ml-20">
          <div className="absolute -left-[64px] top-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-[#CBD5E1] bg-white">
            <Plus className="h-5.5 w-5.5 text-[#94A3B8]" />
          </div>
          <button
            onClick={() => onAddNode("message")}
            className="flex w-full items-center justify-center gap-2.5 rounded-[22px] border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] py-8 text-base font-medium text-[#64748B] transition-all hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
          >
            <Plus className="h-5.5 w-5.5" />
            Weiteren Schritt hinzufügen
          </button>
        </div>
      </div>
    </div>

    {/* Right: preview panel — only rendered when preview is open */}
    {previewNodeId && (
      <div className="w-[352px] shrink-0 pl-6">
        <div className="sticky top-6">
          <div className="mb-4 flex items-center justify-between pr-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Vorschau</p>
            <button onClick={() => {
              const container = getScrollContainer();
              const savedScrollTop = container?.scrollTop ?? 0;
              setPreviewNodeId(null);
              if (container) {
                requestAnimationFrame(() => { container.scrollTop = savedScrollTop; });
              }
            }}>
              <X className="h-4 w-4 text-[#94A3B8] transition-colors hover:text-[#0F172A]" />
            </button>
          </div>
          <IPhoneMockup>
            <FlowSimulator
              hideHeader
              nodes={nodes}
              edges={edges}
              triggers={triggers}
              startNodeId={previewNodeId}
              autoStart={true}
              onCurrentNodeChange={setSimulatorCurrentNodeId}
            />
          </IPhoneMockup>
        </div>
      </div>
    )}
  </div>
  );
}
