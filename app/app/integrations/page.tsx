import { Suspense } from "react";
import IntegrationsClient from "../../../components/app/IntegrationsClient";
import { Plug } from "lucide-react";

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <Plug className="h-3 w-3" />
          Integrationen
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Kanäle verbinden
        </h1>
        <p className="mt-1 text-zinc-400">
          Steuere, welche Plattformen Zugriff auf deine Flows haben.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-zinc-400">Integrationen werden geladen…</div>}>
        <IntegrationsClient />
      </Suspense>
    </div>
  );
}
