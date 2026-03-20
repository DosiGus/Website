import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata = {
  title: "Instagram DM Automatisierung einrichten: Schritt für Schritt – Wesponde Guide",
  description:
    "Der vollständige Einrichtungs-Guide für Instagram DM Automatisierung: Voraussetzungen, Schritt-für-Schritt-Anleitung, häufige Fehler und Best Practices für Restaurants, Salons und Studios.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function GuideInstagramDmEinrichten() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-28 pb-16"
        style={{
          background: "linear-gradient(135deg, #3d1a06 0%, #6b3a1e 22%, #ffffff 83%, #ffffff 100%)",
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
            Instagram DM Automatisierung einrichten: Schritt für Schritt
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            Vom Instagram Business Account bis zum ersten automatisierten Flow –
            alle Voraussetzungen, Schritte und typischen Stolperfallen in einem Guide.
          </p>
        </div>
      </div>

      {/* ── Article Body ────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Du hast von Instagram DM Automatisierung gehört – und weißt, dass andere Betriebe
          damit Reservierungen, Terminbuchungen und häufige Kundenfragen automatisch abwickeln.
          Aber wo fängt man konkret an? Welche Konten, Verbindungen und Einstellungen braucht man überhaupt?
          Und was geht schief, wenn man einen Schritt überspringt?
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Dieser Guide gibt dir einen vollständigen, praxisnahen Überblick – ohne unnötige Theorie.
          Am Ende weißt du genau, was du einrichten musst, in welcher Reihenfolge, und worauf du
          dabei achten solltest. Der Guide richtet sich an Restaurant-Betreiber, Saloninhaber,
          Fitnessstudio-Betreiber und alle anderen Service-Businesses, die Instagram aktiv als
          Kommunikationskanal nutzen.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Warum es sich lohnt</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Stats grid */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Was du mit einem funktionierenden Setup erreichst
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Bevor wir in die Einrichtung einsteigen: Hier sind drei Kennzahlen, die zeigen,
          warum der Aufwand sich lohnt – und was konkret passiert, sobald dein Setup steht.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { value: "unter 2 s", label: "Erste Antwort", sub: "Automatisierte Flows reagieren sofort – auch nachts und am Wochenende" },
            { value: "90 %", label: "Öffnungsrate", sub: "Instagram DMs werden deutlich häufiger gelesen als E-Mails (~20 %)" },
            { value: "30 %", label: "mehr Buchungen", sub: "Betriebe mit DM-Automatisierung verzeichnen messbar mehr Conversions" },
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

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Voraussetzungen</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Prerequisites Section */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Was du vor der Einrichtung brauchst
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Instagram DM Automatisierung funktioniert nicht mit jedem Account. Meta (das
          Unternehmen hinter Instagram) erlaubt den Zugriff auf die Messaging-API nur
          unter bestimmten Bedingungen. Diese vier Voraussetzungen musst du erfüllen,
          bevor du auch nur eine einzige automatisierte Nachricht senden kannst.
        </p>

        <div className="mt-7 space-y-3">
          {[
            "Instagram Business- oder Creator-Konto (kein privates Profil)",
            "Verknüpfte Facebook-Seite (aktiv und vollständig eingerichtet)",
            "Meta Business Manager Zugang (kostenlos, unter business.facebook.com)",
            "Klarer Use Case: Reservierungen, Terminbuchungen oder FAQ",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-[#2a4ea7]/12 bg-white p-4">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2450b2]">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[15px] text-[#2d3550]">{item}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[16px] leading-relaxed text-[#2d3550]">
          Klingt nach viel? In der Praxis dauert das Einrichten der Voraussetzungen in
          der Regel unter einer Stunde – sofern du noch kein Business-Konto hast.
          Wenn du bereits einen Business Account mit verknüpfter Facebook-Seite besitzt,
          kannst du direkt zum ersten Schritt springen.
        </p>

        {/* Pull quote */}
        <blockquote className="my-9 rounded-2xl border-l-4 border-[#6b3a1e] bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            „Laut Meta kommunizieren monatlich über 150 Millionen Nutzer mit
            Business-Accounts auf Instagram. Gleichzeitig bevorzugen 63&nbsp;% der
            Konsumenten Messenger-Kommunikation gegenüber E-Mail oder Telefon –
            der Kanal ist also genau dort, wo deine Kunden sowieso schon sind.&rdquo;
          </p>
          <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
            Meta Business Insights, 2024
          </p>
        </blockquote>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Die Einrichtung</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Steps Section */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Die Einrichtung Schritt für Schritt
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die folgenden acht Schritte führen dich von einem noch nicht eingerichteten
          Instagram-Account bis hin zum ersten aktiven, automatisierten DM-Flow.
          Halte dich an die Reihenfolge – viele Fehler entstehen dadurch, dass man
          spätere Schritte zu früh angeht, bevor die Basis steht.
        </p>

        {[
          {
            n: "01",
            title: "Instagram Business Account aktivieren",
            body: `Öffne dein Instagram-Profil, gehe zu „Einstellungen und Datenschutz" → „Konto" → „Zu professionellem Konto wechseln". Wähle „Unternehmen" (nicht „Creator", es sei denn, du bist Soloselbstständiger ohne Team). Wähle die Kategorie, die am besten zu deinem Business passt – z. B. „Restaurant", „Schönheitssalon" oder „Fitnessstudio".

Beim Wechsel wirst du aufgefordert, eine Facebook-Seite zu verknüpfen. Falls du noch keine hast, lege sie in diesem Schritt an. Die Verknüpfung ist Pflicht: Ohne Facebook-Seite kann Instagram keine Automatisierungs-API freischalten.

Nach dem Wechsel siehst du in deinem Profil Insights (Reichweite, Profilaufrufe, etc.) und kannst in den Einstellungen den Profil-Typ jederzeit wieder einsehen.`,
            tip: "Stelle sicher, dass dein Profil vollständig ausgefüllt ist: Profilbild, kurze Bio, Website-Link, Kontaktdaten. Unvollständige Profile wirken weniger vertrauenswürdig und erhalten weniger DMs.",
          },
          {
            n: "02",
            title: "Facebook-Seite vollständig einrichten",
            body: `Die Facebook-Seite ist technisch die Brücke zwischen Instagram und dem Automatisierungs-System. Sie muss aktiv und vollständig eingerichtet sein – auch wenn du Facebook selbst nicht aktiv nutzt.

Konkret brauchst du: einen aussagekräftigen Seitennamen (identisch oder ähnlich wie dein Instagram-Name), eine vollständige „Über uns"-Beschreibung, Kontaktdaten (Telefon, Adresse, Öffnungszeiten), und mindestens ein Profilbild sowie ein Titelbild.

Außerdem wichtig: Du musst Admin-Rechte auf dieser Seite haben. Wenn die Seite ursprünglich von jemandem anderem erstellt wurde (z. B. einer Marketingagentur), lass dir die Admin-Rolle übertragen, bevor du weitermachst – andernfalls scheitert die Verbindung im nächsten Schritt.`,
            tip: "Aktualisiere die Öffnungszeiten auf deiner Facebook-Seite regelmäßig. Diese Information wird in der Regel auch bei Google Maps übernommen und verbessert deine lokale Auffindbarkeit.",
          },
          {
            n: "03",
            title: "Meta Business Manager einrichten",
            body: `Gehe auf business.facebook.com und erstelle einen Business Manager Account für dein Unternehmen (kostenlos). Dort verwaltest du alle Seiten, Konten und Zugänge zentral.

Im Business Manager: Füge deine Facebook-Seite unter „Konten → Seiten" hinzu. Verknüpfe anschließend deinen Instagram Business Account unter „Konten → Instagram-Konten". Stelle sicher, dass beides im Business Manager als aktiv und verbunden angezeigt wird.

Der Business Manager ist der Ort, von dem aus externe Tools (dein DM-Automatisierungs-System) Zugriff auf deine Konten erhalten. Ohne diesen Schritt kann keine externe Anwendung auf deine Instagram-DMs zugreifen – es spielt keine Rolle, wie gut das Tool sonst konfiguriert ist.`,
            tip: "Lege im Business Manager unbedingt mindestens einen zweiten Admin fest. Falls du dich aus deinem persönlichen Facebook-Konto aussperrst, kannst du sonst den Zugriff auf alle verbundenen Business-Assets verlieren.",
          },
          {
            n: "04",
            title: "DM-Automatisierungstool verbinden",
            body: `Wähle deine Automatisierungslösung und folge deren Verbindungsprozess. In der Regel läuft das so: Du klickst auf „Instagram verbinden" (oder ähnlich) im Tool, wirst zu Facebook weitergeleitet, meldest dich an, wählst die richtige Facebook-Seite, und bestätigst die angefragten Berechtigungen.

Die wichtigsten Berechtigungen, die das Tool anfordern muss, damit DM-Automatisierung funktioniert: Zugriff auf Instagram-Nachrichten, Verwaltung von Seiten-Nachrichten, und die Möglichkeit, in deinem Namen zu antworten.

Wenn du mehrere Facebook-Seiten oder Instagram-Konten verwaltest: Achte genau darauf, welche Seite und welches Konto du beim Verbindungsvorgang auswählst. Ein falsches Konto führt dazu, dass Flows zwar aktiv sind, aber an die falsche Instagram-Inbox gebunden werden.`,
            tip: "Prüfe nach dem Verbinden immer den Verbindungsstatus im Tool. Ein \"Verbunden\"-Häkchen reicht nicht – sende dir selbst eine Test-DM und schau, ob das Tool sie empfängt.",
          },
          {
            n: "05",
            title: "Ersten Flow erstellen: Trigger definieren",
            body: `Ein „Flow" ist die automatisierte Konversationssequenz, die ausgelöst wird, wenn jemand dir schreibt. Der erste und wichtigste Baustein: der Trigger – also die Bedingung, wann der Flow startet.

Typische Trigger-Typen: ein bestimmtes Keyword im DM (z. B. „reservieren", „buchen", „termin"), ein Kommentar unter einem Post, ein Klick auf dein Story-Link, oder ein allgemeiner „Alle neuen DMs"-Trigger.

Für den Anfang empfiehlt sich ein Keyword-Trigger: Definiere ein klares, kurzes Wort, das deiner Zielgruppe kommuniziert wird (z. B. in deiner Bio: „Schreib TISCH, um einen Tisch zu reservieren"). Das sorgt dafür, dass nur echte Buchungsanfragen den Flow auslösen – und nicht jede beliebige Nachricht.

Lege außerdem fest, was passiert, wenn ein DM keinen bekannten Trigger enthält: Entweder ein freundlicher Hinweis auf den richtigen Befehl, oder eine Weiterleitung an dein Team.`,
            tip: "Verwende deutsche, einfache Keywords ohne Sonderzeichen oder Umlaute – also lieber \"TISCH\" als \"Tischreservierung\" oder \"Büchung\". Kurze Keywords werden von Kunden häufiger korrekt eingegeben.",
          },
          {
            n: "06",
            title: "Nachrichten formulieren und testen",
            body: `Jetzt kommt der kreative Teil: die eigentlichen Nachrichten. Formuliere jeden Schritt des Flows so, als würde ein freundlicher Mitarbeiter antworten – nicht wie ein Formular.

Grundprinzip für jede Nachricht: eine klare Frage oder Information, und wenn möglich Quick-Reply-Buttons (vorgefertigte Antwort-Optionen), um dem Kunden Tipparbeit zu ersparen.

Beispiel für eine Reservierungssequenz:
→ Begrüßung: „Hallo! Schön, dass du dich meldest. Für welches Datum möchtest du reservieren?"
→ Uhrzeit: Quick-Reply-Buttons mit deinen Servicezeiten (z. B. „12:00", „13:00", „19:00", „20:00")
→ Personenzahl: „Wie viele Personen seid ihr?" mit Buttons (2, 3–4, 5–6, mehr)
→ Name: „Auf welchen Namen darf ich reservieren?"
→ Bestätigung: Vollständige Zusammenfassung mit Datum, Uhrzeit, Personenzahl und Name

Teste jeden Flow ausgiebig, bevor du ihn live schaltest: Schicke dir selbst DMs und gehe alle Pfade durch – inklusive ungültige Eingaben und Edge Cases.`,
            tip: "Baue immer eine Escape-Option ein: Schreib in jede Nachricht einen Hinweis wie 'Oder schreib TEAM, um direkt mit uns zu sprechen.' So kannst du Faelle, die der Flow nicht abdeckt, sauber an dein Team uebergeben.",
          },
          {
            n: "07",
            title: "Live schalten und erste Ergebnisse messen",
            body: `Wenn der Flow getestet ist und alle Pfade korrekt funktionieren, schalte ihn auf „Aktiv". Ab diesem Moment werden eingehende DMs automatisch verarbeitet.

Was du in den ersten 48 Stunden beobachten solltest:
1. Kommen Trigger-DMs an, und wird der Flow korrekt ausgelöst?
2. Werden alle Antworten korrekt gesendet, und stimmt die Reihenfolge?
3. Gibt es Nachrichten, die den Flow nicht auslösen, aber sollten?
4. Wie viele Flows werden abgeschlossen versus abgebrochen?

Die meisten Automatisierungstools zeigen dir diese Metriken in einem Dashboard. Schau vor allem auf die Abbruchrate: An welcher Frage verlassen die meisten Nutzer den Flow? Das ist der erste Optimierungsansatz.

Kommuniziere den neuen Kanal aktiv: Aktualisiere deine Bio, weise in Stories darauf hin, und informiere Stammkunden. Ein gut eingerichteter Flow bringt nichts, wenn niemand weiß, dass er existiert.`,
            tip: "Schalte den Flow zunächst nur für neue DMs aktiv – nicht für alle bestehenden Konversationen. So kannst du sicherstellen, dass laufende Gespräche mit deinem Team nicht durch den Bot unterbrochen werden.",
          },
          {
            n: "08",
            title: "Optimieren basierend auf Daten",
            body: `DM-Automatisierung ist kein „einmal einrichten und vergessen"-System. Die besten Ergebnisse entstehen durch kontinuierliches Beobachten und Anpassen.

Was du regelmäßig prüfen solltest:
→ Abbruchrate pro Schritt: Wo verlassen Kunden den Flow? Oft ein Hinweis auf eine zu komplizierte Frage, eine schlechte Quick-Reply-Auswahl oder eine unklare Formulierung.
→ Completion-Rate: Wie viele begonnene Flows enden in einer Buchung? Ein Wert unter 50 % deutet auf strukturelle Probleme im Flow-Aufbau hin.
→ Keyword-Fehler: Schreiben Kunden Varianten deines Trigger-Keywords, die nicht erkannt werden? Ergänze sie als zusätzliche Trigger.
→ Häufige Folgefragen: Was fragen Kunden, nachdem ein Flow abgeschlossen ist? Das sind Hinweise auf Informationslücken im Flow.

Plane alle zwei Wochen eine kurze Überprüfung – 15 Minuten reichen in der Regel, um die wichtigsten Metriken zu sichten und kleine Anpassungen vorzunehmen.`,
            tip: "Führe ein kurzes Änderungsprotokoll: Notiere, was du wann geändert hast und wie sich die Metriken danach entwickelt haben. So erkennst du, welche Anpassungen tatsächlich gewirkt haben – und vermeidest, erfolgreiche Einstellungen versehentlich rückgängig zu machen.",
          },
        ].map((step) => (
          <div key={step.n} className="mt-10">
            <div className="flex items-start gap-5">
              {/* Number */}
              <div className="flex-shrink-0">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: "#6b3a1e" }}
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
                  className="mt-4 rounded-xl border border-[#6b3a1e]/12 p-4"
                  style={{ backgroundColor: "rgba(107,58,30,0.04)" }}
                >
                  <p className="font-mono text-[12px] uppercase tracking-wider text-[#6b3a1e]">
                    Tipp
                  </p>
                  <p className="mt-1 font-mono text-[13px] leading-relaxed text-[#3d4255]">
                    {step.tip}
                  </p>
                </div>
              </div>
            </div>
            {step.n !== "08" && (
              <div className="ml-[60px] mt-8 h-px bg-[#edf1f8]" />
            )}
          </div>
        ))}

        {/* Divider */}
        <div className="my-12 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Typische Fehler</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Common Mistakes Section */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Häufige Fehler – und wie du sie vermeidest
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die meisten Probleme bei der Einrichtung von DM-Automatisierungen entstehen
          nicht durch technische Fehler, sondern durch übersehene Grundlagen oder
          falsche Erwartungen. Hier sind die sechs häufigsten Stolperfallen:
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              fehler: "Persönliches Instagram-Profil statt Business Account",
              erklaerung: "Die Automatisierungs-API ist ausschließlich für Business- und Creator-Konten verfügbar. Privat-Profile können nicht angebunden werden – Punkt. Wer diesen Schritt überspringt, kann kein Tool verbinden, egal was er sonst einstellt.",
              loesung: "Konto umstellen und dabei direkt eine Facebook-Seite verknüpfen (Schritt 1 und 2 dieses Guides).",
            },
            {
              fehler: "Facebook-Seite nicht mit Instagram verbunden",
              erklaerung: "Selbst wenn du einen Business Account hast: Ohne aktive Verbindung zur Facebook-Seite im Meta Business Manager wird die Messaging-API nicht funktionieren. Das Tool zeigt zwar \"Verbunden\" an, empfängt aber keine DMs.",
              loesung: "Im Meta Business Manager unter Konten → Instagram-Konten prüfen, ob die Verknüpfung aktiv ist.",
            },
            {
              fehler: "Zu viele Fragen im Flow",
              erklaerung: "Jede zusätzliche Frage erhöht die Wahrscheinlichkeit, dass ein Kunde den Flow abbricht. Betriebe, die beim ersten Setup alle möglichen Informationen abfragen (Allergien, Geburtstagswünsche, Parkplätze), verlieren einen Großteil der Interessenten nach der zweiten oder dritten Frage.",
              loesung: "Starte mit dem absoluten Minimum: Datum, Uhrzeit, Personenzahl, Name. Alles andere ist optional und kann später ergänzt werden.",
            },
            {
              fehler: "Flow ohne Escape-Option",
              erklaerung: "Nicht jede Anfrage passt in einen automatisierten Flow. Kunden mit komplexen Sonderwünschen, Beschwerden oder Fragen außerhalb des Flow-Skripts landen in einer Sackgasse – und das hinterlässt einen schlechten Eindruck.",
              loesung: "Baue in jeden Flow-Schritt eine Ausweichmöglichkeit ein (z. B. ein Keyword wie \"TEAM\" oder \"HILFE\"), das die Konversation an einen menschlichen Mitarbeiter übergibt.",
            },
            {
              fehler: "Flow live schalten ohne zu testen",
              erklaerung: "Formulierungsfehler, fehlende Quick-Reply-Optionen oder falsch konfigurierte Trigger fallen im Test auf – bei echten Kunden wirken sie unprofessionell und kosten Buchungen.",
              loesung: "Mindestens drei vollständige Testdurchläufe durch alle möglichen Pfade, inklusive ungültiger Eingaben, bevor der Flow aktiviert wird.",
            },
            {
              fehler: "Kein Hinweis auf den Automatisierungskanal in der Bio",
              erklaerung: "Ein perfekt konfigurierter Flow bringt nichts, wenn niemand weiß, wie er ihn auslöst. Viele Betriebe richten DM-Automatisierung ein und erwarten, dass Kunden es von alleine herausfinden.",
              loesung: "Ergänze deine Bio um einen klaren Hinweis (z. B. \"Schreib TISCH für eine Reservierung\") und kommuniziere den neuen Kanal aktiv in deinen Stories.",
            },
          ].map((item) => (
            <div
              key={item.fehler}
              className="overflow-hidden rounded-2xl border border-[#2a4ea7]/12 bg-white shadow-[0_2px_8px_rgba(28,53,122,0.04)]"
            >
              <div
                className="px-5 py-3"
                style={{ background: "linear-gradient(135deg, #fff5f0 0%, #fff0eb 100%)" }}
              >
                <p className="font-semibold text-[#6b3a1e]">{item.fehler}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[15px] leading-relaxed text-[#2d3550]">{item.erklaerung}</p>
                <div className="mt-3 flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#2450b2]">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-mono text-[13px] leading-relaxed text-[#3d4255]">
                    <span className="font-semibold text-[#2450b2]">Lösung: </span>
                    {item.loesung}
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

        {/* Conclusion */}
        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          Fazit: Die Einrichtung ist einfacher als die meisten denken
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Instagram DM Automatisierung klingt technisch – ist es aber nicht. Die
          Voraussetzungen (Business Account, Facebook-Seite, Meta Business Manager)
          sind einmalig einzurichten und dauern in der Regel unter einer Stunde.
          Der Flow selbst folgt einer klaren Logik: Trigger, Fragen, Bestätigung.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Was den Unterschied macht, ist nicht die Technik – es ist die Qualität
          der Nachrichten, die Klarheit der Trigger und die konsequente Pflege
          des Systems. Ein einfacher, gut formulierter Flow mit drei Fragen
          konvertiert zuverlässiger als ein komplexer Flow mit zehn Schritten.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Wenn du diesen Guide Schritt für Schritt durcharbeitest, hast du am Ende
          ein funktionierendes System, das rund um die Uhr auf Buchungsanfragen
          reagiert – auch dann, wenn du gerade im Abendservice steckst, einen
          Termin hast oder schläfst.
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
                Bereit für die Einrichtung?
              </p>
              <h3
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Wir richten deinen ersten DM-Flow ein
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wesponde verbindet deinen Instagram-Account, richtet deinen ersten
                Automatisierungs-Flow ein und testet alles, bevor es live geht –
                für Restaurants, Salons und Fitnessstudios.
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
