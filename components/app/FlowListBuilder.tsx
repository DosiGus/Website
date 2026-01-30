'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import { Node, Edge } from "reactflow";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  GripVertical,
  MessageCircle,
  Plus,
  Settings,
  Trash2,
  X,
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

type Section = {
  id: string;
  name: string;
  icon: "message" | "info" | "settings";
  nodeIds: string[];
};

// Intelligently group nodes into sections based on their labels and connections
function detectSections(nodes: Node[], edges: Edge[]): Section[] {
  if (nodes.length === 0) return [];

  const sections: Section[] = [];
  const assignedNodes = new Set<string>();

  // Keywords to detect section types
  const reservationKeywords = ["reserv", "datum", "uhrzeit", "zeit", "person", "gäste", "name", "telefon", "bestätig", "zusammenfassung"];
  const infoKeywords = ["info", "öffnungszeiten", "speisekarte", "menu", "preis", "adresse", "kontakt"];
  const endKeywords = ["bestätigt", "abgebrochen", "fertig", "danke", "abschluss", "cancelled", "confirmed"];

  // Helper to check if node matches keywords
  const matchesKeywords = (node: Node, keywords: string[]): boolean => {
    const label = (node.data?.label || "").toLowerCase();
    const text = (node.data?.text || "").toLowerCase();
    return keywords.some(k => label.includes(k) || text.includes(k));
  };

  // Find reservation flow nodes
  const reservationNodes = nodes.filter(n =>
    !assignedNodes.has(n.id) && matchesKeywords(n, reservationKeywords)
  );
  if (reservationNodes.length > 0) {
    reservationNodes.forEach(n => assignedNodes.add(n.id));
    sections.push({
      id: "reservation",
      name: "Reservierungsablauf",
      icon: "message",
      nodeIds: reservationNodes.map(n => n.id),
    });
  }

  // Find info nodes
  const infoNodes = nodes.filter(n =>
    !assignedNodes.has(n.id) && matchesKeywords(n, infoKeywords)
  );
  if (infoNodes.length > 0) {
    infoNodes.forEach(n => assignedNodes.add(n.id));
    sections.push({
      id: "info",
      name: "Informationen",
      icon: "info",
      nodeIds: infoNodes.map(n => n.id),
    });
  }

  // Find end/confirmation nodes
  const endNodes = nodes.filter(n =>
    !assignedNodes.has(n.id) && matchesKeywords(n, endKeywords)
  );
  if (endNodes.length > 0) {
    endNodes.forEach(n => assignedNodes.add(n.id));
    sections.push({
      id: "end",
      name: "Abschluss",
      icon: "settings",
      nodeIds: endNodes.map(n => n.id),
    });
  }

  // Remaining nodes go to "Start & Sonstiges"
  const remainingNodes = nodes.filter(n => !assignedNodes.has(n.id));
  if (remainingNodes.length > 0) {
    sections.unshift({
      id: "main",
      name: "Start & Begrüßung",
      icon: "message",
      nodeIds: remainingNodes.map(n => n.id),
    });
  }

  // If all nodes ended up unassigned, create a single section
  if (sections.length === 0) {
    return [{
      id: "main",
      name: "Alle Schritte",
      icon: "message",
      nodeIds: nodes.map(n => n.id),
    }];
  }

  return sections;
}

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
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Detect sections based on node content
  const sections = useMemo(() => detectSections(nodes, edges), [nodes, edges]);

  useEffect(() => {
    if (!selectedNodeId) return;
    const section = sections.find((item) => item.nodeIds.includes(selectedNodeId));
    if (!section) return;
    setCollapsedSections((prev) => {
      if (!prev.has(section.id)) return prev;
      const next = new Set(prev);
      next.delete(section.id);
      return next;
    });
    requestAnimationFrame(() => {
      const element = document.querySelector(`[data-node-id="${selectedNodeId}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [selectedNodeId, sections]);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const getNodeById = useCallback((nodeId: string) => {
    return nodes.find(n => n.id === nodeId);
  }, [nodes]);

  const syncEdgesForNode = useCallback((nodeId: string, replies: FlowQuickReply[]) => {
    let next = edges
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
              tone: ((edge.data as any)?.tone as string) ?? "neutral",
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
          label: reply.label,
        });
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
          ...(shouldUpdateLabel
            ? { label: text.slice(0, 40) || "Neue Nachricht" }
            : {}),
        },
      };
    });
    onNodesChange(updatedNodes);
  }, [nodes, onNodesChange, syncEdgesForNode]);

  const addQuickReply = useCallback((nodeId: string) => {
    let updatedReplies: FlowQuickReply[] = [];
    const updatedNodes = nodes.map(node => {
      if (node.id !== nodeId) return node;
      const currentReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
      const newReply: FlowQuickReply = {
        id: `qr-${Date.now()}`,
        label: "Neue Option",
        payload: "",
        targetNodeId: null,
      };
      updatedReplies = [...currentReplies, newReply];
      return {
        ...node,
        data: {
          ...node.data,
          quickReplies: updatedReplies,
        },
      };
    });
    onNodesChange(updatedNodes);
    if (updatedReplies.length > 0) {
      syncEdgesForNode(nodeId, updatedReplies);
    }
  }, [nodes, onNodesChange, syncEdgesForNode]);

  const updateQuickReply = useCallback((nodeId: string, replyId: string, updates: Partial<FlowQuickReply>) => {
    let updatedReplies: FlowQuickReply[] = [];
    const updatedNodes = nodes.map(node => {
      if (node.id !== nodeId) return node;
      const currentReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
      updatedReplies = currentReplies.map(r =>
        r.id === replyId ? { ...r, ...updates } : r
      );
      return {
        ...node,
        data: { ...node.data, quickReplies: updatedReplies },
      };
    });
    onNodesChange(updatedNodes);
    if (updatedReplies.length > 0) {
      syncEdgesForNode(nodeId, updatedReplies);
    }
  }, [nodes, onNodesChange, syncEdgesForNode]);

  const removeQuickReply = useCallback((nodeId: string, replyId: string) => {
    let updatedReplies: FlowQuickReply[] = [];
    const updatedNodes = nodes.map(node => {
      if (node.id !== nodeId) return node;
      const currentReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
      updatedReplies = currentReplies.filter(r => r.id !== replyId);
      return {
        ...node,
        data: {
          ...node.data,
          quickReplies: updatedReplies,
        },
      };
    });
    onNodesChange(updatedNodes);
    syncEdgesForNode(nodeId, updatedReplies);
  }, [nodes, onNodesChange]);

  const getSectionIcon = (icon: Section["icon"]) => {
    switch (icon) {
      case "info":
        return <FolderOpen className="h-4 w-4" />;
      case "settings":
        return <Settings className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8">
        <MessageCircle className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-slate-700">Dein Flow ist noch leer</h3>
        <p className="mt-2 text-center text-sm text-slate-500">
          Füge deinen ersten Schritt hinzu, um zu starten.
        </p>
        <button
          onClick={() => onAddNode("message")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30"
        >
          <Plus className="h-4 w-4" />
          Ersten Schritt hinzufügen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{nodes.length}</span>
          <span className="text-slate-500">Schritte</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{sections.length}</span>
          <span className="text-slate-500">Bereiche</span>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => onAddNode("message")}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Schritt
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const isCollapsed = collapsedSections.has(section.id);
        const sectionNodes = section.nodeIds.map(getNodeById).filter(Boolean) as Node[];

        return (
          <div key={section.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-slate-400">{getSectionIcon(section.icon)}</span>
              <span className="font-semibold text-slate-700">{section.name}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {sectionNodes.length}
              </span>
            </button>

            {/* Section Content */}
            {!isCollapsed && (
              <div className="border-t border-slate-100 p-4 space-y-3">
                {sectionNodes.map((node) => {
                  const quickReplies = (node.data?.quickReplies ?? []) as FlowQuickReply[];
                  const isSelected = selectedNodeId === node.id;

                  return (
                    <div
                      key={node.id}
                      onClick={() => onSelectNode(node.id)}
                      data-node-id={node.id}
                      className={`group relative rounded-xl border p-4 transition cursor-pointer ${
                        isSelected
                          ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                          : "border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-white"
                      }`}
                    >
                      {/* Step Header */}
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          •
                        </span>
                        <span className="text-sm font-semibold text-slate-700 truncate flex-1">
                          {node.data?.label || "Ohne Titel"}
                        </span>
                        {startNodeIds.has(node.id) && (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                            Start
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNode(node.id);
                          }}
                          className="rounded-full p-1.5 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                          title="Schritt löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Message Content */}
                      <textarea
                        value={node.data?.text || ""}
                        onChange={(e) => updateNodeText(node.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Nachricht eingeben..."
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                        rows={2}
                      />

                      {/* Quick Replies */}
                      {quickReplies.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Antwort-Buttons
                          </p>
                          {quickReplies.map((reply) => (
                            <div
                              key={reply.id}
                              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={reply.label}
                                onChange={(e) => updateQuickReply(node.id, reply.id, { label: e.target.value })}
                                placeholder="Button-Text"
                                className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:border-brand focus:outline-none"
                              />
                              <select
                                value={reply.targetNodeId || ""}
                                onChange={(e) => updateQuickReply(node.id, reply.id, { targetNodeId: e.target.value || null })}
                                className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:border-brand focus:outline-none"
                              >
                                <option value="">Ziel wählen...</option>
                                {nodes.filter(n => n.id !== node.id).map((n) => (
                                  <option key={n.id} value={n.id}>
                                    {n.data?.label || "Ohne Titel"}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => removeQuickReply(node.id, reply.id)}
                                className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addQuickReply(node.id);
                        }}
                        className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark"
                      >
                        <Plus className="h-3 w-3" />
                        Button hinzufügen
                      </button>
                    </div>
                  );
                })}

                {/* Add step to section */}
                <button
                  onClick={() => onAddNode("message")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-400 transition hover:border-brand hover:text-brand"
                >
                  <Plus className="h-4 w-4" />
                  Schritt hinzufügen
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
