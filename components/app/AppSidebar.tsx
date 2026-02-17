'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Workflow, Plug, Settings, CalendarCheck, MessageCircle, LogOut, Compass } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import useAccountVertical from "../../lib/useAccountVertical";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { vertical } = useAccountVertical();

  const reservationLabel =
    vertical === "gastro" || !vertical ? "Reservierungen" : "Termine";

  const navItems = [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/flows", label: "Flows", icon: Workflow },
    { href: "/app/reservations", label: reservationLabel, icon: CalendarCheck },
    { href: "/app/conversations", label: "Konversationen", icon: MessageCircle },
    { href: "/app/integrations", label: "Integrationen", icon: Plug },
    { href: "/app/settings", label: "Einstellungen", icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-zinc-900/50 px-4 py-6 backdrop-blur-xl">
      {/* Logo */}
      <div className="px-3">
        <Link href="/app/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-white">Wesponde</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Dashboard
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-white shadow-lg shadow-indigo-500/10"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-indigo-400" : ""}`} />
              {item.label}
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Support Box */}
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("wesponde:onboarding:open"));
        }}
        className="mb-4 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <Compass className="h-4 w-4 text-emerald-300" />
        Guide starten
      </button>

      {/* Support Box */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">Hilfe benötigt?</p>
        <p className="mt-1 text-xs text-zinc-400">
          Schreibe uns via{" "}
          <a href="mailto:support@wesponde.com" className="text-indigo-400 hover:text-indigo-300">
            support@wesponde.com
          </a>
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-rose-500/10 hover:text-rose-400"
      >
        <LogOut className="h-4 w-4" />
        Abmelden
      </button>
    </aside>
  );
}
