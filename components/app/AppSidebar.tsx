'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Workflow, Plug, Settings, CalendarCheck, MessageCircle } from "lucide-react";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/flows", label: "Flows", icon: Workflow },
  { href: "/app/reservations", label: "Reservierungen", icon: CalendarCheck },
  { href: "/app/conversations", label: "Konversationen", icon: MessageCircle },
  { href: "/app/integrations", label: "Integrationen", icon: Plug },
  { href: "/app/settings", label: "Einstellungen", icon: Settings },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white/90 px-4 py-6 backdrop-blur">
      <div className="px-2">
        <p className="text-lg font-semibold tracking-tight text-slate-900">Wesponde</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          App Suite
        </p>
      </div>
      <nav className="mt-8 flex-1 space-y-1 text-sm font-semibold text-slate-500">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2 transition ${
                active ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-2xl bg-slate-900/5 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-800">Support</p>
        <p>Hilfe benötigt? Schreibe uns via support@wesponde.com</p>
      </div>
    </aside>
  );
}
