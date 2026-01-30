import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/apiAuth";
import { createSupabaseServerClient } from "../../../lib/supabaseServerClient";
import {
  Reservation,
  ReservationListResponse,
  ReservationStatus,
} from "../../../lib/reservationTypes";

/**
 * GET /api/reservations
 * List reservations with optional filters
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get("status") as ReservationStatus | null;
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
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
    const body = await request.json();

    const {
      guest_name,
      reservation_date,
      reservation_time,
      guest_count,
      phone_number,
      email,
      special_requests,
    } = body;

    // Validate required fields
    if (!guest_name || !reservation_date || !reservation_time || !guest_count) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["guest_name", "reservation_date", "reservation_time", "guest_count"],
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        user_id: user.id,
        guest_name,
        reservation_date,
        reservation_time,
        guest_count: Number(guest_count),
        phone_number: phone_number || null,
        email: email || null,
        special_requests: special_requests || null,
        source: "manual",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
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
    const body = await request.json();

    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Build update object
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Reservation ID is required" },
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
