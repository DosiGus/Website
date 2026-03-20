import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";

export const metadata = {
  title: "Comeback-Playbook: Inaktive Kunden mit einer DM zurückgewinnen – Wesponde",
  description:
    "Der vollständige 6-Schritte-Flow, um inaktive Gäste, Klienten und Mitglieder mit personalisierten Instagram-DMs zurückzugewinnen – inklusive Timing, Segmentierung und echten Daten.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function ComebackPlaybook() {
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
            <span className="font-mono text-[12px] text-white/50">9 Min. Lesezeit</span>
            <span className="font-mono text-[12px] text-white/50">·</span>
            <span className="font-mono text-[12px] text-white/50">Gastronomie · Fitness · Beauty</span>
          </div>

          {/* Title */}
          <h1
            className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Comeback-Playbook: Inaktive Kunden mit einer DM zurückgewinnen
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            Der vollständige 6-Schritte-Flow, um Gäste, Klienten und Mitglieder, die seit Wochen
            ausgeblieben sind, mit einer einzigen personalisierten Nachricht zurückzuholen –
            inklusive Timing, Segmentierung und konkreten Ergebnissen.
          </p>
        </div>
      </div>

      {/* ── Article Body ────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Du hast ihn aufgebaut, diesen Gast. Den, der zweimal im Monat zum Haarschnitt kam,
          den Stammtisch freitagabends reservierte oder regelmäßig im Kurs erschien.
          Dann – nichts mehr. Drei Monate vergehen. Vier. Vielleicht sechs.
          Irgendwann ist er in einer Kategorie gelandet, die niemand aktiv bearbeitet:
          die der inaktiven Kontakte.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Das Problem ist nicht, dass dieser Gast weg ist. Das Problem ist, dass die meisten
          Betriebe nie versuchen, ihn zurückzuholen. Denn dafür bräuchte man Zeit, eine Liste,
          eine Idee – und jemanden, der es tatsächlich umsetzt. Stattdessen fließt das
          gesamte Marketing-Budget in die Neukundengewinnung. Obwohl ein reaktivierter Gast
          laut Branchenanalysen{" "}
          <strong className="text-[#171923]">5- bis 25-mal günstiger</strong> zu gewinnen
          ist als ein völlig neuer Kontakt – und bereits bewiesen hat, dass er dein Angebot
          schätzt.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Dieses Playbook zeigt, wie du inaktive Kontakte mit automatisierten Instagram-DMs
          systematisch zurückgewinnst: welches Timing wirkt, wie die Nachricht klingen muss,
          welches Angebot den Unterschied macht – und wie der Ablauf danach aussieht,
          damit aus einem einmaligen Comeback ein treuer Stammkunde wird.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Warum Reaktivierung so wertvoll ist</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Section 1 */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Die Zahlen, die dein Marketing-Budget verschieben sollten
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Reaktivierung ist kein Trost-Kanal für den Fall, dass Neukundenakquise teuer wird.
          Sie ist strukturell die profitabelste Strategie im Service-Business –
          und die meisten Betriebe lassen dieses Potenzial vollständig brach liegen.
          Die Daten sprechen eine klare Sprache.
        </p>

        {/* Stats grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "26×",
              label: "günstigere Reaktivierung",
              sub: "Reaktivierung kostet im Schnitt 5–25× weniger als Neukundengewinnung (Invesp, Bain & Company)",
            },
            {
              value: "22–34 %",
              label: "Reaktivierungsrate",
              sub: "via personalisierten Messaging-Kampagnen – gegenüber 6–11 % bei E-Mail (Branchenanalyse)",
            },
            {
              value: "67 %",
              label: "mehr Ausgaben",
              sub: "geben wiederkehrende Stammkunden im Schnitt gegenüber Erstkunden aus (Zenoti, Strategies)",
            },
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

        <p className="mt-7 text-[16px] leading-relaxed text-[#2d3550]">
          Für Service-Businesses ist der Wert eines Stammkunden besonders konkret berechenbar:
          Ein Salon-Klient, der sechsmal jährlich zu je 90&nbsp;€ kommt, generiert{" "}
          <strong className="text-[#171923]">540&nbsp;€ pro Jahr</strong> – und über drei Jahre
          über 1.600&nbsp;€. Ein Restaurantgast mit zwei Besuchen pro Monat zu 45&nbsp;€
          entspricht mehr als <strong className="text-[#171923]">1.000&nbsp;€ Jahresumsatz</strong>{" "}
          aus einer einzigen Beziehung. Wer ihn nach 60 Tagen Inaktivität nicht anspricht,
          verliert diesen Wert stillschweigend.
        </p>

        {/* Pull quote */}
        <blockquote className="my-9 rounded-2xl border-l-4 border-[#2450b2] bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            „30&nbsp;% der abgewanderten Kunden sind durch eine gezielte Reaktivierungskampagne
            zurückgewinnbar – vorausgesetzt, der erste Kontakt erfolgt zum richtigen Zeitpunkt
            und mit der richtigen Botschaft."
          </p>
          <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
            Branchenanalyse Kundenreaktivierung, Bain &amp; Company / Harvard Business Review
          </p>
        </blockquote>

        <p className="mt-2 text-[16px] leading-relaxed text-[#2d3550]">
          Noch entscheidender: Der Zeitfaktor. Studien zeigen, dass 90-Tage-inaktive Kontakte
          noch mit 10–12&nbsp;% Erfolgsquote reaktivierbar sind. Bei 180 Tagen sinkt diese Rate
          auf 2–4&nbsp;%. Das Comeback-Fenster schließt sich – und automatisiertes Messaging
          ist der einzige realistische Weg, es systematisch offen zu halten.
        </p>

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
          Der 6-Schritte-Flow: vom stillen Kontakt zum aktiven Stammkunden
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Dieser Ablauf ist kein theoretisches Modell. Er basiert auf den dokumentierten
          Best Practices aus tausenden analysierten Reaktivierungskampagnen im
          Gastronomie-, Beauty- und Fitness-Bereich. Jeder Schritt hat eine klare Funktion –
          und jede Lücke kostet dir measurbar Stammkunden, die du bereits gewonnen hattest.
        </p>

        {/* Steps */}
        {[
          {
            n: "01",
            title: "Segmentierung: Wer ist wirklich inaktiv – und wie lange schon?",
            body: `Nicht jeder, der lange nicht gebucht hat, ist verloren. Der erste Schritt ist deshalb
die saubere Segmentierung deiner Kontakte nach Inaktivitätsdauer. Die drei relevanten Zeitfenster
für Service-Businesses sind: 30 Tage, 60 Tage und 90 Tage.

30-Tage-Inaktive sind keine verlorenen Kunden – sie sind Kunden im normalen Abstand. Hier
lohnt ein sanfter Touchpoint, kein aggressives Angebot. 60-Tage-Inaktive zeigen ein echtes
Signal: Jemand, der normalerweise alle vier Wochen kommt und seit acht Wochen fehlt,
hat einen konkreten Grund. Hier braucht es persönliche Ansprache und einen Mehrwert.
90-Tage-Inaktive sind die kritische Gruppe: statistisch ist jetzt ein spürbarer
Anteil wirklich weg – aber 10–12 % sind noch zurückzugewinnen, wenn der Kontakt sofort erfolgt.

Segmentiere außerdem nach Buchungshistorie: Wer einmal bei dir war, reagiert anders als
jemand, der fünfzehnmal gebucht hat. Die Botschaft muss das widerspiegeln.`,
            tip: "Die einfachste Segmentierung: Letztes Buchungsdatum + Durchschnittlicher Buchungsrhythmus des Kunden. Wer seinen Schnitt um 50 % überschreitet, ist aktiv gefährdet. Wer ihn verdoppelt hat, ist inaktiv.",
          },
          {
            n: "02",
            title: "Die erste Nachricht: persönlich, nicht werbend",
            body: `Der häufigste Fehler bei Reaktivierungskampagnen: Die erste Nachricht klingt wie ein
Newsletter. Rabatt-Banner, Aktionsheader, drei Emojis. Der Empfänger erkennt sofort: Das ist
Masse, nicht Interesse. Und lässt es links liegen.

Personalisierte Nachrichten erzielen laut Marketingforschung bis zu 26 % höhere Öffnungsraten
und bis zu 60 % höhere Konversionsraten gegenüber generischen Kampagnen. Der Grund ist
einfach: Menschen reagieren auf das Gefühl, dass jemand konkret an sie gedacht hat –
nicht auf das Gefühl, auf einer Liste zu stehen.

Die erste Reaktivierungs-DM sollte deshalb drei Eigenschaften haben: Sie klingt wie eine
Nachricht von einer Person (nicht von einem Unternehmen), sie referenziert die bestehende
Beziehung konkret ("Wir haben seit einer Weile nichts mehr von dir gehört"), und sie
endet mit einer klaren, niedrigschwelligen Handlungsaufforderung – nicht mit einem Angebot.`,
            tip: `Beispiel 30-Tage-DM: "Hey [Name], wir haben dich länger nicht gesehen! Alles gut? Wenn du magst, haben wir nächste Woche noch ein paar schöne Termine frei – sag einfach Bescheid." Kein Angebot, keine Dringlichkeit. Nur echtes Interesse.`,
          },
          {
            n: "03",
            title: "Das richtige Angebot: nach Inaktivitätsstufe staffeln",
            body: `Nicht jede Reaktivierung braucht einen Anreiz. Und nicht jeder Anreiz ist gleich wirksam.
Die richtige Logik ist eine Staffelung: Je länger die Inaktivität, desto konkreter und
wertvoller der Anreiz – aber immer so, dass er zur Beziehung passt und nicht wie
Schlusspanikaktion wirkt.

30 Tage: Kein Anreiz nötig. Ein freundlicher Touchpoint genügt ("Wir haben noch Plätze
für nächste Woche – magst du vorbeikommen?"). 60 Tage: Kleiner, persönlicher Mehrwert –
ein bevorzugter Wunschtermin, ein kostenloses Add-on, ein Willkommens-Extra ("Als
Dankeschön für deine Treue gibt es beim nächsten Besuch einen Gratis-Cappuccino dazu").
90 Tage: Konkreter Anreiz mit Verbindlichkeit – ein Sondertermin außerhalb der regulären
Verfügbarkeit, ein echtes Upgrade, ein messbarer Wert.

Entscheidend: Der Anreiz muss für dein Business tragbar sein. Nicht jede Branche kann
Rabatte geben – und oft sind sie auch nicht die wirksamste Option. Exklusivität und
persönliche Aufmerksamkeit konvertieren häufig besser als Preisreduktion.`,
            tip: "Vermeide prozentuale Rabatte als erste Reaktivierungsmaßnahme – sie setzen implizit einen neuen Ankerpreis. Besser: wertbasierte Extras (Gratis-Upgrade, Bonus-Leistung, Wunschtermin), die keinen Preisverlust signalisieren.",
          },
          {
            n: "04",
            title: "Multi-Touch-Sequenz: nicht nach einer Nachricht aufgeben",
            body: `Eine einzige Reaktivierungs-DM reicht selten aus. Das liegt nicht an mangelndem Interesse
des Empfängers – sondern an der schieren Informationsdichte des Alltags. Wer die Nachricht
liest, aber gerade im Stress ist, denkt "mach ich später" – und macht es dann nicht.

Die optimale Reaktivierungssequenz besteht aus drei Nachrichten im Abstand von 5–7 Tagen:
Nachricht 1 (persönlicher Touchpoint ohne Angebot), Nachricht 2 (konkreter Mehrwert mit
direkter Buchungsmöglichkeit), Nachricht 3 (sanfte letzte Einladung mit kleinem Anreiz,
falls noch keine Reaktion). Nach Nachricht 3 keine weiteren DMs – um nicht in Spam-Verhalten
zu driften und die Beziehung für später nicht zu beschädigen.

Automatisiertes Messaging macht diesen Dreischritt-Flow ohne manuellen Aufwand umsetzbar.
Während du dein Business betreibst, läuft die Sequenz im Hintergrund – präzise, persönlich
und im richtigen Timing.`,
            tip: "Zwischen zwei Sequenz-Nachrichten immer 5–7 Tage Abstand halten. Kürzere Intervalle wirken aufdringlich und senken die Antwortrate. Längere Intervalle lassen den Momentum verpuffen.",
          },
          {
            n: "05",
            title: "Direkte Buchung aus der DM: kein Medienbruch",
            body: `Der größte Conversion-Killer nach einer erfolgreichen Reaktivierungs-DM ist der
Medienbruch: Der Gast ist bereit, aber der nächste Schritt ist kompliziert. "Ruf uns an"
oder "Besuche unsere Website" – und 60 % der Rückkehrer brechen genau hier ab.

Die DM muss den gesamten Buchungsprozess in sich tragen: Sobald der Kontakt positiv
reagiert ("Ja, gerne!" / "Was habt ihr noch frei?"), startet automatisch der Buchungsflow
direkt im Gespräch. Datum abfragen, Uhrzeit bestätigen, Details sammeln – alles ohne
App-Wechsel, ohne Formular, ohne Telefonanruf. Am Ende eine Bestätigung direkt in der DM.

Messaging-Plattformen erzielen Konversionsraten von 45–60 % für Reaktivierungsnachrichten
mit integriertem Buchungsflow – verglichen mit 2–5 % bei Kampagnen, die auf externe
Landingpages verweisen. Der Kanal funktioniert nur dann vollständig, wenn der gesamte
Weg von der Einladung bis zur Buchung im selben Fenster stattfindet.`,
            tip: "Quick-Reply-Buttons als erste Antwortoptionen senken die Hemmschwelle drastisch: \"Ja, zeig mir freie Termine\" / \"Vielleicht nächste Woche\" / \"Kein Interesse gerade\" – der Kontakt muss nicht tippen, nur tippen.",
          },
          {
            n: "06",
            title: "Post-Comeback-Nurturing: aus einmaligem Rückkehrer Stammkunde machen",
            body: `Der wertvollste Moment im Comeback-Playbook ist nicht das Zurückkommen – sondern
das Bleiben. Wer nach 60 Tagen Inaktivität reaktiviert wurde, ist statistisch besonders
gefährdet, wieder abzuwandern. Die Post-Comeback-Phase ist deshalb entscheidend für den
langfristigen Wert dieser Reaktivierung.

Zwei bis vier Stunden nach dem Besuch: Eine kurze, persönliche Follow-up-DM –
"Schön, dich wieder gesehen zu haben! Hat alles gepasst?" – verbindet emotional und
eröffnet den Weg für eine Bewertung. Eine Woche später: Ein sanfter Hinweis auf den
nächsten Termin oder eine saisonale Neuigkeit, die relevant für diesen Kontakt ist.
Damit läuft die nächste Buchung, bevor die Inaktivität wieder beginnt.

Daten aus Fitness- und Salon-Analysen zeigen: Kunden, die nach der Reaktivierung einen
zweiten Besuch innerhalb von 30 Tagen absolvieren, haben eine 3-fach höhere
Wahrscheinlichkeit, langfristige Stammkunden zu werden. Das Post-Comeback-Fenster
ist das entscheidende Investment.`,
            tip: "Richte nach jeder Reaktivierung automatisch einen Follow-up-Reminder ein: 7 Tage nach dem Besuch eine Nachricht, 30 Tage nach dem Besuch einen sanften nächsten Buchungs-Nudge. So schließt sich der Loop, bevor er sich öffnet.",
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
            {step.n !== "06" && (
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
          Was ein vollständiger Comeback-Flow leistet
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die Reaktivierungsrate entsteht nicht durch einen einzelnen cleveren Satz –
          sie ist das Ergebnis eines durchdachten Ablaufs, bei dem jeder Schritt auf
          den nächsten einzahlt. Hier ist die Mechanik, aufgeschlüsselt nach Hebeln:
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              cause: "Timing-Segmentierung (30/60/90 Tage)",
              effect: "Frühere Intervention verhindert endgültigen Abgang – bei 30-Tage-Inaktiven liegt die Rückgewinnungsrate 5× höher als bei 180-Tage-Inaktiven",
              delta: "Bis 12 %",
            },
            {
              cause: "Personalisierte Erstnachricht",
              effect: "Öffnungsrate und Konversionsrate steigen messbar – Studien zeigen +26 % Öffnungsrate und bis zu +60 % Konversionsrate vs. generische Kampagnen",
              delta: "+26–60 %",
            },
            {
              cause: "Gestaffelter Anreiz nach Inaktivitätsstufe",
              effect: "Wertbasierte Extras statt Rabatt schützen die Marge und konvertieren genauso stark – der Gast kommt wegen der Beziehung, nicht wegen des Preises",
              delta: "Marge stabil",
            },
            {
              cause: "3-Touch-Sequenz statt Einzelnachricht",
              effect: "Dreifache Kontaktpunkte verdreifachen die Reaktionswahrscheinlichkeit – ohne aufdringlich zu wirken, wenn der Abstand stimmt",
              delta: "Bis 3×",
            },
            {
              cause: "Direktbuchung aus der DM",
              effect: "Kein Medienbruch bedeutet keine Abbrüche – Konversionsraten von 45–60 % statt 2–5 % bei externen Landingpages",
              delta: "+40–55 %",
            },
            {
              cause: "Post-Comeback-Nurturing",
              effect: "Zweiter Besuch innerhalb von 30 Tagen erhöht Stammkundenwahrscheinlichkeit um das Dreifache – die Reaktivierung zahlt sich langfristig aus",
              delta: "3× CLV",
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
          Fazit: Deine wertvollsten Neukunden sind bereits deine alten
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Jeder Betrieb hat eine Liste inaktiver Kontakte, die nie angesprochen wird.
          Nicht aus Desinteresse, sondern weil niemand Zeit hat, sie manuell zu bearbeiten.
          Genau dort liegt die größte ungenutzte Einnahmequelle im Service-Business –
          Menschen, die dein Angebot bereits kennen, bereits positiv erlebt haben und
          die du nur daran erinnern musst, dass du noch existierst und an sie denkst.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Der Unterschied zwischen Betrieben, die 30&nbsp;% ihrer inaktiven Kontakte
          zurückgewinnen, und denen, die keinen einzigen reaktivieren: nicht das Angebot,
          nicht der Preis, nicht die Qualität. Der Unterschied ist, ob der Ablauf
          automatisiert läuft oder nicht. Wer wartet, dass Gäste von selbst zurückkommen,
          wartet meistens vergebens.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Das Comeback-Playbook ist kein aufwendiges Projekt. Es ist ein einmaliger
          Aufbau eines Flows, der danach still und präzise im Hintergrund arbeitet –
          während du dein Business betreibst. Für Gastronomen, Saloninhaber und
          Fitnessstudio-Betreiber gleichermaßen gilt: Die wertvollsten Neukunden des
          nächsten Quartals sitzen bereits in deiner Kontaktliste. Du musst sie nur
          ansprechen.
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
                Bereit für die Umsetzung?
              </p>
              <h3
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Diesen Comeback-Flow für dein Business aufsetzen
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wesponde richtet den vollständigen 6-Schritte-Reaktivierungsflow für dein
                Restaurant, deinen Salon oder dein Fitnessstudio ein – inklusive
                Segmentierung, personalisierter DM-Sequenz und Direktbuchung aus dem Chat.
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
