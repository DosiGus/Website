'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type FlowListBuilderProps = {
  nodes: Node[];
  edges: Edge[];
  startNodeIds: Set<string>;
  triggers: FlowTrigger[];
  onOpenTriggerModal: () => void;
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onOpenInspector: (nodeId: string) => void;
  onAddNode: (type: "message" | "choice", label?: string) => void;
  onDeleteNode: (nodeId: string) => void;
};

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
    <div className="relative mx-auto" style={{ width: 264 }}>
      {/* Side buttons */}
      <div className="absolute -left-[3px] top-[96px] h-8 w-[3px] rounded-l-sm bg-zinc-700" />
      <div className="absolute -left-[3px] top-[136px] h-14 w-[3px] rounded-l-sm bg-zinc-700" />
      <div className="absolute -left-[3px] top-[196px] h-14 w-[3px] rounded-l-sm bg-zinc-700" />
      <div className="absolute -right-[3px] top-[156px] h-20 w-[3px] rounded-r-sm bg-zinc-700" />

      {/* Phone body */}
      <div className="relative overflow-hidden rounded-[40px] border-[2px] border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60">
        {/* Screen */}
        <div className="relative flex flex-col bg-zinc-950" style={{ height: 540 }}>
          {/* Screen reflection */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent z-10" />

          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-3 z-20 flex h-[26px] w-[90px] -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-black">
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
            <div className="h-[5px] w-[5px] rounded-full bg-zinc-800" />
          </div>

          {/* Status Bar */}
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

          {/* Instagram DM Header */}
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/5 px-4 pb-3 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/5">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                  <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-zinc-950 bg-emerald-500" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-white leading-tight">Dein Flow</p>
                <p className="text-[10px] text-emerald-400">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-white">
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

          {/* Home Indicator */}
          <div className="absolute bottom-1.5 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-white/25" />
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
  onOpenTriggerModal,
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
  const [previewTop, setPreviewTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const simulatorNodeIdRef = useRef<string | null>(null);

  // Order nodes by flow path
  const orderedNodes = useMemo(() => buildFlowOrder(nodes, edges, startNodeIds), [nodes, edges, startNodeIds]);
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

  // Keep a ref of current simulator node for stable callbacks
  useEffect(() => {
    simulatorNodeIdRef.current = simulatorCurrentNodeId;
  }, [simulatorCurrentNodeId]);

  // Recalculate mockup position based on active simulator node
  const recalcPreviewPosition = useCallback(() => {
    const nodeId = simulatorNodeIdRef.current;
    if (!nodeId || !containerRef.current) return;
    const cardEl = nodeCardRefs.current.get(nodeId);
    if (!cardEl) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    setPreviewTop(Math.max(0, cardRect.top - containerRect.top));
  }, []);

  useEffect(() => {
    recalcPreviewPosition();
  }, [simulatorCurrentNodeId, recalcPreviewPosition]);

  // Scroll listener on the parent overflow-y-auto container
  useEffect(() => {
    if (!containerRef.current) return;
    const scrollEl = containerRef.current.parentElement;
    if (!scrollEl) return;
    scrollEl.addEventListener("scroll", recalcPreviewPosition, { passive: true });
    return () => scrollEl.removeEventListener("scroll", recalcPreviewPosition);
  }, [recalcPreviewPosition]);

  // Reset simulator tracking when preview closes
  useEffect(() => {
    if (!previewNodeId) {
      setSimulatorCurrentNodeId(null);
      setPreviewTop(0);
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
      const currentLabel = String(node.data?.label ?? "");
      const currentText = String(node.data?.text ?? "");
      const shouldUpdateLabel = currentLabel.trim().length === 0 || currentLabel === currentText;
      return {
        ...node,
        data: {
          ...node.data,
          text,
          ...(shouldUpdateLabel ? { label: text.slice(0, 40) || "Neue Nachricht" } : {}),
        },
      };
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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
          <MessageSquare className="h-10 w-10 text-indigo-400" />
        </div>
        <h3 className="mt-6 font-display text-2xl font-semibold text-white">
          Dein Flow ist noch leer
        </h3>
        <p className="mt-2 max-w-md text-center text-zinc-500">
          Erstelle deinen ersten Schritt, um mit dem Aufbau deines Konversations-Flows zu beginnen.
        </p>
        <button
          onClick={() => onAddNode("message", "Willkommen! Wie kann ich dir heute helfen?")}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25"
        >
          <Sparkles className="h-4 w-4" />
          Ersten Schritt erstellen
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-0 relative">
      {/* Left: node list — shrinks when preview is open */}
      <div ref={containerRef} className={`space-y-0 ${previewNodeId ? "flex-1 min-w-0" : "w-full"}`}>
      {/* Flow Header Stats */}
      <div className="mb-6 flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-white">{nodes.length}</span>
            <span className="text-zinc-500">Schritte</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
              <Flag className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-semibold text-white">{startNodeIds.size}</span>
            <span className="text-zinc-500">Startpunkte</span>
          </div>
        </div>
        <button
          onClick={() => onAddNode("message")}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
        >
          <Plus className="h-4 w-4" />
          Neuer Schritt
        </button>
      </div>

      {/* Flow Steps */}
      <div className="relative">
        {/* Vertical Connection Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/30 via-white/10 to-white/10" />

        {/* Trigger Card */}
        <div className="relative mb-4 ml-16">
          <div className="absolute -left-[52px] top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500 text-white">
            <Zap className="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={onOpenTriggerModal}
            className="relative w-full rounded-xl border-2 border-white/10 bg-zinc-900/50 p-4 text-left transition-all duration-200 hover:border-emerald-500/40 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">Trigger</h3>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                    {triggers.length}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Startpunkt der Unterhaltung – definiert, womit {labels.contactPlural} beginnen.
                </p>
                {triggerKeywords.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {triggerKeywords.slice(0, 5).map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-300"
                      >
                        {keyword}
                      </span>
                    ))}
                    {triggerKeywords.length > 5 ? (
                      <span className="text-xs text-zinc-500">
                        +{triggerKeywords.length - 5} weitere
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-400">
                    Noch keine Startwörter hinterlegt.
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-500" />
            </div>
          </button>
        </div>

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
            <div key={node.id} className="relative" data-node-id={node.id}>
              {/* Step Card */}
              <div
                ref={(el) => {
                  if (el) nodeCardRefs.current.set(node.id, el);
                  else nodeCardRefs.current.delete(node.id);
                }}
                className={`
                  relative ml-16 mb-4 rounded-xl border-2 bg-zinc-900/50 transition-all duration-300
                  ${isSimulatorActive
                    ? 'border-indigo-500 shadow-xl shadow-indigo-500/25 ring-2 ring-indigo-500/20'
                    : isSelected
                      ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'border-white/10 hover:border-white/20 hover:shadow-md'
                  }
                `}
              >
                {/* Step Number Circle */}
                <div
                  className={`
                    absolute -left-[52px] top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300
                    ${isSimulatorActive
                      ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/40'
                      : isStart
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isSelected
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'bg-zinc-800 border-zinc-600 text-zinc-400'
                    }
                  `}
                >
                  {isStart ? <Flag className="h-4 w-4" /> : index + 1}
                </div>

                {/* Card Header - Always Visible */}
                <div
                  onClick={() => toggleExpanded(node.id)}
                  className="flex cursor-pointer items-center gap-3 p-4"
                >
                  {/* Node Type Icon */}
                  <div className={`
                    flex h-10 w-10 items-center justify-center rounded-xl shrink-0
                    ${inputMode === 'free_text'
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    }
                  `}>
                    {inputMode === 'free_text'
                      ? <Keyboard className="h-5 w-5 text-white" />
                      : <MessageSquare className="h-5 w-5 text-white" />
                    }
                  </div>

                  {/* Title & Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">
                        {node.data?.label || "Ohne Titel"}
                      </h3>
                      {isStart && (
                        <span className="shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          Start
                        </span>
                      )}
                      {inputMode === 'free_text' && (
                        <span className="shrink-0 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-400">
                          {(() => {
                            const c = (node.data as any)?.collects;
                            if (!c || c === "__custom_empty__") return 'Freitext';
                            return collectsLabels[c] || c;
                          })()}
                        </span>
                      )}
                      {status.type === 'error' && (
                        <span className="shrink-0 text-amber-500" title={status.message}>
                          <AlertCircle className="h-4 w-4" />
                        </span>
                      )}
                      {status.type === 'end' && (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          Ende
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-500 truncate">
                      {node.data?.text || "Keine Nachricht"}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Inspect button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectNode(node.id); onOpenInspector(node.id); }}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/10 hover:text-white transition-colors"
                      title="Inspizieren"
                    >
                      <Settings2 className="h-4 w-4" />
                    </button>
                    {/* Preview button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = previewNodeId === node.id ? null : node.id;
                        setPreviewNodeId(next);
                        if (next) setSimulatorCurrentNodeId(next);
                      }}
                      className={`rounded-lg p-1.5 transition-colors ${
                        previewNodeId === node.id
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'text-zinc-500 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Vorschau"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {/* Expand arrow */}
                    <ChevronRight className={`h-5 w-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4 animate-fade-in-up">
                    {/* Message Text */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Nachricht
                      </label>
                      <textarea
                        value={node.data?.text || ""}
                        onChange={(e) => updateNodeText(node.id, e.target.value)}
                        placeholder="Was soll der Bot sagen?"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Response Type Toggle */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Wie antwortet der {labels.contactLabel}?
                      </label>
                      <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
                        <button
                          onClick={() => updateInputMode(node.id, "buttons")}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            inputMode === "buttons"
                              ? "bg-white/10 text-white shadow-sm"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Mit Buttons
                        </button>
                        <button
                          onClick={() => updateInputMode(node.id, "free_text")}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            inputMode === "free_text"
                              ? "bg-white/10 text-white shadow-sm"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          <Keyboard className="h-4 w-4" />
                          Freier Text
                        </button>
                      </div>
                    </div>

                    {/* Free Text Config */}
                    {inputMode === "free_text" && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3">
                        <p className="text-sm text-amber-400">
                          Der {labels.contactLabel} tippt seine Antwort frei ein.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-amber-300">
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
                                    className="flex-1 rounded-lg border border-amber-500/30 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => updateFreeTextMeta(node.id, "collects", "")}
                                    className="rounded-lg p-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
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
                            <label className="mb-1 block text-xs font-medium text-amber-300">
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
                          <div className="flex items-center gap-2 text-sm text-amber-400">
                            <ArrowRight className="h-4 w-4" />
                            <span>Weiter zu: <strong>{getNodeLabel(freeTextTarget)}</strong></span>
                          </div>
                        ) : (
                          <p className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                            <Flag className="h-3 w-3 shrink-0" />
                            Kein nächster Schritt – Konversation endet hier.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Buttons Config */}
                    {inputMode === "buttons" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Antwort-Buttons ({quickReplies.length})
                          </label>
                          <button
                            onClick={() => addQuickReply(node.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            Button
                          </button>
                        </div>

                        {quickReplies.length === 0 ? (
                          <div className="rounded-xl border-2 border-dashed border-white/20 p-6 text-center">
                            <p className="text-sm text-zinc-500">
                              Noch keine Buttons. Füge Buttons hinzu, damit der {labels.contactLabel} antworten kann.
                            </p>
                            <button
                              onClick={() => addQuickReply(node.id)}
                              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
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
                                className="group flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-800/50 p-3"
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                                  {replyIndex + 1}
                                </div>
                                <input
                                  type="text"
                                  value={reply.label}
                                  onChange={(e) => updateQuickReply(node.id, reply.id, { label: e.target.value })}
                                  placeholder="Button-Text"
                                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                                />
                                <ArrowRight className="h-4 w-4 text-zinc-500" />
                                <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">
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
                                  className="rounded-full p-1.5 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delete Button */}
                    <div className="pt-2 border-t border-white/10">
                      <button
                        onClick={() => onDeleteNode(node.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Schritt löschen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Connection Arrow between steps */}
              {!isLast && (
                <div className="absolute -left-[28px] bottom-0 translate-y-1/2 flex h-6 w-6 items-center justify-center">
                  <ArrowDown className="h-4 w-4 text-zinc-600" />
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Step at End */}
        <div className="relative ml-16">
          <div className="absolute -left-[52px] top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-zinc-600 bg-zinc-800">
            <Plus className="h-5 w-5 text-zinc-500" />
          </div>
          <button
            onClick={() => onAddNode("message")}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-white/5 py-6 text-sm font-semibold text-zinc-500 hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-400 transition-all"
          >
            <Plus className="h-5 w-5" />
            Weiteren Schritt hinzufügen
          </button>
        </div>
      </div>
    </div>

    {/* Right: preview panel — top-aligned with the active simulator node */}
      {previewNodeId && (
        <div className="w-[300px] shrink-0 pl-4">
          <div
            className="transition-[margin-top] duration-500 ease-out"
            style={{ marginTop: `${previewTop}px` }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Vorschau</p>
              <button onClick={() => setPreviewNodeId(null)}>
                <X className="h-4 w-4 text-zinc-400 hover:text-white transition-colors" />
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
