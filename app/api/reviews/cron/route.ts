import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";
import { sendReviewRequestForReservation } from "../../../../lib/reviews/reviewSender";
import { logger } from "../../../../lib/logger";

const DEFAULT_DELAY_HOURS = 3;
const LOOKBACK_DAYS = 30;

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const delayHours = parseDelayHours(process.env.REVIEW_DELAY_HOURS);
  const now = new Date();
  const sinceDate = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: reservations, error } = await supabase
    .from("reservations")
    .select("id, reservation_date, reservation_time, status")
    .in("status", ["pending", "confirmed", "completed"])
    .gte("reservation_date", sinceDate);

  if (error) {
    await logger.error("system", "Review cron failed to load reservations", {
      metadata: { error: error.message },
    });
    return NextResponse.json({ error: "Failed to load reservations" }, { status: 500 });
  }

  let processed = 0;
  let sent = 0;
  let skipped = 0;
  let dueCount = 0;

  for (const reservation of reservations ?? []) {
    const due = isReservationDue(reservation, now, delayHours);
    if (!due) {
      continue;
    }

    dueCount += 1;
    processed += 1;

    const result = await sendReviewRequestForReservation(reservation.id, "time_elapsed");
    if (result?.success) {
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    sent,
    skipped,
    dueCount,
    delayHours,
  });
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return true;
  }

  const vercelCronHeader = request.headers.get("x-vercel-cron");
  if (vercelCronHeader) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = request.headers.get("x-cron-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("cron_secret") || url.searchParams.get("token");

  return bearer === secret || headerSecret === secret || querySecret === secret;
}

function parseDelayHours(value?: string) {
  const parsed = value ? Number.parseFloat(value) : DEFAULT_DELAY_HOURS;
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_DELAY_HOURS;
  }
  return parsed;
}

function isReservationDue(
  reservation: { reservation_date: string; reservation_time: string; status: string },
  now: Date,
  delayHours: number,
) {
  if (reservation.status === "completed") {
    return true;
  }

  const visitAt = combineDateTime(reservation.reservation_date, reservation.reservation_time);
  if (!visitAt) {
    return false;
  }

  const dueAt = new Date(visitAt.getTime() + delayHours * 60 * 60 * 1000);
  return now >= dueAt;
}

function combineDateTime(dateStr: string, timeStr: string) {
  if (!dateStr || !timeStr) return null;
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const iso = `${dateStr}T${normalizedTime}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}
