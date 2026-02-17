import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../lib/rateLimit";

const waitlistSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  industry: z.string().trim().min(1).max(120),
}).strict();

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const rateLimit = await checkRateLimit(`waitlist:${ip}`, RATE_LIMITS.strict);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Zu viele Anfragen. Bitte warte einen Moment." },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const parseResult = waitlistSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  return NextResponse.json({ status: "ok" });
}
