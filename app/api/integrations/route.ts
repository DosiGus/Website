import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAccountMember, isRoleAtLeast } from "../../../lib/apiAuth";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../lib/rateLimit";
import { createRequestLogger } from "../../../lib/logger";

const integrationsPatchSchema = z.object({
  provider: z.enum(["meta", "google_calendar"]),
  google_review_url: z.string().max(2048).nullable().optional(),
  calendar_id: z.string().max(512).nullable().optional(),
  calendar_time_zone: z.string().max(128).nullable().optional(),
}).strict();

export async function GET(request: Request) {
  try {
    const { accountId, supabase, user } = await requireAccountMember(request);

    // Rate limiting
    const rateLimit = await checkRateLimit(`integrations:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { data, error } = await supabase
      .from("integrations")
      .select(
        "provider,status,account_name,instagram_id,instagram_username,page_id,expires_at,updated_at,google_review_url,calendar_id,calendar_time_zone",
      )
      .eq("account_id", accountId);

    if (error) {
      const reqLogger = createRequestLogger("api", user.id, accountId);
      await reqLogger.error("api", "Failed to load integrations", {
        metadata: { accountId, error: error.message },
      });
      return NextResponse.json({ error: "Fehler beim Laden der Integrationen" }, { status: 500 });
    }

    return NextResponse.json({ integrations: data ?? [] });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { accountId, role, supabase, user } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`integrations:${accountId}`, RATE_LIMITS.strict);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = (await request.json()) as { provider?: string };
    const provider = body?.provider;

    if (!provider) {
      return NextResponse.json({ error: "Provider fehlt." }, { status: 400 });
    }

    const { error } = await supabase
      .from("integrations")
      .update({
        status: "disconnected",
        access_token: null,
        refresh_token: null,
        expires_at: null,
        page_id: null,
        instagram_id: null,
        instagram_username: null,
        account_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq("account_id", accountId)
      .eq("provider", provider);

    if (error) {
      const reqLogger = createRequestLogger("api", user.id, accountId);
      await reqLogger.error("api", "Failed to disconnect integration", {
        metadata: { accountId, provider, error: error.message },
      });
      return NextResponse.json({ error: "Integration konnte nicht getrennt werden" }, { status: 500 });
    }

    const reqLogger = createRequestLogger("api", user.id, accountId);
    await reqLogger.info("api", "Integration disconnected", {
      metadata: { accountId, provider },
    });

    return NextResponse.json({ status: "disconnected" });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { accountId, role, supabase, user } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`integrations:${accountId}:update`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const parseResult = integrationsPatchSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }
    const body = parseResult.data;
    const provider = body.provider;

    if (!provider) {
      return NextResponse.json({ error: "Provider fehlt." }, { status: 400 });
    }

    if (body.google_review_url === undefined && body.calendar_id === undefined && body.calendar_time_zone === undefined) {
      return NextResponse.json({ error: "Kein Feld zum Aktualisieren angegeben." }, { status: 400 });
    }

    const update: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if ("google_review_url" in body) {
      update.google_review_url = body.google_review_url || null;
    }

    if ("calendar_id" in body) {
      update.calendar_id = body.calendar_id || null;
    }

    if ("calendar_time_zone" in body) {
      update.calendar_time_zone = body.calendar_time_zone || null;
    }

    const { data, error } = await supabase
      .from("integrations")
      .update(update)
      .eq("account_id", accountId)
      .eq("provider", provider)
      .select(
        "provider,status,account_name,instagram_id,instagram_username,page_id,expires_at,updated_at,google_review_url,calendar_id,calendar_time_zone",
      )
      .single();

    if (error) {
      const reqLogger = createRequestLogger("api", user.id, accountId);
      await reqLogger.error("api", "Failed to update integration", {
        metadata: { accountId, provider, error: error.message },
      });
      return NextResponse.json({ error: "Integration konnte nicht aktualisiert werden" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Integration nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({ integration: data });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
