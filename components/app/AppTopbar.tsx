'use client';

import { useEffect, useMemo, useState } from "react";
import { Bell, Search, User, ChevronDown } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";

export default function AppTopbar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
  }, [supabase]);

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-zinc-900/50 px-8 py-4 backdrop-blur-xl">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 transition-all focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          placeholder="Flows, Reservierungen durchsuchen …"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
            2
          </span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-all hover:border-white/20 hover:bg-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-sm font-medium text-white">{userName || 'Laden...'}</p>
            <p className="text-xs text-zinc-500">{userEmail || ''}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </div>
      </div>
    </header>
  );
}
