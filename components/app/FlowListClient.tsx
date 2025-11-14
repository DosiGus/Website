'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";

type FlowSummary = {
  id: string;
  name: string;
  status: string;
  updated_at: string;
};

type Props = {
  variant: "grid" | "table";
};

export default function FlowListClient({ variant }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Flows werden geladen …
      </div>
    );
  }

  if (!flows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
        Noch keine Flows vorhanden.{" "}
        <Link href="/app/flows/new" className="font-semibold text-brand-dark">
          Erstelle den ersten Flow.
        </Link>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-5"
          >
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">
                {flow.status}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{flow.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                Zuletzt aktualisiert {new Date(flow.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              <Link
                href={`/app/flows/${flow.id}`}
                className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Flow öffnen
              </Link>
              <button className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Duplizieren
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-slate-500">Name</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-500">Status</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-500">
              Aktualisiert
            </th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {flows.map((flow) => (
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
              <td className="px-6 py-4 text-slate-500">
                {new Date(flow.updated_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/app/flows/${flow.id}`}
                  className="text-sm font-semibold text-brand-dark hover:text-brand"
                >
                  Öffnen →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
