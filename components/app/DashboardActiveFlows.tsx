"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import type { FlowTrigger } from "../../lib/flowTypes";
import Badge from "../ui/Badge";
import Button, { buttonClassName } from "../ui/Button";
import DataTable, { type DataTableColumn } from "../ui/DataTable";
import EmptyState from "../ui/EmptyState";

type FlowSummary = {
  id: string;
  name: string;
  status: string;
  updated_at: string;
  triggers?: FlowTrigger[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTriggerLabel(trigger?: FlowTrigger) {
  if (!trigger) return "Kein Trigger";
  const keywords = trigger.config?.keywords?.filter(Boolean) ?? [];
  if (!keywords.length) return "Keyword";
  return trigger.config.matchType === "EXACT"
    ? `Exakt: ${keywords[0]}`
    : `Enthält: ${keywords[0]}`;
}

export default function DashboardActiveFlows() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFlows() {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        if (!cancelled) {
          setFlows([]);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/flows", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Aktive Flows konnten nicht geladen werden.");
        }

        const data = (await response.json()) as FlowSummary[];

        if (cancelled) return;

        setFlows(
          data
            .filter((flow) => flow.status === "Aktiv")
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
            .slice(0, 5),
        );
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Aktive Flows konnten nicht geladen werden.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFlows();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const columns: DataTableColumn<FlowSummary>[] = [
    {
      id: "name",
      header: "Name",
      render: (flow) => (
        <div className="min-w-[180px]">
          <p className="font-medium text-[#0F172A]">{flow.name}</p>
          <p className="mt-1 text-xs text-[#94A3B8]">Flow-ID: {flow.id.slice(0, 8)}</p>
        </div>
      ),
      sortValue: (flow) => flow.name,
    },
    {
      id: "status",
      header: "Status",
      render: (flow) => (
        <Badge variant={flow.status === "Aktiv" ? "success" : "neutral"}>
          {flow.status}
        </Badge>
      ),
      sortValue: (flow) => flow.status,
    },
    {
      id: "trigger",
      header: "Trigger",
      render: (flow) => (
        <span className="text-sm text-[#475569]">
          {getTriggerLabel(flow.triggers?.[0])}
        </span>
      ),
      sortValue: (flow) => getTriggerLabel(flow.triggers?.[0]),
    },
    {
      id: "updated",
      header: "Letzte Aktivität",
      render: (flow) => (
        <span className="text-sm text-[#475569]">{formatDate(flow.updated_at)}</span>
      ),
      sortValue: (flow) => flow.updated_at,
    },
    {
      id: "actions",
      header: "Aktion",
      align: "right",
      render: (flow) => (
        <Link
          href={`/app/flows/${flow.id}`}
          className={buttonClassName({ variant: "ghost", size: "sm" })}
        >
          Öffnen
        </Link>
      ),
    },
  ];

  if (error) {
    return (
      <EmptyState
        icon={Zap}
        title="Flows konnten nicht geladen werden"
        description={error}
        action={
          <Button onClick={() => window.location.reload()} variant="secondary">
            Erneut laden
          </Button>
        }
      />
    );
  }

  return (
    <DataTable
      data={flows}
      columns={columns}
      getRowKey={(flow) => flow.id}
      initialSort={{ columnId: "updated", direction: "desc" }}
      loading={loading}
      emptyState={
        <EmptyState
          icon={Zap}
          title="Noch kein Flow aktiv"
          description="Sobald ein Flow aktiviert ist, erscheint er hier in der Übersicht."
          action={
            <Link
              href="/app/flows/new"
              className={buttonClassName({ variant: "primary", size: "md" })}
            >
              Ersten Flow erstellen
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
      }
    />
  );
}
