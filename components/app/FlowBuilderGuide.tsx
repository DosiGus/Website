'use client';

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Link2,
  MessageSquare,
  Radio,
  Type,
  X,
  Zap,
} from "lucide-react";

type GuideStep = {
  chapter: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
  keyPoints: { label: string; text: string }[];
};

// ─── Illustrations ─────────────────────────────────────────────────────────

function IllustrationFlowConcept() {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white shadow-lg">
          <MessageSquare className="h-8 w-8" />
        </div>
        <span className="text-[13px] font-semibold text-[#64748B]">Instagram DM</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-0.5">
          <div className="h-[2px] w-10 bg-[#CBD5E1]" />
          <div className="h-0 w-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #CBD5E1" }} />
        </div>
        <span className="text-[12px] text-[#94A3B8]">Trigger</span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2450b2] shadow-[0_4px_16px_rgba(36,80,178,0.14)]">
          <Zap className="h-8 w-8" />
        </div>
        <span className="text-[13px] font-semibold text-[#64748B]">Flow läuft</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-0.5">
          <div className="h-[2px] w-10 bg-[#CBD5E1]" />
          <div className="h-0 w-0" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #CBD5E1" }} />
        </div>
        <span className="text-[12px] text-[#94A3B8]">Antwort</span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0FDF4] text-[#16A34A] shadow-[0_4px_16px_rgba(22,163,74,0.12)]">
          <Check className="h-8 w-8" />
        </div>
        <span className="text-[13px] font-semibold text-[#64748B]">Buchung fertig</span>
      </div>
    </div>
  );
}

function IllustrationTrigger() {
  return (
    <div className="flex justify-center py-2">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#BFDBFE] bg-[#F0F7FF] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2450b2] text-white">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-[16px] font-semibold text-[#0F172A]">Trigger</span>
          <span className="ml-auto rounded-full bg-[#DBEAFE] px-3 py-1 text-[13px] font-semibold text-[#1D4ED8]">
            enthält
          </span>
        </div>
        <div className="space-y-2">
          {["reservierung", "tisch buchen", "reservieren"].map((kw) => (
            <div key={kw} className="flex items-center gap-3 rounded-xl border border-[#BFDBFE] bg-white px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-[#2450b2]" />
              <span className="text-[15px] font-medium text-[#0F172A]">{kw}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[14px] text-[#64748B]">Jedes dieser Keywords startet den Flow.</p>
      </div>
    </div>
  );
}

function IllustrationNodeTypes() {
  const nodeTypes = [
    { icon: MessageSquare, label: "Nachricht", color: "bg-[#EFF6FF] text-[#2450b2]", desc: "Sendet Text" },
    { icon: Radio, label: "Auswahl", color: "bg-[#F0FDF4] text-[#16A34A]", desc: "Buttons" },
    { icon: Type, label: "Eingabe", color: "bg-[#FFF7ED] text-[#C2410C]", desc: "Freier Text" },
    { icon: Check, label: "Bestätigung", color: "bg-[#DCFCE7] text-[#15803D]", desc: "Abschluss" },
    { icon: Link2, label: "Link", color: "bg-[#F5F3FF] text-[#7C3AED]", desc: "URL" },
    { icon: Info, label: "Info", color: "bg-[#F8FAFC] text-[#64748B]", desc: "Hinweis" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 py-2">
      {nodeTypes.map(({ icon: Icon, label, color, desc }) => (
        <div key={label} className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#E2E8F0] bg-white p-5 text-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <span className="text-[15px] font-semibold text-[#0F172A]">{label}</span>
          <span className="text-[13px] text-[#94A3B8]">{desc}</span>
        </div>
      ))}
    </div>
  );
}

function IllustrationAnswerTypes() {
  return (
    <div className="grid grid-cols-2 gap-5 py-2">
      {/* Buttons mode */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#BFDBFE] bg-[#F0F7FF] p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2450b2] text-white">
            <Radio className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-bold uppercase tracking-wider text-[#2450b2]">Buttons</span>
        </div>
        <div className="rounded-xl border border-[#BFDBFE] bg-white px-4 py-3">
          <p className="text-[14px] font-medium text-[#0F172A]">Wann möchtest du kommen?</p>
        </div>
        <div className="flex flex-col gap-2">
          {["☀️ Mittag", "🌙 Abend"].map((btn) => (
            <div key={btn} className="rounded-xl border-2 border-[#2450b2]/25 bg-white px-4 py-2.5 text-center text-[14px] font-semibold text-[#2450b2]">
              {btn}
            </div>
          ))}
        </div>
        <p className="text-[12px] text-[#64748B]">Nutzer tippt auf eine Option — du legst die Optionen fest.</p>
      </div>

      {/* Free text mode */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#475569] text-white">
            <Type className="h-4 w-4" />
          </div>
          <span className="text-[13px] font-bold uppercase tracking-wider text-[#475569]">Freitext</span>
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3">
          <p className="text-[14px] font-medium text-[#0F172A]">Wie lautet dein Name?</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-[#94A3B8] bg-white px-4 py-3 min-h-[44px]">
          <span className="text-[14px] text-[#94A3B8]">Thomas M…</span>
          <span className="ml-auto h-4 w-[2px] animate-pulse bg-[#64748B]" />
        </div>
        <p className="text-[12px] text-[#64748B]">Nutzer tippt frei — Wesponde speichert die Antwort.</p>
      </div>
    </div>
  );
}

function IllustrationVariables() {
  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="w-full max-w-[400px] rounded-2xl border border-[#E2E8F0] bg-white p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C2410C]">
            <Type className="h-5 w-5" />
          </div>
          <span className="text-[16px] font-semibold text-[#0F172A]">Wie lautet dein Name?</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
          <span className="text-[14px] text-[#64748B]">Sammelt</span>
          <span className="rounded-lg bg-[#EFF6FF] px-3 py-1 text-[14px] font-semibold text-[#2450b2]">name</span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="h-6 w-[2px] bg-[#CBD5E1]" />
        <div className="h-0 w-0" style={{ borderTop: "6px solid #CBD5E1", borderLeft: "5px solid transparent", borderRight: "5px solid transparent" }} />
      </div>

      <div className="w-full max-w-[400px] rounded-2xl border border-[#A7F3D0] bg-[#F0FDF4] p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#15803D]">
            <Check className="h-5 w-5" />
          </div>
          <span className="text-[14px] font-semibold text-[#0F172A]">Bestätigung</span>
        </div>
        <p className="text-[15px] text-[#475569]">
          Danke, <span className="rounded bg-[#DCFCE7] px-1.5 py-0.5 font-semibold text-[#15803D]">{"{{name}}"}</span>! Deine Reservierung ist gespeichert.
        </p>
      </div>
    </div>
  );
}

function IllustrationCockpit() {
  return (
    <div className="flex justify-center py-2">
      <div className="w-full max-w-[520px] rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(15,23,42,0.07)]">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-widest text-[#94A3B8]">Statusleiste</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-2">
            <CalendarCheck className="h-5 w-5 text-[#2450b2]" />
            <span className="text-[14px] font-semibold text-[#1D4ED8]">Buchung</span>
          </div>
          <div className="h-5 w-px bg-[#E2E8F0]" />
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#64748B]">Sammelt:</span>
            {["Name", "Datum", "Uhrzeit"].map((f) => (
              <span key={f} className="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-[13px] font-semibold text-[#047857]">{f}</span>
            ))}
          </div>
          <div className="h-5 w-px bg-[#E2E8F0]" />
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-[#16A34A]" />
            <span className="text-[14px] font-semibold text-[#16A34A]">Bereit zur Aktivierung</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function IllustrationActivate() {
  return (
    <div className="flex flex-col items-center gap-6 py-3">
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-8 py-5 text-center">
            <div className="text-[13px] font-semibold uppercase tracking-widest text-[#94A3B8]">Entwurf</div>
            <div className="mt-3 flex items-center justify-center">
              <div className="relative h-8 w-14 rounded-full bg-[#CBD5E1]">
                <div className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-[2px] w-8 bg-[#CBD5E1]" />
          <ArrowRight className="h-5 w-5 text-[#94A3B8]" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-8 py-5 text-center shadow-[0_6px_24px_rgba(36,80,178,0.12)]">
            <div className="text-[13px] font-semibold uppercase tracking-widest text-[#2450b2]">Aktiv</div>
            <div className="mt-3 flex items-center justify-center">
              <div className="relative h-8 w-14 rounded-full bg-[#2450b2]">
                <div className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[15px] text-[#64748B] text-center max-w-[320px]">
        Ab jetzt beantwortet Wesponde passende Instagram-Nachrichten automatisch.
      </p>
    </div>
  );
}

// ─── Step definitions ──────────────────────────────────────────────────────

const GUIDE_STEPS: GuideStep[] = [
  {
    chapter: "Überblick",
    title: "Was ist ein Flow?",
    description:
      "Ein Flow ist eine vollständig automatisierte Konversation auf Instagram. Wenn ein Kunde dein Auslösewort schreibt, übernimmt Wesponde — beantwortet Fragen, sammelt Infos und trägt Buchungen direkt in deinen Kalender ein.",
    illustration: <IllustrationFlowConcept />,
    keyPoints: [
      { label: "Trigger", text: "Jeder Flow startet mit einem Keyword (z. B. \"reservieren\")." },
      { label: "Schritte", text: "Du baust den Ablauf aus einzelnen Nachrichtenblöcken zusammen." },
      { label: "Ergebnis", text: "Am Ende steht eine fertige Buchung — ohne manuellen Aufwand." },
    ],
  },
  {
    chapter: "Trigger",
    title: "Wie startet ein Flow?",
    description:
      "Ein Trigger wartet auf ein bestimmtes Keyword in der Nachricht deines Kunden. Du kannst mehrere Keywords definieren und zwischen zwei Modi wählen: \"enthält\" (das Wort erscheint irgendwo) oder \"genau\" (der Kunde tippt exakt dieses Wort).",
    illustration: <IllustrationTrigger />,
    keyPoints: [
      { label: "Mehrere Keywords", text: "\"reservierung\", \"tisch\", \"buchen\" — alle starten denselben Flow." },
      { label: "enthält vs. genau", text: "\"enthält\" ist flexibler und fängt mehr natürliche Eingaben." },
      { label: "Zielschritt", text: "Jeder Trigger kann auf einen anderen Startschritt zeigen." },
    ],
  },
  {
    chapter: "Schritt-Typen",
    title: "Die 6 Bausteine",
    description:
      "Jeder Schritt in deinem Flow ist ein Baustein mit einer bestimmten Funktion. Kombiniere sie in beliebiger Reihenfolge, um den perfekten Ablauf zu bauen.",
    illustration: <IllustrationNodeTypes />,
    keyPoints: [
      { label: "Nachricht", text: "Reine Textnachricht, optional mit Bild. Ideal für Begrüßungen und Infos." },
      { label: "Auswahl", text: "Buttons die der Nutzer antippen kann — der Klick entscheidet den weiteren Verlauf." },
      { label: "Eingabe", text: "Öffnet einen freien Texteingang. Nutze ihn um Name, Datum oder andere Daten zu erfassen." },
    ],
  },
  {
    chapter: "Antworttypen",
    title: "Buttons oder Freitext?",
    description:
      "Du baust deinen Flow als geordnete Liste — Schritt für Schritt von oben nach unten. Kein Canvas, kein Ziehen. Bei jedem Schritt wählst du im Inspector, wie der Nutzer antworten soll: mit vordefinierten Buttons oder als freie Texteingabe.",
    illustration: <IllustrationAnswerTypes />,
    keyPoints: [
      { label: "Buttons", text: "Du definierst feste Antwort-Optionen (z. B. \"Mittag\" / \"Abend\"). Der Nutzer tippt auf einen Button — ideal für Auswahlen und Ja/Nein-Fragen." },
      { label: "Freitext", text: "Der Nutzer tippt seine Antwort frei ein. Wesponde speichert sie automatisch als Variable — ideal für Name, Datum oder Sonderwünsche." },
      { label: "Reihenfolge", text: "Schritte werden als Liste von oben nach unten ausgeführt. Die Reihenfolge im Builder = Reihenfolge im Gespräch." },
    ],
  },
  {
    chapter: "Variablen",
    title: "Daten sammeln",
    description:
      "Eingabe-Schritte können Infos des Nutzers speichern. Gib im Feld \"Sammelt\" an was du erfassen willst — z. B. \"name\", \"date\" oder \"time\". Diese Daten füllen später automatisch die Buchung.",
    illustration: <IllustrationVariables />,
    keyPoints: [
      { label: "Vordefiniert", text: "name, date, time, guestCount, phone, email werden direkt für Buchungen verwendet." },
      { label: "Platzhalter", text: "Nutze {{name}} in Nachrichten um den gespeicherten Wert einzusetzen." },
      { label: "Pflichtfelder", text: "Das Cockpit zeigt dir ob alle notwendigen Felder gesammelt werden." },
    ],
  },
  {
    chapter: "Cockpit",
    title: "Die Statusleiste",
    description:
      "Die Statusleiste unterhalb der Überschrift zeigt dir auf einen Blick den Zustand deines Flows: welche Daten gesammelt werden, ob Pflichtfelder fehlen und ob der Flow bereit für die Aktivierung ist.",
    illustration: <IllustrationCockpit />,
    keyPoints: [
      { label: "Sammelt-Felder", text: "Grüne Chips = Pflichtfelder abgedeckt. Graue = optionale Felder." },
      { label: "Warnungen", text: "Oranger Hinweis bei fehlenden Pflichtfeldern oder nicht verbundenen Schritten." },
      { label: "Bereit", text: "Grünes \"Bereit zur Aktivierung\" wenn alles vollständig ist." },
    ],
  },
  {
    chapter: "Aktivieren",
    title: "Flow live schalten",
    description:
      "Wenn dein Flow bereit ist, schalte ihn oben rechts mit dem Toggle auf \"Aktiv\". Ab sofort beantwortet Wesponde passende Instagram-Nachrichten automatisch — rund um die Uhr.",
    illustration: <IllustrationActivate />,
    keyPoints: [
      { label: "Speichern zuerst", text: "Klicke auf Speichern bevor du aktivierst — nicht gespeicherte Änderungen gehen verloren." },
      { label: "Entwurf bleibt", text: "Du kannst den Flow jederzeit wieder auf Entwurf stellen um ihn zu bearbeiten." },
      { label: "Mehrere Flows", text: "Du kannst mehrere Flows gleichzeitig aktiv haben — für verschiedene Themen." },
    ],
  },
];

// ─── Main Guide Component ──────────────────────────────────────────────────

type FlowBuilderGuideProps = {
  onClose: () => void;
};

export default function FlowBuilderGuide({ onClose }: FlowBuilderGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const total = GUIDE_STEPS.length;
  const step = GUIDE_STEPS[currentStep]!;

  const goTo = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  const prev = () => { if (currentStep > 0) goTo(currentStep - 1); };
  const next = () => { if (currentStep < total - 1) goTo(currentStep + 1); else onClose(); };

  const isLast = currentStep === total - 1;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <motion.div
        className="relative flex w-full max-w-[960px] min-h-[min(90dvh,820px)] max-h-[92dvh] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_40px_100px_rgba(15,23,42,0.22),0_0_0_1px_rgba(226,232,240,0.7)]"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-label="Flow Builder Guide"
      >
        {/* ─ Top nav ─ */}
        <div className="flex items-center justify-between border-b border-[#F1F5F9] px-8 py-5">
          <div className="hidden items-center gap-1 sm:flex">
            {GUIDE_STEPS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={[
                  "rounded-full px-4 py-2 text-[13px] font-semibold transition-all",
                  i === currentStep
                    ? "bg-[#EFF6FF] text-[#2450b2]"
                    : i < currentStep
                      ? "text-[#94A3B8] hover:text-[#475569]"
                      : "text-[#B0BAD0] hover:text-[#94A3B8]",
                ].join(" ")}
              >
                {s.chapter}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-[13px] font-semibold uppercase tracking-widest text-[#94A3B8]">
              {currentStep + 1} / {total}
            </span>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] text-[#94A3B8] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2450b2] focus-visible:ring-offset-1"
            onClick={onClose}
            aria-label="Guide schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ─ Progress bar ─ */}
        <div className="flex h-1 w-full bg-[#F1F5F9]">
          <motion.div
            className="h-full rounded-r-full bg-[#2450b2]"
            animate={{ width: `${((currentStep + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
          />
        </div>

        {/* ─ Content ─ */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 48 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -48 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="px-10 py-8"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#2450b2]">
                    <span className="h-[6px] w-[6px] rounded-full bg-[#2450b2]" />
                    {step.chapter}
                  </span>
                  <h2 className="mt-2 text-[30px] font-bold tracking-tight text-[#0F172A] sm:text-[32px]">
                    {step.title}
                  </h2>
                </div>
                <span className="mt-2 shrink-0 text-[15px] font-semibold text-[#B0BAD0]">
                  {currentStep + 1} / {total}
                </span>
              </div>

              <p className="mt-3 text-[17px] leading-relaxed text-[#475569]">
                {step.description}
              </p>

              {/* Illustration */}
              <div className="mt-7 rounded-2xl border border-[#E2E8F0] bg-[#FAFCFF] p-8">
                {step.illustration}
              </div>

              {/* Key points */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {step.keyPoints.map(({ label, text }) => (
                  <div key={label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#2450b2]">
                      {label}
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-[#475569]">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─ Footer ─ */}
        <div className="flex items-center justify-between border-t border-[#F1F5F9] px-8 py-5">
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
                      : "h-2.5 w-2.5 bg-[#E2E8F0]",
                ].join(" ")}
                aria-label={`Schritt ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={currentStep === 0}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E2E8F0] text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2450b2] focus-visible:ring-offset-1"
              aria-label="Zurück"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-full bg-[#2450b2] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_2px_16px_rgba(36,80,178,0.28)] transition-all hover:bg-[#1a46c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2450b2] focus-visible:ring-offset-1"
              aria-label={isLast ? "Guide beenden" : "Weiter"}
            >
              {isLast ? "Loslegen" : "Weiter"}
              {isLast ? <Zap className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
