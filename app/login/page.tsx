import { Suspense } from "react";
import Link from "next/link";
import PartnerLoginForm from "../../components/PartnerLoginForm";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Wesponde – Login & Registrieren",
  description: "Melde dich an oder erstelle einen kostenlosen Testzugang.",
};

const loginBenefits = [
  "Alle Buchungen und Konversationen auf einen Blick",
  "Termine werden automatisch in den Kalender eingetragen",
  "Google-Bewertungen nach jedem Termin anfordern",
];

const signupBenefits = [
  "Kostenlos starten – kein Risiko, keine Kreditkarte",
  "In wenigen Minuten eingerichtet und live",
  "Voller Zugriff auf alle Features während des Tests",
];

export default function LoginPage({ searchParams }: { searchParams: { view?: string } }) {
  const isSignup = searchParams?.view === "signup";
  const benefits = isSignup ? signupBenefits : loginBenefits;
  const heading = isSignup
    ? "Starte deinen kostenlosen Testzugang"
    : "Willkommen zurück";
  const subheading = isSignup
    ? "Automatisiere deine Kundenkommunikation – in wenigen Minuten startklar."
    : "Melde dich an, um deine Buchungen und Flows zu verwalten.";

  return (
    <div className="min-h-screen pt-[72px]">
      <div className="flex min-h-[calc(100vh-72px)] flex-col lg:flex-row">

        {/* ── Left: Brand Panel ─────────────────────────────────── */}
        <div
          className="relative flex flex-col overflow-hidden px-8 py-10 lg:w-[44%] lg:justify-between lg:px-14 lg:py-16"
          style={{
            background: "linear-gradient(150deg, #06101f 0%, #0c1c4a 45%, #183694 100%)",
          }}
        >
          {/* Dot grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Glow */}
          <div
            className="pointer-events-none absolute -bottom-40 -right-20 h-[480px] w-[480px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #4a80f0 0%, transparent 65%)" }}
          />

          {/* Back link — desktop */}
          <div className="relative hidden lg:block">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/50 transition-colors hover:text-white/80"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Zur Startseite
            </Link>
          </div>

          {/* Mobile: compact brand line */}
          <div className="relative flex items-center justify-between lg:hidden">
            <Link href="/" className="text-lg font-bold tracking-tight text-white">
              Wesponde
            </Link>
            <Link
              href="/"
              className="text-xs font-medium text-white/50 transition-colors hover:text-white/80"
            >
              ← Startseite
            </Link>
          </div>

          {/* Main content */}
          <div className="relative mt-8 lg:mt-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
              {isSignup ? "Kostenlos testen" : "Partner-Login"}
            </div>

            <h1
              className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2rem]"
              style={{ fontFamily: "var(--font-home-display)" }}
            >
              {heading}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/55 lg:text-base">
              {subheading}
            </p>

            <ul className="mt-7 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#6b9cf7]" />
                  <span className="text-sm text-white/75">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom trust line — desktop only */}
          <div className="relative mt-10 hidden border-t border-white/10 pt-8 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["#2a4ea7", "#3d6dd4", "#5a8ae8"].map((c, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full border-2 border-[#0c1c4a]"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <p className="text-xs text-white/40">
                Vertrauen von Restaurants, Salons und Fitnessanbietern
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Form Panel ─────────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center justify-center bg-[#f6f9ff] px-6 py-12 lg:px-12">
          <div className="w-full max-w-md">
            <Suspense
              fallback={
                <div className="flex items-center justify-center rounded-2xl border border-[#2a4ea7]/15 bg-white p-12 shadow-[0_10px_30px_rgba(28,53,122,0.06)]">
                  <div className="flex items-center gap-3 text-[#67718a]">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2a4ea7]/20 border-t-[#2a4ea7]" />
                    <span className="text-sm">Wird geladen…</span>
                  </div>
                </div>
              }
            >
              <PartnerLoginForm />
            </Suspense>

            <p className="mt-6 text-center text-xs text-[#9aa3b8]">
              {isSignup ? (
                <>
                  Bereits ein Konto?{" "}
                  <Link href="/login" className="font-medium text-[#2450b2] transition-colors hover:text-[#173983]">
                    Jetzt einloggen
                  </Link>
                </>
              ) : (
                <>
                  Noch kein Konto?{" "}
                  <Link href="/login?view=signup" className="font-medium text-[#2450b2] transition-colors hover:text-[#173983]">
                    Kostenlos registrieren
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
