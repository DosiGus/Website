import Link from "next/link";
import FlowListClient from "../../../components/app/FlowListClient";
import { Plus, Workflow } from "lucide-react";

export default function FlowsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
            <Workflow className="h-3 w-3" />
            Flows
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Automationen verwalten
          </h1>
          <p className="mt-1 text-zinc-400">
            Öffne bestehende Flows oder lege eine neue Konversation an.
          </p>
        </div>
        <Link
          href="/app/flows/new"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
        >
          <Plus className="h-4 w-4" />
          Flow erstellen
        </Link>
      </div>

      <FlowListClient variant="table" />
    </div>
  );
}
