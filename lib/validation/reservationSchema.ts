import { z } from "zod";
import { ReservationStatus } from "../reservationTypes";

/**
 * Schema for creating a new reservation
 */
export const createReservationSchema = z.object({
  guest_name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(100, "Name darf maximal 100 Zeichen haben")
    .trim(),

  reservation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format YYYY-MM-DD sein"),

  reservation_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Uhrzeit muss im Format HH:MM sein"),

  guest_count: z.coerce
    .number()
    .int("Gästeanzahl muss eine ganze Zahl sein")
    .min(1, "Mindestens 1 Gast erforderlich")
    .max(100, "Maximal 100 Gäste"),

  phone_number: z
    .string()
    .max(20, "Telefonnummer darf maximal 20 Zeichen haben")
    .optional()
    .nullable()
    .transform((val) => val || null),

  email: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .max(100, "E-Mail darf maximal 100 Zeichen haben")
    .optional()
    .nullable()
    .transform((val) => val || null),

  special_requests: z
    .string()
    .max(500, "Sonderwünsche dürfen maximal 500 Zeichen haben")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

/**
 * Schema for updating a reservation
 */
export const updateReservationSchema = z.object({
  id: z.string().uuid("Ungültige Reservierungs-ID"),

  status: z
    .enum(["pending", "confirmed", "completed", "cancelled", "no_show"] as const)
    .optional(),

  guest_name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(100, "Name darf maximal 100 Zeichen haben")
    .trim()
    .optional(),

  reservation_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format YYYY-MM-DD sein")
    .optional(),

  reservation_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Uhrzeit muss im Format HH:MM sein")
    .optional(),

  guest_count: z.coerce
    .number()
    .int("Gästeanzahl muss eine ganze Zahl sein")
    .min(1, "Mindestens 1 Gast erforderlich")
    .max(100, "Maximal 100 Gäste")
    .optional(),

  phone_number: z
    .string()
    .max(20, "Telefonnummer darf maximal 20 Zeichen haben")
    .optional()
    .nullable()
    .transform((val) => val || null),

  email: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .max(100, "E-Mail darf maximal 100 Zeichen haben")
    .optional()
    .nullable()
    .transform((val) => val || null),

  special_requests: z
    .string()
    .max(500, "Sonderwünsche dürfen maximal 500 Zeichen haben")
    .optional()
    .nullable()
    .transform((val) => val || null),
});

/**
 * Schema for query parameters (GET)
 */
export const reservationQuerySchema = z.object({
  status: z
    .enum(["pending", "confirmed", "completed", "cancelled", "no_show"] as const)
    .optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(50),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type ReservationQueryInput = z.infer<typeof reservationQuerySchema>;

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}
