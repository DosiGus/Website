'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../../lib/supabaseBrowserClient";

export default function NewFlowPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [flowName, setFlowName] = useState("Neuer Flow");
  const [status, setStatus] = useState<"idle" | "creating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setStatus("creating");
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const response = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, name: flowName }),
    });
    if (!response.ok) {
      const message = await response.json();
      setError(message.error ?? "Flow konnte nicht erstellt werden.");
      setStatus("error");
      return;
    }
    const data = await response.json();
    router.replace(`/app/flows/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <p className="text-sm uppercase tracking-wide text-slate-400">Flow erstellen</p>
      <h1 className="text-3xl font-semibold">Wie soll dein Flow heißen?</h1>
      <input
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
        value={flowName}
        onChange={(event) => setFlowName(event.target.value)}
      />
      <button
        onClick={handleCreate}
        disabled={status === "creating"}
        className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30"
      >
        {status === "creating" ? "Erstelle Flow …" : "Flow anlegen"}
      </button>
      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
