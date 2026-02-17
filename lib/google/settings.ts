export type CalendarHours = Record<string, string[]>;

export type CalendarSettings = {
  timeZone: string;
  bookingWindowDays: number;
  slotDurationMinutes: number;
  hours: CalendarHours;
};

const DEFAULT_HOURS: CalendarHours = {
  mon: ["07:00-21:00"],
  tue: ["07:00-21:00"],
  wed: ["07:00-21:00"],
  thu: ["07:00-21:00"],
  fri: ["07:00-21:00"],
  sat: ["08:00-18:00"],
  sun: [],
};

export function getDefaultCalendarSettings(): CalendarSettings {
  return {
    timeZone: "Europe/Berlin",
    bookingWindowDays: 30,
    slotDurationMinutes: 60,
    hours: DEFAULT_HOURS,
  };
}

export function normalizeCalendarSettings(
  input?: Partial<CalendarSettings> | null,
): CalendarSettings {
  const defaults = getDefaultCalendarSettings();
  const hours = sanitizeHours(input?.hours ?? defaults.hours);
  return {
    timeZone: input?.timeZone?.trim() || defaults.timeZone,
    bookingWindowDays: sanitizeNumber(input?.bookingWindowDays, defaults.bookingWindowDays, 1, 90),
    slotDurationMinutes: sanitizeNumber(input?.slotDurationMinutes, defaults.slotDurationMinutes, 15, 240),
    hours,
  };
}

function sanitizeNumber(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function sanitizeHours(hours: CalendarHours): CalendarHours {
  const sanitized: CalendarHours = { ...getDefaultCalendarSettings().hours };
  for (const day of Object.keys(sanitized)) {
    const ranges = Array.isArray(hours?.[day]) ? hours[day] : sanitized[day];
    sanitized[day] = ranges
      .filter((range) => typeof range === "string" && /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(range))
      .map((range) => range.trim());
  }
  return sanitized;
}
