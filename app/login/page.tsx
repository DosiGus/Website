import { Suspense } from "react";
import Link from "next/link";
import PartnerLoginForm from "../../components/PartnerLoginForm";
import { ArrowRight, Shield, Zap, HeadphonesIcon } from "lucide-react";

export const metadata = {
  title: "Wesponde Zugang – Login & Testen",
  description:
    "Login für bestehende Kund:innen oder Testzugang starten.",
};

const loginFeatures = [
  {
    icon: Shield,
    title: "Sicher",
    description: "OAuth 2.0 mit Meta Business, verschlüsselte Verbindungen",
  },
  {
    icon: Zap,
    title: "Schnell",
    description: "Direkter Zugang ohne Wartezeit nach Freischaltung",
  },
  {
    icon: HeadphonesIcon,
    title: "Support",
    description: "Hilfe vom Success-Team bei Fragen",
  },
];

const signupFeatures = [
  {
    icon: Shield,
    title: "Sicher",
    description: "Geschützte Verbindungen und klare Zugriffsrechte",
  },
  {
    icon: Zap,
    title: "Schnell",
    description: "In wenigen Minuten startklar für erste Demos",
  },
  {
    icon: HeadphonesIcon,
    title: "Support",
    description: "Hilfe beim Einstieg, wenn du sie brauchst",
  },
];

export default function LoginPage({ searchParams }: { searchParams: { view?: string } }) {
  const isSignup = searchParams?.view === "signup";
  const features = isSignup ? signupFeatures : loginFeatures;
  const badgeClass = isSignup
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
    : "border-indigo-500/20 bg-indigo-500/10 text-indigo-400";
  const badgeLabel = isSignup ? "Jetzt testen" : "Partner-Login";
  const heading = isSignup ? "Starte deinen Testzugang" : "Zugriff für bestehende Kund:innen";
  return (
    <div className="relative min-h-screen bg-zinc-950 pt-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-dark opacity-50" />
      <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-violet-500/10 blur-[100px]" />

      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Info */}
          <div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${badgeClass}`}>
              {badgeLabel}
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
              {heading}
            </h1>
            {isSignup ? (
              <>
                <p className="mt-4 text-lg text-zinc-400">
                  Melde dich kostenlos an, um unser Produkt zu testen und erste Konversations‑Demos zu sehen.
                </p>

                {/* Fragen Card - direkt unter der Beschreibung bei Signup */}
                <div className="mt-10 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                  <h3 className="font-semibold text-white">Fragen zum Testzugang?</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Wir helfen dir beim Einstieg und beantworten deine Fragen.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                  >
                    Kontakt aufnehmen
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-lg text-zinc-400">
                  Verwende deine Geschäfts‑E‑Mail oder verbinde deinen Meta‑Business‑Account via OAuth.
                  Nach dem Login wirst du zur App weitergeleitet.{" "}
                  <Link href="/login?view=signup" className="text-indigo-400 underline underline-offset-4 hover:text-indigo-300">
                    Noch kein Zugang? Jetzt testen
                  </Link>
                </p>

                {/* Features - nur bei Login */}
                <div className="mt-10 space-y-4">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-400">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                        <p className="text-sm text-zinc-500">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No Access Card - nur bei Login */}
                <div className="mt-10 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
                  <h3 className="font-semibold text-white">Noch kein Zugang?</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Unser Success‑Team schaltet dich nach einem kurzen Onboarding frei.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    Kontakt aufnehmen
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Form */}
          <div>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/50 p-8">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-500" />
                    Login wird geladen...
                  </div>
                </div>
              }
            >
              <PartnerLoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
