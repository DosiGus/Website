import { createSupabaseServerClient } from "../supabaseServerClient";
import { GOOGLE_CALENDAR_BASE } from "./types";
import { getGoogleAccessToken } from "./calendar";
import { normalizeCalendarSettings } from "./settings";
import { logger } from "../logger";

const CACHE_TTL_MS = 2 * 60 * 1000;
const SUGGESTION_LIMIT = 3;
const FREEBUSY_WINDOW_DAYS = 7;

type BusyInterval = {
  start: Date;
  end: Date;
};

export type SlotSuggestion = {
  date: string;
  time: string;
};

export type SlotAvailabilityResult = {
  available: boolean;
  suggestions: SlotSuggestion[];
  error?: string;
};

export async function checkSlotAvailability(
  accountId: string,
  date: string,
  time: string,
): Promise<SlotAvailabilityResult> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: account, error } = await supabase
      .from("accounts")
      .select("settings")
      .eq("id", accountId)
      .single();

    if (error) {
      await logger.warn("integration", "Failed to load calendar settings", {
        metadata: { error: error.message },
      });
    }

    const settings = normalizeCalendarSettings((account?.settings as any)?.calendar ?? null);
    const { accessToken, calendarId, calendarTimeZone } = await getGoogleAccessToken(accountId);
    const resolvedCalendarId = calendarId ?? "primary";
    const resolvedTimeZone = calendarTimeZone ?? settings.timeZone;

    const suggestionWindowDays = Math.min(settings.bookingWindowDays, FREEBUSY_WINDOW_DAYS);
    const timeMinDate = date;
    const timeMaxDate = addDays(date, suggestionWindowDays);
    const timeMin = zonedTimeToUtc(timeMinDate, "00:00", resolvedTimeZone).toISOString();
    const timeMax = zonedTimeToUtc(timeMaxDate, "23:59", resolvedTimeZone).toISOString();
    const busyIntervals = await getBusyIntervals({
      accountId,
      accessToken,
      calendarId: resolvedCalendarId,
      timeMin,
      timeMax,
      timeZone: resolvedTimeZone,
    });

    const slotStart = zonedTimeToUtc(date, time, resolvedTimeZone);
    const slotEnd = new Date(slotStart.getTime() + settings.slotDurationMinutes * 60 * 1000);
    const available = !hasOverlap(slotStart, slotEnd, busyIntervals);

    if (available) {
      return { available: true, suggestions: [] };
    }

    const suggestions = generateSuggestions({
      date,
      time,
      timeZone: resolvedTimeZone,
      settings,
      rangeDays: suggestionWindowDays,
      busyIntervals,
    });

    return { available: false, suggestions };
  } catch (error) {
    await logger.warn("integration", "Availability check failed", {
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return { available: false, suggestions: [], error: "availability_error" };
  }
}

type BusyIntervalParams = {
  accountId: string;
  accessToken: string;
  calendarId: string;
  timeMin: string;
  timeMax: string;
  timeZone: string;
};

async function getBusyIntervals(params: BusyIntervalParams): Promise<BusyInterval[]> {
  const supabase = createSupabaseServerClient();
  const { accountId, calendarId, timeMin, timeMax, timeZone } = params;

  const { data: cached } = await supabase
    .from("calendar_availability_cache")
    .select("busy, expires_at")
    .eq("account_id", accountId)
    .eq("calendar_id", calendarId)
    .eq("time_min", timeMin)
    .eq("time_max", timeMax)
    .eq("time_zone", timeZone)
    .maybeSingle();

  if (cached?.expires_at && new Date(cached.expires_at) > new Date()) {
    const busy = Array.isArray(cached.busy) ? cached.busy : [];
    return busy.map((entry: any) => ({
      start: new Date(entry.start),
      end: new Date(entry.end),
    }));
  }

  const response = await fetch(`${GOOGLE_CALENDAR_BASE}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone,
      items: [{ id: calendarId }],
    }),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    await logger.warn("integration", "Google freeBusy failed", {
      metadata: {
        httpStatus: response.status,
        error: payload?.error ?? payload,
      },
    });
    throw new Error("freebusy_failed");
  }

  const busy = payload?.calendars?.[calendarId]?.busy ?? [];
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();

  await supabase
    .from("calendar_availability_cache")
    .upsert(
      {
        account_id: accountId,
        calendar_id: calendarId,
        time_min: timeMin,
        time_max: timeMax,
        time_zone: timeZone,
        busy,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,calendar_id,time_min,time_max,time_zone" },
    );

  return busy.map((entry: any) => ({
    start: new Date(entry.start),
    end: new Date(entry.end),
  }));
}

type SuggestionParams = {
  date: string;
  time: string;
  timeZone: string;
  settings: ReturnType<typeof normalizeCalendarSettings>;
  busyIntervals: BusyInterval[];
  rangeDays: number;
};

function generateSuggestions(params: SuggestionParams): SlotSuggestion[] {
  const { date, time, timeZone, settings, busyIntervals, rangeDays } = params;
  const suggestions: SlotSuggestion[] = [];

  for (let dayOffset = 0; dayOffset < rangeDays; dayOffset += 1) {
    const currentDate = addDays(date, dayOffset);
    const weekdayKey = getWeekdayKey(currentDate, timeZone);
    const ranges = settings.hours[weekdayKey] ?? [];
    if (ranges.length === 0) continue;

    for (const range of ranges) {
      const [startStr, endStr] = range.split("-");
      if (!startStr || !endStr) continue;

      const rangeStart = parseTimeToMinutes(startStr);
      const rangeEnd = parseTimeToMinutes(endStr);
      const slotMinutes = settings.slotDurationMinutes;
      for (let minutes = rangeStart; minutes + slotMinutes <= rangeEnd; minutes += slotMinutes) {
        const slotTime = formatMinutes(minutes);
        if (dayOffset === 0 && compareTimes(slotTime, time) <= 0) {
          continue;
        }
        const slotStart = zonedTimeToUtc(currentDate, slotTime, timeZone);
        const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60 * 1000);
        if (!hasOverlap(slotStart, slotEnd, busyIntervals)) {
          suggestions.push({ date: currentDate, time: slotTime });
          if (suggestions.length >= SUGGESTION_LIMIT) {
            return suggestions;
          }
        }
      }
    }
  }

  return suggestions;
}

function hasOverlap(start: Date, end: Date, busyIntervals: BusyInterval[]): boolean {
  return busyIntervals.some((busy) => start < busy.end && end > busy.start);
}

function parseTimeToMinutes(timeStr: string): number {
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function compareTimes(a: string, b: string): number {
  return parseTimeToMinutes(a) - parseTimeToMinutes(b);
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function getWeekdayKey(dateStr: string, timeZone: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const map: Record<string, string> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  };
  return map[weekday] ?? "mon";
}

function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffsetMs(utcDate, timeZone);
  let adjusted = new Date(utcDate.getTime() - offset);
  const offsetAfter = getTimeZoneOffsetMs(adjusted, timeZone);
  if (offset !== offsetAfter) {
    adjusted = new Date(utcDate.getTime() - Math.max(offset, offsetAfter));
  }
  return adjusted;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  );
  return asUTC - date.getTime();
}
