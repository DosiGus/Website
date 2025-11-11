const integrations = [
  {
    provider: "Meta / Instagram",
    description:
      "Verbinde deinen Instagram- oder Facebook-Account, um DMs automatisiert zu beantworten.",
    status: "Verbunden",
    cta: "Einstellungen öffnen",
  },
  {
    provider: "WhatsApp Business",
    description: "In Kürze verfügbar. Hinterlasse uns Feedback, wenn du früh starten möchtest.",
    status: "Bald verfügbar",
    cta: "Benachrichtigen",
  },
  {
    provider: "POS / Kassensystem",
    description: "Synchronisiere Tisch- und Terminverfügbarkeiten mit deinem Kassensystem.",
    status: "In Planung",
    cta: "Mehr erfahren",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">Integrationen</p>
        <h1 className="text-3xl font-semibold">Kanäle verbinden</h1>
        <p className="text-slate-500">
          Steuere, welche Plattformen Zugriff auf deine Flows haben.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {integrations.map((integration) => (
          <div
            key={integration.provider}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{integration.provider}</h3>
                <p className="text-sm text-slate-500">{integration.description}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  integration.status === "Verbunden"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {integration.status}
              </span>
            </div>
            <button className="mt-6 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400">
              {integration.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
