"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

/* ============================================================
   TYPES & DATA
   ============================================================ */

type Step = {
  id: string;
  num: number;
  title: string;
  badge: string;
  description: string;
};

const STEPS: Step[] = [
  {
    id: "request",
    num: 1,
    title: "Anfrage erhalten",
    badge: "Instagram DM",
    description: "Kunde fragt nach einem freien Slot für Samstag, 10:00 Uhr.",
  },
  {
    id: "check",
    num: 2,
    title: "Verfügbarkeit prüfen",
    badge: "Google Calendar API",
    description: "Freie Zeitfenster werden direkt im Kalender abgefragt.",
  },
  {
    id: "confirm",
    num: 3,
    title: "Termin bestätigen",
    badge: "Automatische Antwort",
    description: "Slot ist frei – Bestätigung geht sofort per DM raus.",
  },
  {
    id: "sync",
    num: 4,
    title: "Kalender synchronisiert",
    badge: "Event erstellt",
    description: "Termin erscheint automatisch als Event im Kalender.",
  },
];

// 3-day view: Fr–Sa–So gives each column ~3× more space
const DAYS = [
  { short: "Fr", num: 7, label: "Fr., 7. März" },
  { short: "Sa", num: 8, label: "Sa., 8. März", isTarget: true },
  { short: "So", num: 9, label: "So., 9. März" },
];

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

// Height of each 30-min slot in px
const ROW_H = 44;

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function InstagramAvatar() {
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </div>
  );
}

/* ============================================================
   MAIN
   ============================================================ */

export default function GoogleCalendarSyncDemo() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((c) => (c + 1) % STEPS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const hasChecked  = stepIndex >= 1;
  const hasConfirmed = stepIndex >= 2;
  const hasSynced   = stepIndex >= 3;

  // Event block colors & content
  const eventBg = hasSynced
    ? "bg-emerald-500"
    : hasConfirmed
    ? "bg-[#1a73e8]"
    : "bg-[#d2e3fc]";

  const eventBorder = hasSynced
    ? "border-emerald-400/70"
    : hasConfirmed
    ? "border-[#1558b0]/60"
    : "border-[#aecbfa]";

  const eventTitleColor = hasSynced || hasConfirmed ? "text-white" : "text-[#174ea6]";
  const eventTimeColor  = hasSynced || hasConfirmed ? "text-white/75" : "text-[#174ea6]/70";

  const eventTitle = useMemo(() => {
    if (hasSynced) return "Lisa Müller";
    if (hasConfirmed) return "Termin bestätigt";
    return "Verfügbarkeit wird geprüft";
  }, [hasSynced, hasConfirmed]);

  const statusText = useMemo(() => {
    if (hasSynced) return "Termin synchronisiert · Lisa Müller";
    if (hasConfirmed) return "Termin bestätigt";
    if (hasChecked) return "Verfügbarkeit wird abgeglichen…";
    return "Warte auf Anfrage";
  }, [hasSynced, hasConfirmed, hasChecked]);

  const statusDot = hasSynced
    ? "bg-emerald-500"
    : hasConfirmed
    ? "bg-[#1a73e8]"
    : hasChecked
    ? "bg-amber-400 animate-pulse"
    : "bg-zinc-300";

  // Event spans from 10:00 (slot index 2) to 10:30 (slot index 3) = 1 slot height
  // We render it as an absolute overlay so it can show content without truncation
  const EVENT_TOP_SLOT = 2; // 10:00 is at index 2
  const EVENT_SLOTS    = 1; // 30-minute event

  return (
    <div className="grid gap-5 lg:grid-cols-2">

      {/* ═══════════════════════════════════════════
          LEFT – Process Timeline
          ═══════════════════════════════════════════ */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-6">

        {/* Instagram DM Bubble */}
        <div className="rounded-xl border border-white/[0.07] bg-zinc-950/70 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <InstagramAvatar />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold leading-none text-white">Instagram DM</p>
              <p className="mt-0.5 text-[10px] text-zinc-500">Kunde · gerade eben</p>
            </div>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" />
          </div>
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-bl-sm bg-zinc-800 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-100">
              Hi, habt ihr am Samstag um 10:00 Uhr einen Termin frei?
            </div>
          </div>
        </div>

        {/* Step timeline */}
        <div className="relative flex flex-col gap-2">
          <div className="absolute bottom-7 left-[19px] top-7 w-px bg-gradient-to-b from-white/15 via-white/10 to-transparent" />

          {STEPS.map((step, index) => {
            const isActive = index === stepIndex;
            const isDone   = index < stepIndex;
            return (
              <div
                key={step.id}
                className={`relative flex items-start gap-3.5 rounded-xl border px-4 py-3.5 transition-all duration-500 ${
                  isActive
                    ? "border-indigo-500/40 bg-indigo-500/[0.07] shadow-[inset_0_0_0_1px_rgba(99,102,241,0.12)]"
                    : isDone
                    ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                    : "border-white/[0.07] bg-white/[0.02]"
                }`}
              >
                <div
                  className={`relative z-10 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 transition-all duration-500 ${
                    isDone
                      ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/40"
                      : isActive
                      ? "bg-indigo-500/25 text-indigo-300 ring-indigo-400/50"
                      : "bg-white/5 text-zinc-600 ring-white/10"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.num}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-semibold transition-colors ${isActive ? "text-white" : isDone ? "text-zinc-300" : "text-zinc-500"}`}>
                      {step.title}
                    </p>
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300"
                        : isDone
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-white/5 text-zinc-600"
                    }`}>
                      {step.badge}
                    </span>
                  </div>
                  <p className={`mt-0.5 text-[12px] leading-relaxed transition-colors ${isActive ? "text-zinc-400" : isDone ? "text-zinc-500" : "text-zinc-600"}`}>
                    {step.description}
                  </p>
                </div>

                {isActive && (
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT – Google Calendar  (3-day view)
          ═══════════════════════════════════════════ */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3 sm:p-4">
        <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_8px_48px_-16px_rgba(0,0,0,0.7)]">

          {/* Toolbar */}
          <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-2.5">
            <GoogleG size={18} />
            <span className="text-[13px] font-semibold text-zinc-700">Kalender</span>
            <div className="ml-auto flex items-center">
              <button className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="w-[64px] text-center text-[11px] font-medium text-zinc-500">8. März</span>
              <button className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <button className="ml-2 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
              3 Tage
            </button>
          </div>

          {/* Day headers */}
          <div className="flex border-b border-zinc-100">
            {/* Time gutter */}
            <div className="w-12 flex-shrink-0" />
            {DAYS.map((day) => (
              <div
                key={day.num}
                className={`flex flex-1 flex-col items-center py-2.5 ${day.isTarget ? "bg-[#e8f0fe]/60" : ""}`}
              >
                <p className={`text-[10px] font-semibold uppercase tracking-widest ${day.isTarget ? "text-[#1a73e8]" : "text-zinc-400"}`}>
                  {day.short}
                </p>
                <div className={`mt-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[14px] font-semibold leading-none ${
                  day.isTarget ? "bg-[#1a73e8] text-white" : "text-zinc-700"
                }`}>
                  {day.num}
                </div>
              </div>
            ))}
          </div>

          {/* Time grid – rows + absolute event overlay */}
          <div className="relative flex-1 overflow-hidden">

            {/* Grid rows */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="flex" style={{ height: `${ROW_H}px` }}>
                {/* Time label – sits at the top of the row, vertically offset so it aligns to the line */}
                <div className="flex w-12 flex-shrink-0 items-start justify-end pr-2.5 pt-0">
                  <span className="translate-y-[-6px] text-[10px] text-zinc-400">{time}</span>
                </div>
                {DAYS.map((day) => (
                  <div
                    key={day.num}
                    className={`relative flex-1 border-b border-l border-zinc-100 ${day.isTarget ? "bg-[#e8f0fe]/15" : ""}`}
                  />
                ))}
              </div>
            ))}

            {/* Absolute event block – Sa column (index 1), spans 10:00–10:30 */}
            {hasChecked && (
              <div
                className="pointer-events-none absolute transition-all duration-700"
                style={{
                  // Vertical position: slot index 2 (10:00) × row height + small inset
                  top:    `${EVENT_TOP_SLOT * ROW_H + 3}px`,
                  height: `${EVENT_SLOTS * ROW_H - 6}px`,
                  // Horizontal: gutter (w-12 = 48px) + column 1 offset + inset
                  // Each of 3 columns = (100% - 48px) / 3
                  left:   "calc(48px + (100% - 48px) / 3 + 3px)",
                  width:  "calc((100% - 48px) / 3 - 6px)",
                }}
              >
                <div className={`flex h-full flex-col justify-center rounded-lg border px-2.5 py-1.5 transition-all duration-700 ${eventBg} ${eventBorder}`}>
                  <p className={`text-[11px] font-bold leading-tight ${eventTitleColor}`}>
                    {eventTitle}
                  </p>
                  <p className={`mt-0.5 text-[10px] leading-none ${eventTimeColor}`}>
                    10:00 – 10:30
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status footer */}
          <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2">
            <div className={`h-2 w-2 flex-shrink-0 rounded-full transition-all duration-500 ${statusDot}`} />
            <p className="text-[11px] text-zinc-500">{statusText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
