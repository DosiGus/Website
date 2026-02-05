import LegalLayout from "../../components/LegalLayout";

export const metadata = {
  title: "Datenloeschung - Wesponde",
  description: "Anleitung zur Datenloeschung fuer Wesponde-Nutzer.",
};

export default function DataDeletionPage({
  searchParams,
}: {
  searchParams?: { code?: string };
}) {
  const confirmationCode = searchParams?.code;

  return (
    <LegalLayout
      title="Datenloeschung"
      description="So kannst du die Loeschung deiner Daten bei Wesponde anfragen."
      lastUpdated="05.02.2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Automatische Anfrage ueber Meta</h2>
        <p>
          Wenn du eine Datenloeschung ueber Facebook oder Instagram anfragst, erhalten wir
          eine automatisierte Anfrage. Wir bestaetigen dir diese mit einem Code und verlinken
          dich auf diese Seite.
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
        <h2 className="text-xl font-semibold text-white">Welche Daten werden geloescht?</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account- und Zugangsdaten</li>
          <li>Integrationen (z. B. Instagram-Verbindungen)</li>
          <li>Konversationen und Nachrichteninhalte</li>
          <li>Reservierungen und Kontaktdaten</li>
          <li>Review-Anfragen und System-Logs</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Bearbeitungsdauer</h2>
        <p>
          Wir bearbeiten Datenloeschungen so schnell wie moeglich. Gesetzliche
          Aufbewahrungsfristen koennen einzelne Daten laenger erfordern.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Manuelle Anfrage</h2>
        <p>
          Falls du keine automatische Anfrage gestellt hast, kannst du uns jederzeit
          direkt kontaktieren. Schreibe eine E-Mail an{" "}
          <a href="mailto:wesponde@gmail.com">wesponde@gmail.com</a> mit dem Betreff
          &quot;Datenloeschung&quot;.
        </p>
      </section>
    </LegalLayout>
  );
}
