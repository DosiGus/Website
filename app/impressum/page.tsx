import LegalLayout from "../../components/LegalLayout";

export const metadata = {
  title: "Impressum — Wesponde",
  description:
    "Gesetzlich vorgeschriebene Anbieterkennzeichnung und Kontaktinformationen der Wesponde GmbH.",
};

export default function ImpressumPage() {
  return (
    <LegalLayout
      title="Impressum"
      description="Nachfolgend finden Sie alle gesetzlich vorgeschriebenen Angaben gemäß § 5 TMG sowie § 55 RStV. Bitte passen Sie die Platzhalter vor dem Livegang mit Ihren realen Unternehmensdaten an."
      lastUpdated="05. Juni 2024"
    >
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">
          Verantwortlich nach § 5 TMG
        </h2>
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
              Vertretungsberechtigte Person
            </dt>
            <dd className="mt-2 text-base text-slate-700">
              Geschäftsführer: Max Mustermann
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Anschrift
            </dt>
            <dd className="mt-2 text-base text-slate-700">
              Musterstraße 1
              <br />
              10115 Berlin
              <br />
              Deutschland
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Registereintrag
            </dt>
            <dd className="mt-2 text-base text-slate-700">
              Amtsgericht Berlin (Charlottenburg)
              <br />
              HRB 000000
            </dd>
          </div>
        </dl>
        <p className="text-sm text-slate-500">
          Sitz der Gesellschaft: Berlin, Deutschland
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Kontakt</h2>
        <p className="leading-7">
          Telefon:{" "}
          <a
            className="font-semibold text-brand-dark hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            href="tel:+49301234567"
          >
            +49 (0) 30 1234567
          </a>
          <br />
          E-Mail:{" "}
          <a
            className="font-semibold text-brand-dark hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            href="mailto:hello@wesponde.com"
          >
            hello@wesponde.com
          </a>
        </p>
        <p className="text-sm text-slate-500">
          (Bitte ersetzen Sie die Platzhalter durch Ihre tatsächlichen Kontakt- und
          Unternehmensdaten.)
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Umsatzsteuer-Identifikationsnummer
        </h2>
        <p className="leading-7">
          USt-IdNr.: DE000000000 (gemäß § 27 a Umsatzsteuergesetz)
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">Haftungsausschluss</h2>
        <p>
          Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die
          Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine
          Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene
          Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
        </p>
        <p>
          Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
          Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach
          den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung
          ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung
          möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen werden wir diese
          Inhalte umgehend entfernen.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Haftung für Links &amp; Urheberrecht
        </h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
          keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
          Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
          Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von
          Rechtsverletzungen werden wir derartige Links umgehend entfernen.
        </p>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
          unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
          Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
          bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
          Gebrauch gestattet.
        </p>
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Online-Streitbeilegung der EU
        </h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung
          (OS) bereit:{" "}
          <a
            className="font-semibold text-brand-dark hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            href="https://ec.europa.eu/consumers/odr"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          . Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </LegalLayout>
  );
}
