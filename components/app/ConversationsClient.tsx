"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { MessageCircle, User, Clock, ChevronRight, X, Bot, ArrowLeft } from "lucide-react";

interface Conversation {
  id: string;
  instagram_sender_id: string;
  status: string;
  current_flow_id: string | null;
  current_node_id: string | null;
  metadata: {
    variables?: Record<string, string>;
    reservationId?: string;
  } | null;
  contacts: {
    id: string;
    display_name: string | null;
  } | null;
  last_message_at: string | null;
  created_at: string;
  flows: {
    id: string;
    name: string;
  } | null;
}

interface Message {
  id: string;
  direction: "incoming" | "outgoing";
  message_type: string;
  content: string;
  quick_reply_payload: string | null;
  flow_id: string | null;
  node_id: string | null;
  created_at: string;
  flows: {
    id: string;
    name: string;
  } | null;
}

export default function ConversationsClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setError("Bitte erneut anmelden.");
        return;
      }

      const response = await fetch("/api/conversations?limit=50", {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError("Fehler beim Laden der Konversationen");
        return;
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch {
      setError("Fehler beim Laden der Konversationen");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setMessagesLoading(true);

      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/conversations/${conversationId}/messages?limit=200`, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("Failed to load messages");
        return;
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    loadMessages(conv.id);
  };

  const handleCloseMessages = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConversationName = (conv: Conversation) =>
    conv.contacts?.display_name ||
    conv.metadata?.variables?.name ||
    conv.instagram_sender_id;

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl">
        <div className="flex items-center justify-center text-zinc-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-500"></div>
          <span className="ml-3">Lade Konversationen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8">
        <p className="text-rose-400">{error}</p>
        <button
          onClick={loadConversations}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  // Message detail view
  if (selectedConversation) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseMessages}
              className="rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-500" />
                <span className="font-medium text-white">
                  {getConversationName(selectedConversation)}
                </span>
              </div>
              {selectedConversation.contacts?.display_name && (
                <div className="text-xs text-zinc-500">
                  IG: {selectedConversation.instagram_sender_id}
                </div>
              )}
              {selectedConversation.flows && (
                <div className="text-xs text-zinc-400">
                  Flow: {selectedConversation.flows.name}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleCloseMessages}
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Variables summary */}
        {selectedConversation.metadata?.variables && Object.keys(selectedConversation.metadata.variables).length > 0 && (
          <div className="border-b border-white/10 bg-indigo-500/10 px-6 py-3">
            <div className="mb-1 text-xs font-medium text-indigo-400">Extrahierte Daten:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedConversation.metadata.variables).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded-lg bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="h-[500px] space-y-4 overflow-y-auto p-6">
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-500"></div>
              <span className="ml-3">Lade Nachrichten...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-zinc-400">
              Keine Nachrichten gefunden
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === "incoming" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.direction === "incoming"
                      ? "bg-white/10 text-zinc-200"
                      : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    {msg.direction === "incoming" ? (
                      <User className="h-3 w-3 opacity-60" />
                    ) : (
                      <Bot className="h-3 w-3 opacity-60" />
                    )}
                    <span className="text-xs opacity-60">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap break-words">{msg.content || "(Kein Text)"}</div>
                  {msg.quick_reply_payload && (
                    <div className="mt-1 text-xs opacity-60">
                      Payload: {msg.quick_reply_payload}
                    </div>
                  )}
                  {msg.node_id && (
                    <div className="mt-1 text-xs opacity-60">
                      Node: {msg.node_id}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-zinc-400">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
          <p className="text-white">Noch keine Konversationen</p>
          <p className="mt-2 text-sm">
            Konversationen erscheinen hier, sobald Kunden über Instagram schreiben.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv)}
              className="group flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                  <User className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <div className="font-medium text-white">
                    {getConversationName(conv)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    {conv.flows && (
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {conv.flows.name}
                      </span>
                    )}
                    {conv.contacts?.display_name && (
                      <span className="text-zinc-500">
                        IG: {conv.instagram_sender_id}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(conv.last_message_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                    conv.status === "active"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-500/10 text-zinc-400"
                  }`}
                >
                  {conv.status === "active" ? "Aktiv" : "Geschlossen"}
                </span>
                <ChevronRight className="h-5 w-5 text-zinc-600 transition-colors group-hover:text-zinc-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
