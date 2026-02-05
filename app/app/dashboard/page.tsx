import Link from "next/link";
import FlowListClient from "../../../components/app/FlowListClient";
import DashboardStats from "../../../components/app/DashboardStats";
import TokenExpiryAlert from "../../../components/app/TokenExpiryAlert";
import { ArrowRight, Plus, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <TokenExpiryAlert />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <Sparkles className="h-3 w-3" />
            Dashboard
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Willkommen zurück!
          </h1>
          <p className="mt-1 text-zinc-400">
            Überwache deine Flow-Performance und starte neue Automationen.
          </p>
        </div>
        <Link
          href="/app/flows/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
        >
          <Plus className="h-4 w-4" />
          Neuen Flow erstellen
        </Link>
      </div>

      {/* Stats */}
      <DashboardStats />

      {/* Flows Section */}
      <section className="space-y-6 rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Deine aktiven Flows</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Übersicht über deine aktiven Automationen.
            </p>
          </div>
          <Link
            href="/app/flows"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
          >
            Alle anzeigen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <FlowListClient variant="grid" statusFilterOverride="Aktiv" showReservationCounts />
      </section>
    </div>
  );
}
