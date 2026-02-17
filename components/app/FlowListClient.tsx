'use client';

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Search, Star, Trash2, Pencil, Check, X, AlertTriangle, CheckCircle } from "lucide-react";
import type { Edge, Node } from "reactflow";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { lintFlow } from "../../lib/flowLint";
import type { FlowMetadata, FlowTrigger } from "../../lib/flowTypes";
import useAccountVertical from "../../lib/useAccountVertical";
import { getBookingLabels } from "../../lib/verticals";

type FlowSummary = {
  id: string;
  name: string;
  status: string;
  updated_at: string;
  nodes: Node[];
  edges: Edge[];
  triggers?: FlowTrigger[];
  metadata?: FlowMetadata;
};

type FlowStatus = "Aktiv" | "Entwurf";
type FlowFilter = "all" | FlowStatus | "Favoriten" | "Warnungen" | "Valide";

type Props = {
  variant: "grid" | "table";
  statusFilterOverride?: FlowStatus;
  showReservationCounts?: boolean;
};

type ReservationCountRow = {
  flow_id: string | null;
};

type PendingAction = { id: string; type: "duplicate" | "template" | "delete" } | null;

export default function FlowListClient({
  variant,
  statusFilterOverride,
  showReservationCounts = false,
}: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FlowFilter>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reservationCounts, setReservationCounts] = useState<Record<string, number>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const lastStatusParamRef = useRef<string | null>(null);
  const { vertical } = useAccountVertical();
  const labels = getBookingLabels(vertical);

  useEffect(() => {
    const stored = localStorage.getItem("wesponde-flow-favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wesponde-flow-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;
    async function loadFlows() {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setFlows([]);
        setLoading(false);
        return;
      }
      const response = await fetch(`/api/flows`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        setFlows([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setFlows(data);
      setLoading(false);
    }
    loadFlows();
  }, [userId, supabase]);

  useEffect(() => {
    if (statusFilterOverride) return;

    const statusParam = searchParams.get("status");
    if (statusParam === lastStatusParamRef.current) return;
    lastStatusParamRef.current = statusParam;

    if (!statusParam) {
      setStatusFilter("all");
      return;
    }

    const normalized = statusParam.toLowerCase();
    let nextStatus: FlowFilter | null = null;

    if (normalized === "aktiv") nextStatus = "Aktiv";
    if (normalized === "entwurf") nextStatus = "Entwurf";
    if (normalized === "favoriten") nextStatus = "Favoriten";
    if (normalized === "warnungen") nextStatus = "Warnungen";
    if (normalized === "valide") nextStatus = "Valide";
    if (normalized === "all") nextStatus = "all";

    if (nextStatus && nextStatus !== statusFilter) {
      setStatusFilter(nextStatus);
    }
  }, [searchParams, statusFilter, statusFilterOverride]);

  useEffect(() => {
    if (!showReservationCounts) {
      setReservationCounts({});
      return;
    }

    const flowIds = flows
      .filter((flow) =>
        statusFilterOverride ? flow.status === statusFilterOverride : true
      )
      .map((flow) => flow.id);

    if (!flowIds.length) {
      setReservationCounts({});
      return;
    }

    let cancelled = false;

    async function loadReservationCounts() {
      const { data, error } = await supabase
        .from("reservations")
        .select("flow_id")
        .in("flow_id", flowIds);

      if (cancelled) return;

      if (error) {
        console.error("Failed to load reservation counts:", error);
        setReservationCounts({});
        return;
      }

      const counts: Record<string, number> = {};
      (data as ReservationCountRow[] | null)?.forEach((row) => {
        if (!row.flow_id) return;
        counts[row.flow_id] = (counts[row.flow_id] ?? 0) + 1;
      });
      setReservationCounts(counts);
    }

    loadReservationCounts();

    return () => {
      cancelled = true;
    };
  }, [flows, showReservationCounts, statusFilterOverride, supabase]);

  const flowsWithWarnings = useMemo(
    () =>
      flows.map((flow) => {
        const lint = lintFlow(flow.nodes ?? [], flow.edges ?? [], flow.triggers ?? []);
        return {
          ...flow,
          warningCount: lint.warnings.length,
        };
      }),
    [flows],
  );

  const effectiveStatusFilter: FlowFilter =
    statusFilterOverride ?? statusFilter;

  const filteredFlows = useMemo(() => {
    const matchesFilter = (flow: FlowSummary & { warningCount: number }) => {
      switch (effectiveStatusFilter) {
        case "all":
          return true;
        case "Aktiv":
        case "Entwurf":
          return flow.status === effectiveStatusFilter;
        case "Favoriten":
          return favorites.includes(flow.id);
        case "Warnungen":
          return flow.warningCount > 0;
        case "Valide":
          return flow.warningCount === 0;
        default:
          return true;
      }
    };

    return flowsWithWarnings
      .filter((flow) =>
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .filter((flow) => matchesFilter(flow))
      .sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav === bFav) return 0;
        return aFav ? -1 : 1;
      });
  }, [flowsWithWarnings, searchQuery, effectiveStatusFilter, favorites]);

  const toggleFavorite = (flowId: string) => {
    setFavorites((prev) =>
      prev.includes(flowId) ? prev.filter((id) => id !== flowId) : [...prev, flowId],
    );
  };

  const duplicateFlow = async (flowId: string) => {
    setPendingAction({ id: flowId, type: "duplicate" });
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }
    const baseResponse = await fetch(`/api/flows/${flowId}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    if (!baseResponse.ok) {
      setPendingAction(null);
      setError("Flow konnte nicht dupliziert werden.");
      return;
    }
    const baseFlow = await baseResponse.json();
    const response = await fetch("/api/flows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: `${baseFlow.name} Kopie`,
        nodes: baseFlow.nodes,
        edges: baseFlow.edges,
        triggers: baseFlow.triggers,
        metadata: baseFlow.metadata,
      }),
    });
    setPendingAction(null);
    if (response.ok) {
      router.refresh();
    } else {
      setError("Duplizieren fehlgeschlagen.");
    }
  };

  const saveAsTemplate = async (flowId: string, name: string) => {
    setPendingAction({ id: flowId, type: "template" });
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }
    const response = await fetch("/api/templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        flowId,
        name: `${name} Preset`,
        vertical: "Benutzerdefiniert",
        description: "Aus bestehendem Flow gespeichert.",
      }),
    });
    setPendingAction(null);
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Template konnte nicht erstellt werden.");
      return;
    }
    router.refresh();
  };

  const deleteFlow = async (flowId: string) => {
    setPendingAction({ id: flowId, type: "delete" });
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }
    const response = await fetch(`/api/flows/${flowId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    setPendingAction(null);
    setDeleteConfirmId(null);
    if (response.ok) {
      setFlows((prev) => prev.filter((f) => f.id !== flowId));
    } else {
      setError("Flow konnte nicht gelöscht werden.");
    }
  };

  const startEditing = (flow: FlowSummary) => {
    setEditingFlowId(flow.id);
    setEditingName(flow.name);
  };

  const cancelEditing = () => {
    setEditingFlowId(null);
    setEditingName("");
  };

  const saveFlowName = async (flowId: string) => {
    if (!editingName.trim()) {
      setError("Name darf nicht leer sein.");
      return;
    }
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }

    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;

    const response = await fetch(`/api/flows/${flowId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: editingName.trim(),
        status: flow.status,
        nodes: flow.nodes,
        edges: flow.edges,
        triggers: flow.triggers,
        metadata: flow.metadata,
      }),
    });

    if (response.ok) {
      setFlows((prev) =>
        prev.map((f) =>
          f.id === flowId ? { ...f, name: editingName.trim() } : f
        )
      );
      setEditingFlowId(null);
      setEditingName("");
    } else {
      setError("Name konnte nicht gespeichert werden.");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6 text-sm text-zinc-400">
        Flows werden geladen …
      </div>
    );
  }

  if (!filteredFlows.length) {
    const emptyMessage = searchQuery
      ? "Keine Flows gefunden."
      : effectiveStatusFilter === "Aktiv"
        ? "Noch keine aktiven Flows vorhanden."
        : effectiveStatusFilter === "Entwurf"
          ? "Noch keine Entwürfe vorhanden."
          : effectiveStatusFilter === "Favoriten"
            ? "Noch keine Favoriten markiert."
            : effectiveStatusFilter === "Warnungen"
              ? "Keine Flows mit Warnungen."
              : effectiveStatusFilter === "Valide"
                ? "Keine validen Flows gefunden."
                : "Noch keine Flows vorhanden.";

    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-zinc-900/30 p-8 text-center text-sm text-zinc-400">
        {emptyMessage}{" "}
        <Link href="/app/flows/new" className="font-semibold text-indigo-400 hover:text-indigo-300">
          Erstelle den ersten Flow.
        </Link>
      </div>
    );
  }

  const renderWarningPill = (count: number) =>
    count > 0 ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        {count} Warnung{count > 1 ? "en" : ""}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Valide
      </span>
    );

  const filterControls = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
        <Search className="h-4 w-4 text-zinc-500" />
        <input
          className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          placeholder="Flows durchsuchen..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>
      {!statusFilterOverride ? (
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as FlowFilter)}
          className="app-select"
        >
          <option value="all">Status filtern</option>
          <option value="Aktiv">Aktive</option>
          <option value="Entwurf">Entwürfe</option>
          <option value="Favoriten">Favoriten</option>
          <option value="Warnungen">Mit Warnungen</option>
          <option value="Valide">Ohne Warnungen</option>
        </select>
      ) : null}
    </div>
  );

  if (variant === "grid") {
    return (
      <div className="space-y-4">
        {filterControls}
        {error ? (
          <p className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm font-medium text-rose-400">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredFlows.map((flow) => (
            <div
              key={flow.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 p-5 transition-all hover:border-white/20 hover:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    flow.status === "Aktiv"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-500/10 text-zinc-400"
                  }`}>
                    {flow.status}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-white">{flow.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Zuletzt aktualisiert {new Date(flow.updated_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(flow.id)}
                  className={`rounded-lg border p-2 transition-all ${
                    favorites.includes(flow.id)
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-white"
                  }`}
                  title="Favorit"
                >
                  <Star className="h-4 w-4" fill={favorites.includes(flow.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                {renderWarningPill(flow.warningCount)}
                <span className="text-zinc-600">•</span>
                <span>{flow.nodes.length} Nodes · {flow.edges.length} Verbindungen</span>
                {showReservationCounts ? (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span>
                      {(reservationCounts[flow.id] ?? 0).toLocaleString("de-DE")} {labels.bookingPlural}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/app/flows/${flow.id}`}
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-center text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25"
                >
                  Flow öffnen
                </Link>
                <button
                  onClick={() => duplicateFlow(flow.id)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10"
                  disabled={pendingAction?.id === flow.id && pendingAction.type === "duplicate"}
                >
                  <Copy className="h-4 w-4" />
                  {pendingAction?.id === flow.id && pendingAction.type === "duplicate"
                    ? "..."
                    : "Kopie"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50">
      <div className="px-6 pt-5">
        {filterControls}
        {error ? (
          <p className="mt-3 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm font-medium text-rose-400">
            {error}
          </p>
        ) : null}
      </div>
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Name</th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Qualität</th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Aktualisiert</th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {filteredFlows.map((flow) => (
            <tr key={flow.id} className="transition-colors hover:bg-white/5">
              <td className="whitespace-nowrap px-6 py-4 font-medium text-white">
                {editingFlowId === flow.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveFlowName(flow.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="rounded-lg border border-indigo-500/50 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      autoFocus
                    />
                    <button
                      onClick={() => saveFlowName(flow.id)}
                      className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10"
                      title="Speichern"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10"
                      title="Abbrechen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="group/name flex items-center gap-2">
                    <span>{flow.name}</span>
                    <button
                      onClick={() => startEditing(flow)}
                      className="rounded-lg p-1 text-zinc-500 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover/name:opacity-100"
                      title="Namen bearbeiten"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    flow.status === "Aktiv"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-zinc-500/10 text-zinc-400"
                  }`}
                >
                  {flow.status}
                </span>
              </td>
              <td className="px-6 py-4">{renderWarningPill(flow.warningCount)}</td>
              <td className="px-6 py-4 text-zinc-400">
                {new Date(flow.updated_at).toLocaleDateString("de-DE")}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/app/flows/${flow.id}`}
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                  >
                    Öffnen →
                  </Link>
                  <button
                    onClick={() => duplicateFlow(flow.id)}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-white/20 hover:bg-white/10"
                    disabled={pendingAction?.id === flow.id && pendingAction.type === "duplicate"}
                  >
                    <Copy className="h-3 w-3" />
                    Kopie
                  </button>
                  <button
                    onClick={() => toggleFavorite(flow.id)}
                    className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium ${
                      favorites.includes(flow.id)
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border-white/10 text-zinc-400 hover:border-white/20"
                    }`}
                  >
                    <Star className="h-3 w-3" fill={favorites.includes(flow.id) ? "currentColor" : "none"} />
                  </button>
                  {deleteConfirmId === flow.id ? (
                    <>
                      <button
                        onClick={() => deleteFlow(flow.id)}
                        disabled={pendingAction?.id === flow.id && pendingAction.type === "delete"}
                        className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
                      >
                        {pendingAction?.id === flow.id && pendingAction.type === "delete"
                          ? "..."
                          : "Löschen"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-white/10"
                      >
                        Abbrechen
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(flow.id)}
                      className="flex items-center gap-1 rounded-lg border border-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
