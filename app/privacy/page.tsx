import LegalLayout from "../../components/LegalLayout";

export const metadata = {
  title: "Datenschutzerklaerung - Wesponde",
  description: "Datenschutzerklaerung fuer die Nutzung von Wesponde.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Datenschutzerklaerung"
      description="Hier erlaeutern wir, welche personenbezogenen Daten wir verarbeiten, zu welchem Zweck und welche Rechte du hast."
      lastUpdated="05.02.2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Verantwortliche Stelle</h2>
        <p>
          Verantwortlich fuer die Datenverarbeitung ist:
        </p>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Unternehmen
            </dt>
            <dd className="mt-2 text-base font-medium text-zinc-200">
              Wesponde (Einzelunternehmen, Inhaber: Kevin Santos)
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Kontakt Datenschutz
            </dt>
            <dd className="mt-2 text-base text-zinc-200">
              wesponde@gmail.com
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Anschrift
            </dt>
            <dd className="mt-2 text-base text-zinc-200">
              Kurzroederstrasse 26
              <br />
              60435 Frankfurt am Main
              <br />
              Deutschland
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Kurzbeschreibung des Produkts</h2>
        <p>
          Wesponde ist eine SaaS-Plattform fuer Gastronomie- und Servicebetriebe. Wir
          automatisieren Social-Media-Konversationen (z. B. Instagram DMs), erfassen
          Reservierungen und senden Review-Follow-ups.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Welche Daten verarbeiten wir?</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Accountdaten (z. B. Name, E-Mail, Login-Informationen)</li>
          <li>Integrationsdaten (z. B. Instagram-/Page-IDs, Tokens, Status)</li>
          <li>Konversations- und Nachrichteninhalte</li>
          <li>Reservierungsdaten (Name, Datum, Uhrzeit, Gaestezahl, Kontaktangaben)</li>
          <li>Kontaktdaten und Historie (Kontakte, Kanal-IDs)</li>
          <li>Technische Logdaten (Fehler, Requests, Systemlogs)</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Zwecke der Verarbeitung</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Bereitstellung der Plattform und ihrer Funktionen</li>
          <li>Automatisierte Beantwortung von Nachrichten</li>
          <li>Erfassung und Verwaltung von Reservierungen</li>
          <li>Qualitaetssicherung, Support und Fehleranalyse</li>
          <li>Sicherheit und Missbrauchspruefung</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Rechtsgrundlagen</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfuellung)</li>
          <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, z. B. Sicherheit)</li>
          <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung, falls erforderlich)</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Meta/Instagram APIs</h2>
        <p>
          Zur Bereitstellung der DM-Automationen verbinden wir deine Instagram-Business-
          Konten ueber die Meta APIs. Dabei verarbeiten wir technische IDs sowie Inhalte
          von Nachrichten, um Antworten zu senden und Reservierungen anzulegen.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Empfaenger und Dienstleister</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Supabase (Datenbank, Authentifizierung, Hosting)</li>
          <li>Vercel (Hosting der Webanwendung)</li>
          <li>Meta Platforms (Instagram Graph API)</li>
        </ul>
        <p>
          Wir setzen diese Anbieter als Auftragsverarbeiter ein, soweit erforderlich.
          Derzeit nutzen wir keine weiteren Dienstleister. Falls wir spaeter Tools wie
          Stripe, E-Mail-Services oder Analytics einsetzen, aktualisieren wir diese
          Erklaerung.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Drittlandtransfer</h2>
        <p>
          Bei der Nutzung von Meta oder Hosting-Anbietern kann eine Datenuebertragung in
          Drittlaender (z. B. USA) erfolgen. Wir achten auf geeignete Garantien wie
          Standardvertragsklauseln, sofern erforderlich.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Speicherdauer</h2>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie dies fuer die Zwecke
          erforderlich ist oder gesetzliche Pflichten bestehen. Systemlogs speichern wir
          in der Regel bis zu 90 Tage.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Deine Rechte</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Auskunft, Berichtigung, Loeschung</li>
          <li>Einschraenkung der Verarbeitung</li>
          <li>Datenuebertragbarkeit</li>
          <li>Widerspruch gegen Verarbeitung</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Datenloeschung</h2>
        <p>
          Informationen zur Datenloeschung findest du hier:{" "}
          <a href="/data-deletion">https://wesponde.com/data-deletion</a>
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Datensicherheit</h2>
        <p>
          Wir treffen angemessene technische und organisatorische Massnahmen, um Daten vor
          unbefugtem Zugriff, Verlust und Missbrauch zu schuetzen.
        </p>
      </section>
    </LegalLayout>
  );
}
