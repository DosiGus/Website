'use client';

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowserClient";

export default function AppAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "ready" | "unauthenticated" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (error: any) {
      setErrorMessage(
        error?.message || "Die Anmeldung ist gerade nicht verfügbar. Bitte versuche es erneut."
      );
      setStatus("error");
      return;
    }

    const timeout = window.setTimeout(() => {
      setStatus((current) => (current === "checking" ? "unauthenticated" : current));
    }, 4000);

    async function loadSession() {
      try {
        const { data } = await supabase!.auth.getSession();
        if (!data.session) {
          setStatus("unauthenticated");
          router.replace("/login?redirect=" + encodeURIComponent(pathname));
          return;
        }
        setStatus("ready");
      } catch (error: any) {
        setErrorMessage(
          error?.message || "Sitzung konnte nicht geprüft werden. Bitte melde dich erneut an."
        );
        setStatus("error");
      }
    }

    const { data: listener } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setStatus("unauthenticated");
        router.replace("/login");
      } else {
        setStatus("ready");
      }
    });

    loadSession();

    return () => {
      window.clearTimeout(timeout);
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

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="max-w-md space-y-4 rounded-3xl border border-white/10 px-6 py-6 text-center">
          <p className="text-sm font-semibold">Bitte anmelden, um fortzufahren.</p>
          <button
            className="w-full rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900"
            onClick={() => router.replace("/login?redirect=" + encodeURIComponent(pathname))}
          >
            Zum Partner-Login
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="max-w-md space-y-4 rounded-3xl border border-white/10 px-6 py-6 text-center">
          <p className="text-sm font-semibold">Die Sitzung konnte nicht geprüft werden.</p>
          <p className="text-xs text-white/70">{errorMessage}</p>
          <button
            className="w-full rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900"
            onClick={() => router.replace("/login?redirect=" + encodeURIComponent(pathname))}
          >
            Erneut anmelden
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
