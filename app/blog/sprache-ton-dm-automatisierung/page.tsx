import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";

export const metadata = {
  title: "Sprache & Ton: So klingt dein automatisierter Chat nicht wie ein Bot – Wesponde",
  description:
    "Warum der richtige Ton in automatisierten DMs entscheidend ist – und wie du mit 5 konkreten Prinzipien dafür sorgst, dass deine Nachrichten menschlich, warm und konvertierend klingen.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function SpracheTonDmAutomatisierung() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-28 pb-16"
        style={{
          background: "linear-gradient(135deg, #0d2a1a 0%, #1e6b4a 22%, #ffffff 83%, #ffffff 100%)",
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
            <span className="font-mono text-[12px] text-white/50">7 Min. Lesezeit</span>
            <span className="font-mono text-[12px] text-white/50">·</span>
            <span className="font-mono text-[12px] text-white/50">Gastronomie · Fitness · Beauty</span>
          </div>

          {/* Title */}
          <h1
            className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Sprache &amp; Ton: So klingt dein automatisierter Chat nicht wie ein Bot
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            Warum scheitern so viele automatisierte Nachrichten – und wie du mit 5 konkreten
            Prinzipien dafür sorgst, dass deine DMs menschlich, warm und konvertierend klingen.
          </p>
        </div>
      </div>

      {/* ── Article Body ────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Jemand schreibt deinem Restaurant auf Instagram: „Hey, habt ihr am Samstag noch einen
          Tisch frei?&rdquo; Die automatisierte Antwort kommt prompt – in unter zwei Sekunden. Aber
          sie lautet: <em className="text-[#171923]">„Ihre Anfrage wurde registriert. Bitte warten Sie auf Rückmeldung.&rdquo;</em>
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Technisch funktioniert das System. Emotional ist es ein Fehlschlag. Der Gast fühlt
          sich wie eine Ticketnummer – und bucht beim Nachbarlokal, das ihm persönlich antwortet.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Das ist das eigentliche Problem vieler Automatisierungslösungen: nicht die Geschwindigkeit,
          nicht die Technologie – sondern die Sprache. Ein schlecht formulierter automatisierter
          Chat ist schlimmer als gar keine Antwort, weil er aktiv Vertrauen zerstört. Die gute
          Nachricht: Es lässt sich sehr konkret beheben.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Die Daten</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 1 */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Warum Ton wichtiger ist als Technik
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die Forschung ist eindeutig: Kunden reagieren auf Sprache – nicht auf Software.
          Eine Studie, die in <em>Humanities and Social Sciences Communications</em> (Nature)
          veröffentlicht wurde, zeigt, dass ein sozialorientierter, warmer Kommunikationsstil
          in automatisierten Chats die Kundenzufriedenheit und Verhaltensabsicht signifikant
          erhöht – während ein formaler, distanzierter Stil genau das Gegenteil bewirkt.
          Der entscheidende Mediator: das wahrgenommene <strong className="text-[#171923]">Wärmegefühl</strong>.
          Fühlt sich eine Nachricht freundlich und menschlich an, übertragen Kunden diese
          Wahrnehmung auf die gesamte Marke.
        </p>

        {/* Stats grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "51 %",
              label: "höhere Interaktion",
              sub: "wenn Nachrichten emojis & warme Sprache nutzen (ZoomInfo, 2024)",
            },
            {
              value: "6×",
              label: "mehr Abschlüsse",
              sub: "bei personalisierten vs. generischen automatisierten Nachrichten",
            },
            {
              value: "69 %",
              label: "Zufriedenheit",
              sub: "der Nutzer nach dem letzten Chatbot-Kontakt – wenn Ton stimmt",
            },
          ].map((s) => (
            <div
              key={s.value}
              className="rounded-2xl border border-[#1e6b4a]/15 bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]"
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
          Gleichzeitig zeigt eine Analyse von Backlinko: <strong className="text-[#171923]">56 % der Konsumenten</strong> fühlen
          sich von Chatbots frustriert – nicht weil sie automatisiert sind, sondern weil sie
          sich roboterhaft anfühlen. Das ist die Lücke, die gute Sprache schließen kann.
          Wer diese Lücke schließt, hat einen messbaren Wettbewerbsvorteil: Kunden, die
          eine positive Erfahrung mit einer Marke machen, geben laut Forschung{" "}
          <strong className="text-[#171923]">140 % mehr aus</strong> als solche mit negativer Erfahrung.
        </p>

        {/* Pull quote */}
        <blockquote className="my-9 rounded-2xl border-l-4 border-[#1e6b4a] bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            „Kunden reagieren nicht auf Technologie – sie reagieren auf Sprache.
            Ein warmer, persönlicher Ton in automatisierten Nachrichten wirkt wie ein
            Verstärker für Vertrauen, Zufriedenheit und Wiederkaufabsicht.&rdquo;
          </p>
          <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
            Frontiers in Psychology, 2022 – Chatbot Communication Styles & Customer Satisfaction
          </p>
        </blockquote>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Die Prinzipien</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 2 — Die 5 Prinzipien */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Die 5 Prinzipien für Nachrichten, die menschlich klingen
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Diese Prinzipien basieren auf Kommunikationspsychologie, Messaging-Forschung und
          der Praxis aus tausenden automatisierten Konversationen in Service-Businesses.
          Sie sind kein stilistisches Feintuning – sie sind entscheidend für Conversion und Vertrauen.
        </p>

        {[
          {
            n: "01",
            title: "Sprich die Sprache deiner Gäste – nicht die deiner AGB",
            body: `Der häufigste Fehler in automatisierten Nachrichten: ein formeller, bürokratischer Stil,
der aus dem Kontext gerissen wirkt. „Ihre Anfrage wurde registriert" klingt wie ein Behördenschreiben.
„Super, dass du schreibst!" klingt wie ein Mensch.

Das klingt trivial – ist es aber nicht. Forschung der University of California zeigt, dass informellere
Sprache in automatisierten Chats signifikant stärkere soziale Präsenz erzeugt und die Absicht,
den Service weiterzunutzen, erhöht. Deine Gäste schreiben dir über Instagram, weil sie
lieber so kommunizieren als per Telefon. Sie erwarten auch im Ton einen Unterschied.

Faustregel: Schreib so, wie ein sympathischer Mitarbeiter sprechen würde – nicht wie
eine Unternehmenskommunikation. Kurze Sätze. Aktive Formulierungen. Kein Passiv. Kein Konjunktiv.`,
            tip: "Teste deine Nachrichten: Lies sie laut vor. Würdest du das wirklich so sagen, wenn du am Tresen stehst? Wenn die Antwort Nein ist, formuliere um.",
          },
          {
            n: "02",
            title: "Personalisierung ist kein Bonus – sie ist Pflicht",
            body: `Den Namen einer Person zu verwenden ist der einfachste, wirksamste und meistunterschätzte
Hebel in der Kommunikation. Studien zeigen, dass personalisierte automatisierte Nachrichten
bis zu 6-mal höhere Transaktionsraten erzielen als generische Massennachrichten.

Warum wirkt das so stark? Weil Personalisierung ein psychologisches Signal sendet:
Du bist nicht irgendein Kontakt. Du bist eine Person, die wir erkennen. Das aktiviert
Reziprozität – die unbewusste Bereitschaft, zurückzugeben.

In der Praxis bedeutet das: Der erste Satz deiner Begrüßungs-DM enthält immer den Namen.
„Hey {{Vorname}} 👋" ist keine Spielerei – es ist eine Konversionsstrategie. Dasselbe gilt
für Reminder: „Hey {{Vorname}}, nur kurz als Erinnerung für morgen..." wirkt messbar
besser als „Erinnerung: Ihre Reservierung für [Datum]".`,
            tip: "Nutze den Vornamen im ersten Satz jeder Nachrichtensequenz – bei Begrüßung, Bestätigung und Reminder. Nicht am Ende, sondern ganz vorn.",
          },
          {
            n: "03",
            title: "Kurz ist König – aber nicht auf Kosten der Wärme",
            body: `Messaging ist kein E-Mail. Kurze Nachrichten haben im Business-DM-Kontext nachweislich
höhere Antwort- und Konversionsraten. SMS-Nachrichten unter 100 Zeichen erzielen laut
Branchenforschung 2–5× höhere Antwortraten als längere Texte.

Das bedeutet nicht: trocken und knapp. Es bedeutet: dicht und warm. Jeder Satz sollte
entweder eine Information transportieren oder eine positive Emotion erzeugen – idealerweise beides.

Vermeide Füllsätze wie „Vielen Dank für Ihre Nachricht. Wir freuen uns über Ihr Interesse
und werden uns zeitnah bei Ihnen melden." Das sind drei Sätze, die nichts sagen und
kalte Distanz schaffen. Ersetze sie durch: „Hey {{Vorname}} 👋 Für welchen Tag suchst
du einen Tisch?" – eine Zeile, die sofort in ein Gespräch einlädt.`,
            tip: "Wenn eine Nachricht länger als 3 Sätze ist, frage dich: Welche Sätze brauche ich wirklich? Streiche alles, was kein klares Ziel hat.",
          },
          {
            n: "04",
            title: "Emojis: gezielt einsetzen, nicht dekorieren",
            body: `Emojis polarisieren – zu Recht. Falsch eingesetzt wirken sie unprofessionell oder
aufgesetzt. Richtig eingesetzt erhöhen sie Engagement und Wärme messbar. 51 % der Kunden
sind laut ZoomInfo-Forschung eher bereit, mit Markenbeiträgen zu interagieren, wenn diese
Emojis enthalten. Instagram-Posts mit Emojis erzielen 48 % mehr Engagement.

Die Regel: Ein Emoji pro Nachricht – als emotionaler Anker, nicht als Dekoration. Das 👋
am Anfang ist ein Begrüßungssignal. Das ✅ bei der Bestätigung signalisiert Sicherheit.
Das 📅 vor dem Datum schafft visuelle Orientierung.

Was du vermeiden solltest: mehrere Emojis hintereinander (wirkt infantil), Emojis
die nicht zum Kontext passen (verwirrend), und komplett auf Emojis verzichten
(verpasste Chance). Besonders in Gastronomie, Fitness und Beauty – Branchen, in denen
Persönlichkeit und Atmosphäre zum Kernprodukt gehören – ist ein natürlicher Emoji-Einsatz
ein subtiles, aber wirkungsvolles Markensignal.`,
            tip: "Nutze maximal 1–2 Emojis pro Nachricht. Wähle sie bewusst: Begrüßung (👋), Bestätigung (✅), Termin (📅), Freude (😊). Meide generische Herzen oder Sternchen-Ketten.",
          },
          {
            n: "05",
            title: "Behalte deinen Markenton – auch in der Automatisierung",
            body: `Dein Restaurant hat eine Atmosphäre. Dein Studio hat eine Community. Dein Salon hat
einen Stil. Dieser Charakter muss sich in jeder automatisierten Nachricht widerspiegeln –
sonst entsteht eine Dissonanz, die Kunden unbewusst registrieren.

Ein Fine-Dining-Restaurant klingt anders als eine Burgerbar. Beide können automatisieren –
aber beide sollten in ihrem eigenen Ton sprechen. Ein Yoga-Studio nutzt andere Formulierungen
als ein High-Performance-Gym. Das ist keine Frage von richtig oder falsch, sondern von
Authentizität.

Praktisch bedeutet das: Definiere vor dem Aufsetzen deines Flows drei Adjektive, die
deinen Markenton beschreiben. Zum Beispiel: warm, unkompliziert, persönlich – oder:
professionell, präzise, herzlich. Teste jede Nachricht gegen diese drei Adjektive.
Wenn eine Formulierung nicht zu allen drei passt, formuliere sie um.`,
            tip: "Schreib drei Sätze, die perfekt zum Ton deines Business passen würden – ganz ohne Bot-Kontext. Diese Sätze sind dein Referenzrahmen für alle automatisierten Nachrichten.",
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
                    Praxis-Tipp
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
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Gut vs. Schlecht</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 3 — Gut vs. Schlecht */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Konkrete Beispiele: So klingt der Unterschied
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Abstrakte Prinzipien helfen wenig ohne konkretes Beispielmaterial. Hier sind vier
          typische Situationen aus dem Alltag von Restaurants, Salons und Studios – jeweils
          mit einer roboterhaften und einer menschlichen Variante.
        </p>

        <div className="mt-8 space-y-6">

          {/* Example 1 */}
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7485ad]">
              Situation 1 — Erste Antwort auf eine Anfrage
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-red-500">
                  ✗ Roboterhaft
                </p>
                <p className="text-[15px] leading-relaxed text-[#2d3550]">
                  „Guten Tag. Ihre Nachricht wurde empfangen. Bitte teilen Sie uns Datum,
                  Uhrzeit und Personenzahl für Ihre Reservierungsanfrage mit. Wir werden
                  Ihre Anfrage schnellstmöglich bearbeiten.&rdquo;
                </p>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-green-600">
                  ✓ Menschlich
                </p>
                <p className="text-[15px] leading-relaxed text-[#2d3550]">
                  „Hey {"{Vorname}"} 👋 Super, dass du schreibst! Für welchen Tag suchst
                  du einen Tisch – und wie viele seid ihr?&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Example 2 */}
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7485ad]">
              Situation 2 — Buchungsbestätigung
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-red-500">
                  ✗ Roboterhaft
                </p>
                <p className="text-[15px] leading-relaxed text-[#2d3550]">
                  „Ihre Reservierung wurde registriert. Datum: 22.03.2026, 19:00 Uhr, 3
                  Personen. Bei Fragen kontaktieren Sie uns. Stornierung ist möglich bis
                  24h vorher.&rdquo;
                </p>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-green-600">
                  ✓ Menschlich
                </p>
                <p className="text-[15px] leading-relaxed text-[#2d3550]">
                  „Perfekt, {"{Vorname}"} ✅ Dein Tisch ist reserviert: Samstag,
                  22.03. um 19 Uhr für 3 Personen. Wir freuen uns auf euch! Falls sich
                  was ändert, schreib einfach CANCEL.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Example 3 */}
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7485ad]">
              Situation 3 — Erinnerungsnachricht (24h vorher)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-red-500">
                  ✗ Roboterhaft
                </p>
                <p className="text-[15px] leading-relaxed text-[#2d3550]">
                  „Erinnerung: Sie haben morgen eine Reservierung um 19:00 Uhr. Bitte
                  erscheinen Sie pünktlich. Bei Stornierung kontaktieren Sie uns.&rdquo;
                </p>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-green-600">
                  ✓ Menschlich
                </p>
                <p className="text-[15px] leading-relaxed text-[#2d3550]">
                  „Hey {"{Vorname}"} 😊 Nur kurz zur Erinnerung: Morgen Abend um 19 Uhr
                  erwartet euch euer Tisch! Wir freuen uns. Kannst du nicht? Einfach
                  CANCEL schreiben.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Example 4 */}
          <div>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#7485ad]">
              Situation 4 — Bewertungsanfrage nach dem Besuch
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-red-500">
                  ✗ Roboterhaft
                </p>
                <p className="text-[15px] leading-relaxed text-[#2d3550]">
                  „Sehr geehrte/r Kunde/Kundin, wir bitten Sie, uns eine Bewertung auf
                  Google zu hinterlassen. Klicken Sie auf folgenden Link: [Link]. Vielen
                  Dank für Ihren Besuch.&rdquo;
                </p>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-green-600">
                  ✓ Menschlich
                </p>
                <p className="text-[15px] leading-relaxed text-[#2d3550]">
                  „Hey {"{Vorname}"} – hat es euch gefallen? 😊 Wenn ja, würden wir uns
                  riesig über eine kurze Google-Bewertung freuen – das hilft uns sehr.
                  Hier geht es direkt hin: [Link]&rdquo;
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Insight box */}
        <div
          className="my-9 overflow-hidden rounded-2xl border border-[#1e6b4a]/15"
        >
          <div
            className="relative px-6 py-4"
            style={{ background: "linear-gradient(135deg, #e8f5ef 0%, #c8eadb 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
            />
            <p className="relative font-mono text-[11px] uppercase tracking-[0.16em] text-[#1e6b4a]">
              Warum der Unterschied so groß ist
            </p>
          </div>
          <div className="bg-white px-6 py-5">
            <p className="font-semibold text-[#171923]">
              5 Wörter trennen Vertrauen von Abbruch
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#3d4255]">
              Der Unterschied zwischen den schlechten und guten Beispielen oben ist kein
              technischer – er ist ein sprachlicher. Die roboterhafte Version nutzt Passiv,
              Distanzsprache und generische Anrede. Die menschliche Version nutzt den Namen,
              eine direkte Frage und einen klaren nächsten Schritt. Beides ist automatisiert.
              Aber nur eine Variante fühlt sich wie ein Gespräch an.
            </p>
            <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
              Quelle: Eigene Analyse auf Basis von Chatbot-Kommunikationsforschung (Frontiers in Psychology, 2022; Nature, 2024)
            </p>
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
          Was gute Sprache konkret bewirkt
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Ton ist kein weicher Faktor – er hat direkte, messbare Auswirkungen auf die
          wichtigsten Metriken in deinem Business. Hier ist die Mechanik:
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              cause: "Personalisierter Ersteinstieg",
              effect: "Höhere Antwortrate auf die erste Begrüßungsnachricht – wer mit Namen angesprochen wird, antwortet öfter",
              delta: "+41 %",
            },
            {
              cause: "Warmer, direkter Ton",
              effect: "Mehr Kunden schließen den kompletten Buchungsflow ab, statt mittendrin abzubrechen",
              delta: "+20–35 %",
            },
            {
              cause: "Menschliche Bestätigungsnachricht",
              effect: "No-Show-Rate sinkt – Gäste fühlen sich verpflichteter, wenn die Bestätigung persönlich klingt",
              delta: "−5–10 %",
            },
            {
              cause: "Authentischer Bewertungs-Request",
              effect: "Mehr Google-Bewertungen durch eine persönliche, informelle Einladung statt Standard-Textbaustein",
              delta: "2× mehr",
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
          Fazit: Automatisierung ist nur so gut wie ihre Sprache
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Es geht nicht darum, ob dein Chat automatisiert ist – sondern ob er sich
          automatisiert anfühlt. Technologie ist der Enabler. Sprache ist das Produkt.
          Ein Flow, der in 1,1 Sekunden antwortet, aber klingt wie ein Behördenformular,
          baut kein Vertrauen auf. Ein Flow, der mit dem Namen begrüßt, kurz und direkt
          fragt und in deinem Markenton antwortet – der tut es.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die 5 Prinzipien in diesem Artikel lassen sich in wenigen Stunden umsetzen:
          Schreib deine bestehenden Nachrichten um. Füge den Namen hinzu. Kürze, was
          nicht nötig ist. Teste jede Formulierung gegen deinen Markenton. Das ist keine
          Optimierung am Rand – es ist der Unterschied zwischen einem Bot, der nervt,
          und einer Automatisierung, die dein Business repräsentiert.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Kunden erinnern sich nicht an die Technologie hinter einem guten Gespräch.
          Sie erinnern sich, wie sie sich dabei gefühlt haben.
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
                Bereit für menschlich klingende Automatisierung?
              </p>
              <h3
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                DM-Flows, die nach dir klingen
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wesponde richtet deinen kompletten Instagram-DM-Flow ein – mit Nachrichten,
                die zu deinem Markenton passen, personalisiert und in der Sprache deiner Gäste.
                Für Restaurants, Salons und Studios.
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
