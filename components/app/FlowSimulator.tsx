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
  onCurrentNodeChange?: (nodeId: string) => void;
  startNodeId?: string;
  autoStart?: boolean;
  hideHeader?: boolean;
};

export default function FlowSimulator({
  nodes,
  edges,
  triggers,
  onNodeSelect,
  onCurrentNodeChange,
  startNodeId: startNodeIdProp,
  autoStart,
  hideHeader,
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

  // Derive start node from triggers or fallback to first node
  const derivedStartNodeId = useMemo(() => {
    if (triggers.length > 0 && triggers[0].startNodeId) {
      return triggers[0].startNodeId;
    }
    // Fallback: Find node with type "input" or the first node
    const inputNode = nodes.find((n) => n.type === "input");
    return inputNode?.id || nodes[0]?.id || null;
  }, [triggers, nodes]);

  // Prop override takes precedence over trigger-derived start node
  const effectiveStartNodeId = startNodeIdProp ?? derivedStartNodeId;

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
      if (onCurrentNodeChange) {
        onCurrentNodeChange(nodeId);
      }
    },
    [findNode, getEffectiveQuickReplies, onNodeSelect, onCurrentNodeChange]
  );

  const handleStart = useCallback(() => {
    if (!effectiveStartNodeId) return;
    setMessages([]);
    setIsStarted(true);
    executeNode(effectiveStartNodeId);
  }, [effectiveStartNodeId, executeNode]);

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

  // Auto-start (and restart when startNodeId prop changes)
  useEffect(() => {
    if (!autoStart) return;
    handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, startNodeIdProp]);

  // Check if flow has no start node
  const hasNoStartNode = !effectiveStartNodeId;

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

  const isDarkPreview = Boolean(hideHeader);

  return (
    <div className={`flex flex-col ${hideHeader ? "flex-1 min-h-0" : "h-[400px]"}`}>
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <p className="text-sm font-semibold text-[#0F172A]">Chat-Simulation</p>
          {isStarted && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-semibold text-[#475569] transition-colors hover:text-[#2563EB]"
            >
              <RotateCcw className="h-3 w-3" />
              Neustart
            </button>
          )}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto space-y-2.5 px-3 py-3 no-scrollbar ${hideHeader ? "bg-transparent" : "bg-[#F8FAFC]"}`}>
        {hasNoStartNode ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-[#D97706]" />
            <p className={`text-sm ${isDarkPreview ? "text-white/65" : "text-[#64748B]"}`}>
              Kein Start-Node gefunden. Erstelle einen Trigger oder einen
              Start-Node.
            </p>
          </div>
        ) : !isStarted ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className={`px-4 text-center text-sm ${isDarkPreview ? "text-white/65" : "text-[#64748B]"}`}>
              Teste deinen Flow ohne echte Instagram-Verbindung.
            </p>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 rounded-full bg-[#2450b2] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_2px_16px_rgba(0,0,0,0.18)] transition-all hover:bg-[#1a46c4]"
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
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                    msg.type === "user"
                      ? isDarkPreview
                        ? "rounded-br-md bg-[linear-gradient(135deg,#4F5BD5_0%,#833AB4_45%,#C13584_100%)] text-white shadow-[0_8px_20px_rgba(131,58,180,0.34)]"
                        : "rounded-tr-sm bg-[#2563EB] text-white"
                      : isDarkPreview
                        ? "rounded-tl-md border border-[#3A3A41] bg-[#2B2B31] text-[#F4F4F5] shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
                        : "rounded-tl-sm border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm"
                  }`}
                >
                  {!hideHeader && (
                    <div className="flex items-center gap-2 mb-1">
                      {msg.type === "bot" ? (
                        <MessageCircle className="h-3 w-3 text-[#64748B]" />
                      ) : (
                        <User className="h-3 w-3 text-white/70" />
                      )}
                      <span className="text-[10px] uppercase tracking-wide opacity-60">
                        {msg.type === "bot" ? "Service" : "Du"}
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>

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
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr.id}
                          onClick={() => handleQuickReplyClick(qr)}
                          disabled={msg.id !== messages[messages.length - 1]?.id}
                          className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            isDarkPreview
                              ? "border-[#5A5A62] bg-[#3A3A40] text-[#F5F5F7] hover:bg-[#44444D]"
                              : "border-[#DBEAFE] bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]"
                          }`}
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
                <p className={`mb-2 text-xs ${isDarkPreview ? "text-white/45" : "text-[#64748B]"}`}>
                  -- Flow beendet --
                </p>
                <button
                  onClick={handleReset}
                  className={`text-xs font-semibold transition-colors ${
                    isDarkPreview ? "text-white/75 hover:text-white" : "text-[#2563EB] hover:text-[#1D4ED8]"
                  }`}
                >
                  Erneut testen
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {isStarted && !isFlowEnded && expectsFreeText && (
        <div className={`border-t ${hideHeader ? "border-white/10 px-3 py-3" : "border-[#E2E8F0] pt-3"}`}>
          <div className="flex items-center gap-2.5">
            {hideHeader && (
              <div className="flex min-h-[46px] flex-1 items-center rounded-full border border-[#2F3137] bg-[#1A1B20] px-4 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                <input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleFreeTextSubmit(); }
                  }}
                  placeholder={currentPlaceholder}
                  className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#7C7F89] focus:outline-none"
                />
              </div>
            )}
            {!hideHeader && (
              <input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleFreeTextSubmit(); }
                }}
                placeholder={currentPlaceholder}
                className="flex-1 rounded-md border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-[#DBEAFE]"
              />
            )}
            <button
              onClick={handleFreeTextSubmit}
              disabled={!userInput.trim()}
              className={`${hideHeader ? "rounded-full bg-[#0095F6] p-2.5" : "rounded-md bg-[#2563EB] p-2"} text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${hideHeader ? "hover:bg-[#1877F2]" : "hover:bg-[#1D4ED8]"}`}
            >
              <Send className={`${hideHeader ? "h-4 w-4" : "h-3.5 w-3.5"}`} />
            </button>
          </div>
          {!hideHeader && (
            <p className="mt-2 text-center text-[10px] text-[#64748B]">
              Dieser Node erwartet eine Texteingabe
            </p>
          )}
        </div>
      )}
    </div>
  );
}
