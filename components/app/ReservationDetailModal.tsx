'use client';

import {
  Calendar,
  Clock3,
  Edit3,
  Instagram,
  Mail,
  MessageSquare,
  Phone,
  User,
  Users,
  X,
} from "lucide-react";
import type { Reservation, ReservationStatus } from "../../lib/reservationTypes";
import type { BookingLabels } from "../../lib/verticals";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

type StatusMeta = {
  label: string;
  badgeVariant: "warning" | "success" | "neutral" | "info" | "danger";
};

const STATUS_META: Record<ReservationStatus, StatusMeta> = {
  pending: { label: "Ausstehend", badgeVariant: "warning" },
  confirmed: { label: "Bestaetigt", badgeVariant: "success" },
  cancelled: { label: "Storniert", badgeVariant: "neutral" },
  completed: { label: "Abgeschlossen", badgeVariant: "info" },
  no_show: { label: "Nicht erschienen", badgeVariant: "danger" },
};

type Props = {
  reservation: Reservation;
  onClose: () => void;
  labels: BookingLabels;
};

export default function ReservationDetailModal({
  reservation,
  onClose,
  labels,
}: Props) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const contactName = reservation.contacts?.display_name;
  const statusMeta = STATUS_META[reservation.status];

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "instagram_dm":
        return "Instagram DM";
      case "manual":
        return "Manuell";
      default:
        return source;
    }
  };

  const SourceIcon =
    reservation.source === "instagram_dm" ? Instagram : Edit3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="app-slideover-enter w-full max-w-2xl overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <Badge variant="accent">Detail</Badge>
            <h2 className="mt-3 text-xl font-semibold text-[#0F172A]">
              {labels.bookingDetails}
            </h2>
            <p className="mt-1 text-sm text-[#475569]">
              Alle gespeicherten Informationen zu {labels.bookingAccusativeArticle}{" "}
              {labels.bookingSingular.toLowerCase()} auf einen Blick.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dialog schliessen"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={statusMeta.badgeVariant}>{statusMeta.label}</Badge>
            <span className="inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-[#64748B]">
              <SourceIcon className="h-3.5 w-3.5" />
              {getSourceLabel(reservation.source)}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB]">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    {labels.contactLabel}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                    {contactName || reservation.guest_name}
                  </p>
                  {contactName && contactName !== reservation.guest_name ? (
                    <p className="mt-1 text-xs text-[#64748B]">
                      {labels.bookingSingular}: {reservation.guest_name}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0369A1]">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    {labels.participantsLabel}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                    {reservation.guest_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#1D4ED8]">
                  <Calendar className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Datum
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                    {formatDate(reservation.reservation_date)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D1FAE5] text-[#047857]">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Uhrzeit
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                    {reservation.reservation_time} Uhr
                  </p>
                </div>
              </div>
            </div>
          </div>

          {reservation.phone_number || reservation.email ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Kontaktdaten
              </p>
              <div className="mt-4 space-y-3">
                {reservation.phone_number ? (
                  <a
                    href={`tel:${reservation.phone_number}`}
                    className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF]"
                  >
                    <Phone className="h-4 w-4 text-[#64748B]" />
                    {reservation.phone_number}
                  </a>
                ) : null}
                {reservation.email ? (
                  <a
                    href={`mailto:${reservation.email}`}
                    className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#BFDBFE] hover:bg-[#EFF6FF]"
                  >
                    <Mail className="h-4 w-4 text-[#64748B]" />
                    {reservation.email}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {reservation.special_requests ? (
            <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-5">
              <div className="flex items-center gap-2 text-[#B45309]">
                <MessageSquare className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-[0.08em]">
                  Besondere Wuensche
                </p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#92400E]">
                {reservation.special_requests}
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Zeitstempel
            </p>
            <div className="mt-4 grid gap-3 text-sm text-[#475569] sm:grid-cols-2">
              <div>
                <span className="block text-xs uppercase tracking-[0.08em] text-[#94A3B8]">
                  Erstellt
                </span>
                <span className="mt-1 block">{formatTimestamp(reservation.created_at)}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-[0.08em] text-[#94A3B8]">
                  Aktualisiert
                </span>
                <span className="mt-1 block">{formatTimestamp(reservation.updated_at)}</span>
              </div>
              {reservation.confirmed_at ? (
                <div>
                  <span className="block text-xs uppercase tracking-[0.08em] text-[#94A3B8]">
                    Bestaetigt
                  </span>
                  <span className="mt-1 block">{formatTimestamp(reservation.confirmed_at)}</span>
                </div>
              ) : null}
              {reservation.conversation_id ? (
                <div>
                  <span className="block text-xs uppercase tracking-[0.08em] text-[#94A3B8]">
                    Konversation
                  </span>
                  <span className="mt-1 block break-all">{reservation.conversation_id}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#E2E8F0] px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Schliessen
          </Button>
        </div>
      </div>
    </div>
  );
}
