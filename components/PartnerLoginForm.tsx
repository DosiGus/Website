'use client';

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabaseBrowserClient";
import { Loader2 } from "lucide-react";

type AuthView = "login" | "signup";

const authErrorMessages: Record<string, string> = {
  "Invalid login credentials": "E-Mail oder Passwort ist falsch.",
  "Email not confirmed": "Bitte bestaetige zuerst deine E-Mail-Adresse.",
  "User already registered": "Diese E-Mail ist bereits registriert.",
  "Signup requires a valid password": "Bitte gib ein gueltiges Passwort ein.",
  "Password should be at least 6 characters": "Das Passwort muss mindestens 6 Zeichen lang sein.",
  "Unable to validate email address: invalid format": "Bitte gib eine gueltige E-Mail-Adresse ein.",
  "Email rate limit exceeded": "Zu viele Versuche. Bitte warte einen Moment.",
  "For security purposes, you can only request this once every 60 seconds": "Bitte warte 60 Sekunden bevor du es erneut versuchst.",
};

function translateAuthError(message: string): string {
  for (const [key, translation] of Object.entries(authErrorMessages)) {
    if (message.includes(key)) return translation;
  }
  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Schwach", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Mittel", color: "bg-yellow-500" };
  if (score <= 3) return { score, label: "Gut", color: "bg-blue-500" };
  return { score, label: "Stark", color: "bg-emerald-500" };
}

export default function PartnerLoginForm() {
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const defaultView = (viewParam as AuthView) === "signup" ? "signup" : "login";
  const [view, setView] = useState<AuthView>(defaultView);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const router = useRouter();
  const redirectParam = searchParams.get("redirect");
  const fallbackRedirect =
    typeof window !== "undefined" ? `${window.location.origin}/app` : "https://app.wesponde.com";
  const redirectTarget = redirectParam || fallbackRedirect;

  const updateView = useCallback(
    (nextView: AuthView) => {
      setView(nextView);
      setPassword("");
      setPasswordConfirm("");
      setMessage("");
      setStatus("idle");
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
    const businessName = (formData.get("businessName") as string) || "";
    setStatus("loading");
    setMessage("");
    if (view === "signup" && password !== passwordConfirm) {
      setStatus("error");
      setMessage("Die Passwoerter stimmen nicht ueberein.");
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus("success");
        setMessage("Login erfolgreich! Du wirst gleich weitergeleitet.");
        router.replace(redirectTarget);
      } else {
        const callbackUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : "https://wesponde.com/auth/callback";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: {
              full_name: businessName || undefined,
            },
          },
        });
        if (error) throw error;
        setSignupEmail(email);
        setStatus("success");
        setMessage(`Wir haben eine Bestaetigungsmail an ${email} gesendet. Pruefe dein Postfach.`);
        setPassword("");
        setPasswordConfirm("");
        form.reset();
      }
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setMessage(translateAuthError(error?.message || ""));
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

        {/* Business Name (signup only) */}
        {view === "signup" && (
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Firmenname
            </label>
            <input
              name="businessName"
              type="text"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="z.B. Ristorante Milano"
            />
          </div>
        )}

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="••••••••"
          />
          {view === "signup" && password.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= getPasswordStrength(password).score
                        ? getPasswordStrength(password).color
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                Staerke: {getPasswordStrength(password).label}
              </p>
            </div>
          )}
        </div>

        {/* Password Confirmation (signup only) */}
        {view === "signup" && (
          <div>
            <label className="block text-sm font-medium text-zinc-300">
              Passwort bestaetigen
            </label>
            <input
              required
              name="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={`mt-2 w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                passwordConfirm.length > 0 && password !== passwordConfirm
                  ? "border-red-500/50 focus:border-red-500"
                  : "border-white/10 focus:border-indigo-500"
              }`}
              placeholder="••••••••"
            />
            {passwordConfirm.length > 0 && password !== passwordConfirm && (
              <p className="mt-1.5 text-xs text-red-400">
                Passwoerter stimmen nicht ueberein
              </p>
            )}
          </div>
        )}

        {/* Terms Checkbox (signup only) */}
        {view === "signup" && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              required
              name="terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/20"
            />
            <span className="text-xs leading-relaxed text-zinc-400">
              Ich akzeptiere die{" "}
              <a href="/terms" target="_blank" className="text-zinc-300 underline underline-offset-2 hover:text-white">
                AGB
              </a>{" "}
              und{" "}
              <a href="/privacy" target="_blank" className="text-zinc-300 underline underline-offset-2 hover:text-white">
                Datenschutzerklaerung
              </a>.
            </span>
          </label>
        )}

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
            const oauthCallback = `${window.location.origin}/auth/callback`;
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: "facebook",
              options: {
                redirectTo: oauthCallback,
              },
            });
            if (error) {
              setStatus("error");
              setMessage(translateAuthError(error.message));
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
          <div
            className={`rounded-lg p-3 text-center text-sm ${
              status === "error"
                ? "border border-red-500/20 bg-red-500/10 text-red-400"
                : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <p>{message}</p>
            {status === "success" && signupEmail && (
              <button
                type="button"
                className="mt-2 text-xs font-medium underline underline-offset-2 transition-colors hover:text-emerald-300"
                onClick={async () => {
                  try {
                    const supabase = createSupabaseBrowserClient();
                    const callbackUrl = `${window.location.origin}/auth/callback`;
                    const { error } = await supabase.auth.resend({
                      type: "signup",
                      email: signupEmail,
                      options: { emailRedirectTo: callbackUrl },
                    });
                    if (error) throw error;
                    setMessage(`Neue Bestaetigungsmail an ${signupEmail} gesendet.`);
                  } catch (err: any) {
                    setStatus("error");
                    setMessage(translateAuthError(err?.message || ""));
                  }
                }}
              >
                E-Mail erneut senden
              </button>
            )}
            {status === "success" && signupEmail && (
              <button
                type="button"
                className="ml-3 mt-2 text-xs font-medium text-zinc-400 underline underline-offset-2 transition-colors hover:text-white"
                onClick={() => {
                  updateView("login");
                  setSignupEmail("");
                }}
              >
                Zum Login
              </button>
            )}
          </div>
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
