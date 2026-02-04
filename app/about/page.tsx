import { Users, Zap, Heart, MapPin, Mail, Building } from "lucide-react";

export const metadata = {
  title: "Über Wesponde – Unsere Mission",
  description:
    "Erfahre mehr über die Mission von Wesponde: Automatische Antworten für Gastronomiebetriebe auf Instagram, WhatsApp und Facebook.",
};

const values = [
  {
    icon: Zap,
    title: "Schnell",
    description:
      "Fertige Templates und ein Setup-Assistent – du bist in Minuten startklar, nicht in Wochen.",
  },
  {
    icon: Users,
    title: "Einfach",
    description:
      "Keine technischen Kenntnisse nötig. Verbinde deine Social-Media-Kanäle und leg los.",
  },
  {
    icon: Heart,
    title: "Persönlich",
    description:
      "Automatisierte Antworten, die sich anfühlen wie echte Gespräche. Deine Gäste merken keinen Unterschied.",
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
            Wesponde wurde mit der Vision gegründet, Kommunikation zwischen Unternehmen und Kunden
            einfacher, menschlicher und effizienter zu gestalten. Während Service-Teams von manuellen
            Nachrichten überrollt werden, erwarten Gäste sofortige Antworten.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-zinc-400">
            Deshalb kombinieren wir Automatisierung mit persönlicher Ansprache – um Buchungen
            anzunehmen, Fragen zu klären und Kunden zu begeistern.
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
              Automatische Antworten für Gastronomie
            </h2>
            <p className="mt-4 text-zinc-400">
              Wesponde verbindet deine Instagram-, Facebook- und WhatsApp-Kanäle und beantwortet
              Anfragen automatisch. Reservierungen, Öffnungszeiten, Speisekarten – alles läuft
              von selbst.
            </p>
            <p className="mt-4 text-zinc-400">
              Du wählst ein Template, passt es an und bist in Minuten live. Ohne technisches
              Wissen, ohne Wartezeit.
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
