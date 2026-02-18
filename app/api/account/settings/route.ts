import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../../lib/apiAuth";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../../lib/rateLimit";
import {
  normalizeCalendarSettings,
  type CalendarSettings,
} from "../../../../lib/google/settings";
import { isVerticalKey, type VerticalKey } from "../../../../lib/verticals";
import { createRequestLogger } from "../../../../lib/logger";

export async function GET(request: Request) {
  try {
    const { accountId, supabase, user } = await requireAccountMember(request);
    const reqLogger = createRequestLogger("api", user.id, accountId);
    const rateLimit = await checkRateLimit(`account_settings:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const { data, error } = await supabase
      .from("accounts")
      .select("settings, vertical")
      .eq("id", accountId)
      .single();

    if (error) {
      await reqLogger.error("api", "Failed to load account settings", {
        metadata: { accountId, error: error.message },
      });
      return NextResponse.json(
        { error: "Einstellungen konnten nicht geladen werden." },
        { status: 500 },
      );
    }

    const calendar = normalizeCalendarSettings((data?.settings as any)?.calendar ?? null);
    return NextResponse.json({ calendar, vertical: data?.vertical ?? null });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
      }
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { accountId, role, supabase, user } = await requireAccountMember(request);
    const reqLogger = createRequestLogger("api", user.id, accountId);
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
        await reqLogger.error("api", "Failed to load account settings for update", {
          metadata: { accountId, error: loadError.message },
        });
        return NextResponse.json(
          { error: "Einstellungen konnten nicht geladen werden." },
          { status: 500 },
        );
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
      await reqLogger.error("api", "Failed to update account settings", {
        metadata: {
          accountId,
          error: updateError.message,
          updatedFields: Object.keys(updatePayload),
        },
      });
      return NextResponse.json(
        { error: "Einstellungen konnten nicht gespeichert werden." },
        { status: 500 },
      );
    }

    await reqLogger.info("api", "Account settings updated", {
      metadata: {
        accountId,
        updatedFields: Object.keys(updatePayload),
        vertical: wantsVertical ? body.vertical : undefined,
        calendarUpdated: wantsCalendar,
      },
    });

    return NextResponse.json({
      calendar: nextCalendar ?? undefined,
      vertical: wantsVertical ? body.vertical : undefined,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
      }
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler." }, { status: 500 });
  }
}
