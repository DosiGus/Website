"use client";

import ReservationsClient from "../../../components/app/ReservationsClient";
import PageHeader from "../../../components/app/PageHeader";
import Button from "../../../components/ui/Button";
import { ArrowUpRight, Plus } from "lucide-react";
import { getBookingLabels } from "../../../lib/verticals";
import useAccountVertical from "../../../lib/useAccountVertical";
import Link from "next/link";

export default function ReservationsPage() {
  const { vertical } = useAccountVertical();
  const labels = getBookingLabels(vertical);

  return (
    <div className="space-y-8">
      <PageHeader
        badge={labels.bookingPlural}
        title={`${labels.bookingPlural} verwalten`}
        description={`Alle ${labels.bookingPlural.toLowerCase()} aus Instagram-DMs und manuellen Einträgen. Offene Vorgänge lassen sich direkt im Arbeitsbereich bestätigen oder abschließen.`}
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app/dashboard"
              className="inline-flex min-h-[52px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-[#2a4ea7]/20 bg-white/70 px-8 py-3.5 text-base font-medium text-[#171923] transition-all hover:bg-white"
            >
              Zum Dashboard
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Button
              size="lg"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("wesponde:reservations:create"))
              }
            >
              <Plus className="h-4 w-4" />
              {labels.bookingCreateAction}
            </Button>
          </div>
        }
      />

      <ReservationsClient vertical={vertical} />
    </div>
  );
}
