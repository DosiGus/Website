'use client';

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  Search,
  Star,
  Trash2,
  Pencil,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  Zap,
} from "lucide-react";
import type { Edge, Node } from "reactflow";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { lintFlow } from "../../lib/flowLint";
import type { FlowMetadata, FlowTrigger } from "../../lib/flowTypes";
import useAccountVertical from "../../lib/useAccountVertical";
import { getBookingLabels } from "../../lib/verticals";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import DataTable, { type DataTableColumn } from "../ui/DataTable";
import EmptyState from "../ui/EmptyState";

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

type PendingAction = { id: string; type: "template" | "delete" } | null;

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
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("wesponde-flow-favorites");
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [reservationCounts, setReservationCounts] = useState<Record<string, number>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
const [priorityUpdating, setPriorityUpdating] = useState<string | null>(null);
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const lastStatusParamRef = useRef<string | null>(null);
  const { vertical } = useAccountVertical();
  const labels = getBookingLabels(vertical);

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
        const lint = lintFlow(
          flow.nodes ?? [],
          flow.edges ?? [],
          flow.triggers ?? [],
          flow.metadata,
        );
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
        if (aFav !== bFav) return aFav ? -1 : 1;
        const aPriority = (a.metadata as any)?.priority ?? 999;
        const bPriority = (b.metadata as any)?.priority ?? 999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return b.updated_at.localeCompare(a.updated_at);
      });
  }, [flowsWithWarnings, searchQuery, effectiveStatusFilter, favorites]);

  const toggleFavorite = (flowId: string) => {
    setFavorites((prev) =>
      prev.includes(flowId) ? prev.filter((id) => id !== flowId) : [...prev, flowId],
    );
  };

  // Clear selection when search/filter changes
  useEffect(() => {
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
  }, [searchQuery, statusFilter]);


  // Active flows sorted by priority — used for rank badges and up/down controls.
  const activeFlowsSortedByPriority = useMemo(
    () =>
      [...flows]
        .filter((f) => f.status === "Aktiv")
        .sort((a, b) => {
          const ap = (a.metadata as any)?.priority ?? 999;
          const bp = (b.metadata as any)?.priority ?? 999;
          return ap - bp;
        }),
    [flows],
  );

  const priorityRankOf = (flowId: string): number =>
    activeFlowsSortedByPriority.findIndex((f) => f.id === flowId) + 1;

  const movePriority = async (flowId: string, direction: -1 | 1) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const rank = priorityRankOf(flowId);
    const swapRank = rank + direction;
    if (swapRank < 1 || swapRank > activeFlowsSortedByPriority.length) return;

    const flowA = activeFlowsSortedByPriority[rank - 1];
    const flowB = activeFlowsSortedByPriority[swapRank - 1];
    const newPriorityA = swapRank;
    const newPriorityB = rank;

    // Optimistic update
    setFlows((prev) =>
      prev.map((f) => {
        if (f.id === flowA.id)
          return { ...f, metadata: { ...(f.metadata ?? { version: "1" }), priority: newPriorityA } };
        if (f.id === flowB.id)
          return { ...f, metadata: { ...(f.metadata ?? { version: "1" }), priority: newPriorityB } };
        return f;
      }),
    );

    setPriorityUpdating(flowId);
    try {
      await Promise.all([
        fetch(`/api/flows/${flowA.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: flowA.name,
            status: flowA.status,
            nodes: flowA.nodes,
            edges: flowA.edges,
            triggers: flowA.triggers ?? [],
            metadata: { ...(flowA.metadata ?? { version: "1" }), priority: newPriorityA },
          }),
        }),
        fetch(`/api/flows/${flowB.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: flowB.name,
            status: flowB.status,
            nodes: flowB.nodes,
            edges: flowB.edges,
            triggers: flowB.triggers ?? [],
            metadata: { ...(flowB.metadata ?? { version: "1" }), priority: newPriorityB },
          }),
        }),
      ]);
    } catch {
      setError("Priorität konnte nicht gespeichert werden.");
      // Reload to reset optimistic update
      const reloadResp = await fetch("/api/flows", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (reloadResp.ok) setFlows(await reloadResp.json());
    } finally {
      setPriorityUpdating(null);
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { router.replace("/login"); return; }

    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/flows/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      )
    );

    const succeeded = ids.filter(
      (_, i) =>
        results[i].status === "fulfilled" &&
        (results[i] as PromiseFulfilledResult<Response>).value.ok
    );
    const failedCount = ids.length - succeeded.length;

    setFlows((prev) => prev.filter((f) => !succeeded.includes(f.id)));
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    setBulkDeleting(false);

    if (failedCount > 0) {
      setError(`${failedCount} Flow${failedCount > 1 ? "s" : ""} konnte nicht gelöscht werden.`);
    }
  };

  const toggleFlowStatus = async (flow: FlowSummary) => {
    const newStatus: FlowStatus = flow.status === "Aktiv" ? "Entwurf" : "Aktiv";
    setError(null);

    if (newStatus === "Aktiv") {
      const lintResult = lintFlow(
        flow.nodes ?? [],
        flow.edges ?? [],
        flow.triggers ?? [],
        flow.metadata,
      );
      const blockingWarnings = lintResult.warnings.filter(
        (warning) => warning.severity === "warning",
      );

      if (blockingWarnings.length > 0) {
        const firstWarning = blockingWarnings[0]?.message;
        setError(
          blockingWarnings.length === 1
            ? `"${flow.name}" kann nicht live gestellt werden. Bitte behebe zuerst: ${firstWarning}.`
            : `"${flow.name}" kann nicht live gestellt werden, weil noch ${blockingWarnings.length} Probleme offen sind. Bitte starte mit: ${firstWarning}.`,
        );
        return;
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }

    setStatusUpdating(flow.id);
    setFlows((prev) => prev.map((f) => f.id === flow.id ? { ...f, status: newStatus } : f));

    try {
      const response = await fetch(`/api/flows/${flow.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: flow.name,
          status: newStatus,
          nodes: flow.nodes,
          edges: flow.edges,
          triggers: flow.triggers ?? [],
          metadata: flow.metadata,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null) as
          | { error?: string; code?: string; warnings?: { message?: string }[] }
          | null;
        const serverWarnings = Array.isArray(body?.warnings) ? body.warnings : [];
        const firstServerWarning = serverWarnings[0]?.message;

        if (response.status === 401) {
          router.replace("/login");
        } else if (body?.code === "LINT_FAILED") {
          setError(
            firstServerWarning
              ? `"${flow.name}" kann nicht live gestellt werden. Bitte behebe zuerst: ${firstServerWarning}.`
              : body?.error ?? `"${flow.name}" kann nicht live gestellt werden, weil noch Fehler offen sind.`,
          );
        } else if (body?.error) {
          setError(body.error);
        } else if (response.status === 409) {
          setError("Dieser Flow wurde in einem anderen Tab geändert. Bitte lade die Liste neu.");
        } else {
          setError("Status konnte nicht geändert werden.");
        }

        setFlows((prev) => prev.map((f) => f.id === flow.id ? { ...f, status: flow.status } : f));
        return;
      }

      const body = await response.json().catch(() => null) as
        | { updated_at?: string }
        | null;
      if (body?.updated_at) {
        setFlows((prev) =>
          prev.map((f) =>
            f.id === flow.id ? { ...f, updated_at: body.updated_at ?? f.updated_at } : f,
          ),
        );
      }
    } catch {
      setFlows((prev) => prev.map((f) => f.id === flow.id ? { ...f, status: flow.status } : f));
      setError("Status konnte nicht geändert werden. Bitte versuche es erneut.");
    } finally {
      setStatusUpdating(null);
    }
  };

  if (loading) {
    return (
      <section className="app-panel p-6">
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[110px] animate-pulse rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const emptyMessage = searchQuery
    ? "Keine Flows gefunden."
    : effectiveStatusFilter === "Aktiv"
      ? "Noch keine aktiven Flows vorhanden."
      : effectiveStatusFilter === "Entwurf"
        ? "Noch keine Entwuerfe vorhanden."
        : effectiveStatusFilter === "Favoriten"
          ? "Noch keine Favoriten markiert."
          : effectiveStatusFilter === "Warnungen"
            ? "Keine Flows mit Warnungen."
            : effectiveStatusFilter === "Valide"
              ? "Keine validen Flows gefunden."
              : "Noch keine Flows vorhanden.";

  const renderWarningPill = (count: number) =>
    count > 0 ? (
      <Badge variant="warning">
        <AlertTriangle className="h-3 w-3" />
        {count} Warnung{count > 1 ? "en" : ""}
      </Badge>
    ) : (
      <Badge variant="success">
        <CheckCircle className="h-3 w-3" />
        Valide
      </Badge>
    );

  const renderStatusBadge = (flow: FlowSummary) => (
    <Badge variant={flow.status === "Aktiv" ? "success" : "neutral"}>
      {flow.status}
    </Badge>
  );

  const filterControls = (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px]">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
          Suche
        </span>
        <span className="flex min-h-[42px] items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <Search className="h-4 w-4 text-[#94A3B8]" />
          <input
            className="app-input min-h-0 border-0 bg-transparent p-0 shadow-none focus:border-0 focus:shadow-none"
            placeholder="Flows durchsuchen..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </span>
      </label>

      {!statusFilterOverride ? (
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Filter
          </span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as FlowFilter)}
            className="app-select"
          >
            <option value="all">Alle</option>
            <option value="Aktiv">Aktive</option>
            <option value="Entwurf">Entwuerfe</option>
            <option value="Favoriten">Favoriten</option>
            <option value="Warnungen">Mit Warnungen</option>
            <option value="Valide">Ohne Warnungen</option>
          </select>
        </label>
      ) : null}
    </div>
  );

  const renderFlowName = (flow: FlowSummary) =>
    editingFlowId === flow.id ? (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={editingName}
          onChange={(event) => setEditingName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") saveFlowName(flow.id);
            if (event.key === "Escape") cancelEditing();
          }}
          className="app-input min-h-9 px-3 py-1.5"
          autoFocus
        />
        <button
          type="button"
          onClick={() => saveFlowName(flow.id)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#BBF7D0] bg-[#ECFDF5] text-[#047857] transition-colors hover:bg-[#D1FAE5]"
          title="Speichern"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={cancelEditing}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC]"
          title="Abbrechen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <div className="group/name flex items-center gap-2">
        <span className="font-medium text-[#0F172A]">{flow.name}</span>
        <button
          type="button"
          onClick={() => startEditing(flow)}
          className="rounded-md p-1 text-[#94A3B8] opacity-0 transition-all hover:bg-[#F0F4F9] hover:text-[#0F172A] group-hover/name:opacity-100"
          title="Namen bearbeiten"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );

  const renderPriority = (flow: FlowSummary) =>
    flow.status === "Aktiv" && activeFlowsSortedByPriority.length > 1 ? (
      <div className="flex items-center gap-2">
        <Badge variant="accent">#{priorityRankOf(flow.id)}</Badge>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => movePriority(flow.id, -1)}
            disabled={priorityRankOf(flow.id) === 1 || priorityUpdating === flow.id}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
            title="Hoeher"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => movePriority(flow.id, 1)}
            disabled={
              priorityRankOf(flow.id) === activeFlowsSortedByPriority.length ||
              priorityUpdating === flow.id
            }
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40"
            title="Niedriger"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    ) : (
      <span className="text-sm text-[#94A3B8]">-</span>
    );

  const renderActions = (flow: FlowSummary) => (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/app/flows/${flow.id}`}
        className="text-sm font-medium text-[#2450b2] transition-colors hover:text-[#1a46c4] hover:underline"
      >
        Öffnen
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(flow.id)}
        className={[
          "flex items-center justify-center p-1 transition-colors",
          favorites.includes(flow.id)
            ? "text-[#2450b2]"
            : "text-[#CBD5E1] hover:text-[#2450b2]",
        ].join(" ")}
        title="Favorit"
      >
        <Star
          className="h-5 w-5"
          fill={favorites.includes(flow.id) ? "currentColor" : "none"}
        />
      </button>
    </div>
  );

  const allPageSelected =
    filteredFlows.length > 0 && filteredFlows.every((f) => selectedIds.has(f.id));
  const somePageSelected =
    filteredFlows.some((f) => selectedIds.has(f.id)) && !allPageSelected;

  const columns: DataTableColumn<(FlowSummary & { warningCount: number })>[] = [
    {
      id: "select",
      header: (
        <input
          ref={(el) => {
            selectAllRef.current = el;
            if (el) el.indeterminate = somePageSelected;
          }}
          type="checkbox"
          checked={allPageSelected}
          onChange={() => {
            if (allPageSelected) {
              setSelectedIds(new Set());
            } else {
              setSelectedIds(new Set(filteredFlows.map((f) => f.id)));
            }
            setBulkDeleteConfirm(false);
          }}
          className="h-4 w-4 cursor-pointer rounded border-[#CBD5E1] text-[#1E4FD8] accent-[#1E4FD8] focus:ring-[#1E4FD8]"
          aria-label="Alle auswählen"
        />
      ),
      render: (flow) => (
        <input
          type="checkbox"
          checked={selectedIds.has(flow.id)}
          onChange={() => toggleSelect(flow.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer rounded border-[#CBD5E1] text-[#1E4FD8] accent-[#1E4FD8] focus:ring-[#1E4FD8]"
          aria-label={`${flow.name} auswählen`}
        />
      ),
      headerClassName: "w-12",
      cellClassName: "w-12",
    },
    {
      id: "name",
      header: "Name",
      sortValue: (flow) => flow.name,
      render: (flow) => (
        <div className="min-w-[240px]">
          {renderFlowName(flow)}
          <div className="mt-1 text-[13px] text-[#64748B]">
            {flow.nodes.length} Nodes · {flow.edges.length} Verbindungen
            {showReservationCounts ? (
              <> · {(reservationCounts[flow.id] ?? 0).toLocaleString("de-DE")} {labels.bookingPlural}</>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (flow) => flow.status,
      render: (flow) => (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="switch"
            aria-checked={flow.status === "Aktiv"}
            disabled={statusUpdating === flow.id}
            onClick={() => toggleFlowStatus(flow)}
            className={[
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
              flow.status === "Aktiv" ? "bg-[#1E4FD8]" : "bg-[#CBD5E1]",
            ].join(" ")}
            title={flow.status === "Aktiv" ? "Aktiv – klicken zum Deaktivieren" : "Entwurf – klicken zum Aktivieren"}
          >
            <span
              className={[
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                flow.status === "Aktiv" ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </button>
          <span className={[
            "text-[13px] font-medium",
            flow.status === "Aktiv" ? "text-[#1E4FD8]" : "text-[#94A3B8]",
          ].join(" ")}>
            {flow.status}
          </span>
        </div>
      ),
    },
    {
      id: "priority",
      header: "Prioritaet",
      render: (flow) => renderPriority(flow),
    },
    {
      id: "quality",
      header: "Qualitaet",
      sortValue: (flow) => flow.warningCount,
      render: (flow) => renderWarningPill(flow.warningCount),
    },
    {
      id: "updated",
      header: "Aktualisiert",
      sortValue: (flow) => flow.updated_at,
      render: (flow) => (
        <span className="text-sm text-[#475569]">
          {new Date(flow.updated_at).toLocaleDateString("de-DE")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Aktionen",
      render: (flow) => renderActions(flow),
      cellClassName: "min-w-[300px]",
    },
  ];

  const statCards = [
    {
      key: "all",
      label: "Alle Flows",
      value: flows.length,
      description: "Gesamte verfügbare Automationen",
      tone: "bg-[#DBEAFE] text-[#2563EB]",
    },
    {
      key: "active",
      label: "Aktiv",
      value: flows.filter((flow) => flow.status === "Aktiv").length,
      description: "Derzeit live geschaltet",
      tone: "bg-[#D1FAE5] text-[#047857]",
    },
    {
      key: "favorites",
      label: "Favoriten",
      value: favorites.length,
      description: "Schnellzugriff fuer wichtige Flows",
      tone: "bg-[#FFFBEB] text-[#B45309]",
    },
    {
      key: "warnings",
      label: "Mit Warnungen",
      value: flowsWithWarnings.filter((flow) => flow.warningCount > 0).length,
      description: "Flows mit offenen Lint-Hinweisen",
      tone: "bg-[#FEF3C7] text-[#B45309]",
    },
  ] as const;

  if (!filteredFlows.length) {
    return (
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.key} className="app-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-[#94A3B8]">
                    {card.label}
                  </p>
                  <p className="mt-3 text-[28px] font-bold text-[#0F172A]">
                    {card.value.toLocaleString("de-DE")}
                  </p>
                </div>
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    card.tone,
                  ].join(" ")}
                >
                  <Zap className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#475569]">
                {card.description}
              </p>
            </div>
          ))}
        </div>

        <section className="app-panel space-y-5 p-6">
          {filterControls}
          {error ? (
            <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}
          <EmptyState
            icon={Zap}
            title={emptyMessage}
            description="Erstelle einen neuen Flow oder passe die Filter an, um bestehende Automationen schneller zu finden."
            action={
              <Link
                href="/app/flows/new"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#2450b2] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_2px_16px_rgba(0,0,0,0.18)] transition-all hover:bg-[#1a46c4]"
              >
                Ersten Flow erstellen
              </Link>
            }
          />
        </section>
      </section>
    );
  }

  if (variant === "grid") {
    return (
      <div className="space-y-6 app-page-enter">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.key} className="app-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-[#94A3B8]">
                    {card.label}
                  </p>
                  <p className="mt-3 text-[28px] font-bold text-[#0F172A]">
                    {card.value.toLocaleString("de-DE")}
                  </p>
                </div>
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    card.tone,
                  ].join(" ")}
                >
                  <Zap className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#475569]">
                {card.description}
              </p>
            </div>
          ))}
        </section>

        <section className="app-panel space-y-5 p-6">
          {filterControls}
          {error ? (
            <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredFlows.map((flow) => (
              <article
                key={flow.id}
                className="app-card app-card-interactive flex flex-col justify-between rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatusBadge(flow)}
                      {flow.status === "Aktiv" &&
                      activeFlowsSortedByPriority.length > 1 ? (
                        <Badge variant="accent">#{priorityRankOf(flow.id)}</Badge>
                      ) : null}
                    </div>
                    <div className="mt-3">{renderFlowName(flow)}</div>
                    <p className="mt-2 text-sm text-[#64748B]">
                      Zuletzt aktualisiert{" "}
                      {new Date(flow.updated_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(flow.id)}
                    className={[
                      "inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
                      favorites.includes(flow.id)
                        ? "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]"
                        : "border-[#E2E8F0] bg-white text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A]",
                    ].join(" ")}
                    title="Favorit"
                  >
                    <Star
                      className="h-4 w-4"
                      fill={favorites.includes(flow.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                  {renderWarningPill(flow.warningCount)}
                  <span>{flow.nodes.length} Nodes</span>
                  <span>{flow.edges.length} Verbindungen</span>
                  {showReservationCounts ? (
                    <span>
                      {(reservationCounts[flow.id] ?? 0).toLocaleString("de-DE")}{" "}
                      {labels.bookingPlural}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={`/app/flows/${flow.id}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#2450b2] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_2px_16px_rgba(0,0,0,0.18)] transition-all hover:bg-[#1a46c4]"
                  >
                    Flow öffnen
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 app-page-enter">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className="app-card rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-[#94A3B8]">
                  {card.label}
                </p>
                <p className="mt-3 text-[28px] font-bold text-[#0F172A]">
                  {card.value.toLocaleString("de-DE")}
                </p>
              </div>
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  card.tone,
                ].join(" ")}
              >
                <Zap className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#475569]">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      <section className="app-panel space-y-5 p-6">
        {filterControls}
        {error ? (
          <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {error}
          </div>
        ) : null}

        {selectedIds.size > 0 ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
            <span className="text-sm font-semibold text-[#1E4FD8]">
              {selectedIds.size} {selectedIds.size === 1 ? "Flow" : "Flows"} ausgewählt
            </span>
            <button
              type="button"
              onClick={() => { setSelectedIds(new Set()); setBulkDeleteConfirm(false); }}
              className="text-sm text-[#475569] underline-offset-2 hover:text-[#0F172A] hover:underline"
            >
              Auswahl aufheben
            </button>
            <div className="ml-auto flex items-center gap-2">
              {bulkDeleteConfirm ? (
                <>
                  <span className="text-sm font-medium text-[#B91C1C]">
                    {selectedIds.size} {selectedIds.size === 1 ? "Flow" : "Flows"} wirklich löschen?
                  </span>
                  <button
                    type="button"
                    onClick={bulkDelete}
                    disabled={bulkDeleting}
                    className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(239,68,68,0.25)] transition-all hover:bg-[#DC2626] disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {bulkDeleting ? "Löscht..." : "Bestätigen"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkDeleteConfirm(false)}
                    className="inline-flex min-h-9 items-center rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC]"
                  >
                    Abbrechen
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setBulkDeleteConfirm(true)}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#FECACA] bg-white px-4 py-2 text-sm font-semibold text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Löschen
                </button>
              )}
            </div>
          </div>
        ) : null}

        <DataTable
          data={filteredFlows}
          columns={columns}
          getRowKey={(flow) => flow.id}
          initialSort={{ columnId: "updated", direction: "desc" }}
        />
      </section>
    </div>
  );
}
