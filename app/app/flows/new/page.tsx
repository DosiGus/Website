'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../../lib/supabaseBrowserClient";
import type { FlowTemplate } from "../../../../lib/flowTemplates";

export default function NewFlowPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [flowName, setFlowName] = useState("Neuer Flow");
  const [status, setStatus] = useState<"idle" | "creating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      const response = await fetch("/api/templates");
      const data = await response.json();
      setTemplates(data);
      setLoadingTemplates(false);
    }
    loadTemplates();
  }, []);

  const createFlow = async (templateId?: string) => {
    setStatus("creating");
    setError(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }
    const response = await fetch("/api/flows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name: flowName, templateId }),
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
    <div className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm uppercase tracking-wide text-slate-400">Flow erstellen</p>
        <h1 className="text-3xl font-semibold">Wie soll dein Flow heißen?</h1>
        <input
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          value={flowName}
          onChange={(event) => setFlowName(event.target.value)}
        />
        <button
          onClick={() => createFlow()}
          disabled={status === "creating"}
          className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30"
        >
          {status === "creating" ? "Erstelle Flow …" : "Leeren Flow anlegen"}
        </button>
        {error ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        ) : null}
      </div>

      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Templates</p>
          <h2 className="text-2xl font-semibold">Starte mit einer Vorlage</h2>
          <p className="text-slate-500">
            Spare Zeit mit fertigen Journeys für Restaurants, Salons oder Praxen.
          </p>
        </div>
        {loadingTemplates ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Templates werden geladen …
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {template.vertical}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {template.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{template.description}</p>
                </div>
                <button
                  onClick={() => createFlow(template.id)}
                  className="mt-5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-dark hover:border-brand"
                >
                  Flow aus Template
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
