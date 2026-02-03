import { Users, Zap, Heart, MapPin, Mail, Building } from "lucide-react";

export const metadata = {
  title: "Über Wesponde – Unsere Mission",
  description:
    "Erfahre mehr über die Mission von Wesponde: Automatisierte Kommunikation für Restaurants, Salons und Praxen.",
};

const values = [
  {
    icon: Zap,
    title: "Smart",
    description:
      "Wir nutzen KI dort, wo sie echten Mehrwert bringt: bessere Antworten, schnellere Abläufe und klare Entscheidungen.",
  },
  {
    icon: Users,
    title: "Einfach",
    description:
      "Wesponde lässt sich in Minuten mit Meta-Accounts, POS-Systemen und CRMs verbinden – ohne komplexe Implementierung.",
  },
  {
    icon: Heart,
    title: "Serviceorientiert",
    description:
      "Wir bauen Produkte, die Gespräche menschlicher machen. Automatisierung bedeutet für uns mehr Zeit für echte Beratung.",
  },
];

const teamInfo = [
  {
    icon: MapPin,
    label: "Standort",
    value: "Berlin, Remote-first",
  },
  {
    icon: Building,
    label: "Team",
    value: "Produkt, Conversational Design, Partnerships",
  },
  {
    icon: Mail,
    label: "Kontakt",
    value: "hello@wesponde.com",
    href: "mailto:hello@wesponde.com",
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 pt-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-dark opacity-50" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Unsere Mission
          </span>
          <h1 className="mt-8 font-display text-4xl font-medium tracking-tight text-white sm:text-5xl">
            &bdquo;Wir glauben, dass großartige Gespräche den Unterschied machen.&ldquo;
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            Wesponde wurde mit der Vision gegründet, Kommunikation zwischen Unternehmen und
            Kund:innen einfacher, menschlicher und effizienter zu gestalten. Während Service-Teams
            von manuellen Nachrichten überrollt werden, erwarten Gäste sofortige Antworten –
            und zwar in ihren Lieblingsmessengern.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">
            Deshalb kombinieren wir Automatisierung mit persönlicher Ansprache: Von Restaurants
            über Salons bis zu Praxen helfen wir Teams, Buchungen anzunehmen, Fragen zu klären und
            Stammkund:innen zu begeistern – rund um die Uhr.
          </p>
        </div>

        {/* Values */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <value.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{value.description}</p>
            </div>
          ))}
        </div>

        {/* What we build */}
        <div className="mt-20 grid gap-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-8 md:grid-cols-2 lg:p-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Was wir bauen
            </span>
            <h2 className="mt-4 font-display text-2xl font-medium text-white sm:text-3xl">
              Ein Operating System für Service-Unternehmen
            </h2>
            <p className="mt-4 text-zinc-400">
              Mit Wesponde orchestrierst du Instagram DMs, Facebook Nachrichten, WhatsApp
              Business Chats und POS-Daten auf einer zentralen Oberfläche. OAuth-Verbindungen zu
              Meta, plentymarkets, Lightspeed und Co. entstehen in wenigen Klicks.
            </p>
            <p className="mt-4 text-zinc-400">
              Unser Team sitzt in Berlin und arbeitet eng mit Pilot-Kund:innen zusammen, um jeden
              Monat neue Automationen zu veröffentlichen.
            </p>
          </div>

          <div className="space-y-6 rounded-xl border border-white/5 bg-zinc-950/50 p-6">
            {teamInfo.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-1 text-base font-medium text-white transition-colors hover:text-indigo-400"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-base font-medium text-white">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
