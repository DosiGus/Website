'use client';

import { X, User, Calendar, Clock, Users, Phone, Mail, MessageSquare, Instagram, Edit3 } from "lucide-react";
import type { Reservation, ReservationStatus } from "../../lib/reservationTypes";

type StatusBadgeConfig = {
  label: string;
  bgClass: string;
  textClass: string;
};

const STATUS_CONFIG: Record<ReservationStatus, StatusBadgeConfig> = {
  pending: { label: "Ausstehend", bgClass: "bg-amber-100", textClass: "text-amber-700" },
  confirmed: { label: "Bestätigt", bgClass: "bg-emerald-100", textClass: "text-emerald-700" },
  cancelled: { label: "Storniert", bgClass: "bg-slate-200", textClass: "text-slate-600" },
  completed: { label: "Abgeschlossen", bgClass: "bg-blue-100", textClass: "text-blue-700" },
  no_show: { label: "Nicht erschienen", bgClass: "bg-rose-100", textClass: "text-rose-700" },
};

type Props = {
  reservation: Reservation;
  onClose: () => void;
};

export default function ReservationDetailModal({ reservation, onClose }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">Reservierungsdetails</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${statusConfig.bgClass} ${statusConfig.textClass}`}>
              {statusConfig.label}
            </span>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
              {getSourceIcon(reservation.source)}
              {getSourceLabel(reservation.source)}
            </div>
          </div>

          {/* Main Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Guest Name */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-100 p-2">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Gast</p>
                <p className="font-semibold text-slate-900">{reservation.guest_name}</p>
              </div>
            </div>

            {/* Guest Count */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-100 p-2">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Personen</p>
                <p className="font-semibold text-slate-900">{reservation.guest_count}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-100 p-2">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Datum</p>
                <p className="font-semibold text-slate-900">{formatDate(reservation.reservation_date)}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-100 p-2">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Uhrzeit</p>
                <p className="font-semibold text-slate-900">{reservation.reservation_time} Uhr</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {(reservation.phone_number || reservation.email) && (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kontaktdaten</p>
              <div className="space-y-2">
                {reservation.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <a
                      href={`tel:${reservation.phone_number}`}
                      className="text-sm font-medium text-brand hover:underline"
                    >
                      {reservation.phone_number}
                    </a>
                  </div>
                )}
                {reservation.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <a
                      href={`mailto:${reservation.email}`}
                      className="text-sm font-medium text-brand hover:underline"
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
            <div className="space-y-2 rounded-2xl bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-600" />
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Besondere Wünsche</p>
              </div>
              <p className="text-sm text-slate-700">{reservation.special_requests}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-400">
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
        <div className="border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
