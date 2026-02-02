import Link from "next/link";

const posts = [
  {
    slug: "instagram-dm-reservierungen",
    title: "Wie 30 % mehr Reservierungen über Instagram DMs möglich werden",
    tag: "Playbook",
    sections: [
      {
        title: "1. Klarer Einstieg",
        body:
          "Der erste Kontakt braucht eine eindeutige Frage: Datum, Uhrzeit und Personenanzahl. Je weniger freie Texte, desto schneller entsteht eine Buchung.",
      },
      {
        title: "2. Sofortige Bestätigung",
        body:
          "Sobald der Termin steht, wird die Bestätigung automatisch gesendet. Das reduziert Unsicherheit und erhöht die Termintreue.",
      },
      {
        title: "3. Reminder mit Kontext",
        body:
          "Ein Reminder 24h und 4h vor dem Termin senkt No-Shows messbar. Kurz, freundlich, markengerecht.",
      },
    ],
  },
  {
    slug: "reminder-design-no-shows",
    title: "Reminder-Design: der präzise Ablauf gegen No-Shows",
    tag: "Best Practice",
    sections: [
      {
        title: "1. Timing",
        body:
          "Ein zweistufiger Reminder wirkt am besten: 24 Stunden und 4 Stunden vor dem Termin.",
      },
      {
        title: "2. Tonalität",
        body:
          "Kurze, klare Sprache mit Option zur Bestätigung oder Verschiebung erhöht die Rücklaufquote.",
      },
      {
        title: "3. Eskalation",
        body:
          "Bei fehlender Bestätigung wird das Team informiert, ohne den Ablauf zu stören.",
      },
    ],
  },
  {
    slug: "bewertungen-skalieren",
    title: "Bewertungen skalieren: von Besuch zu 5-Sterne-Review",
    tag: "Guide",
    sections: [
      {
        title: "1. Der richtige Moment",
        body:
          "Die beste Quote entsteht kurz nach dem Besuch – ideal am nächsten Morgen.",
      },
      {
        title: "2. Kurzer Weg",
        body:
          "Ein Klick zum Review-Link, keine langen Texte. Friktion kostet Bewertungen.",
      },
      {
        title: "3. Feedback abfangen",
        body:
          "Unzufriedene Gäste werden zuerst intern abgeholt, bevor ein öffentliches Review entsteht.",
      },
    ],
  },
];

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((item) => item.slug === params.slug);

  if (!post) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-sm text-slate-600">Artikel nicht gefunden.</p>
        <Link href="/blog" className="mt-6 inline-flex text-sm font-semibold text-ink">
          Zurück zu Insights →
        </Link>
      </section>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-20">
      <Link href="/blog" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        ← Insights
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
        {post.tag}
      </p>
      <h1 className="font-display text-balance mt-4 text-4xl font-semibold text-ink">
        {post.title}
      </h1>
      <div className="mt-10 space-y-8">
        {post.sections.map((section) => (
          <div key={section.title} className="rounded-[24px] border border-slate-200/70 bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">{section.title}</h2>
            <p className="mt-3 text-sm text-slate-600">{section.body}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
