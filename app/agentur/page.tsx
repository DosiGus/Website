import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  Globe,
  Layers,
  MessageSquare,
  Palette,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Agentur – Wesponde",
  description:
    "Full-Service-Agentur für deutsche Service-Brands: Chat-Automatisierung, Markenidentität, Webentwicklung und Prozessautomatisierung aus einer Hand.",
};

// ─── Data ────────────────────────────────────────────────────────────────────

const services = [
  {
    icon: MessageSquare,
    tag: "Automatisierung",
    title: "Chat-Automatisierung & Marketing",
    description:
      "Wir entwickeln maßgeschneiderte Automatisierungslösungen für WhatsApp und Instagram DM – von gezielten Marketing-Kampagnen bis hin zu vollständigen Buchungs- und Lead-Flows.",
    deliverables: [
      "Instagram & WhatsApp Kampagnen-Flows",
      "Automatisierte Reservierungs- und Terminbuchung",
      "Lead-Generierung & Qualifizierung",
      "FAQ-Bots & Kundensupport-Automatisierung",
      "Kampagnen-Tracking & Performance-Analyse",
    ],
  },
  {
    icon: Palette,
    tag: "Brand & Design",
    title: "Markenidentität & Design",
    description:
      "Von der ersten Skizze bis zum vollständigen Markenauftritt: Wir entwickeln visuelle Systeme, die Ihre Marke klar positionieren und im Gedächtnis bleiben.",
    deliverables: [
      "Logo-Design & Corporate Identity",
      "Farb- & Typografie-System",
      "Design-Guidelines & Markenbuch",
      "Social-Media-Templates",
      "Print- & Digitalvorlagen",
    ],
  },
  {
    icon: Globe,
    tag: "Web & Digital",
    title: "Website & Digitale Präsenz",
    description:
      "Schnelle, moderne Websites und Landing Pages, die konvertieren. Wir entwickeln mit den neuesten Technologien und optimieren von Anfang an für Performance und SEO.",
    deliverables: [
      "Website-Design & Entwicklung",
      "Landing Pages mit hoher Konversionsrate",
      "SEO-Grundoptimierung",
      "CMS-Integration & Redaktionssystem",
      "Performance- & Core Web Vitals Optimierung",
    ],
  },
];

const steps = [
  {
    number: "01",
    title: "Analyse",
    description:
      "Wir verstehen Ihr Business, Ihre Zielgruppe und Ihre aktuellen Herausforderungen. Erst analysieren, dann handeln.",
  },
  {
    number: "02",
    title: "Strategie",
    description:
      "Gemeinsam entwickeln wir einen klaren Fahrplan: Welche Maßnahmen bringen den größten Hebel? Was kommt wann?",
  },
  {
    number: "03",
    title: "Umsetzung",
    description:
      "Unser Team setzt um – mit kurzen Feedback-Schleifen, transparenter Kommunikation und echtem Handwerk.",
  },
  {
    number: "04",
    title: "Launch & Support",
    description:
      "Wir begleiten den Livegang und bleiben danach Ansprechpartner für Optimierungen und neue Anforderungen.",
  },
];

const stats = [
  { value: "50+", label: "Projekte umgesetzt" },
  { value: "3", label: "Leistungsbereiche" },
  { value: "1", label: "Ansprechpartner für alles" },
  { value: "100%", label: "Full-Service aus einer Hand" },
];

const whyUs = [
  {
    icon: Layers,
    title: "Alles aus einer Hand",
    description:
      "Kein Agentur-Hopping mehr. Design, Automatisierung und Web-Entwicklung kommen vom selben Team mit demselben Qualitätsanspruch.",
  },
  {
    icon: TrendingUp,
    title: "Branchenerfahrung",
    description:
      "Wir kennen die Anforderungen von Gastro, Fitness und Beauty-Betrieben – und sprechen Ihre Sprache, nicht die der Agentur-Welt.",
  },
  {
    icon: Clock,
    title: "Schnelle Umsetzung",
    description:
      "Kurze Wege, keine endlosen Abstimmungsrunden. Projekte starten innerhalb von Tagen, nicht Monaten.",
  },
  {
    icon: Users,
    title: "Messbare Ergebnisse",
    description:
      "Wir liefern keine Präsentationen – wir liefern Ergebnisse. Jedes Projekt hat klare KPIs und nachvollziehbare Metriken.",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AgenturPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-[#171923]">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-28 pb-24">
          {/* Gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #ffffff 45%, #2a4ea7 78%, #0a1a55 100%)",
            }}
          />
          {/* Grid */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "100px 100px",
            }}
          />
          {/* Noise */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Badge */}
              <div
                style={{
                  animation: "fadeIn 0.5s ease forwards",
                  opacity: 0,
                  animationDelay: "0s",
                }}
              >
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/20 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2450b2]">
                  <Star className="h-3 w-3" />
                  Wesponde Agentur
                </span>
              </div>

              {/* Headline */}
              <h1
                className="mt-6 text-5xl font-bold leading-[1.1] tracking-tight text-[#171923] sm:text-6xl lg:text-7xl"
                style={{
                  fontFamily: "var(--font-home-display)",
                  animation: "fadeUp 0.7s ease forwards",
                  animationDelay: "0.1s",
                  opacity: 0,
                }}
              >
                Ihre Brand.
                <br />
                <span className="text-[#2450b2]">Unser Handwerk.</span>
              </h1>

              {/* Subheading */}
              <p
                className="mt-6 max-w-xl text-lg leading-relaxed text-[#3d4255]"
                style={{
                  animation: "fadeUp 0.7s ease forwards",
                  animationDelay: "0.25s",
                  opacity: 0,
                }}
              >
                Full-Service-Agentur für Service-Brands, die wirklich wachsen wollen.
                Chat-Automatisierung, Markenidentität und Webentwicklung aus einer Hand –
                ohne Kompromisse.
              </p>

              {/* CTAs */}
              <div
                className="mt-10 flex flex-wrap gap-3"
                style={{
                  animation: "fadeUp 0.7s ease forwards",
                  animationDelay: "0.4s",
                  opacity: 0,
                }}
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#121624] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e2d5a]"
                >
                  Projekt starten
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#leistungen"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/20 bg-white/70 px-6 py-3.5 text-sm font-semibold text-[#1f3f90] transition-colors hover:bg-white"
                >
                  Leistungen entdecken
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
        <section className="border-y border-[#2a4ea7]/10 bg-[#f6f9ff] py-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p
                    className="text-3xl font-bold text-[#2450b2]"
                    style={{ fontFamily: "var(--font-home-display)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-[#67718a]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services Grid ─────────────────────────────────────────────────── */}
        <section id="leistungen" className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div className="mb-14 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2450b2]">
                <Zap className="h-3 w-3" />
                Leistungen
              </span>
              <h2
                className="mt-5 text-4xl font-bold tracking-tight text-[#171923] sm:text-5xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Drei Bereiche.
                <br />
                Ein Team.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[#3d4255]">
                Wir decken alle relevanten Disziplinen ab – vollständig integriert, damit
                Ihre Marke konsistent und professionell auftritt.
              </p>
            </div>

            {/* Cards */}
            <div className="grid gap-6 lg:grid-cols-3">
              {services.map((service, i) => (
                <article
                  key={service.title}
                  className="flex flex-col rounded-2xl border border-[#2a4ea7]/15 bg-white p-8 shadow-[0_4px_16px_rgba(28,53,122,0.04)]"
                  style={{
                    animation: "fadeUp 0.6s ease forwards",
                    animationDelay: `${0.1 + i * 0.1}s`,
                    opacity: 0,
                  }}
                >
                  {/* Icon */}
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2a4ea7]/15 bg-[#f0f4ff] text-[#2450b2]">
                    <service.icon className="h-5 w-5" />
                  </div>

                  {/* Tag */}
                  <span className="mt-5 inline-flex w-fit items-center rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-3 py-1 text-xs font-semibold text-[#2450b2]">
                    {service.tag}
                  </span>

                  {/* Title & description */}
                  <h3 className="mt-4 text-xl font-bold text-[#171923]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#67718a]">
                    {service.description}
                  </p>

                  {/* Deliverables */}
                  <ul className="mt-6 flex flex-col gap-2.5">
                    {service.deliverables.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2450b2]" />
                        <span className="text-sm text-[#3d4255]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process ───────────────────────────────────────────────────────── */}
        <section className="bg-[#f6f9ff] py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div className="mb-16 max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2450b2]">
                <Code2 className="h-3 w-3" />
                Wie wir arbeiten
              </span>
              <h2
                className="mt-5 text-4xl font-bold tracking-tight text-[#171923] sm:text-5xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Vom Brief
                <br />
                zum Launch.
              </h2>
            </div>

            {/* Steps – horizontal stepper */}
            <div className="relative">
              {/* Connecting line (desktop) */}
              <div
                className="absolute top-8 left-0 right-0 hidden h-px lg:block"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, #2a4ea7 20%, #2a4ea7 80%, transparent 100%)",
                  opacity: 0.2,
                  left: "calc(12.5% + 24px)",
                  right: "calc(12.5% + 24px)",
                }}
              />

              <div className="grid gap-10 lg:grid-cols-4 lg:gap-6">
                {steps.map((step) => (
                  <div key={step.number} className="relative flex flex-col">
                    {/* Number circle */}
                    <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2a4ea7]/20 bg-white shadow-[0_4px_16px_rgba(28,53,122,0.08)]">
                      <span
                        className="text-xl font-bold text-[#2450b2]"
                        style={{ fontFamily: "var(--font-home-display)" }}
                      >
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-bold text-[#171923]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#67718a]">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Why Wesponde ──────────────────────────────────────────────────── */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
              {/* Left – copy */}
              <div>
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#2450b2]">
                  Warum Wesponde Agentur?
                </span>
                <h2
                  className="mt-5 text-4xl font-bold tracking-tight text-[#171923] sm:text-5xl"
                  style={{ fontFamily: "var(--font-home-display)" }}
                >
                  Weniger Abstimmung.
                  <br />
                  Mehr Ergebnis.
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-[#3d4255]">
                  Die meisten Unternehmen jonglieren mit drei bis vier verschiedenen Agenturen –
                  und zahlen vor allem für die Zeit, die dabei verloren geht. Wir sind anders.
                </p>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  {whyUs.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-[#2a4ea7]/15 bg-white p-5 shadow-[0_4px_16px_rgba(28,53,122,0.04)]"
                    >
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#2a4ea7]/15 bg-[#f0f4ff] text-[#2450b2]">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <h3 className="mt-3 font-semibold text-[#171923]">{item.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#67718a]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right – accent card */}
              <div className="relative">
                {/* Subtle background shape */}
                <div
                  className="absolute -inset-8 rounded-3xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)",
                  }}
                />

                <div className="relative rounded-3xl border border-[#2a4ea7]/15 bg-white p-8 shadow-[0_8px_40px_rgba(28,53,122,0.08)] sm:p-10">
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7485ad]"
                  >
                    Das sagen unsere Kunden
                  </p>

                  <blockquote className="mt-6">
                    <p className="text-lg font-medium leading-relaxed text-[#171923]">
                      „Endlich eine Agentur, die wirklich versteht, wie unser Betrieb tickt.
                      Die Automatisierung hat uns pro Woche mehrere Stunden Arbeit gespart –
                      und die Website sieht besser aus als je zuvor.&rdquo;
                    </p>
                    <footer className="mt-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2450b2] text-xs font-bold text-white">
                        MK
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#171923]">Marco K.</p>
                        <p className="text-xs text-[#67718a]">Restaurant-Inhaber, München</p>
                      </div>
                    </footer>
                  </blockquote>

                  <div className="mt-8 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-[#2450b2] text-[#2450b2]"
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium text-[#3d4255]">5.0</span>
                  </div>

                  {/* Checklist */}
                  <div className="mt-8 space-y-3 border-t border-[#2a4ea7]/10 pt-8">
                    {[
                      "Schnelle Reaktionszeiten",
                      "Transparente Kommunikation",
                      "Lieferung im Budget",
                      "Langfristige Partnerschaft",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#2450b2]" />
                        <span className="text-sm text-[#3d4255]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ───────────────────────────────────────────────────── */}
        <section className="py-16 pb-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-3xl px-8 py-16 text-center sm:px-16"
              style={{ background: "#0a1a55" }}
            >
              {/* Tag */}
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                <Zap className="h-3 w-3" />
                Bereit loszulegen?
              </span>

              {/* Headline */}
              <h2
                className="mx-auto mt-6 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Starten wir Ihr nächstes Projekt gemeinsam.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
                Erzählen Sie uns von Ihrer Brand und Ihren Zielen. Wir melden uns innerhalb
                von 24 Stunden mit einem ersten Konzept zurück.
              </p>

              {/* Buttons */}
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#0a1a55] transition-colors hover:bg-[#f0f4ff]"
                >
                  Projekt anfragen
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Mehr über uns
                </Link>
              </div>

              {/* Small trust line */}
              <p className="mt-8 text-xs text-white/40">
                Kein Commitment. Erstes Gespräch kostenlos.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
