export const metadata = {
  title: "About Wesponde",
  description:
    "Erfahre mehr über die Mission von Wesponde: Automatisierte Kommunikation für Restaurants, Salons und Praxen.",
};

const values = [
  {
    title: "Smart",
    description:
      "Wir nutzen KI dort, wo sie echten Mehrwert bringt: bessere Antworten, schnellere Abläufe und klare Entscheidungen.",
  },
  {
    title: "Einfach",
    description:
      "Wesponde lässt sich in Minuten mit Meta-Accounts, POS-Systemen und CRMs verbinden – ohne komplexe Implementierung.",
  },
  {
    title: "Serviceorientiert",
    description:
      "Wir bauen Produkte, die Gespräche menschlicher machen. Automatisierung bedeutet für uns mehr Zeit für echte Beratung.",
  },
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <div className="max-w-3xl space-y-6">
        <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          Unsere Mission
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          „Wir glauben, dass großartige Gespräche den Unterschied machen.“
        </h1>
        <p className="text-lg text-slate-600">
          Wesponde wurde mit der Vision gegründet, Kommunikation zwischen Unternehmen und
          Kund:innen einfacher, menschlicher und effizienter zu gestalten. Während Service-Teams
          von manuellen Nachrichten überrollt werden, erwarten Gäste sofortige Antworten –
          und zwar in ihren Lieblingsmessengern.
        </p>
        <p className="text-lg text-slate-600">
          Deshalb kombinieren wir Automatisierung mit persönlicher Ansprache: Von Restaurants
          über Salons bis zu Praxen helfen wir Teams, Buchungen anzunehmen, Fragen zu klären und
          Stammkund:innen zu begeistern – rund um die Uhr.
        </p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {values.map((value) => (
          <div
            key={value.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-brand/10"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              {value.title}
            </p>
            <p className="mt-3 text-sm text-slate-600">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-20 grid gap-10 rounded-3xl border border-slate-200 bg-slate-50/70 p-8 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Was wir bauen
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">
            Ein Operating System für Service-Unternehmen
          </h2>
          <p className="mt-4 text-slate-600">
            Mit Wesponde orchestrierst du Instagram DMs, Facebook Nachrichten, WhatsApp
            Business Chats und POS-Daten auf einer zentralen Oberfläche. OAuth-Verbindungen zu
            Meta, plentymarkets, Lightspeed und Co. entstehen in wenigen Klicks.
          </p>
          <p className="mt-4 text-slate-600">
            Unser Team sitzt in Berlin und arbeitet eng mit Pilot-Kund:innen zusammen, um jeden
            Monat neue Automationen zu veröffentlichen.
          </p>
        </div>
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-inner shadow-white/40">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Standort</p>
            <p className="text-base font-semibold text-slate-900">Berlin, Remote-first</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Team</p>
            <p className="text-base font-semibold text-slate-900">
              Produkt, Conversational Design, Partnerships
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Kontakt</p>
            <a
              href="mailto:hello@wesponde.com"
              className="text-base font-semibold text-brand-dark hover:text-brand"
            >
              hello@wesponde.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
