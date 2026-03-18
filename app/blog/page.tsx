import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Wesponde Insights – Playbooks & Best Practices",
  description: "Playbooks, Benchmarks und Best Practices für Instagram-, WhatsApp- und Facebook-Messaging.",
};

const posts = [
  {
    slug: "instagram-dm-reservierungen",
    title: "Wie 30 % mehr Reservierungen über Instagram DMs möglich werden",
    tag: "Playbook",
    tagColor: "border-[#2a4ea7]/15 bg-white/70 text-[#2450b2]",
    excerpt:
      "Der konkrete Ablauf, der aus Anfragen Buchungen macht – inklusive Bestätigung, Reminder und Follow-ups.",
  },
  {
    slug: "reminder-design-no-shows",
    title: "Reminder-Design: der präzise Ablauf gegen No-Shows",
    tag: "Best Practice",
    tagColor: "border-[#2a4ea7]/15 bg-white/70 text-[#2450b2]",
    excerpt:
      "Timing, Tonalität und Trigger – so bleibt dein Kalender zuverlässig gefüllt.",
  },
  {
    slug: "bewertungen-skalieren",
    title: "Bewertungen skalieren: von Besuch zu 5-Sterne-Review",
    tag: "Guide",
    tagColor: "border-[#2a4ea7]/15 bg-white/70 text-[#2450b2]",
    excerpt:
      "Wie du Bewertungen ohne Druck aktivierst und damit deine Sichtbarkeit steigerst.",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#f6f9ff] pt-24">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2450b2]">
            Insights
          </span>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-[#171923] sm:text-5xl">
            Playbooks für skalierbares Messaging.
          </h1>
          <p className="mt-4 text-lg text-[#3d4255]">
            Strategien, Benchmarks und konkrete Abläufe für Service-Brands.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#2a4ea7]/15 bg-white/70 p-6 shadow-[0_4px_16px_rgba(28,53,122,0.04)] transition-all hover:bg-white hover:shadow-[0_8px_24px_rgba(28,53,122,0.08)]"
            >
              <span
                className={`inline-flex w-fit items-center rounded-xl border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${post.tagColor}`}
              >
                {post.tag}
              </span>
              <h2 className="mt-4 text-lg font-semibold leading-snug text-[#171923] transition-colors group-hover:text-[#2450b2]">
                {post.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[#67718a]">
                {post.excerpt}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#2450b2]">
                Artikel lesen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-20 rounded-2xl border border-[#2a4ea7]/15 bg-white/70 p-8 text-center shadow-[0_4px_16px_rgba(28,53,122,0.04)] sm:p-12">
          <h3 className="font-display text-2xl font-medium text-[#171923] sm:text-3xl">
            Neue Insights direkt ins Postfach
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-[#3d4255]">
            Melde dich für unseren Newsletter an und erhalte monatlich die neuesten Playbooks,
            Benchmarks und Best Practices.
          </p>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Deine E-Mail-Adresse"
              className="flex-1 rounded-xl border border-[#2a4ea7]/20 bg-white px-4 py-3 text-[#171923] placeholder-[#9aa3b8] transition-colors focus:border-[#2a4ea7] focus:outline-none focus:ring-2 focus:ring-[#2a4ea7]/15"
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#121624] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1e2d5a]">
              Anmelden
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
