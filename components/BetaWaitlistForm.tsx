'use client';

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export default function BetaWaitlistForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      industry: formData.get("industry"),
    };

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");

      setStatus("success");
      setMessage("Danke! Wir haben dich aufgenommen und melden uns bald.");
      event.currentTarget.reset();
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(
        "Da ist etwas schiefgelaufen. Bitte versuche es später erneut oder schreib uns an hello@wesponde.com."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center backdrop-blur-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">Erfolgreich angemeldet!</h3>
        <p className="mt-2 text-sm text-zinc-400">{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm sm:p-8"
    >
      {/* Gradient glow effect */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-violet-500/20 blur-[60px]" />

      <div className="relative space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Vollständiger Name
          </label>
          <input
            required
            name="name"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Max Mustermann"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Geschäfts-E-Mail
          </label>
          <input
            required
            type="email"
            name="email"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="max@beispiel.de"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300">
            Branche
          </label>
          <select
            required
            name="industry"
            className="mt-2 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            defaultValue=""
          >
            <option value="" disabled className="bg-zinc-900 text-zinc-500">
              Bitte auswählen
            </option>
            <option className="bg-zinc-900">Restaurant & Bar</option>
            <option className="bg-zinc-900">Friseur & Beauty</option>
            <option className="bg-zinc-900">Spa, Wellness & Massage</option>
            <option className="bg-zinc-900">Medizin & Praxis</option>
            <option className="bg-zinc-900">Fitness & Coaching</option>
            <option className="bg-zinc-900">Andere Dienstleistung</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="relative flex items-center justify-center gap-2">
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                Pilotzugang anfragen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
        </button>

        {message && status === "error" && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400"
          >
            {message}
          </p>
        )}

        <p className="text-center text-xs text-zinc-500">
          Wir schützen deine Daten. Mit dem Absenden akzeptierst du unsere{" "}
          <a
            className="font-medium text-zinc-400 underline underline-offset-2 transition-colors hover:text-white"
            href="/privacy"
          >
            Datenschutzerklärung
          </a>
          .
        </p>
      </div>
    </form>
  );
}
