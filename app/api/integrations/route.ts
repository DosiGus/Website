import { NextResponse } from "next/server";
import { requireUser, requireAccountMember } from "../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../lib/rateLimit";

export async function GET(request: Request) {
  try {
    const { user, accountId } = await requireAccountMember(request);

    // Rate limiting
    const rateLimit = await checkRateLimit(`integrations:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("integrations")
      .select(
        "provider,status,account_name,instagram_id,instagram_username,page_id,expires_at,updated_at,google_review_url,calendar_id,calendar_time_zone",
      )
      .eq("account_id", accountId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ integrations: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, accountId } = await requireAccountMember(request);

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

    const supabase = createSupabaseServerClient();

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "disconnected" });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, accountId } = await requireAccountMember(request);

    // Rate limiting
    const rateLimit = await checkRateLimit(`integrations:${user.id}:update`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = (await request.json()) as {
      provider?: string;
      google_review_url?: string | null;
      calendar_id?: string | null;
      calendar_time_zone?: string | null;
    };
    const provider = body?.provider;

    if (!provider) {
      return NextResponse.json({ error: "Provider fehlt." }, { status: 400 });
    }

    if (!("google_review_url" in body) && !("calendar_id" in body) && !("calendar_time_zone" in body)) {
      return NextResponse.json({ error: "Kein Feld zum Aktualisieren angegeben." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Integration nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({ integration: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
