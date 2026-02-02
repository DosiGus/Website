import Link from "next/link";
import BetaWaitlistForm from "../components/BetaWaitlistForm";
import WatchDemoButton from "../components/WatchDemoButton";

const trustLogos = ["Meta", "Instagram", "WhatsApp", "Lightspeed", "Shore", "orderbird"];

const heroStats = [
  { label: "automatisierte Anfragen", value: "+63%" },
  { label: "schnellere Antwortzeit", value: "3×" },
  { label: "weniger No-Shows", value: "-28%" },
];

const outcomes = [
  {
    value: "+63%",
    label: "mehr Anfragen, die automatisch verarbeitet werden",
    detail: "durch DM-Routing + Vorqualifizierung",
  },
  {
    value: "3×",
    label: "schnellere Antworten auf Instagram & WhatsApp",
    detail: "mit smarten, markengerechten Templates",
  },
  {
    value: "-28%",
    label: "weniger No-Shows",
    detail: "durch Reminder und Bestätigungen",
  },
  {
    value: "+1.2★",
    label: "mehr Google Reviews",
    detail: "automatischer Review-Flow nach dem Besuch",
  },
];

const steps = [
  {
    title: "Kanäle verbinden",
    description:
      "Verbinde Instagram, Facebook und WhatsApp mit wenigen Klicks. Wesponde übernimmt OAuth und Webhooks.",
  },
  {
    title: "Flow konfigurieren",
    description:
      "Baue einen Flow für Reservierungen, Anfragen oder Upsells. Templates + KI helfen beim Start.",
  },
  {
    title: "Automatisch antworten",
    description:
      "Der Bot antwortet, fragt Daten ab, bestätigt Termine und informiert dein Team im Dashboard.",
  },
];

const useCases = [
  {
    title: "Restaurants & Bars",
    scenario: "DM → Tischanfrage → Bestätigung + Reminder",
    outcome: "Mehr Buchungen direkt aus Instagram Stories.",
  },
  {
    title: "Salons & Beauty",
    scenario: "DM → Terminwahl → Upsell (Pflege/Styling)",
    outcome: "Höherer Umsatz pro Termin, weniger No-Shows.",
  },
  {
    title: "Praxen & Kliniken",
    scenario: "DM → Vorqualifizierung → Termin + Infos",
    outcome: "Weniger Telefon, klarere Patienten-Infos.",
  },
  {
    title: "Fitness & Wellness",
    scenario: "DM → Kursbuchung → Follow-up + Review",
    outcome: "Mehr Mitgliedschaften durch schnelle Antworten.",
  },
];

const productActions = [
  {
    tag: "Routing",
    title: "Eingehende DMs automatisch sortieren",
    description: "Wesponde erkennt Absichten und startet den passenden Flow.",
  },
  {
    tag: "Booking",
    title: "Reservierungen & Termine aufnehmen",
    description: "Datum, Uhrzeit, Personenanzahl und Wünsche werden sauber erfasst.",
  },
  {
    tag: "Sync",
    title: "Kalender & POS synchronisieren",
    description: "Termine landen direkt im Kalender oder im POS-System.",
  },
  {
    tag: "Reminder",
    title: "Bestätigungen & Erinnerungen senden",
    description: "Reduziert No-Shows ohne Mehraufwand für dein Team.",
  },
  {
    tag: "Reviews",
    title: "Google Reviews einsammeln",
    description: "Nach dem Besuch automatisch freundlich nach Feedback fragen.",
  },
  {
    tag: "Dashboard",
    title: "Team-Übersicht in einem Dashboard",
    description: "Alle Konversationen, Buchungen und Statusmeldungen zentral.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-sand text-ink">
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(55,105,255,0.35),_transparent_55%),radial-gradient(circle_at_20%_80%,_rgba(199,162,115,0.25),_transparent_45%)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ink via-ink/95 to-black" />
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                Messenger Automation für Service-Brands
              </span>
              <h1 className="font-display text-balance mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Mach aus DMs echte Buchungen.
              </h1>
              <p className="mt-6 text-lg text-white/75">
                Wesponde automatisiert Instagram-, Facebook- und WhatsApp-Chats, bestätigt
                Reservierungen, sendet Reminder und fragt Reviews an – ohne dass dein Team 24/7
                online sein muss.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#beta"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-lg shadow-white/20 transition hover:bg-sand"
                >
                  Beta anfragen
                </a>
                <WatchDemoButton className="border-white/30 text-white" label="Live-Demo ansehen" />
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Partner-Login
                </Link>
              </div>
              <dl className="mt-12 grid gap-6 text-left sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-xs uppercase tracking-[0.2em] text-white/50">
                      {stat.label}
                    </dt>
                    <dd className="mt-2 text-3xl font-semibold text-white">{stat.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-10 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/40">
                {trustLogos.map((logo) => (
                  <span key={logo} className="rounded-full border border-white/10 px-3 py-1">
                    {logo}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
              <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-copper/40 blur-3xl" />
              <div className="relative rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_40px_90px_-60px_rgba(15,17,22,0.8)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-orange-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">Studio Lumi</p>
                      <p className="text-xs text-white/50">Instagram DM</p>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
                    Live
                  </div>
                </div>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/15" />
                    <div className="max-w-[75%] rounded-2xl bg-white/10 px-4 py-3 text-white/80">
                      Hey! Habt ihr heute Abend noch einen Tisch für zwei?
                    </div>
                  </div>
                  <div className="flex items-start justify-end gap-3">
                    <div className="max-w-[75%] rounded-2xl bg-brand px-4 py-3 text-white">
                      Klar! 20:00 Uhr ist frei. Soll ich für dich reservieren?
                    </div>
                    <div className="h-8 w-8 rounded-full bg-brand/70" />
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/15" />
                    <div className="max-w-[75%] rounded-2xl bg-white/10 px-4 py-3 text-white/80">
                      Perfekt, auf Lisa Müller bitte.
                    </div>
                  </div>
                  <div className="flex items-start justify-end gap-3">
                    <div className="max-w-[75%] rounded-2xl bg-white/10 px-4 py-3 text-white/85">
                      Erledigt! Bestätigung + Reminder sind unterwegs. Soll ich nach dem Besuch
                      einen Google-Review anfragen?
                    </div>
                    <div className="h-8 w-8 rounded-full bg-brand/70" />
                  </div>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">
                    Bot-Aktionen
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-white/75">
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span>Reservierung bestätigt</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-brand-light">
                        DONE
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span>Kalender + POS Sync</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-brand-light">
                        SYNC
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <span>Review-Link geplant</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-brand-light">
                        SCHEDULED
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-xs text-white/50">
                  Demo-Flow: Instagram DM → Reservierung → Reminder → Review
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="outcomes" className="relative bg-sand">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(55,105,255,0.08),_transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Ergebnisse
            </p>
            <h2 className="font-display text-balance mt-4 text-3xl font-semibold text-ink sm:text-4xl">
              Dein Team gewinnt Zeit – deine Marke gewinnt Umsatz.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Wesponde übernimmt Routine-Chats, damit du dich auf Service und Wachstum konzentrieren
              kannst.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {outcomes.map((outcome) => (
              <div
                key={outcome.label}
                className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,17,22,0.2)]"
              >
                <p className="text-3xl font-semibold text-ink">{outcome.value}</p>
                <p className="mt-3 text-base font-semibold text-slate-800">{outcome.label}</p>
                <p className="mt-2 text-sm text-slate-500">{outcome.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Workflow
            </p>
            <h2 className="font-display text-balance mt-4 text-3xl font-semibold text-ink">
              Drei Schritte, dann antwortet Wesponde für dich.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[28px] border border-slate-200/70 bg-sand/60 p-6 shadow-[0_15px_40px_-40px_rgba(15,17,22,0.2)]"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Schritt {index + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="relative bg-sand">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_right,_rgba(199,162,115,0.18),_transparent_50%)]" />
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Branchen
            </p>
            <h2 className="font-display text-balance mt-4 text-3xl font-semibold text-ink">
              Playbooks für Service-Betriebe, die über DMs wachsen.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Jede Branche bekommt einen eigenen Flow – optimiert auf typische Anfragen und Upsells.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(15,17,22,0.2)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {useCase.title}
                </p>
                <p className="mt-4 text-base font-semibold text-ink">{useCase.scenario}</p>
                <p className="mt-2 text-sm text-slate-600">{useCase.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Produkt
            </p>
            <h2 className="font-display text-balance mt-4 text-3xl font-semibold text-ink">
              Der Bot übernimmt den Ablauf – dein Team bleibt in Kontrolle.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Von der ersten DM bis zur Review-Anfrage – Wesponde automatisiert die Routine und
              lässt deine Marke persönlich wirken.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {productActions.map((action) => (
              <div
                key={action.title}
                className="flex gap-4 rounded-[28px] border border-slate-200/70 bg-sand/50 p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-[10px] font-semibold uppercase tracking-[0.25em] text-white">
                  {action.tag}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">{action.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{action.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="bg-ink">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-10 text-white shadow-[0_40px_80px_-60px_rgba(15,17,22,0.9)] sm:p-16">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Stimmen aus der Beta
            </p>
            <blockquote className="font-display text-balance mt-6 text-2xl font-semibold leading-snug sm:text-3xl">
              „Wir beantworten jede Instagram-Anfrage automatisch – inklusive Terminbuchung. Das
              spart uns täglich fast zwei Stunden und wir verlieren keine Anfrage mehr.“
            </blockquote>
            <p className="mt-8 text-sm text-white/60">
              Mira Lehmann — Inhaberin, Studio Lumi (Friseur & Kosmetik)
            </p>
          </div>
        </div>
      </section>

      <section id="beta" className="bg-sand">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="grid gap-10 lg:grid-cols-[0.95fr,1.05fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Beta-Warteliste
              </p>
              <h2 className="font-display text-balance mt-4 text-3xl font-semibold text-ink">
                Teste Wesponde als Erste:r.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Wir onboarden jede Woche neue Teams. Du bekommst persönliches Onboarding, Flow-Setup
                und alle Integrationen, die du brauchst.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>• Persönliches Onboarding & Flow-Setup</li>
                <li>• Integration von Meta, WhatsApp und POS-Systemen</li>
                <li>• Dashboard-Zugang für dein Team</li>
              </ul>
            </div>
            <BetaWaitlistForm />
          </div>
        </div>
      </section>

      <section id="cta" className="relative isolate overflow-hidden bg-ink py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,_rgba(55,105,255,0.35),_transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start gap-10 rounded-[32px] border border-white/10 bg-white/5 p-10 text-white shadow-[0_40px_90px_-60px_rgba(15,17,22,0.9)] lg:flex-row lg:items-center lg:justify-between lg:p-16">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                Success-Team
              </p>
              <h3 className="font-display text-balance mt-4 text-3xl font-semibold sm:text-4xl">
                Wir bringen dein Team live – in unter zwei Wochen.
              </h3>
              <p className="mt-4 text-white/70">
                Unser Team unterstützt dich bei Webhooks, Meta OAuth und POS-Verknüpfung. Du bekommst
                klare Playbooks, damit der Bot sofort liefert.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-lg shadow-white/20 transition hover:bg-sand"
              >
                Beratung anfragen
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/50 hover:text-white"
              >
                Partner-Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
