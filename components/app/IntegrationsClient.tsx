"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import type { IntegrationStatus } from "../../lib/meta/types";

type IntegrationsResponse = {
  integrations: IntegrationStatus[];
};

export default function IntegrationsClient() {
  const searchParams = useSearchParams();
  const [metaIntegration, setMetaIntegration] = useState<IntegrationStatus | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const successParam = useMemo(
    () => searchParams?.get("success"),
    [searchParams],
  );
  const accountParam = useMemo(
    () => searchParams?.get("account"),
    [searchParams],
  );
  const errorParam = useMemo(
    () => searchParams?.get("error"),
    [searchParams],
  );

  const getAccessToken = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);
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
      if (meta && meta.status !== "connected") {
        setMetaIntegration({ ...meta, status: "disconnected" });
      } else {
        setMetaIntegration(meta);
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

  const metaConnected = metaIntegration?.status === "connected";
  const metaStatusLabel = metaConnected ? "Verbunden" : "Nicht verbunden";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Meta / Instagram</h3>
            <p className="text-sm text-slate-500">
              Verbinde deinen Instagram- oder Facebook-Account, um DMs automatisiert zu
              beantworten.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              metaConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {status === "loading" ? "Lädt…" : metaStatusLabel}
          </span>
        </div>

        {successParam === "true" && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {accountParam
              ? `Meta/Instagram wurde erfolgreich verbunden: ${accountParam}`
              : "Meta/Instagram wurde erfolgreich verbunden."}
          </div>
        )}

        {errorParam && (
          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Verbindung fehlgeschlagen: {errorParam}
          </div>
        )}

        {metaConnected && (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="font-semibold text-slate-700">Verbundenes Konto</div>
            <div>{metaIntegration?.account_name ?? "Meta Account"}</div>
            {metaIntegration?.instagram_username && (
              <div className="text-xs text-slate-400">
                @{metaIntegration.instagram_username}
              </div>
            )}
            {!metaIntegration?.instagram_username && metaIntegration?.instagram_id && (
              <div className="text-xs text-slate-400">
                Instagram ID: {metaIntegration.instagram_id}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? "Verbinden..." : "Mit Meta verbinden"}
          </button>
          {metaConnected && (
            <button
              className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-400"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? "Trennen..." : "Trennen"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">WhatsApp Business</h3>
            <p className="text-sm text-slate-500">
              In Kürze verfügbar. Hinterlasse uns Feedback, wenn du früh starten möchtest.
            </p>
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            Bald verfügbar
          </span>
        </div>
        <button className="mt-6 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400">
          Benachrichtigen
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">POS / Kassensystem</h3>
            <p className="text-sm text-slate-500">
              Synchronisiere Tisch- und Terminverfügbarkeiten mit deinem Kassensystem.
            </p>
          </div>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            In Planung
          </span>
        </div>
        <button className="mt-6 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400">
          Mehr erfahren
        </button>
      </div>
    </div>
  );
}
