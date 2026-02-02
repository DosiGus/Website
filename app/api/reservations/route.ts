import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/apiAuth";
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

/**
 * GET /api/reservations
 * List reservations with optional filters
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);

    // Rate limiting
    const rateLimit = checkRateLimit(`reservations:${user.id}`, RATE_LIMITS.generous);
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
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
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
    const user = await requireUser(request);

    // Rate limiting
    const rateLimit = checkRateLimit(`reservations:${user.id}`, RATE_LIMITS.standard);
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
    const user = await requireUser(request);

    // Rate limiting
    const rateLimit = checkRateLimit(`reservations:${user.id}`, RATE_LIMITS.standard);
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
      .eq("user_id", user.id)
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

    return NextResponse.json(data);
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
    const user = await requireUser(request);

    // Rate limiting
    const rateLimit = checkRateLimit(`reservations:${user.id}`, RATE_LIMITS.standard);
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

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Reservation DELETE error:", error);
      return NextResponse.json({ error: "Fehler beim Löschen der Reservierung" }, { status: 500 });
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
