'use client';

import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { VERTICAL_OPTIONS, type VerticalKey } from "../../lib/verticals";

export default function VerticalGate() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [vertical, setVertical] = useState<VerticalKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(true);

  useEffect(() => {
    async function loadVertical() {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      const response = await fetch("/api/account/settings", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const membersResponse = await fetch("/api/account/members", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (membersResponse.ok) {
        const membersPayload = await membersResponse.json();
        setCanManage(Boolean(membersPayload?.canManage));
      }
      const payload = await response.json();
      setVertical(payload?.vertical ?? null);
      setLoading(false);
    }
    loadVertical();
  }, [supabase]);

  const handleSelect = async (next: VerticalKey) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Bitte erneut anmelden.");
      setSaving(false);
      return;
    }
    const response = await fetch("/api/account/settings", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ vertical: next }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload?.error || "Branche konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }
    setVertical(next);
    setSaving(false);
  };

  if (loading || vertical || !canManage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 py-10 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Branche auswählen</h2>
            <p className="text-sm text-zinc-400">
              Damit wir dir die passenden Flows zeigen, wähle bitte deine Branche.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {VERTICAL_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => handleSelect(option.key)}
              disabled={saving}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-emerald-400/40 hover:bg-emerald-500/10 disabled:opacity-60"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">{option.label}</h3>
                <CheckCircle2 className="h-4 w-4 text-emerald-300 opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="mt-2 text-sm text-zinc-400">{option.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                {option.examples.map((example) => (
                  <span key={example} className="rounded-full border border-white/10 px-2 py-1">
                    {example}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          Du kannst die Branche später jederzeit in den Einstellungen ändern.
        </p>
      </div>
    </div>
  );
}
