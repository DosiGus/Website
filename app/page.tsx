export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <div className="max-w-2xl">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs mb-4">
          Placeholder
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Conwix — <span className="text-brand">Conversations made simple.</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          This is a placeholder landing page for your project. Replace this text with a clear value proposition.
        </p>
        <div className="mt-8 flex gap-3">
          <a href="/contact" className="rounded-2xl px-5 py-3 bg-brand text-white font-medium hover:bg-brand-dark">
            Request a Demo
          </a>
          <a href="#features" className="rounded-2xl px-5 py-3 border hover:bg-slate-50">
            Learn more
          </a>
        </div>
      </div>

      <div id="features" className="grid sm:grid-cols-3 gap-6 mt-20">
        {[1,2,3].map((i) => (
          <div key={i} className="rounded-2xl border p-6">
            <h3 className="font-semibold mb-2">Feature {i}</h3>
            <p className="text-sm text-slate-600">Short placeholder text describing a key capability of Conwix.</p>
          </div>
        ))}
      </div>

      <div className="mt-20 rounded-2xl border p-8 text-center">
        <h2 className="text-2xl font-semibold">Ready to get started?</h2>
        <p className="text-slate-600 mt-2">Use the Contact page to reach out. All content is placeholder and can be edited later.</p>
        <a href="/contact" className="inline-block mt-6 rounded-2xl px-5 py-3 bg-brand text-white font-medium hover:bg-brand-dark">
          Contact us
        </a>
      </div>
    </section>
  )
}
