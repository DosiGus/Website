"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Node, Edge } from "reactflow";
import { RotateCcw, Send, Bot, User, Play, AlertCircle } from "lucide-react";
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

  const executeNode = useCallback(
    (nodeId: string) => {
      const node = findNode(nodeId);
      if (!node) return;

      const quickReplies = (node.data?.quickReplies || []) as FlowQuickReply[];

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
    [findNode, onNodeSelect]
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
    const quickReplies = (currentNode?.data?.quickReplies ||
      []) as FlowQuickReply[];

    if (quickReplies.length === 0) {
      const outgoing = findOutgoingEdges(currentNodeId);
      if (outgoing.length > 0) {
        setTimeout(() => {
          executeNode(outgoing[0].target);
        }, 300);
      }
    }
  }, [userInput, currentNodeId, findNode, findOutgoingEdges, executeNode]);

  // Check if the flow has ended (no more outgoing edges or quick replies)
  const isFlowEnded = useMemo(() => {
    if (!currentNodeId) return false;
    const currentNode = findNode(currentNodeId);
    const quickReplies = (currentNode?.data?.quickReplies ||
      []) as FlowQuickReply[];
    const outgoing = findOutgoingEdges(currentNodeId);
    return (
      outgoing.length === 0 &&
      quickReplies.filter((qr) => qr.targetNodeId).length === 0
    );
  }, [currentNodeId, findNode, findOutgoingEdges]);

  // Check if flow has no start node
  const hasNoStartNode = !startNodeId;

  // Check if current node expects free text (no quick replies, has outgoing edge)
  const expectsFreeText = useMemo(() => {
    if (!currentNodeId || isFlowEnded) return false;
    const currentNode = findNode(currentNodeId);
    const quickReplies = (currentNode?.data?.quickReplies ||
      []) as FlowQuickReply[];
    const outgoing = findOutgoingEdges(currentNodeId);
    return quickReplies.length === 0 && outgoing.length > 0;
  }, [currentNodeId, isFlowEnded, findNode, findOutgoingEdges]);

  return (
    <div className="flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <p className="text-sm font-semibold text-slate-600">Chat-Simulation</p>
        {isStarted && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand transition-colors"
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
            <p className="text-sm text-slate-500">
              Kein Start-Node gefunden. Erstelle einen Trigger oder einen
              Start-Node.
            </p>
          </div>
        ) : !isStarted ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-sm text-slate-500 text-center px-4">
              Teste deinen Flow ohne echte Instagram-Verbindung.
            </p>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
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
                      ? "bg-brand text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.type === "bot" ? (
                      <Bot className="h-3 w-3 text-slate-400" />
                    ) : (
                      <User className="h-3 w-3 text-white/70" />
                    )}
                    <span className="text-[10px] uppercase tracking-wide opacity-60">
                      {msg.type === "bot" ? "Bot" : "Du"}
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
                          className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-xs text-slate-400 mb-2">
                  -- Flow beendet --
                </p>
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-brand hover:text-brand/80 transition-colors"
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
        <div className="pt-3 border-t border-slate-200">
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
              placeholder="Antwort eingeben..."
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
            />
            <button
              onClick={handleFreeTextSubmit}
              disabled={!userInput.trim()}
              className="rounded-full bg-brand p-2 text-white hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Dieser Node erwartet eine Texteingabe
          </p>
        </div>
      )}
    </div>
  );
}
