"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";

interface TokenInfo {
  daysUntilExpiry: number;
  expiresAt: Date;
  isExpired: boolean;
  isExpiringSoon: boolean;
  accountName: string | null;
}

export default function TokenExpiryAlert() {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function checkTokenExpiry() {
      const supabase = createSupabaseBrowserClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for integrations with expiring tokens
        const { data: integration } = await supabase
          .from("integrations")
          .select("expires_at, account_name")
          .eq("user_id", user.id)
          .eq("status", "connected")
          .single();

        if (!integration?.expires_at) return;

        const expiresAt = new Date(integration.expires_at);
        const now = new Date();
        const diffMs = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Only show warning if expiring within 7 days or expired
        if (diffDays <= 7) {
          setTokenInfo({
            daysUntilExpiry: diffDays,
            expiresAt,
            isExpired: diffDays <= 0,
            isExpiringSoon: diffDays > 0 && diffDays <= 7,
            accountName: integration.account_name,
          });
        }
      } catch {
        // Ignore errors
      }
    }

    checkTokenExpiry();
  }, []);

  if (!tokenInfo || dismissed) return null;

  if (tokenInfo.isExpired) {
    return (
      <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-semibold text-rose-700">Instagram-Verbindung abgelaufen</div>
              <div className="text-rose-600">
                Dein Instagram-Zugang ist abgelaufen. Nachrichten werden nicht mehr empfangen.
              </div>
            </div>
          </div>
          <Link
            href="/app/integrations"
            className="whitespace-nowrap rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Jetzt erneuern
          </Link>
        </div>
      </div>
    );
  }

  if (tokenInfo.isExpiringSoon) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⏰</span>
            <div>
              <div className="font-semibold text-amber-700">
                Instagram-Verbindung läuft in {tokenInfo.daysUntilExpiry}{" "}
                {tokenInfo.daysUntilExpiry === 1 ? "Tag" : "Tagen"} ab
              </div>
              <div className="text-amber-600">
                Bitte erneuere die Verbindung, um Unterbrechungen zu vermeiden.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="whitespace-nowrap rounded-full border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              Später
            </button>
            <Link
              href="/app/integrations"
              className="whitespace-nowrap rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Erneuern
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
