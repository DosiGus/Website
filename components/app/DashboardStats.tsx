"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Workflow, Plug, CalendarCheck, Clock } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";

interface DashboardStats {
  activeFlows: number;
  connectedChannels: number;
  totalReservations: number;
  pendingReservations: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createSupabaseBrowserClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const [flowsRes, integrationsRes, reservationsRes, pendingRes] = await Promise.all([
          supabase
            .from("flows")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "Aktiv"),
          supabase
            .from("integrations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "connected"),
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "pending"),
        ]);

        setStats({
          activeFlows: flowsRes.count || 0,
          connectedChannels: integrationsRes.count || 0,
          totalReservations: reservationsRes.count || 0,
          pendingReservations: pendingRes.count || 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statItems = [
    {
      label: "Aktive Flows",
      value: stats?.activeFlows ?? 0,
      description: "Flows die aktuell Nachrichten beantworten",
      icon: Workflow,
      gradient: "from-indigo-500 to-violet-500",
      bgGlow: "bg-indigo-500/20",
      href: "/app/flows?status=Aktiv",
    },
    {
      label: "Verbundene Kanäle",
      value: stats?.connectedChannels ?? 0,
      description: "Instagram-Accounts verbunden",
      icon: Plug,
      gradient: "from-emerald-500 to-teal-500",
      bgGlow: "bg-emerald-500/20",
      href: "/app/integrations",
    },
    {
      label: "Reservierungen",
      value: stats?.totalReservations ?? 0,
      description: `${stats?.pendingReservations ?? 0} ausstehend`,
      icon: CalendarCheck,
      gradient: "from-amber-500 to-orange-500",
      bgGlow: "bg-amber-500/20",
      href: "/app/reservations",
    },
    {
      label: "Ausstehend",
      value: stats?.pendingReservations ?? 0,
      description: "Reservierungen zur Bestätigung",
      icon: Clock,
      gradient: "from-rose-500 to-pink-500",
      bgGlow: "bg-rose-500/20",
      href: "/app/reservations?status=pending",
    },
  ];

  if (loading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6"
          >
            <div className="h-4 w-24 animate-pulse rounded bg-white/10"></div>
            <div className="mt-4 h-8 w-16 animate-pulse rounded bg-white/10"></div>
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-white/10"></div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition-all hover:border-white/20 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            {/* Background glow */}
            <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${stat.bgGlow} blur-2xl opacity-50 transition-opacity group-hover:opacity-70`} />

            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="mt-4 text-4xl font-bold tracking-tight text-white">
                {stat.value.toLocaleString("de-DE")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{stat.description}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
