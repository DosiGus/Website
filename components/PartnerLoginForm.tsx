'use client';

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowserClient";

type AuthView = "login" | "signup";

export default function PartnerLoginForm() {
  const [view, setView] = useState<AuthView>("login");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const fallbackRedirect =
    typeof window !== "undefined" ? `${window.location.origin}/app` : "https://app.wesponde.com";
  const redirectTarget = redirectParam || fallbackRedirect;

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
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-brand/10"
    >
      <div className="flex gap-3 rounded-2xl bg-slate-100 p-1 text-sm font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setView("login")}
          className={`flex-1 rounded-xl px-4 py-2 ${
            view === "login" ? "bg-white text-slate-900 shadow" : ""
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setView("signup")}
          className={`flex-1 rounded-xl px-4 py-2 ${
            view === "signup" ? "bg-white text-slate-900 shadow" : ""
          }`}
        >
          Registrieren
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-600">Geschäfts-E-Mail</label>
        <input
          required
          name="email"
          type="email"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          placeholder="team@restaurant.co"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600">Passwort</label>
        <input
          required
          name="password"
          type="password"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-2xl bg-brand px-5 py-3 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
      >
        {view === "login" ? "Login" : "Registrieren"}
      </button>
      <button
        type="button"
        className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
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
        Mit Meta verbinden
      </button>
      {message ? (
        <p
          className={`text-sm ${
            status === "error" ? "text-rose-500" : "text-emerald-600"
          }`}
        >
          {message}
        </p>
      ) : null}
      <p className="text-center text-xs text-slate-500">
        Kein Zugang?{" "}
        <a className="font-semibold text-brand-dark hover:text-brand" href="/contact">
          Support kontaktieren
        </a>
        .
      </p>
    </form>
  );
}
