'use client';

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowserClient";
import { Loader2 } from "lucide-react";

type AuthView = "login" | "signup";

export default function PartnerLoginForm() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const defaultView = (viewParam as AuthView) === "signup" ? "signup" : "login";
  const [view, setView] = useState<AuthView>(defaultView);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const router = useRouter();
  const redirectParam = searchParams.get("redirect");
  const fallbackRedirect =
    typeof window !== "undefined" ? `${window.location.origin}/app` : "https://app.wesponde.com";
  const redirectTarget = redirectParam || fallbackRedirect;

  const updateView = useCallback(
    (nextView: AuthView) => {
      setView(nextView);
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", nextView);
      router.replace(`/login?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    const nextView = (viewParam as AuthView) === "signup" ? "signup" : "login";
    setView(nextView);
  }, [viewParam]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string) || "";
    const password = (formData.get("password") as string) || "";
    setStatus("loading");
    setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus("success");
        setMessage("Login erfolgreich! Du wirst gleich weitergeleitet.");
        router.replace(redirectTarget);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || fallbackRedirect,
          },
        });
        if (error) throw error;
        setStatus("success");
        setMessage("Check deine Inbox für den Bestätigungslink.");
        form.reset();
      }
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setMessage(error?.message || "Etwas ist schiefgelaufen.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm sm:p-8"
    >
      {/* Gradient glow effect */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-violet-500/10 blur-[60px]" />

      <div className="relative space-y-5">
        {/* Tab Switcher */}
        <div className="flex gap-1 rounded-xl bg-zinc-800/50 p-1">
          <button
            type="button"
            onClick={() => updateView("login")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              view === "login"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => updateView("signup")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              view === "signup"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Registrieren
          </button>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Geschäfts-E-Mail
          </label>
          <input
            required
            name="email"
            type="email"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="team@restaurant.de"
          />
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Passwort
          </label>
          <input
            required
            name="password"
            type="password"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="••••••••"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="relative flex items-center justify-center gap-2">
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird verarbeitet...
              </>
            ) : view === "login" ? (
              "Einloggen"
            ) : (
              "Account erstellen"
            )}
          </span>
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-4 text-zinc-500">oder</span>
          </div>
        </div>

        {/* Meta OAuth Button */}
        <button
          type="button"
          disabled={status === "loading"}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
          onClick={async () => {
            const supabase = createSupabaseBrowserClient();
            setStatus("loading");
            setMessage("");
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: "facebook",
              options: {
                redirectTo:
                  process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL || fallbackRedirect,
              },
            });
            if (error) {
              setStatus("error");
              setMessage(error.message);
            } else {
              setStatus("success");
              setMessage("Weiterleitung zu Meta gestartet…");
              if (data.url) {
                window.location.href = data.url;
              }
            }
          }}
        >
          <span className="flex items-center justify-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Mit Meta verbinden
          </span>
        </button>

        {/* Status Message */}
        {message && (
          <p
            className={`rounded-lg p-3 text-center text-sm ${
              status === "error"
                ? "border border-red-500/20 bg-red-500/10 text-red-400"
                : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {message}
          </p>
        )}

        {/* Support Link */}
        <p className="text-center text-xs text-zinc-500">
          {view === "login" ? "Probleme beim Login?" : "Probleme beim Registrieren?"}{" "}
          <a
            className="font-medium text-zinc-400 underline underline-offset-2 transition-colors hover:text-white"
            href="/contact"
          >
            Support kontaktieren
          </a>
        </p>
      </div>
    </form>
  );
}
