import Link from "next/link";
import { Check, ArrowRight, ArrowUpRight, Zap, Star, Building2, MessageSquare, Calendar, BarChart3, Users, Headphones, Shield } from "lucide-react";
import FaqAccordion from "../../components/FaqAccordion";

export const metadata = {
  title: "Pricing – Wesponde",
  description:
    "Kostenlos starten, mit Premium skalieren. Transparente Preise für Instagram-, WhatsApp- und Messenger-Automatisierung.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "Für den Einstieg",
    price: "0",
    period: "/ Monat",
    description: "Baue eigene Chat-Flows und verbinde deine Kanäle — ohne Kosten, ohne Kreditkarte.",
    cta: "Kostenlos starten",
    ctaHref: "/app",
    highlighted: false,
    badge: null,
    icon: Zap,
    inherits: null,
    features: [
      { icon: MessageSquare, text: "Instagram DM verbinden" },
      { icon: MessageSquare, text: "WhatsApp verbinden" },
      { icon: MessageSquare, text: "Facebook Messenger verbinden" },
      { icon: Zap, text: "Bis zu 3 aktive Chat-Flows" },
      { icon: Zap, text: "Chat-Flows selbst erstellen" },
      { icon: BarChart3, text: "Basis-Dashboard & Übersicht" },
      { icon: Headphones, text: "Community Support" },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Für wachsende Businesses",
    price: "39",
    period: "/ Monat",
    description: "Templates, Kalender-Sync und automatische Follow-ups — alles, was dein Business braucht um zu skalieren.",
    cta: "14 Tage kostenlos testen",
    ctaHref: "/app",
    highlighted: true,
    badge: "Beliebteste Wahl",
    icon: Star,
    inherits: "Alles aus Free, plus:",
    features: [
      { icon: Star, text: "Branchen-Templates (Gastro, Fitness, Beauty)" },
      { icon: Star, text: "Setup-Assistent: geführte Flow-Erstellung" },
      { icon: Calendar, text: "Google Kalender Sync & Verfügbarkeitsprüfung" },
      { icon: Zap, text: "Automatische Reminder & Follow-up-Sequenzen" },
      { icon: Star, text: "Google Bewertungs-Automation" },
      { icon: Zap, text: "Unbegrenzte aktive Flows" },
      { icon: BarChart3, text: "Erweiterte Analytics & Konversationsauswertung" },
      { icon: Headphones, text: "Prioritäts-Support per E-Mail" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Für anspruchsvolle Betriebe",
    price: null,
    period: null,
    description: "Persönliche Beratung, individuelle Strategie und Fullservice durch die Wesponde Agentur.",
    cta: "Kontakt aufnehmen",
    ctaHref: "/contact",
    highlighted: false,
    badge: null,
    icon: Building2,
    inherits: "Alles aus Premium, plus:",
    features: [
      { icon: Users, text: "Persönliche Beratungstermine" },
      { icon: Building2, text: "Individuelle Strategie-Entwicklung" },
      { icon: Building2, text: "Wesponde Agentur Fullservice" },
      { icon: Zap, text: "Individuelle Flow- & Prozess-Entwicklung" },
      { icon: Shield, text: "Custom API-Integrationen" },
      { icon: Users, text: "Dedizierter Ansprechpartner" },
      { icon: Shield, text: "SLA & Priority Response" },
      { icon: Headphones, text: "Unbegrenzte Kanäle & Standorte" },
    ],
  },
];

const faqs = [
  {
    question: "Kann ich jederzeit kündigen?",
    answer: "Ja. Premium ist monatlich kündbar — keine Mindestlaufzeit, keine versteckten Gebühren. Du kannst jederzeit auf Free downgraden.",
  },
  {
    question: "Was passiert nach den 14 Tagen Test?",
    answer: "Nach der Testphase wechselst du automatisch in den Free-Plan, falls du nicht upgraden möchtest. Deine Flows und Daten bleiben erhalten.",
  },
  {
    question: "Was macht die Wesponde Agentur im Enterprise-Plan genau?",
    answer: "Unser Agentur-Team entwickelt gemeinsam mit dir Automatisierungsstrategien, erstellt individuelle Flows, übernimmt die technische Umsetzung und begleitet dich operativ. Von der ersten Analyse bis zum laufenden Betrieb.",
  },
  {
    question: "Wie funktioniert der Google Kalender Sync?",
    answer: "Du verbindest deinen Google Kalender mit einem Klick. Der Bot prüft dann in Echtzeit freie Slots und trägt bestätigte Reservierungen oder Termine direkt ein — keine manuelle Nacharbeit.",
  },
  {
    question: "Welche Kanäle sind im Free-Plan verfügbar?",
    answer: "Im Free-Plan kannst du Instagram DM, WhatsApp und Facebook Messenger verbinden — alle drei Kanäle, für bis zu 3 aktive Flows.",
  },
  {
    question: "Gibt es Rabatte für jährliche Zahlung?",
    answer: "Ja. Bei jährlicher Abrechnung sparst du 2 Monate — du zahlst effektiv 32 € pro Monat statt 39 €. Wähle beim Checkout einfach die Jahreslizenz.",
  },
];

const trust = [
  { value: "3", label: "Kanäle inklusive", sub: "Instagram, WhatsApp, Messenger" },
  { value: "14", label: "Tage kostenlos", sub: "Premium unverbindlich testen" },
  { value: "∞", label: "Konversationen", sub: "Kein Limit, kein Extra-Preis" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f6f9ff] pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ── Intro ───────────────────────────────────────────────────── */}
        <div
          className="mx-auto max-w-2xl text-center"
          style={{ animation: "fadeInUp 0.5s ease both" }}
        >
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[#2450b2]">
            Pricing
          </span>
          <h1
            className="mt-5 text-4xl font-semibold tracking-tight text-[#171923] sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Einfach. Transparent.{" "}
            <span className="text-[#2450b2]">Kein Kleingedrucktes.</span>
          </h1>
          <p className="mt-4 font-mono text-[15px] leading-relaxed text-[#4c546f]">
            Starte kostenlos und skaliere, wenn dein Business wächst.
            Kündige jederzeit — monatlich, ohne Bindung.
          </p>
        </div>

        {/* ── Trust strip ─────────────────────────────────────────────── */}
        <div
          className="mx-auto mt-8 flex items-center justify-center gap-6"
          style={{ animation: "fadeInUp 0.5s ease 0.1s both" }}
        >
          {trust.map((t) => (
            <div key={t.value} className="flex items-center gap-2">
              <span
                className="text-2xl font-semibold text-[#2450b2]"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                {t.value}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-[#171923]">{t.label}</p>
                <p className="font-mono text-[11px] text-[#7485ad]">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Plans ───────────────────────────────────────────────────── */}
        {/*
          CSS Grid Subgrid: the outer grid defines 6 row tracks.
          Each card spans all 6 rows and uses grid-template-rows: subgrid
          so all cards share the same row heights → buttons align perfectly.
          On mobile (flex-col) subgrid has no effect — stacks normally.
        */}
        <div
          className="mt-12 flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:gap-x-5 lg:gap-y-0"
          style={{ gridTemplateRows: "repeat(6, auto)" }}
        >
          {plans.map((plan, idx) => {
            const Icon = plan.icon;
            const hl = plan.highlighted;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl lg:grid lg:row-span-6 ${
                  hl
                    ? "border border-[#4a72cc]/40"
                    : "border border-[#2a4ea7]/15 bg-white shadow-[0_4px_16px_rgba(28,53,122,0.05)]"
                }`}
                style={{
                  animation: `fadeInUp 0.55s ease ${0.15 + idx * 0.08}s both`,
                  gridTemplateRows: "subgrid",
                  backgroundColor: hl ? "#0a1a55" : undefined,
                }}
              >
                {/* Overlays for highlighted card */}
                {hl && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.15]"
                      style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.04]"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                      }}
                    />
                  </>
                )}

                {/* Row 1 — Badge (spacer for plans without badge) */}
                <div className="relative px-7 pt-8">
                  {plan.badge ? (
                    <span className="inline-flex items-center rounded-xl bg-[#2450b2] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">
                      {plan.badge}
                    </span>
                  ) : (
                    <div className="h-[26px]" />
                  )}
                </div>

                {/* Row 2 — Icon + name */}
                <div className="relative mt-5 flex items-center gap-3 px-7">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: hl ? "rgba(255,255,255,0.1)" : "rgba(36,80,178,0.08)" }}
                  >
                    <Icon className={`h-4 w-4 ${hl ? "text-[#7aaeff]" : "text-[#2450b2]"}`} />
                  </div>
                  <div>
                    <p className={`font-mono text-[11px] uppercase tracking-wider ${hl ? "text-white/50" : "text-[#7485ad]"}`}>
                      {plan.tagline}
                    </p>
                    <p className={`text-lg font-semibold ${hl ? "text-white" : "text-[#171923]"}`}>
                      {plan.name}
                    </p>
                  </div>
                </div>

                {/* Row 3 — Price */}
                <div className="relative mt-6 px-7">
                  {plan.price !== null ? (
                    <>
                      <div className="flex items-end gap-1">
                        <span
                          className={`text-5xl font-semibold ${hl ? "text-white" : "text-[#171923]"}`}
                          style={{ fontFamily: "var(--font-home-display)" }}
                        >
                          {plan.price} €
                        </span>
                        <span className={`mb-1.5 font-mono text-[13px] ${hl ? "text-white/50" : "text-[#7485ad]"}`}>
                          {plan.period}
                        </span>
                      </div>
                      <p className={`mt-1 font-mono text-[11px] ${hl ? "text-white/40" : "text-[#9aa3b8]"}`}>
                        {hl ? "Jährlich: 32 €/Monat — 2 Monate gratis" : "Für immer kostenlos — keine Kreditkarte"}
                      </p>
                    </>
                  ) : (
                    <>
                      <span
                        className="text-5xl font-semibold text-[#171923]"
                        style={{ fontFamily: "var(--font-home-display)" }}
                      >
                        Individuell
                      </span>
                      <p className="mt-1 font-mono text-[11px] text-[#9aa3b8]">
                        Preis nach Scope &amp; Umfang
                      </p>
                    </>
                  )}
                </div>

                {/* Row 4 — Description */}
                <div className="relative mt-4 px-7">
                  <p className={`font-mono text-[13px] leading-relaxed ${hl ? "text-white/60" : "text-[#4c546f]"}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Row 5 — CTA */}
                <div className="relative mt-6 px-7">
                  <Link
                    href={plan.ctaHref}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                      hl
                        ? "bg-white text-[#0a1a55] hover:bg-[#e8efff]"
                        : plan.id === "enterprise"
                        ? "bg-[#171923] text-white hover:bg-[#1e2d5a]"
                        : "border border-[#2a4ea7]/20 bg-white text-[#1f3f90] hover:bg-[#f0f5ff]"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Row 6 — Features */}
                <div className="relative mt-6 px-7 pb-8">
                  <div className={`mb-5 h-px ${hl ? "bg-white/10" : "bg-[#edf1f8]"}`} />
                  {plan.inherits && (
                    <p className={`mb-3 font-mono text-[11px] uppercase tracking-wider ${hl ? "text-white/40" : "text-[#7485ad]"}`}>
                      {plan.inherits}
                    </p>
                  )}
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${hl ? "bg-[#2450b2]" : "bg-[#eef2fb]"}`}>
                          <Check className={`h-3 w-3 ${hl ? "text-white" : "text-[#2450b2]"}`} strokeWidth={3} />
                        </div>
                        <span className={`text-[14px] leading-snug ${hl ? "text-white/70" : "text-[#3d4255]"}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── What's included comparison strip ────────────────────────── */}
        <div
          className="mt-14 overflow-hidden rounded-2xl border border-[#2a4ea7]/12 bg-white shadow-[0_4px_16px_rgba(28,53,122,0.04)]"
          style={{ animation: "fadeInUp 0.55s ease 0.4s both" }}
        >
          <div className="border-b border-[#edf1f8] px-6 py-5 sm:px-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#7485ad]">
              Funktionen im Überblick
            </p>
            <h2
              className="mt-1 text-xl font-semibold text-[#171923]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Was ist in welchem Plan enthalten?
            </h2>
          </div>

          <div className="divide-y divide-[#edf1f8]">
            {[
              { feature: "Instagram, WhatsApp & Facebook Messenger", free: true, premium: true, enterprise: true },
              { feature: "Chat-Flows erstellen", free: true, premium: true, enterprise: true },
              { feature: "Aktive Flows", free: "3", premium: "Unbegrenzt", enterprise: "Unbegrenzt" },
              { feature: "Branchen-Templates", free: false, premium: true, enterprise: true },
              { feature: "Setup-Assistent", free: false, premium: true, enterprise: true },
              { feature: "Google Kalender Sync", free: false, premium: true, enterprise: true },
              { feature: "Automatische Reminder & Follow-ups", free: false, premium: true, enterprise: true },
              { feature: "Google Bewertungs-Automation", free: false, premium: true, enterprise: true },
              { feature: "Erweiterte Analytics", free: false, premium: true, enterprise: true },
              { feature: "Beratungstermine & Strategie", free: false, premium: false, enterprise: true },
              { feature: "Wesponde Agentur Fullservice", free: false, premium: false, enterprise: true },
              { feature: "Dedizierter Ansprechpartner", free: false, premium: false, enterprise: true },
              { feature: "Custom Integrationen", free: false, premium: false, enterprise: true },
            ].map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 items-center px-6 py-3.5 sm:px-8 ${
                  i % 2 === 0 ? "" : "bg-[#fafbff]"
                }`}
              >
                <p className="col-span-1 text-[13px] text-[#3d4255] sm:col-span-1">{row.feature}</p>
                {[row.free, row.premium, row.enterprise].map((val, j) => (
                  <div key={j} className="flex justify-center">
                    {val === true ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eef2fb]">
                        <Check className="h-3 w-3 text-[#2450b2]" strokeWidth={3} />
                      </div>
                    ) : val === false ? (
                      <span className="text-[#d0d5e8]">—</span>
                    ) : (
                      <span className="font-mono text-[12px] text-[#2450b2]">{val}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-4 border-t border-[#edf1f8] bg-[#fafbff] px-6 py-3 sm:px-8">
            <div />
            {["Free", "Premium", "Enterprise"].map((label) => (
              <p key={label} className="text-center font-mono text-[11px] uppercase tracking-wider text-[#7485ad]">
                {label}
              </p>
            ))}
          </div>
        </div>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <div
          className="mt-14"
          style={{ animation: "fadeInUp 0.55s ease 0.5s both" }}
        >
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Left: label + contact card */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4c546f]">FAQ</p>
              <h2
                className="mt-3 text-4xl font-semibold tracking-tight text-[#171923] sm:text-5xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Häufige Fragen
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#434c64] sm:text-base">
                Alles Wichtige zu Plänen, Setup und Abrechnung in einer kompakten Übersicht.
              </p>
              <div className="mt-8 max-w-sm rounded-2xl border border-[#2a4ea7]/15 bg-white/72 p-4 shadow-[0_10px_30px_rgba(28,53,122,0.06)] sm:p-5">
                <p className="text-sm font-semibold text-[#1f3f90]">Noch Fragen offen?</p>
                <p className="mt-1 text-xs text-[#5a6f9e]">
                  Melde dich gerne direkt bei uns — wir helfen schnell und unkompliziert weiter.
                </p>
                <div className="mt-3">
                  <Link
                    href="/contact"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#2a4ea7]/20 bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#1f3f90] transition-colors hover:bg-white"
                  >
                    Kontakt aufnehmen
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: accordion */}
            <div className="text-[#173983]">
              <FaqAccordion faqs={faqs} />
            </div>
          </div>
        </div>

        {/* ── Bottom CTA ──────────────────────────────────────────────── */}
        <div
          className="mt-14 overflow-hidden rounded-2xl"
          style={{ animation: "fadeInUp 0.55s ease 0.6s both" }}
        >
          <div
            className="relative px-8 py-14 text-center sm:px-16"
            style={{ backgroundColor: "#0a1a55" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            />
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7aaeff]">
                Noch Fragen?
              </p>
              <h2
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Nicht sicher, welcher Plan passt?
              </h2>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wir helfen dir in einem kurzen Gespräch, den richtigen Einstieg zu finden —
                kostenlos und unverbindlich.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0a1a55] transition-all hover:bg-[#e8efff]"
                >
                  Jetzt kostenlos starten
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
                >
                  Gespräch vereinbaren
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
