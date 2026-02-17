import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../lib/apiAuth";
import { defaultMetadata } from "../../../../lib/defaultFlow";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../lib/rateLimit";
import { z } from "zod";
import { createRequestLogger } from "../../../../lib/logger";

const flowPutSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["Entwurf", "Aktiv"]).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  triggers: z.array(z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).strict();

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
      return NextResponse.json({ error: "Flow nicht gefunden" }, { status: 404 });
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
    const parseResult = flowPutSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }
    const body = parseResult.data;
    if (
      body.name === undefined &&
      body.status === undefined &&
      body.nodes === undefined &&
      body.edges === undefined &&
      body.triggers === undefined &&
      body.metadata === undefined
    ) {
      return NextResponse.json({ error: "Keine Felder zum Aktualisieren." }, { status: 400 });
    }
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) update.name = body.name;
    if (body.status !== undefined) update.status = body.status;
    if (body.nodes !== undefined) update.nodes = body.nodes;
    if (body.edges !== undefined) update.edges = body.edges;
    if (body.triggers !== undefined) update.triggers = body.triggers;
    if (body.metadata !== undefined) update.metadata = body.metadata ?? defaultMetadata;
    const { error } = await supabase
      .from("flows")
      .update(update)
      .eq("id", params.id)
      .eq("account_id", accountId);

    if (error) {
      return NextResponse.json({ error: "Flow konnte nicht aktualisiert werden" }, { status: 500 });
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
      return NextResponse.json({ error: "Flow konnte nicht gelöscht werden" }, { status: 500 });
    }

    const reqLogger = createRequestLogger("api");
    await reqLogger.info("api", "Flow deleted", {
      metadata: { accountId, flowId: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
