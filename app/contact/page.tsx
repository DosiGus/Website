export const metadata = {
  title: "Kontakt & Support — Wesponde",
  description:
    "Brauche Hilfe bei deiner Wesponde-Integration oder möchtest du Pilotzugang? Unser Team antwortet schnell.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-20 lg:flex-row">
      <div className="flex-1 space-y-6">
        <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          Support
        </span>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Fragen zur Integration? Wir unterstützen persönlich.
        </h1>
        <p className="text-lg leading-7 text-slate-600">
          Unser Success-Team hilft bei Messenger-Verbindungen, Kassensystemen und dem Ablauf-Design.
          Schreib uns – wir melden uns in der Regel innerhalb eines Werktags.
        </p>

        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              E-Mail
            </p>
            <a
              href="mailto:support@wesponde.com"
              className="mt-2 block text-base font-medium text-slate-800 hover:text-brand-dark"
            >
              support@wesponde.com
            </a>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Telefon
              </p>
              <a
                href="tel:+49301234567"
                className="mt-2 block text-base font-medium text-slate-800 hover:text-brand-dark"
              >
                +49 (0) 30 1234567
              </a>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Adresse
              </p>
              <p className="mt-2 text-base text-slate-700">
                Musterstraße 1
                <br />
                10115 Berlin
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="flex-1 space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-brand/10">
        <div>
          <label className="block text-sm font-semibold text-slate-600">Vollständiger Name</label>
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="Vor- und Nachname"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600">
            Geschäfts-E-Mail
          </label>
          <input
            type="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600">Branche</label>
          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30">
            <option>Bitte auswählen</option>
            <option>Restaurant & Bar</option>
            <option>Friseur & Beauty</option>
            <option>Spa & Wellness</option>
            <option>Medizin & Praxis</option>
            <option>Fitness & Coaching</option>
            <option>Andere Dienstleistung</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600">Nachricht</label>
          <textarea
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="Wie können wir helfen?"
            rows={5}
          />
        </div>
        <button
          type="button"
          className="w-full rounded-2xl bg-brand px-5 py-3 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Anfrage senden (Platzhalter)
        </button>
        <p className="text-xs text-slate-500">
          Mit dem Absenden akzeptierst du unsere{" "}
          <a className="font-semibold text-brand-dark hover:text-brand" href="/privacy">
            Datenschutzerklärung
          </a>
          .
        </p>
      </form>
    </section>
  );
}
