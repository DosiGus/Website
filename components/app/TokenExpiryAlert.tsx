"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock3 } from "lucide-react";
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
      <div className="app-panel mb-6 border border-[#FECACA] bg-[#FEF2F2] px-4 py-4 text-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#FEE2E2] text-[#B91C1C]">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <div className="font-semibold text-[#B91C1C]">
                Instagram-Verbindung abgelaufen
              </div>
              <div className="mt-1 text-[#991B1B]">
                Dein Instagram-Zugang ist abgelaufen. Nachrichten werden nicht mehr empfangen.
              </div>
            </div>
          </div>
          <Link
            href="/app/integrations"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C]"
          >
            Jetzt erneuern
          </Link>
        </div>
      </div>
    );
  }

  if (tokenInfo.isExpiringSoon) {
    return (
      <div className="app-panel mb-6 border border-[#FDE68A] bg-[#FFFBEB] px-4 py-4 text-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#B45309]">
              <Clock3 className="h-4 w-4" />
            </span>
            <div>
              <div className="font-semibold text-[#B45309]">
                Instagram-Verbindung läuft in {tokenInfo.daysUntilExpiry}{" "}
                {tokenInfo.daysUntilExpiry === 1 ? "Tag" : "Tagen"} ab
              </div>
              <div className="mt-1 text-[#92400E]">
                Bitte erneuere die Verbindung, um Unterbrechungen zu vermeiden.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#FCD34D] px-3 py-2 text-sm font-medium text-[#92400E] transition-colors hover:bg-[#FEF3C7]"
            >
              Später
            </button>
            <Link
              href="/app/integrations"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#D97706] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#B45309]"
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
