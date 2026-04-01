import { Suspense } from "react";
import ConversationsClient from "../../../components/app/ConversationsClient";
import PageHeader from "../../../components/app/PageHeader";

export default function ConversationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        badge="Konversationen"
        title="Nachrichtenverlauf"
        description="Sieh dir den Verlauf aller Instagram-Konversationen an, inklusive Flow-Bezug, Status und extrahierten Datenpunkten."
      />

      <Suspense
        fallback={
          <div className="app-panel p-6 text-sm text-[#475569]">
            Konversationen werden geladen...
          </div>
        }
      >
        <ConversationsClient />
      </Suspense>
    </div>
  );
}
