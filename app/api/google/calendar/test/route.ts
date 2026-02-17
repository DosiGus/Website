import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../../lib/apiAuth";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../../lib/rateLimit";
import { createGoogleCalendarEvent } from "../../../../../lib/google/calendar";
import { createRequestLogger } from "../../../../../lib/logger";
import crypto from "crypto";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger("integration");

  try {
    const { accountId, role } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const rateLimit = await checkRateLimit(`google_calendar:test:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const start = new Date(Date.now() + 60 * 60 * 1000);
    const date = start.toISOString().split("T")[0];
    const time = start.toISOString().split("T")[1]?.slice(0, 5) ?? "10:00";
    const event = await createGoogleCalendarEvent({
      accountId,
      summary: "Wesponde Testtermin",
      description: "Automatisch erstellt zum Test der Google-Kalender-Integration.",
      startDate: date,
      startTime: time,
      durationMinutes: 60,
      timeZone: "Europe/Berlin",
      calendarId: "primary",
    });

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    await log.logError("integration", error, "Google test event failed", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
