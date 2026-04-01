"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import {
  ArrowLeft,
  Bot,
  Clock3,
  MessageCircle,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import useAccountVertical from "../../lib/useAccountVertical";
import { getBookingLabels } from "../../lib/verticals";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

interface Conversation {
  id: string;
  instagram_sender_id: string | null;
  channel_sender_id: string | null;
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

const getStatusBadge = (status: string) => {
  if (status === "active") return <Badge variant="success">Aktiv</Badge>;
  return <Badge variant="neutral">Geschlossen</Badge>;
};

export default function ConversationsClient() {
  const { vertical } = useAccountVertical();
  const labels = getBookingLabels(vertical);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">(
    "all",
  );

  const getAccessToken = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return null;
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
        setError("Fehler beim Laden der Konversationen.");
        return;
      }

      const data = await response.json();
      const nextConversations = data.conversations || [];
      setConversations(nextConversations);
      setSelectedConversation((current) => {
        if (!current) return current;
        return (
          nextConversations.find((item: Conversation) => item.id === current.id) ??
          null
        );
      });
    } catch {
      setError("Fehler beim Laden der Konversationen.");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      try {
        setMessagesLoading(true);

        const token = await getAccessToken();
        if (!token) return;

        const response = await fetch(
          `/api/conversations/${conversationId}/messages?limit=200`,
          {
            headers: { authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          setError("Nachrichten konnten nicht geladen werden.");
          return;
        }

        const data = await response.json();
        setMessages(data.messages || []);
      } catch {
        setError("Nachrichten konnten nicht geladen werden.");
      } finally {
        setMessagesLoading(false);
      }
    },
    [getAccessToken],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleCloseMessages = () => {
    setSelectedConversation(null);
    setMessages([]);
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Kein Zeitstempel";
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

  const getConversationName = (conversation: Conversation) =>
    conversation.contacts?.display_name ||
    conversation.metadata?.variables?.name ||
    "Instagram Nutzer";

  const filteredConversations = useMemo(() => {
    return conversations
      .filter((conversation) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          getConversationName(conversation).toLowerCase().includes(query) ||
          conversation.flows?.name?.toLowerCase().includes(query)
        );
      })
      .filter((conversation) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return conversation.status === "active";
        return conversation.status !== "active";
      })
      .sort((a, b) => {
        const aTime = new Date(a.last_message_at || a.created_at).getTime();
        const bTime = new Date(b.last_message_at || b.created_at).getTime();
        return bTime - aTime;
      });
  }, [conversations, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const active = conversations.filter((item) => item.status === "active").length;
    const withFlow = conversations.filter((item) => item.flows).length;
    return {
      total: conversations.length,
      active,
      closed: conversations.length - active,
      withFlow,
    };
  }, [conversations]);

  const selectedVariables = selectedConversation?.metadata?.variables
    ? Object.entries(selectedConversation.metadata.variables)
    : [];

  if (loading) {
    return (
      <div className="app-panel p-8">
        <div className="space-y-5">
          <div className="h-4 w-28 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="h-3 w-20 animate-pulse rounded bg-[#E2E8F0]" />
                <div className="mt-4 h-8 w-14 animate-pulse rounded bg-[#E2E8F0]" />
              </div>
            ))}
          </div>
          <div className="h-[420px] animate-pulse rounded-xl bg-[#F8FAFC]" />
        </div>
      </div>
    );
  }

  if (error && conversations.length === 0) {
    return (
      <div className="app-panel p-8">
        <EmptyState
          icon={MessageCircle}
          title="Konversationen konnten nicht geladen werden"
          description={error}
          action={
            <Button onClick={loadConversations}>
              <RefreshCw className="h-4 w-4" />
              Erneut versuchen
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 app-page-enter">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            key: "total",
            label: "Alle Threads",
            value: stats.total,
            description: "Sichtbare Konversationen im Postfach",
            tone: "bg-[#DBEAFE] text-[#2563EB]",
            icon: MessageCircle,
          },
          {
            key: "active",
            label: "Aktiv",
            value: stats.active,
            description: "Aktuell offene Gespraeche",
            tone: "bg-[#D1FAE5] text-[#047857]",
            icon: Clock3,
          },
          {
            key: "closed",
            label: "Geschlossen",
            value: stats.closed,
            description: "Bereits abgeschlossene Threads",
            tone: "bg-[#E2E8F0] text-[#475569]",
            icon: X,
          },
          {
            key: "flows",
            label: "Mit Flow-Bezug",
            value: stats.withFlow,
            description: "Konversationen mit aktivem Ablauf",
            tone: "bg-[#E0F2FE] text-[#0369A1]",
            icon: Bot,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="app-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-[#94A3B8]">
                    {item.label}
                  </p>
                  <p
                    className="mt-3 text-[28px] font-bold text-[#0F172A]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {item.value.toLocaleString("de-DE")}
                  </p>
                </div>
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    item.tone,
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#475569]">
                {item.description}
              </p>
            </div>
          );
        })}
      </section>

      <section className="app-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] px-6 py-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge variant="accent">Inbox</Badge>
            <h2 className="mt-3 text-lg font-semibold text-[#0F172A]">
              Nachrichtenverlauf und Flow-Kontext
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[#475569]">
              Pruefe, welche {labels.contactPlural.toLowerCase()} geschrieben
              haben, welcher Flow zuletzt aktiv war und welche Informationen aus
              der Unterhaltung extrahiert wurden.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex min-h-[42px] min-w-[240px] items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={`${labels.contactLabel} oder Flow suchen`}
                className="app-input min-h-0 border-0 bg-transparent p-0 shadow-none focus:border-0 focus:shadow-none"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | "active" | "closed",
                )
              }
              className="app-select min-w-[160px]"
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="closed">Geschlossen</option>
            </select>

            <Button variant="secondary" onClick={loadConversations}>
              <RefreshCw className="h-4 w-4" />
              Aktualisieren
            </Button>
          </div>
        </div>

        {error ? (
          <div className="border-b border-[#FECACA] bg-[#FEF2F2] px-6 py-3 text-sm text-[#B91C1C]">
            {error}
          </div>
        ) : null}

        <div className="grid min-h-[620px] lg:grid-cols-[360px_minmax(0,1fr)]">
          <div
            className={[
              "border-r border-[#E2E8F0] bg-[#F8FAFC]",
              selectedConversation ? "hidden lg:block" : "block",
            ].join(" ")}
          >
            {filteredConversations.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={MessageCircle}
                  title="Keine Konversationen gefunden"
                  description={`Konversationen erscheinen hier, sobald ${labels.contactPlural.toLowerCase()} ueber Instagram schreiben.`}
                />
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {filteredConversations.map((conversation) => {
                  const isActive = selectedConversation?.id === conversation.id;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation)}
                      className={[
                        "w-full py-4 text-left transition-colors",
                        isActive
                          ? "border-l-2 border-[#2563EB] bg-white pl-[calc(1.25rem-2px)] pr-5"
                          : "border-l-2 border-transparent pl-[calc(1.25rem-2px)] pr-5 hover:bg-white/80",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB]">
                              <User className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#0F172A]">
                                {getConversationName(conversation)}
                              </p>
                              <p className="mt-1 truncate text-xs text-[#64748B]">
                                {conversation.flows?.name || "Kein aktiver Flow"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {getStatusBadge(conversation.status)}
                            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748B]">
                              <Clock3 className="h-3 w-3" />
                              {formatDateTime(
                                conversation.last_message_at || conversation.created_at,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={selectedConversation ? "block" : "hidden lg:block"}>
            {selectedConversation ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-[#E2E8F0] px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Button
                        variant="ghost"
                        className="lg:hidden"
                        onClick={handleCloseMessages}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Zurueck
                      </Button>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[#0F172A]">
                            {getConversationName(selectedConversation)}
                          </h3>
                          {getStatusBadge(selectedConversation.status)}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#475569]">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4 text-[#94A3B8]" />
                            {formatDateTime(
                              selectedConversation.last_message_at ||
                                selectedConversation.created_at,
                            )}
                          </span>
                          {selectedConversation.flows ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#EFF6FF] px-2 py-1 text-xs font-medium text-[#1D4ED8]">
                              <Bot className="h-3.5 w-3.5" />
                              {selectedConversation.flows.name}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <Button variant="secondary" onClick={() => loadMessages(selectedConversation.id)}>
                      <RefreshCw className="h-4 w-4" />
                      Verlauf neu laden
                    </Button>
                  </div>

                  {selectedVariables.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedVariables.map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#1D4ED8]"
                        >
                          <span className="uppercase tracking-[0.08em] text-[#2563EB]">
                            {key}
                          </span>
                          <span className="text-[#1E3A8A]">{value}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-6 py-6">
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                      Nachrichten werden geladen...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <EmptyState
                        icon={MessageCircle}
                        title="Keine Nachrichten gefunden"
                        description="Fuer diese Konversation wurden noch keine Nachrichten geladen."
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const incoming = message.direction === "incoming";
                        return (
                          <div
                            key={message.id}
                            className={[
                              "flex",
                              incoming ? "justify-start" : "justify-end",
                            ].join(" ")}
                          >
                            <div
                              className={[
                                "max-w-[85%] rounded-[18px] px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:max-w-[72%]",
                                incoming
                                  ? "border border-[#E2E8F0] bg-white text-[#0F172A]"
                                  : "bg-[#2563EB] text-white",
                              ].join(" ")}
                            >
                              <div
                                className={[
                                  "mb-2 flex items-center gap-2 text-xs",
                                  incoming ? "text-[#64748B]" : "text-blue-100",
                                ].join(" ")}
                              >
                                {incoming ? (
                                  <User className="h-3.5 w-3.5" />
                                ) : (
                                  <Bot className="h-3.5 w-3.5" />
                                )}
                                <span>{formatTime(message.created_at)}</span>
                                {message.flows?.name ? (
                                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]">
                                    {message.flows.name}
                                  </span>
                                ) : null}
                              </div>

                              <div className="whitespace-pre-wrap break-words text-sm leading-6">
                                {message.content || "(Kein Text)"}
                              </div>

                              {message.quick_reply_payload ? (
                                <div
                                  className={[
                                    "mt-3 rounded-md px-3 py-2 text-xs",
                                    incoming
                                      ? "bg-[#F8FAFC] text-[#64748B]"
                                      : "bg-blue-500/30 text-blue-50",
                                  ].join(" ")}
                                >
                                  Payload: {message.quick_reply_payload}
                                </div>
                              ) : null}

                              {message.node_id ? (
                                <div
                                  className={[
                                    "mt-2 text-[11px]",
                                    incoming ? "text-[#94A3B8]" : "text-blue-100",
                                  ].join(" ")}
                                >
                                  Node: {message.node_id}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 py-12">
                <EmptyState
                  icon={MessageCircle}
                  title="Waehle eine Konversation"
                  description="Im Detailbereich siehst du Nachrichtenverlauf, Flow-Kontext und extrahierte Variablen."
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
