import LegalLayout from "../../components/LegalLayout";

export const metadata = {
  title: "Privacy Policy — Wesponde",
  description: "Datenschutzerklärung der Wesponde GmbH (Musterinhalt, bitte anpassen).",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Datenschutzerklärung"
      description="Wir nehmen den Schutz Ihrer personenbezogenen Daten ernst. Nachfolgend informieren wir Sie gemäß Art. 13 DSGVO darüber, welche Daten wir auf dieser Website verarbeiten, zu welchem Zweck dies erfolgt und welche Rechte Sie haben."
      lastUpdated="05. Juni 2024"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Verantwortliche Stelle
        </h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist die Wesponde GmbH.
          Bitte ersetzen Sie die nachstehenden Platzhalter durch Ihre tatsächlichen Angaben.
        </p>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Unternehmen
            </dt>
            <dd className="mt-2 text-base font-medium text-slate-700">
              Wesponde GmbH
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Kontakt Datenschutz
            </dt>
            <dd className="mt-2 text-base text-slate-700">
              privacy@wesponde.com
              <br />
              +49 (0) 123 456 789
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Anschrift
            </dt>
            <dd className="mt-2 text-base text-slate-700">
              Musterstraße 1, 10115 Berlin, Deutschland
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Arten verarbeiteter Daten
        </h2>
        <p>
          Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung einer
          funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Bestandsdaten (z. B. Namen, Unternehmen, Ansprechpartner)</li>
          <li>Kontaktdaten (z. B. E-Mail, Telefonnummer, Anschrift)</li>
          <li>
            Nutzungsdaten (z. B. aufgerufene Seiten, Zugriffsdaten, IP-Adresse,
            Browserinformationen)
          </li>
          <li>
            Inhaltsdaten (z. B. Angaben aus Kontaktformularen oder Supportanfragen)
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Zwecke der Verarbeitung &amp; Rechtsgrundlagen
        </h2>
        <p>
          Die Verarbeitung Ihrer Daten erfolgt ausschließlich auf Grundlage der folgenden
          Rechtsgrundlagen der DSGVO:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Art. 6 Abs. 1 lit. b DSGVO zur Erfüllung vertraglicher oder vorvertraglicher
            Maßnahmen (z. B. Beantwortung von Anfragen)
          </li>
          <li>
            Art. 6 Abs. 1 lit. f DSGVO aufgrund berechtigter Interessen (z. B. Betrieb und
            Sicherheit der Website)
          </li>
          <li>
            Art. 6 Abs. 1 lit. a DSGVO, sofern wir Ihre Einwilligung für bestimmte Zwecke
            einholen (z. B. Cookies, Newsletter)
          </li>
        </ul>
        <p>
          Wir verwenden Ihre Daten weder für Profiling noch zur automatisierten
          Entscheidungsfindung.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Bereitstellung der Website &amp; Server-Logfiles
        </h2>
        <p>
          Bei jedem Zugriff auf unsere Website erfassen wir automatisiert Daten und
          Informationen, die Ihr Browser übermittelt. Hierzu gehören unter anderem IP-Adresse,
          Datum und Uhrzeit des Abrufs, verwendeter Browser sowie das Betriebssystem.
        </p>
        <p>
          Die Speicherung erfolgt aus Sicherheitsgründen (z. B. zur Aufklärung von
          Missbrauchs- oder Betrugshandlungen) auf Basis unseres berechtigten Interesses
          gemäß Art. 6 Abs. 1 lit. f DSGVO. Eine darüber hinausgehende Zusammenführung dieser
          Daten mit anderen Datenquellen findet nicht statt.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Cookies, Analyse-Tools &amp; Einwilligungen
        </h2>
        <p>
          Soweit wir Cookies oder vergleichbare Technologien einsetzen, die nicht zwingend
          erforderlich sind, holen wir vorab Ihre ausdrückliche Einwilligung ein (Art. 6
          Abs. 1 lit. a DSGVO). Technisch notwendige Cookies setzen wir auf Grundlage unseres
          berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO ein.
        </p>
        <p>
          Werden Analysedienste genutzt, erfolgt dies ausschließlich in pseudonymisierter oder
          anonymisierter Form. Details hierzu (z. B. Anbieter, Speicherdauer) sollten Sie in
          diesem Abschnitt ergänzen, sobald entsprechende Dienste eingebunden werden.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">Speicherdauer</h2>
        <p>
          Wir verarbeiten und speichern personenbezogene Daten nur für den Zeitraum, der zur
          Erreichung des Speicherungszwecks erforderlich ist oder sofern dies durch den
          europäischen oder nationalen Gesetzgeber vorgeschrieben wurde.
        </p>
        <p>
          Entfallen der Speicherungszweck oder läuft eine einschlägige gesetzliche
          Aufbewahrungsfrist ab, werden die personenbezogenen Daten routinemäßig und
          entsprechend den gesetzlichen Vorschriften gesperrt oder gelöscht.
        </p>
      </section>

      <section className="space-y-6 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Rechte der betroffenen Person
        </h2>
        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6">
          <p>
            Ihnen stehen die folgenden Rechte bezüglich Ihrer personenbezogenen Daten zu.
            Bitte richten Sie entsprechende Anfragen an{" "}
            <a
              className="font-semibold text-brand-dark hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="mailto:privacy@wesponde.com"
            >
              privacy@wesponde.com
            </a>
            .
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="rounded-xl bg-white/60 p-4 text-sm font-medium text-slate-700 shadow-sm">
              Auskunft nach Art. 15 DSGVO
            </li>
            <li className="rounded-xl bg-white/60 p-4 text-sm font-medium text-slate-700 shadow-sm">
              Berichtigung nach Art. 16 DSGVO
            </li>
            <li className="rounded-xl bg-white/60 p-4 text-sm font-medium text-slate-700 shadow-sm">
              Löschung nach Art. 17 DSGVO
            </li>
            <li className="rounded-xl bg-white/60 p-4 text-sm font-medium text-slate-700 shadow-sm">
              Einschränkung der Verarbeitung nach Art. 18 DSGVO
            </li>
            <li className="rounded-xl bg-white/60 p-4 text-sm font-medium text-slate-700 shadow-sm">
              Datenübertragbarkeit nach Art. 20 DSGVO
            </li>
            <li className="rounded-xl bg-white/60 p-4 text-sm font-medium text-slate-700 shadow-sm">
              Widerspruch nach Art. 21 DSGVO
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">Datensicherheit</h2>
        <p>
          Wir treffen angemessene technische und organisatorische Maßnahmen, um Ihre Daten
          gegen unbefugte Zugriffe, Manipulation und Verlust zu schützen. Dazu zählen unter
          anderem Verschlüsselungstechnologien, Zugriffsbeschränkungen sowie
          Sicherheitsüberprüfungen unserer Systeme.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Aktualität und Änderungen dieser Datenschutzerklärung
        </h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den
          aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen
          in der Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch gilt dann die neue
          Datenschutzerklärung.
        </p>
      </section>
    </LegalLayout>
  );
}
