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
      lastUpdated="07.02.2026"
    >
      {/* English summary for Meta reviewers */}
      <section className="space-y-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-6">
        <h2 className="text-xl font-semibold text-white">
          Privacy Policy Summary (English)
        </h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          Wesponde is a B2B SaaS platform that helps German service businesses
          automate customer conversations via Instagram Direct Messages, Facebook
          Messenger, and WhatsApp. We collect and process the following data from
          Meta platforms: Instagram/Facebook user profile information (user ID,
          username, profile picture), direct message content, page metadata, and
          engagement data. We use this data solely to provide automated
          conversation flows, manage reservations, and enable business-customer
          communication. We do not sell user data. We do not store or cache media
          files from Instagram CDN&mdash;we only reference Meta&apos;s CDN URLs
          temporarily during message processing. Users can request data deletion
          at any time by emailing{" "}
          <a
            href="mailto:wesponde@gmail.com"
            className="text-blue-400 underline hover:text-blue-300"
          >
            wesponde@gmail.com
          </a>{" "}
          or via our{" "}
          <a
            href="/data-deletion"
            className="text-blue-400 underline hover:text-blue-300"
          >
            data deletion page
          </a>
          . We comply with the{" "}
          <a
            href="https://developers.facebook.com/terms/"
            className="text-blue-400 underline hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meta Platform Terms
          </a>
          ,{" "}
          <a
            href="https://developers.facebook.com/devpolicy/"
            className="text-blue-400 underline hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meta Developer Policies
          </a>
          , and the GDPR.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Verantwortliche Stelle
        </h2>
        <p>Verantwortlich fuer die Datenverarbeitung ist:</p>
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
              <a
                href="mailto:wesponde@gmail.com"
                className="text-blue-400 underline hover:text-blue-300"
              >
                wesponde@gmail.com
              </a>
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
        <h2 className="text-xl font-semibold text-white">
          Kurzbeschreibung des Produkts
        </h2>
        <p>
          Wesponde ist eine SaaS-Plattform fuer Gastronomie- und
          Servicebetriebe. Wir automatisieren Social-Media-Konversationen (z. B.
          Instagram DMs, Facebook Messenger, WhatsApp), erfassen Reservierungen
          und senden Review-Follow-ups.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">
          Welche Daten verarbeiten wir?
        </h2>

        <h3 className="text-lg font-medium text-zinc-200">
          a) Daten unserer Nutzer (Geschaeftskunden)
        </h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>Accountdaten (Name, E-Mail-Adresse, Login-Informationen)</li>
          <li>
            Kontoinformationen und Mitgliedschaften (Rolle, Team-Zuordnung)
          </li>
          <li>
            Integrationsdaten (Instagram-/Facebook-Page-IDs, OAuth-Tokens,
            Verbindungsstatus)
          </li>
          <li>
            Erstellte Conversation-Flows (Nachrichten-Vorlagen, Trigger,
            Einstellungen)
          </li>
        </ul>

        <h3 className="mt-6 text-lg font-medium text-zinc-200">
          b) Daten von Endkunden (Gaeste/Kunden der Geschaeftskunden)
        </h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Instagram-/Messenger-Profilinformationen (Benutzer-ID,
            Benutzername, Profilbild-URL)
          </li>
          <li>
            Nachrichteninhalte aus Instagram DMs, Facebook Messenger und
            WhatsApp
          </li>
          <li>
            Extrahierte Kontaktdaten (Name, Telefonnummer, E-Mail-Adresse
            &mdash; sofern im Gespraech angegeben)
          </li>
          <li>
            Reservierungsdaten (Datum, Uhrzeit, Gaestezahl,
            Sonderwuensche)
          </li>
          <li>
            Review-Daten (Bewertung, Feedback-Text, Google-Review-Status)
          </li>
        </ul>

        <h3 className="mt-6 text-lg font-medium text-zinc-200">
          c) Technische Daten
        </h3>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Webhook-Logdaten (Zeitstempel, Event-Typ, Verarbeitungsstatus)
          </li>
          <li>
            Systemlogs (Fehler, API-Anfragen, Performance-Daten)
          </li>
          <li>
            Kanal-IDs und Nachrichten-IDs zur Zuordnung von Konversationen
          </li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">
          Meta/Instagram &mdash; Datenverarbeitung im Detail
        </h2>
        <p>
          Zur Bereitstellung der DM-Automationen verbinden unsere Nutzer ihre
          Instagram-Business- oder Facebook-Page-Konten ueber die Meta APIs
          (OAuth 2.0). Dabei verarbeiten wir folgende Daten:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-zinc-200">
              Instagram-/Facebook-Profildaten:
            </strong>{" "}
            Benutzer-ID, Benutzername, Profilbild-URL, Follower-Anzahl
            (ueber instagram_basic)
          </li>
          <li>
            <strong className="text-zinc-200">Seitenliste:</strong>{" "}
            Facebook-Pages des Nutzers zur Auswahl der Verbindung (ueber
            pages_show_list)
          </li>
          <li>
            <strong className="text-zinc-200">Nachrichten:</strong>{" "}
            Eingehende und ausgehende Instagram-DMs sowie Messenger-Nachrichten
            zur automatisierten Konversationsfuehrung (ueber
            instagram_manage_messages, instagram_business_manage_messages,
            pages_messaging)
          </li>
          <li>
            <strong className="text-zinc-200">Webhook-Events:</strong>{" "}
            Echtzeit-Benachrichtigungen ueber neue Nachrichten (ueber
            pages_manage_metadata)
          </li>
          <li>
            <strong className="text-zinc-200">Engagement-Daten:</strong>{" "}
            Seiten-Interaktionen und Insights (ueber pages_read_engagement)
          </li>
        </ul>

        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-200">
            Wichtig: Medien-Dateien (Bilder, Videos)
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            Wir speichern oder cachen keine Medien-Dateien von Instagram oder
            Facebook. Medien-Inhalte werden ausschliesslich ueber die CDN-URLs
            von Meta referenziert und nicht auf unseren Servern abgelegt. Diese
            URLs werden nur temporaer waehrend der Nachrichtenverarbeitung
            verwendet.
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">
          Zwecke der Verarbeitung
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Bereitstellung der Plattform und ihrer Kernfunktionen
            (Conversation-Flows, Reservierungssystem)
          </li>
          <li>
            Automatisierte Beantwortung von Kundennachrichten ueber
            Instagram DMs, Facebook Messenger und WhatsApp
          </li>
          <li>
            Erfassung und Verwaltung von Reservierungen auf Basis der
            Konversationsdaten
          </li>
          <li>
            Versand von Review-Anfragen nach abgeschlossenen
            Reservierungen
          </li>
          <li>Qualitaetssicherung, Support und Fehleranalyse</li>
          <li>Sicherheit, Missbrauchspruefung und Betrugsverhinderung</li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Rechtsgrundlagen</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Art. 6 Abs. 1 lit. b DSGVO (Vertragserfuellung &mdash;
            Bereitstellung unserer Dienste)
          </li>
          <li>
            Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse &mdash;
            Sicherheit, Fehleranalyse, Produktverbesserung)
          </li>
          <li>
            Art. 6 Abs. 1 lit. a DSGVO (Einwilligung &mdash; z. B. bei
            Verbindung des Instagram-Kontos)
          </li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">
          Empfaenger und Dienstleister
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-zinc-200">Supabase Inc.</strong>{" "}
            (Datenbank, Authentifizierung) &mdash; Daten werden auf Servern in
            der EU/USA gespeichert
          </li>
          <li>
            <strong className="text-zinc-200">Vercel Inc.</strong> (Hosting
            der Webanwendung) &mdash; Edge-Server weltweit
          </li>
          <li>
            <strong className="text-zinc-200">Meta Platforms Inc.</strong>{" "}
            (Instagram Graph API, Messenger API) &mdash; Nachrichtenversand
            und -empfang
          </li>
        </ul>
        <p>
          Wir setzen diese Anbieter als Auftragsverarbeiter ein, soweit
          erforderlich. Wir geben personenbezogene Daten nicht an sonstige
          Dritte weiter und verkaufen keine Nutzerdaten.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Drittlandtransfer</h2>
        <p>
          Bei der Nutzung von Meta, Supabase oder Vercel kann eine
          Datenuebertragung in Drittlaender (insbesondere USA) erfolgen. Wir
          stuetzen uns dabei auf das EU-US Data Privacy Framework sowie auf
          Standardvertragsklauseln gemaess Art. 46 Abs. 2 lit. c DSGVO.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Speicherdauer</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-zinc-200">Accountdaten:</strong> Bis zur
            Kontoloeschung durch den Nutzer
          </li>
          <li>
            <strong className="text-zinc-200">Nachrichten und Konversationen:</strong>{" "}
            90 Tage oder bis zur Loeschung durch den Geschaeftskunden
          </li>
          <li>
            <strong className="text-zinc-200">Reservierungsdaten:</strong> Bis
            zu 2 Jahre (gesetzliche Aufbewahrungspflichten)
          </li>
          <li>
            <strong className="text-zinc-200">OAuth-Tokens:</strong> Bis zum
            Widerruf der Verbindung oder Token-Ablauf (max. 60 Tage fuer
            Long-Lived Tokens)
          </li>
          <li>
            <strong className="text-zinc-200">Systemlogs:</strong> Bis zu 90
            Tage
          </li>
          <li>
            <strong className="text-zinc-200">Review-Daten:</strong> Bis zu 12
            Monate
          </li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">
          Widerruf der Meta-Verbindung
        </h2>
        <p>
          Nutzer koennen die Verbindung zu Instagram/Facebook jederzeit in den
          Kontoeinstellungen der Wesponde-App trennen. Bei Trennung der
          Verbindung:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Werden OAuth-Tokens sofort geloescht</li>
          <li>
            Werden keine weiteren Nachrichten ueber die Meta APIs empfangen oder
            gesendet
          </li>
          <li>
            Bleiben bestehende Konversations- und Reservierungsdaten
            erhalten, bis der Nutzer deren Loeschung beantragt
          </li>
        </ul>
        <p>
          Nutzer koennen die Berechtigung zusaetzlich direkt in den
          Facebook-/Instagram-Einstellungen unter &quot;Apps und
          Websites&quot; widerrufen.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Deine Rechte</h2>
        <p>
          Du hast gemaess DSGVO folgende Rechte bezueglich deiner
          personenbezogenen Daten:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-zinc-200">Auskunft</strong> (Art. 15
            DSGVO) &mdash; Welche Daten wir ueber dich gespeichert haben
          </li>
          <li>
            <strong className="text-zinc-200">Berichtigung</strong> (Art. 16
            DSGVO) &mdash; Korrektur unrichtiger Daten
          </li>
          <li>
            <strong className="text-zinc-200">Loeschung</strong> (Art. 17
            DSGVO) &mdash; Loeschung deiner Daten
          </li>
          <li>
            <strong className="text-zinc-200">
              Einschraenkung der Verarbeitung
            </strong>{" "}
            (Art. 18 DSGVO)
          </li>
          <li>
            <strong className="text-zinc-200">Datenuebertragbarkeit</strong>{" "}
            (Art. 20 DSGVO) &mdash; Export deiner Daten in einem gaengigen
            Format
          </li>
          <li>
            <strong className="text-zinc-200">
              Widerspruch gegen Verarbeitung
            </strong>{" "}
            (Art. 21 DSGVO)
          </li>
          <li>
            <strong className="text-zinc-200">
              Beschwerde bei einer Aufsichtsbehoerde
            </strong>{" "}
            (Art. 77 DSGVO)
          </li>
        </ul>
        <p className="mt-2">
          Zur Ausuebung deiner Rechte kontaktiere uns unter{" "}
          <a
            href="mailto:wesponde@gmail.com"
            className="text-blue-400 underline hover:text-blue-300"
          >
            wesponde@gmail.com
          </a>
          . Wir antworten innerhalb von 30 Tagen.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">
          Datenloeschung (Data Deletion)
        </h2>
        <p>Du kannst die Loeschung deiner Daten auf folgenden Wegen beantragen:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-zinc-200">Per E-Mail:</strong> Sende eine
            Anfrage an{" "}
            <a
              href="mailto:wesponde@gmail.com"
              className="text-blue-400 underline hover:text-blue-300"
            >
              wesponde@gmail.com
            </a>
          </li>
          <li>
            <strong className="text-zinc-200">Ueber unsere Plattform:</strong>{" "}
            In den Kontoeinstellungen unter &quot;Konto loeschen&quot;
          </li>
          <li>
            <strong className="text-zinc-200">Meta Data Deletion Callback:</strong>{" "}
            Wenn du die Wesponde-App in deinen Facebook-/Instagram-Einstellungen
            entfernst, erhalten wir automatisch eine Loeschanfrage von Meta
          </li>
        </ul>
        <p className="mt-2">
          Bei einer Loeschanfrage entfernen wir innerhalb von 30 Tagen alle
          personenbezogenen Daten, einschliesslich: Kontoeinstellungen,
          Integrationsdaten, Konversationen, Reservierungen, Review-Daten und
          Logs. Daten, die aufgrund gesetzlicher Aufbewahrungspflichten
          bestehen bleiben muessen, werden gesperrt und nach Ablauf der Frist
          geloescht.
        </p>
        <p className="mt-2">
          Weitere Informationen:{" "}
          <a
            href="/data-deletion"
            className="text-blue-400 underline hover:text-blue-300"
          >
            wesponde.com/data-deletion
          </a>
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Datensicherheit</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-zinc-200">Verschluesselung bei Uebertragung:</strong>{" "}
            Alle Daten werden ueber TLS 1.2+ (HTTPS) uebertragen
          </li>
          <li>
            <strong className="text-zinc-200">Verschluesselung im Ruhezustand:</strong>{" "}
            Datenbank-Verschluesselung ueber Supabase (AES-256)
          </li>
          <li>
            <strong className="text-zinc-200">Zugriffskontrolle:</strong>{" "}
            Row Level Security (RLS) auf Datenbankebene, rollenbasierte
            Zugriffskontrolle in der Anwendung
          </li>
          <li>
            <strong className="text-zinc-200">Authentifizierung:</strong>{" "}
            Sichere Session-Verwaltung ueber Supabase Auth mit
            serverseitiger Token-Validierung
          </li>
          <li>
            <strong className="text-zinc-200">Webhook-Sicherheit:</strong>{" "}
            HMAC-SHA256-Signaturpruefung fuer alle eingehenden Meta-Webhooks
          </li>
          <li>
            <strong className="text-zinc-200">OAuth-Sicherheit:</strong>{" "}
            CSRF-Schutz ueber State-Parameter, PKCE fuer
            Authentifizierungs-Flows
          </li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">
          Compliance und Plattform-Richtlinien
        </h2>
        <p>Wesponde haelt sich an folgende Richtlinien und Vorschriften:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <a
              href="https://developers.facebook.com/terms/"
              className="text-blue-400 underline hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Meta Platform Terms
            </a>
          </li>
          <li>
            <a
              href="https://developers.facebook.com/devpolicy/"
              className="text-blue-400 underline hover:text-blue-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Meta Developer Policies
            </a>
          </li>
          <li>
            Datenschutz-Grundverordnung (DSGVO / GDPR)
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
