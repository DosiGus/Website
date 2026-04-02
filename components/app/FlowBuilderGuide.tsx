'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Type,
  Radio,
  X,
  Zap,
} from "lucide-react";

// ─── Illustrations ────────────────────────────────────────────────────────────

function IllustrationOutcome() {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      {/* DM */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white shadow-lg">
          <MessageSquare className="h-8 w-8" />
        </div>
        <span className="text-[13px] font-semibold text-[#64748B]">Kunde schreibt</span>
      </div>

      <div className="flex flex-col items-center gap-1 pb-5">
        <div className="flex items-center gap-0.5">
          <div className="h-[2px] w-10 bg-[#BFDBFE]" />
          <div className="h-0 w-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #BFDBFE" }} />
        </div>
      </div>

      {/* Bot antwortet */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2450b2] shadow-[0_4px_20px_rgba(36,80,178,0.15)]">
          <Zap className="h-8 w-8" />
        </div>
        <span className="text-[13px] font-semibold text-[#64748B]">Bot antwortet</span>
      </div>

      <div className="flex flex-col items-center gap-1 pb-5">
        <div className="flex items-center gap-0.5">
          <div className="h-[2px] w-10 bg-[#BFDBFE]" />
          <div className="h-0 w-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #BFDBFE" }} />
        </div>
      </div>

      {/* Buchung fertig */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16A34A] shadow-[0_4px_20px_rgba(22,163,74,0.12)]">
          <Check className="h-8 w-8" />
        </div>
        <span className="text-[13px] font-semibold text-[#64748B]">Buchung fertig</span>
      </div>
    </div>
  );
}

function IllustrationTrigger() {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      {/* Chat bubble */}
      <div className="flex flex-col gap-2">
        <div className="rounded-2xl rounded-bl-sm bg-[#F1F5F9] px-5 py-3.5 shadow-sm">
          <p className="text-[15px] text-[#0F172A]">Ich möchte</p>
          <p className="text-[15px] font-semibold text-[#2450b2]">reservieren</p>
        </div>
        <span className="text-center text-[12px] text-[#94A3B8]">Kunde tippt</span>
      </div>

      <div className="flex items-center gap-0.5 pb-5">
        <div className="h-[2px] w-8 bg-[#BFDBFE]" />
        <div className="h-0 w-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #BFDBFE" }} />
      </div>

      {/* Flow startet */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2450b2] shadow-[0_4px_20px_rgba(36,80,178,0.15)]">
          <Zap className="h-8 w-8" />
        </div>
        <span className="text-[13px] font-semibold text-[#64748B]">Flow startet</span>
      </div>

      {/* Keywords hint */}
      <div className="ml-4 flex flex-col gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Deine Keywords</p>
        {["reservieren", "tisch buchen", "buchen"].map((kw) => (
          <div key={kw} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2450b2]" />
            <span className="text-[14px] text-[#0F172A]">{kw}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IllustrationSteps() {
  return (
    <div className="grid grid-cols-2 gap-5 py-2">
      {/* Buttons */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#BFDBFE] bg-[#F0F7FF] p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2450b2] text-white">
            <Radio className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-bold text-[#2450b2]">Buttons</span>
        </div>
        <div className="rounded-xl border border-[#BFDBFE] bg-white px-4 py-3">
          <p className="text-[14px] font-medium text-[#0F172A]">Wann möchtest du kommen?</p>
        </div>
        <div className="flex flex-col gap-2">
          {["☀️ Mittag", "🌙 Abend"].map((btn) => (
            <div key={btn} className="rounded-xl border border-[#2450b2]/20 bg-white px-4 py-2.5 text-center text-[14px] font-semibold text-[#2450b2]">
              {btn}
            </div>
          ))}
        </div>
      </div>

      {/* Freitext */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#475569] text-white">
            <Type className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-bold text-[#475569]">Freitext</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3">
          <p className="text-[14px] font-medium text-[#0F172A]">Wie lautet dein Name?</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#CBD5E1] bg-white px-4 py-3">
          <span className="text-[14px] text-[#94A3B8]">Thomas M…</span>
          <span className="ml-auto h-4 w-[2px] animate-pulse bg-[#94A3B8]" />
        </div>
        <p className="text-[12px] text-[#64748B]">Wesponde speichert die Antwort automatisch.</p>
      </div>
    </div>
  );
}

function IllustrationActivate() {
  return (
    <div className="flex flex-col items-center gap-8 py-4">
      <div className="flex items-center gap-10">
        {/* Entwurf */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-10 py-6 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#94A3B8]">Entwurf</p>
            <div className="mt-4 flex justify-center">
              <div className="relative h-8 w-14 rounded-full bg-[#CBD5E1]">
                <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-1">
          <div className="h-[2px] w-8 bg-[#E2E8F0]" />
          <ArrowRight className="h-5 w-5 text-[#94A3B8]" />
        </div>

        {/* Aktiv */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-10 py-6 text-center shadow-[0_8px_28px_rgba(36,80,178,0.14)]">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#2450b2]">Aktiv</p>
            <div className="mt-4 flex justify-center">
              <div className="relative h-8 w-14 rounded-full bg-[#2450b2]">
                <div className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[15px] font-medium text-[#64748B] text-center max-w-[300px]">
        Ab jetzt beantwortet Wesponde passende Nachrichten — rund um die Uhr, ohne dein Zutun.
      </p>
    </div>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────

type GuideStep = {
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
  points: string[];
};

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "Einmal aufbauen — dauerhaft automatisch",
    subtitle: "Ein Flow ist eine vollautomatische Konversation auf Instagram. Sobald ein Kunde dein Schlüsselwort schreibt, übernimmt Wesponde: stellt Fragen, sammelt Infos und trägt die Buchung direkt in deinen Kalender ein — ohne dein Zutun.",
    illustration: <IllustrationOutcome />,
    points: [
      "Du baust den Flow einmal auf — danach bearbeitet Wesponde jede Anfrage automatisch",
      "Buchungen, Termine und Kundendaten werden 24/7 erfasst und gespeichert",
    ],
  },
  {
    title: "Der Trigger: womit startet dein Flow?",
    subtitle: "Im Trigger-Bereich oben in deinem Flow legst du fest, welche Kundennachrichten den Bot aktivieren. Trage deine Keywords ein und wähle den Modus — \"Enthält\" reagiert auf jede Nachricht, die das Wort irgendwo beinhaltet, und ist für die meisten Fälle die bessere Wahl.",
    illustration: <IllustrationTrigger />,
    points: [
      "Mehrere Keywords gleichzeitig aktiv — z. B. \"reservieren\", \"tisch\", \"buchen\"",
      "Modus \"Enthält\" empfohlen: erkennt auch \"möchte gerne reservieren\" oder ähnliche Formulierungen",
    ],
  },
  {
    title: "Schritte aufbauen: so führst du Kunden durch",
    subtitle: "Jeder Schritt ist eine Nachricht, auf die dein Kunde antwortet. Du wählst pro Schritt — direkt im Editor — ob der Kunde auf vorgegebene Buttons tippt oder frei antwortet. Diese Entscheidung bestimmt, welche Daten erfasst werden und wie der Ablauf weitergeht.",
    illustration: <IllustrationSteps />,
    points: [
      "Buttons: Du legst feste Antwortoptionen fest — ideal für Datum, Uhrzeit oder Ja/Nein-Entscheidungen",
      "Freitext: Der Kunde schreibt frei — Wesponde speichert Name, Telefon und weitere Angaben automatisch",
    ],
  },
  {
    title: "Aktivieren — ab jetzt läuft alles automatisch",
    subtitle: "Wenn dein Flow vollständig ist, schaltest du ihn oben rechts auf \"Aktiv\". Ab diesem Moment beantwortet Wesponde passende Instagram-Nachrichten eigenständig und legt neue Buchungen direkt in deinem Kalender an.",
    illustration: <IllustrationActivate />,
    points: [
      "Mehrere Flows parallel aktiv möglich — z. B. für Reservierungen, Anfragen und Feedback getrennt",
      "Jederzeit pausierbar oder anpassbar, ohne laufende Konversationen zu unterbrechen",
    ],
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function FlowBuilderGuide({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const total = GUIDE_STEPS.length;
  const step = GUIDE_STEPS[currentStep]!;
  const isLast = currentStep === total - 1;

  const goTo = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <motion.div
        className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <motion.div
        className="relative flex w-full max-w-[720px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_100px_rgba(15,23,42,0.22),0_0_0_1px_rgba(226,232,240,0.8)]"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-label="Flow Builder Guide"
      >
        {/* Progress bar */}
        <div className="flex h-1 w-full bg-[#F1F5F9]">
          <motion.div
            className="h-full rounded-r-full bg-[#2450b2]"
            animate={{ width: `${((currentStep + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-0">
          <span className="text-[13px] font-semibold text-[#CBD5E1]">
            {currentStep + 1} / {total}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] text-[#94A3B8] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            aria-label="Guide schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 40 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="px-8 pt-5 pb-8"
            >
              {/* Title */}
              <h2 className="text-[28px] font-bold tracking-tight text-[#0F172A] leading-snug">
                {step.title}
              </h2>
              <p className="mt-2.5 text-[16px] leading-relaxed text-[#475569]">
                {step.subtitle}
              </p>

              {/* Illustration */}
              <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#FAFCFF] px-6 py-2">
                {step.illustration}
              </div>

              {/* Points */}
              <div className="mt-5 space-y-2.5">
                {step.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF]">
                      <Check className="h-3 w-3 text-[#2450b2]" />
                    </div>
                    <p className="text-[15px] text-[#475569]">{point}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#F1F5F9] px-8 py-5">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {GUIDE_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={[
                  "rounded-full transition-all duration-200",
                  i === currentStep
                    ? "h-2.5 w-6 bg-[#2450b2]"
                    : i < currentStep
                      ? "h-2.5 w-2.5 bg-[#BFDBFE]"
                      : "h-2.5 w-2.5 bg-[#E2E8F0] hover:bg-[#CBD5E1]",
                ].join(" ")}
                aria-label={`Schritt ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => currentStep > 0 && goTo(currentStep - 1)}
              disabled={currentStep === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Zurück"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => isLast ? onClose() : goTo(currentStep + 1)}
              className="inline-flex items-center gap-2 rounded-full bg-[#2450b2] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_2px_16px_rgba(36,80,178,0.28)] transition-all hover:bg-[#1a46c4]"
            >
              {isLast ? (
                <>Loslegen <Zap className="h-4 w-4" /></>
              ) : (
                <>Weiter <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
