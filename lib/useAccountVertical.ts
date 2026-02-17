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
  const [loading, setLoading] = useState(true);

  const fetchVertical = useCallback(async () => {
    setLoading(true);
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

  return { vertical, loading, refresh: fetchVertical, setVertical };
}
