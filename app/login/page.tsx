import { Suspense } from "react";
import Link from "next/link";
import PartnerLoginForm from "../../components/PartnerLoginForm";
import { ArrowRight, Shield, Zap, HeadphonesIcon } from "lucide-react";

export const metadata = {
  title: "Wesponde Login – Partner-Zugang",
  description:
    "Melde dich mit deiner Wesponde-ID oder via Meta OAuth an, um das Dashboard zu öffnen.",
};

const features = [
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

export default function LoginPage() {
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
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Partner-Login
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Zugriff für bestehende Kund:innen
            </h1>
            <p className="mt-4 text-lg text-zinc-400">
              Verwende deine Geschäfts-E-Mail oder verbinde deinen Meta-Business-Account via OAuth.
              Nach dem Login wirst du zur App weitergeleitet.
            </p>

            {/* Features */}
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

            {/* No Access Card */}
            <div className="mt-10 rounded-xl border border-white/10 bg-zinc-900/50 p-6">
              <h3 className="font-semibold text-white">Noch kein Zugang?</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Unser Success-Team schaltet dich nach einem kurzen Onboarding frei.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Kontakt aufnehmen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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
