'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  ChevronDown,
  Menu,
  LogOut,
  Plug,
  Settings,
} from "lucide-react";
import type { Edge, Node as FlowNode } from "reactflow";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { lintFlow } from "../../lib/flowLint";
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

function getInitials(name: string | null) {
  if (!name) return "WE";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function getPageTitle(pathname: string) {
  if (pathname === "/app/dashboard") {
    return { title: "Dashboard" };
  }
  if (pathname === "/app/flows") {
    return { title: "Flows" };
  }
  if (pathname === "/app/flows/new") {
    return { title: "Neuer Flow", breadcrumb: "Flows" };
  }
  if (/^\/app\/flows\/[^/]+$/.test(pathname)) {
    return { title: "Flow Builder", breadcrumb: "Flows" };
  }
  if (pathname === "/app/reservations") {
    return { title: "Reservierungen" };
  }
  if (pathname === "/app/conversations") {
    return { title: "Konversationen" };
  }
  if (pathname === "/app/integrations") {
    return { title: "Integrationen" };
  }
  if (pathname === "/app/settings") {
    return { title: "Einstellungen" };
  }
  return { title: "Wesponde App" };
}

export default function AppTopbar() {
  const pathname = usePathname();
  const page = getPageTitle(pathname);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { vertical, accountId, loading: accountLoading } = useAccountVertical();
  const labels = useMemo(() => getBookingLabels(vertical), [vertical]);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Benutzer";

      setUserName(name);
      setUserEmail(user.email || null);
    }

    loadUser();
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      if (accountLoading) return;
      if (!accountId) {
        setNotifications([]);
        return;
      }

      const [integrationsRes, flowsRes, pendingReservationsRes] = await Promise.all([
        supabase
          .from("integrations")
          .select("provider,status")
          .eq("account_id", accountId),
        supabase
          .from("flows")
          .select("id,status,nodes,edges,triggers")
          .eq("account_id", accountId),
        supabase
          .from("reservations")
          .select("id", { count: "exact", head: true })
          .eq("account_id", accountId)
          .eq("status", "pending"),
      ]);

      if (cancelled) return;

      const items: NotificationItem[] = [];

      if (!integrationsRes.error) {
        const integrations = integrationsRes.data ?? [];
        const hasMetaConnected = integrations.some(
          (integration) =>
            integration.provider === "meta" && integration.status === "connected",
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
            (flow.triggers as FlowTrigger[]) ?? [],
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
            title:
              pendingCount === 1
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
  }, [supabase, labels.bookingPlural, labels.bookingSingular, accountId, accountLoading]);

  useEffect(() => {
    setNotificationsOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    if (!notificationsOpen && !userMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [notificationsOpen, userMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#475569] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 lg:hidden"
          onClick={() => window.dispatchEvent(new Event("wesponde:sidebar:toggle"))}
          aria-controls="app-sidebar-drawer"
          aria-label="Navigation öffnen"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          {page.breadcrumb ? (
            <p className="mb-0.5 text-xs font-medium text-[#94A3B8]">
              {page.breadcrumb}
            </p>
          ) : null}
          <h1 className="truncate text-[18px] font-semibold text-[#0F172A]">
            {page.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {notifications.length > 0 ? (
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setUserMenuOpen(false);
              }}
              aria-expanded={notificationsOpen}
              aria-haspopup="menu"
              aria-controls="app-topbar-notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#475569] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
              aria-label="Benachrichtigungen öffnen"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-semibold text-white">
                {notifications.length}
              </span>
            </button>

            {notificationsOpen ? (
              <div
                id="app-topbar-notifications"
                className="absolute right-0 mt-3 w-80 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-lg"
                role="menu"
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Benachrichtigungen
                  </p>
                  <span className="text-xs text-[#94A3B8]">
                    {notifications.length} neu
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((item) => {
                    const Icon = item.Icon;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setNotificationsOpen(false)}
                        role="menuitem"
                        className="flex gap-3 border-b border-[#F0F4F9] px-4 py-3 transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-inset last:border-b-0"
                      >
                        <span
                          className={[
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            item.tone === "warning"
                              ? "bg-[#FEF3C7] text-[#B45309]"
                              : "bg-[#E0F2FE] text-[#0369A1]",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#0F172A]">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#475569]">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {notifications.length > 0 ? (
          <div className="hidden h-5 w-px bg-[#E2E8F0] sm:block" aria-hidden="true" />
        ) : null}

        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((current) => !current);
              setNotificationsOpen(false);
            }}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-controls="app-topbar-user-menu"
            className="flex min-h-10 items-center gap-3 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DBEAFE] text-[11px] font-semibold text-[#1D4ED8]">
              {getInitials(userName)}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-medium text-[#0F172A]">
                {userName || "Benutzer"}
              </p>
              <p className="truncate text-xs text-[#94A3B8]">{userEmail || ""}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-[#94A3B8]" aria-hidden="true" />
          </button>

          {userMenuOpen ? (
            <div
              id="app-topbar-user-menu"
              className="absolute right-0 mt-3 w-60 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-lg"
              role="menu"
            >
              <div className="border-b border-[#E2E8F0] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[#94A3B8]">
                  Konto
                </p>
                <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                  {userName || "Benutzer"}
                </p>
              </div>
              <div className="py-2">
                <Link
                  href="/app/settings"
                  onClick={() => setUserMenuOpen(false)}
                  role="menuitem"
                  className="flex min-h-10 items-center gap-2 px-4 py-2 text-sm text-[#334155] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-inset"
                >
                  <Settings className="h-4 w-4" />
                  Einstellungen
                </Link>
                <Link
                  href="/app/integrations"
                  onClick={() => setUserMenuOpen(false)}
                  role="menuitem"
                  className="flex min-h-10 items-center gap-2 px-4 py-2 text-sm text-[#334155] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-inset"
                >
                  <Plug className="h-4 w-4" />
                  Integrationen
                </Link>
                <div className="mx-4 my-2 h-px bg-[#E2E8F0]" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  role="menuitem"
                  className="flex min-h-10 w-full items-center gap-2 px-4 py-2 text-sm text-[#B91C1C] transition-colors hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-inset"
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
