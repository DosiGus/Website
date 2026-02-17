"use client";

import ReservationsClient from "../../../components/app/ReservationsClient";
import { CalendarCheck } from "lucide-react";
import { getBookingLabels } from "../../../lib/verticals";
import useAccountVertical from "../../../lib/useAccountVertical";

export default function ReservationsPage() {
  const { vertical } = useAccountVertical();

  const labels = getBookingLabels(vertical);

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
          <CalendarCheck className="h-3 w-3" />
          {labels.bookingPlural}
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {labels.bookingPlural} verwalten
        </h1>
        <p className="mt-1 text-zinc-400">
          Alle {labels.bookingPlural} aus Instagram DM Automationen und manuelle Einträge.
        </p>
      </div>

      <ReservationsClient vertical={vertical} />
    </div>
  );
}
