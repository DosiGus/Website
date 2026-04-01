'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Edge, Node as FlowNode } from "reactflow";
import {
  AlertTriangle,
  Bell,
  CalendarCheck,
  ChartNoAxesColumn,
  Compass,
  LogOut,
  MessageCircle,
  Plug,
  Settings,
  Zap,
  X,
  type LucideIcon,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";
import { lintFlow } from "../../lib/flowLint";
import type { FlowTrigger } from "../../lib/flowTypes";
import useAccountVertical from "../../lib/useAccountVertical";
import { getBookingLabels } from "../../lib/verticals";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

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

function isItemActive(pathname: string, href: string) {
  if (href === "/app/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { vertical, accountId, loading: accountLoading } = useAccountVertical();
  const labels = useMemo(() => getBookingLabels(vertical), [vertical]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const reservationLabel =
    vertical === "gastro" || !vertical ? "Reservierungen" : "Termine";

  // Load user
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Benutzer",
      );
      setUserEmail(user.email || null);
    }
    loadUser();
  }, [supabase]);

  // Load notifications
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (accountLoading || !accountId) { setNotifications([]); return; }

      const [integrationsRes, flowsRes, pendingRes] = await Promise.all([
        supabase.from("integrations").select("provider,status").eq("account_id", accountId),
        supabase.from("flows").select("id,status,nodes,edges,triggers").eq("account_id", accountId),
        supabase.from("reservations").select("id", { count: "exact", head: true })
          .eq("account_id", accountId).eq("status", "pending"),
      ]);
      if (cancelled) return;

      const items: NotificationItem[] = [];

      if (!integrationsRes.error) {
        const hasMetaConnected = (integrationsRes.data ?? []).some(
          (i) => i.provider === "meta" && i.status === "connected",
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
        const withWarnings = flowsRes.data.filter((f) => {
          if (f.status !== "Aktiv") return false;
          return lintFlow(
            (f.nodes as FlowNode[]) ?? [],
            (f.edges as Edge[]) ?? [],
            (f.triggers as FlowTrigger[]) ?? [],
          ).warnings.length > 0;
        });
        if (withWarnings.length > 0) {
          items.push({
            id: "flow-warnings",
            title: `${withWarnings.length} aktive Flows mit Warnungen`,
            description: "Bitte prüfen und optimieren.",
            href: "/app/flows?status=Warnungen",
            tone: "warning",
            Icon: AlertTriangle,
          });
        }
      }

      if (!pendingRes.error && (pendingRes.count ?? 0) > 0) {
        const count = pendingRes.count!;
        items.push({
          id: "pending-reservations",
          title: count === 1
            ? `1 ${labels.bookingSingular} offen`
            : `${count} ${labels.bookingPlural} offen`,
          description: "Warten auf Bestätigung.",
          href: "/app/reservations?status=pending",
          tone: "info",
          Icon: CalendarCheck,
        });
      }

      setNotifications(items);
    }
    load();
    return () => { cancelled = true; };
  }, [supabase, accountId, accountLoading, labels.bookingSingular, labels.bookingPlural]);

  // Close on navigation
  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  // Mobile sidebar toggle event
  useEffect(() => {
    function handleToggle() { setMobileOpen((c) => !c); }
    window.addEventListener("wesponde:sidebar:toggle", handleToggle);
    return () => window.removeEventListener("wesponde:sidebar:toggle", handleToggle);
  }, []);

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notificationsOpen]);

  // Escape key
  useEffect(() => {
    if (!notificationsOpen && !mobileOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNotificationsOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [notificationsOpen, mobileOpen]);

  // Mobile body scroll lock
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const navSections: NavSection[] = [
    {
      label: "Übersicht",
      items: [{ href: "/app/dashboard", label: "Dashboard", icon: ChartNoAxesColumn }],
    },
    {
      label: "Automatisierung",
      items: [
        { href: "/app/flows", label: "Flows", icon: Zap },
        { href: "/app/conversations", label: "Konversationen", icon: MessageCircle },
      ],
    },
    {
      label: "Verwaltung",
      items: [
        { href: "/app/reservations", label: reservationLabel, icon: CalendarCheck },
        { href: "/app/integrations", label: "Integrationen", icon: Plug },
        { href: "/app/settings", label: "Einstellungen", icon: Settings },
      ],
    },
  ];

  const handleLogout = async () => {
    setNotificationsOpen(false);
    setMobileOpen(false);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleOpenGuide = () => {
    setNotificationsOpen(false);
    setMobileOpen(false);
    window.dispatchEvent(
      new CustomEvent("wesponde:onboarding:open", {
        detail: { step: 0 },
      }),
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white text-[#64748B]">

      {/* ── Header: Logo + Bell + Mobile close ── */}
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#E2E8F0] px-6">
        <Link
          href="/app/dashboard"
          className="ml-1 leading-none tracking-tight text-[#2450b3]"
        >
          <span className="font-display text-xl">Wesponde</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Bell */}
          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              onClick={() => { setNotificationsOpen((c) => !c); }}
              aria-expanded={notificationsOpen}
              aria-haspopup="menu"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] focus-visible:ring-offset-1"
              aria-label="Benachrichtigungen"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-[9px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-lg"
                role="menu"
              >
                <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                  <p className="text-sm font-semibold text-[#0F172A]">Benachrichtigungen</p>
                  <span className="text-xs text-[#94A3B8]">{notifications.length} neu</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((item) => {
                    const Icon = item.Icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setNotificationsOpen(false)}
                        role="menuitem"
                        className="flex gap-3 border-b border-[#F0F4F9] px-4 py-3 transition-colors hover:bg-[#F8FAFC] last:border-b-0"
                      >
                        <span className={[
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          item.tone === "warning" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#E0F2FE] text-[#0369A1]",
                        ].join(" ")}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[#0F172A]">{item.title}</span>
                          <span className="mt-0.5 block text-xs text-[#475569]">{item.description}</span>
                        </span>
                      </Link>
                    );
                  })}
                  {notifications.length === 0 && (
                    <p className="px-4 py-6 text-center text-sm text-[#94A3B8]">Keine Benachrichtigungen</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile close */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] lg:hidden"
            aria-label="Navigation schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── User section ── */}
      <div className="shrink-0 border-b border-[#E2E8F0] px-5 py-3.5">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E2E8F0] text-[13px] font-semibold text-[#475569]">
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#0F172A]">
              {userName || "Benutzer"}
            </p>
            {userEmail && (
              <p className="truncate text-[12px] text-[#94A3B8]">{userEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-5 py-6">
        {navSections.map((section, sectionIndex) => (
          <div key={section.label} className={sectionIndex > 0 ? "mt-1" : ""}>
            {sectionIndex > 0 && <div className="mb-4 mt-3 border-t border-[#E2E8F0]" />}
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B0BAD0]">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "relative flex min-h-11 items-center gap-3.5 rounded-lg px-3 py-2.5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] focus-visible:ring-offset-1",
                      active
                        ? "text-[#1E4FD8]"
                        : "text-[#64748B] transition-colors duration-150 hover:bg-[#F1F5F9] hover:text-[#0F172A]",
                    ].join(" ")}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-md bg-[#EEF3FF]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      />
                    )}
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-border"
                        className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-full bg-[#1E4FD8]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      />
                    )}
                    <Icon className="relative z-10 h-[18px] w-[18px] shrink-0 stroke-[1.5]" />
                    <span className="relative z-10 truncate font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-6 border-t border-[#E2E8F0] pt-5">
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleOpenGuide}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] focus-visible:ring-offset-1"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#10B981]">
                <Compass className="h-4 w-4" />
              </span>
              <span className="min-w-0 text-[15px] font-medium text-[#0F172A]">
                Guide starten
              </span>
            </button>

            <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[15px] font-medium text-[#0F172A]">
                Hilfe benötigt?
              </p>
              <p className="mt-1 text-sm text-[#64748B]">
                Schreibe uns via{" "}
                <a
                  href="mailto:support@wesponde.com"
                  className="font-medium text-[#1E4FD8] transition-colors hover:text-[#1a46c4]"
                >
                  support@wesponde.com
                </a>
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 items-center gap-3 px-3 py-2 text-[15px] text-[#64748B] transition-colors hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4FD8] focus-visible:ring-offset-1"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span className="font-medium">Abmelden</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden h-full border-r border-[#E2E8F0] lg:flex lg:w-[320px] lg:flex-col">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          id="app-sidebar-drawer"
          className="fixed inset-0 z-40 lg:hidden"
          aria-modal="true"
          aria-label="Seitennavigation"
          role="dialog"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Navigation schließen"
          />
          <div className="relative h-full w-[320px] max-w-[85vw] shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
