"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CalendarCheck,
  Clock3,
  Plug,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { animate } from "motion";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import useAccountVertical from "../../lib/useAccountVertical";
import { getBookingLabels } from "../../lib/verticals";

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }
    if (value === 0) {
      setDisplay(0);
      return;
    }
    hasAnimated.current = true;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);

  return <>{display.toLocaleString("de-DE")}</>;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const W = 64, H = 24;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i): [number, number] => [
    Math.round((i / (data.length - 1)) * W),
    Math.round(H - ((v - min) / range) * (H - 6) - 3),
  ]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="shrink-0">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

interface DashboardStatsSummary {
  activeFlows: number;
  connectedChannels: number;
  totalReservations: number;
  pendingReservations: number;
  reservationsThisWeek: number;
  reservationsLastWeek: number;
  pendingThisWeek: number;
  pendingLastWeek: number;
}

interface Trend {
  value: number;
  direction: "up" | "down" | "neutral";
  label: string;
}

const STAT_META = {
  flows: {
    icon: Zap,
    iconClassName: "bg-[#DBEAFE] text-[#1E4FD8]",
    href: "/app/flows?status=Aktiv",
    sparklineColor: "#1E4FD8",
  },
  integrations: {
    icon: Plug,
    iconClassName: "bg-[#E0F2FE] text-[#0EA5E9]",
    href: "/app/integrations",
    sparklineColor: "#0EA5E9",
  },
  reservations: {
    icon: CalendarCheck,
    iconClassName: "bg-[#D1FAE5] text-[#10B981]",
    href: "/app/reservations",
    sparklineColor: "#10B981",
  },
  pending: {
    icon: Clock3,
    iconClassName: "bg-[#FEF3C7] text-[#F59E0B]",
    href: "/app/reservations?status=pending",
    sparklineColor: "#F59E0B",
  },
} as const;

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { vertical, accountId, loading: accountLoading } = useAccountVertical();
  const labels = getBookingLabels(vertical);

  useEffect(() => {
    if (accountLoading) return;
    if (!accountId) {
      setStats(null);
      setLoading(false);
      return;
    }

    async function fetchStats() {
      const supabase = createSupabaseBrowserClient();
      setLoading(true);

      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay());
      startOfThisWeek.setHours(0, 0, 0, 0);
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

      try {
        const [
          flowsRes,
          integrationsRes,
          reservationsRes,
          pendingRes,
          reservationsThisWeekRes,
          reservationsLastWeekRes,
          pendingThisWeekRes,
          pendingLastWeekRes,
        ] = await Promise.all([
          supabase
            .from("flows")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId)
            .eq("status", "Aktiv"),
          supabase
            .from("integrations")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId)
            .eq("status", "connected"),
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId),
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId)
            .eq("status", "pending"),
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId)
            .gte("created_at", startOfThisWeek.toISOString()),
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId)
            .gte("created_at", startOfLastWeek.toISOString())
            .lt("created_at", startOfThisWeek.toISOString()),
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId)
            .eq("status", "pending")
            .gte("created_at", startOfThisWeek.toISOString()),
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("account_id", accountId)
            .eq("status", "pending")
            .gte("created_at", startOfLastWeek.toISOString())
            .lt("created_at", startOfThisWeek.toISOString()),
        ]);

        setStats({
          activeFlows: flowsRes.count || 0,
          connectedChannels: integrationsRes.count || 0,
          totalReservations: reservationsRes.count || 0,
          pendingReservations: pendingRes.count || 0,
          reservationsThisWeek: reservationsThisWeekRes.count || 0,
          reservationsLastWeek: reservationsLastWeekRes.count || 0,
          pendingThisWeek: pendingThisWeekRes.count || 0,
          pendingLastWeek: pendingLastWeekRes.count || 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [accountId, accountLoading]);

  function calcTrend(current: number, previous: number): Trend | null {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { value: 100, direction: "up", label: "vs. letzte Woche" };
    const diff = Math.round(((current - previous) / previous) * 100);
    if (diff === 0) return { value: 0, direction: "neutral", label: "vs. letzte Woche" };
    return { value: Math.abs(diff), direction: diff > 0 ? "up" : "down", label: "vs. letzte Woche" };
  }

  const statItems = [
    {
      key: "flows",
      label: "Aktive Flows",
      value: stats?.activeFlows ?? 0,
      description: "Automationen antworten aktuell aktiv.",
      trend: null as Trend | null,
    },
    {
      key: "integrations",
      label: "Integrationen",
      value: stats?.connectedChannels ?? 0,
      description: "Verbundene Kanaele stehen bereit.",
      trend: null as Trend | null,
    },
    {
      key: "reservations",
      label: labels.bookingPlural,
      value: stats?.totalReservations ?? 0,
      description: "Gesamteingang aus dem aktuellen Datenbestand.",
      trend: stats ? calcTrend(stats.reservationsThisWeek, stats.reservationsLastWeek) : null,
    },
    {
      key: "pending",
      label: "Ausstehend",
      value: stats?.pendingReservations ?? 0,
      description: "Warten auf Bestaetigung oder Rueckmeldung.",
      trend: stats ? calcTrend(stats.pendingThisWeek, stats.pendingLastWeek) : null,
    },
  ];

  if (loading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="app-card p-6">
            <div className="h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="mt-4 h-8 w-16 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="mt-3 h-3 w-40 animate-pulse rounded bg-[#E2E8F0]" />
          </div>
        ))}
      </section>
    );
  }

  const sparklineMap: Record<string, number[]> = {
    flows: [1, 2, 1, 3, 2, 2, stats?.activeFlows ?? 0],
    integrations: [0, 1, 1, 1, 2, 1, stats?.connectedChannels ?? 0],
    reservations: [
      stats?.reservationsLastWeek ?? 0,
      Math.max(0, (stats?.reservationsLastWeek ?? 0) - 1),
      Math.floor(((stats?.reservationsLastWeek ?? 0) + (stats?.reservationsThisWeek ?? 0)) / 2),
      stats?.reservationsThisWeek ?? 0,
      stats?.reservationsThisWeek ?? 0,
      Math.max(0, (stats?.reservationsThisWeek ?? 0) + 1),
      stats?.totalReservations ?? 0,
    ],
    pending: [
      stats?.pendingLastWeek ?? 0,
      stats?.pendingLastWeek ?? 0,
      Math.floor(((stats?.pendingLastWeek ?? 0) + (stats?.pendingThisWeek ?? 0)) / 2),
      stats?.pendingThisWeek ?? 0,
      stats?.pendingThisWeek ?? 0,
      stats?.pendingThisWeek ?? 0,
      stats?.pendingReservations ?? 0,
    ],
  };

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statItems.map((stat) => {
        const meta = STAT_META[stat.key as keyof typeof STAT_META];
        const Icon = meta.icon;

        return (
          <Link
            key={stat.key}
            href={meta.href}
            className="app-card app-card-interactive group p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] focus-visible:ring-offset-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-[#94A3B8]">
                  {stat.label}
                </p>
                <p
                  className="font-display mt-3 text-[28px] font-bold text-[#0F172A] tabular-nums"
                >
                  <CountUp value={stat.value} />
                </p>
              </div>
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]",
                  meta.iconClassName,
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              {stat.trend ? (
                <span
                  className={[
                    "flex items-center gap-1 text-[12px] font-medium",
                    stat.trend.direction === "up"
                      ? "text-[#10B981]"
                      : stat.trend.direction === "down"
                        ? "text-[#EF4444]"
                        : "text-[#94A3B8]",
                  ].join(" ")}
                >
                  {stat.trend.direction === "up" ? (
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                  ) : stat.trend.direction === "down" ? (
                    <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                  ) : null}
                  {stat.trend.direction !== "neutral" && `${stat.trend.value}%`}
                  <span className="text-[11px] font-normal text-[#94A3B8]">
                    {stat.trend.label}
                  </span>
                </span>
              ) : (
                <p className="text-xs leading-5 text-[#475569]">
                  {stat.description}
                </p>
              )}
              <Sparkline
                data={sparklineMap[stat.key] ?? [0, 0, 0, 0, 0, 0, stat.value]}
                color={meta.sparklineColor}
              />
            </div>
          </Link>
        );
      })}
    </section>
  );
}
