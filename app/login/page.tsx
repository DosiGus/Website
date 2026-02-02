import { Suspense } from "react";
import PartnerLoginForm from "../../components/PartnerLoginForm";

export const metadata = {
  title: "Wesponde Login",
  description:
    "Melde dich mit deiner Wesponde-ID oder via Meta OAuth an, um das Dashboard zu öffnen.",
};

export default function LoginPage() {
  return (
    <section className="mx-auto grid max-w-4xl gap-12 px-4 py-20 lg:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
          Login
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          Zugriff für bestehende Kund:innen.
        </h1>
        <p className="mt-4 text-slate-600">
          Verwende deine Geschäfts-E-Mail oder verbinde deinen Meta-Business-Account via OAuth.
          Nach dem Login wirst du zur App{" "}
          <span className="font-semibold">app.wesponde.com</span> weitergeleitet.
        </p>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Noch kein Zugang?</p>
          <p className="mt-2">
            Unser Success-Team schaltet dich nach einem kurzen Onboarding frei.{" "}
            <a className="font-semibold text-brand-dark hover:text-brand" href="/contact">
              Kontakt aufnehmen
            </a>
            .
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-lg">
            Login wird geladen …
          </div>
        }
      >
        <PartnerLoginForm />
      </Suspense>
    </section>
  );
}
