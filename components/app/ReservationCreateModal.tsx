'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, Mail, Phone, Users, User, X } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import type { BookingLabels } from "../../lib/verticals";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  labels: BookingLabels;
};

export default function ReservationCreateModal({
  onClose,
  onSuccess,
  labels,
}: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const emailPlaceholder =
    labels.contactLabel === "Gast" ? "gast@example.com" : "kunde@example.com";
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!guestName.trim()) {
      setError("Bitte gib einen Namen ein.");
      setLoading(false);
      return;
    }
    if (!reservationDate) {
      setError("Bitte waehle ein Datum.");
      setLoading(false);
      return;
    }
    if (!reservationTime) {
      setError("Bitte waehle eine Uhrzeit.");
      setLoading(false);
      return;
    }
    if (!guestCount || Number.parseInt(guestCount, 10) < 1) {
      setError(`Bitte gib die ${labels.participantsCountLabel} an.`);
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          guest_name: guestName.trim(),
          reservation_date: reservationDate,
          reservation_time: reservationTime,
          guest_count: Number.parseInt(guestCount, 10),
          phone_number: phoneNumber.trim() || undefined,
          email: email.trim() || undefined,
          special_requests: specialRequests.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler beim Erstellen.");
      }

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="app-slideover-enter w-full max-w-2xl overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <Badge variant="accent">Neu</Badge>
            <h2 className="mt-3 text-xl font-semibold text-[#0F172A]">
              {labels.bookingCreateTitle}
            </h2>
            <p className="mt-1 text-sm text-[#475569]">
              Lege {labels.bookingAccusativeArticle}{" "}
              {labels.bookingSingular.toLowerCase()} manuell an und halte den
              Status spaeter direkt in der Tabelle aktuell.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dialog schliessen"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                {labels.contactNameLabel}
              </span>
              <span className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <User className="h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  placeholder="Max Mustermann"
                  className="app-input min-h-[46px] border-0 bg-transparent px-0 py-0 shadow-none focus:border-0 focus:shadow-none"
                  required
                />
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Datum
              </span>
              <span className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <CalendarDays className="h-4 w-4 text-[#94A3B8]" />
                <input
                  type="date"
                  value={reservationDate}
                  onChange={(event) => setReservationDate(event.target.value)}
                  min={today}
                  className="app-input min-h-[46px] border-0 bg-transparent px-0 py-0 shadow-none focus:border-0 focus:shadow-none [color-scheme:light]"
                  required
                />
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Uhrzeit
              </span>
              <span className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Clock3 className="h-4 w-4 text-[#94A3B8]" />
                <input
                  type="time"
                  value={reservationTime}
                  onChange={(event) => setReservationTime(event.target.value)}
                  className="app-input min-h-[46px] border-0 bg-transparent px-0 py-0 shadow-none focus:border-0 focus:shadow-none [color-scheme:light]"
                  required
                />
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                {labels.participantsCountLabel}
              </span>
              <span className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Users className="h-4 w-4 text-[#94A3B8]" />
                <input
                  type="number"
                  value={guestCount}
                  onChange={(event) => setGuestCount(event.target.value)}
                  min="1"
                  max="100"
                  className="app-input min-h-[46px] border-0 bg-transparent px-0 py-0 shadow-none focus:border-0 focus:shadow-none"
                  required
                />
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Telefon
              </span>
              <span className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Phone className="h-4 w-4 text-[#94A3B8]" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+49 123 456789"
                  className="app-input min-h-[46px] border-0 bg-transparent px-0 py-0 shadow-none focus:border-0 focus:shadow-none"
                />
              </span>
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                E-Mail
              </span>
              <span className="flex items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <Mail className="h-4 w-4 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={emailPlaceholder}
                  className="app-input min-h-[46px] border-0 bg-transparent px-0 py-0 shadow-none focus:border-0 focus:shadow-none"
                />
              </span>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Besondere Wuensche
            </span>
            <textarea
              value={specialRequests}
              onChange={(event) => setSpecialRequests(event.target.value)}
              placeholder="z. B. Hinweise, Ziele oder Allergien"
              rows={4}
              className="app-input min-h-[120px] resize-none px-4 py-3"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" loading={loading}>
              {labels.bookingCreateAction}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
