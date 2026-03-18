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
      <div className="min-h-screen bg-[#f4efe7] pt-24">
        <section className="mx-auto max-w-3xl px-4 py-20">
          <p className="text-sm text-[#67718a]">Artikel nicht gefunden.</p>
          <Link href="/blog" className="mt-6 inline-flex text-sm font-semibold text-[#2450b2]">
            Zurück zu Insights →
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4efe7] pt-24">
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Link href="/blog" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7485ad] transition-colors hover:text-[#2450b2]">
          ← Insights
        </Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#2450b2]">
          {post.tag}
        </p>
        <h1 className="mt-4 font-display text-balance text-4xl font-semibold text-[#171923]">
          {post.title}
        </h1>
        <div className="mt-10 space-y-4">
          {post.sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-[#2a4ea7]/15 bg-white/70 p-6 shadow-[0_4px_16px_rgba(28,53,122,0.04)]">
              <h2 className="text-lg font-semibold text-[#171923]">{section.title}</h2>
              <p className="mt-3 text-sm text-[#3d4255]">{section.body}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
