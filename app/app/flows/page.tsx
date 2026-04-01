import Link from "next/link";
import FlowListClient from "../../../components/app/FlowListClient";
import PageHeader from "../../../components/app/PageHeader";
import { Plus } from "lucide-react";

export default function FlowsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        badge="Flows"
        title="Automationen verwalten"
        description="Öffne bestehende Flows, priorisiere aktive Automationen und lege neue Abläufe über Templates oder den Builder an."
        action={
          <Link
            href="/app/flows/new"
            className="inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-[#2450b2] px-8 py-3.5 text-base font-semibold text-white shadow-[0_2px_20px_rgba(36,80,178,0.3)] transition-all hover:bg-[#1a46c4]"
          >
            <Plus className="h-4 w-4" />
            Flow erstellen
          </Link>
        }
      />

      <FlowListClient variant="table" />
    </div>
  );
}
