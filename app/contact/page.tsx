export const metadata = {
  title: "Contact — Conwix",
  description: "Get in touch with Conwix (placeholder).",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-2 text-slate-600">
        This is a placeholder contact page. Replace the details below later.
      </p>

      <form className="mt-8 grid gap-4">
        <input className="rounded-2xl border px-4 py-3" placeholder="Your name" />
        <input type="email" className="rounded-2xl border px-4 py-3" placeholder="you@example.com" />
        <textarea className="rounded-2xl border px-4 py-3 min-h-32" placeholder="Your message" />
        <button type="button" className="rounded-2xl px-5 py-3 bg-brand text-white font-medium hover:bg-brand-dark">
          Send (placeholder)
        </button>
      </form>

      <div className="mt-8 text-sm text-slate-600 space-y-1">
        <p>Email: hello@example.com</p>
        <p>Address: Sample Street 1, 00000 City, Country</p>
        <p>Phone: +00 000 000000</p>
      </div>
    </section>
  );
}
