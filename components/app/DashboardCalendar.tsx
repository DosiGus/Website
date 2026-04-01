'use client';

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import ReservationCalendar from "./ReservationCalendar";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import type { Reservation } from "../../lib/reservationTypes";

export default function DashboardCalendar() {
  const supabase = useRef(createSupabaseBrowserClient()).current;
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const handleRangeChange = useCallback(async (start: Date, end: Date) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setLoading(false); return; }

    const params = new URLSearchParams({
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
      limit: "500",
    });

    const res = await fetch(`/api/reservations?${params}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (reqId !== requestIdRef.current) return;

    if (res.ok) {
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : (data.data ?? []));
    }
    setLoading(false);
  }, [supabase]);

  const handleSelect = useCallback((r: Reservation) => {
    router.push(`/app/reservations?id=${r.id}`);
  }, [router]);

  return (
    <section className="app-panel">
      <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A]">Kalender</h2>
          <p className="mt-0.5 text-sm text-[#475569]">
            Bevorstehende Termine und Reservierungen auf einen Blick.
          </p>
        </div>
        <Link
          href="/app/reservations"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1E4FD8] transition-colors hover:text-[#1a46c4]"
        >
          Alle anzeigen
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="p-6">
        <ReservationCalendar
          reservations={reservations}
          loading={loading}
          onSelectReservation={handleSelect}
          onRangeChange={handleRangeChange}
        />
      </div>
    </section>
  );
}
