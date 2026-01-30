'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Sparkles, FileText, LayoutTemplate } from "lucide-react";
import { createSupabaseBrowserClient } from "../../../../lib/supabaseBrowserClient";
import type { FlowTemplate } from "../../../../lib/flowTemplates";
import FlowSetupWizard from "../../../../components/app/FlowSetupWizard";
import type { Node, Edge } from "reactflow";
import type { FlowTrigger } from "../../../../lib/flowTypes";

type CreationMode = "choose" | "wizard" | "empty" | "template";

export default function NewFlowPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [flowName, setFlowName] = useState("Neuer Flow");
  const [status, setStatus] = useState<"idle" | "creating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateSearch, setTemplateSearch] = useState("");
  const [verticalFilter, setVerticalFilter] = useState<string>("alle");
  const [previewTemplate, setPreviewTemplate] = useState<FlowTemplate | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>("choose");

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

  const createFlowFromWizard = async (data: {
    nodes: Node[];
    edges: Edge[];
    triggers: FlowTrigger[];
    name: string;
  }) => {
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
      body: JSON.stringify({
        name: data.name,
        nodes: data.nodes,
        edges: data.edges,
        triggers: data.triggers,
      }),
    });
    if (!response.ok) {
      const message = await response.json();
      setError(message.error ?? "Flow konnte nicht erstellt werden.");
      setStatus("error");
      setCreationMode("choose");
      return;
    }
    const result = await response.json();
    router.replace(`/app/flows/${result.id}`);
  };

  const uniqueVerticals = useMemo(() => {
    const values = templates.map((template) => template.vertical);
    return ["alle", ...Array.from(new Set(values))];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        template.description.toLowerCase().includes(templateSearch.toLowerCase());
      const matchesVertical =
        verticalFilter === "alle" ? true : template.vertical === verticalFilter;
      return matchesSearch && matchesVertical;
    });
  }, [templates, templateSearch, verticalFilter]);

  // Show wizard if in wizard mode
  if (creationMode === "wizard") {
    return (
      <div className="space-y-8">
        {status === "creating" ? (
          <div className="mx-auto max-w-xl">
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-lg font-semibold text-slate-700">Flow wird erstellt…</p>
            </div>
          </div>
        ) : (
          <FlowSetupWizard
            onComplete={createFlowFromWizard}
            onCancel={() => setCreationMode("choose")}
          />
        )}
        {error && (
          <div className="mx-auto max-w-xl">
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-700">
              {error}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show empty flow name input if in empty mode
  if (creationMode === "empty") {
    return (
      <div className="space-y-8">
        <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <button
            onClick={() => setCreationMode("choose")}
            className="text-sm font-semibold text-slate-500 hover:text-brand"
          >
            ← Zurück zur Auswahl
          </button>
          <p className="text-sm uppercase tracking-wide text-slate-400">Leerer Flow</p>
          <h1 className="text-3xl font-semibold">Wie soll dein Flow heißen?</h1>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-semibold text-slate-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
            value={flowName}
            onChange={(event) => setFlowName(event.target.value)}
          />
          <button
            onClick={() => createFlow()}
            disabled={status === "creating"}
            className="w-full rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 disabled:opacity-70"
          >
            {status === "creating" ? "Erstelle Flow …" : "Flow anlegen"}
          </button>
          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Mode Selection */}
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wide text-slate-400">Neuer Flow</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Wie möchtest du starten?</h1>
          <p className="mt-2 text-slate-500">Wähle eine Option, um deinen Flow zu erstellen.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Wizard Option */}
          <button
            onClick={() => setCreationMode("wizard")}
            className="group relative flex flex-col items-start rounded-2xl border-2 border-brand bg-brand/5 p-6 text-left transition hover:bg-brand/10"
          >
            <div className="absolute -top-3 right-4">
              <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                Empfohlen
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Setup-Assistent</h3>
            <p className="mt-2 text-sm text-slate-500">
              Beantworte 5 einfache Fragen und wir erstellen deinen Reservierungs-Flow automatisch.
            </p>
            <span className="mt-4 text-sm font-semibold text-brand group-hover:underline">
              Assistent starten →
            </span>
          </button>

          {/* Template Option */}
          <button
            onClick={() => setCreationMode("template")}
            className="group flex flex-col items-start rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <LayoutTemplate className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Aus Template</h3>
            <p className="mt-2 text-sm text-slate-500">
              Wähle ein fertiges Template für Restaurant, Salon oder Praxis und passe es an.
            </p>
            <span className="mt-4 text-sm font-semibold text-brand group-hover:underline">
              Templates ansehen →
            </span>
          </button>

          {/* Empty Flow Option */}
          <button
            onClick={() => setCreationMode("empty")}
            className="group flex flex-col items-start rounded-2xl border-2 border-slate-200 p-6 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Leerer Flow</h3>
            <p className="mt-2 text-sm text-slate-500">
              Starte mit einem leeren Flow und baue alles selbst von Grund auf.
            </p>
            <span className="mt-4 text-sm font-semibold text-brand group-hover:underline">
              Leer starten →
            </span>
          </button>
        </div>
      </div>

      {/* Templates Section - show when in template mode or in choose mode (collapsed preview) */}
      {(creationMode === "template" || creationMode === "choose") && (
        <section className={`space-y-4 ${creationMode === "choose" ? "opacity-60 hover:opacity-100 transition" : ""}`}>
          {creationMode === "template" && (
            <button
              onClick={() => setCreationMode("choose")}
              className="text-sm font-semibold text-slate-500 hover:text-brand"
            >
              ← Zurück zur Auswahl
            </button>
          )}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-400">Templates</p>
              <h2 className="text-2xl font-semibold">Starte mit einer Vorlage</h2>
              <p className="text-slate-500">
                Spare Zeit mit fertigen Journeys für Restaurants, Salons oder Praxen.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                placeholder="Template durchsuchen…"
                value={templateSearch}
                onChange={(event) => setTemplateSearch(event.target.value)}
              />
              <select
                value={verticalFilter}
                onChange={(event) => setVerticalFilter(event.target.value)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 focus:border-brand focus:outline-none"
              >
                {uniqueVerticals.map((vertical) => (
                  <option key={vertical} value={vertical}>
                    {vertical === "alle" ? "Alle Verticals" : vertical}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loadingTemplates ? (
            <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Templates werden geladen …
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
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
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => createFlow(template.id)}
                      className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-brand-dark hover:border-brand"
                    >
                      Flow aus Template
                    </button>
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="rounded-full border border-slate-100 px-3 py-2 text-slate-500 hover:border-brand"
                      title="Template ansehen"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {!filteredTemplates.length && (
                <p className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                  Keine Templates für diese Filter gefunden.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {previewTemplate ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {previewTemplate.vertical}
                </p>
                <h3 className="text-2xl font-semibold">{previewTemplate.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
              >
                Schließen
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Schritte
              </p>
              <ol className="space-y-2 text-sm text-slate-600">
                {previewTemplate.nodes.map((node, index) => (
                  <li key={node.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <span className="font-semibold text-slate-500">Step {index + 1}:</span>{" "}
                    {node.data?.label}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-slate-400">
                {previewTemplate.edges.length} Verbindungen ·{" "}
                {previewTemplate.nodes.length} Nodes
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  createFlow(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                className="flex-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                Template übernehmen
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
