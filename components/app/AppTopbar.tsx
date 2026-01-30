'use client';

import { useEffect, useMemo, useState } from "react";
import { Bell, Search, User } from "lucide-react";
import { createSupabaseBrowserClient } from "../../lib/supabaseBrowserClient";

export default function AppTopbar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get name from user metadata first, fallback to email
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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          placeholder="Flows durchsuchen …"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="rounded-full border border-slate-200 p-2 text-slate-500 hover:text-slate-900">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-full border border-slate-200 px-3 py-1.5 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
            <User className="h-4 w-4" />
          </div>
          <div className="text-left leading-tight">
            <p className="font-semibold text-slate-900">{userName || 'Laden...'}</p>
            <p className="text-xs text-slate-400">{userEmail || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
