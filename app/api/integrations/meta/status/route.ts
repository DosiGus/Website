// DEPRECATED: Use GET /api/integrations instead
import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../../lib/apiAuth";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../../lib/rateLimit";

export async function GET(request: Request) {
  try {
    const { accountId, supabase } = await requireAccountMember(request);
    const rateLimit = await checkRateLimit(`integrations_meta_status:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { data, error } = await supabase
      .from("integrations")
      .select(
        "provider,status,account_name,instagram_id,page_id,expires_at,updated_at",
      )
      .eq("account_id", accountId)
      .eq("provider", "meta")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Status konnte nicht geladen werden" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ status: "disconnected" });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
