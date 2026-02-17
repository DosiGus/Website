'use client';

import { X, User, Calendar, Clock, Users, Phone, Mail, MessageSquare, Instagram, Edit3 } from "lucide-react";
import type { Reservation, ReservationStatus } from "../../lib/reservationTypes";
import type { BookingLabels } from "../../lib/verticals";

type StatusBadgeConfig = {
  label: string;
  bgClass: string;
  textClass: string;
};

const STATUS_CONFIG: Record<ReservationStatus, StatusBadgeConfig> = {
  pending: { label: "Ausstehend", bgClass: "bg-amber-500/10", textClass: "text-amber-400" },
  confirmed: { label: "Bestätigt", bgClass: "bg-emerald-500/10", textClass: "text-emerald-400" },
  cancelled: { label: "Storniert", bgClass: "bg-zinc-500/10", textClass: "text-zinc-400" },
  completed: { label: "Abgeschlossen", bgClass: "bg-blue-500/10", textClass: "text-blue-400" },
  no_show: { label: "Nicht erschienen", bgClass: "bg-rose-500/10", textClass: "text-rose-400" },
};

type Props = {
  reservation: Reservation;
  onClose: () => void;
  labels: BookingLabels;
};

export default function ReservationDetailModal({ reservation, onClose, labels }: Props) {
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

  const statusConfig = STATUS_CONFIG[reservation.status];
  const contactName = reservation.contacts?.display_name;

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

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "instagram_dm":
        return <Instagram className="h-4 w-4" />;
      default:
        return <Edit3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">{labels.bookingDetails}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`rounded-lg px-4 py-2 text-sm font-medium ${statusConfig.bgClass} ${statusConfig.textClass}`}>
              {statusConfig.label}
            </span>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm text-zinc-300">
              {getSourceIcon(reservation.source)}
              {getSourceLabel(reservation.source)}
            </div>
          </div>

          {/* Main Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Guest Name */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-violet-500/10 p-2">
                <User className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">{labels.contactLabel}</p>
                <p className="font-medium text-white">{contactName || reservation.guest_name}</p>
                {contactName && contactName !== reservation.guest_name && (
                  <p className="text-xs text-zinc-500">
                    {labels.bookingSingular}: {reservation.guest_name}
                  </p>
                )}
              </div>
            </div>

            {/* Guest Count */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-indigo-500/10 p-2">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">{labels.participantsLabel}</p>
                <p className="font-medium text-white">{reservation.guest_count}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Datum</p>
                <p className="font-medium text-white">{formatDate(reservation.reservation_date)}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2">
                <Clock className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500">Uhrzeit</p>
                <p className="font-medium text-white">{reservation.reservation_time} Uhr</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {(reservation.phone_number || reservation.email) && (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Kontaktdaten</p>
              <div className="space-y-2">
                {reservation.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-zinc-500" />
                    <a
                      href={`tel:${reservation.phone_number}`}
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      {reservation.phone_number}
                    </a>
                  </div>
                )}
                {reservation.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-zinc-500" />
                    <a
                      href={`mailto:${reservation.email}`}
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
                    >
                      {reservation.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Requests */}
          {reservation.special_requests && (
            <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-400" />
                <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Besondere Wünsche</p>
              </div>
              <p className="text-sm text-zinc-300">{reservation.special_requests}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-2 border-t border-white/10 pt-4 text-xs text-zinc-500">
            <p>Erstellt: {formatTimestamp(reservation.created_at)}</p>
            <p>Aktualisiert: {formatTimestamp(reservation.updated_at)}</p>
            {reservation.confirmed_at && (
              <p>Bestätigt: {formatTimestamp(reservation.confirmed_at)}</p>
            )}
            {reservation.conversation_id && (
              <p>Konversation: {reservation.conversation_id}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white/10 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
