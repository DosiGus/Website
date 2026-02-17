import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../lib/apiAuth";
import { defaultMetadata } from "../../../../lib/defaultFlow";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../lib/rateLimit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { accountId, supabase } = await requireAccountMember(request);
    const rateLimit = await checkRateLimit(`flows:${accountId}`, RATE_LIMITS.generous);
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { accountId, role, supabase } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const rateLimit = await checkRateLimit(`flows:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }
    const body = await request.json();
    const { error } = await supabase
      .from("flows")
      .update({
        name: body.name,
        status: body.status,
        nodes: body.nodes,
        edges: body.edges,
        triggers: body.triggers ?? [],
        metadata: body.metadata ?? defaultMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("account_id", accountId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { accountId, role, supabase } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const rateLimit = await checkRateLimit(`flows:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }
    const { error } = await supabase
      .from("flows")
      .delete()
      .eq("id", params.id)
      .eq("account_id", accountId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
