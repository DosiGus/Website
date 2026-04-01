"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  Link as LinkIcon,
  Wifi,
  WifiOff,
  Star,
  ExternalLink,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import type { IntegrationStatus } from "../../lib/meta/types";
import { getBookingLabels } from "../../lib/verticals";
import useAccountVertical from "../../lib/useAccountVertical";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

type IntegrationsResponse = {
  integrations: IntegrationStatus[];
};

type GoogleCalendarOption = {
  id: string;
  summary: string;
  timeZone: string | null;
  primary: boolean;
};

type SectionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function SectionCard({
  icon,
  title,
  description,
  badge,
  open,
  onToggle,
  children,
}: SectionCardProps) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <button
        type="button"
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#F8FAFC]"
        onClick={onToggle}
      >
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#0F172A]">
            {title}
          </span>
          <span className="mt-1 block text-xs text-[#64748B]">
            {description}
          </span>
        </span>
        {badge ? <span className="shrink-0">{badge}</span> : null}
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-[#94A3B8] transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      {open ? <div className="border-t border-[#E2E8F0] px-5 py-5">{children}</div> : null}
    </section>
  );
}

export default function IntegrationsClient() {
  const searchParams = useSearchParams();
  const { vertical } = useAccountVertical();
  const labels = useMemo(() => getBookingLabels(vertical), [vertical]);
  const testBookingLabel = useMemo(
    () => `Test${labels.bookingSingular.toLowerCase()}`,
    [labels.bookingSingular],
  );
  const [metaIntegration, setMetaIntegration] = useState<IntegrationStatus | null>(null);
  const [googleIntegration, setGoogleIntegration] = useState<IntegrationStatus | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleDisconnecting, setGoogleDisconnecting] = useState(false);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarOption[]>([]);
  const [googleCalendarId, setGoogleCalendarId] = useState<string | null>(null);
  const [googleCalendarTimeZone, setGoogleCalendarTimeZone] = useState<string | null>(null);
  const [googleCalendarSaving, setGoogleCalendarSaving] = useState(false);
  const [googleCalendarNotice, setGoogleCalendarNotice] = useState<string | null>(null);
  const [googleCalendarsLoading, setGoogleCalendarsLoading] = useState(false);
  const [reviewUrl, setReviewUrl] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [googleTestStatus, setGoogleTestStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [googleTestMessage, setGoogleTestMessage] = useState<string | null>(null);

  const successParam = useMemo(() => searchParams?.get("success"), [searchParams]);
  const providerParam = useMemo(() => searchParams?.get("provider"), [searchParams]);
  const accountParam = useMemo(() => searchParams?.get("account"), [searchParams]);
  const errorParam = useMemo(() => searchParams?.get("error"), [searchParams]);
  const autoRetryParam = useMemo(() => searchParams?.get("auto_retry"), [searchParams]);

  const getAccessToken = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const metaConnected = metaIntegration?.status === "connected";
  const googleConnected = googleIntegration?.status === "connected";
  const showMetaSuccess = successParam === "true" && (providerParam === "meta" || !providerParam);
  const showGoogleSuccess = successParam === "true" && providerParam === "google";
  const showMetaError = Boolean(errorParam) && (providerParam === "meta" || !providerParam);
  const showGoogleError = Boolean(errorParam) && providerParam === "google";

  const [oauthResolved, setOauthResolved] = useState(false);
  useEffect(() => {
    if (!errorParam || oauthResolved || metaConnected || providerParam === "google") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 5;

    const pollStatus = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (cancelled) return;

        try {
          const token = await getAccessToken();
          if (!token) return;

          const response = await fetch("/api/integrations", {
            headers: { authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const payload = (await response.json()) as { integrations: IntegrationStatus[] };
            const meta = payload.integrations.find((i) => i.provider === "meta");
            if (meta?.status === "connected") {
              setMetaIntegration(meta);
              setOauthResolved(true);
              return;
            }
          }
        } catch {
          // Ignore polling errors
        }
      }
    };

    pollStatus();
    return () => {
      cancelled = true;
    };
  }, [errorParam, oauthResolved, metaConnected, providerParam, getAccessToken]);

  const loadStatus = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);
      setGoogleError(null);
      const token = await getAccessToken();
      if (!token) {
        setError("Bitte erneut anmelden, um Integrationen zu laden.");
        setStatus("ready");
        return;
      }
      const response = await fetch("/api/integrations", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError("Status konnte nicht geladen werden.");
        setMetaIntegration(null);
        return;
      }
      const payload = (await response.json()) as IntegrationsResponse;
      const meta = payload.integrations.find((i) => i.provider === "meta") ?? null;
      const google = payload.integrations.find((i) => i.provider === "google_calendar") ?? null;
      if (meta && meta.status !== "connected") {
        setMetaIntegration({ ...meta, status: "disconnected" });
      } else {
        setMetaIntegration(meta);
      }
      if (google && google.status !== "connected") {
        setGoogleIntegration({ ...google, status: "disconnected" });
      } else {
        setGoogleIntegration(google);
      }
    } catch {
      setError("Status konnte nicht geladen werden.");
    } finally {
      setStatus("ready");
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    setReviewUrl(metaIntegration?.google_review_url ?? "");
    setReviewSaved(false);
    setReviewError(null);
  }, [metaIntegration?.google_review_url]);

  useEffect(() => {
    setGoogleCalendarId(googleIntegration?.calendar_id ?? null);
    setGoogleCalendarTimeZone(googleIntegration?.calendar_time_zone ?? null);
  }, [googleIntegration?.calendar_id, googleIntegration?.calendar_time_zone]);

  // Auto-retry: after FLB permissions were revoked, automatically start fresh OAuth
  const [autoRetryDone, setAutoRetryDone] = useState(false);
  useEffect(() => {
    if (autoRetryParam !== "true" || autoRetryDone || status !== "ready") return;
    setAutoRetryDone(true);
    // Small delay to let the page render, then auto-start OAuth
    const timer = setTimeout(() => {
      // Trigger the connect flow programmatically
      (async () => {
        try {
          setConnecting(true);
          setError(null);
          const token = await getAccessToken();
          if (!token) return;
          const response = await fetch("/api/meta/oauth/start", {
            method: "POST",
            headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify({ isRetry: true }),
          });
          const payload = (await response.json()) as { url?: string; error?: string };
          if (response.ok && payload.url) {
            window.location.href = payload.url;
          }
        } catch {
          // Ignore - user can manually retry
        } finally {
          setConnecting(false);
        }
      })();
    }, 500);
    return () => clearTimeout(timer);
  }, [autoRetryParam, autoRetryDone, status, getAccessToken]);

  const handleConnect = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) {
        setError("Bitte erneut anmelden, um fortzufahren.");
        return;
      }
      const response = await fetch("/api/meta/oauth/start", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "OAuth konnte nicht gestartet werden.");
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("OAuth konnte nicht gestartet werden.");
    } finally {
      setConnecting(false);
    }
  }, [getAccessToken]);

  const handleDisconnect = useCallback(async () => {
    try {
      const confirmed = window.confirm(
        "Möchtest du Instagram wirklich trennen? Automatisierungen laufen dann nicht mehr."
      );
      if (!confirmed) {
        return;
      }
      setDisconnecting(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) {
        setError("Bitte erneut anmelden, um fortzufahren.");
        return;
      }
      const response = await fetch("/api/integrations", {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ provider: "meta" }),
      });
      if (!response.ok) {
        setError("Trennen fehlgeschlagen.");
        return;
      }
      await loadStatus();
    } catch {
      setError("Trennen fehlgeschlagen.");
    } finally {
      setDisconnecting(false);
    }
  }, [getAccessToken, loadStatus]);

  const handleGoogleConnect = useCallback(async () => {
    try {
      setGoogleConnecting(true);
      setGoogleError(null);
      const token = await getAccessToken();
      if (!token) {
        setGoogleError("Bitte erneut anmelden, um fortzufahren.");
        return;
      }
      const response = await fetch("/api/google/oauth/start", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setGoogleError(payload.error ?? "OAuth konnte nicht gestartet werden.");
        return;
      }
      window.location.href = payload.url;
    } catch {
      setGoogleError("OAuth konnte nicht gestartet werden.");
    } finally {
      setGoogleConnecting(false);
    }
  }, [getAccessToken]);

  const handleGoogleDisconnect = useCallback(async () => {
    try {
      const confirmed = window.confirm(
        "Möchtest du Google Kalender wirklich trennen? Automatisierungen laufen dann nicht mehr."
      );
      if (!confirmed) {
        return;
      }
      setGoogleDisconnecting(true);
      setGoogleError(null);
      const token = await getAccessToken();
      if (!token) {
        setGoogleError("Bitte erneut anmelden, um fortzufahren.");
        return;
      }
      const response = await fetch("/api/integrations", {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ provider: "google_calendar" }),
      });
      if (!response.ok) {
        setGoogleError("Trennen fehlgeschlagen.");
        return;
      }
      await loadStatus();
    } catch {
      setGoogleError("Trennen fehlgeschlagen.");
    } finally {
      setGoogleDisconnecting(false);
    }
  }, [getAccessToken, loadStatus]);

  const loadGoogleCalendars = useCallback(async () => {
    try {
      setGoogleCalendarsLoading(true);
      setGoogleError(null);
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch("/api/google/calendars", {
        headers: { authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as { calendars?: GoogleCalendarOption[]; error?: string };
      if (!response.ok) {
        setGoogleError(payload.error ?? "Kalender konnten nicht geladen werden.");
        return;
      }
      const calendars = payload.calendars ?? [];
      setGoogleCalendars(calendars);

      const primary = calendars.find((cal) => cal.primary);
      const resolvedId = googleIntegration?.calendar_id ?? primary?.id ?? calendars[0]?.id ?? null;
      const resolvedCalendar = calendars.find((cal) => cal.id === resolvedId) ?? primary ?? calendars[0] ?? null;
      setGoogleCalendarId(resolvedId);
      setGoogleCalendarTimeZone(resolvedCalendar?.timeZone ?? null);
    } catch {
      setGoogleError("Kalender konnten nicht geladen werden.");
    } finally {
      setGoogleCalendarsLoading(false);
    }
  }, [getAccessToken, googleIntegration?.calendar_id]);

  useEffect(() => {
    if (!googleConnected) return;
    loadGoogleCalendars();
  }, [googleConnected, loadGoogleCalendars]);

  const handleGoogleCalendarSave = useCallback(async () => {
    try {
      setGoogleCalendarSaving(true);
      setGoogleCalendarNotice(null);
      setGoogleError(null);
      const token = await getAccessToken();
      if (!token) {
        setGoogleError("Bitte erneut anmelden, um fortzufahren.");
        return;
      }
      const response = await fetch("/api/integrations", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "google_calendar",
          calendar_id: googleCalendarId,
          calendar_time_zone: googleCalendarTimeZone,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setGoogleError(payload.error ?? "Kalender konnte nicht gespeichert werden.");
        return;
      }
      if (payload.integration) {
        setGoogleIntegration(payload.integration);
      }
      setGoogleCalendarNotice("Kalender gespeichert.");
    } catch {
      setGoogleError("Kalender konnte nicht gespeichert werden.");
    } finally {
      setGoogleCalendarSaving(false);
    }
  }, [getAccessToken, googleCalendarId, googleCalendarTimeZone]);

  const handleGoogleCalendarSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value;
    setGoogleCalendarId(nextId);
    const selected = googleCalendars.find((cal) => cal.id === nextId) ?? null;
    setGoogleCalendarTimeZone(selected?.timeZone ?? null);
    setGoogleCalendarNotice(null);
  };

  const handleGoogleTest = useCallback(async () => {
    try {
      setGoogleTestStatus("running");
      setGoogleTestMessage(null);
      const token = await getAccessToken();
      if (!token) {
        setGoogleTestStatus("error");
        setGoogleTestMessage("Bitte erneut anmelden, um fortzufahren.");
        return;
      }
      const response = await fetch("/api/google/calendar/test", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const payload = (await response.json()) as {
        success?: boolean;
        event?: { htmlLink?: string | null };
        error?: string;
      };
      if (!response.ok || !payload.success) {
        setGoogleTestStatus("error");
        setGoogleTestMessage(payload.error ?? "Testtermin konnte nicht erstellt werden.");
        return;
      }
      setGoogleTestStatus("success");
      setGoogleTestMessage(payload.event?.htmlLink ?? "Testtermin erstellt.");
    } catch {
      setGoogleTestStatus("error");
      setGoogleTestMessage("Testtermin konnte nicht erstellt werden.");
    }
  }, [getAccessToken]);

  const handleSaveReviewUrl = useCallback(async () => {
    try {
      setReviewSaving(true);
      setReviewSaved(false);
      setReviewError(null);

      if (!metaConnected) {
        setReviewError("Bitte zuerst Meta/Instagram verbinden.");
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        setReviewError("Bitte erneut anmelden, um fortzufahren.");
        return;
      }

      const response = await fetch("/api/integrations", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "meta",
          google_review_url: reviewUrl.trim() || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setReviewError(payload.error ?? "Speichern fehlgeschlagen.");
        return;
      }

      if (payload.integration) {
        setMetaIntegration(payload.integration);
      }

      setReviewSaved(true);
    } catch {
      setReviewError("Speichern fehlgeschlagen.");
    } finally {
      setReviewSaving(false);
    }
  }, [getAccessToken, metaConnected, reviewUrl]);

  const [openCard, setOpenCard] = useState<string | null>(null);

  const toggleCard = (key: string) => {
    setOpenCard((prev) => (prev === key ? null : key));
  };

  const getTokenExpiryInfo = (integration: IntegrationStatus | null) => {
    if (!integration?.expires_at) return null;

    const expiresAt = new Date(integration.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return {
      daysUntilExpiry: diffDays,
      expiresAt,
      isExpired: diffDays <= 0,
      isExpiringSoon: diffDays > 0 && diffDays <= 7,
    };
  };

  const tokenExpiryInfo = getTokenExpiryInfo(metaIntegration);

  return (
    <div className="space-y-3 app-page-enter">
      <SectionCard
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8B5CF6_0%,#EC4899_55%,#F59E0B_100%)] text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </span>
        }
        title="Instagram"
        description="DMs automatisiert beantworten"
        badge={
          status === "loading" ? (
            <Badge variant="neutral">Laedt...</Badge>
          ) : metaConnected ? (
            <Badge variant="success">
              <Wifi className="h-3 w-3" />
              Verbunden
            </Badge>
          ) : (
            <Badge variant="neutral">
              <WifiOff className="h-3 w-3" />
              Nicht verbunden
            </Badge>
          )
        }
        open={openCard === "instagram"}
        onToggle={() => toggleCard("instagram")}
      >
        <div className="space-y-4">
          {showMetaSuccess || oauthResolved ? (
            <div className="rounded-xl border border-[#BBF7D0] bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
              {accountParam ? `Erfolgreich verbunden: ${accountParam}` : "Instagram wurde erfolgreich verbunden."}
            </div>
          ) : null}
          {showMetaError && !metaConnected && !oauthResolved ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              Verbindung fehlgeschlagen: {errorParam}
            </div>
          ) : null}
          {metaConnected ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Verbundenes Konto
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0F172A]">
                {metaIntegration?.account_name ?? "Meta Account"}
              </div>
              {metaIntegration?.instagram_username ? (
                <div className="mt-1 text-sm text-[#64748B]">
                  @{metaIntegration.instagram_username}
                </div>
              ) : null}
            </div>
          ) : null}
          {metaConnected && tokenExpiryInfo?.isExpired ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              Token abgelaufen. Bitte verbinde deinen Account erneut.
            </div>
          ) : null}
          {metaConnected &&
          tokenExpiryInfo?.isExpiringSoon &&
          !tokenExpiryInfo.isExpired ? (
            <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#B45309]">
              Token laeuft in {tokenExpiryInfo.daysUntilExpiry}{" "}
              {tokenExpiryInfo.daysUntilExpiry === 1 ? "Tag" : "Tagen"} ab.
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleConnect} loading={connecting}>
              {metaConnected ? "Erneut verbinden" : "Instagram verbinden"}
            </Button>
            {metaConnected ? (
              <Button variant="danger-outline" onClick={handleDisconnect} loading={disconnecting}>
                Trennen
              </Button>
            ) : null}
          </div>

          {!metaConnected ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
              <p className="font-semibold text-[#0F172A]">Voraussetzungen</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Instagram Business- oder Creator-Account</li>
                <li>Verknuepfte Facebook-Seite</li>
              </ul>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#047857]">
            <CalendarDays className="h-5 w-5" />
          </span>
        }
        title="Google Kalender"
        description={`${labels.bookingPlural} automatisch eintragen`}
        badge={
          status === "loading" ? (
            <Badge variant="neutral">Laedt...</Badge>
          ) : googleConnected ? (
            <Badge variant="success">
              <Wifi className="h-3 w-3" />
              Verbunden
            </Badge>
          ) : (
            <Badge variant="neutral">
              <WifiOff className="h-3 w-3" />
              Nicht verbunden
            </Badge>
          )
        }
        open={openCard === "google"}
        onToggle={() => toggleCard("google")}
      >
        <div className="space-y-4">
          {showGoogleSuccess ? (
            <div className="rounded-xl border border-[#BBF7D0] bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
              {accountParam
                ? `Erfolgreich verbunden: ${accountParam}`
                : "Google Kalender wurde erfolgreich verbunden."}
            </div>
          ) : null}
          {showGoogleError && !googleConnected ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              Verbindung fehlgeschlagen: {errorParam}
            </div>
          ) : null}
          {googleConnected ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Verbundenes Konto
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0F172A]">
                {googleIntegration?.account_name ?? "Google Kalender"}
              </div>
              <div className="mt-1 text-sm text-[#047857]">
                Token wird automatisch erneuert.
              </div>
            </div>
          ) : null}
          {googleError ? (
            <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {googleError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleGoogleConnect} loading={googleConnecting}>
              {googleConnected ? "Erneut verbinden" : "Google Kalender verbinden"}
            </Button>
            {googleConnected ? (
              <>
                <Button
                  variant="danger-outline"
                  onClick={handleGoogleDisconnect}
                  loading={googleDisconnecting}
                >
                  Trennen
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGoogleTest}
                  loading={googleTestStatus === "running"}
                >
                  {`${testBookingLabel} erstellen`}
                </Button>
              </>
            ) : null}
          </div>

          {googleConnected && googleCalendarsLoading ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
              Kalender werden geladen...
            </div>
          ) : null}

          {googleConnected && !googleCalendarsLoading && googleCalendars.length > 0 ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Kalenderauswahl
              </div>
              <div className="mt-3 flex flex-col gap-3">
                <select
                  className="app-select w-full"
                  value={googleCalendarId ?? ""}
                  onChange={handleGoogleCalendarSelect}
                >
                  {googleCalendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.summary}
                      {calendar.primary ? " (Primary)" : ""}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-[#64748B]">
                  Zeitzone: {googleCalendarTimeZone ?? "Unbekannt"}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleGoogleCalendarSave}
                    loading={googleCalendarSaving}
                  >
                    Kalender speichern
                  </Button>
                  {googleCalendarNotice ? (
                    <span className="text-sm text-[#047857]">
                      {googleCalendarNotice}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {googleTestStatus !== "idle" && googleTestMessage ? (
            <div
              className={[
                "rounded-xl border px-4 py-3 text-sm",
                googleTestStatus === "success"
                  ? "border-[#BBF7D0] bg-[#ECFDF5] text-[#047857]"
                  : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
              ].join(" ")}
            >
              {googleTestStatus === "success" &&
              googleTestMessage.startsWith("http") ? (
                <a
                  className="inline-flex items-center gap-2 underline-offset-4 hover:underline"
                  href={googleTestMessage}
                  target="_blank"
                  rel="noreferrer"
                >
                  {testBookingLabel} ansehen
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                googleTestMessage
              )}
            </div>
          ) : null}

          {!googleConnected ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
              <p className="font-semibold text-[#0F172A]">Voraussetzungen</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Google Kalender ist aktiv</li>
                <li>Owner- oder Editor-Zugriff</li>
              </ul>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#B45309]">
            <Star className="h-5 w-5" />
          </span>
        }
        title="Google Bewertungen"
        description="Automatische Review-Anfragen"
        badge={
          reviewUrl ? (
            <Badge variant="success">Konfiguriert</Badge>
          ) : (
            <Badge variant="neutral">Nicht konfiguriert</Badge>
          )
        }
        open={openCard === "reviews"}
        onToggle={() => toggleCard("reviews")}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
              <LinkIcon className="h-4 w-4 text-[#B45309]" />
              Google-Bewertungslink
            </div>
            <p className="mt-1 text-xs text-[#64748B]">
              Dieser Link wird automatisch an {labels.contactPlural} gesendet,
              wenn {labels.bookingIndefiniteArticle} {labels.bookingSingular} als
              abgeschlossen markiert wird.
            </p>
            <input
              className="app-input mt-3 w-full px-3 py-2.5"
              placeholder="https://g.page/r/.../review"
              value={reviewUrl}
              onChange={(event) => {
                setReviewUrl(event.target.value);
                setReviewSaved(false);
              }}
              disabled={!metaConnected}
            />
            {!metaConnected ? (
              <p className="mt-2 text-xs text-[#B45309]">
                Verbinde zuerst Instagram, um den Review-Link zu konfigurieren.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                onClick={handleSaveReviewUrl}
                loading={reviewSaving}
                disabled={!metaConnected}
              >
                Link speichern
              </Button>
              {reviewSaved ? (
                <span className="text-xs font-medium text-[#047857]">
                  Gespeichert
                </span>
              ) : null}
              {reviewError ? (
                <span className="text-xs font-medium text-[#B91C1C]">
                  {reviewError}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
            Wenn du {labels.bookingIndefiniteArticle} {labels.bookingSingular} in
            Wesponde als abgeschlossen markierst, erhaelt der {labels.contactLabel} automatisch
            eine Nachricht mit deinem Bewertungslink.
          </div>

          <a
            href="https://support.google.com/business/answer/7035772"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-medium text-[#2563EB] transition-colors hover:text-[#1D4ED8]"
          >
            <ExternalLink className="h-3 w-3" />
            Wie finde ich meinen Google-Bewertungslink?
          </a>
        </div>
      </SectionCard>

      <SectionCard
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#047857]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
            </svg>
          </span>
        }
        title="WhatsApp Business"
        description="In Kuerze verfuegbar"
        badge={<Badge variant="accent">Bald verfuegbar</Badge>}
        open={openCard === "whatsapp"}
        onToggle={() => toggleCard("whatsapp")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#475569]">
            Automatisiere Kundengespraeche auch ueber WhatsApp Business. Wir
            arbeiten an der naechsten Channel-Erweiterung.
          </p>
          <Button variant="secondary" disabled>
            Bei Launch benachrichtigen
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE9FE] text-[#6D28D9]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </span>
        }
        title="POS / Kassensystem"
        description="Verfuegbarkeiten synchronisieren"
        badge={<Badge variant="neutral">In Planung</Badge>}
        open={openCard === "pos"}
        onToggle={() => toggleCard("pos")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#475569]">
            Verbinde dein Kassensystem, um {labels.bookingPlural} mit echten
            Verfuegbarkeiten und Betriebslogik abzugleichen.
          </p>
          <Button variant="secondary">Mehr erfahren</Button>
        </div>
      </SectionCard>
    </div>
  );
}
