import { Suspense } from "react";
import ConversationsClient from "../../../components/app/ConversationsClient";

export default function ConversationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Konversationen</p>
        <h1 className="text-3xl font-semibold">Nachrichtenverlauf</h1>
        <p className="text-slate-500">
          Sieh dir den Verlauf aller Instagram-Konversationen an.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-400">Wird geladen...</div>}>
        <ConversationsClient />
      </Suspense>
    </div>
  );
}
