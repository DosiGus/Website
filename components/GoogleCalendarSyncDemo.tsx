"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";

type GoogleCalendarSyncDemoProps = {
  compact?: boolean;
};

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30"];
const ROW_H = 44;

function InstagramAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400">
      <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </div>
  );
}

function GoogleG() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function CalendarSyncContent() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % 3);
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  const states = [
    {
      title: "Verfügbarkeit wird geprüft",
      time: "10:00 - 10:30",
      barClass: "border-[#a9c6ff] bg-[#d7e7ff] text-[#2d5db8]",
      footer: "Verfügbarkeit wird abgeglichen...",
      footerDot: "bg-[#f1c15a]",
    },
    {
      title: "Termin bestätigt",
      time: "10:00 - 10:30",
      barClass: "border-[#2862c7] bg-[#3573df] text-white",
      footer: "Termin bestätigt",
      footerDot: "bg-[#3573df]",
    },
    {
      title: "Lisa Müller",
      time: "10:00 - 10:30",
      barClass: "border-[#2fa86e] bg-[#3cc183] text-white",
      footer: "Termin synchronisiert · Lisa Müller",
      footerDot: "bg-[#3cc183]",
    },
  ] as const;

  const current = states[step];

  return (
    <div className="rounded-[34px] border border-white/55 bg-white/46 p-6 shadow-[0_12px_34px_rgba(28,53,122,0.08),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md xl:p-7">
      <div className="rounded-[14px] border border-[#d9ddea] bg-white px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="flex items-center gap-3">
          <InstagramAvatar />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-none text-[#232738]">Instagram DM</p>
            <p className="mt-1 text-[11px] text-[#a2a7b8]">Kunde · gerade eben</p>
          </div>
          <span className="inline-flex h-3 w-3 rounded-full bg-[#4be2a1] shadow-[0_0_10px_rgba(75,226,161,0.7)]" />
        </div>
        <div className="mt-4 rounded-[12px] bg-[#f5f5f8] px-4 py-3 text-[13px] leading-relaxed text-[#444a59]">
          Hi, habt ihr am Samstag um 10:00 Uhr einen Termin frei?
        </div>
      </div>

      <div className="relative flex h-16 items-center justify-center">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#e4e6ee]" />
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#d7dbe7] bg-white text-[#9aa3b7] shadow-[0_8px_18px_rgba(76,91,125,0.08)]">
          <ArrowDown className="h-5 w-5" />
        </span>
      </div>

      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_18px_40px_rgba(76,91,125,0.16)] ring-1 ring-[#eef1f7]">
        <div className="flex items-center gap-2 px-4 py-3">
          <GoogleG />
          <p className="text-[12px] font-medium text-[#3a4255]">Kalender</p>
          <div className="ml-auto flex items-center gap-2 text-[#a4aabb]">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-[11px] text-[#747c90]">8. März</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="ml-2 rounded-full border border-[#dfe3ed] px-2.5 py-1 text-[10px] text-[#747c90]">
              3 Tage
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[42px_repeat(3,minmax(0,1fr))] border-t border-[#eef1f7]">
          <div />
          {[
            { day: "FR", num: "7" },
            { day: "SA", num: "8", active: true },
            { day: "SO", num: "9" },
          ].map((item) => (
            <div
              key={item.day}
              className={`border-l border-[#eef1f7] py-3 text-center ${
                item.active ? "bg-[#eef4ff]" : "bg-white"
              }`}
            >
              <p className={`text-[11px] ${item.active ? "font-semibold text-[#3168d5]" : "text-[#a4aabb]"}`}>
                {item.day}
              </p>
              <div
                className={`mx-auto mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-semibold ${
                  item.active ? "bg-[#3168d5] text-white" : "text-[#4d556a]"
                }`}
              >
                {item.num}
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-[42px_repeat(3,minmax(0,1fr))]">
              <div className="border-t border-r border-[#eef1f7] px-1.5 py-2.5 text-[10px] text-[#c2c7d5]">
                {time}
              </div>
              {[0, 1, 2].map((column) => (
                <div
                  key={column}
                  className={`border-t border-r border-[#eef1f7] last:border-r-0 ${
                    column === 1 ? "bg-[#fbfcff]" : "bg-white"
                  }`}
                  style={{ height: `${ROW_H}px` }}
                />
              ))}
            </div>
          ))}

          <div
            className={`pointer-events-none absolute flex items-center rounded-[8px] border px-2.5 text-[11px] leading-none shadow-[0_8px_18px_rgba(49,104,213,0.18)] transition-all duration-500 ${current.barClass}`}
            style={{
              top: `${2 * ROW_H + 4}px`,
              left: "calc(42px + (100% - 42px) / 3 + 4px)",
              width: "calc((100% - 42px) / 3 - 8px)",
              height: `${ROW_H - 8}px`,
            }}
          >
            <div>
              <p className="font-medium">{current.title}</p>
              <p className="mt-1 text-[10px] opacity-75">{current.time}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-[#eef1f7] px-4 py-3">
          <span className={`h-2 w-2 rounded-full ${current.footerDot}`} />
          <p className="text-[11px] text-[#8b92a5]">{current.footer}</p>
        </div>
      </div>
    </div>
  );
}

export default function GoogleCalendarSyncDemo({ compact = false }: GoogleCalendarSyncDemoProps) {
  const content = <CalendarSyncContent />;

  if (compact) {
    return content;
  }

  return <div className="mx-auto max-w-5xl">{content}</div>;
}
