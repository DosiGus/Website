import LegalLayout from "../../components/LegalLayout";

export const metadata = {
  title: "AGB - Wesponde",
  description: "Allgemeine Geschaeftsbedingungen von Wesponde.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Allgemeine Geschaeftsbedingungen (AGB)"
      description="Diese AGB regeln die Nutzung der Wesponde-Plattform."
      lastUpdated="05.02.2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">1. Geltungsbereich</h2>
        <p>
          Diese AGB gelten fuer alle Vertrage zwischen Wesponde (Einzelunternehmen, Inhaber:
          Kevin Santos) und ihren Geschaeftskunden (B2B). Die Plattform richtet sich
          ausschliesslich an Unternehmer im Sinne von § 14 BGB; Verbraucher sind
          ausgeschlossen. Abweichende Bedingungen finden nur Anwendung, wenn sie
          schriftlich bestaetigt wurden.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">2. Leistungsbeschreibung</h2>
        <p>
          Wesponde ist eine SaaS-Plattform zur Automatisierung von Social-Media-
          Konversationen (z. B. Instagram DMs), zur Erfassung von Reservierungen und zur
          Nachverfolgung von Reviews. Der konkrete Leistungsumfang ergibt sich aus dem
          gewaehlten Paket bzw. Angebot.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">3. Registrierung und Zugang</h2>
        <p>
          Fuer die Nutzung der Plattform ist ein Nutzerkonto erforderlich. Der Kunde stellt
          sicher, dass alle Angaben korrekt sind und Zugangsdaten vertraulich behandelt
          werden.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">4. Integrationen und Drittanbieter</h2>
        <p>
          Fuer die Nutzung bestimmter Funktionen ist die Verbindung zu Drittanbietern
          (z. B. Meta/Instagram) erforderlich. Der Kunde stellt sicher, dass er die
          erforderlichen Rechte besitzt und die Richtlinien der Drittanbieter einhaelt.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">5. Pflichten des Kunden</h2>
        <p>
          Der Kunde nutzt die Plattform nur im Rahmen der geltenden Gesetze und unterlaesst
          missbraeuchliche Nutzung (z. B. Spam, rechtswidrige Inhalte, Umgehung von
          Sicherheitsmechanismen).
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">6. Verguetung und Zahlung</h2>
        <p>
          Preise und Zahlungsbedingungen ergeben sich aus dem jeweiligen Angebot. Sofern
          nichts anderes vereinbart ist, erfolgt die Abrechnung monatlich im Voraus und
          Rechnungen sind innerhalb von 14 Tagen faellig.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">7. Nutzungsrechte</h2>
        <p>
          Alle Rechte an der Plattform, Software und Inhalten verbleiben bei Wesponde. Der
          Kunde erhaelt ein nicht uebertragbares Nutzungsrecht fuer die Vertragslaufzeit.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">8. Verfuegbarkeit</h2>
        <p>
          Wir bemuehen uns um eine hohe Verfuegbarkeit, koennen aber keine durchgaengige
          Fehlerfreiheit garantieren. Wartungsfenster koennen zu kurzen Unterbrechungen
          fuehren.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">9. Haftung</h2>
        <p>
          Wir haften unbeschraenkt bei Vorsatz und grober Fahrlaessigkeit. Bei einfacher
          Fahrlaessigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten und
          begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">10. Laufzeit und Kuendigung</h2>
        <p>
          Der Vertrag laeuft auf unbestimmte Zeit. Sofern im Angebot nichts anderes
          vereinbart ist, kann er mit einer Frist von 14 Tagen zum Monatsende gekuendigt
          werden. Das Recht zur ausserordentlichen Kuendigung aus wichtigem Grund bleibt
          unberuehrt. Testphasen gelten nur, wenn sie schriftlich vereinbart wurden.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">11. Datenschutz</h2>
        <p>
          Informationen zur Datenverarbeitung findest du in der Datenschutzerklaerung:{" "}
          <a href="/privacy">https://wesponde.com/privacy</a>
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">12. Schlussbestimmungen</h2>
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist der
          Sitz des Unternehmens, soweit gesetzlich zulaessig. Sollten einzelne Regelungen
          unwirksam sein, bleibt die Wirksamkeit der uebrigen Regelungen unberuehrt.
        </p>
      </section>
    </LegalLayout>
  );
}
