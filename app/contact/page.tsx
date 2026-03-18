import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Kontakt & Support — Wesponde",
  description:
    "Brauche Hilfe bei deiner Wesponde-Integration oder möchtest du Pilotzugang? Unser Team antwortet schnell.",
};

const contactInfo = [
  {
    icon: Mail,
    label: "E-Mail",
    value: "support@wesponde.com",
    href: "mailto:support@wesponde.com",
  },
  {
    icon: Phone,
    label: "Telefon",
    value: "+49 (0) 30 1234567",
    href: "tel:+49301234567",
  },
  {
    icon: MapPin,
    label: "Adresse",
    value: "Musterstraße 1, 10115 Berlin",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f4efe7] pt-24">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Info */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#2450b2]">
              Support
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-[#171923] sm:text-4xl">
              Fragen zur Integration? Wir unterstützen persönlich.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#3d4255]">
              Unser Success-Team hilft bei Messenger-Verbindungen, Kassensystemen und dem
              Ablauf-Design. Schreib uns – wir melden uns in der Regel innerhalb eines Werktags.
            </p>

            {/* Contact Info Cards */}
            <div className="mt-10 space-y-4">
              {contactInfo.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 rounded-xl border border-[#2a4ea7]/15 bg-white/70 p-4"
                >
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

            {/* FAQ Link */}
            <div className="mt-8 rounded-xl border border-[#2a4ea7]/15 bg-white/70 p-6">
              <h3 className="font-semibold text-[#171923]">Häufige Fragen?</h3>
              <p className="mt-2 text-sm text-[#67718a]">
                In unseren Insights findest du Playbooks und Best Practices für die häufigsten
                Anwendungsfälle.
              </p>
              <a
                href="/blog"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#2450b2] transition-colors hover:text-[#173983]"
              >
                Zu den Insights
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="rounded-2xl border border-[#2a4ea7]/15 bg-white p-6 shadow-[0_10px_30px_rgba(28,53,122,0.06)] sm:p-8">
            <form className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#35508f]">Vollständiger Name</label>
                <input
                  className="mt-2 w-full rounded-xl border border-[#2a4ea7]/20 bg-white px-4 py-3 text-[#171923] placeholder-[#9aa3b8] transition-colors focus:border-[#2a4ea7] focus:outline-none focus:ring-2 focus:ring-[#2a4ea7]/15"
                  placeholder="Vor- und Nachname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#35508f]">Geschäfts-E-Mail</label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-[#2a4ea7]/20 bg-white px-4 py-3 text-[#171923] placeholder-[#9aa3b8] transition-colors focus:border-[#2a4ea7] focus:outline-none focus:ring-2 focus:ring-[#2a4ea7]/15"
                  placeholder="team@restaurant.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#35508f]">Branche</label>
                <select className="mt-2 w-full appearance-none rounded-xl border border-[#2a4ea7]/20 bg-white px-4 py-3 text-[#171923] transition-colors focus:border-[#2a4ea7] focus:outline-none focus:ring-2 focus:ring-[#2a4ea7]/15">
                  <option value="">Bitte auswählen</option>
                  <option>Restaurant & Bar</option>
                  <option>Friseur & Beauty</option>
                  <option>Spa & Wellness</option>
                  <option>Medizin & Praxis</option>
                  <option>Fitness & Coaching</option>
                  <option>Andere Dienstleistung</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#35508f]">Nachricht</label>
                <textarea
                  className="mt-2 w-full resize-none rounded-xl border border-[#2a4ea7]/20 bg-white px-4 py-3 text-[#171923] placeholder-[#9aa3b8] transition-colors focus:border-[#2a4ea7] focus:outline-none focus:ring-2 focus:ring-[#2a4ea7]/15"
                  placeholder="Wie können wir helfen?"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                className="group w-full rounded-xl bg-[#121624] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1e2d5a] focus:outline-none focus:ring-2 focus:ring-[#2a4ea7] focus:ring-offset-2"
              >
                <span className="flex items-center justify-center gap-2">
                  Anfrage senden
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <p className="text-center text-xs text-[#7a8aaf]">
                Mit dem Absenden akzeptierst du unsere{" "}
                <a
                  className="font-medium text-[#2450b2] underline underline-offset-2 transition-colors hover:text-[#173983]"
                  href="/privacy"
                >
                  Datenschutzerklärung
                </a>
                .
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
