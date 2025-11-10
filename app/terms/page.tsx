import LegalLayout from "../../components/LegalLayout";

export const metadata = {
  title: "Terms of Service — Wesponde",
  description:
    "Allgemeine Geschäftsbedingungen (AGB) der Wesponde GmbH (Musterinhalt, bitte individualisieren).",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Allgemeine Geschäftsbedingungen"
      description="Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der Website und der Dienstleistungen der Wesponde GmbH. Bitte lesen Sie die folgenden Bestimmungen aufmerksam, bevor Sie unsere Leistungen in Anspruch nehmen."
      lastUpdated="05. Juni 2024"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">1. Geltungsbereich</h2>
        <p>
          Die nachstehenden Bedingungen gelten für sämtliche Verträge zwischen der Wesponde
          GmbH (nachfolgend „Wesponde“ oder „wir“) und unseren Kundinnen und Kunden sowie
          Besucherinnen und Besuchern der Website. Abweichende Geschäftsbedingungen finden
          nur Anwendung, wenn sie ausdrücklich schriftlich bestätigt wurden.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          2. Vertragsgegenstand und Leistungen
        </h2>
        <p>
          Wesponde stellt digitale Produkte und Services zur Verfügung, die Kommunikation und
          Zusammenarbeit erleichtern. Art und Umfang der Leistungen ergeben sich aus dem
          jeweils geschlossenen Vertrag, Angebotsunterlagen oder Produktbeschreibungen auf
          der Website.
        </p>
        <p>
          Änderungen oder Erweiterungen der Leistungen behalten wir uns vor, sofern diese
          für Kundinnen und Kunden zumutbar sind und keine wesentlichen Vertragsbestandteile
          betreffen.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          3. Registrierung und Benutzerkonten
        </h2>
        <p>
          Für bestimmte Funktionen ist gegebenenfalls ein persönliches Benutzerkonto
          erforderlich. Die Registrierung muss mit wahrheitsgemäßen Angaben erfolgen. Sie
          sind verpflichtet, Zugangsdaten vertraulich zu behandeln und vor dem Zugriff
          unbefugter Dritter zu schützen.
        </p>
        <p>
          Missbräuchliche Nutzung oder die Weitergabe des Kontos kann zur Sperrung oder
          Kündigung des Accounts führen.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          4. Verantwortungsvolle Nutzung &amp; Pflichten
        </h2>
        <p>
          Unsere Services dürfen nur im Rahmen der geltenden Gesetze und dieser
          Geschäftsbedingungen genutzt werden. Untersagt ist insbesondere das Einstellen
          rechtswidriger Inhalte, das Versenden von Spam sowie der Versuch, Sicherheitsmechanismen
          zu umgehen oder die Systemintegrität zu beeinträchtigen.
        </p>
        <p>
          Sie verpflichten sich, uns unverzüglich über Störungen oder sicherheitsrelevante
          Ereignisse zu informieren.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          5. Vergütung &amp; Zahlungsbedingungen
        </h2>
        <p>
          Soweit Leistungen kostenpflichtig sind, gelten die im Angebot ausgewiesenen Preise.
          Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer, sofern nicht
          anders angegeben. Rechnungen sind innerhalb von 14 Tagen ohne Abzug zur Zahlung
          fällig, sofern nichts Abweichendes vereinbart wurde.
        </p>
        <p>
          Bei Zahlungsverzug behalten wir uns vor, den Zugang zu kostenpflichtigen Services
          vorübergehend zu sperren.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          6. Geistiges Eigentum &amp; Nutzungsrechte
        </h2>
        <p>
          Sämtliche Rechte an Inhalten, Marken, Layouts, Software und sonstigen Materialien
          liegen bei Wesponde oder den jeweiligen Rechteinhabern. Eine Weitergabe, Vervielfältigung
          oder anderweitige Nutzung bedarf der vorherigen schriftlichen Zustimmung.
        </p>
        <p>
          Für kundenseitig bereitgestellte Inhalte räumen Sie uns ein einfaches, zeitlich und
          geografisch unbeschränktes Nutzungsrecht ein, soweit dies zur Vertragserfüllung
          erforderlich ist.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          7. Haftung und Gewährleistung
        </h2>
        <p>
          Wesponde haftet bei Vorsatz und grober Fahrlässigkeit unbegrenzt. Bei einfacher
          Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten, begrenzt
          auf den vertragstypischen, vorhersehbaren Schaden. Eine Haftung für entgangenen Gewinn
          oder mittelbare Schäden ist ausgeschlossen.
        </p>
        <p>
          Die gesetzliche Haftung für Schäden aus der Verletzung des Lebens, des Körpers oder
          der Gesundheit bleibt unberührt.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          8. Verfügbarkeit und Wartung
        </h2>
        <p>
          Wir streben eine hohe Verfügbarkeit unserer Dienste an, können jedoch keine
          unterbrechungsfreie Nutzung garantieren. Wartungsarbeiten und Updates können zu
          kurzfristigen Einschränkungen führen. Soweit möglich, informieren wir vorab über
          geplante Wartungsfenster.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          9. Laufzeit und Kündigung
        </h2>
        <p>
          Bei laufzeitgebundenen Verträgen beträgt die Kündigungsfrist, sofern nicht anders
          vereinbart, vier Wochen zum Ende der jeweiligen Vertragslaufzeit. Das Recht zur
          außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          10. Änderungen dieser AGB
        </h2>
        <p>
          Wir behalten uns vor, diese AGB mit Wirkung für die Zukunft anzupassen. Über
          wesentliche Änderungen informieren wir Sie rechtzeitig. Widersprechen Sie den
          Änderungen nicht innerhalb von 30 Tagen nach Mitteilung, gelten sie als akzeptiert.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          11. Schlussbestimmungen
        </h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
          Ausschließlicher Gerichtsstand ist – soweit zulässig – Berlin. Sollten einzelne
          Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der
          übrigen Regelungen unberührt.
        </p>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="font-medium text-slate-800">
            Haben Sie Fragen zu diesen AGB?
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Kontaktieren Sie uns unter{" "}
            <a
              className="font-semibold text-brand-dark hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              href="mailto:legal@wesponde.com"
            >
              legal@wesponde.com
            </a>{" "}
            oder telefonisch unter +49 (0) 30 1234567. Wir helfen Ihnen gerne weiter.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
