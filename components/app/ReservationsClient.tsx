'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FilterX,
  LayoutList,
  Plus,
  Search,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import type {
  Reservation,
  ReservationListResponse,
  ReservationStatus,
} from "../../lib/reservationTypes";
import ReservationCreateModal from "./ReservationCreateModal";
import ReservationDetailModal from "./ReservationDetailModal";
import ReservationCalendar, { toDateStr } from "./ReservationCalendar";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import DataTable, { type DataTableColumn } from "../ui/DataTable";
import EmptyState from "../ui/EmptyState";
import { getBookingLabels, type VerticalKey } from "../../lib/verticals";

type Props = {
  vertical?: VerticalKey | null;
};

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

const STATUS_OPTIONS: { value: ReservationStatus | "all"; label: string }[] = [
  { value: "all", label: "Alle Status" },
  { value: "pending", label: "Ausstehend" },
  { value: "confirmed", label: "Bestaetigt" },
  { value: "cancelled", label: "Storniert" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "no_show", label: "Nicht erschienen" },
];

const ITEMS_PER_PAGE = 20;

export default function ReservationsClient({ vertical }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const labels = getBookingLabels(vertical);

  const [userId, setUserId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all",
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [detailModalReservation, setDetailModalReservation] =
    useState<Reservation | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    confirmed: 0,
    guestsToday: 0,
  });

  const [pageView, setPageView] = useState<"calendar" | "list">("list");
  const [calReservations, setCalReservations] = useState<Reservation[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const calRequestIdRef = useRef(0);

  const lastStatusParamRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const lastFilterKeyRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

  useEffect(() => {
    const handleOpenCreate = () => setCreateModalOpen(true);
    window.addEventListener("wesponde:reservations:create", handleOpenCreate);
    return () =>
      window.removeEventListener(
        "wesponde:reservations:create",
        handleOpenCreate,
      );
  }, []);

  const loadReservations = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    const requestId = ++requestIdRef.current;

    const {
      data: { session },
    } = await supabase.auth.getSession();
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
        throw new Error(`Fehler beim Laden der ${labels.bookingPlural}`);
      }

      const data: ReservationListResponse = await response.json();
      if (requestId !== requestIdRef.current) return;
      setReservations(data.reservations);
      setTotal(data.total);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      if (requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!userId) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const today = new Date().toISOString().split("T")[0];

    try {
      const [todayResponse, pendingResponse, confirmedResponse] =
        await Promise.all([
          fetch(`/api/reservations?date=${today}&limit=200`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`/api/reservations?status=pending&limit=200`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch(`/api/reservations?status=confirmed&limit=200`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);

      const todayData: ReservationListResponse = todayResponse.ok
        ? await todayResponse.json()
        : { reservations: [], total: 0, limit: 200, offset: 0 };
      const pendingData: ReservationListResponse = pendingResponse.ok
        ? await pendingResponse.json()
        : { reservations: [], total: 0, limit: 200, offset: 0 };
      const confirmedData: ReservationListResponse = confirmedResponse.ok
        ? await confirmedResponse.json()
        : { reservations: [], total: 0, limit: 200, offset: 0 };

      setStats({
        today: todayData.total,
        pending: pendingData.total,
        confirmed: confirmedData.total,
        guestsToday: (todayData.reservations ?? []).reduce(
          (sum, reservation) => sum + reservation.guest_count,
          0,
        ),
      });
    } catch {
      // Stats load quietly; table state already covers primary UX.
    }
  };

  const filterKey = `${statusFilter}|${dateFrom}|${dateTo}`;

  useEffect(() => {
    if (!userId) return;
    if (lastFilterKeyRef.current !== filterKey && currentPage !== 1) {
      lastFilterKeyRef.current = filterKey;
      setCurrentPage(1);
      return;
    }
    lastFilterKeyRef.current = filterKey;
    loadReservations();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentPage, filterKey]);

  const filteredReservations = useMemo(() => {
    if (!searchQuery.trim()) return reservations;
    const query = searchQuery.toLowerCase();

    return reservations.filter((reservation) =>
      reservation.guest_name.toLowerCase().includes(query) ||
      (reservation.contacts?.display_name || "").toLowerCase().includes(query),
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const updateStatus = async (id: string, status: ReservationStatus) => {
    setPendingAction(id);
    setError(null);
    setNotice(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
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
          setNotice("Bewertungs-Flow wurde gesendet.");
        } else if (reviewStatus === "missing_review_url") {
          setNotice(
            "Kein Google-Bewertungslink hinterlegt. Bitte in Integrationen speichern.",
          );
        } else if (reviewStatus === "missing_sender") {
          setNotice(`Instagram-Kontakt fehlt (${labels.bookingSingular}).`);
        } else if (reviewStatus === "missing_integration") {
          setNotice(
            "Integration nicht verbunden. Bitte Meta oder Instagram verbinden.",
          );
        } else if (reviewStatus === "already_sent") {
          setNotice("Bewertungs-Flow wurde bereits gesendet.");
        } else {
          setNotice("Bewertungs-Flow konnte nicht gesendet werden.");
        }
      }

      await loadReservations();
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const deleteReservation = async (id: string) => {
    setPendingAction(id);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
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
        throw new Error("Fehler beim Loeschen");
      }

      setDeleteConfirmId(null);
      await loadReservations();
      await loadStats();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const loadCalendarReservations = useCallback(async (start: Date, end: Date) => {
    if (!userId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const reqId = ++calRequestIdRef.current;
    setCalLoading(true);

    const params = new URLSearchParams({
      dateFrom: toDateStr(start),
      dateTo: toDateStr(end),
      limit: "500",
    });

    try {
      const res = await fetch(`/api/reservations?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok || reqId !== calRequestIdRef.current) return;
      const data: ReservationListResponse = await res.json();
      if (reqId !== calRequestIdRef.current) return;
      setCalReservations(data.reservations);
    } catch {
      // silent
    } finally {
      if (reqId === calRequestIdRef.current) setCalLoading(false);
    }
  }, [userId, supabase]);

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    loadReservations();
    loadStats();
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const renderStatusBadge = (status: ReservationStatus) => {
    const config = STATUS_META[status];
    return <Badge variant={config.badgeVariant}>{config.label}</Badge>;
  };

  const renderActions = (reservation: Reservation) => {
    const isLoading = pendingAction === reservation.id;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {reservation.status === "pending" ? (
          <Button
            size="sm"
            variant="secondary"
            loading={isLoading}
            onClick={() => updateStatus(reservation.id, "confirmed")}
            className="border-[#BBF7D0] bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5]"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Bestaetigen
          </Button>
        ) : null}

        {reservation.status === "pending" ||
        reservation.status === "confirmed" ? (
          <Button
            size="sm"
            variant="secondary"
            loading={isLoading}
            onClick={() => updateStatus(reservation.id, "cancelled")}
            className="border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]"
          >
            <XCircle className="h-3.5 w-3.5" />
            Stornieren
          </Button>
        ) : null}

        {reservation.status === "confirmed" ? (
          <Button
            size="sm"
            variant="secondary"
            loading={isLoading}
            onClick={() => updateStatus(reservation.id, "completed")}
            className="border-[#BAE6FD] bg-[#F0F9FF] text-[#0369A1] hover:bg-[#E0F2FE]"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Abschliessen
          </Button>
        ) : null}

        {reservation.status === "confirmed" ? (
          <Button
            size="sm"
            variant="danger-outline"
            loading={isLoading}
            onClick={() => updateStatus(reservation.id, "no_show")}
            className="border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
          >
            <XCircle className="h-3.5 w-3.5" />
            No-Show
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDetailModalReservation(reservation)}
          className="text-[#475569] hover:bg-[#F0F4F9] hover:text-[#0F172A]"
        >
          <Eye className="h-3.5 w-3.5" />
          Details
        </Button>

        {deleteConfirmId === reservation.id ? (
          <>
            <Button
              size="sm"
              variant="danger"
              loading={isLoading}
              onClick={() => deleteReservation(reservation.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Jetzt loeschen
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDeleteConfirmId(null)}
            >
              Abbrechen
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="danger-outline"
            onClick={() => setDeleteConfirmId(reservation.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Loeschen
          </Button>
        )}
      </div>
    );
  };

  const columns: DataTableColumn<Reservation>[] = [
    {
      id: "contact",
      header: labels.contactLabel,
      sortValue: (reservation) => getReservationPrimaryName(reservation),
      render: (reservation) => (
        <div className="min-w-[180px]">
          <div className="font-medium text-[#0F172A]">
            {getReservationPrimaryName(reservation)}
          </div>
          {getReservationSecondaryName(reservation) ? (
            <div className="mt-1 text-xs text-[#64748B]">
              {getReservationSecondaryName(reservation)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: "date",
      header: "Datum",
      sortValue: (reservation) =>
        `${reservation.reservation_date} ${reservation.reservation_time}`,
      render: (reservation) => (
        <div>
          <div className="font-medium text-[#0F172A]">
            {formatDate(reservation.reservation_date)}
          </div>
          <div className="mt-1 text-xs text-[#64748B]">
            {reservation.reservation_time} Uhr
          </div>
        </div>
      ),
    },
    {
      id: "participants",
      header: labels.participantsLabel,
      align: "center",
      sortValue: (reservation) => reservation.guest_count,
      render: (reservation) => (
        <span
          className="font-medium text-[#0F172A]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {reservation.guest_count}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (reservation) => STATUS_META[reservation.status].label,
      render: (reservation) => renderStatusBadge(reservation.status),
    },
    {
      id: "actions",
      header: "Aktionen",
      render: (reservation) => renderActions(reservation),
      cellClassName: "min-w-[280px]",
    },
  ];

  const statCards = [
    {
      key: "today",
      label: "Heute",
      value: stats.today,
      description: `${labels.bookingPlural} fuer den heutigen Tag`,
      icon: CalendarDays,
      tone: "bg-[#DBEAFE] text-[#2563EB]",
    },
    {
      key: "pending",
      label: "Ausstehend",
      value: stats.pending,
      description: "Warten auf Bestaetigung",
      icon: Clock3,
      tone: "bg-[#FEF3C7] text-[#B45309]",
    },
    {
      key: "confirmed",
      label: "Bestaetigt",
      value: stats.confirmed,
      description: "Bereits verbindlich eingeplant",
      icon: CheckCircle2,
      tone: "bg-[#D1FAE5] text-[#047857]",
    },
    {
      key: "guestsToday",
      label: labels.participantsTodayLabel,
      value: stats.guestsToday,
      description: "Gesamtvolumen fuer heute",
      icon: Users,
      tone: "bg-[#E0F2FE] text-[#0369A1]",
    },
  ] as const;

  const hasActiveFilters =
    statusFilter !== "all" || Boolean(dateFrom) || Boolean(dateTo);

  return (
    <div className="space-y-6 app-page-enter">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="app-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-medium text-[#94A3B8]">
                    {item.label}
                  </p>
                  <p
                    className="mt-3 text-[28px] font-bold text-[#0F172A]"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {item.value.toLocaleString("de-DE")}
                  </p>
                </div>
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    item.tone,
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#475569]">
                {item.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* View toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-sm">
          <button
            onClick={() => setPageView("list")}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              pageView === "list"
                ? "bg-[#2450b2] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]",
            ].join(" ")}
          >
            <LayoutList className="h-4 w-4" />
            Liste
          </button>
          <button
            onClick={() => setPageView("calendar")}
            className={[
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              pageView === "calendar"
                ? "bg-[#2450b2] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]",
            ].join(" ")}
          >
            <CalendarDays className="h-4 w-4" />
            Kalender
          </button>
        </div>

        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {labels.bookingCreateAction}
        </Button>
      </div>

      {/* Calendar view */}
      {pageView === "calendar" && (
        <ReservationCalendar
          reservations={calReservations}
          loading={calLoading}
          onSelectReservation={setDetailModalReservation}
          onRangeChange={loadCalendarReservations}
        />
      )}

      {/* List view */}
      {pageView === "list" && (
      <section className="app-panel space-y-5 p-6">
        <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge variant="accent">Operations</Badge>
            <h2 className="mt-3 text-lg font-semibold text-[#0F172A]">
              {labels.bookingPlural} im Blick behalten
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[#475569]">
              Suche nach {labels.contactPlural.toLowerCase()}, filtere nach
              Status oder Zeitraum und bearbeite offene Vorgaenge direkt in der
              Tabelle.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.7fr))_auto]">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Suche
            </span>
            <span className="flex min-h-[42px] items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Search className="h-4 w-4 text-[#94A3B8]" />
              <input
                className="app-input min-h-0 border-0 bg-transparent p-0 shadow-none focus:border-0 focus:shadow-none"
                placeholder={labels.contactSearchPlaceholder}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </span>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ReservationStatus | "all")
              }
              className="app-select"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Von
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="app-input px-3 py-2 [color-scheme:light]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Bis
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="app-input px-3 py-2 [color-scheme:light]"
            />
          </label>

          <div className="flex items-end">
            <Button
              variant="secondary"
              disabled={!hasActiveFilters}
              onClick={() => {
                setStatusFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              <FilterX className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
            {notice}
          </div>
        ) : null}

        <div className="space-y-4">
          <DataTable
            data={filteredReservations}
            columns={columns}
            getRowKey={(reservation) => reservation.id}
            initialSort={{ columnId: "date", direction: "asc" }}
            loading={loading}
            skeletonRows={6}
            emptyState={
              <EmptyState
                icon={CalendarDays}
                title={`Keine ${labels.bookingPlural} gefunden`}
                description={`Sobald neue ${labels.bookingPlural.toLowerCase()} eingehen oder du manuell ${labels.bookingAccusativeArticle} anlegst, erscheinen sie hier.`}
                action={
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {labels.bookingCreateAction}
                  </Button>
                }
              />
            }
          />

          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#475569]">
                Seite <span className="font-semibold text-[#0F172A]">{currentPage}</span>{" "}
                von <span className="font-semibold text-[#0F172A]">{totalPages}</span>
                {" "}bei {total.toLocaleString("de-DE")} Eintraegen
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Zurueck
                </Button>
                <Button
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  Weiter
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      )}

      {detailModalReservation ? (
        <ReservationDetailModal
          reservation={detailModalReservation}
          labels={labels}
          onClose={() => setDetailModalReservation(null)}
        />
      ) : null}

      {createModalOpen ? (
        <ReservationCreateModal
          onClose={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
          labels={labels}
        />
      ) : null}
    </div>
  );
}
