import Link from "next/link";

export const metadata = {
  title: "Wesponde Insights",
  description: "Playbooks, Benchmarks und Best Practices für Instagram-, WhatsApp- und Facebook-Messaging.",
};

const posts = [
  {
    slug: "instagram-dm-reservierungen",
    title: "Wie 30 % mehr Reservierungen über Instagram DMs möglich werden",
    tag: "Playbook",
    excerpt:
      "Der konkrete Ablauf, der aus Anfragen Buchungen macht – inklusive Bestätigung, Reminder und Follow-ups.",
  },
  {
    slug: "reminder-design-no-shows",
    title: "Reminder-Design: der präzise Ablauf gegen No-Shows",
    tag: "Best Practice",
    excerpt:
      "Timing, Tonalität und Trigger – so bleibt dein Kalender zuverlässig gefüllt.",
  },
  {
    slug: "bewertungen-skalieren",
    title: "Bewertungen skalieren: von Besuch zu 5-Sterne-Review",
    tag: "Guide",
    excerpt:
      "Wie du Bewertungen ohne Druck aktivierst und damit deine Sichtbarkeit steigerst.",
  },
];

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Insights
        </p>
        <h1 className="font-display text-balance mt-4 text-4xl font-semibold text-ink">
          Playbooks für skalierbares Messaging.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Strategien, Benchmarks und konkrete Abläufe für Service-Brands.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.title}
            href={`/blog/${post.slug}`}
            className="group rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(15,17,22,0.2)] transition hover:-translate-y-1"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {post.tag}
            </p>
            <h2 className="mt-4 text-lg font-semibold text-ink group-hover:text-brand-dark">
              {post.title}
            </h2>
            <p className="mt-3 text-sm text-slate-600">{post.excerpt}</p>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-ink group-hover:text-brand-dark">
              Artikel lesen →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
