'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Node, Edge } from "reactflow";
import {
  ArrowDown,
  ChevronRight,
  Flag,
  GripVertical,
  Keyboard,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
  X,
  ArrowRight,
  Check,
  AlertCircle,
} from "lucide-react";
import type { FlowQuickReply } from "../../lib/flowTypes";

type FlowListBuilderProps = {
  nodes: Node[];
  edges: Edge[];
  startNodeIds: Set<string>;
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
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

const buildFreeTextDefaults = (label?: string) => {
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
    return { text: "Für wie viele Personen?", collects: "guestCount", placeholder: "z. B. 4" };
  }
  return { text: "Bitte gib deine Antwort ein.", collects: "", placeholder: "Antwort eingeben…" };
};

const COLLECTS_LABELS: Record<string, string> = {
  name: "Name",
  date: "Datum",
  time: "Uhrzeit",
  guestCount: "Personen",
  phone: "Telefon",
  email: "E-Mail",
  specialRequests: "Wünsche",
};

export default function FlowListBuilder({
  nodes,
  edges,
  startNodeIds,
  onNodesChange,
  onEdgesChange,
  selectedNodeId,
  onSelectNode,
  onAddNode,
  onDeleteNode,
}: FlowListBuilderProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Order nodes by flow path
  const orderedNodes = useMemo(() => buildFlowOrder(nodes, edges, startNodeIds), [nodes, edges, startNodeIds]);

  // Auto-expand selected node
  useEffect(() => {
    if (selectedNodeId) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        next.add(selectedNodeId);
        return next;
      });
      // Scroll to node
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-node-id="${selectedNodeId}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [selectedNodeId]);

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
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
                const defaults = buildFreeTextDefaults((node.data?.label as string) ?? "");
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
  }, [nodes, onNodesChange]);

  const updateFreeTextMeta = useCallback((nodeId: string, field: "placeholder" | "collects", value: string) => {
    const updatedNodes = nodes.map(node =>
      node.id === nodeId ? { ...node, data: { ...node.data, [field]: value } } : node
    );
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange]);

  const buildFreeTextNode = useCallback((label?: string) => {
    const defaults = buildFreeTextDefaults(label);
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
  }, [nodes.length]);

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

  // Check if node has issues (no connections)
  const nodeHasIssue = useCallback((node: Node) => {
    const inputMode = deriveInputMode(node, edges);
    const quickReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];

    if (inputMode === "buttons" && quickReplies.length === 0) {
      return "Keine Antwort-Optionen definiert";
    }
    if (inputMode === "free_text" && !getFreeTextTarget(node.id)) {
      return "Kein nächster Schritt definiert";
    }
    return null;
  }, [edges, getFreeTextTarget]);

  // Empty State
  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
          <MessageSquare className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mt-6 font-display text-2xl font-semibold italic text-slate-900">
          Dein Flow ist noch leer
        </h3>
        <p className="mt-2 max-w-md text-center text-slate-500">
          Erstelle deinen ersten Schritt, um mit dem Aufbau deines Konversations-Flows zu beginnen.
        </p>
        <button
          onClick={() => onAddNode("message", "Willkommen! Wie kann ich dir heute helfen?")}
          className="btn-press mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30"
        >
          <Sparkles className="h-4 w-4" />
          Ersten Schritt erstellen
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-0">
      {/* Flow Header Stats */}
      <div className="mb-6 flex items-center justify-between rounded-xl bg-white border border-slate-200 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-slate-900">{nodes.length}</span>
            <span className="text-slate-500">Schritte</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <Flag className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="font-semibold text-slate-900">{startNodeIds.size}</span>
            <span className="text-slate-500">Startpunkte</span>
          </div>
        </div>
        <button
          onClick={() => onAddNode("message")}
          className="btn-press inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-shadow"
        >
          <Plus className="h-4 w-4" />
          Neuer Schritt
        </button>
      </div>

      {/* Flow Steps */}
      <div className="relative">
        {/* Vertical Connection Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/20 via-slate-200 to-slate-200" />

        {orderedNodes.map((node, index) => {
          const isStart = startNodeIds.has(node.id);
          const isSelected = selectedNodeId === node.id;
          const isExpanded = expandedNodes.has(node.id);
          const inputMode = deriveInputMode(node, edges);
          const quickReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
          const freeTextTarget = getFreeTextTarget(node.id);
          const issue = nodeHasIssue(node);
          const isLast = index === orderedNodes.length - 1;

          return (
            <div key={node.id} className="relative" data-node-id={node.id}>
              {/* Step Card */}
              <div
                className={`
                  relative ml-16 mb-4 rounded-xl border-2 bg-white transition-all duration-200
                  ${isSelected
                    ? 'border-primary shadow-lg shadow-primary/10'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }
                `}
              >
                {/* Step Number Circle */}
                <div
                  className={`
                    absolute -left-[52px] top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold
                    ${isStart
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-slate-300 text-slate-600'
                    }
                  `}
                >
                  {isStart ? <Flag className="h-4 w-4" /> : index + 1}
                </div>

                {/* Card Header - Always Visible */}
                <div
                  onClick={() => {
                    onSelectNode(node.id);
                    toggleExpanded(node.id);
                  }}
                  className="flex cursor-pointer items-center gap-3 p-4"
                >
                  {/* Node Type Icon */}
                  <div className={`
                    flex h-10 w-10 items-center justify-center rounded-xl
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
                      <h3 className="font-semibold text-slate-900 truncate">
                        {node.data?.label || "Ohne Titel"}
                      </h3>
                      {isStart && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Start
                        </span>
                      )}
                      {inputMode === 'free_text' && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {(node.data as any)?.collects ? COLLECTS_LABELS[(node.data as any).collects] || 'Freitext' : 'Freitext'}
                        </span>
                      )}
                      {issue && (
                        <span className="shrink-0 text-amber-500" title={issue}>
                          <AlertCircle className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500 truncate">
                      {node.data?.text || "Keine Nachricht"}
                    </p>
                  </div>

                  {/* Expand Arrow */}
                  <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 space-y-4 animate-fade-in-up">
                    {/* Message Text */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Nachricht
                      </label>
                      <textarea
                        value={node.data?.text || ""}
                        onChange={(e) => updateNodeText(node.id, e.target.value)}
                        placeholder="Was soll der Bot sagen?"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-colors resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Response Type Toggle */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Wie antwortet der Kunde?
                      </label>
                      <div className="flex rounded-xl bg-slate-100 p-1">
                        <button
                          onClick={() => updateInputMode(node.id, "buttons")}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            inputMode === "buttons"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Mit Buttons
                        </button>
                        <button
                          onClick={() => updateInputMode(node.id, "free_text")}
                          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                            inputMode === "free_text"
                              ? "bg-white text-slate-900 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Keyboard className="h-4 w-4" />
                          Freier Text
                        </button>
                      </div>
                    </div>

                    {/* Free Text Config */}
                    {inputMode === "free_text" && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                        <p className="text-sm text-amber-800">
                          Der Kunde tippt seine Antwort frei ein.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-amber-900">
                              Dieses Feld sammelt
                            </label>
                            <select
                              value={(node.data as any)?.collects ?? ""}
                              onChange={(e) => updateFreeTextMeta(node.id, "collects", e.target.value)}
                              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            >
                              <option value="">Keine Zuordnung</option>
                              <option value="name">Name</option>
                              <option value="date">Datum</option>
                              <option value="time">Uhrzeit</option>
                              <option value="guestCount">Personenanzahl</option>
                              <option value="phone">Telefonnummer</option>
                              <option value="email">E-Mail-Adresse</option>
                              <option value="specialRequests">Besondere Wünsche</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-amber-900">
                              Danach weiter zu
                            </label>
                            <select
                              value={freeTextTarget}
                              onChange={(e) => setFreeTextTarget(node.id, e.target.value)}
                              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            >
                              <option value="">Schritt wählen…</option>
                              {nodes.filter(n => n.id !== node.id).map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.data?.label || "Ohne Titel"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {freeTextTarget && (
                          <div className="flex items-center gap-2 text-sm text-amber-800">
                            <ArrowRight className="h-4 w-4" />
                            <span>Weiter zu: <strong>{getNodeLabel(freeTextTarget)}</strong></span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Buttons Config */}
                    {inputMode === "buttons" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Antwort-Buttons ({quickReplies.length})
                          </label>
                          <button
                            onClick={() => addQuickReply(node.id)}
                            className="btn-press inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            Button
                          </button>
                        </div>

                        {quickReplies.length === 0 ? (
                          <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                            <p className="text-sm text-slate-500">
                              Noch keine Buttons. Füge Buttons hinzu, damit der Kunde antworten kann.
                            </p>
                            <button
                              onClick={() => addQuickReply(node.id)}
                              className="btn-press mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors"
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
                                className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                                  {replyIndex + 1}
                                </div>
                                <input
                                  type="text"
                                  value={reply.label}
                                  onChange={(e) => updateQuickReply(node.id, reply.id, { label: e.target.value })}
                                  placeholder="Button-Text"
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                />
                                <ArrowRight className="h-4 w-4 text-slate-400" />
                                <select
                                  value={reply.targetNodeId || ""}
                                  onChange={(e) => handleQuickReplyTargetChange(node.id, reply.id, e.target.value, reply.label)}
                                  className="w-36 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none"
                                >
                                  <option value="">Ziel wählen…</option>
                                  <option value="__NEW_FREETEXT__">+ Neuer Freitext</option>
                                  {nodes.filter(n => n.id !== node.id).map((n) => (
                                    <option key={n.id} value={n.id}>
                                      {n.data?.label || "Ohne Titel"}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => removeQuickReply(node.id, reply.id)}
                                  className="rounded-full p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition-all"
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
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => onDeleteNode(node.id)}
                        className="btn-press w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
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
                  <ArrowDown className="h-4 w-4 text-slate-300" />
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Step at End */}
        <div className="relative ml-16">
          <div className="absolute -left-[52px] top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white">
            <Plus className="h-5 w-5 text-slate-400" />
          </div>
          <button
            onClick={() => onAddNode("message")}
            className="btn-press w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-6 text-sm font-semibold text-slate-500 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
          >
            <Plus className="h-5 w-5" />
            Weiteren Schritt hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}
