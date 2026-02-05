"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Node, Edge } from "reactflow";
import { RotateCcw, Send, MessageCircle, User, Play, AlertCircle } from "lucide-react";
import type { FlowQuickReply, FlowTrigger } from "../../lib/flowTypes";

type SimulatorMessage = {
  id: string;
  type: "bot" | "user";
  text: string;
  imageUrl?: string;
  quickReplies?: FlowQuickReply[];
  nodeId?: string;
};

type FlowSimulatorProps = {
  nodes: Node[];
  edges: Edge[];
  triggers: FlowTrigger[];
  onNodeSelect?: (nodeId: string) => void;
};

export default function FlowSimulator({
  nodes,
  edges,
  triggers,
  onNodeSelect,
}: FlowSimulatorProps) {
  const [messages, setMessages] = useState<SimulatorMessage[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Find the start node from triggers or fallback to first node
  const startNodeId = useMemo(() => {
    if (triggers.length > 0 && triggers[0].startNodeId) {
      return triggers[0].startNodeId;
    }
    // Fallback: Find node with type "input" or the first node
    const inputNode = nodes.find((n) => n.type === "input");
    return inputNode?.id || nodes[0]?.id || null;
  }, [triggers, nodes]);

  const findNode = useCallback(
    (nodeId: string) => nodes.find((n) => n.id === nodeId),
    [nodes]
  );

  const findOutgoingEdges = useCallback(
    (nodeId: string) => edges.filter((e) => e.source === nodeId),
    [edges]
  );

  const deriveInputMode = useCallback(
    (node?: Node) => {
      if (!node) return "buttons" as const;
      const configured = (node.data as any)?.inputMode as "buttons" | "free_text" | undefined;
      if (configured) return configured;
      const quickReplies = (node.data?.quickReplies || []) as FlowQuickReply[];
      if (quickReplies.length > 0) return "buttons" as const;
      const hasFreeTextEdge = edges.some(
        (edge) => edge.source === node.id && !(edge.data as any)?.quickReplyId,
      );
      return hasFreeTextEdge ? ("free_text" as const) : ("buttons" as const);
    },
    [edges],
  );

  const getEffectiveQuickReplies = useCallback(
    (node?: Node) => {
      const inputMode = deriveInputMode(node);
      if (inputMode === "free_text") return [] as FlowQuickReply[];
      return (node?.data?.quickReplies || []) as FlowQuickReply[];
    },
    [deriveInputMode],
  );

  const currentNode = useMemo(
    () => (currentNodeId ? findNode(currentNodeId) : undefined),
    [currentNodeId, findNode],
  );

  const currentPlaceholder = useMemo(() => {
    const raw = (currentNode?.data as any)?.placeholder;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw;
    }
    return "Antwort eingeben...";
  }, [currentNode]);

  const executeNode = useCallback(
    (nodeId: string) => {
      const node = findNode(nodeId);
      if (!node) return;

      const quickReplies = getEffectiveQuickReplies(node);

      const botMessage: SimulatorMessage = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: node.data?.text || node.data?.label || "...",
        imageUrl: node.data?.imageUrl || undefined,
        quickReplies: quickReplies.filter((qr) => qr.targetNodeId),
        nodeId,
      };

      setMessages((prev) => [...prev, botMessage]);
      setCurrentNodeId(nodeId);

      // Highlight the node in the editor
      if (onNodeSelect) {
        onNodeSelect(nodeId);
      }
    },
    [findNode, getEffectiveQuickReplies, onNodeSelect]
  );

  const handleStart = useCallback(() => {
    if (!startNodeId) return;
    setMessages([]);
    setIsStarted(true);
    executeNode(startNodeId);
  }, [startNodeId, executeNode]);

  const handleReset = useCallback(() => {
    setMessages([]);
    setCurrentNodeId(null);
    setIsStarted(false);
    setUserInput("");
  }, []);

  const handleQuickReplyClick = useCallback(
    (qr: FlowQuickReply) => {
      if (!qr.targetNodeId) return;

      // Add user message
      const userMessage: SimulatorMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: qr.label,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Execute next node with small delay for visual effect
      setTimeout(() => {
        executeNode(qr.targetNodeId!);
      }, 300);
    },
    [executeNode]
  );

  const handleFreeTextSubmit = useCallback(() => {
    if (!userInput.trim() || !currentNodeId) return;

    // Add user message
    const userMessage: SimulatorMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: userInput.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");

    // Find next node (if current node has no quick replies, follow first edge)
    const currentNode = findNode(currentNodeId);
    const quickReplies = getEffectiveQuickReplies(currentNode);

    if (quickReplies.length === 0) {
      const outgoing = findOutgoingEdges(currentNodeId).filter(
        (edge) => !(edge.data as any)?.quickReplyId,
      );
      if (outgoing.length > 0) {
        setTimeout(() => {
          executeNode(outgoing[0].target);
        }, 300);
      }
    }
  }, [userInput, currentNodeId, findNode, findOutgoingEdges, executeNode, getEffectiveQuickReplies]);

  // Check if the flow has ended (no more outgoing edges or quick replies)
  const isFlowEnded = useMemo(() => {
    if (!currentNodeId) return false;
    const currentNode = findNode(currentNodeId);
    const quickReplies = getEffectiveQuickReplies(currentNode);
    const inputMode = deriveInputMode(currentNode);
    const outgoing = findOutgoingEdges(currentNodeId).filter(
      (edge) =>
        inputMode !== "free_text" || !(edge.data as any)?.quickReplyId,
    );
    return (
      outgoing.length === 0 &&
      quickReplies.filter((qr) => qr.targetNodeId).length === 0
    );
  }, [currentNodeId, findNode, findOutgoingEdges, deriveInputMode, getEffectiveQuickReplies]);

  // Check if flow has no start node
  const hasNoStartNode = !startNodeId;

  // Check if current node expects free text (no quick replies, has outgoing edge)
  const expectsFreeText = useMemo(() => {
    if (!currentNodeId || isFlowEnded) return false;
    const currentNode = findNode(currentNodeId);
    const quickReplies = getEffectiveQuickReplies(currentNode);
    const inputMode = deriveInputMode(currentNode);
    const outgoing = findOutgoingEdges(currentNodeId).filter(
      (edge) =>
        inputMode !== "free_text" || !(edge.data as any)?.quickReplyId,
    );
    return inputMode === "free_text" && quickReplies.length === 0 && outgoing.length > 0;
  }, [currentNodeId, isFlowEnded, findNode, findOutgoingEdges, deriveInputMode, getEffectiveQuickReplies]);

  return (
    <div className="flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <p className="text-sm font-semibold text-zinc-300">Chat-Simulation</p>
        {isStarted && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-indigo-400 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Neustart
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {hasNoStartNode ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <p className="text-sm text-zinc-500">
              Kein Start-Node gefunden. Erstelle einen Trigger oder einen
              Start-Node.
            </p>
          </div>
        ) : !isStarted ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-zinc-500 text-center px-4">
              Teste deinen Flow ohne echte Instagram-Verbindung.
            </p>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              <Play className="h-4 w-4" />
              Simulation starten
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    msg.type === "user"
                      ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
                      : "bg-zinc-800 text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.type === "bot" ? (
                      <MessageCircle className="h-3 w-3 text-zinc-500" />
                    ) : (
                      <User className="h-3 w-3 text-white/70" />
                    )}
                    <span className="text-[10px] uppercase tracking-wide opacity-60">
                      {msg.type === "bot" ? "Service" : "Du"}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                  {msg.imageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageUrl}
                        alt="Anhang"
                        className="max-h-32 w-auto object-cover"
                      />
                    </div>
                  )}

                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr.id}
                          onClick={() => handleQuickReplyClick(qr)}
                          disabled={msg.id !== messages[messages.length - 1]?.id}
                          className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-white/20 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isFlowEnded && (
              <div className="text-center py-4">
                <p className="text-xs text-zinc-500 mb-2">
                  -- Flow beendet --
                </p>
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Erneut testen
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {isStarted && !isFlowEnded && expectsFreeText && (
        <div className="pt-3 border-t border-white/10">
          <div className="flex gap-2">
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleFreeTextSubmit();
                }
              }}
              placeholder={currentPlaceholder}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
            />
            <button
              onClick={handleFreeTextSubmit}
              disabled={!userInput.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 p-2 text-white hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 text-center">
            Dieser Node erwartet eine Texteingabe
          </p>
        </div>
      )}
    </div>
  );
}
