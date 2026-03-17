import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  Link2,
  Pencil,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import PhoneMockup from "../../components/PhoneMockup";
import FlowBuilderDemo from "../../components/FlowBuilderDemo";
import SolutionStats from "../../components/SolutionStats";
import IntegrationsStickyScroll from "../../components/IntegrationsStickyScroll";
import FaqAccordion from "../../components/FaqAccordion";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-home-display",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-home-sans",
});

const heroStats = [
  "In wenigen Klicks eingerichtet",
  "Mehr bestätigte Termine",
  "Geringere No-Show-Rate",
];

const steps: { step: string; icon: LucideIcon; title: string; description: string }[] = [
  {
    step: "01",
    icon: Link2,
    title: "Kanäle verbinden",
    description: "Instagram und Kalender einmal koppeln. Danach läuft alles im Hintergrund.",
  },
  {
    step: "02",
    icon: Layers,
    title: "Flow auswählen",
    description: "Mit einem Branchentemplate starten oder den Setup-Assistenten nutzen.",
  },
  {
    step: "03",
    icon: Pencil,
    title: "Ton & Inhalte anpassen",
    description: "Texte und Antwort-Buttons im visuellen Editor auf Ihren Betrieb zuschneiden.",
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
    question: "Für wen ist Wesponde gedacht?",
    answer:
      "Für Teams, die regelmäßig Anfragen über Instagram bekommen und weniger manuell beantworten wollen. Besonders gut passt es für Gastronomie, Beauty, Fitness und Praxen.",
  },
  {
    question: "Wie schnell können wir starten?",
    answer:
      "In der Regel innerhalb weniger Tage. Nach der Verbindung der Kanäle und einem kurzen gemeinsamen Test kann der Flow live gehen.",
  },
  {
    question: "Können wir später alles ändern?",
    answer:
      "Ja. Inhalte, Buttons und Regeln kannst du jederzeit im visuellen Editor anpassen, ohne Entwicklungsteam.",
  },
  {
    question: "Was passiert bei Sonderfällen?",
    answer:
      "Du definierst klare Übergaben an dein Team. Wenn ein Fall nicht automatisch gelöst werden soll, wird die Konversation sauber übergeben.",
  },
  {
    question: "Wie werden Übergaben geregelt?",
    answer:
      "Im Flow lässt sich genau festlegen, wann die Automatisierung stoppt und eine manuelle Übernahme erfolgt - zum Beispiel bei Sonderwünschen oder Beschwerden.",
  },
  {
    question: "Ist Wesponde DSGVO-konform?",
    answer:
      "Ja. Daten werden auf europäischen Servern verarbeitet, und auf Anfrage stellen wir einen AVV bereit.",
  },
];


export default function HomePageV2() {
  return (
    <div
      className={`${display.variable} ${sans.variable} relative bg-[#f4efe7] text-[#171923]`}
      style={{ fontFamily: "var(--font-home-sans)" }}
    >

      {/* ── White ray background: hero → ablauf → flow-builder ── */}
      <div className="relative bg-white">
        {/* Soft vertical light rays */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-[4%] h-[3000px] w-[260px] -rotate-[7deg] rounded-full bg-sky-200/55 blur-[90px]" />
          <div className="absolute -top-24 left-[28%] h-[2800px] w-[210px] rotate-[4deg] rounded-full bg-sky-300/40 blur-[80px]" />
          <div className="absolute -top-32 left-[54%] h-[2900px] w-[240px] rotate-[8deg] rounded-full bg-blue-200/45 blur-[85px]" />
          <div className="absolute -top-20 right-[5%] h-[2600px] w-[190px] -rotate-[5deg] rounded-full bg-sky-100/50 blur-[75px]" />
        </div>

      <section id="home" className="relative border-b border-black/10">

        <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-24 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-32">
          <div>
            <h1
              className="mt-7 text-5xl font-semibold leading-[0.95] tracking-tight text-[#11131a] sm:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Premium-Service beginnt bei der ersten Nachricht.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#3d4255] sm:text-lg">
              Wesponde verwandelt Ihren Messenger in einen leistungsstarken Buchungskanal, der
              Anfragen automatisch beantwortet und in bestätigte Termine überführt.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl bg-[#121624] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Demo testen
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-black/20 px-5 py-3 text-sm font-semibold text-[#1d2130] transition-colors hover:bg-black/5"
              >
                Kostenlos starten
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-2.5">
              {heroStats.map((stat) => (
                <span
                  key={stat}
                  className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/70 px-4 py-1.5 text-[11px] font-normal tracking-[0.08em] text-[#4b5062]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#4b5062]" />
                  {stat}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[#2a63ff]/20 blur-2xl" />
            <div className="absolute -bottom-8 right-4 h-24 w-24 rounded-full bg-[#0da27f]/20 blur-2xl" />
            <div className="relative p-1">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      <section id="ablauf" className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-[0.32] [background-image:linear-gradient(rgba(42,78,167,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(42,78,167,0.06)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <div className="flex items-center gap-4">
              <span className="h-px w-16 bg-[#7d9be2]" />
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#3159bb]">
                Ablauf
              </p>
            </div>
            <h2
              className="mt-3 text-4xl font-semibold tracking-tight text-[#11131a] sm:text-5xl"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Schnell eingerichtet - Dauerhaft wirksam
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.step}
                  className="rounded-2xl border border-white/55 bg-white/46 p-5 shadow-[0_12px_34px_rgba(28,53,122,0.08),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 hover:bg-white/54"
                >
                  <p className="font-mono text-xs font-semibold tracking-widest text-[#5e6580]">{item.step}</p>
                  <div className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/40 text-[#1f3f90] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[#161a27]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#4b5268]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="flow-builder" className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-[0.32] [background-image:linear-gradient(rgba(42,78,167,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(42,78,167,0.06)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <div className="flex items-center gap-4">
              <span className="h-px w-16 bg-[#7d9be2]" />
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#3159bb]">
                Flow Builder
              </p>
            </div>
            <h2
              className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-[#11131a] sm:text-5xl"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Visuell bauen und Abläufe in Minuten erstellen.
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-[#46506a] sm:text-base">
              Starten Sie mit einer Vorlage und passen Sie Inhalte und Logik jederzeit flexibel an.
            </p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/35 p-2 sm:p-4">
            <FlowBuilderDemo theme="light" />
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <IntegrationsStickyScroll />
        </div>
      </section>

      <section className="relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-start lg:gap-16">
            <div className="mx-auto w-full max-w-[360px] lg:max-w-none">
              <div className="flex items-center gap-4">
                <span className="h-px w-16 bg-[#7d9be2]" />
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#3159bb]">
                  Solutions
                </p>
              </div>
              <p className="mt-8 max-w-[280px] font-mono text-[16px] leading-[1.6] text-[#2450b2]">
                Wesponde automatisiert die häufigsten Kundenanfragen – von der ersten Nachricht
                bis zum bestätigten Termin.
              </p>
            </div>

            <SolutionStats />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
<div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2
            className="bg-[linear-gradient(135deg,#6b8fd6_0%,#3461be_55%,#1a3590_100%)] bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Premium-Service beginnt bei der ersten Nachricht.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#4975c3] sm:text-lg">
            Bereit für automatisierte Konversationen?
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/login?view=signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[#2a4ea7]/25 bg-white/80 px-6 py-3 text-sm font-semibold text-[#1f3f90] transition-colors hover:bg-white"
            >
              Jetzt starten
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
      </div>{/* end white ray wrapper */}

      <section id="faq" className="border-t border-[#2e4da8]/20 bg-[#edf1f8] py-16 text-[#173983] sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4c546f]">FAQ</p>
            <h2
              className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Häufige Fragen
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#434c64] sm:text-base">
              Alles Wichtige zu Setup, Anpassung und Betrieb in einer kompakten Übersicht.
            </p>

            <div className="mt-8 max-w-md rounded-2xl border border-[#2a4ea7]/15 bg-white/72 p-4 shadow-[0_10px_30px_rgba(28,53,122,0.06)] sm:p-5">
              <p className="text-sm font-semibold text-[#1f3f90]">Noch Fragen offen?</p>
              <p className="mt-1 text-xs text-[#5a6f9e]">
                Melde dich gerne direkt bei uns – wir helfen schnell und unkompliziert weiter.
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

          <div className="rounded-3xl border border-[#2a4ea7]/14 bg-white/72 px-5 py-2 shadow-[0_12px_34px_rgba(28,53,122,0.06)] sm:px-8">
            <FaqAccordion faqs={faqs} />
          </div>
        </div>
      </section>
    </div>
  );
}
