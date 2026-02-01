/**
 * TypeScript types for the Reservations system
 */

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type Reservation = {
  id: string;
  user_id: string;
  conversation_id: string | null;
  flow_id: string | null;
  guest_name: string;
  reservation_date: string; // ISO date: YYYY-MM-DD
  reservation_time: string; // HH:MM format
  guest_count: number;
  phone_number: string | null;
  email: string | null;
  special_requests: string | null;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  source: string;
  instagram_sender_id: string | null;
};

export type CreateReservationInput = {
  guest_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  phone_number?: string | null;
  email?: string | null;
  special_requests?: string | null;
  conversation_id?: string;
  flow_id?: string;
  instagram_sender_id?: string;
};

export type UpdateReservationInput = {
  guest_name?: string;
  reservation_date?: string;
  reservation_time?: string;
  guest_count?: number;
  phone_number?: string;
  email?: string;
  special_requests?: string;
  status?: ReservationStatus;
};

export type ReservationListResponse = {
  reservations: Reservation[];
  total: number;
  limit: number;
  offset: number;
};

export type ReservationFilters = {
  status?: ReservationStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
};
