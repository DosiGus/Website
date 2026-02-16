import { createSupabaseServerClient } from "../supabaseServerClient";
import { GOOGLE_CALENDAR_BASE, GOOGLE_TOKEN_URL } from "./types";
import { logger } from "../logger";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type GoogleIntegrationRow = {
  id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

type AccessTokenResult = {
  accessToken: string;
  integrationId: string;
};

export async function getGoogleAccessToken(accountId: string): Promise<AccessTokenResult> {
  const supabase = createSupabaseServerClient();
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, access_token, refresh_token, expires_at")
    .eq("account_id", accountId)
    .eq("provider", "google_calendar")
    .maybeSingle();

  if (error) {
    throw new Error("Integration konnte nicht geladen werden.");
  }

  if (!integration?.access_token) {
    throw new Error("Google Kalender ist nicht verbunden.");
  }

  const expiresAt = integration.expires_at ? new Date(integration.expires_at).getTime() : 0;
  const needsRefresh = !expiresAt || Date.now() + TOKEN_REFRESH_BUFFER_MS >= expiresAt;

  if (!needsRefresh) {
    return {
      accessToken: integration.access_token,
      integrationId: integration.id,
    };
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    throw new Error("Google OAuth ist nicht korrekt konfiguriert.");
  }

  if (!integration.refresh_token) {
    throw new Error("Refresh-Token fehlt. Bitte Google Kalender erneut verbinden.");
  }

  const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: integration.refresh_token,
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

  const { error: updateError } = await supabase
    .from("integrations")
    .update({
      access_token: refreshBody.access_token,
      expires_at: expiresAtIso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  if (updateError) {
    await logger.warn("oauth", "Failed to store refreshed Google token", {
      metadata: { error: updateError.message },
    });
  }

  return {
    accessToken: refreshBody.access_token,
    integrationId: integration.id,
  };
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
    timeZone = "Europe/Berlin",
    calendarId = "primary",
  } = params;

  const { accessToken } = await getGoogleAccessToken(accountId);
  const startDateTime = formatDateTime(startDate, startTime);
  const endDateTime = addMinutes(startDate, startTime, durationMinutes);

  const createResponse = await fetch(
    `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
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
  };
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
