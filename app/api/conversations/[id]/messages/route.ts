import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../../lib/apiAuth";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../../lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/conversations/[id]/messages
 * Get messages for a specific conversation
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { accountId, supabase } = await requireAccountMember(request);

    // Rate limiting
    const rateLimit = await checkRateLimit(`messages:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const conversationId = params.id;
    const { searchParams } = new URL(request.url);
    const rawLimit = Number.parseInt(searchParams.get("limit") || "100", 10);
    const rawOffset = Number.parseInt(searchParams.get("offset") || "0", 10);
    const limit = Math.min(Number.isFinite(rawLimit) ? rawLimit : 100, 500);
    const offset = Number.isFinite(rawOffset) ? rawOffset : 0;

    // First verify the conversation belongs to the user
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("id, account_id, instagram_sender_id, metadata")
      .eq("id", conversationId)
      .eq("account_id", accountId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Konversation nicht gefunden" },
        { status: 404 }
      );
    }

    // Fetch messages
    const { data: messages, error: msgError, count } = await supabase
      .from("messages")
      .select(`
        id,
        direction,
        message_type,
        content,
        quick_reply_payload,
        flow_id,
        node_id,
        created_at,
        flows:flow_id (
          id,
          name
        )
      `, { count: "exact" })
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    if (msgError) {
      console.error("Messages GET error:", msgError);
      return NextResponse.json(
        { error: "Fehler beim Laden der Nachrichten" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        instagram_sender_id: conversation.instagram_sender_id,
        metadata: conversation.metadata,
      },
      messages: messages ?? [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Messages GET unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
