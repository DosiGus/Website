import Link from "next/link";
import PhoneMockup from "../components/PhoneMockup";
import FlowBuilderDemo from "../components/FlowBuilderDemo";
import GoogleReviewsFlow from "../components/GoogleReviewsFlow";
import FaqAccordion from "../components/FaqAccordion";
import HomeTemplateDemoModal from "../components/HomeTemplateDemoModal";
import GoogleCalendarSyncDemo from "../components/GoogleCalendarSyncDemo";
import {
  Star,
  ArrowRight,
  CheckCircle2,
  Workflow,
  Link2,
  Layers,
  Pencil,
  Zap,
  type LucideIcon,
} from "lucide-react";

/* ========================================
   DATA
   ======================================== */

const heroStats = [
  "Kürzere Antwortzeiten",
  "Weniger No-Shows",
  "Mehr Bewertungen",
];

const steps: { step: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    step: "01",
    icon: Link2,
    title: "Verbinden",
    description: "Instagram, Google Kalender und Google Reviews einmalig verknüpfen – in wenigen Minuten.",
  },
  {
    step: "02",
    icon: Layers,
    title: "Flow einrichten",
    description: "Branchentemplate übernehmen oder eigenen Ablauf mit dem Setup-Assistenten aufbauen.",
  },
  {
    step: "03",
    icon: Pencil,
    title: "Anpassen",
    description: "Texte und Antwort-Buttons im visuellen Editor auf Ihren Betrieb zuschneiden – ohne Code.",
  },
  {
    step: "04",
    icon: Zap,
    title: "Live schalten",
    description: "Flow aktivieren, direkt im Browser testen und sofort automatisch auf Anfragen antworten.",
  },
];


const faqs = [
  {
    question: "Für welche Branchen ist Wesponde geeignet?",
    answer:
      "Wesponde eignet sich für Service-Unternehmen mit regelmäßigen Buchungsanfragen über Instagram – vor allem Gastronomie, Beauty & Kosmetik, Fitness sowie Praxen. Entscheidend ist das Anfragevolumen: Ab etwa 20–30 DM-Anfragen pro Woche rechnet sich die Automatisierung spürbar.",
  },
  {
    question: "Wie schnell sind wir live?",
    answer:
      "Der Setup dauert in der Regel 1–3 Werktage – inklusive Instagram-Verknüpfung, Google Kalender-Integration und einem gemeinsamen Testlauf. Sie erhalten einen dedizierten Onboarding-Termin und gehen erst live, wenn alles reibungslos funktioniert.",
  },
  {
    question: "Braucht mein Team technische Kenntnisse?",
    answer:
      "Nein. Flows werden im visuellen Editor per Drag & Drop aufgebaut – ähnlich einem Präsentationstool. Texte, Buttons und Abläufe lassen sich jederzeit ohne Code anpassen. Den initialen Setup begleiten wir vollständig; danach ist Ihr Team selbstständig.",
  },
  {
    question: "Wie werden Übergaben an mein Team geregelt?",
    answer:
      "Sie definieren im Flow, wann eine manuelle Übergabe erfolgen soll – z.B. bei Sonderwünschen oder Beschwerden. Dort stoppt die Automatisierung, und Ihr Team übernimmt direkt im Postfach, mit allen bereits gesammelten Informationen übersichtlich zur Hand.",
  },
  {
    question: "Ist Wesponde DSGVO-konform?",
    answer:
      "Ja. Alle Daten werden ausschließlich auf europäischen Servern gespeichert und verarbeitet. Ein Auftragsverarbeitungsvertrag (AVV) wird auf Anfrage bereitgestellt. Wesponde gibt keine Daten an Dritte weiter und nutzt keinerlei Gesprächsdaten für KI-Training.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Wesponde",
    url: "https://wesponde.com",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "hello@wesponde.com",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Wesponde",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://wesponde.com",
    description:
      "Messenger-Automation für Service-Brands: Reservierungen, Reminder und Bewertungen über Instagram, WhatsApp und Facebook.",
  },
];

/* ========================================
   COMPONENTS
   ======================================== */

export default function HomePage() {
  return (
    <div className="relative bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden">
        {/* Background Effects - reduced blur for mobile performance */}
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/15 blur-[60px] sm:h-[600px] sm:w-[800px] sm:bg-indigo-500/20 sm:blur-[120px]" />
        <div className="absolute right-0 top-1/2 hidden h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px] sm:block" />

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:gap-20">
            {/* Left Content */}
            <div className="max-w-2xl">
              {/* Headline */}
              <h1 className="mt-6 font-display text-3xl font-medium tracking-tight sm:mt-8 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                Premium-Service beginnt bei der ersten Nachricht.
              </h1>

              {/* Subheadline */}
              <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:mt-6 sm:text-lg md:text-xl">
                Wesponde verwandelt Ihren Messenger in einen leistungsstarken Buchungskanal, der Anfragen
                automatisch in bestätigte Termine überführt.
              </p>

              {/* CTA */}
              <div className="mt-10">
                <HomeTemplateDemoModal />
              </div>

              {/* Hero Benefits */}
              <div className="mt-10 flex flex-wrap items-center gap-2 sm:mt-14 sm:gap-3">
                {heroStats.map((stat) => (
                  <span
                    key={stat}
                    className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 backdrop-blur-sm"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" />
                    {stat}
                  </span>
                ))}
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== ABLAUF SECTION ==================== */}
      <section id="ablauf" className="relative overflow-hidden bg-zinc-900/50 py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="absolute left-0 top-1/2 hidden h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px] sm:block" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Ablauf
            </span>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Schnell eingerichtet.<br className="hidden sm:block" /> Dauerhaft wirksam.
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Geführter Setup-Prozess – von der ersten Integration bis zum vollständig automatisierten Betrieb.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  {/* Connector arrow — desktop only */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-2.5 top-9 z-10 hidden h-5 w-5 items-center justify-center lg:flex">
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-600" />
                    </div>
                  )}

                  <div className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:bg-white/[0.09] hover:shadow-2xl hover:shadow-indigo-500/10">
                    {/* Ambient glow — intensifies on hover */}
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-500 opacity-0 blur-2xl transition-all duration-300 group-hover:opacity-25" />

                    <div className="relative">
                      {/* Step number — subtle, monospaced */}
                      <span className="font-mono text-xs font-medium tracking-widest text-zinc-600">
                        {step.step}
                      </span>

                      {/* Icon — glass look */}
                      <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/15">
                        <Icon className="h-5 w-5 text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="mt-4 text-base font-semibold text-white sm:text-lg">
                        {step.title}
                      </h3>

                      {/* Description — one sentence only */}
                      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== GOOGLE CALENDAR SYNC SECTION ==================== */}
      <section id="calendar-sync" className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
        <div className="absolute inset-0 bg-zinc-900/40" />
        <div className="absolute right-0 top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px] sm:block" />
        <div className="absolute left-0 top-0 hidden h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[90px] sm:block" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl sm:mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Google Kalender Sync
            </span>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl">
              Termine werden automatisch{" "}
              <span className="bg-gradient-to-r from-indigo-300 to-white bg-clip-text text-transparent">
                geprüft und synchronisiert
              </span>
            </h2>
            <p className="mt-4 text-base text-zinc-400 sm:text-lg">
              Verbinden Sie Ihren Google Kalender einmalig. Bei jeder Anfrage prüft Wesponde automatisch freie
              Slots, bestätigt passende Zeiten direkt per DM oder schlägt Alternativen vor. Bestätigte Termine
              erscheinen sofort in Ihrem Kalender – ohne manuelle Arbeit.
            </p>
          </div>

          <GoogleCalendarSyncDemo />
        </div>
      </section>

      {/* ==================== GOOGLE REVIEWS SECTION ==================== */}
      <section id="reviews" className="relative py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/30 to-zinc-950" />
        <div className="absolute left-0 top-1/2 hidden h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px] sm:block" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl sm:mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Bewertungsanfrage
            </span>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:mt-6 sm:text-4xl md:text-5xl">
              Google Bewertungen{" "}
              <span className="bg-gradient-to-r from-indigo-300 to-white bg-clip-text text-transparent">
                automatisiert
              </span>
            </h2>
            <p className="mt-3 text-sm text-zinc-400 sm:mt-4 sm:text-lg">
              Nach dem Besuch fragen wir automatisch per DM nach einer Bewertung.
            </p>
          </div>

          <GoogleReviewsFlow />
        </div>
      </section>

      {/* ==================== FLOW BUILDER SECTION ==================== */}
      <section id="flow-builder" className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-zinc-900/30" />
        <div className="absolute right-0 top-1/2 hidden h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px] sm:block" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center sm:mb-16">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-400 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs">
              <Workflow className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Ablauf-Editor
            </span>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:mt-6 sm:text-4xl md:text-5xl">
              Abläufe erstellen in{" "}
              <span className="bg-gradient-to-r from-indigo-300 to-white bg-clip-text text-transparent">
                Minuten
              </span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-400 sm:mt-4 sm:text-lg">
              Visueller Editor für Dialoge. Ohne Code, ohne Aufwand.
            </p>
          </div>

          <FlowBuilderDemo />
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section id="faq" className="relative py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-zinc-900/50" />
        <div className="absolute right-0 top-1/2 hidden h-[400px] w-[400px] translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/8 blur-[100px] sm:block" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr,1.6fr] lg:gap-20">

            {/* Left — sticky heading */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                FAQ
              </span>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
                Häufige<br />Fragen
              </h2>
              <p className="mt-5 text-base leading-relaxed text-zinc-400">
                Alles was Sie wissen müssen, bevor Sie starten — von der Einrichtung über die Integration bis zum Datenschutz.
              </p>
              <div className="mt-8 h-px w-12 bg-white/10" />
              <p className="mt-6 text-sm text-zinc-600">
                {faqs.length} Antworten · Weitere Fragen?
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                Direkt anfragen
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Right — accordion */}
            <div>
              <FaqAccordion faqs={faqs} />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA SECTION ==================== */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        <div className="absolute left-1/2 top-0 hidden h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px] sm:block" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Bereit für automatisierte{" "}
            <span className="bg-gradient-to-r from-indigo-300 to-white bg-clip-text text-transparent">
              Konversationen
            </span>
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-400 sm:mt-6 sm:text-lg">
            Setup, Integrationen und Launch.
          </p>
          <div className="mt-8 sm:mt-10">
            <Link
              href="/login?view=signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 sm:px-8 sm:py-4"
            >
              Jetzt starten
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
