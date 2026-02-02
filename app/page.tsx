import Link from "next/link";
import BetaWaitlistForm from "../components/BetaWaitlistForm";
import WatchDemoButton from "../components/WatchDemoButton";

const logoClassName = "h-6 w-auto text-white/60";

const trustLogos = [
  {
    name: "Meta",
    svg: (
      <svg viewBox="0 0 80 24" className={logoClassName} role="img" aria-label="Meta">
        <title>Meta</title>
        <text
          x="0"
          y="16"
          fill="currentColor"
          fontSize="12"
          fontFamily="var(--font-body)"
          letterSpacing="0.28em"
        >
          META
        </text>
      </svg>
    ),
  },
  {
    name: "Instagram",
    svg: (
      <svg viewBox="0 0 140 24" className={logoClassName} role="img" aria-label="Instagram">
        <title>Instagram</title>
        <defs>
          <linearGradient id="igGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f09433" />
            <stop offset="0.5" stopColor="#e6683c" />
            <stop offset="1" stopColor="#bc2a8d" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="4" width="16" height="16" rx="5" stroke="url(#igGradient)" strokeWidth="1.6" fill="none" />
        <circle cx="9.5" cy="12" r="4" stroke="url(#igGradient)" strokeWidth="1.6" fill="none" />
        <circle cx="14.5" cy="7.5" r="1.2" fill="url(#igGradient)" />
        <text
          x="26"
          y="16"
          fill="currentColor"
          fontSize="12"
          fontFamily="var(--font-body)"
          letterSpacing="0.18em"
        >
          INSTAGRAM
        </text>
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    svg: (
      <svg viewBox="0 0 150 24" className={logoClassName} role="img" aria-label="WhatsApp">
        <title>WhatsApp</title>
        <circle cx="10" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M6.5 18.5l-1.8 4 4-1.6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M8.2 9.8c1.4 2.2 3.8 3.6 5.8 4.2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <text
          x="24"
          y="16"
          fill="currentColor"
          fontSize="12"
          fontFamily="var(--font-body)"
          letterSpacing="0.16em"
        >
          WHATSAPP
        </text>
      </svg>
    ),
  },
  {
    name: "Lightspeed",
    svg: (
      <svg viewBox="0 0 150 24" className={logoClassName} role="img" aria-label="Lightspeed">
        <title>Lightspeed</title>
        <circle cx="10" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M10 7l-3 6h4l-1 4 4-7h-4l0-3z"
          fill="currentColor"
        />
        <text
          x="24"
          y="16"
          fill="currentColor"
          fontSize="12"
          fontFamily="var(--font-body)"
          letterSpacing="0.14em"
        >
          LIGHTSPEED
        </text>
      </svg>
    ),
  },
  {
    name: "Shore",
    svg: (
      <svg viewBox="0 0 100 24" className={logoClassName} role="img" aria-label="Shore">
        <title>Shore</title>
        <path
          d="M3 10c3 2 6 2 9 0s6-2 9 0"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M3 14c3 2 6 2 9 0s6-2 9 0"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <text
          x="30"
          y="16"
          fill="currentColor"
          fontSize="12"
          fontFamily="var(--font-body)"
          letterSpacing="0.2em"
        >
          SHORE
        </text>
      </svg>
    ),
  },
  {
    name: "orderbird",
    svg: (
      <svg viewBox="0 0 120 24" className={logoClassName} role="img" aria-label="orderbird">
        <title>orderbird</title>
        <path
          d="M5 13c3-4 6-4 9 0 3-4 6-4 9 0"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="5" cy="13" r="1" fill="currentColor" />
        <text
          x="30"
          y="16"
          fill="currentColor"
          fontSize="12"
          fontFamily="var(--font-body)"
          letterSpacing="0.12em"
        >
          ORDERBIRD
        </text>
      </svg>
    ),
  },
];

const heroStats = [
  { label: "Antwortzeit", value: "< 30s" },
  { label: "No-Shows", value: "-28%" },
  { label: "Reviews", value: "+41%" },
];

const outcomes = [
  {
    value: "+63%",
    label: "mehr Buchungen aus DMs",
    detail: "Pilotdaten nach 6 Wochen",
  },
  {
    value: "3×",
    label: "schnellere Antworten",
    detail: "Instagram, Facebook, WhatsApp",
  },
  {
    value: "-28%",
    label: "No-Shows reduziert",
    detail: "Bestätigung + Reminder",
  },
  {
    value: "+41%",
    label: "mehr Google Reviews",
    detail: "automatisiert nach dem Besuch",
  },
];

const steps = [
  {
    title: "Verbinden",
    description: "Kanäle verbinden, OAuth inklusive.",
  },
  {
    title: "Ablauf definieren",
    description: "Templates übernehmen, Tonalität anpassen.",
  },
  {
    title: "Live schalten",
    description: "Antworten, Buchungen und Reviews laufen zuverlässig.",
  },
];

const useCases = [
  {
    title: "Restaurants & Bars",
    scenario: "DM → Tischanfrage → Bestätigung",
    outcome: "Mehr Reservierungen aus Stories.",
  },
  {
    title: "Salons & Beauty",
    scenario: "DM → Termin → Zusatzleistung",
    outcome: "Mehr Umsatz pro Termin.",
  },
  {
    title: "Praxen & Kliniken",
    scenario: "DM → Vorqualifizierung → Termin",
    outcome: "Weniger Telefon, klare Infos.",
  },
  {
    title: "Fitness & Wellness",
    scenario: "DM → Kurs → Follow-up",
    outcome: "Mehr Mitgliedschaften durch schnelle Antworten.",
  },
];

const productActions = [
  {
    tag: "Routing",
    title: "Anfragen verstehen",
    description: "Startet den passenden Ablauf pro Intent.",
  },
  {
    tag: "Buchung",
    title: "Termine erfassen",
    description: "Datum, Uhrzeit, Personenanzahl – sauber erfasst.",
  },
  {
    tag: "Sync",
    title: "Systeme synchronisieren",
    description: "Kalender und POS automatisch aktuell.",
  },
  {
    tag: "Reminder",
    title: "Erinnerungen senden",
    description: "Bestätigungen reduzieren No-Shows.",
  },
  {
    tag: "Reviews",
    title: "Bewertungen auslösen",
    description: "Review-Flow nach dem Besuch.",
  },
  {
    tag: "Dashboard",
    title: "Team-Übersicht",
    description: "Konversationen und Status zentral.",
  },
];

const actionCards = [
  { title: "Reservierung bestätigt", status: "LIVE" },
  { title: "Reminder 4h vorher", status: "SCHEDULED" },
  { title: "Review-Link vorbereitet", status: "READY" },
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
                Enterprise Messaging für Service-Brands
              </span>
              <h1 className="font-display text-balance mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Aus DMs werden Buchungen.
              </h1>
              <p className="mt-6 text-lg text-white/75">
                Präzise Journeys für Reservierung, Reminder und Reviews – im Ton deiner Marke.
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
              <p className="mt-4 text-xs text-white/45">Pilotdaten aus Teams in der DACH-Region.</p>
              <div className="mt-8 grid grid-cols-2 gap-4 text-white/60 sm:flex sm:flex-wrap sm:items-center sm:gap-6">
                {trustLogos.map((logo) => (
                  <div key={logo.name} className="flex items-center">
                    {logo.svg}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
              <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-copper/40 blur-3xl" />
              <div className="relative mx-auto w-full max-w-[380px] animate-[floatSlow_12s_ease-in-out_infinite]">
                <div className="rounded-[52px] border border-white/15 bg-gradient-to-b from-white/10 to-black/80 p-[6px] shadow-[0_40px_90px_-60px_rgba(15,17,22,0.85)]">
                  <div className="relative overflow-hidden rounded-[46px] bg-[#0f1116]">
                    <div className="absolute left-1/2 top-2 h-6 w-36 -translate-x-1/2 rounded-b-[18px] border border-white/10 bg-black/80" />
                    <div className="flex items-center justify-between px-6 pt-3 text-[11px] text-white/80">
                      <span className="font-semibold tracking-[0.1em]">9:41</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-[2px]">
                          <span className="h-1.5 w-0.5 rounded-full bg-white/70" />
                          <span className="h-2 w-0.5 rounded-full bg-white/70" />
                          <span className="h-2.5 w-0.5 rounded-full bg-white/70" />
                          <span className="h-3 w-0.5 rounded-full bg-white/70" />
                        </div>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                          <path
                            d="M3 9c2.8-3 6.2-4.5 9-4.5S18.2 6 21 9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <path
                            d="M6 12c1.8-2 3.9-3 6-3s4.2 1 6 3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                          />
                          <circle cx="12" cy="15" r="1.2" fill="currentColor" />
                        </svg>
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-5 rounded-sm border border-white/60" />
                          <div className="h-1.5 w-1 rounded-sm bg-white/60" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/70" aria-hidden="true">
                          <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc2a8d] text-white">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                            <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <circle cx="16.5" cy="7.5" r="1" fill="currentColor" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">studio.lumi</p>
                          <p className="text-[11px] text-white/45">Instagram Direct</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-white/60">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                          <path d="M6 8h8l4-3v14l-4-3H6z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
                        </svg>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" fill="none" />
                          <circle cx="12" cy="8" r="1" fill="currentColor" />
                          <path d="M12 11v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-4 px-4 py-4 text-[13px]">
                      <div
                        className="flex items-start gap-2 opacity-0 animate-[messageIn_0.7s_ease_forwards]"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <div className="h-7 w-7 rounded-full bg-white/10" />
                        <div className="max-w-[70%] rounded-2xl bg-white/10 px-3 py-2 text-white/80">
                          Hi! 2 Plätze heute um 20:00?
                        </div>
                      </div>
                      <div
                        className="flex items-start justify-end gap-2 opacity-0 animate-[messageIn_0.7s_ease_forwards]"
                        style={{ animationDelay: "1.1s" }}
                      >
                        <div className="max-w-[70%] rounded-2xl bg-white px-3 py-2 text-ink">
                          20:00 ist frei. Auf welchen Namen?
                        </div>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-copper text-[11px] font-semibold text-white">
                          W
                        </div>
                      </div>
                      <div
                        className="flex items-start gap-2 opacity-0 animate-[messageIn_0.7s_ease_forwards]"
                        style={{ animationDelay: "2s" }}
                      >
                        <div className="h-7 w-7 rounded-full bg-white/10" />
                        <div className="max-w-[70%] rounded-2xl bg-white/10 px-3 py-2 text-white/80">
                          Lisa Müller.
                        </div>
                      </div>
                      <div
                        className="flex items-start justify-end gap-2 opacity-0 animate-[messageIn_0.7s_ease_forwards]"
                        style={{ animationDelay: "2.8s" }}
                      >
                        <div className="max-w-[70%] rounded-2xl bg-white/10 px-3 py-2 text-white/80">
                          Bestätigt. Reminder in 4 Stunden. Fensterplatz ok?
                        </div>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-copper text-[11px] font-semibold text-white">
                          W
                        </div>
                      </div>
                      <div
                        className="flex items-start justify-end gap-2 opacity-0 animate-[messageIn_0.7s_ease_forwards]"
                        style={{ animationDelay: "3.6s" }}
                      >
                        <div className="rounded-2xl bg-white/10 px-4 py-2 text-white/70">
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-[dotPulse_1.2s_ease-in-out_infinite]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-[dotPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0.2s" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-[dotPulse_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0.4s" }} />
                          </span>
                        </div>
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-copper text-[11px] font-semibold text-white">
                          W
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 px-4 py-3">
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/50">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                          <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.4" fill="none" />
                          <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
                          <path d="M15 9l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                        <span>Nachricht senden…</span>
                        <div className="ml-auto flex items-center gap-2 text-white/60">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                          </svg>
                          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                            <path d="M5 19l14-7L5 5l4 7-4 7z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center pb-3 pt-1">
                      <div className="h-1.5 w-28 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 text-xs text-white/75 shadow-[0_20px_50px_-40px_rgba(15,17,22,0.7)] lg:absolute lg:-right-10 lg:bottom-8 lg:mt-0 lg:w-56">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
                  Status
                </p>
                <div className="mt-3 space-y-2">
                  {actionCards.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <span>{item.title}</span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-brand-light">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
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
              Messbare Wirkung ab Woche 1.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Mehr Buchungen, weniger No-Shows, mehr Reviews.
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

      <section id="workflow" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Ablauf
            </p>
            <h2 className="font-display text-balance mt-4 text-3xl font-semibold text-ink">
              In Tagen live, nicht in Monaten.
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
              Branchen-Playbooks mit fertiger Tonalität.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Die Abläufe sind auf typische Anfragen und Upsells optimiert.
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
              Präzise, steuerbar, markentreu.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Regeln, Tonalität und Eskalationen bleiben jederzeit transparent und kontrollierbar.
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
                Pilot-Zugang
              </p>
              <h2 className="font-display text-balance mt-4 text-3xl font-semibold text-ink">
                Enterprise-Onboarding für erste Partner.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Persönlicher Setup, klare Playbooks, Live in unter zwei Wochen.
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
                Wir machen dein Messaging live.
              </h3>
              <p className="mt-4 text-white/70">
                Setup, Integrationen und QA – gemeinsam mit deinem Team.
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
