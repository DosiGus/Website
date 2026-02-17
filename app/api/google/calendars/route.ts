import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../../lib/apiAuth";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../../lib/rateLimit";
import { listGoogleCalendars } from "../../../../../lib/google/calendar";

export async function GET(request: Request) {
  try {
    const { accountId } = await requireAccountMember(request);
    const rateLimit = checkRateLimit(`google_calendar:list:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const calendars = await listGoogleCalendars(accountId);
    const allowed = calendars.filter((cal) =>
      ["owner", "writer"].includes((cal.accessRole ?? "").toLowerCase()),
    );

    return NextResponse.json({ calendars: allowed });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
