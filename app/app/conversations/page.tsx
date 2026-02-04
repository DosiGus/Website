import { Suspense } from "react";
import ConversationsClient from "../../../components/app/ConversationsClient";
import { MessageCircle } from "lucide-react";

export default function ConversationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
          <MessageCircle className="h-3 w-3" />
          Konversationen
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Nachrichtenverlauf
        </h1>
        <p className="mt-1 text-zinc-400">
          Sieh dir den Verlauf aller Instagram-Konversationen an.
        </p>
      </div>
      <Suspense fallback={<div className="text-sm text-zinc-400">Wird geladen...</div>}>
        <ConversationsClient />
      </Suspense>
    </div>
  );
}
