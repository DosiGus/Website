import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../../lib/supabaseServerClient";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../lib/rateLimit";
import {
  normalizeCalendarSettings,
  type CalendarSettings,
} from "../../../../lib/google/settings";
import { isVerticalKey, type VerticalKey } from "../../../../lib/verticals";

export async function GET(request: Request) {
  try {
    const { accountId } = await requireAccountMember(request);
    const rateLimit = await checkRateLimit(`account_settings:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("accounts")
      .select("settings, vertical")
      .eq("id", accountId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const calendar = normalizeCalendarSettings((data?.settings as any)?.calendar ?? null);
    return NextResponse.json({ calendar, vertical: data?.vertical ?? null });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { accountId, role } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }
    const rateLimit = await checkRateLimit(`account_settings:${accountId}:update`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const body = (await request.json()) as {
      calendar?: CalendarSettings;
      vertical?: VerticalKey | null;
    };
    const wantsCalendar = body?.calendar !== undefined;
    const wantsVertical = body?.vertical !== undefined;
    if (!wantsCalendar && !wantsVertical) {
      return NextResponse.json({ error: "Keine Einstellungen angegeben." }, { status: 400 });
    }
    if (wantsVertical && body.vertical !== null && !isVerticalKey(body.vertical)) {
      return NextResponse.json({ error: "Ungültige Branche." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    let nextCalendar: CalendarSettings | null = null;

    if (wantsCalendar) {
      const { data: account, error: loadError } = await supabase
        .from("accounts")
        .select("settings")
        .eq("id", accountId)
        .single();

      if (loadError) {
        return NextResponse.json({ error: loadError.message }, { status: 500 });
      }

      const currentSettings = (account?.settings ?? {}) as Record<string, unknown>;
      nextCalendar = normalizeCalendarSettings(body.calendar);
      const nextSettings = {
        ...currentSettings,
        calendar: nextCalendar,
      };
      updatePayload.settings = nextSettings;
    }

    if (wantsVertical) {
      updatePayload.vertical = body.vertical;
    }

    const { error: updateError } = await supabase
      .from("accounts")
      .update(updatePayload)
      .eq("id", accountId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      calendar: nextCalendar ?? undefined,
      vertical: wantsVertical ? body.vertical : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
