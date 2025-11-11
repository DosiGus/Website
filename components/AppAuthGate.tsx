'use client';

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowserClient";

export default function AppAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "ready">("checking");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login?redirect=" + encodeURIComponent(pathname));
        return;
      }
      setStatus("ready");
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      } else {
        setStatus("ready");
      }
    });

    loadSession();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-white/10 px-6 py-4 text-sm font-semibold">
          Sitzung wird geprüft …
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
