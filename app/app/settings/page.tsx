export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Einstellungen</p>
        <h1 className="text-3xl font-semibold">Account & Benachrichtigungen</h1>
        <p className="text-slate-500">Passe dein Profil und API-Zugänge an.</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <form className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Profil</h2>
          <div>
            <label className="text-sm font-semibold text-slate-500">Name</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              defaultValue="Laura Weber"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-500">E-Mail</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              defaultValue="laura@studio.co"
            />
          </div>
          <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white">
            Änderungen speichern
          </button>
        </form>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">API-Zugriff</h2>
          <p className="text-sm text-slate-500">
            Verwende den Key für Webhooks oder externe Integrationen.
          </p>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3 font-mono text-xs">
            wesponde_live_7c1b12c99e1f4…
          </div>
          <div className="flex gap-3">
            <button className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
              Kopieren
            </button>
            <button className="flex-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white">
              Neu generieren
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Benachrichtigungen</h2>
        <p className="text-sm text-slate-500">
          Wähle, wann Wesponde dich informieren soll.
        </p>
        <div className="mt-6 space-y-4">
          {[
            "Neue Leads per E-Mail",
            "Bot-Fehler / Fallbacks",
            "Integration läuft ab",
            "Monatlicher Performance-Report",
          ].map((option) => (
            <label key={option} className="flex items-center gap-3 text-sm text-slate-600">
              <input type="checkbox" className="rounded border-slate-300" defaultChecked />
              {option}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
