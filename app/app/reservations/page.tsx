import ReservationsClient from "../../../components/app/ReservationsClient";

export default function ReservationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Reservierungen</p>
        <h1 className="text-3xl font-semibold">Reservierungen verwalten</h1>
        <p className="text-slate-500">
          Alle Reservierungen aus Instagram DM Automationen und manuelle Einträge.
        </p>
      </div>

      <ReservationsClient />
    </div>
  );
}
