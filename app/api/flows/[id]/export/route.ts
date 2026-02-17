import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../../lib/apiAuth";
import { defaultMetadata } from "../../../../../lib/defaultFlow";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../../lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { accountId, supabase } = await requireAccountMember(request);
    const rateLimit = await checkRateLimit(`flows_export:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }
    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("id", params.id)
      .eq("account_id", accountId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Flow nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      status: data.status,
      triggers: data.triggers ?? [],
      nodes: data.nodes ?? [],
      edges: data.edges ?? [],
      metadata: data.metadata ?? defaultMetadata,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
