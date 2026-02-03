import Link from "next/link";
import BetaWaitlistForm from "../components/BetaWaitlistForm";
import WatchDemoButton from "../components/WatchDemoButton";
import PhoneMockup from "../components/PhoneMockup";
import FlowBuilderDemo from "../components/FlowBuilderDemo";
import GoogleReviewsFlow from "../components/GoogleReviewsFlow";
import {
  MessageSquare,
  CalendarCheck,
  Bell,
  Star,
  Zap,
  Shield,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Workflow,
} from "lucide-react";

/* ========================================
   DATA
   ======================================== */

const heroStats = [
  { value: "<30s", label: "Antwortzeit", icon: Zap },
  { value: "-28%", label: "No-Shows", icon: CalendarCheck },
  { value: "+41%", label: "Bewertungen", icon: Star },
];

const outcomes = [
  {
    value: "+63%",
    label: "mehr Buchungen aus DMs",
    detail: "Pilotdaten nach 6 Wochen",
    color: "from-indigo-500 to-violet-500",
  },
  {
    value: "3×",
    label: "schnellere Antworten",
    detail: "Instagram, Facebook, WhatsApp",
    color: "from-cyan-500 to-blue-500",
  },
  {
    value: "-28%",
    label: "No-Shows reduziert",
    detail: "Bestätigung + Reminder",
    color: "from-emerald-500 to-teal-500",
  },
  {
    value: "+41%",
    label: "mehr Google Reviews",
    detail: "automatisiert nach dem Besuch",
    color: "from-amber-500 to-orange-500",
  },
];

const features = [
  {
    icon: MessageSquare,
    title: "Quick Replies",
    description: "Vordefinierte Antwort-Buttons für schnelle, strukturierte Konversationen.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: CalendarCheck,
    title: "Automatische Buchung",
    description: "Termine werden direkt im Chat erfasst und bestätigt.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Bell,
    title: "Reminder",
    description: "Automatische Erinnerungen senken No-Shows messbar.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Star,
    title: "Review Automation",
    description: "Nach dem Besuch wird automatisch um eine Bewertung gebeten.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Shield,
    title: "Enterprise-Ready",
    description: "DSGVO-konform, Meta-verifiziert, volle Datentransparenz.",
    gradient: "from-slate-500 to-zinc-500",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Alle Konversationen, Buchungen und Metriken im Dashboard.",
    gradient: "from-cyan-500 to-blue-500",
  },
];

const useCases = [
  {
    industry: "Restaurants & Bars",
    scenario: "DM → Tischanfrage → Bestätigung",
    outcome: "Mehr Reservierungen aus Stories – ohne Zusatzaufwand.",
    icon: "🍽️",
  },
  {
    industry: "Salons & Beauty",
    scenario: "DM → Termin → Zusatzleistung",
    outcome: "Mehr Umsatz pro Termin, weniger Ausfälle.",
    icon: "💇",
  },
  {
    industry: "Praxen & Kliniken",
    scenario: "DM → Vorqualifizierung → Termin",
    outcome: "Weniger Telefon, klar vorbereitete Termine.",
    icon: "🏥",
  },
  {
    industry: "Fitness & Wellness",
    scenario: "DM → Kurs → Follow-up",
    outcome: "Mehr Mitgliedschaften durch schnelle Antworten.",
    icon: "💪",
  },
];

const testimonial = {
  quote:
    "Wir beantworten jede Instagram-Anfrage automatisch – inklusive Terminbuchung. Das spart uns täglich fast zwei Stunden und wir verlieren keine Anfrage mehr.",
  author: "Mira Lehmann",
  role: "Inhaberin, Studio Lumi",
  company: "Friseur & Kosmetik",
};

const steps = [
  {
    step: "01",
    title: "Verbinden",
    description: "Instagram, Facebook und WhatsApp verbinden – wir übernehmen den Setup.",
  },
  {
    step: "02",
    title: "Konfigurieren",
    description: "Templates übernehmen, Wording und Eskalationen finalisieren.",
  },
  {
    step: "03",
    title: "Live schalten",
    description: "Antworten, Buchungen und Reviews laufen stabil – mit Reporting.",
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
      <section className="relative min-h-screen overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-violet-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr,0.9fr] lg:gap-20">
            {/* Left Content */}
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-medium tracking-wide text-zinc-300">
                  Enterprise Messaging für Service-Brands
                </span>
              </div>

              {/* Headline */}
              <h1 className="mt-8 font-display text-5xl font-medium tracking-tight sm:text-6xl lg:text-7xl">
                Aus DMs werden{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                  Buchungen
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg leading-relaxed text-zinc-400 sm:text-xl">
                Wesponde orchestriert Instagram-, Facebook- und WhatsApp-Konversationen, bestätigt
                Reservierungen, sendet Reminder und aktiviert Reviews – konsistent im Markenton.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <WatchDemoButton
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-white/10 transition-all hover:shadow-white/20"
                  label="Demo ansehen"
                />
                <a
                  href="#beta"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10"
                >
                  Pilotzugang anfragen
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="relative">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-500">
                      <stat.icon className="h-3.5 w-3.5" />
                      {stat.label}
                    </div>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-zinc-500">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Meta Business Partner
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  DSGVO-konform
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Enterprise-ready
                </span>
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== OUTCOMES SECTION ==================== */}
      <section id="outcomes" className="relative overflow-hidden bg-zinc-900/50 py-32">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Ergebnisse
            </span>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Messbare Wirkung ab Woche 1
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Mehr Buchungen, weniger No-Shows, bessere Bewertungen – nachvollziehbar im Dashboard.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((outcome, index) => (
              <div
                key={outcome.label}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${outcome.color} opacity-20 blur-2xl transition-opacity group-hover:opacity-30`}
                />
                <div className="relative">
                  <div className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    {outcome.value}
                  </div>
                  <div className="mt-3 text-base font-medium text-white">{outcome.label}</div>
                  <div className="mt-1 text-sm text-zinc-500">{outcome.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="product" className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-zinc-950" />
        <div className="absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Produkt
            </span>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Alles für automatisierte Konversationen
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              Regeln, Tonalität und Eskalationen bleiben transparent – mit klaren Freigaben für dein
              Team.
            </p>
          </div>

          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-8 transition-all hover:border-white/20 hover:bg-zinc-900"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FLOW BUILDER SECTION ==================== */}
      <section id="flow-builder" className="relative overflow-hidden py-32">
        <div className="absolute inset-0 bg-zinc-900/30" />
        <div className="absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Workflow className="h-3.5 w-3.5" />
              Flow Builder
            </span>
            <h2 className="mt-6 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Flows erstellen in{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Minuten
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              Drag & Drop Editor für Konversationsabläufe. Keine Programmierung nötig –
              verbinde Nodes, definiere Quick Replies und geh live.
            </p>
          </div>

          <FlowBuilderDemo />
        </div>
      </section>

      {/* ==================== GOOGLE REVIEWS SECTION ==================== */}
      <section id="reviews" className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/30 to-zinc-950" />
        <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Star className="h-3.5 w-3.5" />
              Review Automation
            </span>
            <h2 className="mt-6 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Google Bewertungen{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                automatisiert
              </span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Nach dem Besuch fragen wir automatisch per DM nach einer Bewertung –
              positive Reviews werden direkt zu Google weitergeleitet.
            </p>
          </div>

          <GoogleReviewsFlow />
        </div>
      </section>

      {/* ==================== USE CASES SECTION ==================== */}
      <section id="use-cases" className="relative overflow-hidden py-32">
        <div className="absolute inset-0 bg-zinc-900/30" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Branchen
            </span>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Branchen-Playbooks mit fertiger Tonalität
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Schneller live – mit Abläufen, die zu Sprache, Service und Upsells passen.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {useCases.map((useCase, index) => (
              <div
                key={useCase.industry}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
                      {useCase.industry}
                    </span>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      {useCase.scenario}
                    </div>
                    <p className="mt-4 text-base text-zinc-300">{useCase.outcome}</p>
                  </div>
                  <span className="text-4xl">{useCase.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WORKFLOW SECTION ==================== */}
      <section id="workflow" className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/30 to-zinc-950" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Ablauf
            </span>
            <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
              In Tagen live, nicht in Monaten
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
              Wir übernehmen Setup, QA und die ersten Abläufe gemeinsam mit deinem Team.
            </p>
          </div>

          <div className="mt-20 grid gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-white/10 bg-zinc-900/50 p-8"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:block">
                    <ArrowRight className="h-6 w-6 text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIAL SECTION ==================== */}
      <section id="testimonials" className="relative overflow-hidden py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="mt-8">
            <p className="font-display text-2xl font-medium leading-relaxed text-white sm:text-3xl lg:text-4xl">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
            <div className="text-left">
              <div className="font-semibold text-white">{testimonial.author}</div>
              <div className="text-sm text-zinc-400">
                {testimonial.role} · {testimonial.company}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== BETA SIGNUP SECTION ==================== */}
      <section id="beta" className="relative py-32">
        <div className="absolute inset-0 bg-zinc-900/50" />
        <div className="absolute left-0 top-0 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Pilotzugang
              </span>
              <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
                Enterprise-Onboarding für ausgewählte Partner
              </h2>
              <p className="mt-4 text-lg text-zinc-400">
                Persönlicher Setup, geprüfte Abläufe, live in unter zwei Wochen.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Persönliches Onboarding & Flow-Setup",
                  "Integration von Meta, WhatsApp und Kassensystemen",
                  "Dashboard-Zugang für dein Team",
                  "Dedicated Success Manager",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <BetaWaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA SECTION ==================== */}
      <section className="relative overflow-hidden py-32">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
        <div className="absolute left-1/2 top-0 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
            Bereit für automatisierte{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Konversationen
            </span>
            ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Setup, Integrationen, QA und Launch-Begleitung – gemeinsam mit deinem Team.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-900 shadow-lg shadow-white/10 transition-all hover:shadow-white/20"
            >
              Ergebnis-Check anfragen
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10"
            >
              Partner-Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
