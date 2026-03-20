import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";

export const metadata = {
  title: "Das Willkommens-Playbook: Neukunden in 3 Nachrichten aktivieren – Wesponde",
  description:
    "Wie Gastronomie-, Fitness- und Beauty-Betriebe mit einer 3-Nachrichten-Sequenz Neukunden zur Erstbuchung führen – mit konkreten Timing-Daten, Beispiel-Texten und messbaren Ergebnissen.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

const steps = [
  {
    n: "01",
    title: "Nachricht 1 – Der erste Eindruck zählt: sofort reagieren",
    body: `Wenn ein neuer Interessent Ihnen zum ersten Mal eine Nachricht schickt – ob eine Reservierungsanfrage, eine Frage nach Öffnungszeiten oder ein schlichtes \"Hallo\" nach einem Werbepost – beginnt die Uhr zu ticken. Branchenanalysen zeigen: Wer innerhalb von fünf Minuten antwortet, hat eine bis zu 21-mal höhere Chance, den Kontakt in einen Kunden zu verwandeln, als jemand, der 30 Minuten wartet. 78 % aller Buchungen gehen an das erste Unternehmen, das antwortet – nicht an das günstigste.

Die erste Nachricht hat eine einzige Aufgabe: Sie muss bestätigen, dass der Interessent am richtigen Ort ist, und eine klare, niederschwellige nächste Aktion anbieten. Kein Monolog über Ihr Angebot, keine langen Texte – nur eine herzliche Begrüßung, ein konkreter Anknüpfungspunkt und eine einzige Frage oder ein einziger Button.

Automatisierte Direktnachrichten auf Instagram erzielen Öffnungsraten von bis zu 90 % – ein Wert, den kein anderer Kanal auch nur annähernd erreicht. Nutzen Sie dieses Fenster konsequent.`,
    tip: "Richten Sie eine automatische Begrüßungsnachricht ein, die innerhalb von Sekunden nach dem ersten Kontakt ausgelöst wird. Formulierung: \"Hey [Vorname], schön, dass du dir meldest! Ich helfe dir gerne weiter. Möchtest du direkt einen Termin vereinbaren oder hast du zuerst eine Frage?\"",
  },
  {
    n: "02",
    title: "Nachricht 2 – Den Mehrwert liefern, bevor gezögert wird",
    body: `Die zweite Nachricht ist das Herzstück der Sequenz. Sie sollte zwischen 30 Minuten und 2 Stunden nach dem ersten Kontakt eintreffen – wenn der Interessent noch warm ist, aber noch keine Entscheidung getroffen hat. Studien zur Customer Journey zeigen, dass 75 % aller Kaufentscheidungen im Service-Bereich innerhalb von 24 Stunden nach dem Erstkontakt fallen. Wer in diesem Fenster keinen zweiten Impuls setzt, verliert mehr als die Hälfte der potenziellen Buchungen.

Die zweite Nachricht hat drei Bausteine: (1) ein konkretes Angebot oder eine Antwort auf die häufigste Frage neuer Interessenten, (2) ein sozialer Beweis – etwa ein kurzer Hinweis auf Bewertungen oder einen typischen Erfolg – und (3) ein direkter Buchungs-CTA. Kein Umweg über eine Website, kein \"Schau dich gerne um\" – sondern: \"Hier sind zwei freie Termine diese Woche. Welcher passt dir besser?\"

Automatisierte Onboarding-Sequenzen erzielen im Vergleich zu einzelnen Nachrichten dreimal höhere Engagement-Raten. Der Unterschied liegt im Timing und im strukturierten Aufbau, nicht im Kanal.`,
    tip: "Fügen Sie Quick-Reply-Buttons ein, die konkrete Zeitfenster anzeigen (z. B. \"Di, 10 Uhr\" / \"Do, 15 Uhr\" / \"Anderen Termin wählen\"). Studien zeigen, dass Nachrichten mit klaren Handlungsoptionen dreimal mehr Klicks generieren als offene Fragen.",
  },
  {
    n: "03",
    title: "Nachricht 3 – Den Abschluss sichern oder sanft nachfassen",
    body: `Nicht jeder Interessent reagiert sofort auf die erste oder zweite Nachricht. Das ist normal und kein Zeichen von Desinteresse. Eine Branchenanalyse aus dem CRM-Bereich zeigt, dass strukturierte Win-Back-Sequenzen 5–15 % der zunächst nicht reagierenden Kontakte reaktivieren können. Das klingt nach wenig, entspricht aber bei einem Restaurant mit 200 Erstkontakten pro Monat bis zu 30 zusätzlichen Buchungen.

Nachricht 3 wird 18–24 Stunden nach dem Erstkontakt verschickt, falls noch keine Buchung erfolgt ist. Ihr Ton ist anders als die ersten beiden: kein Druck, keine erneute Auflistung des Angebots – stattdessen eine kurze, persönliche Note. Etwas wie: \"Nur eine kurze Frage: Kann ich dir noch irgendwie helfen?\" Diese scheinbar beiläufige Formulierung bricht Zögern auf, weil sie Gesprächsbereitschaft signalisiert, ohne aufdringlich zu wirken.

Wichtig: Nachricht 3 ist das Ende der Sequenz. Kein viertes, fünftes Nachfassen – das wäre kontraproduktiv und schadet dem Markenbild. Drei Nachrichten im richtigen Timing sind präzise genug, um Interessenten zu aktivieren, ohne sie zu überfordern.`,
    tip: "Verwenden Sie in Nachricht 3 eine offene Frage statt eines direkten Angebots. \"Gibt es etwas, das ich besser erklären kann?\" oder \"Hast du noch offene Fragen zur Buchung?\" führen laut Messaging-Analysen zu höheren Antwortquoten als erneute Buchungs-CTAs.",
  },
  {
    n: "04",
    title: "Den richtigen Kontext pro Branche setzen",
    body: `Ein Willkommens-Playbook funktioniert nur dann optimal, wenn es zur spezifischen Customer Journey Ihrer Branche passt. Gastronomie-, Fitness- und Beauty-Betriebe haben unterschiedliche Erwartungshaltungen bei Neukunden – und das sollte sich in der Sequenz widerspiegeln.

In der Gastronomie ist der stärkste Auslöser die Verfügbarkeit: \"Haben Sie an Freitagabend noch einen Tisch für vier?\" Die Sequenz muss Verfügbarkeit sofort signalisieren und die Buchung in einem Schritt abschließen. Studien zur Gastronomie-Retention zeigen, dass 70 % der Erstbesucher nie wiederkommen – eine proaktive Nachverfolgung nach dem ersten Besuch kann diese Zahl erheblich verbessern.

Im Fitness- und Beauty-Bereich ist der Einstiegspunkt oft eine Beratungsfrage: \"Was kostet eine Mitgliedschaft?\" oder \"Welche Behandlung empfehlt ihr?\" Hier muss die Sequenz Vertrauen aufbauen, bevor sie bucht. Ein Hinweis auf Probestunden oder Kennenlernangebote in Nachricht 2 senkt die Hemmschwelle erheblich. Salons, die aktiv erste Termine nachverfolgen, steigern ihre Erstbesucher-Retention von branchenüblichen 35 % auf über 50 %.`,
    tip: "Segmentieren Sie Ihre Sequenz nach Anfragetyp: Reservierungsanfragen, Preisanfragen und allgemeine Fragen brauchen unterschiedliche Nachricht-2-Texte. Mit einer intelligenten Automatisierung lässt sich das ohne manuelle Eingriffe umsetzen.",
  },
  {
    n: "05",
    title: "Timing als strategische Variable – wann, nicht nur was",
    body: `Das Timing jeder Nachricht ist ebenso wichtig wie ihr Inhalt. Untersuchungen zu Messaging-Öffnungsraten zeigen klare Tageszeitpräferenzen: Nachrichten, die zwischen 9 und 11 Uhr oder zwischen 17 und 19 Uhr zugestellt werden, erzielen bis zu 30 % höhere Öffnungsraten als solche, die nachts oder am frühen Nachmittag ankommen.

Für Nachricht 1 gilt: sofort, rund um die Uhr, automatisch. Keine Ausnahme. Für Nachricht 2 und 3 sollte ein Intelligent-Delay eingebaut werden: Wenn der Erstkontakt außerhalb der optimalen Fenster stattfindet, verschiebt sich die Folgenachricht in das nächste Zeitfenster. Ein Interessent, der um 23 Uhr schreibt, bekommt Nachricht 2 nicht um 23:30 Uhr, sondern am nächsten Morgen um 9 Uhr.

Diese kleine Einstellung – oft \"Smart Sending\" genannt – kann die Antwortrate auf Folgenachrichten um 25–40 % steigern, ohne dass ein einziger Text geändert werden muss. Sie respektiert den Alltag des Interessenten und signalisiert Professionalität.`,
    tip: "Definieren Sie Ihre optimalen Sendefenster branchenspezifisch: Restaurants haben ihre höchsten Buchungsanfragen am Mittwoch- bis Freitagabend, Fitnessstudios montags und donnerstags morgens, Beauty-Betriebe freitags. Richten Sie Ihre Automationen auf diese Peaks aus.",
  },
  {
    n: "06",
    title: "Nach der Buchung: die Aktivierung erst vollendet sich",
    body: `Eine bestätigte Buchung ist kein Endpunkt – sie ist der Beginn der eigentlichen Kundenbeziehung. Untersuchungen zeigen, dass Kunden, die innerhalb der ersten Tage nach dem Erstkontakt einen echten Mehrwert erleben, doppelt so häufig wiederkommen und über ihre gesamte Kundenlebensdauer 30 % mehr ausgeben.

Die Bestätigungsnachricht nach einer Buchung ist die am stärksten unterschätzte Kommunikation im gesamten Prozess. Sie wird zu nahezu 100 % gelesen – und trotzdem nutzen die meisten Betriebe sie nur als reine Transaktionsinformation (Datum, Uhrzeit, Adresse). Ergänzen Sie sie um einen persönlichen Satz: eine Vorfreude, einen Tipp für die Anreise oder einen konkreten Hinweis, was den Besuch besonders macht. Das kostet nichts – und verändert die wahrgenommene Qualität des Erlebnisses grundlegend.

Automatisierte Nachsorgeprozesse, die nach dem Besuch eine kurze Feedback-Anfrage schicken, steigern die Stammkundenrate nachweislich. Im Fitnessbereich etwa sank die Abbruchrate bei Mitgliedern, die zwei monatliche Kontaktpunkte mit dem Studio hatten, um 33 % im Vergleich zu Mitgliedern ohne strukturierte Nachsorge.`,
    tip: "Senden Sie die Buchungsbestätigung sofort, aber fügen Sie 24 Stunden vor dem Termin eine Erinnerung hinzu. Diese Erinnerung hat die zweithöchste Öffnungsrate im gesamten Funnel – und reduziert No-Shows nachweislich um 20–30 %.",
  },
];

export default function NeukundenAktivierungPlaybook() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-28 pb-16"
        style={{
          background:
            "linear-gradient(135deg, #0a1a55 0%, #2a4ea7 22%, #ffffff 83%, #ffffff 100%)",
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

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-sm">
              <Map className="h-3 w-3" />
              Playbook
            </span>
            <span className="font-mono text-[12px] text-white/50">9 Min. Lesezeit</span>
            <span className="font-mono text-[12px] text-white/50">·</span>
            <span className="font-mono text-[12px] text-white/50">
              Gastronomie · Fitness · Beauty
            </span>
          </div>

          <h1
            className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Das Willkommens-Playbook: Neukunden in 3 Nachrichten aktivieren
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            Wie eine strukturierte Drei-Nachrichten-Sequenz aus einem flüchtigen Erstkontakt
            einen gebuchten Termin macht – mit konkretem Timing, branchenspezifischen Texten
            und messbaren Ergebnissen.
          </p>
        </div>
      </div>

      {/* ── Article Body ─────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Stellen Sie sich vor, jemand betritt Ihr Restaurant, Ihren Salon oder Ihr Fitnessstudio –
          schaut sich kurz um – und geht wieder. Kein Gespräch, kein Angebot, keine Einladung zum
          Bleiben. Genau das passiert täglich in tausenden Instagram-Postfächern von
          Service-Unternehmen: Ein Interessent schreibt zum ersten Mal, wartet eine halbe Stunde
          auf eine Antwort, und wendet sich dann dem nächsten Anbieter zu.
        </p>

        <p className="mt-5 text-[17px] leading-relaxed text-[#2d3550]">
          Der Unterschied zwischen einem Betrieb, der 20 % seiner Instagram-Anfragen in
          Buchungen verwandelt, und einem, der bei 3 % bleibt, liegt selten am Produkt oder
          am Preis. Er liegt fast immer am ersten Eindruck – und daran, ob innerhalb der
          entscheidenden ersten Stunden eine strukturierte Willkommens-Sequenz läuft oder nicht.
        </p>

        <p className="mt-5 text-[17px] leading-relaxed text-[#2d3550]">
          Dieses Playbook zeigt Ihnen, wie Sie mit drei präzise getimten Nachrichten
          Neukunden von der ersten Anfrage bis zur bestätigten Buchung führen – und warum
          Automatisierung dabei kein Komfort-Feature ist, sondern ein Wettbewerbsvorteil.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#edf1f8]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">
            Die Datenlage
          </span>
          <div className="h-px flex-1 bg-[#edf1f8]" />
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "90 %",
              label: "Öffnungsrate",
              sub: "Automatisierte Instagram-DMs werden fast vollständig geöffnet – gegenüber ~20 % bei E-Mail (Branchenanalysen, 2025)",
            },
            {
              value: "21×",
              label: "Mehr Conversions",
              sub: "Wer innerhalb von 5 Minuten antwortet, hat 21-mal höhere Chancen auf eine Buchung als nach 30 Minuten (MIT-Studie, Lead Response)",
            },
            {
              value: "78 %",
              label: "Gehen zum Ersten",
              sub: "78 % aller Buchungen gehen an das Unternehmen, das zuerst antwortet – unabhängig von Preis oder Angebot (Salesforce-Analyse)",
            },
          ].map((s) => (
            <div
              key={s.value}
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

        {/* Pull Quote */}
        <blockquote className="my-9 rounded-2xl border-l-4 border-[#2450b2] bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            &ldquo;Automatisierte Willkommensnachrichten generieren im Schnitt 320 % mehr Umsatz
            pro Kontakt als klassische Werbenachrichten – weil sie im richtigen Moment ankommen:
            wenn das Interesse am höchsten ist.&rdquo;
          </p>
          <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
            Campaign Monitor, Messaging-Benchmark-Report 2025
          </p>
        </blockquote>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#edf1f8]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">
            Die 6 Schritte
          </span>
          <div className="h-px flex-1 bg-[#edf1f8]" />
        </div>

        {/* Steps */}
        {steps.map((step, idx) => (
          <div key={step.n} className="mt-10">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "#2450b2" }}
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
                <div
                  className="mt-4 rounded-xl border border-[#2a4ea7]/12 p-4"
                  style={{ backgroundColor: "rgba(36,80,178,0.04)" }}
                >
                  <p className="font-mono text-[12px] uppercase tracking-wider text-[#2450b2]">
                    Tipp
                  </p>
                  <p className="mt-1 font-mono text-[13px] leading-relaxed text-[#3d4255]">
                    {step.tip}
                  </p>
                </div>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="ml-[60px] mt-8 h-px bg-[#edf1f8]" />
            )}
          </div>
        ))}

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#edf1f8]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">
            Was Sie erreichen
          </span>
          <div className="h-px flex-1 bg-[#edf1f8]" />
        </div>

        {/* Results Section */}
        <p className="text-[16px] leading-relaxed text-[#2d3550]">
          Betriebe, die dieses Playbook konsequent einsetzen, berichten konsistent über
          dieselben Verbesserungen – unabhängig davon, ob es sich um ein Restaurant, ein
          Fitnessstudio oder einen Salon handelt. Die folgende Übersicht zeigt die typischen
          Auswirkungen in konkreten Zahlen:
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              cause: "Sofortantwort auf Erstanfragen",
              effect:
                "Messbar höhere Conversion vom ersten Kontakt zur Buchung – die meisten Betriebe verdoppeln ihre Buchungsquote innerhalb der ersten vier Wochen.",
              delta: "+2×",
            },
            {
              cause: "Strukturierte 3-Nachrichten-Sequenz",
              effect:
                "Bis zu 30 % der Interessenten, die auf Nachricht 1 nicht reagiert haben, werden durch Nachricht 2 oder 3 reaktiviert.",
              delta: "+30 %",
            },
            {
              cause: "Erstbesucher-Retention durch Nachsorge",
              effect:
                "Salons, die aktiv nach dem ersten Termin nachfassen, steigern ihre Wiederkehrerquote von branchenüblichen 35 % auf 50+ %.",
              delta: "+15 Pkt.",
            },
            {
              cause: "Erinnerungsnachricht vor dem Termin",
              effect:
                "No-Show-Rate sinkt um 20–30 %, was direkte Umsatzwirkung hat: bei 100 Terminen pro Monat entspricht das 20–30 geretteten Buchungen.",
              delta: "−25 %",
            },
            {
              cause: "Proaktive Feedback-Anfrage nach dem Besuch",
              effect:
                "Google-Bewertungen steigen signifikant – im Schnitt erhalten Betriebe 3–5× mehr Rezensionen pro Monat als vor der Automatisierung.",
              delta: "3–5×",
            },
          ].map((row) => (
            <div
              key={row.cause}
              className="flex items-start gap-4 rounded-2xl border border-[#2a4ea7]/12 bg-white p-5 shadow-[0_2px_8px_rgba(28,53,122,0.04)]"
            >
              <div
                className="mt-0.5 flex-shrink-0 rounded-xl px-3 py-1 font-mono text-[12px] font-semibold text-[#2450b2]"
                style={{ backgroundColor: "rgba(36,80,178,0.07)" }}
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
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#edf1f8]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">
            Fazit
          </span>
          <div className="h-px flex-1 bg-[#edf1f8]" />
        </div>

        {/* Fazit */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923]"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Drei Nachrichten. Strukturiertes Timing. Messbare Ergebnisse.
        </h2>

        <p className="mt-5 text-[17px] leading-relaxed text-[#2d3550]">
          Das Willkommens-Playbook ist kein Geheimnis der Großen. Es ist eine erprobte Abfolge,
          die jeder Service-Betrieb umsetzen kann – unabhängig von Größe oder Budget. Der
          entscheidende Unterschied liegt nicht darin, ob Sie auf Instagram aktiv sind, sondern
          darin, ob Ihr erstes Gespräch mit einem Neukunden strukturiert und schnell genug ist,
          um Vertrauen zu schaffen, bevor der Interessent zur Konkurrenz schaut.
        </p>

        <p className="mt-5 text-[17px] leading-relaxed text-[#2d3550]">
          Automatisierung bedeutet hier nicht, unpersönlich zu werden. Es bedeutet, die richtigen
          Worte im richtigen Moment zu sagen – konsistent, rund um die Uhr, ohne dass Sie oder
          Ihr Team dafür verfügbar sein müssen. Die persönliche Note kommt durch die Qualität
          Ihrer Texte und das Timing Ihrer Sequenz – nicht durch manuelle Eingriffe bei jeder
          einzelnen Anfrage.
        </p>

        <p className="mt-5 text-[17px] leading-relaxed text-[#2d3550]">
          Wer heute mit dem Aufbau seiner Willkommens-Sequenz beginnt, hat in vier Wochen einen
          messbaren Vorsprung gegenüber dem Wettbewerb – und in sechs Monaten eine solide Basis
          aus Stammkunden, die nicht durch einen einzelnen Werbepost gewonnen wurden, sondern
          durch ein durchdachtes erstes Gespräch.
        </p>

        {/* CTA Block */}
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
                Bereit für die Umsetzung?
              </p>
              <h3
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Ihr Willkommens-Playbook – automatisiert in wenigen Minuten
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Mit Wesponde richten Sie Ihre 3-Nachrichten-Sequenz einmal ein – und sie läuft
                für jeden neuen Interessenten automatisch, personalisiert und im richtigen Timing.
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
                  Weitere Playbooks lesen
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-wider text-[#7485ad] transition-colors hover:text-[#2450b2]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zu allen Insights
          </Link>
        </div>
      </article>
    </div>
  );
}
