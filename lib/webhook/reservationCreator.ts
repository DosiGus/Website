/**
 * Reservation Creator - Creates reservations from extracted flow variables
 */

import { createSupabaseServerClient } from "../supabaseServerClient";
import { ExtractedVariables } from "./variableExtractor";
import { CreateReservationInput } from "../reservationTypes";
import { cancelGoogleCalendarEvent, createGoogleCalendarEvent } from "../google/calendar";
import { logger } from "../logger";
import { checkSlotAvailability, type SlotSuggestion } from "../google/availability";
import { normalizeCalendarSettings } from "../google/settings";
import crypto from "crypto";

export type ReservationCreationResult =
  | { success: true; reservationId: string; warning?: "calendar_error" }
  | { success: false; missingFields: string[]; error?: string; suggestions?: SlotSuggestion[] };

/**
 * Required fields for creating a reservation
 */
const REQUIRED_FIELDS = ["name", "date", "time", "guestCount"] as const;
type RequiredField = (typeof REQUIRED_FIELDS)[number];

function isMissingValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

function normalizeGuestCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

/**
 * Checks if all required fields are present to create a reservation.
 */
export function canCreateReservation(
  variables: ExtractedVariables,
  requiredFields: ReadonlyArray<string> = REQUIRED_FIELDS
): boolean {
  return requiredFields.every((field) => !isMissingValue(variables[field]));
}

/**
 * Returns the list of missing required fields.
 */
export function getMissingReservationFields(
  variables: ExtractedVariables,
  requiredFields: ReadonlyArray<string> = REQUIRED_FIELDS
): string[] {
  return requiredFields.filter((field) => isMissingValue(variables[field]));
}

/**
 * Creates a reservation from extracted flow variables.
 */
export async function createReservationFromVariables(
  userId: string | null,
  accountId: string,
  conversationId: string,
  flowId: string | null,
  variables: ExtractedVariables,
  instagramSenderId?: string,
  contactId?: string,
  requiredFields?: ReadonlyArray<string>
): Promise<ReservationCreationResult> {
  const missing = getMissingReservationFields(variables, requiredFields);

  if (missing.length > 0) {
    return { success: false, missingFields: missing };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data: account, error: settingsError } = await supabase
      .from("accounts")
      .select("settings")
      .eq("id", accountId)
      .single();
    if (settingsError) {
      await logger.warn("integration", "Failed to load calendar settings", {
        userId,
        accountId,
        metadata: { error: settingsError.message },
      });
    }
    const calendarSettings = normalizeCalendarSettings(
      (account?.settings as any)?.calendar ?? null
    );

    const guestCount = normalizeGuestCount(variables.guestCount) ?? 1;
    const input: CreateReservationInput = {
      guest_name: String(variables.name),
      reservation_date: parseDate(String(variables.date)),
      reservation_time: parseTime(String(variables.time)),
      guest_count: guestCount,
      phone_number: variables.phone ? String(variables.phone) : null,
      email: variables.email ? String(variables.email) : null,
      special_requests: variables.specialRequests
        ? String(variables.specialRequests)
        : null,
      conversation_id: conversationId,
      flow_id: flowId || undefined,
      instagram_sender_id: instagramSenderId,
    };

    const availability = await checkSlotAvailability(
      accountId,
      input.reservation_date,
      input.reservation_time
    );
    if (!availability.available) {
      if (availability.error === "availability_error") {
        return {
          success: false,
          missingFields: [],
          error: "availability_error",
        };
      }
      return {
        success: false,
        missingFields: [],
        error: "slot_unavailable",
        suggestions: availability.suggestions,
      };
    }

    try {
      const reservationId = crypto.randomUUID();
      const descriptionParts = [
        `Name: ${input.guest_name}`,
        input.phone_number ? `Telefon: ${input.phone_number}` : null,
        input.email ? `Email: ${input.email}` : null,
        input.special_requests ? `Notizen: ${input.special_requests}` : null,
        `Reservierungs-ID: ${reservationId}`,
      ].filter(Boolean);

      const event = await createGoogleCalendarEvent({
        accountId,
        summary: `Termin mit ${input.guest_name}`,
        description: descriptionParts.join("\n"),
        startDate: input.reservation_date,
        startTime: input.reservation_time,
        durationMinutes: calendarSettings.slotDurationMinutes,
        timeZone: calendarSettings.timeZone,
      });

      await logger.info("integration", "Google calendar event created", {
        userId,
        accountId,
        metadata: {
          reservationId,
          eventId: event.id,
        },
      });

      const { data, error } = await supabase
        .from("reservations")
        .insert({
          id: reservationId,
          user_id: userId,
          account_id: accountId,
          contact_id: contactId || null,
          ...input,
          google_event_id: event.id,
          google_event_link: event.htmlLink,
          google_calendar_id: event.calendarId ?? null,
          google_time_zone: event.timeZone ?? null,
        })
        .select("id")
        .single();

      if (error || !data) {
        console.error("[reservationCreator] DB insert failed after calendar event:", {
          userId,
          accountId,
          reservationId,
          error: error?.message,
          code: error?.code,
          details: error?.details,
        });
        await logger.warn("integration", "Failed to store reservation after calendar event", {
          userId,
          accountId,
          metadata: {
            reservationId,
            error: error?.message ?? "Unknown error",
            code: error?.code,
          },
        });
        if (event.id) {
          try {
            await cancelGoogleCalendarEvent({
              accountId,
              eventId: event.id,
              calendarId: event.calendarId ?? undefined,
            });
          } catch (cancelError) {
            await logger.warn("integration", "Failed to rollback calendar event", {
              userId,
              accountId,
              metadata: {
                reservationId,
                eventId: event.id,
                error: cancelError instanceof Error ? cancelError.message : "Unknown error",
              },
            });
          }
        }
        return { success: false, missingFields: [], error: "calendar_store_failed" };
      }

      return { success: true, reservationId: data.id };
    } catch (calendarError) {
      const errorMessage =
        calendarError instanceof Error ? calendarError.message : "Unknown error";
      await logger.warn("integration", "Google calendar event failed", {
        userId,
        accountId,
        metadata: {
          error: errorMessage,
        },
      });
      const fallbackReservationId = crypto.randomUUID();
      const { data: fallbackReservation, error: fallbackError } = await supabase
        .from("reservations")
        .insert({
          id: fallbackReservationId,
          user_id: userId,
          account_id: accountId,
          contact_id: contactId || null,
          ...input,
          google_event_id: null,
          google_event_link: null,
          google_calendar_id: null,
          google_time_zone: null,
        })
        .select("id")
        .single();

      if (fallbackError || !fallbackReservation) {
        await logger.warn("integration", "Failed to store reservation after calendar error", {
          userId,
          accountId,
          metadata: { error: fallbackError?.message ?? "Unknown error" },
        });
        return { success: false, missingFields: [], error: "calendar_error" };
      }

      return {
        success: true,
        reservationId: fallbackReservation.id,
        warning: "calendar_error",
      };
    }
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
