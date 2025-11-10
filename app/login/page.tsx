export const metadata = {
  title: "Wesponde Login",
  description:
    "Melde dich mit deiner Wesponde-ID oder via Meta OAuth an, um das Dashboard zu öffnen.",
};

const providers = [
  { label: "Mit E-Mail anmelden", type: "email" },
  { label: "Mit Meta verbinden", type: "meta" },
];

export default function LoginPage() {
  return (
    <section className="mx-auto grid max-w-4xl gap-12 px-4 py-20 lg:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
          Login
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          Zugriff für bestehende Kund:innen.
        </h1>
        <p className="mt-4 text-slate-600">
          Verwende deine Geschäfts-E-Mail oder verbinde deinen Meta-Business-Account via OAuth.
          Nach dem Login wirst du zur App{" "}
          <span className="font-semibold">app.wesponde.com</span> weitergeleitet.
        </p>
        <div className="mt-10 space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          {providers.map((provider) => (
            <button
              key={provider.type}
              className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-brand hover:text-brand"
            >
              {provider.label}
            </button>
          ))}
          <p className="text-xs text-slate-500">
            Neukund:innen erhalten Zugang über unser Success-Team.{" "}
            <a className="font-semibold text-brand-dark hover:text-brand" href="/contact">
              Kontakt aufnehmen
            </a>
            .
          </p>
        </div>
      </div>

      <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-brand/10">
        <div>
          <label className="block text-sm font-semibold text-slate-600">
            Geschäfts-E-Mail
          </label>
          <input
            type="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="team@restaurant.co"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600">Passwort</label>
          <input
            type="password"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="••••••••"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-slate-300" /> Angemeldet bleiben
          </label>
          <a className="font-semibold text-brand-dark hover:text-brand" href="/contact">
            Passwort vergessen?
          </a>
        </div>
        <button className="w-full rounded-2xl bg-brand px-5 py-3 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark">
          Login (Platzhalter)
        </button>
        <div className="text-center text-xs text-slate-500">
          Kein Zugang? Wende dich an{" "}
          <a className="font-semibold text-brand-dark hover:text-brand" href="mailto:support@wesponde.com">
            support@wesponde.com
          </a>
          .
        </div>
      </form>
    </section>
  );
}
