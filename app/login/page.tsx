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
    description: "OAuth 2.0 mit Google, verschlüsselte Verbindungen",
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
  const badgeLabel = isSignup ? "Jetzt testen" : "Partner-Login";
  const heading = isSignup ? "Starte deinen Testzugang" : "Zugriff für bestehende Kund:innen";
  return (
    <div className="min-h-screen bg-[#f4efe7] pt-24">
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Info */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#2450b2]">
              {badgeLabel}
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-[#171923] sm:text-4xl">
              {heading}
            </h1>
            {isSignup ? (
              <>
                <p className="mt-4 text-lg text-[#3d4255]">
                  Melde dich kostenlos an, um unser Produkt zu testen und erste Konversations‑Demos zu sehen.
                </p>

                <div className="mt-10 rounded-xl border border-[#2a4ea7]/15 bg-white/70 p-6">
                  <h3 className="font-semibold text-[#171923]">Fragen zum Testzugang?</h3>
                  <p className="mt-2 text-sm text-[#67718a]">
                    Wir helfen dir beim Einstieg und beantworten deine Fragen.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#2450b2] transition-colors hover:text-[#173983]"
                  >
                    Kontakt aufnehmen
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-lg text-[#3d4255]">
                  Verwende deine Geschäfts‑E‑Mail oder melde dich direkt mit deinem Google‑Konto an.
                  Nach dem Login wirst du zur App weitergeleitet.{" "}
                  <Link href="/login?view=signup" className="text-[#2450b2] underline underline-offset-4 hover:text-[#173983]">
                    Noch kein Zugang? Jetzt testen
                  </Link>
                </p>

                <div className="mt-10 space-y-4">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#2a4ea7]/10 text-[#2a4ea7]">
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#171923]">{feature.title}</h3>
                        <p className="text-sm text-[#67718a]">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-xl border border-[#2a4ea7]/15 bg-white/70 p-6">
                  <h3 className="font-semibold text-[#171923]">Noch kein Zugang?</h3>
                  <p className="mt-2 text-sm text-[#67718a]">
                    Erstelle kostenlos einen Account und starte in wenigen Minuten.
                  </p>
                  <Link
                    href="/login?view=signup"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#2450b2] transition-colors hover:text-[#173983]"
                  >
                    Jetzt registrieren
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
                <div className="flex h-full items-center justify-center rounded-2xl border border-[#2a4ea7]/15 bg-white p-8 shadow-[0_10px_30px_rgba(28,53,122,0.06)]">
                  <div className="flex items-center gap-3 text-[#67718a]">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2a4ea7]/20 border-t-[#2a4ea7]" />
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
