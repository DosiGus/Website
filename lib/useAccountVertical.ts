"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "./supabaseBrowserClient";
import type { VerticalKey } from "./verticals";

type UseAccountVerticalOptions = {
  refreshOnFocus?: boolean;
};

export default function useAccountVertical(options: UseAccountVerticalOptions = {}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [vertical, setVertical] = useState<VerticalKey | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVertical = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setAccountId(null);
      setLoading(false);
      return;
    }
    const { data: memberships, error: membershipError } = await supabase
      .from("account_members")
      .select("account_id, role, joined_at")
      .eq("user_id", user.id);
    if (membershipError || !memberships || memberships.length === 0) {
      setAccountId(null);
      setLoading(false);
      return;
    }
    const rolePriority: Record<string, number> = {
      viewer: 0,
      member: 1,
      admin: 2,
      owner: 3,
    };
    const sorted = [...memberships].sort((a, b) => {
      const roleDelta =
        (rolePriority[String(b.role)] ?? 0) - (rolePriority[String(a.role)] ?? 0);
      if (roleDelta !== 0) return roleDelta;
      const aJoined = a.joined_at ? new Date(a.joined_at).getTime() : 0;
      const bJoined = b.joined_at ? new Date(b.joined_at).getTime() : 0;
      return aJoined - bJoined;
    });
    const primaryAccountId = sorted[0]?.account_id ?? null;
    setAccountId(primaryAccountId);
    if (!primaryAccountId) {
      setLoading(false);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    const response = await fetch("/api/account/settings", {
      headers: { authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) {
      setLoading(false);
      return;
    }
    const payload = await response.json();
    setVertical(payload?.vertical ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchVertical();
  }, [fetchVertical]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ vertical?: VerticalKey | null }>).detail;
      if (detail?.vertical !== undefined) {
        setVertical(detail.vertical ?? null);
        return;
      }
      fetchVertical();
    };
    window.addEventListener("wesponde:vertical-changed", handler);
    return () => window.removeEventListener("wesponde:vertical-changed", handler);
  }, [fetchVertical]);

  useEffect(() => {
    if (!options.refreshOnFocus) return;
    const handler = () => fetchVertical();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [fetchVertical, options.refreshOnFocus]);

  return { vertical, accountId, loading, refresh: fetchVertical, setVertical };
}
