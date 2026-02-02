import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../lib/rateLimit";

/**
 * GET /api/conversations
 * List conversations with optional filters
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);

    // Rate limiting
    const rateLimit = checkRateLimit(`conversations:${user.id}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status"); // active, closed

    const supabase = createSupabaseServerClient();

    let query = supabase
      .from("conversations")
      .select(`
        id,
        instagram_sender_id,
        status,
        current_flow_id,
        current_node_id,
        metadata,
        last_message_at,
        created_at,
        flows:current_flow_id (
          id,
          name
        )
      `, { count: "exact" })
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Conversations GET error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Konversationen" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversations: data ?? [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Conversations GET unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
