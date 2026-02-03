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
    <div className="relative min-h-screen bg-zinc-950 pt-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-dark opacity-50" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[100px]" />

      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Info */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Support
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Fragen zur Integration? Wir unterstützen persönlich.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">
              Unser Success-Team hilft bei Messenger-Verbindungen, Kassensystemen und dem
              Ablauf-Design. Schreib uns – wir melden uns in der Regel innerhalb eines Werktags.
            </p>

            {/* Contact Info Cards */}
            <div className="mt-10 space-y-4">
              {contactInfo.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-zinc-900/50 p-4"
                >
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

            {/* FAQ Link */}
            <div className="mt-8 rounded-xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 p-6">
              <h3 className="font-semibold text-white">Häufige Fragen?</h3>
              <p className="mt-2 text-sm text-zinc-400">
                In unseren Insights findest du Playbooks und Best Practices für die häufigsten
                Anwendungsfälle.
              </p>
              <a
                href="/blog"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Zu den Insights
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm sm:p-8">
            {/* Gradient glow effect */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-[60px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-violet-500/10 blur-[60px]" />

            <form className="relative space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Vollständiger Name</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Vor- und Nachname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Geschäfts-E-Mail</label>
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="team@restaurant.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Branche</label>
                <select className="mt-2 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="" className="bg-zinc-900">
                    Bitte auswählen
                  </option>
                  <option className="bg-zinc-900">Restaurant & Bar</option>
                  <option className="bg-zinc-900">Friseur & Beauty</option>
                  <option className="bg-zinc-900">Spa & Wellness</option>
                  <option className="bg-zinc-900">Medizin & Praxis</option>
                  <option className="bg-zinc-900">Fitness & Coaching</option>
                  <option className="bg-zinc-900">Andere Dienstleistung</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">Nachricht</label>
                <textarea
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Wie können wir helfen?"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
              >
                <span className="relative flex items-center justify-center gap-2">
                  Anfrage senden
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <p className="text-center text-xs text-zinc-500">
                Mit dem Absenden akzeptierst du unsere{" "}
                <a
                  className="font-medium text-zinc-400 underline underline-offset-2 transition-colors hover:text-white"
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
