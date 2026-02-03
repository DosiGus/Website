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
    <section className="relative min-h-screen bg-zinc-950 pt-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-dark opacity-50" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
          {/* Header */}
          <div className="border-b border-white/10 bg-zinc-900/80 px-8 py-10 sm:px-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Legal
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">{description}</p>
            {lastUpdated ? (
              <p className="mt-6 text-sm font-medium text-zinc-500">
                Zuletzt aktualisiert: {lastUpdated}
              </p>
            ) : null}
          </div>

          {/* Content */}
          <article className="px-8 py-12 sm:px-12 sm:py-14">
            <div className="prose prose-invert prose-zinc mx-auto max-w-3xl prose-headings:font-display prose-headings:font-medium prose-headings:text-white prose-p:text-zinc-400 prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300 prose-strong:text-white prose-ul:text-zinc-400 prose-ol:text-zinc-400 prose-li:marker:text-zinc-600">
              {children}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
