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
    <section className="min-h-screen bg-[#f6f9ff] pt-24">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#2a4ea7]/15 bg-white shadow-[0_10px_30px_rgba(28,53,122,0.06)]">
          {/* Header */}
          <div className="border-b border-[#2a4ea7]/10 bg-[#f8f9fc] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
            <span className="inline-flex items-center gap-2 rounded-xl border border-[#2a4ea7]/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#2450b2]">
              Legal
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-[#171923] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#3d4255]">{description}</p>
            {lastUpdated ? (
              <p className="mt-6 text-sm font-medium text-[#7485ad]">
                Zuletzt aktualisiert: {lastUpdated}
              </p>
            ) : null}
          </div>

          {/* Content */}
          <article className="px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <div className="prose prose-zinc mx-auto max-w-3xl prose-headings:font-display prose-headings:font-medium prose-headings:text-[#171923] prose-p:text-[#3d4255] prose-a:text-[#2450b2] prose-a:no-underline hover:prose-a:text-[#173983] prose-strong:text-[#171923] prose-ul:text-[#3d4255] prose-ol:text-[#3d4255] prose-li:marker:text-[#7485ad]">
              {children}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
