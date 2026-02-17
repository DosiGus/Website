'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Sparkles, FileText, LayoutTemplate, X, ArrowLeft } from "lucide-react";
import { createSupabaseBrowserClient } from "../../../../lib/supabaseBrowserClient";
import type { FlowTemplate } from "../../../../lib/flowTemplates";
import FlowSetupWizard from "../../../../components/app/FlowSetupWizard";
import FlowSimulator from "../../../../components/app/FlowSimulator";
import type { Node, Edge } from "reactflow";
import type { FlowMetadata, FlowTrigger } from "../../../../lib/flowTypes";
import { getDefaultTemplateVertical, type VerticalKey } from "../../../../lib/verticals";

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
  const [accountVertical, setAccountVertical] = useState<VerticalKey | null>(null);
  const [verticalInitialized, setVerticalInitialized] = useState(false);
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

  useEffect(() => {
    async function loadAccountVertical() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const response = await fetch("/api/account/settings", {
        headers: { authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) return;
      const payload = await response.json();
      setAccountVertical(payload?.vertical ?? null);
    }
    loadAccountVertical();
  }, [supabase]);

  useEffect(() => {
    if (verticalInitialized) return;
    if (!accountVertical) return;
    const defaultVertical = getDefaultTemplateVertical(accountVertical);
    if (defaultVertical) {
      setVerticalFilter(defaultVertical);
    }
    setVerticalInitialized(true);
  }, [accountVertical, verticalInitialized]);

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
    metadata: FlowMetadata;
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
        metadata: data.metadata,
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
        verticalFilter === "alle"
          ? true
          : verticalFilter === "Bewertungen"
            ? template.vertical === "Bewertungen"
            : template.vertical === verticalFilter || template.vertical === "Bewertungen";
      return matchesSearch && matchesVertical;
    });
  }, [templates, templateSearch, verticalFilter]);

  // Show wizard if in wizard mode
  if (creationMode === "wizard") {
    return (
      <div className="space-y-8">
        {status === "creating" ? (
          <div className="mx-auto max-w-xl">
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-lg font-semibold text-white">Flow wird erstellt…</p>
            </div>
          </div>
        ) : (
          <FlowSetupWizard
            onComplete={createFlowFromWizard}
            onCancel={() => setCreationMode("choose")}
            vertical={accountVertical}
          />
        )}
        {error && (
          <div className="mx-auto max-w-xl">
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-center text-sm font-medium text-rose-400">
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
        <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-10 backdrop-blur-xl">
          <button
            onClick={() => setCreationMode("choose")}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Auswahl
          </button>
          <p className="text-sm uppercase tracking-wide text-zinc-500">Leerer Flow</p>
          <h1 className="text-3xl font-semibold text-white">Wie soll dein Flow heißen?</h1>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-semibold text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={flowName}
            onChange={(event) => setFlowName(event.target.value)}
          />
          <button
            onClick={() => createFlow()}
            disabled={status === "creating"}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:opacity-70"
          >
            {status === "creating" ? "Erstelle Flow …" : "Flow anlegen"}
          </button>
          {error ? (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
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
          <p className="text-sm uppercase tracking-wide text-zinc-500">Neuer Flow</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Wie möchtest du starten?</h1>
          <p className="mt-2 text-zinc-400">Wähle eine Option, um deinen Flow zu erstellen.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Wizard Option */}
          <button
            onClick={() => setCreationMode("wizard")}
            className="group relative flex flex-col items-start rounded-2xl border-2 border-indigo-500/50 bg-indigo-500/10 p-6 text-left transition-all hover:border-indigo-500 hover:bg-indigo-500/15"
          >
            <div className="absolute -top-3 right-4">
              <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-semibold text-white">
                Empfohlen
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Setup-Assistent</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Beantworte 5 einfache Fragen und wir erstellen deinen Reservierungs-Flow automatisch.
            </p>
            <span className="mt-4 text-sm font-semibold text-indigo-400 transition-colors group-hover:text-indigo-300">
              Assistent starten →
            </span>
          </button>

          {/* Template Option */}
          <button
            onClick={() => setCreationMode("template")}
            className="group flex flex-col items-start rounded-2xl border-2 border-white/10 bg-zinc-900/50 p-6 text-left transition-all hover:border-white/20 hover:bg-zinc-900/80"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-zinc-400 transition-colors group-hover:text-white">
              <LayoutTemplate className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Aus Template</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Wähle ein fertiges Template für Restaurant, Salon oder Praxis und passe es an.
            </p>
            <span className="mt-4 text-sm font-semibold text-indigo-400 transition-colors group-hover:text-indigo-300">
              Templates ansehen →
            </span>
          </button>

          {/* Empty Flow Option */}
          <button
            onClick={() => setCreationMode("empty")}
            className="group flex flex-col items-start rounded-2xl border-2 border-white/10 bg-zinc-900/50 p-6 text-left transition-all hover:border-white/20 hover:bg-zinc-900/80"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-zinc-400 transition-colors group-hover:text-white">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Leerer Flow</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Starte mit einem leeren Flow und baue alles selbst von Grund auf.
            </p>
            <span className="mt-4 text-sm font-semibold text-indigo-400 transition-colors group-hover:text-indigo-300">
              Leer starten →
            </span>
          </button>
        </div>
      </div>

      {/* Templates Modal - show when in template mode */}
      {creationMode === "template" && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-6xl rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-sm uppercase tracking-wide text-zinc-500">Templates</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Starte mit einer Vorlage
                </h2>
                <p className="mt-2 text-zinc-400">
                  Vorlagen geben dir eine fertige Struktur, die du sofort an dein Geschäft anpassen kannst.
                </p>
              </div>
              <button
                onClick={() => setCreationMode("choose")}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Templates schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <ArrowLeft className="h-4 w-4" />
                <span>Zurück zur Auswahl</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="Template durchsuchen…"
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                />
                <select
                  value={verticalFilter}
                  onChange={(event) => setVerticalFilter(event.target.value)}
                  className="app-select"
                >
                  {uniqueVerticals.map((vertical) => (
                    <option key={vertical} value={vertical} className="bg-zinc-900 text-white">
                      {vertical === "alle" ? "Alle Branchen" : vertical}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
              {loadingTemplates ? (
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/50 p-6 text-sm text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Templates werden geladen …
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition-all hover:border-white/20"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                          {template.vertical}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">
                          {template.name}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-400">{template.description}</p>
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => createFlow(template.id)}
                          className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                        >
                          Flow erstellen
                        </button>
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                          title="Template ansehen"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!filteredTemplates.length && (
                    <p className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/30 p-6 text-sm text-zinc-500">
                      Keine Templates für diese Filter gefunden.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {previewTemplate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {previewTemplate.vertical}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-white">
                  {previewTemplate.name}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {previewTemplate.description}
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Vorschau schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Überblick
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Starte rechts die Vorschau und teste den Ablauf direkt.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {previewTemplate.nodes.length} Schritte
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {previewTemplate.edges.length} Verbindungen
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {previewTemplate.triggers?.length ?? 0} Startpunkte
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Schritte in Kurzform
                  </p>
                  <ol className="mt-3 space-y-2 text-sm text-zinc-400 max-h-52 overflow-y-auto">
                    {previewTemplate.nodes.map((node, index) => (
                      <li key={node.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <span className="font-medium text-zinc-300">
                          Schritt {index + 1}:
                        </span>{" "}
                        {node.data?.label}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <FlowSimulator
                  nodes={previewTemplate.nodes as Node[]}
                  edges={previewTemplate.edges as Edge[]}
                  triggers={(previewTemplate.triggers ?? []) as FlowTrigger[]}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-white/10 px-6 py-4">
              <button
                onClick={() => {
                  createFlow(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
              >
                Template übernehmen
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
