import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";

export const metadata = {
  title: "Reminder-Design: der präzise Ablauf gegen No-Shows – Wesponde Best Practice",
  description:
    "Wie die richtige Reminder-Sequenz No-Shows um bis zu 75 % senkt – mit konkreten Timing-Daten, Nachrichtenformeln und dem Paradox der einfachen Stornierung.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function ReminderDesignNoShows() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-28 pb-16"
        style={{
          background: "linear-gradient(135deg, #0d2a1a 0%, #1e6b4a 28%, #d4ede1 80%, #f6f9ff 100%)",
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
            <span
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm"
              style={{ borderColor: "rgba(255,255,255,0.25)" }}
            >
              <Lightbulb className="h-3 w-3" />
              Best Practice
            </span>
            <span className="font-mono text-[12px] text-white/50">7 Min. Lesezeit</span>
            <span className="font-mono text-[12px] text-white/50">·</span>
            <span className="font-mono text-[12px] text-white/50">Gastronomie · Fitness · Beauty</span>
          </div>

          {/* Title */}
          <h1
            className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Reminder-Design: der präzise Ablauf gegen No-Shows
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            Warum einfaches Erinnern nicht reicht – und wie die richtige Dreischicht-Sequenz
            mit dem richtigen Ton No-Shows um bis zu 75&nbsp;% reduziert.
          </p>
        </div>
      </div>

      {/* ── Article Body ────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Freitagabend, 19:30 Uhr. Tisch 7 ist reserviert. Das Team hat das Mise en place
          fertig, ein Gedeck liegt bereit. 19:45: kein Gast. 20:00: immer noch niemand.
          Kein Anruf, keine Nachricht – einfach nicht erschienen. Der Tisch bleibt leer,
          der Umsatz fehlt, und ein anderer Gast, der spontan hätte kommen können,
          hat woanders Platz gefunden.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          No-Shows sind das stille Ertragsproblem der Service-Branche. Laut einer
          Auswertung von OpenTable gaben <strong className="text-[#171923]">28&nbsp;% der Befragten</strong> an,
          im vergangenen Jahr mindestens einmal nicht zu einer Reservierung erschienen zu sein –
          ohne Vorankündigung. In Salons und Fitnessstudios liegt die durchschnittliche
          No-Show-Rate zwischen 15 und 20&nbsp;%. Bei einem voll gebuchten Studio
          mit 40 Slots pro Woche bedeutet das bis zu 8 verlorene Einheiten – jede Woche.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Die gute Nachricht: Das Problem ist lösbar. Automatisierte Reminder-Sequenzen
          reduzieren No-Show-Raten nachweislich um <strong className="text-[#171923]">38 bis 75&nbsp;%</strong> –
          wenn sie richtig gebaut sind. „Richtig&rdquo; bedeutet hier: das richtige Timing,
          den richtigen Ton, und paradoxerweise: eine einfache Möglichkeit zum Absagen.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Die Zahlen</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Stat cards */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Was No-Shows wirklich kosten
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Bevor wir in den Ablauf einsteigen, lohnt sich ein ehrlicher Blick auf
          das Ausmaß des Problems – und warum Reminder kein Nice-to-have, sondern
          ein wirtschaftliches Muss sind.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "20 %",
              label: "durchschn. No-Show-Rate",
              sub: "in Salons & Fitnessstudios ohne Reminder-System",
            },
            {
              value: "75 %",
              label: "Reduktion möglich",
              sub: "mit automatisierten Multi-Step-Reminders (von 20 % auf 5 %)",
            },
            {
              value: "38 %",
              label: "weniger No-Shows",
              sub: "bei SMS-Reminders 24–48 h vorher (Cochrane Review, mehrere RCTs)",
            },
          ].map((s) => (
            <div
              key={s.value}
              className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]"
            >
              <p
                className="text-4xl font-semibold tracking-tight"
                style={{ color: "#1e6b4a", fontFamily: "var(--font-home-display)" }}
              >
                {s.value}
              </p>
              <p className="mt-1 font-semibold text-[#171923]">{s.label}</p>
              <p className="mt-1 font-mono text-[12px] leading-snug text-[#67718a]">{s.sub}</p>
            </div>
          ))}
        </div>

        <p className="mt-7 text-[16px] leading-relaxed text-[#2d3550]">
          Für ein Restaurant mit 60 Plätzen, das freitagabends drei
          No-Show-Tische verzeichnet (je 2–3 Personen, Durchschnittsbon 35&nbsp;€),
          bedeutet das etwa <strong className="text-[#171923]">200–350&nbsp;€ verlorener Umsatz pro Abend</strong> –
          nur durch Nicht-Erscheinen. Hochgerechnet auf 52 Freitage: bis zu 18.000&nbsp;€ pro Jahr.
          Kein Marketingbudget, keine Personalmaßnahme hat eine höhere Rendite
          als ein gut gebautes Reminder-System.
        </p>

        {/* Pull quote */}
        <blockquote
          className="my-9 rounded-2xl border-l-4 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]"
          style={{ borderColor: "#1e6b4a" }}
        >
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            „Wenn jemand aktiv bestätigt, löst das das psychologische Prinzip
            von Commitment und Konsistenz aus – wer einmal Ja gesagt hat,
            erscheint. Reminder sind kein Misstrauenssignal,
            sie sind der Auslöser dieser Bestätigung.&rdquo;
          </p>
          <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
            Basierend auf Forschung zu Commitment-Effekten bei Terminvereinbarungen,
            Journal of Medical Internet Research
          </p>
        </blockquote>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Die Best Practices</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Die 5 Bausteine des wirksamen Reminder-Designs
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Ein einzelner Reminder kurz vor dem Termin ist besser als keiner. Aber
          er ist bei Weitem nicht das Optimum. Der folgende Ablauf kombiniert
          Timing-Forschung, Nachrichtenpsychologie und Praxisdaten aus Service-Businesses –
          jeder Schritt hat eine klare Funktion.
        </p>

        {/* Steps */}
        {[
          {
            n: "01",
            title: "Die Dreischicht-Sequenz: 48 h · 24 h · 2 h",
            body: `Die wirksamste Reminder-Strategie besteht aus drei Nachrichten, nicht einer. Jede Schicht hat eine andere psychologische Funktion:

→ 48 Stunden vorher: Der Orientierungs-Reminder. Der Gast ist noch im Alltagsmodus. Ziel dieser Nachricht ist nicht Druck, sondern Sichtbarkeit: Der Termin taucht im Bewusstsein auf, bevor er im Kalender untergeht. Hier wird auch erstmals die Möglichkeit zum Absagen oder Umbuchen angeboten.

→ 24 Stunden vorher: Der Entscheidungs-Reminder. Laut einer randomisierten Studie im American Journal of Managed Care ist der 24-Stunden-Zeitpunkt der effektivste Einzelpunkt für Reminder – weil der Gast die Entscheidung, zu kommen oder abzusagen, noch bequem treffen kann. Zwei Reminder (48 h + 24 h) sind messbar wirksamer als einer.

→ 2 Stunden vorher: Der Commit-Push. Besonders relevant für Salons und Fitnessstudios, wo Spontanabsagen häufig sind. Diese kurze, freundliche Nachricht erzeugt einen letzten Commitment-Moment. Wer jetzt noch antwortet und bestätigt, erscheint fast immer.

Für Restaurants ist der 2h-Reminder optional. Für Fitness und Beauty ist er oft der wirkungsvollste der drei Schritte – hier sind Last-Minute-Umplanungen besonders häufig.`,
            tip: "Zwei Reminder sind konsistent wirksamer als einer. Studien zeigen: Der erste Reminder setzt Bewusstsein, der zweite erzeugt Handlungsbereitschaft. Drei Reminder sind das Optimum – ohne zu nerven, wenn Ton und Timing stimmen.",
          },
          {
            n: "02",
            title: "Nachrichtenton und Formulierungsprinzipien",
            body: `Die häufigste Fehlannahme beim Reminder-Design ist, dass der Ton keine Rolle spielt – Hauptsache, der Termin wird genannt. Die Forschung zeigt das Gegenteil.

Reminder funktionieren besser, wenn sie sich wie eine persönliche Nachricht anfühlen, nicht wie eine Systembenachrichtigung. Konkret bedeutet das:

Nutze den Namen: "Hallo Sabrina, dein Termin am Donnerstag..." hat nachweislich höhere Öffnungs- und Reaktionsraten als „Erinnerung: Termin am 20.03."

Aktive, warme Sprache: "Wir freuen uns, dich zu sehen" statt "Ihr Termin findet statt." Der Unterschied ist subtil – er wirkt aber auf den emotionalen Wert der Reservierung.

Halte Nachrichten kurz: Unter 3 Sätzen. Die Kerninfo (Was, Wann, Wo) plus eine Handlungsoption. Mehr ist Lärm.

Für Gastronomie-Businesses passt ein etwas formellerer, einladender Ton ("Wir haben Ihren Tisch reserviert..."). Für Fitnessstudios und Beauty-Salons funktioniert ein persönlicher, informeller Ton besser – er spiegelt das Verhältnis zwischen Trainer/Stylist und Gast wider.`,
            tip: "Vermeide Formulierungen, die Misstrauen implizieren (\"Bitte vergiss nicht...\" oder \"Falls du nicht erscheinst...\"). Formuliere stattdessen aus Vorfreude: \"Wir freuen uns auf dich.\" Dieser Ton senkt Abwehrhaltungen und erhöht die Antwortsrate.",
          },
          {
            n: "03",
            title: "Das Stornierungsparadox: einfaches Absagen reduziert No-Shows",
            body: `Dies ist der kontraintuitivste, aber empirisch am besten belegte Befund im Reminder-Design: Je einfacher du das Absagen machst, desto seltener passiert es.

Der Mechanismus ist psychologisch: Ein Gast, der nicht kommen kann, steht vor einer mentalen Abwägung. Option A: kurz absagen (kostet Sekunden, fühlt sich aber unangenehm an). Option B: einfach nicht erscheinen (keine sofortige Konfrontation, aber irgendwie schlechtes Gewissen). Option C: umbuchen (am liebsten, aber oft unklar wie).

Wenn Option A und C reibungslos und schnell möglich sind, entscheiden sich die meisten Gäste dagegen, einfach wegzubleiben. "Antworte ABSAGEN" oder "Antworte UMBUCHEN" – ein Quick Reply im DM – verwandelt eine passive No-Show in eine aktive Stornierung.

Für dein Business ist das ein Gewinn: Eine Stornierung erlaubt dir, den Slot neu zu besetzen. Ein No-Show lässt dich im Ungewissen und verschwendet Kapazität. Platformen, die einfache Cancellation-Optionen in Reminders einbauen, berichten von Stornierungsraten, die No-Shows fast vollständig ersetzen.`,
            tip: "Biete im 48h-Reminder immer eine Umbuch-Option an, nicht nur eine Absage. Der Framing-Effekt ist erheblich: \"Möchtest du umbuchen?\" hat eine höhere Conversion als \"Möchtest du absagen?\" – und du behältst die Buchung.",
          },
          {
            n: "04",
            title: "Bestätigungs-Design: der Commitment-Auslöser",
            body: `Der wirkungsvollste Moment gegen No-Shows entsteht nicht im Reminder – sondern bei der ursprünglichen Buchungsbestätigung. Hier liegt ein oft unterschätzter Hebel.

Eine Bestätigungsnachricht, die aktive Antwort erfordert, erzeugt messbar mehr Erscheinen als eine passive Bestätigung, die nur informiert. Konkret: Wer auf "Bitte bestätige mit JA" antwortet, hat eine psychologische Verpflichtung eingegangen. Das Commitment-und-Konsistenz-Prinzip (Cialdini) beschreibt diesen Effekt präzise: Menschen handeln konsistent mit dem, was sie öffentlich (oder zumindest explizit) bekundet haben.

Die Bestätigungsnachricht sollte enthalten:
– Alle Buchungsdetails (Datum, Uhrzeit, Name, ggf. Personenzahl)
– Einen expliziten Bestätigungs-Quick-Reply ("JA, ich komme")
– Die Adresse oder einen Anfahrtshinweis
– Die einfache Stornierungsoption

Diese Nachricht ist nicht nur Information – sie ist der erste Schritt der No-Show-Prävention. Sie ersetzt die passive "Ihre Buchung wurde entgegengenommen" durch ein aktives "Ich komme."`,
            tip: "Setze den Quick-Reply für die Bestätigung prominent. Studien zeigen: Wenn Gäste auf \"Bestätigen\" tippen statt die Nachricht nur zu lesen, steigt die Erscheinensrate um messbare 10–15 Prozentpunkte.",
          },
          {
            n: "05",
            title: "Anzahlungen und Pre-Commitment-Strategien",
            body: `Für High-Ticket-Termine oder wiederholt von No-Shows betroffene Zeitslots gibt es eine weitere Ebene: das finanzielle Pre-Commitment. Eine Anzahlung – auch wenn sie klein ist – verändert das Verhalten messbar.

Der psychologische Mechanismus ist Verlustaversion: Menschen tun mehr, um einen möglichen Verlust zu vermeiden, als um einen gleichwertigen Gewinn zu erzielen. Wer 10 € hinterlegt hat, erscheint – weil "Nicht-Erscheinen" sich nun wie ein konkreter Verlust anfühlt, nicht nur wie eine Unannehmlichkeit.

Für die Praxis gilt: Anzahlungen müssen nicht hoch sein, um zu wirken. Studien aus dem Beauty- und Wellnessbereich zeigen, dass selbst symbolische Beträge (5–15 % des Terminwerts) die No-Show-Rate erheblich senken. Wichtig ist die Einführung ohne Reibung: Der Gast zahlt im Buchungsprozess nahtlos, ohne das Gefühl von Misstrauen oder bürokratischem Aufwand.

Alternative ohne Anzahlung: ein explizites Absage-Commitment. "Wenn du nicht kommen kannst, genügt eine kurze Nachricht bis 6 Stunden vorher" formuliert eine klare soziale Norm – ohne finanziellen Druck. Für Stammgäste in Restaurants und Studios ist das oft die passendere Option.`,
            tip: "Segmentiere: Anzahlungen sind besonders sinnvoll für Neukunden (keine Vertrauensbasis) und für stoßzeitgebundene Slots (Silvester, Feiertage, Wochenend-Peak). Stammgäste mit gutem Track-Record nicht mit Anzahlungspflicht zu belasten, stärkt die Beziehung.",
          },
        ].map((step) => (
          <div key={step.n} className="mt-10">
            <div className="flex items-start gap-5">
              {/* Number */}
              <div className="flex-shrink-0">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "#1e6b4a" }}
                >
                  {step.n}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold tracking-tight text-[#171923]">
                  {step.title}
                </h3>
                <div className="mt-3 space-y-3">
                  {step.body.split("\n\n").map((para, i) => (
                    <p key={i} className="text-[16px] leading-relaxed text-[#2d3550]">
                      {para.trim()}
                    </p>
                  ))}
                </div>
                {/* Tip box */}
                <div
                  className="mt-4 rounded-xl border p-4"
                  style={{
                    backgroundColor: "rgba(30,107,74,0.04)",
                    borderColor: "rgba(30,107,74,0.15)",
                  }}
                >
                  <p
                    className="font-mono text-[12px] uppercase tracking-wider"
                    style={{ color: "#1e6b4a" }}
                  >
                    Tipp
                  </p>
                  <p className="mt-1 font-mono text-[13px] leading-relaxed text-[#3d4255]">
                    {step.tip}
                  </p>
                </div>
              </div>
            </div>
            {step.n !== "05" && (
              <div className="ml-[60px] mt-8 h-px bg-[#edf1f8]" />
            )}
          </div>
        ))}

        {/* Divider */}
        <div className="my-12 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Ergebnisse</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Results section */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Was jeder Baustein bringt
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die Gesamtwirkung entsteht durch das Zusammenspiel aller Schritte –
          kein einzelner Hebel allein bringt die maximale Wirkung. Hier ist die
          Mechanik pro Baustein:
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              cause: "Dreischicht-Sequenz (48 h + 24 h + 2 h)",
              effect:
                "Zwei Reminder sind nachweislich wirksamer als einer. Die Kombination aus drei Zeitpunkten ist das Optimum für Erscheinensrate.",
              delta: "−38 bis −50 %",
            },
            {
              cause: "Aktive Bestätigung per Quick Reply",
              effect:
                "Commitment-Effekt: Wer explizit bestätigt hat, erscheint in 85–90 % der Fälle.",
              delta: "−10 bis −15 %",
            },
            {
              cause: "Einfache Stornierung im Reminder",
              effect:
                "No-Shows werden zu Stornierungen – der Slot kann neu besetzt werden statt leer zu bleiben.",
              delta: "Slot-Recovery +60 %",
            },
            {
              cause: "Anzahlung / Absage-Commitment",
              effect:
                "Verlustaversion wirkt: selbst kleine finanzielle Pre-Commitments senken No-Shows bei Neukunden erheblich.",
              delta: "−20 bis −40 % (Neukunden)",
            },
          ].map((row) => (
            <div
              key={row.cause}
              className="flex items-start gap-4 rounded-2xl border border-[#2a4ea7]/12 bg-white p-5 shadow-[0_2px_8px_rgba(28,53,122,0.04)]"
            >
              <div
                className="mt-0.5 flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1 font-mono text-[12px] font-semibold"
                style={{
                  backgroundColor: "rgba(30,107,74,0.07)",
                  color: "#1e6b4a",
                }}
              >
                {row.delta}
              </div>
              <div>
                <p className="font-semibold text-[#171923]">{row.cause}</p>
                <p className="mt-1 font-mono text-[13px] leading-relaxed text-[#4c546f]">
                  {row.effect}
                </p>
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

        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Fazit: Reminder ist kein Satz – es ist ein System
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Ein einzelner Reminder kurz vor dem Termin ist besser als keiner –
          aber er ist nicht das, was die Zahlen wirklich dreht. Was wirkt, ist die
          Kombination: drei Zeitpunkte mit klarer psychologischer Funktion, ein Ton,
          der Vertrauen aufbaut statt Druck zu erzeugen, und die kontraintuitive
          Offenheit für einfache Stornierungen.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Das Schöne an diesem System: Es kostet keine Arbeitszeit. Einmal aufgebaut,
          läuft es vollautomatisch – für jede Buchung, jeden Tag, ohne dass jemand
          im Team daran denkt. Der ROI ist sofort messbar: weniger leere Tische,
          weniger unbelegte Slots, weniger verlorener Umsatz.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Für Service-Businesses, die über Instagram buchen, ist die DM-Automatisierung
          der natürliche Ort für dieses System: Der Gast bucht über den Kanal, den er
          ohnehin nutzt – und der Reminder kommt genau dort an, wo die Aufmerksamkeit
          bereits ist. Keine App, keine E-Mail-Überflutung, keine Anrufe.
          Nur der richtige Satz, zum richtigen Zeitpunkt.
        </p>

        {/* CTA */}
        <div className="mt-12 overflow-hidden rounded-2xl">
          <div
            className="relative px-8 py-12 text-center sm:px-12"
            style={{ backgroundColor: "#0d2a1a" }}
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
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6ecf9e]">
                Bereit für die Umsetzung?
              </p>
              <h3
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Reminder-Sequenz für dein Business aufsetzen
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wesponde baut die vollständige Dreischicht-Reminder-Sequenz
                für dein Restaurant, deinen Salon oder dein Studio –
                inklusive aktivem Bestätigungs-Flow, Umbuch-Option und
                automatischer Stornierungsbehandlung.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0d2a1a] transition-all hover:bg-[#d4ede1]"
                >
                  Kostenlos starten
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/70 transition-all hover:border-white/30 hover:text-white"
                >
                  Weitere Best Practices lesen
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
