'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, CalendarCheck, ChevronDown, LogOut, Plug, Search, Settings, User } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { lintFlow } from "../../lib/flowLint";
import type { Edge, Node as FlowNode } from "reactflow";
import type { FlowTrigger } from "../../lib/flowTypes";
import useAccountVertical from "../../lib/useAccountVertical";
import { getBookingLabels } from "../../lib/verticals";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "warning" | "info";
  Icon: typeof AlertTriangle;
};

export default function AppTopbar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { vertical } = useAccountVertical();
  const labels = useMemo(() => getBookingLabels(vertical), [vertical]);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const name = user.user_metadata?.full_name ||
                     user.user_metadata?.name ||
                     user.email?.split('@')[0] ||
                     'Benutzer';
        setUserName(name);
        setUserEmail(user.email || null);
      }
    }
    loadUser();
  }, [supabase, labels.bookingPlural, labels.bookingSingular]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [integrationsRes, flowsRes, pendingReservationsRes] = await Promise.all([
        supabase
          .from("integrations")
          .select("provider,status")
          .eq("user_id", user.id),
        supabase
          .from("flows")
          .select("id,status,nodes,edges,triggers")
          .eq("user_id", user.id),
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending"),
      ]);

      if (cancelled) return;

      const items: NotificationItem[] = [];

      if (!integrationsRes.error) {
        const integrations = integrationsRes.data ?? [];
        const hasMetaConnected = integrations.some(
          (integration) =>
            integration.provider === "meta" && integration.status === "connected"
        );
        if (!hasMetaConnected) {
          items.push({
            id: "integration-meta",
            title: "Meta/Instagram verbinden",
            description: "Kein aktiver Instagram-Account verbunden.",
            href: "/app/integrations",
            tone: "warning",
            Icon: Plug,
          });
        }
      }

      if (!flowsRes.error && flowsRes.data?.length) {
        const activeFlowsWithWarnings = flowsRes.data.filter((flow) => {
          if (flow.status !== "Aktiv") return false;
          const lint = lintFlow(
            (flow.nodes as FlowNode[]) ?? [],
            (flow.edges as Edge[]) ?? [],
            (flow.triggers as FlowTrigger[]) ?? []
          );
          return lint.warnings.length > 0;
        });

        if (activeFlowsWithWarnings.length > 0) {
          items.push({
            id: "flow-warnings",
            title: `${activeFlowsWithWarnings.length} aktive Flows mit Warnungen`,
            description: "Bitte prüfen und optimieren.",
            href: "/app/flows?status=Warnungen",
            tone: "warning",
            Icon: AlertTriangle,
          });
        }
      }

      if (!pendingReservationsRes.error) {
        const pendingCount = pendingReservationsRes.count ?? 0;
        if (pendingCount > 0) {
          items.push({
            id: "pending-reservations",
            title: pendingCount === 1
              ? `1 ${labels.bookingSingular} offen`
              : `${pendingCount} ${labels.bookingPlural} offen`,
            description: "Warten auf Bestätigung.",
            href: "/app/reservations?status=pending",
            tone: "info",
            Icon: CalendarCheck,
          });
        }
      }

      setNotifications(items);
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [supabase, labels.bookingPlural, labels.bookingSingular]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as HTMLElement)
      ) {
        setNotificationsOpen(false);
      }
      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as HTMLElement)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen, userMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="relative z-30 flex items-center justify-between border-b border-white/10 bg-zinc-900/50 px-8 py-4 backdrop-blur-xl">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 transition-all focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder={`Flows, ${labels.bookingPlural} durchsuchen …`}
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setUserMenuOpen(false);
            }}
            className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            ) : null}
          </button>

          {notificationsOpen ? (
            <div className="absolute right-0 z-50 mt-3 w-80 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 shadow-xl shadow-black/40 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-white">Benachrichtigungen</p>
                <span className="text-xs text-zinc-500">
                  {notifications.length} neu
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((item) => {
                    const toneStyles =
                      item.tone === "warning"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-indigo-500/10 text-indigo-400";
                    const Icon = item.Icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setNotificationsOpen(false)}
                        className="flex items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      >
                        <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${toneStyles}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold text-white">
                            {item.title}
                          </span>
                          <span className="block text-xs text-zinc-500">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-zinc-500">
                    Alles erledigt. Keine neuen Hinweise.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => {
              setUserMenuOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition-all hover:border-white/20 hover:bg-white/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-sm font-medium text-white">{userName || 'Laden...'}</p>
              <p className="text-xs text-zinc-500">{userEmail || ''}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          </button>

          {userMenuOpen ? (
            <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 shadow-xl shadow-black/40 backdrop-blur-xl">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Account</p>
                <p className="mt-1 text-sm font-semibold text-white">{userName || "Benutzer"}</p>
              </div>
              <div className="py-2">
                <Link
                  href="/app/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Einstellungen
                </Link>
                <Link
                  href="/app/integrations"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Plug className="h-4 w-4" />
                  Integrationen
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Abmelden
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
