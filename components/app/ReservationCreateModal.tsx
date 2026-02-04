'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function ReservationCreateModal({ onClose, onSuccess }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [guestName, setGuestName] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!guestName.trim()) {
      setError("Bitte geben Sie einen Gastnamen ein");
      setLoading(false);
      return;
    }
    if (!reservationDate) {
      setError("Bitte wählen Sie ein Datum");
      setLoading(false);
      return;
    }
    if (!reservationTime) {
      setError("Bitte wählen Sie eine Uhrzeit");
      setLoading(false);
      return;
    }
    if (!guestCount || parseInt(guestCount) < 1) {
      setError("Bitte geben Sie die Personenanzahl ein");
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
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
          guest_count: parseInt(guestCount),
          phone_number: phoneNumber.trim() || undefined,
          email: email.trim() || undefined,
          special_requests: specialRequests.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler beim Erstellen der Reservierung");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Neue Reservierung</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Guest Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Gastname <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Max Mustermann"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Datum <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                min={today}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Uhrzeit <span className="text-rose-400">*</span>
              </label>
              <input
                type="time"
                value={reservationTime}
                onChange={(e) => setReservationTime(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
                required
              />
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Personenanzahl <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              min="1"
              max="100"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
              required
            />
          </div>

          {/* Contact Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Telefon
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+49 123 456789"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                E-Mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gast@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Besondere Wünsche
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="z.B. Allergien, Kinderstuhl, Geburtstag..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:opacity-50"
            >
              {loading ? "Erstelle..." : "Reservierung erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
