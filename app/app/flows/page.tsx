import Link from "next/link";
import FlowListClient from "../../../components/app/FlowListClient";

export default function FlowsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Flows</p>
          <h1 className="text-3xl font-semibold">Automationen verwalten</h1>
          <p className="text-slate-500">
            Öffne bestehende Flows oder lege eine neue Konversation an.
          </p>
        </div>
        <Link
          href="/app/flows/new"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/30"
        >
          + Flow erstellen
        </Link>
      </div>

      <FlowListClient variant="table" />
    </div>
  );
}
