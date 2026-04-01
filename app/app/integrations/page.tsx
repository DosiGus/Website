import { Suspense } from "react";
import IntegrationsClient from "../../../components/app/IntegrationsClient";
import PageHeader from "../../../components/app/PageHeader";

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        badge="Integrationen"
        title="Kanäle verbinden"
        description="Steuere, welche Plattformen Zugriff auf deine Flows haben, wohin Buchungen geschrieben werden und welche Follow-up-Aktionen aktiv sind."
      />

      <Suspense
        fallback={
          <div className="app-panel p-6 text-sm text-[#475569]">
            Integrationen werden geladen...
          </div>
        }
      >
        <IntegrationsClient />
      </Suspense>
    </div>
  );
}
