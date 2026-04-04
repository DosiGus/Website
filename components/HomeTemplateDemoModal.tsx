"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
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

/* ── iPhone Mockup ─────────────────────────────────────────────── */
function IPhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto" style={{ width: 284 }}>
      {/* Side Buttons */}
      <div className="absolute -left-[3px] top-[96px] h-8 w-[3px] rounded-l-sm bg-[#c8cdd6]" />
      <div className="absolute -left-[3px] top-[136px] h-14 w-[3px] rounded-l-sm bg-[#c8cdd6]" />
      <div className="absolute -left-[3px] top-[196px] h-14 w-[3px] rounded-l-sm bg-[#c8cdd6]" />
      <div className="absolute -right-[3px] top-[156px] h-20 w-[3px] rounded-r-sm bg-[#c8cdd6]" />

      {/* Phone Body */}
      <div className="relative overflow-hidden rounded-[44px] border-[2.5px] border-[#c8cdd6] bg-[#0B0B0E] shadow-[0_20px_60px_rgba(28,53,122,0.14)]">
        <div
          className="relative flex flex-col"
          style={{
            height: 580,
            background: "linear-gradient(180deg, #121216 0%, #0A0A0D 100%)",
          }}
        >
          {/* Screen reflection */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-3 z-20 flex h-[26px] w-[90px] -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-black">
            <div className="h-2.5 w-2.5 rounded-full bg-[#18181B] ring-1 ring-[#27272A]" />
            <div className="h-[5px] w-[5px] rounded-full bg-[#2F2F35]" />
          </div>

          {/* Status Bar */}
          <div className="relative z-10 flex shrink-0 items-center justify-between px-7 pt-4 pb-1">
            <span className="text-[12px] font-semibold text-white">9:41</span>
            <div className="flex items-center gap-[5px]">
              <div className="flex items-end gap-[2px]">
                <div className="h-[3px] w-[2px] rounded-sm bg-white" />
                <div className="h-[5px] w-[2px] rounded-sm bg-white" />
                <div className="h-[7px] w-[2px] rounded-sm bg-white" />
                <div className="h-[9px] w-[2px] rounded-sm bg-white" />
              </div>
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C7.5 3 3.75 4.95 1 8l1.5 1.5C4.75 6.75 8.25 5 12 5s7.25 1.75 9.5 4.5L23 8c-2.75-3.05-6.5-5-11-5zm0 4c-3 0-5.75 1.35-7.5 3.5L6 12c1.25-1.5 3.25-2.5 6-2.5s4.75 1 6 2.5l1.5-1.5C17.75 8.35 15 7 12 7zm0 4c-1.75 0-3.25.75-4.5 2L9 14.5c.75-.75 1.75-1 3-1s2.25.25 3 1L16.5 13c-1.25-1.25-2.75-2-4.5-2zm0 4c-1 0-1.75.5-2.25 1L12 18l2.25-2c-.5-.5-1.25-1-2.25-1z" />
              </svg>
              <div className="flex items-center">
                <div className="h-[10px] w-[20px] rounded-[2px] border border-white p-[1px]">
                  <div className="h-full w-[70%] rounded-[1px] bg-white" />
                </div>
                <div className="ml-[1px] h-[3px] w-[1px] rounded-r-sm bg-white" />
              </div>
            </div>
          </div>

          {/* Instagram DM Header */}
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0B0E] bg-emerald-500" />
              </div>
              <div>
                <p className="text-[12px] font-semibold leading-tight text-white">Dein Business</p>
                <p className="text-[10px] text-[#22C55E]">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-white/90">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Chat content */}
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
            {children}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-1.5 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */
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
          className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#2a4ea7]/20 bg-white/70 px-6 py-3.5 text-sm font-medium text-[#1f3f90] transition-all hover:bg-white"
        >
          Demo testen
        </a>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-[#2a4ea7]/15 bg-white shadow-[0_20px_60px_rgba(28,53,122,0.10)]">

            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#2a4ea7]/10 px-5 py-4 sm:px-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#2450b2]">
                  Interaktive Demo
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#171923] sm:text-2xl">
                  Branche wählen, Template testen
                </h2>
                <p className="mt-1.5 text-sm text-[#67718a]">
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
                  className="rounded-xl border border-[#2a4ea7]/15 bg-[#f6f9ff] p-2 text-[#67718a] transition-colors hover:bg-[#edf1f8] hover:text-[#171923]"
                  aria-label="Demo schließen"
                >
                  <X className="h-4 w-4" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-[#2a4ea7]/15 bg-[#f6f9ff] p-2 text-[#67718a] transition-colors hover:bg-[#edf1f8] hover:text-[#171923]"
                  aria-label="Demo schließen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Content Grid */}
            <div className="grid max-h-[80vh] gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">

              {/* Left — Selection */}
              <div className="overflow-y-auto border-b border-[#2a4ea7]/10 bg-[#f6f9ff] p-5 sm:p-6 lg:border-b-0 lg:border-r">

                {/* Step 1: Branche */}
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2450b2]">
                  1. Branche wählen
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {loading ? (
                    <div className="col-span-full flex items-center gap-2 rounded-xl border border-[#2a4ea7]/10 bg-white px-3 py-2.5 text-sm text-[#67718a]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#2450b2]" />
                      Vorlagen werden geladen …
                    </div>
                  ) : (
                    DEMO_BRANCHES.map((vertical) => (
                      <button
                        key={vertical}
                        type="button"
                        onClick={() => setSelectedVertical(vertical)}
                        className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                          selectedVertical === vertical
                            ? "border-[#2450b2] bg-[#2450b2]/8 text-[#2450b2] shadow-[0_0_0_1px_rgba(36,80,178,0.15)]"
                            : "border-[#2a4ea7]/12 bg-white text-[#3d4255] hover:border-[#2a4ea7]/25 hover:bg-[#f0f4ff]"
                        }`}
                      >
                        {vertical}
                      </button>
                    ))
                  )}
                </div>

                {/* Step 2: Template */}
                <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2450b2]">
                  2. Template auswählen
                </p>
                <div className="mt-3 space-y-2.5">
                  {!selectedVertical ? (
                    <p className="rounded-xl border border-dashed border-[#2a4ea7]/15 bg-white px-4 py-3 text-sm text-[#7485ad]">
                      Wähle zuerst eine Branche.
                    </p>
                  ) : visibleTemplates.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#2a4ea7]/15 bg-white px-4 py-3 text-sm text-[#7485ad]">
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
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-[#2450b2] bg-[#2450b2]/6 shadow-[0_0_0_1px_rgba(36,80,178,0.12)]"
                              : "border-[#2a4ea7]/12 bg-white hover:border-[#2a4ea7]/25 hover:bg-[#f0f4ff]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#171923]">{template.name}</p>
                              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#7485ad]">
                                {template.vertical}
                              </p>
                              <p className="mt-1 text-sm leading-relaxed text-[#3d4255]">
                                {template.description}
                              </p>
                            </div>
                            {isSelected ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2450b2]" />
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {error ? (
                  <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </p>
                ) : null}
              </div>

              {/* Right — iPhone Mockup with Simulation */}
              <div className="flex items-center justify-center overflow-y-auto bg-white p-5 sm:p-6">
                {selectedTemplate ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-center">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#7485ad]">
                        {selectedTemplate.vertical}
                      </p>
                      <h3 className="mt-0.5 text-base font-semibold text-[#171923]">
                        {selectedTemplate.name}
                      </h3>
                    </div>
                    <IPhoneMockup>
                      <FlowSimulator
                        key={selectedTemplate.id}
                        hideHeader
                        nodes={selectedTemplate.nodes}
                        edges={selectedTemplate.edges}
                        triggers={selectedTemplate.triggers}
                      />
                    </IPhoneMockup>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2a4ea7]/15 bg-[#f6f9ff]">
                      <svg className="h-7 w-7 text-[#2450b2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="max-w-[240px] text-sm leading-relaxed text-[#67718a]">
                      Wähle links Branche und Template, um den Flow hier live zu simulieren.
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
