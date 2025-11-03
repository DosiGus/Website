export const metadata = {
  title: "Impressum — Conwix",
  description: "Impressum (placeholder). Replace with your real company info.",
};

export default function ImpressumPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 prose prose-slate">
      <h1>Impressum (Placeholder)</h1>
      <p>Replace the following with your actual legal information for Germany.</p>
      <ul>
        <li>Unternehmen: Placeholder GmbH</li>
        <li>Adresse: Musterstraße 1, 00000 Stadt, Land</li>
        <li>Vertreten durch: Max Mustermann</li>
        <li>Kontakt: hello@example.com</li>
        <li>USt-IdNr.: DE000000000</li>
      </ul>
      <h2>Haftungsausschluss</h2>
      <p>Dies ist ein Platzhalter. Ersetze den Text vor dem Livegang.</p>
    </section>
  );
}
