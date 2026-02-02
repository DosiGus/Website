'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

const STATUS_OPTIONS: { value: ReservationStatus | "all"; label: string }[] = [
  { value: "all", label: "Alle Status" },
  { value: "pending", label: "Ausstehend" },
  { value: "confirmed", label: "Bestätigt" },
  { value: "cancelled", label: "Storniert" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "no_show", label: "Nicht erschienen" },
];

const ITEMS_PER_PAGE = 20;

export default function ReservationsClient() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

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
        throw new Error("Fehler beim Laden der Reservierungen");
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
      r.guest_name.toLowerCase().includes(query)
    );
  }, [reservations, searchQuery]);

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
          setNotice("✅ Bewertungs-Flow wurde an den Gast gesendet.");
        } else if (reviewStatus === "missing_review_url") {
          setNotice("⚠️ Kein Google-Bewertungslink hinterlegt. Bitte in Integrationen speichern.");
        } else if (reviewStatus === "missing_sender") {
          setNotice("⚠️ Diese Reservierung hat keinen Instagram-Kontakt (nur IG-Reservierungen).");
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
            className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
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
            className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
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
            className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
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
            className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            <XCircle className="h-3 w-3" />
            Nicht erschienen
          </button>
        )}

        {/* Details button - always show */}
        <button
          onClick={() => setDetailModalReservation(reservation)}
          className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
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
              className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {isLoading ? "Lösche..." : "Ja, löschen"}
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirmId(reservation.id)}
            className="flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.today}</p>
              <p className="text-sm text-slate-500">Heute</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              <p className="text-sm text-slate-500">Ausstehend</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.confirmed}</p>
              <p className="text-sm text-slate-500">Bestätigt</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-purple-100 p-3">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.guestsToday}</p>
              <p className="text-sm text-slate-500">Gäste heute</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand/30"
        >
          <Plus className="h-4 w-4" />
          Reservierung erstellen
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 px-4 py-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <input
              className="w-full text-sm text-slate-600 focus:outline-none"
              placeholder="Gastname suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | "all")}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 focus:border-brand focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Date From */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Von:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 focus:border-brand focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Bis:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 focus:border-brand focus:outline-none"
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
              className="text-sm font-semibold text-brand hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {notice}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">
            Reservierungen werden geladen...
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            Keine Reservierungen gefunden.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Gast</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Datum</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Uhrzeit</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Personen</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-500">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                        {reservation.guest_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(reservation.reservation_date)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {reservation.reservation_time}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
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
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
                <p className="text-sm text-slate-500">
                  Seite {currentPage} von {totalPages} ({total} Einträge)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Zurück
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
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
          onClose={() => setDetailModalReservation(null)}
        />
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <ReservationCreateModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
