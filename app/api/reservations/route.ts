import { NextResponse } from "next/server";
import { requireAccountMember, isRoleAtLeast } from "../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import {
  Reservation,
  ReservationListResponse,
  ReservationStatus,
} from "../../../lib/reservationTypes";
import {
  createReservationSchema,
  updateReservationSchema,
  reservationQuerySchema,
  formatZodErrors,
} from "../../../lib/validation/reservationSchema";
import { checkRateLimit, rateLimitHeaders, RATE_LIMITS } from "../../../lib/rateLimit";
import { cancelGoogleCalendarEvent, updateGoogleCalendarEvent } from "../../../lib/google/calendar";
import { normalizeCalendarSettings } from "../../../lib/google/settings";
import { sendReviewRequestForReservation } from "../../../lib/reviews/reviewSender";

/**
 * GET /api/reservations
 * List reservations with optional filters
 */
export async function GET(request: Request) {
  try {
    const { user, accountId } = await requireAccountMember(request);

    // Rate limiting
    const rateLimit = await checkRateLimit(`reservations:${accountId}`, RATE_LIMITS.generous);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = {
      status: searchParams.get("status") || undefined,
      date: searchParams.get("date") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    };

    const parseResult = reservationQuerySchema.safeParse(queryParams);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Ungültige Abfrageparameter", details: formatZodErrors(parseResult.error) },
        { status: 400 }
      );
    }

    const { status, date, dateFrom, dateTo, limit, offset } = parseResult.data;

    const supabase = createSupabaseServerClient();

    // Build query
    let query = supabase
      .from("reservations")
      .select("*, contacts:contact_id (id, display_name)", { count: "exact" })
      .eq("account_id", accountId)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }

    if (date) {
      query = query.eq("reservation_date", date);
    }

    if (dateFrom) {
      query = query.gte("reservation_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("reservation_date", dateTo);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Reservations GET error:", error);
      return NextResponse.json({ error: "Fehler beim Laden der Reservierungen" }, { status: 500 });
    }

    const response: ReservationListResponse = {
      reservations: data as Reservation[],
      total: count || 0,
      limit,
      offset,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Reservations GET unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations
 * Create a new reservation manually
 */
export async function POST(request: Request) {
  try {
    const { user, accountId, role } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`reservations:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();

    // Validate input
    const parseResult = createReservationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: formatZodErrors(parseResult.error) },
        { status: 400 }
      );
    }

    const {
      guest_name,
      reservation_date,
      reservation_time,
      guest_count,
      phone_number,
      email,
      special_requests,
    } = parseResult.data;

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        account_id: accountId,
        guest_name,
        reservation_date,
        reservation_time,
        guest_count,
        phone_number,
        email,
        special_requests,
        source: "manual",
      })
      .select()
      .single();

    if (error) {
      console.error("Reservation POST error:", error);
      return NextResponse.json({ error: "Fehler beim Erstellen der Reservierung" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Reservation POST unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reservations
 * Update a reservation (status, details)
 */
export async function PATCH(request: Request) {
  try {
    const { user, accountId, role } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`reservations:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();

    // Validate input
    const parseResult = updateReservationSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: formatZodErrors(parseResult.error) },
        { status: 400 }
      );
    }

    const { id, status, ...updates } = parseResult.data;

    const supabase = createSupabaseServerClient();

    const { data: existingReservation, error: loadError } = await supabase
      .from("reservations")
      .select(
        "id, guest_name, reservation_date, reservation_time, phone_number, email, special_requests, status, google_event_id, google_calendar_id, google_time_zone",
      )
      .eq("id", id)
      .eq("account_id", accountId)
      .single();

    if (loadError || !existingReservation) {
      return NextResponse.json(
        { error: "Reservierung nicht gefunden" },
        { status: 404 },
      );
    }

    // Build update object (only include defined values)
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only add fields that are defined
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (status) {
      updateData.status = status;
      if (status === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", id)
      .eq("account_id", accountId)
      .select()
      .single();

    if (error) {
      console.error("Reservation PATCH error:", error);
      return NextResponse.json({ error: "Fehler beim Aktualisieren der Reservierung" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Reservierung nicht gefunden" },
        { status: 404 }
      );
    }

    const statusChanged = status && status !== existingReservation.status;
    const isCancelled = statusChanged && (status === "cancelled" || status === "no_show");
    const dateChanged = updateData.reservation_date !== undefined;
    const timeChanged = updateData.reservation_time !== undefined;
    const detailsChanged =
      updateData.guest_name !== undefined ||
      updateData.phone_number !== undefined ||
      updateData.email !== undefined ||
      updateData.special_requests !== undefined;

    if (existingReservation.google_event_id) {
      try {
        if (isCancelled) {
          await cancelGoogleCalendarEvent({
            accountId,
            eventId: existingReservation.google_event_id,
            calendarId: existingReservation.google_calendar_id ?? undefined,
          });
        } else if (dateChanged || timeChanged || detailsChanged) {
          const { data: account } = await supabase
            .from("accounts")
            .select("settings")
            .eq("id", accountId)
            .single();
          const settings = normalizeCalendarSettings((account?.settings as any)?.calendar ?? null);

          const nextReservation = {
            ...existingReservation,
            ...updates,
            status: status ?? existingReservation.status,
          };
          const descriptionParts = [
            `Name: ${nextReservation.guest_name}`,
            nextReservation.phone_number ? `Telefon: ${nextReservation.phone_number}` : null,
            nextReservation.email ? `Email: ${nextReservation.email}` : null,
            nextReservation.special_requests ? `Notizen: ${nextReservation.special_requests}` : null,
            `Reservierungs-ID: ${nextReservation.id}`,
          ].filter(Boolean);

          await updateGoogleCalendarEvent({
            accountId,
            eventId: existingReservation.google_event_id,
            calendarId: existingReservation.google_calendar_id ?? undefined,
            timeZone: existingReservation.google_time_zone ?? undefined,
            summary: `Termin mit ${nextReservation.guest_name}`,
            description: descriptionParts.join("\n"),
            startDate: nextReservation.reservation_date,
            startTime: nextReservation.reservation_time,
            durationMinutes: settings.slotDurationMinutes,
          });
        }
      } catch (calendarError) {
        console.error("Google Calendar update failed:", calendarError);
      }
    }

    let reviewResult = null;
    if (status === "completed") {
      try {
        reviewResult = await sendReviewRequestForReservation(data.id, "manual_completed");
      } catch (error) {
        console.error("Review request trigger failed:", error);
        reviewResult = { success: false, status: "error" };
      }
    }

    return NextResponse.json({ reservation: data, review: reviewResult });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Reservation PATCH unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reservations
 * Delete a reservation
 */
export async function DELETE(request: Request) {
  try {
    const { user, accountId, role } = await requireAccountMember(request);
    if (!isRoleAtLeast(role, "member")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(`reservations:${accountId}`, RATE_LIMITS.standard);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte warte einen Moment." },
        { status: 429, headers: rateLimitHeaders(rateLimit) }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Reservierungs-ID ist erforderlich" },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Ungültige Reservierungs-ID" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: existingReservation, error: loadError } = await supabase
      .from("reservations")
      .select("id, google_event_id, google_calendar_id")
      .eq("id", id)
      .eq("account_id", accountId)
      .single();

    if (loadError || !existingReservation) {
      return NextResponse.json({ error: "Reservierung nicht gefunden" }, { status: 404 });
    }

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id)
      .eq("account_id", accountId);

    if (error) {
      console.error("Reservation DELETE error:", error);
      return NextResponse.json({ error: "Fehler beim Löschen der Reservierung" }, { status: 500 });
    }

    if (existingReservation.google_event_id) {
      await cancelGoogleCalendarEvent({
        accountId,
        eventId: existingReservation.google_event_id,
        calendarId: existingReservation.google_calendar_id ?? undefined,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }
    console.error("Reservation DELETE unexpected error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
