'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Filter, Star } from "lucide-react";
import type { Edge, Node } from "reactflow";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { lintFlow } from "../../lib/flowLint";
import type { FlowMetadata, FlowTrigger } from "../../lib/flowTypes";

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

type Props = {
  variant: "grid" | "table";
};

type PendingAction = { id: string; type: "duplicate" | "template" } | null;

export default function FlowListClient({ variant }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Aktiv" | "Entwurf">("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);

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

  const filteredFlows = useMemo(() => {
    return flowsWithWarnings
      .filter((flow) =>
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .filter((flow) => (statusFilter === "all" ? true : flow.status === statusFilter))
      .sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav === bFav) return 0;
        return aFav ? -1 : 1;
      });
  }, [flowsWithWarnings, searchQuery, statusFilter, favorites]);

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

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Flows werden geladen …
      </div>
    );
  }

  if (!filteredFlows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
        Noch keine Flows vorhanden.{" "}
        <Link href="/app/flows/new" className="font-semibold text-brand-dark">
          Erstelle den ersten Flow.
        </Link>
      </div>
    );
  }

  const renderWarningPill = (count: number) =>
    count > 0 ? (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
        {count} Warnung{count > 1 ? "en" : ""}
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        ✓ Valide
      </span>
    );

  const filterControls = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 px-4 py-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <input
          className="w-full text-sm text-slate-600 focus:outline-none"
          placeholder="Flows durchsuchen..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>
      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value as "all" | "Aktiv" | "Entwurf")}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 focus:border-brand focus:outline-none"
      >
        <option value="all">Alle Stati</option>
        <option value="Aktiv">Aktive</option>
        <option value="Entwurf">Entwürfe</option>
      </select>
    </div>
  );

  if (variant === "grid") {
    return (
      <div className="space-y-4">
        {filterControls}
        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredFlows.map((flow) => (
            <div
              key={flow.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">{flow.status}</p>
                  <h3 className="mt-1 text-xl font-semibold">{flow.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Zuletzt aktualisiert {new Date(flow.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => toggleFavorite(flow.id)}
                  className={`rounded-full border px-2 py-1 ${
                    favorites.includes(flow.id)
                      ? "border-amber-300 bg-amber-50 text-amber-600"
                      : "border-slate-200 text-slate-400"
                  }`}
                  title="Favorit"
                >
                  <Star className="h-4 w-4" fill={favorites.includes(flow.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {renderWarningPill(flow.warningCount)}
                <span>
                  {flow.nodes.length} Nodes · {flow.edges.length} Verbindungen
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/app/flows/${flow.id}`}
                  className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Flow öffnen
                </Link>
                <button
                  onClick={() => duplicateFlow(flow.id)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand"
                  disabled={pendingAction?.id === flow.id && pendingAction.type === "duplicate"}
                >
                    <Copy className="h-4 w-4" />
                  {pendingAction?.id === flow.id && pendingAction.type === "duplicate"
                    ? "Dupliziere…"
                    : "Duplizieren"}
                </button>
                <button
                  onClick={() => saveAsTemplate(flow.id, flow.name)}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-brand"
                  disabled={pendingAction?.id === flow.id && pendingAction.type === "template"}
                >
                  {pendingAction?.id === flow.id && pendingAction.type === "template"
                    ? "Speichere…"
                    : "Als Template"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="px-6 pt-4">
        {filterControls}
        {error ? (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
      </div>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-slate-500">Name</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-500">Status</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-500">Qualität</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-500">Aktualisiert</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-500">Aktionen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {filteredFlows.map((flow) => (
            <tr key={flow.id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                {flow.name}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    flow.status === "Aktiv"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {flow.status}
                </span>
              </td>
              <td className="px-6 py-4">{renderWarningPill(flow.warningCount)}</td>
              <td className="px-6 py-4 text-slate-500">
                {new Date(flow.updated_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/app/flows/${flow.id}`}
                    className="text-sm font-semibold text-brand-dark hover:text-brand"
                  >
                    Öffnen →
                  </Link>
                  <button
                    onClick={() => duplicateFlow(flow.id)}
                    className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand"
                    disabled={pendingAction?.id === flow.id && pendingAction.type === "duplicate"}
                  >
                    <Copy className="h-3 w-3" />
                    Kopie
                  </button>
                  <button
                    onClick={() => saveAsTemplate(flow.id, flow.name)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand"
                    disabled={pendingAction?.id === flow.id && pendingAction.type === "template"}
                  >
                    Template
                  </button>
                  <button
                    onClick={() => toggleFavorite(flow.id)}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                      favorites.includes(flow.id)
                        ? "border-amber-300 bg-amber-50 text-amber-600"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <Star className="h-3 w-3" fill={favorites.includes(flow.id) ? "currentColor" : "none"} />
                    Favorit
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
