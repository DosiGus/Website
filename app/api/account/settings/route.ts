import { NextResponse } from "next/server";
import { requireAccountMember } from "../../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../lib/rateLimit";
import {
  normalizeCalendarSettings,
  type CalendarSettings,
} from "../../../../lib/google/settings";

export async function GET(request: Request) {
  try {
    const { accountId } = await requireAccountMember(request);
    const rateLimit = checkRateLimit(`account_settings:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("accounts")
      .select("settings")
      .eq("id", accountId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const calendar = normalizeCalendarSettings((data?.settings as any)?.calendar ?? null);
    return NextResponse.json({ calendar });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { accountId } = await requireAccountMember(request);
    const rateLimit = checkRateLimit(`account_settings:${accountId}:update`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const body = (await request.json()) as { calendar?: CalendarSettings };
    if (!body?.calendar) {
      return NextResponse.json({ error: "Keine Kalender-Einstellungen angegeben." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: account, error: loadError } = await supabase
      .from("accounts")
      .select("settings")
      .eq("id", accountId)
      .single();

    if (loadError) {
      return NextResponse.json({ error: loadError.message }, { status: 500 });
    }

    const currentSettings = (account?.settings ?? {}) as Record<string, unknown>;
    const nextCalendar = normalizeCalendarSettings(body.calendar);
    const nextSettings = {
      ...currentSettings,
      calendar: nextCalendar,
    };

    const { error: updateError } = await supabase
      .from("accounts")
      .update({ settings: nextSettings, updated_at: new Date().toISOString() })
      .eq("id", accountId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ calendar: nextCalendar });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
