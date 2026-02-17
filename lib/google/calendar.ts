import { createSupabaseServerClient } from "../supabaseServerClient";
import { GOOGLE_CALENDAR_BASE, GOOGLE_TOKEN_URL } from "./types";
import { logger } from "../logger";
import { decryptToken, encryptToken, isEncryptedToken } from "../security/tokenEncryption";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const TOKEN_REFRESH_LOCK_MS = 15 * 1000;

const hasRedisEnv = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);
const redis = hasRedisEnv ? Redis.fromEnv() : null;

type GoogleIntegrationRow = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

type AccessTokenResult = {
  accessToken: string;
  integrationId: string;
  calendarId: string | null;
  calendarTimeZone: string | null;
};

type IntegrationRow = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  calendar_id?: string | null;
  calendar_time_zone?: string | null;
};

async function loadIntegration(supabase: ReturnType<typeof createSupabaseServerClient>, accountId: string) {
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, access_token, refresh_token, expires_at, calendar_id, calendar_time_zone")
    .eq("account_id", accountId)
    .eq("provider", "google_calendar")
    .maybeSingle();

  if (error) {
    throw new Error("Integration konnte nicht geladen werden.");
  }

  return integration as IntegrationRow | null;
}

function buildAccessTokenResult(integration: IntegrationRow, accessToken: string): AccessTokenResult {
  return {
    accessToken,
    integrationId: integration.id,
    calendarId: integration.calendar_id ?? null,
    calendarTimeZone: integration.calendar_time_zone ?? null,
  };
}

async function acquireRefreshLock(integrationId: string) {
  if (!redis) {
    return { acquired: true, token: null };
  }
  const token = crypto.randomUUID();
  const key = `lock:google_refresh:${integrationId}`;
  const result = await redis.set(key, token, { nx: true, px: TOKEN_REFRESH_LOCK_MS });
  return { acquired: result === "OK", token };
}

async function releaseRefreshLock(integrationId: string, token: string | null) {
  if (!redis || !token) return;
  const key = `lock:google_refresh:${integrationId}`;
  const current = await redis.get<string>(key);
  if (current === token) {
    await redis.del(key);
  }
}

export async function getGoogleAccessToken(accountId: string): Promise<AccessTokenResult> {
  const supabase = createSupabaseServerClient();
  const integration = await loadIntegration(supabase, accountId);

  if (!integration?.access_token) {
    throw new Error("Google Kalender ist nicht verbunden.");
  }

  const decryptedAccessToken = decryptToken(integration.access_token);
  const decryptedRefreshToken = decryptToken(integration.refresh_token);

  if (process.env.TOKEN_ENCRYPTION_KEY) {
    const updates: { access_token?: string; refresh_token?: string; updated_at?: string } = {};
    if (integration.access_token && !isEncryptedToken(integration.access_token)) {
      updates.access_token = encryptToken(integration.access_token);
    }
    if (integration.refresh_token && !isEncryptedToken(integration.refresh_token)) {
      updates.refresh_token = encryptToken(integration.refresh_token);
    }
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      await supabase.from("integrations").update(updates).eq("id", integration.id);
    }
  }

  if (!decryptedAccessToken) {
    throw new Error("Google Kalender ist nicht verbunden.");
  }

  const expiresAt = integration.expires_at ? new Date(integration.expires_at).getTime() : 0;
  const needsRefresh = !expiresAt || Date.now() + TOKEN_REFRESH_BUFFER_MS >= expiresAt;

  if (!needsRefresh) {
    return buildAccessTokenResult(integration, decryptedAccessToken);
  }

  let lockToken: string | null = null;
  try {
    const lock = await acquireRefreshLock(integration.id);
    lockToken = lock.token;

    if (!lock.acquired) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const latest = await loadIntegration(supabase, accountId);
        if (latest?.access_token) {
          const latestAccessToken = decryptToken(latest.access_token);
          const latestExpiresAt = latest.expires_at ? new Date(latest.expires_at).getTime() : 0;
          const latestNeedsRefresh = !latestExpiresAt || Date.now() + TOKEN_REFRESH_BUFFER_MS >= latestExpiresAt;
          if (latestAccessToken && !latestNeedsRefresh) {
            return buildAccessTokenResult(latest, latestAccessToken);
          }
        }
      }
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      throw new Error("Google OAuth ist nicht korrekt konfiguriert.");
    }

    if (!decryptedRefreshToken) {
      throw new Error("Refresh-Token fehlt. Bitte Google Kalender erneut verbinden.");
    }

    const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: decryptedRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    const refreshBody = (await refreshResponse.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!refreshResponse.ok || !refreshBody.access_token) {
      await logger.warn("oauth", "Google token refresh failed", {
        metadata: {
          httpStatus: refreshResponse.status,
          error: refreshBody.error ?? "unknown_error",
          errorDescription: refreshBody.error_description,
        },
      });
      throw new Error("Token-Erneuerung fehlgeschlagen. Bitte erneut verbinden.");
    }

    const expiresInSeconds =
      typeof refreshBody.expires_in === "number" && refreshBody.expires_in > 0
        ? refreshBody.expires_in
        : 3600;
    const expiresAtIso = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const encryptedAccessToken = encryptToken(refreshBody.access_token);
    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        access_token: encryptedAccessToken,
        expires_at: expiresAtIso,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    if (updateError) {
      await logger.warn("oauth", "Failed to store refreshed Google token", {
        metadata: { error: updateError.message },
      });
    }

    return buildAccessTokenResult(integration, refreshBody.access_token);
  } finally {
    await releaseRefreshLock(integration.id, lockToken);
  }
}

type CalendarEventInput = {
  accountId: string;
  summary: string;
  description?: string;
  startDate: string;
  startTime: string;
  durationMinutes?: number;
  timeZone?: string;
  calendarId?: string;
};

type CalendarEventResult = {
  id: string | null;
  htmlLink: string | null;
  calendarId?: string | null;
  timeZone?: string | null;
};

export async function createGoogleCalendarEvent(
  params: CalendarEventInput,
): Promise<CalendarEventResult> {
  const {
    accountId,
    summary,
    description,
    startDate,
    startTime,
    durationMinutes = 60,
    timeZone,
    calendarId,
  } = params;

  const {
    accessToken,
    calendarId: integrationCalendarId,
    calendarTimeZone,
  } = await getGoogleAccessToken(accountId);
  const resolvedCalendarId = calendarId ?? integrationCalendarId ?? "primary";
  const resolvedTimeZone = timeZone ?? calendarTimeZone ?? "Europe/Berlin";
  const startDateTime = formatDateTime(startDate, startTime);
  const endDateTime = addMinutes(startDate, startTime, durationMinutes);

  const createResponse = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(resolvedCalendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startDateTime, timeZone: resolvedTimeZone },
        end: { dateTime: endDateTime, timeZone: resolvedTimeZone },
      }),
    },
  );

  const createBody = await createResponse.json();
  if (!createResponse.ok) {
    await logger.warn("integration", "Google event creation failed", {
      metadata: {
        httpStatus: createResponse.status,
        error: createBody?.error ?? createBody,
      },
    });
    throw new Error("Google-Event konnte nicht erstellt werden.");
  }

  return {
    id: createBody?.id ?? null,
    htmlLink: createBody?.htmlLink ?? null,
    calendarId: resolvedCalendarId,
    timeZone: resolvedTimeZone,
  };
}

type CalendarEventUpdateInput = {
  accountId: string;
  eventId: string;
  summary: string;
  description?: string;
  startDate: string;
  startTime: string;
  durationMinutes?: number;
  timeZone?: string;
  calendarId?: string;
};

export async function updateGoogleCalendarEvent(
  params: CalendarEventUpdateInput,
): Promise<CalendarEventResult> {
  const {
    accountId,
    eventId,
    summary,
    description,
    startDate,
    startTime,
    durationMinutes = 60,
    timeZone,
    calendarId,
  } = params;

  const {
    accessToken,
    calendarId: integrationCalendarId,
    calendarTimeZone,
  } = await getGoogleAccessToken(accountId);
  const resolvedCalendarId = calendarId ?? integrationCalendarId ?? "primary";
  const resolvedTimeZone = timeZone ?? calendarTimeZone ?? "Europe/Berlin";

  const startDateTime = formatDateTime(startDate, startTime);
  const endDateTime = addMinutes(startDate, startTime, durationMinutes);

  const updateResponse = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(resolvedCalendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startDateTime, timeZone: resolvedTimeZone },
        end: { dateTime: endDateTime, timeZone: resolvedTimeZone },
      }),
    },
  );

  const updateBody = await updateResponse.json();
  if (!updateResponse.ok) {
    await logger.warn("integration", "Google event update failed", {
      metadata: {
        httpStatus: updateResponse.status,
        error: updateBody?.error ?? updateBody,
      },
    });
    throw new Error("Google-Event konnte nicht aktualisiert werden.");
  }

  return {
    id: updateBody?.id ?? null,
    htmlLink: updateBody?.htmlLink ?? null,
    calendarId: resolvedCalendarId,
    timeZone: resolvedTimeZone,
  };
}

type CalendarEventCancelInput = {
  accountId: string;
  eventId: string;
  calendarId?: string;
};

export async function cancelGoogleCalendarEvent(
  params: CalendarEventCancelInput,
): Promise<boolean> {
  const { accountId, eventId, calendarId } = params;
  const { accessToken, calendarId: integrationCalendarId } = await getGoogleAccessToken(accountId);
  const resolvedCalendarId = calendarId ?? integrationCalendarId ?? "primary";

  const cancelResponse = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(resolvedCalendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
    },
  );

  if (!cancelResponse.ok) {
    const cancelBody = await cancelResponse.json();
    await logger.warn("integration", "Google event cancel failed", {
      metadata: {
        httpStatus: cancelResponse.status,
        error: cancelBody?.error ?? cancelBody,
      },
    });
    return false;
  }

  return true;
}

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  timeZone: string | null;
  accessRole: string | null;
  primary: boolean;
};

export async function listGoogleCalendars(accountId: string): Promise<GoogleCalendarListItem[]> {
  const { accessToken } = await getGoogleAccessToken(accountId);
  const response = await fetch(`${GOOGLE_CALENDAR_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = await response.json();
  if (!response.ok) {
    await logger.warn("integration", "Google calendar list failed", {
      metadata: {
        httpStatus: response.status,
        error: payload?.error ?? payload,
      },
    });
    throw new Error("Kalender konnten nicht geladen werden.");
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  return items.map((item: any) => ({
    id: String(item.id),
    summary: String(item.summary ?? "Kalender"),
    timeZone: item.timeZone ? String(item.timeZone) : null,
    accessRole: item.accessRole ? String(item.accessRole) : null,
    primary: Boolean(item.primary),
  }));
}

function formatDateTime(dateStr: string, timeStr: string): string {
  const normalizedTime = normalizeTime(timeStr);
  return `${dateStr}T${normalizedTime}`;
}

function addMinutes(dateStr: string, timeStr: string, minutesToAdd: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute, second] = normalizeTime(timeStr).split(":").map(Number);

  const startUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const endUtc = new Date(startUtc + minutesToAdd * 60 * 1000);

  const endYear = endUtc.getUTCFullYear();
  const endMonth = String(endUtc.getUTCMonth() + 1).padStart(2, "0");
  const endDay = String(endUtc.getUTCDate()).padStart(2, "0");
  const endHour = String(endUtc.getUTCHours()).padStart(2, "0");
  const endMinute = String(endUtc.getUTCMinutes()).padStart(2, "0");
  const endSecond = String(endUtc.getUTCSeconds()).padStart(2, "0");

  return `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}:${endSecond}`;
}

function normalizeTime(timeStr: string): string {
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return `${timeStr}:00`;
  }
  const parts = timeStr.split(":");
  const hour = parts[0]?.padStart(2, "0") ?? "00";
  const minute = parts[1]?.padStart(2, "0") ?? "00";
  const second = parts[2]?.padStart(2, "0") ?? "00";
  return `${hour}:${minute}:${second}`;
}
