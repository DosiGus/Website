import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import {
  ArrowRight,
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
import GoogleReviewsFlow from "../../components/GoogleReviewsFlow";
import GoogleCalendarSyncDemo from "../../components/GoogleCalendarSyncDemo";
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
      className={`${display.variable} ${sans.variable} relative overflow-hidden bg-[#f4efe7] text-[#171923]`}
      style={{ fontFamily: "var(--font-home-sans)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(61,94,255,0.14),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(9,167,132,0.12),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.72),transparent_30%)]" />

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
              Anfragen automatisch in bestätigte Termine überführt.
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
                Mehr über Wesponde
                <ArrowRight className="h-4 w-4" />
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

      <section id="ablauf" className="relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4c546f]">Ablauf</p>
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
                  className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="font-mono text-xs font-semibold tracking-widest text-[#5e6580]">{item.step}</p>
                  <div className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#10131f] text-white">
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

      <section id="flow-builder" className="relative bg-[#121625] py-16 text-white sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(42,99,255,0.22),transparent_36%),radial-gradient(circle_at_100%_100%,rgba(13,162,127,0.2),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
              <Workflow className="h-3.5 w-3.5" />
              Flow Builder
            </span>
            <h2
              className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Visuell bauen, Abläufe in Minuten erstellen.
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
              Starten Sie mit einer Vorlage und passen Sie Inhalte und Logik jederzeit flexibel an.
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-black/20 p-2 sm:p-4">
            <FlowBuilderDemo />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(61,94,255,0.14),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(9,167,132,0.12),transparent_38%),linear-gradient(to_bottom,rgba(255,255,255,0.72),transparent_30%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:gap-10 lg:px-8">
          <article className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_12px_34px_rgba(0,0,0,0.08)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4d5773]">Kalender Sync</p>
            <h3
              className="mt-3 text-3xl font-semibold tracking-tight text-[#141724]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Verfügbarkeit automatisch prüfen
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#46506a] sm:text-base">
              Freie Slots prüfen, passende Zeit bestätigen und direkt im Kalender eintragen.
            </p>
            <div className="mt-6 rounded-2xl border border-black/10 bg-[#111827] p-3">
              <GoogleCalendarSyncDemo />
            </div>
          </article>

          <article className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_12px_34px_rgba(0,0,0,0.08)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4d5773]">Bewertungen</p>
            <h3
              className="mt-3 text-3xl font-semibold tracking-tight text-[#141724]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Feedback nach dem Besuch anstoßen
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#46506a] sm:text-base">
              Nach dem Termin automatisch freundlich nach einer Google-Bewertung fragen.
            </p>
            <div className="mt-6 rounded-2xl border border-black/10 bg-[#111827] p-3">
              <GoogleReviewsFlow />
            </div>
          </article>
        </div>
      </section>

      <section id="faq" className="bg-[#101420] py-16 text-white sm:py-20 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">FAQ</p>
            <h2
              className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              Häufige Fragen
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
              Alles Wichtige zu Setup, Anpassung und Betrieb in einer kompakten Übersicht.
            </p>

            <div className="mt-8 max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <p className="text-sm font-semibold text-white">Noch Fragen offen?</p>
              <p className="mt-1 text-xs text-slate-400">
                E-Mail eintragen und direkt Kontakt aufnehmen.
              </p>
              <form action="/contact" className="mt-3 flex flex-col gap-2">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Ihre E-Mail-Adresse"
                  className="w-full rounded-xl border border-white/15 bg-[#0f1320] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#11141e] transition-colors hover:bg-slate-100"
                >
                  Kontakt aufnehmen
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-2 sm:px-8">
            <FaqAccordion faqs={faqs} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(42,99,255,0.18),transparent_34%)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2
            className="text-4xl font-semibold tracking-tight text-[#11131a] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Wenn die erste Nachricht sitzt, wirkt der ganze Betrieb souveräner.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-[#434c64] sm:text-base">
            Starte mit einer Vorschau, optimiere deinen ersten Flow und gehe anschließend live.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/login?view=signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[#121624] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Jetzt starten
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
