export const metadata = {
  title: "Wesponde Blog (Coming Soon)",
  description: "Updates rund um Messenger-Automatisierung und Produktnews.",
};

export default function BlogPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
        Coming Soon
      </p>
      <h1 className="mt-4 text-4xl font-semibold text-slate-900">Unser Blog startet bald.</h1>
      <p className="mt-4 text-lg text-slate-600">
        Wir arbeiten an Guides zu automatisierten Reservierungen, Messenger-Playbooks und
        Produkt-Updates. Trage dich in die Beta ein, um informiert zu bleiben.
      </p>
      <a
        href="#beta"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
      >
        Join Beta Waitlist
      </a>
    </section>
  );
}
