import LegalLayout from "../../components/LegalLayout";

export const metadata = {
  title: "Data Deletion - Wesponde",
  description: "Information about data deletion requests for Wesponde users.",
};

export default function DataDeletionPage({
  searchParams,
}: {
  searchParams?: { code?: string };
}) {
  const confirmationCode = searchParams?.code;

  return (
    <LegalLayout
      title="Data Deletion"
      description="Informationen zur Loeschung von Daten fuer Wesponde."
      lastUpdated="08. Februar 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Was passiert hier?</h2>
        <p>
          Wenn du eine Datenloeschung ueber Facebook/Instagram angefragt hast, kannst du
          diese Seite als Bestaetigung verwenden. Die Anfrage wird verarbeitet und wir
          loeschen die zugehoerigen Daten gemaess unseren Richtlinien.
        </p>
      </section>

      {confirmationCode ? (
        <section className="space-y-4 border-t border-white/10 pt-8">
          <h2 className="text-xl font-semibold text-white">Bestaetigungscode</h2>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
            <span className="font-medium text-white">Code:</span> {confirmationCode}
          </div>
          <p>
            Bitte bewahre diesen Code auf. Wir nutzen ihn, um deine Anfrage eindeutig zu
            zuordnen.
          </p>
        </section>
      ) : null}

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Manuelle Anfrage</h2>
        <p>
          Falls du keine automatische Anfrage gestellt hast, kannst du uns jederzeit
          direkt kontaktieren. Schreibe eine E-Mail an{" "}
          <a href="mailto:privacy@wesponde.com">privacy@wesponde.com</a> mit dem Betreff
          &quot;Datenloeschung&quot;.
        </p>
      </section>
    </LegalLayout>
  );
}
