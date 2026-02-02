"use client";

import { useEffect, useState } from "react";
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
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch all stats in parallel
        const [flowsRes, integrationsRes, reservationsRes, pendingRes] = await Promise.all([
          // Count active flows
          supabase
            .from("flows")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "Aktiv"),

          // Count connected integrations
          supabase
            .from("integrations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "connected"),

          // Count total reservations
          supabase
            .from("reservations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),

          // Count pending reservations
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
      description: "Flows die aktuell Nachrichten beantworten"
    },
    {
      label: "Verbundene Kanäle",
      value: stats?.connectedChannels ?? 0,
      description: "Instagram-Accounts verbunden"
    },
    {
      label: "Reservierungen",
      value: stats?.totalReservations ?? 0,
      description: `${stats?.pendingReservations ?? 0} ausstehend`
    },
  ];

  if (loading) {
    return (
      <section className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="mt-3 h-8 w-16 bg-slate-200 rounded"></div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm text-slate-500">{stat.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {stat.value.toLocaleString("de-DE")}
          </p>
          <p className="mt-1 text-xs text-slate-400">{stat.description}</p>
        </div>
      ))}
    </section>
  );
}
