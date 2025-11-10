import Link from "next/link";
import BetaWaitlistForm from "../components/BetaWaitlistForm";
import WatchDemoButton from "../components/WatchDemoButton";

const features = [
  {
    title: "Automatische Reservierungen",
    description:
      "Nimm Tische und Termine per Instagram DM, WhatsApp oder Facebook Message entgegen – inklusive Bestätigung und Reminder.",
    icon: "📅",
  },
  {
    title: "Messenger-Integration",
    description:
      "Verbinde Meta Business, WhatsApp API und POS-Systeme per OAuth. Alle Gespräche laufen in einem Dashboard zusammen.",
    icon: "💬",
  },
  {
    title: "AI Conversation Flows",
    description:
      "Erstelle visuelle Journeys für Anfragen, Bestellungen oder Upsells. KI schlägt Antworten vor, dein Team finalisiert sie.",
    icon: "✨",
  },
];

const steps = [
  {
    title: "Verbinde deine Kanäle",
    description:
      "OAuth-Verbindung zu Instagram, Facebook, WhatsApp sowie Lightspeed, Shore, orderbird oder deinem CRM.",
  },
  {
    title: "Baue deinen Flow",
    description:
      "Drag-and-drop Journeys für Reservierungen, Anfragen oder Follow-ups – inklusive KI-Assist, Templates und Variablen.",
  },
  {
    title: "Automatisch antworten lassen",
    description:
      "Wesponde sendet Antworten, synchronisiert Termine mit deinem Kalender und informiert dein Team im Dashboard.",
  },
];

const industries = [
  { title: "Restaurants & Bars", detail: "Tischreservierungen, Wartelisten, Specials" },
  { title: "Salons & Studios", detail: "Terminplanung, No-Show-Reminder, Upsells" },
  { title: "Praxen & Kliniken", detail: "Vorqualifizierung, Intake Forms, Follow-ups" },
  { title: "Wellness & Fitness", detail: "Kursbuchungen, Membership-Infos, Events" },
];

const stats = [
  { label: "anfragen automatisiert", value: "63%", footer: "nach 6 Wochen Beta" },
  { label: "schnellere Antworten", value: "3x", footer: "durch AI-Routing" },
  { label: "No-Shows reduziert", value: "-28%", footer: "dank Reminder Journeys" },
];

export default function HomePage() {
  return (
    <div className="space-y-0">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
        <div
          className="absolute -left-32 top-24 -z-10 h-[26rem] w-[26rem] rounded-full bg-brand/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-24 bottom-0 -z-10 h-[22rem] w-[22rem] rounded-full bg-brand-light/30 blur-3xl"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-6xl px-4 pb-32 pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
                Messenger Automation für Service Brands
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                We respond. You grow.
              </h1>
              <p className="mt-6 text-lg text-slate-200">
                Automatisierte Gespräche für moderne Dienstleistungsunternehmen. Wesponde hilft
                dir, Reservierungen, Buchungen und Kundenkommunikation über Instagram, Facebook
                und WhatsApp zu steuern – einfach, effizient und persönlich.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#beta"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-brand/30 transition hover:bg-brand-light focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Join Beta Waitlist
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:border-brand-light hover:text-brand-light"
                >
                  Login for Partners
                </Link>
                <WatchDemoButton />
              </div>
              <dl className="mt-16 grid gap-8 text-left sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-sm uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </dt>
                    <dd className="mt-2 text-3xl font-semibold text-white">{stat.value}</dd>
                    <p className="mt-1 text-xs text-slate-400">{stat.footer}</p>
                  </div>
                ))}
              </dl>
            </div>
            <div
              id="demo"
              className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-brand/30 backdrop-blur"
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-light">
                Live-Konversation
              </p>
              <div className="mt-4 space-y-4 rounded-2xl bg-white/10 p-4 text-sm">
                <p className="text-slate-200">
                  <span className="font-semibold text-white">Kundin:</span> Hey, habt ihr heute
                  Abend noch einen Tisch für zwei?
                </p>
                <p className="text-slate-200">
                  <span className="font-semibold text-brand-light">Wesponde Bot:</span> Klar! 20:00
                  Uhr wäre frei. Soll ich für dich reservieren?
                </p>
                <p className="text-slate-200">
                  <span className="font-semibold text-white">Kundin:</span> Perfekt, bitte auf
                  Lisa Müller.
                </p>
                <p className="text-slate-200">
                  <span className="font-semibold text-brand-light">Wesponde Bot:</span> Erledigt!
                  Wir sehen uns später – du bekommst gleich eine Bestätigung per WhatsApp.
                </p>
              </div>
              <p className="mt-6 text-xs text-slate-400">
                Demo-Flow mit Instagram DM + Lightspeed POS Sync.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Produkt
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
              Alles, was dein Team für Messenger-Automation braucht.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Drei Kernmodule, die Hand in Hand arbeiten: Automatisierte Reservierungen,
              Messenger-Integrationen und AI-gestützte Dialoge.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-brand/10 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/20"
              >
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-slate-50"
      >
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              Drei Schritte, dann antwortet Wesponde für dich.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-brand/10"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Schritt {index + 1}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
            >
              Start now
            </Link>
            <a
              href="#beta"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-brand hover:text-brand"
            >
              Connect Account
            </a>
          </div>
        </div>
      </section>

      <section id="industries" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Branchen
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              Ob Restaurant, Salon oder Praxis – Wesponde passt sich deinem Business an.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Ausgewählte Journeys pro Vertikal helfen dir, in Tagen statt Wochen live zu gehen.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {industries.map((industry) => (
              <div
                key={industry.title}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-inner shadow-white"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {industry.title}
                </p>
                <p className="mt-3 text-base font-medium text-slate-800">{industry.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/80 p-10 text-white shadow-2xl shadow-brand/20 sm:p-16">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-light">
              Stimmen aus der Beta
            </p>
            <blockquote className="mt-6 text-2xl font-semibold leading-snug sm:text-3xl">
              „Unser Salon beantwortet jetzt jede Instagram-Anfrage automatisch – inklusive
              Terminbuchung. Wir sparen täglich fast zwei Stunden und verlieren keine Anfrage
              mehr.“
            </blockquote>
            <p className="mt-8 text-sm text-slate-300">
              Mira Lehmann — Inhaberin, Studio Lumi (Friseur & Kosmetik)
            </p>
          </div>
        </div>
      </section>

      <section id="beta" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
                Beta-Warteliste
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                Teste Wesponde als Erste:r.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Sichere dir Zugang zur Beta, bevor wir die Warteliste schließen. Wir onboarden
                jede Woche ein neues Restaurant, Studio oder Praxis-Team.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>• Persönliches Onboarding & Flow-Setup</li>
                <li>• OAuth-Integration für Meta & POS-Systeme</li>
                <li>• Zugang zum Partner-Login & Dashboard</li>
              </ul>
            </div>
            <BetaWaitlistForm />
          </div>
        </div>
      </section>

      <section id="cta" className="relative isolate overflow-hidden bg-slate-950 py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand/40 via-brand/20 to-slate-950" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start gap-10 rounded-3xl border border-white/10 bg-slate-950/60 p-10 text-white shadow-2xl shadow-brand/30 lg:flex-row lg:items-center lg:justify-between lg:p-16">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-light">
                Need help integrating your account?
              </p>
              <h3 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Wir antworten – und bringen dein Team live.
              </h3>
              <p className="mt-4 text-slate-200">
                Unser Success-Team unterstützt dich bei Webhooks, Meta OAuth und POS-Verknüpfung.
                Bring deine Automationen in unter zwei Wochen an den Start.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-brand/30 transition hover:bg-brand-light"
              >
                Contact Support
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:border-brand-light hover:text-brand-light"
              >
                Login for Partners
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
