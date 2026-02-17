"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
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
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import type { IntegrationStatus } from "../../lib/meta/types";

type IntegrationsResponse = {
  integrations: IntegrationStatus[];
};

type GoogleCalendarOption = {
  id: string;
  summary: string;
  timeZone: string | null;
  primary: boolean;
};

export default function IntegrationsClient() {
  const searchParams = useSearchParams();
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
  }, [errorParam, oauthResolved, metaConnected, getAccessToken]);

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
            headers: { authorization: `Bearer ${token}` },
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
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Instagram / Meta */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Instagram</h3>
              <p className="text-sm text-zinc-400">
                DMs automatisiert beantworten
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              metaConnected
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-zinc-500/10 text-zinc-400"
            }`}
          >
            {metaConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {status === "loading" ? "Lädt…" : metaConnected ? "Verbunden" : "Nicht verbunden"}
          </span>
        </div>

        {showMetaSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            {accountParam
              ? `Erfolgreich verbunden: ${accountParam}`
              : "Instagram wurde erfolgreich verbunden."}
          </div>
        )}

        {showMetaError && !metaConnected && !oauthResolved && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            Verbindung fehlgeschlagen: {errorParam}
          </div>
        )}

        {oauthResolved && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            Instagram wurde erfolgreich verbunden.
          </div>
        )}

        {metaConnected && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Verbundenes Konto</div>
            <div className="mt-1 font-medium text-white">{metaIntegration?.account_name ?? "Meta Account"}</div>
            {metaIntegration?.instagram_username && (
              <div className="text-sm text-zinc-400">@{metaIntegration.instagram_username}</div>
            )}
          </div>
        )}

        {/* Token Expiry Warning */}
        {metaConnected && tokenExpiryInfo?.isExpired && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-400" />
            <div>
              <div className="font-semibold text-rose-400">Token abgelaufen!</div>
              <div className="text-rose-400/80">
                Bitte verbinde deinen Account erneut.
              </div>
            </div>
          </div>
        )}

        {metaConnected && tokenExpiryInfo?.isExpiringSoon && !tokenExpiryInfo?.isExpired && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm">
            <Clock className="mt-0.5 h-4 w-4 text-amber-400" />
            <div>
              <div className="font-semibold text-amber-400">
                Token läuft in {tokenExpiryInfo.daysUntilExpiry} {tokenExpiryInfo.daysUntilExpiry === 1 ? "Tag" : "Tagen"} ab
              </div>
              <div className="text-amber-400/80">
                Bitte verbinde deinen Account erneut.
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:opacity-50"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? "Verbinden..." : metaConnected ? "Erneut verbinden" : "Instagram verbinden"}
          </button>
          {metaConnected && (
            <button
              className="rounded-lg border border-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/10"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Trennen..." : "Trennen"}
            </button>
          )}
        </div>

        {!metaConnected && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
            <p className="font-medium text-zinc-200">Voraussetzungen:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-zinc-300">
              <li>Instagram <span className="text-zinc-300">Business</span>- oder <span className="text-zinc-300">Creator</span>-Account (kein privates Profil)</li>
              <li>Eine <span className="text-zinc-300">Facebook-Seite</span>, die mit dem Instagram-Account verknüpft ist</li>
            </ul>
            <p className="mt-2 text-zinc-400/80">
              Du kannst dein Profil kostenlos umstellen: Instagram → Einstellungen → Konto → Zu professionellem Konto wechseln.
            </p>
          </div>
        )}
      </div>

      {/* Google Calendar */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Google Kalender</h3>
              <p className="text-sm text-zinc-400">Termine automatisch eintragen</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              googleConnected
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-zinc-500/10 text-zinc-400"
            }`}
          >
            {googleConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {status === "loading" ? "Lädt…" : googleConnected ? "Verbunden" : "Nicht verbunden"}
          </span>
        </div>

        {showGoogleSuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            {accountParam
              ? `Erfolgreich verbunden: ${accountParam}`
              : "Google Kalender wurde erfolgreich verbunden."}
          </div>
        )}

        {showGoogleError && !googleConnected && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            Verbindung fehlgeschlagen: {errorParam}
          </div>
        )}

        {googleConnected && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">Verbundenes Konto</div>
            <div className="mt-1 font-medium text-white">{googleIntegration?.account_name ?? "Google Kalender"}</div>
          </div>
        )}

        {googleConnected && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Token wird automatisch erneuert.
          </div>
        )}

        {googleError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            {googleError}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 disabled:opacity-50"
            onClick={handleGoogleConnect}
            disabled={googleConnecting}
          >
            {googleConnecting
              ? "Verbinden..."
              : googleConnected
                ? "Erneut verbinden"
                : "Google Kalender verbinden"}
          </button>
          {googleConnected && (
            <button
              className="rounded-lg border border-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/10"
              onClick={handleGoogleDisconnect}
              disabled={googleDisconnecting}
            >
              {googleDisconnecting ? "Trennen..." : "Trennen"}
            </button>
          )}
          {googleConnected && (
            <button
              className="rounded-lg border border-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-500/10 disabled:opacity-50"
              onClick={handleGoogleTest}
              disabled={googleTestStatus === "running"}
            >
              {googleTestStatus === "running" ? "Testtermin..." : "Testtermin erstellen"}
            </button>
          )}
        </div>

        {googleConnected && googleCalendars.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Kalenderauswahl
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <select
                className="w-full rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-2 text-sm text-white"
                value={googleCalendarId ?? ""}
                onChange={handleGoogleCalendarSelect}
              >
                {googleCalendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.summary}{calendar.primary ? " (Primary)" : ""}
                  </option>
                ))}
              </select>
              <div className="text-xs text-zinc-400">
                Zeitzone: {googleCalendarTimeZone ?? "Unbekannt"}
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg bg-emerald-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                  onClick={handleGoogleCalendarSave}
                  disabled={googleCalendarSaving}
                >
                  {googleCalendarSaving ? "Speichern..." : "Kalender speichern"}
                </button>
                {googleCalendarNotice && (
                  <span className="text-sm text-emerald-300">{googleCalendarNotice}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {googleTestStatus !== "idle" && googleTestMessage && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              googleTestStatus === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/20 bg-rose-500/10 text-rose-300"
            }`}
          >
            {googleTestStatus === "success" && googleTestMessage.startsWith("http") ? (
              <a
                className="inline-flex items-center gap-2 text-emerald-200 underline-offset-4 hover:underline"
                href={googleTestMessage}
                target="_blank"
                rel="noreferrer"
              >
                Testtermin ansehen
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              googleTestMessage
            )}
          </div>
        )}

        {!googleConnected && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-400">
            <p className="font-medium text-zinc-200">Voraussetzungen:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-zinc-300">
              <li>Google Kalender ist aktiv</li>
              <li>Du hast Zugriff auf den Kalender (Owner oder Editor)</li>
            </ul>
            <p className="mt-2 text-zinc-400/80">
              Wir nutzen den Primary Kalender, solange keine weiteren Kalender zugeordnet sind.
            </p>
          </div>
        )}
      </div>

      {/* Google Reviews */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Google Bewertungen</h3>
              <p className="text-sm text-zinc-400">
                Automatische Review-Anfragen
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              reviewUrl
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-zinc-500/10 text-zinc-400"
            }`}
          >
            {reviewUrl ? <CheckCircle className="h-3 w-3" /> : <LinkIcon className="h-3 w-3" />}
            {reviewUrl ? "Konfiguriert" : "Nicht konfiguriert"}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <LinkIcon className="h-4 w-4 text-amber-400" />
            Google-Bewertungslink
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Dieser Link wird automatisch an Gäste gesendet, wenn eine Reservierung abgeschlossen wird.
          </p>
          <input
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            placeholder="https://g.page/r/…/review"
            value={reviewUrl}
            onChange={(event) => {
              setReviewUrl(event.target.value);
              setReviewSaved(false);
            }}
            disabled={!metaConnected}
          />
          {!metaConnected && (
            <p className="mt-2 text-xs text-amber-400">
              Verbinde zuerst Instagram, um den Review-Link zu konfigurieren.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50"
              onClick={handleSaveReviewUrl}
              disabled={reviewSaving || !metaConnected}
            >
              {reviewSaving ? "Speichern..." : "Link speichern"}
            </button>
            {reviewSaved && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                <CheckCircle className="h-3 w-3" />
                Gespeichert
              </span>
            )}
            {reviewError && (
              <span className="text-xs font-medium text-rose-400">{reviewError}</span>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-zinc-400">
            <strong className="text-zinc-300">So funktioniert es:</strong> Wenn du eine Reservierung in Wesponde als &bdquo;Abgeschlossen&ldquo; markierst, erhält der Gast automatisch eine Nachricht mit deinem Bewertungslink.
          </p>
        </div>

        <a
          href="https://support.google.com/business/answer/7035772"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
        >
          <ExternalLink className="h-3 w-3" />
          Wie finde ich meinen Google-Bewertungslink?
        </a>
      </div>

      {/* WhatsApp Business */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">WhatsApp Business</h3>
              <p className="text-sm text-zinc-400">
                In Kürze verfügbar
              </p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            Bald verfügbar
          </span>
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          Automatisiere Kundengespräche auch über WhatsApp Business. Wir arbeiten daran!
        </p>
        <button className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:border-white/20 hover:text-white">
          Bei Launch benachrichtigen
        </button>
      </div>

      {/* POS */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">POS / Kassensystem</h3>
              <p className="text-sm text-zinc-400">
                Verfügbarkeiten synchronisieren
              </p>
            </div>
          </div>
          <span className="rounded-full bg-zinc-500/10 px-3 py-1 text-xs font-semibold text-zinc-400">
            In Planung
          </span>
        </div>
        <p className="mt-4 text-sm text-zinc-400">
          Verbinde dein Kassensystem, um Reservierungen mit deinen echten Verfügbarkeiten abzugleichen.
        </p>
        <button className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:border-white/20 hover:text-white">
          Mehr erfahren
        </button>
      </div>
    </div>
  );
}
