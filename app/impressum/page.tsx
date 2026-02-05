import LegalLayout from "../../components/LegalLayout";

export const metadata = {
  title: "Impressum - Wesponde",
  description: "Gesetzlich vorgeschriebene Anbieterkennzeichnung fuer Wesponde.",
};

export default function ImpressumPage() {
  return (
    <LegalLayout
      title="Impressum"
      description="Angaben gemaess § 5 TMG und § 18 Abs. 2 MStV."
      lastUpdated="05.02.2026"
    >
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white">Anbieter</h2>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Unternehmen
            </dt>
            <dd className="mt-2 text-base font-medium text-zinc-200">
              Wesponde (Einzelunternehmen)
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Vertretungsberechtigte Person
            </dt>
            <dd className="mt-2 text-base text-zinc-200">
              Kevin Santos
            </dd>
          </div>
          <div>
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
          <div>
            <dt className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Registereintrag
            </dt>
            <dd className="mt-2 text-base text-zinc-200">
              Nicht vorhanden
              <br />
              Nicht vorhanden
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Kontakt</h2>
        <p className="leading-7">
          Telefon: nicht vorhanden
          <br />
          E-Mail: wesponde@gmail.com
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Umsatzsteuer-ID</h2>
        <p className="leading-7">USt-IdNr.: nicht vorhanden</p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Verantwortlich fuer Inhalte</h2>
        <p>
          Verantwortlich fuer journalistisch-redaktionelle Inhalte gemaess § 18 Abs. 2 MStV
          (falls erforderlich): Kevin Santos, Kurzroederstrasse 26, 60435 Frankfurt am Main.
        </p>
      </section>

      <section className="space-y-4 border-t border-white/10 pt-8">
        <h2 className="text-xl font-semibold text-white">Online-Streitbeilegung</h2>
        <p>
          Die Europaeische Kommission stellt eine Plattform zur Online-Streitbeilegung
          (OS) bereit: <a href="https://ec.europa.eu/consumers/odr">https://ec.europa.eu/consumers/odr</a>.
          Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </LegalLayout>
  );
}
