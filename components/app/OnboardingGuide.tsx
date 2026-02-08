'use client';

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Plug, Workflow, X } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";

type GuideStep = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  href?: string;
  icon: typeof Plug;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    id: "integrations",
    title: "Instagram verbinden",
    description:
      "Verbinde deinen Instagram Business- oder Creator-Account, damit Wesponde DMs automatisiert beantworten kann.",
    bullets: [
      "Gehe zu Integrationen",
      "Klicke auf Instagram verbinden",
      "Bestaetige den Meta-Zugriff",
    ],
    ctaLabel: "Zu Integrationen",
    href: "/app/integrations",
    icon: Plug,
  },
  {
    id: "flow-create",
    title: "Ersten Flow erstellen",
    description:
      "Flows definieren, wie Wesponde antwortet. Starte mit einer Vorlage oder einem leeren Flow.",
    bullets: ["Neuen Flow anlegen", "Trigger setzen", "Flow speichern"],
    ctaLabel: "Flow erstellen",
    href: "/app/flows/new",
    icon: Workflow,
  },
  {
    id: "flow-builder",
    title: "Flow Builder kurz erklaert",
    description:
      "Links findest du Trigger & Flows, in der Mitte baust du den Ablauf, rechts konfigurierst du Inhalte.",
    bullets: [
      "Knoten anklicken, um Inhalte zu bearbeiten",
      "Rechts im Inspector Texte & Variablen setzen",
      "Verbindungen ziehen, um Logik aufzubauen",
    ],
    ctaLabel: "Guide abschliessen",
    href: "/app/flows/new",
    icon: Compass,
  },
];

export default function OnboardingGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const step = GUIDE_STEPS[stepIndex];
  const isOnStepPage = step.href ? pathname.startsWith(step.href) : false;

  const markSeen = async () => {
    if (!userId) return;
    await supabase.auth.updateUser({
      data: {
        onboarding_seen: true,
        onboarding_seen_at: new Date().toISOString(),
      },
    });
  };

  const closeGuide = async () => {
    setIsOpen(false);
    await markSeen();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user || cancelled) return;
        setUserId(data.user.id);
        const seen = Boolean(data.user.user_metadata?.onboarding_seen);
        if (!seen) {
          setIsOpen(true);
        }
      } catch {
        // Ignore onboarding errors.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ step?: number }>).detail;
      if (typeof detail?.step === "number") {
        const nextStep = Math.max(0, Math.min(GUIDE_STEPS.length - 1, detail.step));
        setStepIndex(nextStep);
      }
      setIsOpen(true);
    };
    window.addEventListener("wesponde:onboarding:open", handler);
    return () => window.removeEventListener("wesponde:onboarding:open", handler);
  }, []);

  if (!isOpen) return null;

  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center sm:pb-0">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeGuide}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
              <StepIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Schritt {stepIndex + 1} von {GUIDE_STEPS.length}
              </p>
              <h2 className="text-lg font-semibold text-white">{step.title}</h2>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-zinc-400 transition-colors hover:text-white"
            onClick={closeGuide}
            aria-label="Guide schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-zinc-300">{step.description}</p>

        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          {step.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-white/30 hover:text-white"
            onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={stepIndex === 0}
          >
            Zurueck
          </button>
          <button
            type="button"
            className="rounded-full bg-emerald-500/90 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
            onClick={() => {
              if (step.href && !isOnStepPage) {
                router.push(step.href);
              }
              if (stepIndex < GUIDE_STEPS.length - 1) {
                setStepIndex((prev) => prev + 1);
              } else {
                closeGuide();
              }
            }}
          >
            {isOnStepPage && stepIndex < GUIDE_STEPS.length - 1 ? "Weiter" : step.ctaLabel}
          </button>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-white"
            onClick={closeGuide}
          >
            <Compass className="h-4 w-4" />
            Spaeter erinnern
          </button>
        </div>
      </div>
    </div>
  );
}
