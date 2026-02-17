'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import type { Reservation, ReservationStatus, ReservationListResponse } from "../../lib/reservationTypes";
import ReservationDetailModal from "./ReservationDetailModal";
import ReservationCreateModal from "./ReservationCreateModal";
import { getBookingLabels, type VerticalKey } from "../../lib/verticals";

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

const STATUS_OPTIONS: { value: ReservationStatus | "all"; label: string }[] = [
  { value: "all", label: "Status filtern" },
  { value: "pending", label: "Ausstehend" },
  { value: "confirmed", label: "Bestätigt" },
  { value: "cancelled", label: "Storniert" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "no_show", label: "Nicht erschienen" },
];

const ITEMS_PER_PAGE = 20;

type Props = {
  vertical?: VerticalKey | null;
};

export default function ReservationsClient({ vertical }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const labels = getBookingLabels(vertical);
  const bookingPluralLower = labels.bookingPlural.toLowerCase();

  const [userId, setUserId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [detailModalReservation, setDetailModalReservation] = useState<Reservation | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Pending action state
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const lastStatusParamRef = useRef<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    confirmed: 0,
    guestsToday: 0,
  });

  // Load user
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
    }
    loadUser();
  }, [supabase, router]);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === lastStatusParamRef.current) return;
    lastStatusParamRef.current = statusParam;

    if (!statusParam) {
      setStatusFilter("all");
      return;
    }

    const normalized = statusParam.toLowerCase();
    const allowed: ReservationStatus[] = [
      "pending",
      "confirmed",
      "cancelled",
      "completed",
      "no_show",
    ];

    if (allowed.includes(normalized as ReservationStatus)) {
      setStatusFilter(normalized as ReservationStatus);
    }
  }, [searchParams]);

  // Load reservations
  const loadReservations = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }

    const params = new URLSearchParams();
    params.set("limit", ITEMS_PER_PAGE.toString());
    params.set("offset", ((currentPage - 1) * ITEMS_PER_PAGE).toString());

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    }
    if (dateTo) {
      params.set("dateTo", dateTo);
    }

    try {
      const response = await fetch(`/api/reservations?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Laden der ${bookingPluralLower}`);
      }

      const data: ReservationListResponse = await response.json();
      setReservations(data.reservations);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    if (!userId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const today = new Date().toISOString().split("T")[0];

    try {
      // Get today's reservations
      const todayResponse = await fetch(`/api/reservations?date=${today}&limit=1000`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const todayData: ReservationListResponse = await todayResponse.json();

      // Get pending reservations
      const pendingResponse = await fetch(`/api/reservations?status=pending&limit=1000`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const pendingData: ReservationListResponse = await pendingResponse.json();

      // Get confirmed reservations
      const confirmedResponse = await fetch(`/api/reservations?status=confirmed&limit=1000`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const confirmedData: ReservationListResponse = await confirmedResponse.json();

      setStats({
        today: todayData.total,
        pending: pendingData.total,
        confirmed: confirmedData.total,
        guestsToday: todayData.reservations.reduce((sum, r) => sum + r.guest_count, 0),
      });
    } catch {
      // Stats loading failed silently
    }
  };

  useEffect(() => {
    loadReservations();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentPage, statusFilter, dateFrom, dateTo]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFrom, dateTo]);

  // Client-side search filter
  const filteredReservations = useMemo(() => {
    if (!searchQuery) return reservations;
    const query = searchQuery.toLowerCase();
    return reservations.filter((r) =>
      r.guest_name.toLowerCase().includes(query) ||
      (r.contacts?.display_name || "").toLowerCase().includes(query)
    );
  }, [reservations, searchQuery]);

  const getReservationPrimaryName = (reservation: Reservation) =>
    reservation.contacts?.display_name || reservation.guest_name;

  const getReservationSecondaryName = (reservation: Reservation) => {
    const contactName = reservation.contacts?.display_name;
    if (contactName && contactName !== reservation.guest_name) {
      return `${labels.bookingSingular}: ${reservation.guest_name}`;
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Update reservation status
  const updateStatus = async (id: string, status: ReservationStatus) => {
    setPendingAction(id);
    setError(null);
    setNotice(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Fehler beim Aktualisieren");
      }

      if (status === "completed" && payload?.review) {
        const reviewStatus = payload.review.status as string | undefined;
        if (payload.review.success) {
          setNotice(`✅ Bewertungs-Flow wurde an den ${labels.contactLabel.toLowerCase()} gesendet.`);
        } else if (reviewStatus === "missing_review_url") {
          setNotice("⚠️ Kein Google-Bewertungslink hinterlegt. Bitte in Integrationen speichern.");
        } else if (reviewStatus === "missing_sender") {
          setNotice(`⚠️ Diese ${labels.bookingSingular.toLowerCase()} hat keinen Instagram-Kontakt (nur IG-Reservierungen).`);
        } else if (reviewStatus === "missing_integration") {
          setNotice("⚠️ Integration nicht verbunden. Bitte Meta/Instagram verbinden.");
        } else if (reviewStatus === "already_sent") {
          setNotice("ℹ️ Bewertungs-Flow wurde bereits gesendet.");
        } else {
          setNotice("⚠️ Bewertungs-Flow konnte nicht gesendet werden.");
        }
      }

      await loadReservations();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setPendingAction(null);
    }
  };

  // Delete reservation
  const deleteReservation = async (id: string) => {
    setPendingAction(id);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(`/api/reservations?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Fehler beim Löschen");
      }

      setDeleteConfirmId(null);
      await loadReservations();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setPendingAction(null);
    }
  };

  // Handle create success
  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    loadReservations();
    loadStats();
  };

  // Pagination
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Render status badge
  const renderStatusBadge = (status: ReservationStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config.bgClass} ${config.textClass}`}>
        {config.label}
      </span>
    );
  };

  // Render action buttons
  const renderActions = (reservation: Reservation) => {
    const isLoading = pendingAction === reservation.id;

    return (
      <div className="flex flex-wrap gap-2">
        {/* Confirm button - show for pending */}
        {reservation.status === "pending" && (
          <button
            onClick={() => updateStatus(reservation.id, "confirmed")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3 w-3" />
            Bestätigen
          </button>
        )}

        {/* Cancel button - show for pending or confirmed */}
        {(reservation.status === "pending" || reservation.status === "confirmed") && (
          <button
            onClick={() => updateStatus(reservation.id, "cancelled")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <XCircle className="h-3 w-3" />
            Stornieren
          </button>
        )}

        {/* Complete button - show for confirmed */}
        {reservation.status === "confirmed" && (
          <button
            onClick={() => updateStatus(reservation.id, "completed")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
          >
            <CheckCircle2 className="h-3 w-3" />
            Abschließen
          </button>
        )}

        {/* No-show button - show for confirmed */}
        {reservation.status === "confirmed" && (
          <button
            onClick={() => updateStatus(reservation.id, "no_show")}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
          >
            <XCircle className="h-3 w-3" />
            Nicht erschienen
          </button>
        )}

        {/* Details button - always show */}
        <button
          onClick={() => setDetailModalReservation(reservation)}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10"
        >
          <Eye className="h-3 w-3" />
          Details
        </button>

        {/* Delete button - always show */}
        {deleteConfirmId === reservation.id ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => deleteReservation(reservation.id)}
              disabled={isLoading}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
            >
              {isLoading ? "Lösche..." : "Ja, löschen"}
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirmId(reservation.id)}
            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/20"
          >
            <Trash2 className="h-3 w-3" />
            Löschen
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl transition-all group-hover:bg-blue-500/30" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.today}</p>
              <p className="text-sm text-zinc-400">Heute</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl transition-all group-hover:bg-amber-500/30" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-sm text-zinc-400">Ausstehend</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl transition-all group-hover:bg-emerald-500/30" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
              <p className="text-sm text-zinc-400">Bestätigt</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl transition-all group-hover:bg-violet-500/30" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.guestsToday}</p>
              <p className="text-sm text-zinc-400">{labels.participantsTodayLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
        >
          <Plus className="h-4 w-4" />
          {labels.bookingCreateAction}
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <input
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              placeholder={labels.contactSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | "all")}
            className="app-select"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Date From */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Von:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Bis:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none [color-scheme:dark]"
            />
          </div>

          {/* Clear Filters */}
          {(statusFilter !== "all" || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="text-sm font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-400">
          {notice}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl">
        {loading ? (
          <div className="p-6 text-sm text-zinc-400">
            {labels.bookingPlural} werden geladen...
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-6 text-sm text-zinc-400">
            Keine {bookingPluralLower} gefunden.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-zinc-400">{labels.contactLabel}</th>
                    <th className="px-6 py-3 text-left font-semibold text-zinc-400">Datum</th>
                    <th className="px-6 py-3 text-left font-semibold text-zinc-400">Uhrzeit</th>
                    <th className="px-6 py-3 text-left font-semibold text-zinc-400">{labels.participantsLabel}</th>
                    <th className="px-6 py-3 text-left font-semibold text-zinc-400">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-zinc-400">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="transition-colors hover:bg-white/5">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-white">
                        <div>{getReservationPrimaryName(reservation)}</div>
                        {getReservationSecondaryName(reservation) && (
                          <div className="text-xs text-zinc-500">
                            {getReservationSecondaryName(reservation)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {formatDate(reservation.reservation_date)}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {reservation.reservation_time}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {reservation.guest_count}
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(reservation.status)}
                      </td>
                      <td className="px-6 py-4">
                        {renderActions(reservation)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-6 py-3">
                <p className="text-sm text-zinc-400">
                  Seite {currentPage} von {totalPages} ({total} Einträge)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Zurück
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50"
                  >
                    Weiter
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {detailModalReservation && (
        <ReservationDetailModal
          reservation={detailModalReservation}
          labels={labels}
          onClose={() => setDetailModalReservation(null)}
        />
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <ReservationCreateModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          labels={labels}
        />
      )}
    </div>
  );
}
