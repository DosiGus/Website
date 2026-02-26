"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, CheckCircle2, Clock3, RefreshCw } from "lucide-react";

const steps = [
  {
    id: "request",
    title: "Anfrage",
    text: "Kunde fragt: Samstag um 10:00 Uhr frei?",
  },
  {
    id: "check",
    title: "Verfügbarkeit prüfen",
    text: "Das System prüft freie Zeiten direkt im Google Kalender.",
  },
  {
    id: "confirm",
    title: "Termin bestätigen",
    text: "Freier Slot wird direkt bestätigt.",
  },
  {
    id: "sync",
    title: "Kalender synchronisieren",
    text: "Termin wird sofort als Event eingetragen.",
  },
] as const;

export default function GoogleCalendarSyncDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const timeRows = ["09:00", "09:30", "10:00", "10:30", "11:00"];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % steps.length);
    }, 2300);
    return () => window.clearInterval(timer);
  }, []);

  const active = useMemo(() => steps[stepIndex], [stepIndex]);
  const hasCheckedAvailability = stepIndex >= 1;
  const hasConfirmed = stepIndex >= 2;
  const hasSynced = stepIndex >= 3;
  const eventTitle = hasSynced
    ? "Termin bestätigt · Lisa Müller"
    : hasConfirmed
      ? "Termin wird bestätigt"
      : hasCheckedAvailability
        ? "Slot verfügbar · 10:00 Uhr"
        : "Verfügbarkeit wird geprüft";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">Live-Ablauf</p>
        <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950/80 p-4">
          <p className="text-sm text-zinc-400">DM von Interessent</p>
          <p className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-200">
            Hi, habt ihr am Samstag um 10:00 Uhr einen Termin frei?
          </p>
        </div>

        <div className="mt-4 space-y-2.5">
          {steps.map((step, index) => {
            const isActive = index === stepIndex;
            const isDone = index < stepIndex;
            return (
              <div
                key={step.id}
                className={`rounded-xl border px-4 py-3 transition-all ${
                  isActive
                    ? "border-indigo-400/60 bg-indigo-500/10"
                    : isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                      isDone
                        ? "border-emerald-500/60 text-emerald-400"
                        : isActive
                          ? "border-indigo-400/60 text-indigo-300"
                          : "border-white/20 text-zinc-500"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-zinc-300"}`}>{step.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{step.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-[0_24px_60px_-30px_rgba(59,130,246,0.45)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-bold text-blue-600">
                G
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Google Kalender</p>
                <p className="text-sm font-semibold text-slate-800">Samstag, 8. März</p>
              </div>
            </div>
            <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {active.title}
            </div>
          </div>

          <div className="px-4 pb-4 pt-3">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[72px_1fr] border-b border-slate-200 bg-slate-50 text-xs">
                <div className="border-r border-slate-200 px-3 py-2 font-semibold uppercase tracking-wide text-slate-500">
                  Uhrzeit
                </div>
                <div className="px-3 py-2 font-semibold text-slate-700">Terminkalender</div>
              </div>

              {timeRows.map((time) => {
                const isMainSlot = time === "10:00";
                const isAlternativeSlot = time === "10:30";
                return (
                  <div key={time} className="grid grid-cols-[72px_1fr] border-b border-slate-100 last:border-b-0">
                    <div className="border-r border-slate-200 px-3 py-3 text-xs font-medium text-slate-500">{time}</div>
                    <div className="relative h-12 px-2 py-1.5">
                      {isMainSlot ? (
                        <div
                          className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-all ${
                            hasSynced
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : hasConfirmed
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : hasCheckedAvailability
                                  ? "border-sky-300 bg-sky-50 text-sky-700"
                                  : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {eventTitle}
                        </div>
                      ) : null}

                      {isAlternativeSlot && hasCheckedAvailability && !hasConfirmed ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                          Alternative: 10:30 Uhr
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <RefreshCw className={`h-4 w-4 ${hasCheckedAvailability ? "text-blue-600" : "text-slate-400"}`} />
                Verfügbarkeit wird in Echtzeit abgeglichen
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock3 className={`h-4 w-4 ${hasConfirmed ? "text-blue-600" : "text-slate-400"}`} />
                Bei Konflikten werden passende Alternativen vorgeschlagen
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarCheck2 className={`h-4 w-4 ${hasSynced ? "text-emerald-600" : "text-slate-400"}`} />
                Bestätigte Termine werden automatisch synchronisiert
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
