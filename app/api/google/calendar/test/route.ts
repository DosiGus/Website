import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../../lib/apiAuth";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../../lib/rateLimit";
import { getGoogleAccessToken } from "../../../../../lib/google/calendar";
import { GOOGLE_CALENDAR_BASE } from "../../../../../lib/google/types";
import { createRequestLogger } from "../../../../../lib/logger";
import crypto from "crypto";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger("integration");

  try {
    const { accountId } = await requireAccountMember(request);
    const rateLimit = checkRateLimit(`google_calendar:test:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const { accessToken } = await getGoogleAccessToken(accountId);

    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const createResponse = await fetch(
      `${GOOGLE_CALENDAR_BASE}/calendars/primary/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: "Wesponde Testtermin",
          description: "Automatisch erstellt zum Test der Google-Kalender-Integration.",
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
        }),
      },
    );

    const createBody = await createResponse.json();
    if (!createResponse.ok) {
      await log.warn("integration", "Google test event creation failed", {
        requestId,
        metadata: {
          httpStatus: createResponse.status,
          error: createBody?.error ?? createBody,
        },
      });
      return NextResponse.json(
        { error: "Testtermin konnte nicht erstellt werden." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        id: createBody?.id ?? null,
        htmlLink: createBody?.htmlLink ?? null,
        start: createBody?.start?.dateTime ?? null,
        end: createBody?.end?.dateTime ?? null,
      },
    });
  } catch (error) {
    await log.logError("integration", error, "Google test event failed", { requestId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
