/**
 * Reservation Creator - Creates reservations from extracted flow variables
 */

import { createSupabaseServerClient } from "../supabaseServerClient";
import { ExtractedVariables } from "./variableExtractor";
import { CreateReservationInput } from "../reservationTypes";

export type ReservationCreationResult =
  | { success: true; reservationId: string }
  | { success: false; missingFields: string[]; error?: string };

/**
 * Required fields for creating a reservation
 */
const REQUIRED_FIELDS = ["name", "date", "time", "guestCount"] as const;

/**
 * Checks if all required fields are present to create a reservation.
 */
export function canCreateReservation(variables: ExtractedVariables): boolean {
  return REQUIRED_FIELDS.every(
    (field) => variables[field] !== undefined && variables[field] !== ""
  );
}

/**
 * Returns the list of missing required fields.
 */
export function getMissingReservationFields(
  variables: ExtractedVariables
): string[] {
  return REQUIRED_FIELDS.filter(
    (field) => variables[field] === undefined || variables[field] === ""
  );
}

/**
 * Creates a reservation from extracted flow variables.
 */
export async function createReservationFromVariables(
  userId: string,
  conversationId: string,
  flowId: string | null,
  variables: ExtractedVariables,
  instagramSenderId?: string
): Promise<ReservationCreationResult> {
  const missing = getMissingReservationFields(variables);

  if (missing.length > 0) {
    return { success: false, missingFields: missing };
  }

  const supabase = createSupabaseServerClient();

  try {
    // Log the incoming variables for debugging
    console.log("Creating reservation with variables:", JSON.stringify(variables, null, 2));

    const input: CreateReservationInput = {
      guest_name: String(variables.name),
      reservation_date: parseDate(String(variables.date)),
      reservation_time: parseTime(String(variables.time)),
      guest_count: Number(variables.guestCount),
      phone_number: variables.phone ? String(variables.phone) : null,
      email: variables.email ? String(variables.email) : null,
      special_requests: variables.specialRequests
        ? String(variables.specialRequests)
        : null,
      conversation_id: conversationId,
      flow_id: flowId || undefined,
      instagram_sender_id: instagramSenderId,
    };

    // Log what we're actually inserting
    console.log("Reservation input:", JSON.stringify(input, null, 2));

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        user_id: userId,
        ...input,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create reservation:", error);
      return { success: false, missingFields: [], error: error.message };
    }

    return { success: true, reservationId: data.id };
  } catch (err) {
    console.error("Error creating reservation:", err);
    return {
      success: false,
      missingFields: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Parses a date string to YYYY-MM-DD format.
 * Handles: "15.01.2024", "15/01/24", "15-01-2024", "2024-01-15"
 */
function parseDate(dateStr: string): string {
  // Already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // German format: DD.MM.YYYY or DD/MM/YYYY
  const parts = dateStr.split(/[.\-/]/);
  if (parts.length >= 2) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    let year = parts[2] || new Date().getFullYear().toString();
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

/**
 * Parses a time string to HH:MM format.
 * Handles: "19:00", "19.00", "19 Uhr"
 */
function parseTime(timeStr: string): string {
  // Already in correct format
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }

  // Handle "19:00" or "19.00"
  const match = timeStr.match(/(\d{1,2})[.:](\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  // Handle "19 Uhr"
  const hourMatch = timeStr.match(/(\d{1,2})\s*uhr/i);
  if (hourMatch) {
    return `${hourMatch[1].padStart(2, "0")}:00`;
  }

  return timeStr;
}

/**
 * Formats a reservation for display (German format).
 */
export function formatReservationSummary(variables: ExtractedVariables): string {
  const name = variables.name || "[Name]";
  const date = variables.date || "[Datum]";
  const time = variables.time || "[Uhrzeit]";
  const guests = variables.guestCount || "[Anzahl]";

  // Format date for German display
  let displayDate = date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    displayDate = `${day}.${month}.${year}`;
  }

  return `${name}, ${guests} Personen am ${displayDate} um ${time} Uhr`;
}
