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
    tagColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    excerpt:
      "Der konkrete Ablauf, der aus Anfragen Buchungen macht – inklusive Bestätigung, Reminder und Follow-ups.",
  },
  {
    slug: "reminder-design-no-shows",
    title: "Reminder-Design: der präzise Ablauf gegen No-Shows",
    tag: "Best Practice",
    tagColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    excerpt:
      "Timing, Tonalität und Trigger – so bleibt dein Kalender zuverlässig gefüllt.",
  },
  {
    slug: "bewertungen-skalieren",
    title: "Bewertungen skalieren: von Besuch zu 5-Sterne-Review",
    tag: "Guide",
    tagColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    excerpt:
      "Wie du Bewertungen ohne Druck aktivierst und damit deine Sichtbarkeit steigerst.",
  },
];

export default function BlogPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 pt-24">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-dark opacity-50" />
      <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-500/10 blur-[100px]" />

      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Insights
          </span>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-white sm:text-5xl">
            Playbooks für skalierbares Messaging.
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Strategien, Benchmarks und konkrete Abläufe für Service-Brands.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-zinc-900"
            >
              <span
                className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${post.tagColor}`}
              >
                {post.tag}
              </span>
              <h2 className="mt-4 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-indigo-400">
                {post.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
                {post.excerpt}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white transition-colors group-hover:text-indigo-400">
                Artikel lesen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-20 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 p-8 text-center sm:p-12">
          <h3 className="font-display text-2xl font-medium text-white sm:text-3xl">
            Neue Insights direkt ins Postfach
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Melde dich für unseren Newsletter an und erhalte monatlich die neuesten Playbooks,
            Benchmarks und Best Practices.
          </p>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Deine E-Mail-Adresse"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-zinc-500 transition-colors focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition-all hover:bg-zinc-100">
              Anmelden
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
