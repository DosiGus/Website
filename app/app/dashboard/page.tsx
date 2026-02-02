import Link from "next/link";
import FlowListClient from "../../../components/app/FlowListClient";
import DashboardStats from "../../../components/app/DashboardStats";
import TokenExpiryAlert from "../../../components/app/TokenExpiryAlert";

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <TokenExpiryAlert />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Dashboard</p>
          <h1 className="text-3xl font-semibold">Willkommen zurück!</h1>
          <p className="text-slate-500">
            Überwache deine Flow-Performance und starte neue Automationen.
          </p>
        </div>
        <Link
          href="/app/flows/new"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30"
        >
          Neuen Flow erstellen
        </Link>
      </div>

      <DashboardStats />

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Deine Flows</h2>
            <p className="text-sm text-slate-500">
              Übersicht über die zuletzt bearbeiteten Automationen.
            </p>
          </div>
          <Link
            href="/app/flows"
            className="text-sm font-semibold text-brand-dark hover:text-brand"
          >
            Alle anzeigen →
          </Link>
        </div>
        <FlowListClient variant="grid" />
      </section>
    </div>
  );
}
