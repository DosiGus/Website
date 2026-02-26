"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import type { Edge, Node } from "reactflow";
import type { FlowTrigger } from "../lib/flowTypes";
import FlowSimulator from "./app/FlowSimulator";

type DemoTemplate = {
  id: string;
  slug: string;
  name: string;
  vertical: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  triggers: FlowTrigger[];
};

const DEMO_BRANCHES = [
  "Restaurant & Bar",
  "Friseur & Beauty",
  "Medizin & Praxis",
  "Fitness & Wellness",
] as const;

const REVIEW_VERTICAL = "Bewertungen";

type HomeTemplateDemoModalProps = {
  defaultOpen?: boolean;
  hideTrigger?: boolean;
  closeHref?: string;
};

export default function HomeTemplateDemoModal({
  defaultOpen = false,
  hideTrigger = false,
  closeHref,
}: HomeTemplateDemoModalProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<DemoTemplate[]>([]);
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const visibleTemplates = useMemo(() => {
    if (!selectedVertical) return [];
    return templates
      .filter(
        (template) =>
          template.vertical === selectedVertical || template.vertical === REVIEW_VERTICAL,
      )
      .sort((a, b) => {
        if (a.vertical === b.vertical) return a.name.localeCompare(b.name, "de");
        if (a.vertical === selectedVertical) return -1;
        if (b.vertical === selectedVertical) return 1;
        return a.vertical.localeCompare(b.vertical, "de");
      });
  }, [templates, selectedVertical]);

  const loadTemplates = useCallback(async () => {
    if (loading || templates.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const { fallbackTemplates } = await import("../lib/flowTemplates");
      const data = fallbackTemplates.map((template) => ({
        id: template.id,
        slug: template.slug,
        name: template.name,
        vertical: template.vertical,
        description: template.description,
        nodes: template.nodes as Node[],
        edges: template.edges as Edge[],
        triggers: (template.triggers ?? []) as FlowTrigger[],
      })) as DemoTemplate[];
      setTemplates(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(`Vorlagen konnten nicht geladen werden: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [loading, templates.length]);

  const openModal = () => {
    setIsOpen(true);
    setSelectedVertical(null);
    setSelectedTemplateId(null);
  };

  const closeModal = useCallback(() => {
    if (hideTrigger && closeHref) {
      window.location.href = closeHref;
      return;
    }
    setIsOpen(false);
  }, [closeHref, hideTrigger]);

  useEffect(() => {
    if (!isOpen) return;
    void loadTemplates();
  }, [isOpen, loadTemplates]);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, closeModal]);

  useEffect(() => {
    if (!selectedVertical) {
      setSelectedTemplateId(null);
      return;
    }
    setSelectedTemplateId((current) => {
      if (!current) return current;
      const stillExists = visibleTemplates.some((template) => template.id === current);
      return stillExists ? current : null;
    });
  }, [selectedVertical, visibleTemplates]);

  return (
    <>
      {!hideTrigger ? (
        <a
          href="/demo"
          onClick={(event) => {
            event.preventDefault();
            openModal();
          }}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-white/10 transition-all hover:bg-emerald-500 hover:text-white hover:shadow-emerald-500/30"
        >
          Demo starten
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Interaktive Demo</p>
                <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  Branche wählen, Template testen
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Genau wie in der App: Vorlage auswählen und den Flow live simulieren.
                </p>
              </div>
              {closeHref ? (
                <a
                  href={closeHref}
                  onClick={(event) => {
                    event.preventDefault();
                    closeModal();
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Demo schließen"
                >
                  <X className="h-4 w-4" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Demo schließen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid max-h-[80vh] gap-0 overflow-hidden lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="overflow-y-auto border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">1. Branche wählen</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {loading ? (
                    <div className="col-span-full flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Vorlagen werden geladen …
                    </div>
                  ) : (
                    DEMO_BRANCHES.map((vertical) => (
                      <button
                        key={vertical}
                        type="button"
                        onClick={() => setSelectedVertical(vertical)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                          selectedVertical === vertical
                            ? "border-emerald-500/60 bg-emerald-500/15 text-white"
                            : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        {vertical}
                      </button>
                    ))
                  )}
                </div>

                <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  2. Template auswählen
                </p>
                <div className="mt-3 space-y-3">
                  {!selectedVertical ? (
                    <p className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-500">
                      Wähle zuerst eine Branche.
                    </p>
                  ) : visibleTemplates.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-500">
                      Für diese Branche sind aktuell keine Vorlagen verfügbar.
                    </p>
                  ) : (
                    visibleTemplates.map((template) => {
                      const isSelected = selectedTemplateId === template.id;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(template.id)}
                          className={`w-full rounded-xl border p-4 text-left transition-colors ${
                            isSelected
                              ? "border-indigo-500/70 bg-indigo-500/10"
                              : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{template.name}</p>
                              <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">{template.vertical}</p>
                              <p className="mt-1 text-sm text-zinc-400">{template.description}</p>
                            </div>
                            {isSelected ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {error ? (
                  <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="overflow-y-auto p-5 sm:p-6">
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">{selectedTemplate.vertical}</p>
                      <h3 className="mt-1 text-lg font-semibold text-white">{selectedTemplate.name}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{selectedTemplate.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          {selectedTemplate.nodes.length} Schritte
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                          {selectedTemplate.edges.length} Verbindungen
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <FlowSimulator
                        key={selectedTemplate.id}
                        nodes={selectedTemplate.nodes}
                        edges={selectedTemplate.edges}
                        triggers={selectedTemplate.triggers}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
                    <p className="max-w-sm text-sm text-zinc-500">
                      Wähle links zuerst Branche und Template. Danach kannst du hier mit
                      <span className="mx-1 font-medium text-zinc-300">Simulation starten</span>
                      den gesamten Flow testen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
