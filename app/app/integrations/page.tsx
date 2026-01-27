import { Suspense } from "react";
import IntegrationsClient from "../../../components/app/IntegrationsClient";

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Integrationen</p>
        <h1 className="text-3xl font-semibold">Kanäle verbinden</h1>
        <p className="text-slate-500">
          Steuere, welche Plattformen Zugriff auf deine Flows haben.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-400">Integrationen werden geladen…</div>}>
        <IntegrationsClient />
      </Suspense>
    </div>
  );
}
