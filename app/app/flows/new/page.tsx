'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, ListChecks, SquarePen, Files, X, ArrowLeft, CalendarCheck, Zap } from "lucide-react";
import { createSupabaseBrowserClient } from "../../../../lib/supabaseBrowserClient";
import type { FlowTemplate } from "../../../../lib/flowTemplates";
import FlowSetupWizard from "../../../../components/app/FlowSetupWizard";
import FlowSimulator from "../../../../components/app/FlowSimulator";
import type { Node, Edge } from "reactflow";
import type { FlowMetadata, FlowTrigger } from "../../../../lib/flowTypes";
import { getBookingLabels, getDefaultTemplateVertical } from "../../../../lib/verticals";
import useAccountVertical from "../../../../lib/useAccountVertical";
import { getDefaultFlowPreset, getEmptyReservationFlowPreset } from "../../../../lib/defaultFlow";
import Badge from "../../../../components/ui/Badge";
import Button from "../../../../components/ui/Button";

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
  const { vertical: accountVertical } = useAccountVertical();
  const labels = getBookingLabels(accountVertical);
  const [previewTemplate, setPreviewTemplate] = useState<FlowTemplate | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>("choose");
  const [flowType, setFlowType] = useState<"reservation" | "custom">("reservation");

  const handleFlowTypeChange = (newType: "reservation" | "custom") => {
    setFlowType(newType);
    setVerticalFilter("alle");
  };

  useEffect(() => {
    async function loadTemplates() {
      setLoadingTemplates(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch("/api/templates", {
          headers: session?.access_token
            ? { authorization: `Bearer ${session.access_token}` }
            : {},
        });
        const data = await response.json();
        setTemplates(Array.isArray(data) ? data : []);
      } catch {
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, [supabase]);

  useEffect(() => {
    if (!accountVertical) return;
    const defaultVertical = getDefaultTemplateVertical(accountVertical);
    if (defaultVertical) {
      setVerticalFilter(defaultVertical);
    }
  }, [accountVertical]);

  const createFlow = async (templateId?: string, overrideMetadata?: FlowMetadata) => {
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
        name: flowName,
        templateId,
        ...(overrideMetadata ? { metadata: overrideMetadata } : {}),
      }),
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
    const values = templates
      .filter((t) => {
        const isFreeTemplate = t.vertical === "Freier Flow";
        return flowType === "custom" ? isFreeTemplate : !isFreeTemplate;
      })
      .map((t) => t.vertical);
    return ["alle", ...Array.from(new Set(values))];
  }, [templates, flowType]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Filter by flowType
      const isFreeTemplate = template.vertical === "Freier Flow";
      if (flowType === "custom" && !isFreeTemplate) return false;
      if (flowType === "reservation" && isFreeTemplate) return false;
      // Hide system-only templates from the picker
      if ((template.metadata as any)?.systemTemplate) return false;

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
  }, [templates, templateSearch, verticalFilter, flowType]);

  // Show wizard if in wizard mode
  if (creationMode === "wizard") {
    return (
      <div className="app-page-enter flex min-h-[calc(100vh-180px)] w-full flex-col items-center justify-center gap-8 py-6">
        {status === "creating" ? (
          <div className="w-full max-w-xl">
            <div className="app-panel flex flex-col items-center justify-center gap-4 p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
              <p className="text-lg font-semibold text-[#0F172A]">
                Flow wird erstellt...
              </p>
              <p className="max-w-md text-sm text-[#475569]">
                Der Assistent baut gerade deinen Ablauf und leitet dich danach
                direkt in den Builder weiter.
              </p>
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
          <div className="w-full max-w-xl">
            <p className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-center text-sm font-medium text-[#B91C1C]">
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
      <div className="app-page-enter flex min-h-[calc(100vh-180px)] w-full flex-col items-center justify-center gap-8 py-6">
        <div className="app-panel mx-auto w-full max-w-[1040px] space-y-10 rounded-[32px] p-12 shadow-[0_28px_70px_rgba(15,23,42,0.10)] sm:p-14 lg:space-y-12 lg:p-16">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCreationMode("choose")}
              className="inline-flex items-center gap-2.5 text-[17px] font-medium text-[#475569] transition-colors hover:text-[#0F172A]"
            >
              <ArrowLeft className="h-5 w-5" />
              Zurück zur Auswahl
            </button>
            <Badge variant="accent" className="px-3 py-1 text-[12px] tracking-[0.14em]">
              Leerer Flow
            </Badge>
          </div>

          <div className="space-y-5">
            <h1 className="text-[38px] font-semibold tracking-tight text-[#0F172A] sm:text-[44px]">
              Wie soll dein Flow heißen?
            </h1>
            <p className="max-w-[760px] text-[21px] leading-9 text-[#475569]">
              Gib deinem neuen Flow einen klaren Namen. Danach öffnet sich direkt
              der Builder mit einer sauberen Startkonfiguration.
            </p>
          </div>

          <div className="space-y-5">
            <input
              className="app-input min-h-[78px] w-full rounded-[22px] px-6 py-5 text-[24px] font-semibold leading-none tracking-tight sm:text-[24px]"
              value={flowName}
              onChange={(event) => setFlowName(event.target.value)}
              style={{ fontSize: "24px", lineHeight: "1.15" }}
            />
            <Button
              onClick={() => {
                if (flowType === "custom") {
                  const preset = getDefaultFlowPreset(accountVertical, "custom");
                  createFlowFromWizard({
                    name: flowName,
                    nodes: preset.nodes,
                    edges: preset.edges,
                    triggers: preset.triggers,
                    metadata: preset.metadata,
                  });
                } else {
                  const preset = getEmptyReservationFlowPreset(accountVertical);
                  createFlowFromWizard({
                    name: flowName,
                    nodes: preset.nodes,
                    edges: preset.edges,
                    triggers: preset.triggers,
                    metadata: preset.metadata,
                  });
                }
              }}
              loading={status === "creating"}
              fullWidth
              size="lg"
              className="min-h-[72px] text-[18px]"
            >
              Flow anlegen
            </Button>
          </div>

          {error ? (
            <p className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-[17px] font-medium text-[#B91C1C]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-enter space-y-10">
      <div className="mx-auto max-w-[1440px] space-y-8 px-4 pb-8 pt-2 xl:px-6">
        <div className="text-center">
          <Badge variant="accent">Neuer Flow</Badge>
          <h1 className="mt-4 text-[34px] font-semibold tracking-tight text-[#0F172A] sm:text-[38px]">
            Wie möchtest du starten?
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-7 text-[#475569]">
            Wähle eine Richtung für den Start und springe dann direkt in den
            passenden Builder-Flow.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => handleFlowTypeChange("reservation")}
            className={`flex min-h-[52px] items-center gap-2.5 rounded-xl border px-6 py-3 text-[15px] font-semibold transition-all ${
              flowType === "reservation"
                ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                : "border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            }`}
          >
            <CalendarCheck className="h-4.5 w-4.5" />
            Buchungs-Flow
          </button>
          <button
            type="button"
            onClick={() => handleFlowTypeChange("custom")}
            className={`flex min-h-[52px] items-center gap-2.5 rounded-xl border px-6 py-3 text-[15px] font-semibold transition-all ${
              flowType === "custom"
                ? "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]"
                : "border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            }`}
          >
            <Zap className="h-4.5 w-4.5" />
            Freier Flow
          </button>
        </div>

        <div className={`grid gap-6 ${flowType === "reservation" ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
          {flowType === "reservation" && (
            <button
              type="button"
              onClick={() => setCreationMode("wizard")}
              className="group relative flex min-h-[320px] flex-col items-start rounded-[24px] border border-[#BFDBFE] bg-[#EFF6FF] p-8 text-left transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(37,99,235,0.14)]"
            >
              <div className="absolute -top-3 right-5">
                <span className="rounded-full bg-[#2563EB] px-3.5 py-1 text-[12px] font-semibold text-white">
                  Empfohlen
                </span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]">
                <ListChecks className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-[26px] font-semibold tracking-tight text-[#0F172A]">
                Setup-Assistent
              </h3>
              <p className="mt-3 max-w-sm text-[16px] leading-7 text-[#475569]">
                Beantworte 5 einfache Fragen und wir erstellen deinen {labels.bookingSingular}-Flow automatisch.
              </p>
              <span className="mt-auto pt-8 text-[16px] font-semibold text-[#1D4ED8] transition-colors group-hover:text-[#1E40AF]">
                Assistent starten →
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCreationMode("template")}
            className="group flex min-h-[320px] flex-col items-start rounded-[24px] border border-[#E2E8F0] bg-white p-8 text-left transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#475569] transition-colors group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB]">
              <Files className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-[26px] font-semibold tracking-tight text-[#0F172A]">
              Aus Template
            </h3>
            <p className="mt-3 max-w-sm text-[16px] leading-7 text-[#475569]">
              {flowType === "custom"
                ? "Wähle eine fertige Vorlage für deinen Freien Flow."
                : "Wähle ein fertiges Template für deine Branche und passe es an."}
            </p>
            <span className="mt-auto pt-8 text-[16px] font-semibold text-[#1D4ED8] transition-colors group-hover:text-[#1E40AF]">
              Templates ansehen →
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCreationMode("empty")}
            className="group flex min-h-[320px] flex-col items-start rounded-[24px] border border-[#E2E8F0] bg-white p-8 text-left transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#475569] transition-colors group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB]">
              <SquarePen className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-[26px] font-semibold tracking-tight text-[#0F172A]">
              Leerer Flow
            </h3>
            <p className="mt-3 max-w-sm text-[16px] leading-7 text-[#475569]">
              Starte mit einem leeren Flow und baue alles selbst von Grund auf.
            </p>
            <span className="mt-auto pt-8 text-[16px] font-semibold text-[#1D4ED8] transition-colors group-hover:text-[#1E40AF]">
              Leer starten →
            </span>
          </button>
        </div>
      </div>

      {creationMode === "template" && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/35 p-5 backdrop-blur-sm lg:p-8">
          <div className="w-full max-w-[1380px] rounded-[30px] border border-[#E2E8F0] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-6 border-b border-[#E2E8F0] px-8 py-7 lg:px-10 lg:py-8">
              <div>
                <Badge variant="accent">Templates</Badge>
                <h2 className="mt-4 text-[28px] font-semibold tracking-tight text-[#0F172A] lg:text-[32px]">
                  Starte mit einer Vorlage
                </h2>
                <p className="mt-2 max-w-3xl text-base leading-7 text-[#475569]">
                  Vorlagen geben dir eine fertige Struktur, die du sofort an dein Geschäft anpassen kannst.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreationMode("choose")}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                aria-label="Templates schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-5 border-b border-[#E2E8F0] px-8 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-6">
              <button
                type="button"
                onClick={() => setCreationMode("choose")}
                className="inline-flex items-center gap-2 text-base font-medium text-[#475569] transition-colors hover:text-[#0F172A]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Zurück zur Auswahl</span>
              </button>
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <input
                  className="app-input min-h-[54px] w-full px-5 py-3 text-[15px] sm:w-[320px] lg:w-[360px]"
                  placeholder="Template durchsuchen..."
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                />
                <select
                  value={verticalFilter}
                  onChange={(event) => setVerticalFilter(event.target.value)}
                  className="app-select min-h-[54px] min-w-[220px] px-5 text-[15px]"
                >
                  {uniqueVerticals.map((vertical) => (
                    <option key={vertical} value={vertical}>
                      {vertical === "alle" ? "Alle Branchen" : vertical}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-8 py-8 lg:px-10 lg:py-10">
              {loadingTemplates ? (
                <div className="flex items-center gap-3 rounded-[24px] border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-base text-[#475569]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Templates werden geladen...
                </div>
              ) : (
                <div className="grid items-stretch gap-6 [grid-template-columns:repeat(auto-fit,minmax(380px,1fr))]">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="app-card app-card-interactive flex min-h-[320px] flex-col justify-between rounded-[24px] p-7"
                    >
                      <div>
                        <p className="text-[12px] uppercase tracking-[0.16em] text-[#94A3B8]">
                          {template.vertical}
                        </p>
                        <h3 className="mt-4 text-[28px] font-semibold tracking-tight text-[#0F172A]">
                          {template.name}
                        </h3>
                        <p className="mt-4 max-w-[36ch] text-base leading-7 text-[#475569]">
                          {template.description}
                        </p>
                      </div>
                      <div className="mt-8 flex gap-3">
                        <Button
                          onClick={() => createFlow(template.id)}
                          fullWidth
                          size="lg"
                        >
                          Flow erstellen
                        </Button>
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(template)}
                          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                          title="Template ansehen"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!filteredTemplates.length && (
                    <p className="rounded-[24px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-base text-[#64748B]">
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#94A3B8]">
                  {previewTemplate.vertical}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-[#0F172A]">
                  {previewTemplate.name}
                </h3>
                <p className="mt-2 text-sm text-[#475569]">
                  {previewTemplate.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                aria-label="Vorschau schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                    Ueberblick
                  </p>
                  <p className="mt-2 text-sm text-[#475569]">
                    Starte rechts die Vorschau und teste den Ablauf direkt.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#475569]">
                    <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">
                      {previewTemplate.nodes.length} Schritte
                    </span>
                    <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">
                      {previewTemplate.edges.length} Verbindungen
                    </span>
                    <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">
                      {previewTemplate.triggers?.length ?? 0} Startpunkte
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                    Schritte in Kurzform
                  </p>
                  <ol className="mt-3 max-h-52 space-y-2 overflow-y-auto text-sm text-[#475569]">
                    {previewTemplate.nodes.map((node, index) => (
                      <li
                        key={node.id}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2"
                      >
                        <span className="font-medium text-[#0F172A]">
                          Schritt {index + 1}:
                        </span>{" "}
                        {node.data?.label}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <FlowSimulator
                  nodes={previewTemplate.nodes as Node[]}
                  edges={previewTemplate.edges as Edge[]}
                  triggers={(previewTemplate.triggers ?? []) as FlowTrigger[]}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[#E2E8F0] px-6 py-4">
              <Button
                onClick={() => {
                  createFlow(previewTemplate.id);
                  setPreviewTemplate(null);
                }}
                fullWidth
              >
                Template uebernehmen
              </Button>
              <Button
                onClick={() => setPreviewTemplate(null)}
                variant="secondary"
              >
                Schliessen
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
