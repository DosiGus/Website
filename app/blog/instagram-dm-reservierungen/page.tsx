import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";

export const metadata = {
  title: "Wie 30 % mehr Reservierungen über Instagram DMs möglich werden – Wesponde Playbook",
  description:
    "Der vollständige 7-Schritte-Ablauf, der aus Instagram-Anfragen verlässliche Buchungen macht – inklusive Daten, Fallstudien und konkreten Templates.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function PlaybookReservierungen() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-28 pb-16"
        style={{
          background: "linear-gradient(135deg, #0a1a55 0%, #2a4ea7 22%, #ffffff 83%, #ffffff 100%)",
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
              <Map className="h-3 w-3" />
              Playbook
            </span>
            <span className="font-mono text-[12px] text-white/50">8 Min. Lesezeit</span>
            <span className="font-mono text-[12px] text-white/50">·</span>
            <span className="font-mono text-[12px] text-white/50">Gastronomie · Fitness · Beauty</span>
          </div>

          {/* Title */}
          <h1
            className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Wie 30&nbsp;% mehr Reservierungen über Instagram DMs möglich werden
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            Der vollständige Ablauf, der aus Anfragen verlässliche Buchungen macht –
            inklusive Bestätigung, Reminder und Follow-ups. Mit echten Daten und Fallstudien.
          </p>
        </div>
      </div>

      {/* ── Article Body ────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Ein Tisch für Freitagabend. Einige Gäste schreiben via Instagram DM an – und warten.
          Während das Team den Abendservice stemmt, stapeln sich die Nachrichten unbeantwortet.
          Bis zum nächsten Morgen haben drei von fünf Interessenten woanders gebucht.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Das ist kein Einzelfall. Laut einer Analyse von Harvard Business Review sind Unternehmen,
          die innerhalb einer Stunde antworten, <strong className="text-[#171923]">7-mal häufiger</strong> in der Lage,
          den Lead zu qualifizieren. Wer 30 Minuten wartet statt 5, verliert
          bereits <strong className="text-[#171923]">21-mal mehr</strong> potenzielle Buchungen.
          Automatisierte Instagram-DM-Flows lösen genau dieses Problem – und liefern
          dabei nachweisbar 30&nbsp;% und mehr zusätzliche Reservierungen.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Dieses Playbook zeigt dir, wie das konkret funktioniert: warum DMs konvertieren,
          welche Schritte den Unterschied machen und wie du den Ablauf für dein Business umsetzt.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Warum DMs funktionieren</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 1 */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Die Daten hinter dem 30-%-Effekt
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Bevor wir in den konkreten Ablauf einsteigen, lohnt sich ein Blick auf die
          Zahlen – denn sie erklären, warum Instagram DMs so anders funktionieren als
          E-Mail, Telefon oder Web-Formulare.
        </p>

        {/* Stats grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { value: "90 %", label: "Öffnungsrate", sub: "bei Instagram DMs vs. ~20 % bei E-Mail" },
            { value: "60 %", label: "Antwortrate", sub: "Kunden, die auf DMs aktiv antworten" },
            { value: "7×", label: "mehr Conversions", sub: "bei Antwort innerhalb von 60 Minuten" },
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

        <p className="mt-7 text-[16px] leading-relaxed text-[#2d3550]">
          Laut Meta kommunizieren monatlich <strong className="text-[#171923]">150 Millionen Nutzer</strong> mit
          Business-Accounts auf Instagram. Gleichzeitig bevorzugen
          63&nbsp;% der Konsumenten Messenger-Kommunikation gegenüber E-Mail oder Telefon.
          Der Kanal ist also nicht nur leistungsstark – er ist genau dort, wo sich deine
          Gäste ohnehin bereits befinden.
        </p>

        {/* Pull quote */}
        <blockquote
          className="my-9 rounded-2xl border-l-4 border-[#2450b2] bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]"
        >
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            „78&nbsp;% der Kunden kaufen beim ersten Anbieter, der antwortet.
            Automatisierte DMs antworten in unter 1,1 Sekunden –
            jede Nacht, jedes Wochenende, auch während des Abendservices.&rdquo;
          </p>
          <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
            Heymarket Business Messaging Statistics, 2024
          </p>
        </blockquote>

        {/* Real-world case study box */}
        <div
          className="my-9 overflow-hidden rounded-2xl border border-[#2a4ea7]/12"
        >
          <div
            className="relative px-6 py-4"
            style={{ background: "linear-gradient(135deg, #e8f0ff 0%, #d0e0ff 100%)" }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{ backgroundImage: noiseDataUri, backgroundSize: "200px 200px" }}
            />
            <p className="relative font-mono text-[11px] uppercase tracking-[0.16em] text-[#2450b2]">
              Fallstudie — Restaurant
            </p>
          </div>
          <div className="bg-white px-6 py-5">
            <p className="font-semibold text-[#171923]">
              Astral Restaurant Systems: +7.000 Besuche, +52.000 $ Umsatz
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-[#3d4255]">
              Ein Restaurant-Betreiber in den USA implementierte einen ManyChat-basierten
              DM-Flow mit QR-Codes auf den Tischen. Ergebnis: 23.000 neue Kontakte mit
              Name, Telefon und E-Mail. 7.000 zusätzliche Besuche innerhalb der Kampagnenperiode.
              52.000 $ Mehreinnahmen. Investition: 600 $ in Automatisierung und QR-Druck.
              ROI: <strong>2.400&nbsp;%</strong>.
            </p>
            <p className="mt-3 font-mono text-[12px] text-[#7485ad]">Quelle: ManyChat Blog</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Das Playbook</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 2 */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Der 7-Schritte-Flow: von der ersten DM zur bestätigten Buchung
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Dieser Ablauf ist kein theoretisches Modell. Er basiert auf den Best Practices
          der führenden Messaging-Automatisierungs-Plattformen und den dokumentierten
          Ergebnissen aus über 150 Milliarden analysierten Kundenkonversationen
          (Chatfuel, ManyChat, Interakt). Jeder Schritt hat eine klare Funktion – und
          jede Lücke im Ablauf kostet messbar Buchungen.
        </p>

        {/* Steps */}
        {[
          {
            n: "01",
            title: "Trigger: Der Einstiegspunkt in den Flow",
            body: `Bevor eine einzige Reservation entsteht, braucht dein Gast einen Weg, den Flow zu starten.
Die effektivsten Einstiegspunkte sind: ein Story-CTA mit Keyword ("Schreib TISCH um zu reservieren"),
ein direkter Button in der Bio, QR-Codes auf Tischen und Menükarten, oder ein Comment-to-DM-Trigger
(Kommentar unter einem Post löst automatisch eine DM aus).

Die Comment-to-DM-Automatisierung ist besonders wirkungsvoll: Laut ManyChat erzielen diese Flows
Öffnungsraten von 35–65 % und CTRs von 12–28 % – weit über dem, was normale Postings erreichen.`,
            tip: "Story-CTAs mit klaren Keywords (\"BUCHEN\", \"TISCH\") funktionieren nachweislich besser als generische Bio-Links, weil der Intent-Moment direkt gefangen wird.",
          },
          {
            n: "02",
            title: "Sofortantwort: unter 1,1 Sekunden",
            body: `Der kritischste Moment im gesamten Ablauf ist die erste Antwort. Eine MIT-Studie
zum Lead Response Management zeigt: Wer innerhalb von 5 Minuten antwortet, qualifiziert
100× mehr Leads als bei einer 30-Minuten-Verzögerung. Menschliches Personal kann das
strukturell nicht leisten – besonders nicht während des Abendservices oder nach 22:00 Uhr.

Die automatisierte Begrüßungsnachricht sollte drei Elemente enthalten:
(1) Warmherzige, persönliche Begrüßung im Ton deines Restaurants,
(2) Direkte Weiterführung ("Für welches Datum möchtest du reservieren?"),
(3) Quick-Reply-Buttons für die häufigsten Antworten, um Tippaufwand zu minimieren.`,
            tip: "Vermeide generische Bot-Phrasen wie \"Hallo! Ich bin ein automatisierter Assistent.\" Formuliere so, als würde ein freundlicher Mitarbeiter antworten.",
          },
          {
            n: "03",
            title: "Qualifikation: 3–4 Fragen, nicht mehr",
            body: `Der Flow stellt genau die Informationen ab, die du für eine Reservierung brauchst –
nicht mehr. Jede zusätzliche Frage erhöht die Abbruchrate. Die optimale Sequenz:

1. Datum (Quick-Reply: "Heute", "Morgen", oder freie Eingabe)
2. Uhrzeit (Quick-Reply mit deinen Servicetimes)
3. Personenzahl (Quick-Reply: 1–2, 3–4, 5–6, mehr)
4. Name (Freitexteingabe)

Optional, abhängig vom Business: Telefonnummer für SMS-Reminder, besondere Anlässe (Geburtstag, etc.), Sonderwünsche.

Die Fragen sollten sich wie ein natürliches Gespräch anfühlen – ein Schritt nach dem anderen,
nicht als Formular. Konversationelle UI reduziert die kognitive Last und erhöht die Abschlussrate.`,
            tip: "Quick-Reply-Buttons statt Freitexteingabe wo möglich: sie reduzieren Abbrüche signifikant, weil der Gast nicht tippen muss.",
          },
          {
            n: "04",
            title: "Verfügbarkeitsprüfung & Bestätigung",
            body: `Nach der Qualifikation folgt die Echtzeit-Verfügbarkeitsprüfung über deine
Kalender-Integration (Google Calendar, eigenes System). Der Flow prüft, ob Datum, Zeit
und Personenzahl verfügbar sind – und antwortet mit einer klaren Bestätigungsnachricht
inklusive aller Buchungsdetails.

Die Bestätigungsnachricht sollte enthalten:
- Zusammenfassung: Datum, Uhrzeit, Personenzahl, Name
- Adresse oder Anfahrtshinweis
- Kontaktnummer für Rückfragen
- Einfache Möglichkeit zum Stornieren ("Antwort CANCEL um zu stornieren")

Das letzte Element ist psychologisch entscheidend: Gäste, die problemlos absagen können,
stornieren häufiger – und erscheinen dadurch seltener einfach nicht. Das klingt kontraintuitiv,
reduziert aber nachweislich No-Shows.`,
            tip: "Biete immer eine einfache Stornierungsoption an. Studien zeigen, dass frictionless cancellation No-Shows um bis zu 50 % senkt.",
          },
          {
            n: "05",
            title: "Reminder-Sequenz: der No-Show-Killer",
            body: `No-Shows sind das größte stille Ertragsproblem in der Gastronomie und im
Dienstleistungsbereich. Laut ResOS-Daten: Ohne Strategie liegt die No-Show-Rate bei
15–20 % – das entspricht bei einem ausgebuchten 60-Platz-Restaurant bis zu 2.000 €
verlorener Einnahmen pro Abend. Mit automatisierten Reminder-DMs sinkt diese Rate
laut dokumentierten Fallstudien von 14 % auf 5 % innerhalb von 90 Tagen.

Die optimale Reminder-Sequenz:

→ 48 Stunden vorher: Freundliche Erinnerung + Stornierungslink
→ 24 Stunden vorher: Finaler Reminder mit allen Details
→ 2 Stunden vorher (optional): Same-Day-Push – besonders wirksam bei Salons und Studios

42 % der Gäste geben an, dass sie DM-Reminder aktiv dabei helfen, Termine einzuhalten
(Elavon Consumer Survey 2023). Der Reminder ist kein Misstrauenssignal – er wird als
Service wahrgenommen.`,
            tip: "Kombiniere den Reminder immer mit einer einfachen Möglichkeit zum Umbuchen – nicht nur Stornieren. So bleibst du im Kalender und verlierst die Buchung nicht.",
          },
          {
            n: "06",
            title: "Post-Visit: Bewertungen und Wiederbuchung",
            body: `Der Aufenthalt ist vorbei – aber der Ablauf nicht. Die Phase nach dem Besuch
ist der am meisten unterschätzte Teil des Funnels. Sie kostet nichts, weil die
Verbindung bereits besteht, und sie generiert zwei hochwertige Outputs:

(1) Google-Bewertungen: 2–4 Stunden nach der Reservierungszeit sendet der Flow
eine persönliche Nachricht mit direktem Link zur Google-Bewertungsseite.
Kein Druck, keine Nötigung – nur eine freundliche Einladung. Dieser Schritt allein
kann die Bewertungsfrequenz verdoppeln.

(2) Wiederbuchung: "Hat es dir gefallen? Möchtest du einen Tisch für nächste Woche
reservieren? Antworte TISCH." – eine Zeile DM, die passiv Stammkundschaft aufbaut.

ManyChat-Daten zeigen, dass Post-Visit-Automation-Flows in Kombination eine
Steigerung der Wiederbesuchsrate von 20–30 % erzielen.`,
            tip: "Timing ist alles: 2–4 Stunden nach Buchungszeit ist das optimale Fenster. Zu früh (während des Besuchs) wirkt aufdringlich. Zu spät (nächster Tag) verliert an emotionaler Relevanz.",
          },
          {
            n: "07",
            title: "Reaktivierung: inaktive Gäste zurückgewinnen",
            body: `Wer einmal gebucht hat, ist der einfachste Gast, den du neu gewinnen kannst.
Gäste, die seit 30, 60 oder 90 Tagen keine Buchung getätigt haben, erhalten
eine personalisierte Reaktivierungs-DM: "Wir vermissen dich! Es gibt [aktuelles
Angebot / neue Menüsektion / Saisonhighlight]. Möchtest du wieder vorbeikommen?"

Dieser Schritt kostet – richtig umgesetzt – keine zusätzliche Akquisitionsarbeit.
Du sprichst bestehende Kontakte an, die dein Geschäft bereits kennen und ihr Interesse
bereits bewiesen haben. Laut einer ResOS-Auswertung steigen Wiederbesuchsraten
durch automatisierte Re-Engagement-Sequenzen messbar.

Das Comeback-Playbook funktioniert für alle vertikalen: Restaurants, Fitnessstudios,
Salons, Praxen – überall, wo wiederkehrende Buchungen das Kerngeschäft bilden.`,
            tip: "Segmentiere nach Inaktivitätszeitraum: 30 Tage = sanfter Reminder, 60 Tage = konkretes Angebot, 90 Tage = letzter Versuch mit Anreiz (kleines Extra, Gratis-Upgrade, etc.).",
          },
        ].map((step) => (
          <div key={step.n} className="mt-10">
            <div className="flex items-start gap-5">
              {/* Number */}
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
                {/* Tip box */}
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
            {step.n !== "07" && (
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
          Was der vollständige Flow leistet
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die 30&nbsp;%+ Steigerung kommt nicht aus einem einzelnen Schritt – sie ist
          die Summe vieler kleiner Optimierungen, die zusammen wirken. Hier ist die Mechanik:
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              cause: "Sofortantwort 24/7",
              effect: "Aus 5 Anfragen werden 5 Gespräche statt 2 – weil niemand mehr wartet",
              delta: "+15–25 %",
            },
            {
              cause: "Reminder-Sequenz",
              effect: "No-Show-Rate sinkt von 15 % auf 5 % – das sind 10 % mehr Tische, die tatsächlich belegt werden",
              delta: "+8–12 %",
            },
            {
              cause: "Post-Visit Automation",
              effect: "Wiederbuchungsrate steigt, Stammgäste entstehen passiv, ohne Akquisitionskosten",
              delta: "+5–10 %",
            },
            {
              cause: "Reaktivierungssequenz",
              effect: "Inaktive Kontakte kehren zurück – ein Kanal, der ohne Automation brach liegt",
              delta: "+3–8 %",
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
        <div className="my-12 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Fazit</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Fazit: Es geht nicht um Technologie, sondern um Verfügbarkeit
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Kein Restaurant, kein Salon, kein Fitnessstudio kann es sich leisten, einen
          Mitarbeiter rund um die Uhr für Instagram-DMs zu beschäftigen. Gleichzeitig
          entscheidet die Reaktionszeit darüber, wer die Buchung bekommt – du oder der
          Wettbewerber, der gerade schneller antwortet.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Instagram-DM-Automatisierung löst dieses strukturelle Problem nicht durch
          Masse, sondern durch Präzision: Der richtige Ablauf, zum richtigen Zeitpunkt,
          im richtigen Ton. Die Zahlen sind da – 90&nbsp;% Öffnungsrate, 30&nbsp;% mehr
          Reservierungen, No-Show-Raten unter 5&nbsp;% – und sie basieren auf realen
          Implementierungen in realen Service-Businesses.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Der einzige Unterschied zwischen den Betrieben, die diese Ergebnisse
          erzielen, und denen, die es nicht tun: Der Ablauf läuft automatisiert.
        </p>

        {/* CTA */}
        <div
          className="mt-12 overflow-hidden rounded-2xl"
        >
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
                Diesen Flow für dein Business aufsetzen
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wesponde richtet den vollständigen 7-Schritte-Flow für dein Restaurant,
                deinen Salon oder dein Studio ein – inklusive Kalenderintegration,
                Reminder-Sequenz und Post-Visit-Automation.
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
