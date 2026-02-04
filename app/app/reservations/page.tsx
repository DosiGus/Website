import ReservationsClient from "../../../components/app/ReservationsClient";
import { CalendarCheck } from "lucide-react";

export default function ReservationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
          <CalendarCheck className="h-3 w-3" />
          Reservierungen
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Reservierungen verwalten
        </h1>
        <p className="mt-1 text-zinc-400">
          Alle Reservierungen aus Instagram DM Automationen und manuelle Einträge.
        </p>
      </div>

      <ReservationsClient />
    </div>
  );
}
