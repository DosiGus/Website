'use client';

import { FormEvent, useState } from "react";

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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-brand/10 backdrop-blur"
    >
      <div>
        <label className="block text-sm font-semibold text-slate-600">Vollständiger Name</label>
        <input
          required
          name="name"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          placeholder="Laura Weber"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600">Geschäfts-E-Mail</label>
        <input
          required
          type="email"
          name="email"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          placeholder="laura@studio.co"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-600">Branche</label>
        <select
          required
          name="industry"
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          defaultValue=""
        >
          <option value="" disabled>
            Bitte auswählen
          </option>
          <option>Restaurant & Bar</option>
          <option>Friseur & Beauty</option>
          <option>Spa, Wellness & Massage</option>
          <option>Medizin & Praxis</option>
          <option>Fitness & Coaching</option>
          <option>Andere Dienstleistung</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-2xl bg-brand px-5 py-3 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "loading" ? "Wird gesendet..." : "Join Beta"}
      </button>
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${status === "success" ? "text-emerald-600" : "text-rose-500"}`}
        >
          {message}
        </p>
      ) : null}
      <p className="text-xs text-slate-500">
        Wir schützen deine Daten. Mit dem Absenden akzeptierst du unsere{" "}
        <a
          className="font-semibold text-brand-dark hover:text-brand"
          href="/privacy"
        >
          Datenschutzerklärung
        </a>
        .
      </p>
    </form>
  );
}
