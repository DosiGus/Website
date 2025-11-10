import type { ReactNode } from "react";

type LegalLayoutProps = {
  title: string;
  description: string;
  lastUpdated?: string;
  children: ReactNode;
};

export default function LegalLayout({
  title,
  description,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 py-24">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div
        className="absolute -top-48 left-1/2 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-brand/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-14rem] left-[8%] -z-10 h-[26rem] w-[26rem] rounded-full bg-brand-light/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-8 py-10 sm:px-12">
            <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              Legal
            </span>
            <h1 className="mt-6 text-3xl font-semibold text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
            {lastUpdated ? (
              <p className="mt-6 text-sm font-medium text-slate-500">
                Zuletzt aktualisiert: {lastUpdated}
              </p>
            ) : null}
          </div>

          <article className="px-8 py-12 text-base leading-7 text-slate-600 sm:px-12 sm:py-14">
            <div className="mx-auto max-w-3xl space-y-12">{children}</div>
          </article>
        </div>
      </div>
    </section>
  );
}
