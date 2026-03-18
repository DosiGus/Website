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
    <div className="min-h-screen bg-[#f6f9ff] pt-24">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#2450b2]">
            Unsere Mission
          </span>
          <h1 className="mt-8 font-display text-4xl font-medium tracking-tight text-[#171923] sm:text-5xl">
            &bdquo;Wir glauben, dass großartige Gespräche den Unterschied machen.&ldquo;
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#3d4255]">
            Wesponde wurde mit der Vision gegründet, Kommunikation zwischen Unternehmen und Kunden
            einfacher, menschlicher und effizienter zu gestalten. Während Service-Teams von manuellen
            Nachrichten überrollt werden, erwarten Gäste sofortige Antworten.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[#3d4255]">
            Deshalb kombinieren wir Automatisierung mit persönlicher Ansprache – um Buchungen
            anzunehmen, Fragen zu klären und Kunden zu begeistern.
          </p>
        </div>

        {/* Values */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <div
              key={value.title}
              className="group rounded-2xl border border-[#2a4ea7]/15 bg-white/70 p-6 shadow-[0_4px_16px_rgba(28,53,122,0.04)] transition-all hover:bg-white hover:shadow-[0_8px_24px_rgba(28,53,122,0.08)]"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#2a4ea7]/10 text-[#2a4ea7]">
                <value.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#171923]">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#67718a]">{value.description}</p>
            </div>
          ))}
        </div>

        {/* What we build */}
        <div className="mt-20 grid gap-8 rounded-2xl border border-[#2a4ea7]/15 bg-white/70 p-8 shadow-[0_4px_16px_rgba(28,53,122,0.04)] md:grid-cols-2 lg:p-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7485ad]">
              Was wir bauen
            </span>
            <h2 className="mt-4 font-display text-2xl font-medium text-[#171923] sm:text-3xl">
              Automatische Antworten für Gastronomie
            </h2>
            <p className="mt-4 text-[#3d4255]">
              Wesponde verbindet deine Instagram-, Facebook- und WhatsApp-Kanäle und beantwortet
              Anfragen automatisch. Reservierungen, Öffnungszeiten, Speisekarten – alles läuft
              von selbst.
            </p>
            <p className="mt-4 text-[#3d4255]">
              Du wählst ein Template, passt es an und bist in Minuten live. Ohne technisches
              Wissen, ohne Wartezeit.
            </p>
          </div>

          <div className="space-y-6 rounded-xl border border-[#2a4ea7]/10 bg-[#f8f9fc] p-6">
            {teamInfo.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#2a4ea7]/10 text-[#2a4ea7]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#7485ad]">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-1 text-base font-medium text-[#171923] transition-colors hover:text-[#2450b2]"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-base font-medium text-[#171923]">{item.value}</p>
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
