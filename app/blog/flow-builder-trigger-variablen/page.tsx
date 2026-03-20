import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata = {
  title: "Flow-Builder verstehen: Trigger, Knoten und Variablen erklärt – Wesponde Guide",
  description:
    "Was ist ein Trigger? Was sind Knoten und Variablen? Dieser Guide erklärt die Bausteine der DM-Automatisierung verständlich – mit echten Beispielen für Restaurants, Salons und Studios.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function FlowBuilderGuide() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-28 pb-16"
        style={{
          background: "linear-gradient(135deg, #3a1a05 0%, #6b3a1e 22%, #ffffff 80%, #ffffff 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "100px 100px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider text-white/60 transition-colors hover:text-white/90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Alle Insights
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
              <BookOpen className="h-3 w-3" />
              Guide
            </span>
            <span className="font-mono text-[12px] text-white/50">10 Min. Lesezeit</span>
            <span className="font-mono text-[12px] text-white/50">·</span>
            <span className="font-mono text-[12px] text-white/50">Gastronomie · Fitness · Beauty</span>
          </div>

          {/* Title */}
          <h1
            className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Flow-Builder verstehen: Trigger, Knoten und Variablen erklärt
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            Die Grundbausteine der DM-Automatisierung verständlich erklärt –
            damit du Flows baust, die tatsächlich funktionieren. Mit konkreten Beispielen
            aus Gastronomie, Fitness und Beauty.
          </p>
        </div>
      </div>

      {/* ── Article Body ────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Stell dir vor, du stellst einen neuen Mitarbeiter ein – nur für Instagram-Nachrichten.
          Du musst ihm genau erklären: Was soll er sagen, wenn jemand schreibt? Welche Fragen
          stellt er? Was tut er, wenn jemand &bdquo;Heute&ldquo; sagt, und was, wenn jemand
          &bdquo;Nächste Woche&ldquo; antwortet? Und wie erinnert er sich an den Namen des Gastes?
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Genau das ist ein Flow-Builder: Du erklärst dem System einmal, wie ein perfektes
          Gespräch aussieht. Danach läuft es automatisch – 24 Stunden am Tag, 7 Tage die Woche,
          auch während des Abendservices, während der Massage oder während des Kurses.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Dieser Guide erklärt die fünf Grundbausteine, die hinter jedem automatisierten
          DM-Gespräch stecken: <strong className="text-[#171923]">Trigger, Knoten, Variablen,
          Quick Replies und Flow-Verbindungen.</strong> Kein Fachwissen notwendig – nur ein
          Grundverständnis, das dir hilft, bessere Flows zu bauen.
        </p>

        {/* Analogy callout */}
        <blockquote className="my-9 rounded-2xl border-l-4 border-[#6b3a1e] bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            &bdquo;Ein Flow ist wie ein Rezept: Du legst die Schritte einmal fest –
            und das Ergebnis ist jedes Mal gleich gut, egal ob du dabei bist oder nicht.&ldquo;
          </p>
        </blockquote>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Die 5 Bausteine</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 1: Trigger */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          1. Trigger – Was einen Flow startet
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Bevor irgendein Gespräch stattfinden kann, muss es gestartet werden. Der Trigger
          ist der Auslöser – der Moment, in dem das System aufwacht und sagt: &bdquo;Jetzt bin ich dran.&ldquo;
          Ohne Trigger passiert nichts. Mit dem richtigen Trigger passiert genau das Richtige
          – im richtigen Moment.
        </p>

        {/* Trigger cards */}
        <div className="mt-6 space-y-4">

          {/* Keyword Trigger */}
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#2450b2" }}
              >
                K
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#171923]">Keyword-Trigger</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">
                  Der Klassiker. Sobald jemand ein bestimmtes Wort oder eine Phrase in deine
                  Instagram-DM schreibt, startet der Flow. Du legst das Keyword fest –
                  zum Beispiel &bdquo;BUCHEN&ldquo;, &bdquo;TISCH&ldquo; oder &bdquo;TERMIN&ldquo; –
                  und das System reagiert automatisch. Keyword-Trigger eignen sich besonders gut
                  für Story-CTAs, Bio-Links und QR-Codes auf Speisekarten oder Infotafeln.
                </p>
                <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="font-mono text-[13px] text-[#2450b2]">
                    Beispiel: Gast schreibt &ldquo;TISCH&rdquo; → Flow startet → Begrüßung wird gesendet
                  </p>
                </div>
                <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="font-mono text-[13px] text-[#2450b2]">
                    Beispiel: Story mit Text &ldquo;Schreib TERMIN für einen freien Slot!&rdquo; → Follower schreibt &ldquo;TERMIN&rdquo; → Buchungsflow startet
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comment-to-DM Trigger */}
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#2450b2" }}
              >
                C
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#171923]">Comment-to-DM-Trigger</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">
                  Jemand kommentiert einen deiner Posts mit einem bestimmten Wort – und erhält
                  automatisch eine DM. Das klingt simpel, ist aber enorm wirkungsvoll: Du holst
                  interessierte Follower genau in dem Moment ab, in dem sie aktiv mit deinem
                  Content interagieren. Das ist der Intent-Moment – wenn jemand &bdquo;Infos bitte!&ldquo;
                  kommentiert, will er jetzt und nicht in zwei Stunden eine Antwort.
                </p>
                <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="font-mono text-[13px] text-[#2450b2]">
                    Beispiel: Post über neues Herbstmenü → Kommentar &ldquo;RESERVIEREN&rdquo; → automatische DM mit Buchungslink startet
                  </p>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-[#67718a]">
                  Comment-to-DM-Trigger erzielen laut Branchendaten Öffnungsraten von 35–65 %
                  und Click-Through-Rates von 12–28 % – deutlich höher als organische Posts allein.
                </p>
              </div>
            </div>
          </div>

          {/* Story Reply Trigger */}
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#2450b2" }}
              >
                S
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#171923]">Story-Reply-Trigger</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">
                  Wenn jemand auf deine Instagram-Story antwortet – egal mit welchem Text –
                  kann das einen Flow starten. Besonders effektiv kombiniert mit einer klaren
                  Handlungsaufforderung in der Story selbst: &bdquo;Antworte auf diese Story,
                  um deinen Termin zu buchen!&ldquo; Der Story-Reply-Trigger funktioniert
                  unabhängig vom genauen Wortlaut der Antwort.
                </p>
                <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="font-mono text-[13px] text-[#2450b2]">
                    Beispiel: Story &ldquo;Noch 3 freie Plätze diese Woche — antworte hier!&rdquo; → jede Antwort startet den Buchungsflow
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Zeitbasierter Trigger */}
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#2450b2" }}
              >
                Z
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#171923]">Zeitbasierter Trigger (Follow-up)</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">
                  Zeitbasierte Trigger starten nicht durch eine Nachricht, sondern durch das
                  Verstreichen von Zeit. Klassisches Beispiel: 24 Stunden vor einer Reservierung
                  sendet das System automatisch einen Reminder. Oder: 2 Stunden nach dem gebuchten
                  Termin geht eine Nachfrage raus. Diese Trigger laufen vollständig im Hintergrund –
                  du musst nichts anstoßen.
                </p>
                <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="font-mono text-[13px] text-[#2450b2]">
                    Beispiel: Reservierung am Freitag um 19:00 Uhr → Donnerstag um 19:00 Uhr geht automatisch ein Reminder raus
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Knoten</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 2: Nodes */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          2. Knoten – Die Bausteine des Flows
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Stell dir einen Flow als eine Kette von Stationen vor. Jede Station ist ein
          Knoten (englisch: Node). Am Trigger startet der Flow – dann wird von Knoten zu
          Knoten weitergeführt, bis das Gespräch abgeschlossen ist. Es gibt vier
          grundlegende Knotentypen, die zusammen jedes denkbare Gespräch abbilden können.
        </p>

        <div className="mt-6 space-y-4">

          {/* Nachrichtenknoten */}
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#2450b2" }}
              >
                N
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#171923]">Nachrichtenknoten</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">
                  Der einfachste Knoten. Er sendet eine Nachricht – und wartet nicht auf eine
                  Antwort. Typisch für Begrüßungsnachrichten, Informationen, Bestätigungen
                  oder Abschluss-Dankesnachrichten. Der Nachrichtenknoten sendet und führt
                  direkt zum nächsten Schritt weiter.
                </p>
                <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="font-mono text-[13px] text-[#2450b2]">
                    Beispiel: &ldquo;Hallo! Schön, dass du dir einen Tisch reservieren möchtest. Ich helfe dir direkt weiter. 😊&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fragenknoten */}
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#2450b2" }}
              >
                F
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#171923]">Fragenknoten</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">
                  Der Fragenknoten stellt eine Frage und wartet auf die Antwort des Gegenübers.
                  Erst wenn eine Antwort eintrifft, geht der Flow weiter. Die Antwort kann
                  dabei entweder eine freie Texteingabe sein (Gast tippt den Datum selbst)
                  oder eine Auswahl aus vorgegebenen Quick-Reply-Buttons (mehr dazu in
                  Abschnitt 4). Fragenknoten sind das Herzstück der Dateneingabe – hier
                  sammelst du die Infos für die Reservierung.
                </p>
                <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="font-mono text-[13px] text-[#2450b2]">
                    Beispiel: &ldquo;Für welches Datum möchtest du reservieren?&rdquo; → Gast antwortet &ldquo;Freitag, 14. März&rdquo; → Flow speichert Datum und geht weiter
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bedingungsknoten */}
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#2450b2" }}
              >
                B
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#171923]">Bedingungsknoten</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">
                  Der Bedingungsknoten trifft Entscheidungen. Er liest die Antwort des Gastes
                  und teilt den Flow in verschiedene Pfade auf – je nachdem, was geantwortet
                  wurde. In der Programmierung heißt das &bdquo;if/else&ldquo;:
                  wenn Bedingung zutrifft → Pfad A; sonst → Pfad B. In der Praxis bedeutet
                  das: Dein Flow kann intelligent auf unterschiedliche Antworten reagieren,
                  statt immer denselben Text zu senden.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl bg-[#f0f5ff] p-3">
                    <p className="font-mono text-[13px] text-[#2450b2]">
                      Wenn Antwort = &ldquo;Heute&rdquo; → sende verfügbare Uhrzeiten für heute
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f0f5ff] p-3">
                    <p className="font-mono text-[13px] text-[#2450b2]">
                      Wenn Antwort = &ldquo;Nächste Woche&rdquo; → frage nach dem genauen Tag
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f0f5ff] p-3">
                    <p className="font-mono text-[13px] text-[#2450b2]">
                      Sonstiges → sende &ldquo;Könntest du ein konkretes Datum nennen?&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bestätigungsknoten */}
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#2450b2" }}
              >
                ✓
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#171923]">Bestätigungsknoten</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">
                  Der Bestätigungsknoten steht am Ende eines Buchungsflows. Er fasst alle
                  gesammelten Informationen zusammen und sendet dem Gast eine übersichtliche
                  Bestätigung. Gleichzeitig wird die Reservierung oder der Termin im System
                  angelegt. Dieser Knoten ist das &bdquo;Ziel&ldquo; des Flows – hier ist
                  die Buchung abgeschlossen.
                </p>
                <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
                  <p className="font-mono text-[13px] text-[#2450b2]">
                    Beispiel: &ldquo;Super, {'{{name}}'}! Dein Tisch für {'{{personenanzahl}}'} Personen am {'{{datum}}'} um {'{{uhrzeit}}'} Uhr ist reserviert. Wir freuen uns auf dich! 🎉&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Variablen</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 3: Variables */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          3. Variablen – Das Gedächtnis des Flows
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Variablen sind das, was einen Flow von einer dummen Textmaschine zu einem
          echten Gespräch macht. Sie speichern Informationen, die der Gast nennt –
          und machen sie an anderen Stellen im Flow wiederverwendbar.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Einfach erklärt: Wenn dein Gast seinen Namen eingibt, merkt sich der Flow
          diesen Namen in einer Variable namens <code className="rounded bg-[#f0f5ff] px-1.5 py-0.5 font-mono text-[13px] text-[#2450b2]">{'{{name}}'}</code>.
          An jeder anderen Stelle im Flow kannst du dann <code className="rounded bg-[#f0f5ff] px-1.5 py-0.5 font-mono text-[13px] text-[#2450b2]">{'{{name}}'}</code> schreiben –
          und das System ersetzt es automatisch durch den echten Namen.
        </p>

        {/* Variable examples */}
        <div className="mt-6 rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <h3 className="text-base font-semibold text-[#171923]">Häufige Variablen im Buchungsflow</h3>
          <div className="mt-4 space-y-3">
            {[
              { variable: "{{name}}", description: "Name des Gastes", example: "Maria" },
              { variable: "{{datum}}", description: "Gewünschtes Datum", example: "Freitag, 14. März" },
              { variable: "{{uhrzeit}}", description: "Gewünschte Uhrzeit", example: "19:30 Uhr" },
              { variable: "{{personenanzahl}}", description: "Anzahl der Personen", example: "4" },
              { variable: "{{telefon}}", description: "Telefonnummer für Rückfragen", example: "+49 151 12345678" },
            ].map((v) => (
              <div key={v.variable} className="flex items-start gap-4 rounded-xl bg-[#f6f9ff] p-3">
                <code className="min-w-[160px] flex-shrink-0 font-mono text-[13px] font-semibold text-[#2450b2]">
                  {v.variable}
                </code>
                <div className="flex-1">
                  <p className="text-[13px] text-[#171923]">{v.description}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-[#67718a]">
                    Beispielwert: {v.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Variable usage example */}
        <div className="mt-6 rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <h3 className="text-base font-semibold text-[#171923]">So sieht eine Bestätigungsnachricht mit Variablen aus</h3>
          <div className="mt-4 rounded-xl bg-[#f0f5ff] p-4">
            <p className="font-mono text-[13px] leading-relaxed text-[#2450b2]">
              Was du eingibst:
            </p>
            <p className="mt-2 rounded-lg border border-[#2a4ea7]/20 bg-white p-3 font-mono text-[13px] leading-relaxed text-[#3d4255]">
              &ldquo;Perfekt, {'{{name}}'}! Wir haben deinen Tisch für {'{{personenanzahl}}'} Personen
              am {'{{datum}}'} um {'{{uhrzeit}}'} Uhr reserviert. Bis dann! 🙏&rdquo;
            </p>
          </div>
          <div className="mt-3 rounded-xl bg-[#f0fff5] p-4">
            <p className="font-mono text-[13px] leading-relaxed text-[#1a7a4a]">
              Was der Gast empfängt:
            </p>
            <p className="mt-2 rounded-lg border border-green-200 bg-white p-3 font-mono text-[13px] leading-relaxed text-[#3d4255]">
              &ldquo;Perfekt, Maria! Wir haben deinen Tisch für 4 Personen am Freitag,
              14. März um 19:30 Uhr reserviert. Bis dann! 🙏&rdquo;
            </p>
          </div>
        </div>

        <p className="mt-6 text-[16px] leading-relaxed text-[#2d3550]">
          Das Ergebnis: Die Nachricht fühlt sich persönlich und menschlich an –
          obwohl sie vollautomatisch erstellt wurde. Variablen sind der Unterschied
          zwischen einem Gespräch und einem Formular.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Quick Replies</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 4: Quick Replies */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          4. Quick Replies – Antwortbuttons für bessere Gespräche
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Quick Replies sind klickbare Antwortbuttons, die unter einer Nachricht erscheinen.
          Anstatt zu tippen, tippt der Gast einfach auf eine Option. Das klingt nach
          einem kleinen Detail – macht aber einen enormen Unterschied für die
          Abschlussrate eines Flows.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-5 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <p className="font-semibold text-[#171923]">Wann Quick Replies ideal sind</p>
            <ul className="mt-3 space-y-2">
              {[
                "Bei geschlossenen Fragen (Heute / Morgen / Andere Zeit)",
                "Bei der Personenzahl-Auswahl (1–2 / 3–4 / 5+)",
                "Bei Ja/Nein-Entscheidungen (Bestätigen / Ändern)",
                "Bei der Uhrzeit-Auswahl aus festen Serviceslots",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[14px] text-[#2d3550]">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2450b2]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-5 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <p className="font-semibold text-[#171923]">Wann Freitext besser ist</p>
            <ul className="mt-3 space-y-2">
              {[
                "Bei der Namens-Eingabe (unendlich viele Möglichkeiten)",
                "Bei Sonderwünschen oder besonderen Anlässen",
                "Bei einer Telefonnummer oder E-Mail-Adresse",
                "Bei individuellem Feedback nach dem Besuch",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[14px] text-[#2d3550]">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#67718a]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-6 rounded-xl border border-[#2a4ea7]/12 p-4"
          style={{ backgroundColor: "rgba(36,80,178,0.04)" }}
        >
          <p className="font-mono text-[12px] uppercase tracking-wider text-[#2450b2]">
            Praxis-Tipp
          </p>
          <p className="mt-1 font-mono text-[13px] leading-relaxed text-[#3d4255]">
            Faustregel: Nutze Quick Replies immer dann, wenn du die möglichen Antworten
            im Voraus kennst und auf max. 3–4 Optionen begrenzen kannst. Bei mehr als
            4 Optionen wird es unübersichtlich – dann lieber Freitext mit einer klaren
            Anweisung (z. B. &ldquo;Schreib dein Wunschdatum im Format TT.MM.&rdquo;).
          </p>
        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Flow-Verbindungen</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 5: Connections */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          5. Flow-Verbindungen – Wie alles zusammenhängt
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Einzelne Knoten allein machen noch keinen Flow. Erst die Verbindungen zwischen
          den Knoten ergeben den Gesprächspfad. Wie Gleise im Schienennetz: Du legst fest,
          wohin der Zug von jeder Station aus fährt.
        </p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <h3 className="text-base font-semibold text-[#171923]">Linearer Flow</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#2d3550]">
              Alle Knoten sind hintereinander geschaltet. Knoten A führt zu Knoten B,
              Knoten B zu Knoten C. Kein Verzweigen, kein Wenn/Dann. Ideal für einfache
              Abläufe, bei denen die Antworten immer gleich verarbeitet werden – z. B. ein
              reiner Informationsflow oder eine FAQ-Antwort.
            </p>
          </div>
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <h3 className="text-base font-semibold text-[#171923]">Verzweigter Flow</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#2d3550]">
              Knoten können mehrere ausgehende Verbindungen haben – je eine pro möglicher
              Antwort. So entsteht ein echter Entscheidungsbaum: Gast wählt
              &bdquo;Heute&ldquo; → Pfad A; Gast wählt &bdquo;Andere Zeit&ldquo; → Pfad B.
              Verzweigte Flows sind aufwändiger zu bauen, liefern aber eine viel
              natürlichere Konversationserfahrung.
            </p>
          </div>
          <div className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
            <h3 className="text-base font-semibold text-[#171923]">Fehlerbehandlung</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[#2d3550]">
              Was passiert, wenn der Gast etwas Unerwartetes schreibt? Ein guter Flow hat
              immer einen Fallback-Pfad für unbekannte Antworten. Statt einfach nichts zu
              tun, sendet der Knoten eine freundliche Nachfrage:
            </p>
            <div className="mt-3 rounded-xl bg-[#f0f5ff] p-3">
              <p className="font-mono text-[13px] text-[#2450b2]">
                Unbekannte Antwort erkannt → &ldquo;Ich bin mir nicht sicher, ob ich dich richtig verstanden habe. Meintest du Heute, Morgen oder ein anderes Datum?&rdquo;
              </p>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#67718a]">
              Flows ohne Fehlerbehandlung enden in Sackgassen. Der Gast wartet auf eine
              Antwort, die nie kommt – und bricht ab. Eine einfache Fallback-Nachricht
              rettet die meisten dieser Situationen.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Flow-Diagramm</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Visual Flow Diagram */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Ein vollständiger Flow in der Übersicht
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          So sieht ein typischer Reservierungsflow für ein Restaurant aus – von
          Trigger bis Bestätigung, mit allen fünf Bausteinen:
        </p>

        <div className="my-8 flex flex-col items-center gap-2">
          {/* Trigger */}
          <div className="rounded-xl bg-[#2450b2] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_4px_12px_rgba(36,80,178,0.25)]">
            Trigger: Gast schreibt &bdquo;TISCH&ldquo;
          </div>
          <div className="h-6 w-0.5 bg-[#2a4ea7]/30" />

          {/* Greeting node */}
          <div className="w-full max-w-sm rounded-xl border border-[#2a4ea7]/15 bg-white px-6 py-3 text-center text-sm text-[#171923] shadow-[0_2px_8px_rgba(28,53,122,0.04)]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#7485ad]">Nachrichtenknoten</span>
            <p className="mt-1">Begrüßung senden</p>
          </div>
          <div className="h-6 w-0.5 bg-[#2a4ea7]/30" />

          {/* Question node: date */}
          <div className="w-full max-w-sm rounded-xl border border-[#2a4ea7]/15 bg-white px-6 py-3 text-center text-sm text-[#171923] shadow-[0_2px_8px_rgba(28,53,122,0.04)]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#7485ad]">Fragenknoten</span>
            <p className="mt-1">Datum abfragen → speichert als <code className="font-mono text-[#2450b2]">{"{{datum}}"}</code></p>
            <div className="mt-2 flex justify-center gap-2">
              <span className="rounded-lg border border-[#2a4ea7]/20 bg-[#f0f5ff] px-3 py-1 font-mono text-[11px] text-[#2450b2]">Heute</span>
              <span className="rounded-lg border border-[#2a4ea7]/20 bg-[#f0f5ff] px-3 py-1 font-mono text-[11px] text-[#2450b2]">Morgen</span>
              <span className="rounded-lg border border-[#2a4ea7]/20 bg-[#f0f5ff] px-3 py-1 font-mono text-[11px] text-[#2450b2]">Anderes Datum</span>
            </div>
          </div>
          <div className="h-6 w-0.5 bg-[#2a4ea7]/30" />

          {/* Question node: guests */}
          <div className="w-full max-w-sm rounded-xl border border-[#2a4ea7]/15 bg-white px-6 py-3 text-center text-sm text-[#171923] shadow-[0_2px_8px_rgba(28,53,122,0.04)]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#7485ad]">Fragenknoten</span>
            <p className="mt-1">Personenzahl abfragen → speichert als <code className="font-mono text-[#2450b2]">{"{{personenanzahl}}"}</code></p>
            <div className="mt-2 flex justify-center gap-2">
              <span className="rounded-lg border border-[#2a4ea7]/20 bg-[#f0f5ff] px-3 py-1 font-mono text-[11px] text-[#2450b2]">1–2</span>
              <span className="rounded-lg border border-[#2a4ea7]/20 bg-[#f0f5ff] px-3 py-1 font-mono text-[11px] text-[#2450b2]">3–4</span>
              <span className="rounded-lg border border-[#2a4ea7]/20 bg-[#f0f5ff] px-3 py-1 font-mono text-[11px] text-[#2450b2]">5+</span>
            </div>
          </div>
          <div className="h-6 w-0.5 bg-[#2a4ea7]/30" />

          {/* Question node: name */}
          <div className="w-full max-w-sm rounded-xl border border-[#2a4ea7]/15 bg-white px-6 py-3 text-center text-sm text-[#171923] shadow-[0_2px_8px_rgba(28,53,122,0.04)]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#7485ad]">Fragenknoten</span>
            <p className="mt-1">Name abfragen → speichert als <code className="font-mono text-[#2450b2]">{"{{name}}"}</code></p>
            <p className="mt-1 font-mono text-[11px] text-[#7485ad]">Freitexteingabe</p>
          </div>
          <div className="h-6 w-0.5 bg-[#2a4ea7]/30" />

          {/* Confirmation node */}
          <div className="w-full max-w-sm rounded-xl border border-green-200 bg-green-50 px-6 py-3 text-center text-sm shadow-[0_2px_8px_rgba(0,128,64,0.06)]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-green-600">Bestätigungsknoten</span>
            <p className="mt-1 text-green-800">
              &ldquo;Super, <code className="font-mono">{"{{name}}"}</code>! Tisch für <code className="font-mono">{"{{personenanzahl}}"}</code> am <code className="font-mono">{"{{datum}}"}</code> ist reserviert!&rdquo;
            </p>
            <p className="mt-1 font-mono text-[10px] text-green-600">Reservierung wird automatisch angelegt</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Ersten Flow bauen</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* First steps */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          So baust du deinen ersten Flow
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Der häufigste Fehler beim ersten Flow: zu viel auf einmal wollen. Starte einfach.
          Ein funktionierender simpler Flow ist besser als ein komplizierter, der nie fertig wird.
        </p>

        <div className="mt-6 space-y-4">
          {[
            {
              n: "01",
              title: "Starte mit einem klaren Ziel",
              body: "Was soll dein Flow erreichen? Tischreservierung, Terminbuchung, FAQ-Antwort, Google-Bewertungsanfrage? Leg dich auf ein Ziel fest. Misch nicht mehrere Ziele in einen Flow.",
            },
            {
              n: "02",
              title: "Schreib das Gespräch zuerst auf Papier",
              body: "Bevor du irgendeinen Knoten baust: Schreib das ideale Gespräch wie einen Dialog auf. Was sagst du zuerst? Was fragst du? Was antwortet der Gast? Wie endet es? Dieser Schritt dauert 10 Minuten und spart später Stunden.",
            },
            {
              n: "03",
              title: "Wähle einen Trigger, der zu deinem Business passt",
              body: "Für Restaurants eignet sich ein Keyword-Trigger auf der Story hervorragend. Für Salons oft ein Comment-to-DM unter einem Portfolio-Post. Für Studios ein Story-Reply-Trigger auf den Stundenplan. Fang mit dem Kanal an, der für dich am einfachsten zu testen ist.",
            },
            {
              n: "04",
              title: "Maximal 3–4 Fragen",
              body: "Jede zusätzliche Frage erhöht die Abbruchrate. Welche drei oder vier Informationen brauchst du wirklich, um die Buchung abzuschließen? Alles andere ist optional und kann nach der Buchung gesammelt werden.",
            },
            {
              n: "05",
              title: "Teste mit dir selbst",
              body: "Schreib von deinem eigenen Instagram-Account das Keyword, das den Flow triggert. Geh das Gespräch einmal vollständig durch. Fühlt es sich natürlich an? Kommt die Bestätigung an? Wird die Reservierung korrekt angelegt? Erst dann ist der Flow bereit für echte Gäste.",
            },
          ].map((step, idx, arr) => (
            <div key={step.n} className="flex items-start gap-5">
              <div className="flex-shrink-0">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "#2450b2" }}
                >
                  {step.n}
                </div>
              </div>
              <div className="min-w-0 flex-1 pb-5" style={{ borderBottom: idx < arr.length - 1 ? "1px solid #edf1f8" : "none" }}>
                <h3 className="text-base font-semibold text-[#171923]">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#2d3550]">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Häufige Fehler</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Common mistakes */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Die häufigsten Fehler beim Flow-Bau
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Diese Fehler sehen wir regelmäßig bei neu erstellten Flows – und alle
          sind leicht zu vermeiden, wenn man sie kennt.
        </p>

        <div className="mt-6 space-y-4">
          {[
            {
              emoji: "💬",
              title: "Zu viele Fragen auf einmal",
              problem: "Ein Flow mit 8 Fragen hintereinander fühlt sich wie ein Bewerbungsformular an – nicht wie ein Gespräch. Gäste brechen ab.",
              fix: "Maximal 3–4 Pflichtfragen. Alles weitere ist optional oder kann im persönlichen Gespräch geklärt werden.",
            },
            {
              emoji: "🤖",
              title: "Kein menschlicher Ton",
              problem: "Nachrichten wie &bdquo;Bitte geben Sie Ihr Wunschdatum ein&ldquo; wirken kalt und maschinell. Gäste fühlen sich wie bei einem Behördengang.",
              fix: "Schreib so, wie du persönlich antworten würdest: &bdquo;Für welches Datum darf ich dir einen Tisch reservieren?&ldquo; Warm, direkt, freundlich.",
            },
            {
              emoji: "🚫",
              title: "Kein Fallback bei unerwarteten Antworten",
              problem: "Wenn ein Gast etwas Unerwartetes schreibt und der Flow einfach stoppt, ist die Buchung verloren. Keine Antwort ist das schlimmste Nutzererlebnis.",
              fix: "Füge bei jedem Fragenknoten einen Fallback-Pfad hinzu: eine freundliche Nachfrage, die den Gast zurück auf Kurs bringt.",
            },
            {
              emoji: "❌",
              title: "Kein klares Call-to-Action im Trigger",
              problem: "Wenn Gäste nicht wissen, welches Keyword sie schreiben sollen, startet der Flow nie. Ein Trigger ohne CTA ist wie eine Tür ohne Klinke.",
              fix: "Kommuniziere das Keyword aktiv: in der Bio, in der Story, in Posts. &bdquo;Schreib TISCH um zu reservieren&ldquo; ist eindeutig. &bdquo;Schreib uns&ldquo; ist es nicht.",
            },
            {
              emoji: "⏰",
              title: "Kein Follow-up nach der Buchung",
              problem: "Der Flow endet nach der Bestätigung – und damit auch die Beziehung. Dabei ist der Moment direkt nach der Buchung der ideale Zeitpunkt für einen Reminder.",
              fix: "Verknüpfe den Bestätigungsknoten mit einem zeitbasierten Trigger für einen Reminder 24 Stunden vor dem Termin. Einmal einrichten, dauerhaft wirken.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-5 shadow-[0_2px_8px_rgba(28,53,122,0.04)]"
            >
              <div className="flex items-start gap-4">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <p className="font-semibold text-[#171923]">{item.title}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#3d4255]">
                    <strong className="text-[#c0392b]">Problem:</strong> {item.problem}
                  </p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#3d4255]">
                    <strong className="text-[#1a7a4a]">Lösung:</strong> {item.fix}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-12 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Fazit</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Fazit */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Fazit: Flows sind Gespräche, keine Formulare
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Das Wichtigste, das du dir merken kannst: Ein guter Flow fühlt sich für den
          Gast nicht wie Automatisierung an. Er fühlt sich an wie ein freundlicher,
          gut geschulter Mitarbeiter, der genau weiß, was er zu fragen hat – und der
          niemals schläft.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Trigger starten das Gespräch. Knoten strukturieren es. Variablen machen es
          persönlich. Quick Replies machen es bequem. Und die Verbindungen zwischen
          den Knoten bestimmen, wie intelligent und flexibel der Flow auf verschiedene
          Situationen reagiert.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Du musst kein Entwickler sein, um einen guten Flow zu bauen. Du musst nur
          wissen, wie ein gutes Gespräch aussieht – und dieses Gespräch einmal
          aufschreiben. Den Rest erledigt die Automatisierung.
        </p>

        {/* Summary stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { value: "5", label: "Grundbausteine", sub: "Trigger, Knoten, Variablen, Quick Replies, Verbindungen" },
            { value: "3–4", label: "Optimale Fragen", sub: "pro Flow – alles darüber erhöht die Abbruchrate" },
            { value: "24/7", label: "Verfügbarkeit", sub: "auch Freitagabend, nachts und am Wochenende" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]"
            >
              <p
                className="text-4xl font-semibold tracking-tight text-[#2450b2]"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                {s.value}
              </p>
              <p className="mt-1 font-semibold text-[#171923]">{s.label}</p>
              <p className="mt-1 font-mono text-[12px] leading-snug text-[#67718a]">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 overflow-hidden rounded-2xl">
          <div
            className="relative px-8 py-12 text-center sm:px-12"
            style={{ backgroundColor: "#0a1a55" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "80px 80px",
              }}
            />
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#7aaeff]">
                Bereit für den ersten Flow?
              </p>
              <h3
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Deinen ersten Flow in unter 30 Minuten aufsetzen
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wesponde begleitet dich beim Aufbau deines ersten Buchungsflows –
                mit vorgefertigten Templates für Restaurants, Salons und Studios.
                Kein technisches Vorwissen notwendig.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0a1a55] transition-all hover:bg-[#e8efff]"
                >
                  Kostenlos starten
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
                >
                  Weitere Guides lesen
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-[13px] text-[#7485ad] transition-colors hover:text-[#2450b2]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zu allen Insights
          </Link>
        </div>

      </article>
    </div>
  );
}
