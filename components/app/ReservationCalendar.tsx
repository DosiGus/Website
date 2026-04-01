"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Reservation, ReservationStatus } from "../../lib/reservationTypes";

export type CalendarView = "week" | "month";

const START_HOUR = 7;
const END_HOUR = 22;
const ROW_H = 60; // px per hour
const TOTAL_H = (END_HOUR - START_HOUR) * ROW_H;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const DAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS_DE = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember",
];

const STATUS_STYLE: Record<ReservationStatus, { bg: string; text: string; border: string; dot: string }> = {
  pending:   { bg: "#FFFBEB", text: "#92400E", border: "#FCD34D", dot: "#F59E0B" },
  confirmed: { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7", dot: "#10B981" },
  cancelled: { bg: "#F8FAFC", text: "#64748B", border: "#CBD5E1", dot: "#94A3B8" },
  completed: { bg: "#EFF6FF", text: "#1E40AF", border: "#93C5FD", dot: "#3B82F6" },
  no_show:   { bg: "#FFF1F2", text: "#9F1239", border: "#FCA5A5", dot: "#EF4444" },
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function parseTimeFloat(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) + (m ?? 0) / 60;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReservationCalendarProps {
  reservations: Reservation[];
  loading?: boolean;
  onSelectReservation: (r: Reservation) => void;
  onRangeChange?: (start: Date, end: Date) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReservationCalendar({
  reservations,
  loading = false,
  onSelectReservation,
  onRangeChange,
}: ReservationCalendarProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [current, setCurrent] = useState(() => new Date());
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekStart = useMemo(() => getMonday(current), [current]);
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Notify parent of visible date range
  useEffect(() => {
    if (!onRangeChange) return;
    if (view === "week") {
      onRangeChange(weekStart, addDays(weekStart, 6));
    } else {
      const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
      const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      const gridStart = addDays(firstDay, -startOffset);
      onRangeChange(gridStart, addDays(gridStart, 41));
    }
  }, [view, weekStart, current, onRangeChange]);

  const navigate = useCallback((dir: 1 | -1) => {
    setCurrent(prev => {
      if (view === "week") return addDays(prev, dir * 7);
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  }, [view]);

  // Calendar title
  const title = useMemo(() => {
    if (view === "week") {
      const end = addDays(weekStart, 6);
      if (weekStart.getMonth() === end.getMonth()) {
        return `${weekStart.getDate()}. – ${end.getDate()}. ${MONTHS_DE[end.getMonth()]} ${end.getFullYear()}`;
      }
      return `${weekStart.getDate()}. ${MONTHS_DE[weekStart.getMonth()]} – ${end.getDate()}. ${MONTHS_DE[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${MONTHS_DE[current.getMonth()]} ${current.getFullYear()}`;
  }, [view, weekStart, current]);

  // Reservations indexed by date string
  const byDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      const arr = map.get(r.reservation_date) ?? [];
      arr.push(r);
      map.set(r.reservation_date, arr);
    }
    return map;
  }, [reservations]);

  // Current time for "now" indicator
  const now = new Date();
  const nowFraction = (now.getHours() + now.getMinutes() / 60 - START_HOUR) / (END_HOUR - START_HOUR);
  const showNowLine = weekDays.some(d => sameDay(d, today)) && nowFraction >= 0 && nowFraction <= 1;

  return (
    <div className="app-card overflow-hidden rounded-xl">
      {/* ── Calendar header ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] bg-white px-4 py-3">
        <button
          onClick={() => setCurrent(new Date())}
          className="rounded-full border border-[#E2E8F0] px-3 py-1.5 text-xs font-medium text-[#475569] transition-colors hover:bg-[#F0F4F9] hover:text-[#0F172A]"
        >
          Heute
        </button>

        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#F0F4F9] hover:text-[#0F172A]"
            aria-label="Zurück"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#64748B] transition-colors hover:bg-[#F0F4F9] hover:text-[#0F172A]"
            aria-label="Weiter"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>

        {/* View toggle */}
        <div className="ml-auto flex items-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
          {(["week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                view === v
                  ? "bg-white text-[#0F172A] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]",
              ].join(" ")}
            >
              {v === "week" ? "Woche" : "Monat"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#121624]" />
        </div>
      ) : view === "week" ? (
        <WeekView
          weekDays={weekDays}
          byDate={byDate}
          today={today}
          showNowLine={showNowLine}
          nowFraction={nowFraction}
          onSelect={onSelectReservation}
        />
      ) : (
        <MonthView
          current={current}
          byDate={byDate}
          today={today}
          onSelect={onSelectReservation}
        />
      )}
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

interface WeekViewProps {
  weekDays: Date[];
  byDate: Map<string, Reservation[]>;
  today: Date;
  showNowLine: boolean;
  nowFraction: number;
  onSelect: (r: Reservation) => void;
}

function WeekView({ weekDays, byDate, today, showNowLine, nowFraction, onSelect }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current time (or 08:00) on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const scrollTarget = showNowLine
      ? Math.max(0, nowFraction * TOTAL_H - 160)
      : (8 - START_HOUR) * ROW_H;
    scrollRef.current.scrollTop = scrollTarget;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col">
      {/* Day column headers — sticky */}
      <div className="flex border-b border-[#E2E8F0] bg-white">
        <div className="w-14 shrink-0 border-r border-[#E2E8F0]" />
        {weekDays.map((day) => {
          const isToday = sameDay(day, today);
          const dayIdx = day.getDay() === 0 ? 6 : day.getDay() - 1;
          return (
            <div
              key={toDateStr(day)}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2"
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">
                {DAYS_SHORT[dayIdx]}
              </span>
              <span
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  isToday ? "bg-[#121624] text-white" : "text-[#0F172A]",
                ].join(" ")}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: 520 }}>
        <div className="relative flex" style={{ height: TOTAL_H }}>
          {/* Hour labels */}
          <div className="w-14 shrink-0 border-r border-[#E2E8F0]">
            {HOURS.map((h) => (
              <div key={h} className="relative" style={{ height: ROW_H }}>
                <span className="absolute -top-2 right-2 select-none text-[10px] text-[#B0BBD0]">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayKey = toDateStr(day);
            const dayRes = (byDate.get(dayKey) ?? []).sort((a, b) =>
              a.reservation_time.localeCompare(b.reservation_time)
            );
            const isToday = sameDay(day, today);

            return (
              <div
                key={dayKey}
                className={[
                  "relative min-w-0 flex-1 border-r border-[#F0F4F9] last:border-r-0",
                  isToday ? "bg-[#FAFBFF]" : "",
                ].join(" ")}
              >
                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-t border-[#F0F4F9]"
                    style={{ height: ROW_H }}
                  />
                ))}

                {/* Reservation events */}
                {dayRes.map((r, idx) => {
                  const timeFloat = parseTimeFloat(r.reservation_time);
                  if (timeFloat < START_HOUR || timeFloat >= END_HOUR) return null;
                  const top = (timeFloat - START_HOUR) * ROW_H;
                  const height = Math.max(ROW_H * 0.8, 44);
                  const s = STATUS_STYLE[r.status];
                  // Slight offset for overlapping events
                  const leftOffset = idx > 0 ? Math.min(idx * 2, 6) : 0;

                  return (
                    <button
                      key={r.id}
                      onClick={() => onSelect(r)}
                      title={`${r.guest_name} · ${r.reservation_time} Uhr`}
                      className="absolute z-10 overflow-hidden rounded-md border text-left transition-all hover:z-20 hover:scale-[1.02] hover:shadow-md"
                      style={{
                        top: top + 1,
                        left: 2 + leftOffset,
                        right: 2,
                        height: height - 2,
                        backgroundColor: s.bg,
                        borderColor: s.border,
                      }}
                    >
                      {/* Left color stripe */}
                      <div
                        className="absolute left-0 top-0 h-full w-[3px] rounded-l-md"
                        style={{ backgroundColor: s.dot }}
                      />
                      <div className="pl-2.5 pt-1 pr-1">
                        <p
                          className="truncate text-[11px] font-semibold leading-snug"
                          style={{ color: s.text }}
                        >
                          {r.guest_name}
                        </p>
                        <p
                          className="text-[10px] leading-snug opacity-75"
                          style={{ color: s.text }}
                        >
                          {r.reservation_time}{r.guest_count > 1 ? ` · ${r.guest_count}×` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/* Current time indicator */}
                {isToday && showNowLine && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-30 flex items-center gap-0"
                    style={{ top: nowFraction * TOTAL_H - 1 }}
                  >
                    <div className="h-[9px] w-[9px] shrink-0 rounded-full bg-[#EF4444] -ml-[4.5px]" />
                    <div className="h-[2px] flex-1 bg-[#EF4444] opacity-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

interface MonthViewProps {
  current: Date;
  byDate: Map<string, Reservation[]>;
  today: Date;
  onSelect: (r: Reservation) => void;
}

function MonthView({ current, byDate, today, onSelect }: MonthViewProps) {
  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const gridStart = addDays(firstDay, -startOffset);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const currentMonth = current.getMonth();

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        {DAYS_SHORT.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — 6 rows × 7 cols */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const key = toDateStr(day);
          const dayRes = (byDate.get(key) ?? []).sort((a, b) =>
            a.reservation_time.localeCompare(b.reservation_time)
          );
          const inMonth = day.getMonth() === currentMonth;
          const isToday = sameDay(day, today);
          const isLastInRow = i % 7 === 6;
          const isLastRow = i >= 35;

          return (
            <div
              key={key}
              className={[
                "min-h-[96px] p-1.5",
                "border-b border-r border-[#F0F4F9]",
                isLastInRow && "border-r-0",
                isLastRow && "border-b-0",
                !inMonth && "bg-[#FAFAFA]",
                isToday && "bg-[#FAFBFF]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Day number */}
              <div className="mb-1 flex justify-center sm:justify-start">
                <span
                  className={[
                    "flex h-[22px] w-[22px] items-center justify-center rounded-full text-[12px] font-semibold",
                    isToday
                      ? "bg-[#121624] text-white"
                      : inMonth
                        ? "text-[#0F172A]"
                        : "text-[#CBD5E1]",
                  ].join(" ")}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Event pills */}
              <div className="space-y-0.5">
                {dayRes.slice(0, 3).map((r) => {
                  const s = STATUS_STYLE[r.status];
                  return (
                    <button
                      key={r.id}
                      onClick={() => onSelect(r)}
                      className="flex w-full items-center gap-1 overflow-hidden rounded px-1 py-[3px] text-left transition-opacity hover:opacity-75"
                      style={{ backgroundColor: s.bg }}
                    >
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.dot }}
                      />
                      <span
                        className="truncate text-[10px] font-medium leading-none"
                        style={{ color: s.text }}
                      >
                        {r.reservation_time} {r.guest_name}
                      </span>
                    </button>
                  );
                })}
                {dayRes.length > 3 && (
                  <p className="pl-1 text-[10px] text-[#94A3B8]">
                    +{dayRes.length - 3} weitere
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
