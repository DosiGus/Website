import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";

export const metadata = {
  title: "Quick Replies richtig einsetzen: weniger Tipp-Aufwand, mehr Abschluss – Wesponde",
  description:
    "Wie Quick-Reply-Buttons in Instagram-DM-Flows die Abbruchrate senken und Buchungsabschlüsse steigern – mit Forschungsdaten, Designprinzipien und konkreten Beispielen.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function QuickRepliesConversion() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-28 pb-16"
        style={{
          background: "linear-gradient(135deg, #0d2b1e 0%, #1e6b4a 28%, #d4edd9 78%, #f6f9ff 100%)",
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
              <Lightbulb className="h-3 w-3" />
              Best Practice
            </span>
            <span className="font-mono text-[12px] text-white/50">6 Min. Lesezeit</span>
            <span className="font-mono text-[12px] text-white/50">·</span>
            <span className="font-mono text-[12px] text-white/50">Gastronomie · Fitness · Beauty</span>
          </div>

          {/* Title */}
          <h1
            className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Quick Replies richtig einsetzen: weniger Tipp-Aufwand, mehr Abschluss
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            Warum ein einziger Tap mehr Buchungen erzeugt als drei Freitextfragen –
            und wie du Quick-Reply-Buttons so gestaltest, dass sie wirklich konvertieren.
          </p>
        </div>
      </div>

      {/* ── Article Body ────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Du hast einen automatisierten Instagram-DM-Flow eingerichtet. Der Trigger funktioniert,
          die erste Nachricht kommt sofort – aber dann passiert etwas Seltsames: Ein Großteil
          der Interessenten antwortet nicht mehr. Die Konversation bleibt hängen, genau an der
          Stelle, wo du die erste offene Frage stellst.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Das ist kein Zufall. Es ist ein Designproblem. Und Quick-Reply-Buttons sind
          die direkteste Lösung dafür – wenn man sie richtig einsetzt.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Etwa 40 Prozent der Nutzer verlassen einen Chatbot-Flow, noch bevor sie die erste
          Antwort getippt haben. Weitere 25 Prozent springen nach der zweiten Nachricht ab
          (Dashly Chatbot Statistics, 2024). Der größte Abbruch-Moment in Messaging-Flows ist
          also nicht die Mitte oder das Ende – es ist der Anfang. Der Moment, in dem ein
          Nutzer das leere Textfeld sieht und entscheiden muss, was er schreiben soll.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Warum Tippen bremst</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 1 */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Das Freitextfeld ist ein Conversion-Killer
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Wenn ein Nutzer auf dem Smartphone tippt, passieren mehrere Dinge gleichzeitig:
          Er muss entscheiden, was er schreiben will. Er muss es formulieren.
          Er muss tippen – auf einer kleinen Tastatur, oft mit einer Hand, oft unterwegs.
          Jeder dieser Schritte ist ein Mikro-Widerstand. Und Mikro-Widerstände summieren sich
          zu Abbrüchen.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die Forschung zur kognitiven Last bestätigt das: Je mehr mentale Energie ein Interface
          verbraucht, desto wahrscheinlicher ist es, dass der Nutzer aufgibt. Eine Reduktion
          der kognitiven Last um rund 77 Prozent kann Conversions um 25 Prozent steigern
          (CXL Institute). Quick-Reply-Buttons entfernen genau die Entscheidungsschritte,
          die unnötige kognitive Last erzeugen.
        </p>

        {/* Stats grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { value: "40 %", label: "Abbruch vor der 1. Antwort", sub: "Nutzer die einen Chatbot-Flow verlassen, bevor sie tippen (Dashly, 2024)" },
            { value: "30×", label: "höhere Kaufrate", sub: "bei 6 statt 24 Optionen — klassische Jam-Studie zur Entscheidungsparalyse" },
            { value: "25 %", label: "mehr Conversions", sub: "durch signifikante Reduktion kognitiver Last im Interface-Design (CXL Institute)" },
          ].map((s) => (
            <div
              key={s.value}
              className="rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]"
            >
              <p
                className="text-4xl font-semibold tracking-tight text-[#1e6b4a]"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                {s.value}
              </p>
              <p className="mt-1 font-semibold text-[#171923]">{s.label}</p>
              <p className="mt-1 font-mono text-[12px] leading-snug text-[#67718a]">{s.sub}</p>
            </div>
          ))}
        </div>

        <p className="mt-7 text-[16px] leading-relaxed text-[#2d3550]">
          Das Hick-Hyman-Gesetz, eines der fundamentalen Prinzipien des UX-Designs, zeigt:
          Die Zeit, die ein Mensch braucht, um eine Entscheidung zu treffen, steigt
          logarithmisch mit der Anzahl der Optionen. Ein leeres Textfeld bedeutet
          unendlich viele Optionen. Ein Quick-Reply-Button mit drei Antworten bedeutet
          drei. Der Unterschied ist nicht graduell – er ist fundamental.
        </p>

        {/* Pull quote */}
        <blockquote className="my-9 rounded-2xl border-l-4 border-[#1e6b4a] bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            „Menschen beantworten 6 Fragen in einem Chat, die sie in einem Formular niemals
            ausfüllen würden – weil es sich nach Hilfe anfühlt, nicht nach Hausaufgaben.
            Quick Replies machen jeden Schritt noch leichter.&rdquo;
          </p>
          <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
            Conversational Marketing Research, Qualified.com, 2024
          </p>
        </blockquote>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Die Regeln</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 2 */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Die 5 Regeln für Quick Replies, die wirklich konvertieren
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Nicht jeder Quick-Reply-Button ist automatisch besser als kein Button.
          Falsch eingesetzte Optionen erzeugen Verwirrung statt Klarheit. Diese fünf
          Prinzipien trennen Quick Replies, die konvertieren, von solchen, die es nicht tun.
        </p>

        {/* Steps */}
        {[
          {
            n: "01",
            title: "Maximal 4 Optionen pro Schritt",
            body: `Das Paradox der Wahl ist gut dokumentiert: Mehr Optionen führen nicht zu
mehr Freiheit, sondern zu Entscheidungslähmung und Abbruch. Das klassische
Experiment von Sheena Iyengar und Mark Lepper zeigte, dass Konsumenten
bei 6 Optionen 10-mal häufiger kauften als bei 24. Der gleiche Effekt gilt
für Messaging-Flows.

In der Praxis bedeutet das: Wähle die 3–4 häufigsten Antworten aus, die deine
Kunden ohnehin geben würden, und mach sie zu Buttons. Alles andere landet
in einem "Sonstiges"-Button oder einer freien Eingabeoption.`,
            tip: "Schaue in dein DM-Postfach: Was sind die 3 häufigsten Antworten auf eine bestimmte Frage? Das sind deine Quick-Reply-Kandidaten.",
          },
          {
            n: "02",
            title: "Kurze, klare Beschriftungen – maximal 3 Wörter",
            body: `Quick-Reply-Buttons werden auf kleinen Smartphones gelesen. Der Nutzer
überfliebt sie, er liest sie nicht. Das bedeutet: Je kürzer und klarer
die Beschriftung, desto schneller die Entscheidung.

"Heute", "Morgen", "Diese Woche" – drei Wörter, sofort verständlich.
"Ich möchte einen Termin für diese Woche" – viel zu lang, viel zu viel Lese-Aufwand.
Die Beschriftung sollte die Antwort des Nutzers sein, nicht eine Erklärung.`,
            tip: "Teste deine Button-Texte: Kann jemand in unter 0,5 Sekunden entscheiden, ob dieser Button die richtige Antwort ist? Wenn nein, kürze noch weiter.",
          },
          {
            n: "03",
            title: "Immer eine Freitext-Escape-Option anbieten",
            body: `Quick Replies sollen Reibung reduzieren – aber nicht einengen. Wenn keiner
der vorgegebenen Buttons zur Situation des Nutzers passt und es keine
Möglichkeit gibt, etwas anderes zu schreiben, entsteht Frustration. Diese
Frustration ist oft schlimmer als die ursprüngliche Reibung durch freie Texteingabe.

Die Lösung: ein "Anderes Datum" oder "Ich tippe selbst" Button als letzter in
der Reihe. Er signalisiert dem Nutzer: Du bist nicht gefangen. Gleichzeitig
wird er seltener genutzt als man denkt, weil die vordefinierten Optionen
die meisten Fälle abdecken.`,
            tip: "Die Escape-Option muss nicht prominent platziert sein. Am Ende der Button-Reihe, in derselben Größe – sie gibt Sicherheit, ohne vom Hauptpfad abzulenken.",
          },
          {
            n: "04",
            title: "Buttons nur bei geschlossenen Fragen einsetzen",
            body: `Quick Replies funktionieren perfekt für Fragen mit einer vorhersehbaren
Antwortmenge: Datum, Uhrzeit, Personenzahl, Service-Art. Sie funktionieren
nicht für offene Fragen wie "Was kann ich für Sie tun?" oder "Haben Sie
besondere Wünsche?"

Der Fehler, den viele machen: Buttons auf jede Frage setzen, auch auf
offene. Das erzeugt das Gefühl, gefangen zu sein, weil der Nutzer weiß,
dass seine tatsächliche Antwort keinen Button hat. Offene Fragen bleiben
Freitextfelder – mit dem Unterschied, dass sie sparsam eingesetzt werden.`,
            tip: "Faustregel: Gibt es 3–4 Antworten, die zusammen 80 % der Fälle abdecken? Dann lohnen sich Buttons. Andernfalls: freie Eingabe.",
          },
          {
            n: "05",
            title: "Den natürlichen Gesprächsrhythmus erhalten",
            body: `Ein häufiger Fehler: Alle Quick-Reply-Optionen in einer langen Nachricht
zusammenfassen und dann darauf warten, dass der Nutzer antwortet. Das
fühlt sich nicht wie ein Gespräch an – es fühlt sich wie ein Formular an.

Stattdessen: Eine Frage, dann die Buttons. Nach der Antwort eine kurze
Bestätigung ("Perfekt, Dienstag haben wir noch Plätze!"), dann die
nächste Frage. Dieser Rhythmus – Frage, Button, Bestätigung, nächste Frage –
ahmt ein echtes Gespräch nach und hält den Nutzer im Flow. Chatbot-Flows,
die diesen Conversational-Rhythmus einhalten, erreichen laut Forschungsdaten
Abschlussraten von 80–90 Prozent (Dashly, 2024).`,
            tip: "Simuliere deinen eigenen Flow: Fühlst du dich als Nutzer geführt oder abgefragt? Der Unterschied liegt meistens im Rhythmus, nicht im Inhalt.",
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
                  className="mt-4 rounded-xl border border-[#1e6b4a]/15 p-4"
                  style={{ backgroundColor: "rgba(30,107,74,0.04)" }}
                >
                  <p className="font-mono text-[12px] uppercase tracking-wider text-[#1e6b4a]">
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
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Beispiel</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 3: DM Mockup */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          So sehen Quick Replies in der Praxis aus
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Theorie ist gut, Anschauung ist besser. Hier siehst du denselben Buchungsflow
          zweimal: einmal mit offenen Freitextfragen, einmal mit Quick-Reply-Buttons.
          Der Unterschied in der gefühlten Einfachheit ist sofort spürbar.
        </p>

        {/* Bad example */}
        <div className="my-7 rounded-2xl border border-red-200/60 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.04)]">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-red-400">
            Ohne Quick Replies — hohe Abbruchrate
          </p>
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#f0f5ff] px-4 py-3 text-[14px] text-[#171923]">
              Hallo! Für welches Datum möchtest du einen Termin buchen? Bitte schreib uns das gewünschte Datum.
            </div>
          </div>
          <p className="mt-4 font-mono text-[12px] text-[#9aa3b8]">
            → Nutzer muss selbst überlegen, formulieren, tippen — Abbruchrisiko hoch
          </p>
        </div>

        {/* DM Mockup — Good example */}
        <div className="my-9 rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-[#7485ad]">Beispiel: Terminbuchung</p>
          {/* Bot message bubble */}
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#f0f5ff] px-4 py-3 text-[14px] text-[#171923]">
              Für welchen Tag möchtest du buchen?
            </div>
          </div>
          {/* Quick reply buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {["Heute", "Morgen", "Diese Woche", "Datum eingeben"].map((btn) => (
              <span key={btn} className="rounded-full border border-[#2a4ea7]/20 bg-white px-4 py-1.5 text-[13px] font-medium text-[#2450b2]">{btn}</span>
            ))}
          </div>
          {/* Simulated user tap + next message */}
          <div className="mt-6 flex justify-end">
            <div className="max-w-[60%] rounded-2xl rounded-tr-sm bg-[#2450b2] px-4 py-3 text-[14px] text-white">
              Morgen
            </div>
          </div>
          <div className="mt-3 flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#f0f5ff] px-4 py-3 text-[14px] text-[#171923]">
              Super! Welche Uhrzeit passt dir?
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["10:00 Uhr", "12:00 Uhr", "15:00 Uhr", "18:00 Uhr", "Andere Zeit"].map((btn) => (
              <span key={btn} className="rounded-full border border-[#2a4ea7]/20 bg-white px-4 py-1.5 text-[13px] font-medium text-[#2450b2]">{btn}</span>
            ))}
          </div>
          <p className="mt-5 font-mono text-[12px] text-[#7485ad]">
            → Nutzer tappt einmal — kein Tippen, kein Überlegen, kein Abbruch
          </p>
        </div>

        {/* Second mockup: salon */}
        <div className="my-9 rounded-2xl border border-[#2a4ea7]/12 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-[#7485ad]">Beispiel: Salon-Buchung (Personenzahl)</p>
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#f0f5ff] px-4 py-3 text-[14px] text-[#171923]">
              Für wie viele Personen soll ich reservieren?
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["1 Person", "2 Personen", "3–4 Personen", "Gruppe (5+)"].map((btn) => (
              <span key={btn} className="rounded-full border border-[#2a4ea7]/20 bg-white px-4 py-1.5 text-[13px] font-medium text-[#2450b2]">{btn}</span>
            ))}
          </div>
        </div>

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
          Was gut gemachte Quick Replies konkret bewirken
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die Effekte von Quick-Reply-Buttons sind nicht isoliert – sie wirken auf
          mehreren Ebenen gleichzeitig. Hier ist die Mechanik hinter dem Conversion-Uplift:
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              cause: "Weniger kognitive Last",
              effect: "Nutzer müssen keine Antwort mehr formulieren – die mentale Hürde fällt weg, der Flow geht weiter",
              delta: "–40 % Abbrüche",
            },
            {
              cause: "Schnellere Interaktion",
              effect: "Ein Tap statt 5–10 Sekunden Tipp-Aufwand: der Buchungsprozess fühlt sich kürzer an, auch wenn die Schrittzahl gleich bleibt",
              delta: "3× schneller",
            },
            {
              cause: "Sauberere Daten",
              effect: "Vordefinierte Antworten eliminieren Tippfehler, Formatierungsprobleme und unverständliche Eingaben – die Verarbeitung wird zuverlässiger",
              delta: "100 % valide",
            },
            {
              cause: "Höhere Abschlussrate",
              effect: "Flows mit Buttons und konversationellem Rhythmus erreichen 80–90 % Completion Rate vs. 35–40 % bei schlecht gestalteten Freitext-Flows",
              delta: "+50 % Abschluss",
            },
          ].map((row) => (
            <div
              key={row.cause}
              className="flex items-start gap-4 rounded-2xl border border-[#2a4ea7]/12 bg-white p-5 shadow-[0_2px_8px_rgba(28,53,122,0.04)]"
            >
              <div
                className="mt-0.5 flex-shrink-0 rounded-xl px-3 py-1 font-mono text-[12px] font-semibold text-[#1e6b4a]"
                style={{ backgroundColor: "rgba(30,107,74,0.07)" }}
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
          Fazit: Das kleinste UX-Detail mit dem größten Effekt
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Quick-Reply-Buttons sehen unscheinbar aus. Ein paar kleine Kapseln unter einer
          Nachricht. Aber sie verändern fundamental, wie sich ein Buchungsprozess für den
          Nutzer anfühlt – und wie viele Nutzer ihn abschließen.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die Psychologie dahinter ist gut verstanden: Weniger Optionen bedeuten schnellere
          Entscheidungen. Weniger Tipp-Aufwand bedeutet weniger Abbrüche. Ein klarer
          Gesprächsrhythmus bedeutet mehr das Gefühl, geführt zu werden statt abgefragt
          zu werden. All das zusammen ergibt einen messbaren Unterschied in der Anzahl
          der Buchungen, die du am Ende des Tages tatsächlich bekommst.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die gute Nachricht: Du brauchst keinen Entwickler und kein technisches Know-how,
          um Quick Replies in deinen Instagram-DM-Flow einzubauen. Du brauchst nur
          das richtige Tool – und die richtige Strategie dahinter.
        </p>

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
                Quick Replies in deinem Flow
              </p>
              <h3
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Weniger Abbrüche, mehr Buchungen – ab heute
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wesponde baut deinen Instagram-DM-Flow mit optimierten Quick-Reply-Buttons –
                für Restaurants, Salons und Fitnessstudios. Einrichtung in unter 15 Minuten,
                messbare Ergebnisse ab dem ersten Tag.
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
                  Weitere Insights lesen
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
