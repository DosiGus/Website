import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata = {
  title: "Bewertungen skalieren: von Besuch zu 5-Sterne-Review – Wesponde Guide",
  description:
    "Der vollständige Guide, um Google-Bewertungen systematisch zu gewinnen – mit konkreten Nachrichtenvorlagen, dem richtigen Timing und dem psychologischen Fundament dahinter.",
};

const noiseDataUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function Guide_BewertungenSkalieren() {
  return (
    <div className="min-h-screen bg-[#f6f9ff]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden pt-28 pb-16"
        style={{
          background: "linear-gradient(135deg, #3b1a08 0%, #6b3a1e 22%, #ffffff 83%, #ffffff 100%)",
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
            <span className="font-mono text-[12px] text-white/50">9 Min. Lesezeit</span>
            <span className="font-mono text-[12px] text-white/50">·</span>
            <span className="font-mono text-[12px] text-white/50">Gastronomie · Fitness · Beauty</span>
          </div>

          {/* Title */}
          <h1
            className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
            style={{ fontFamily: "var(--font-home-display)" }}
          >
            Bewertungen skalieren: von Besuch zu&nbsp;5-Sterne-Review
          </h1>

          <p className="mt-5 font-mono text-[15px] leading-relaxed text-white/65">
            80&nbsp;% deiner potenziellen Bewertungen verschwinden, weil du nie gefragt hast.
            Dieser Guide zeigt dir, wie du das systematisch änderst – mit dem richtigen Timing,
            den richtigen Worten und einem Ablauf, der sich selbst trägt.
          </p>
        </div>
      </div>

      {/* ── Article Body ────────────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">

        {/* Intro */}
        <p className="text-[17px] leading-relaxed text-[#2d3550]">
          Dein Gast hatte einen schönen Abend. Die Nachricht ist warm, der Service war aufmerksam,
          das Essen war gut. Er verlässt das Restaurant – und du verlierst ihn. Nicht weil er
          unzufrieden war, sondern weil du ihn nie gefragt hast.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Studien zeigen, dass bis zu&nbsp;<strong className="text-[#171923]">83&nbsp;% der Kunden bereit sind, eine Bewertung zu
          hinterlassen – wenn sie aktiv darum gebeten werden</strong>. Ohne Anfrage tun das spontan nur
          rund 28&nbsp;% nach positiven Erlebnissen. Das ist die größte stille Lücke im Reputationsmarketing
          von Service-Unternehmen: nicht schlechte Bewertungen, sondern fehlende.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#2d3550]">
          Dieser Guide zeigt dir Schritt für Schritt, wie du diesen Unterschied systematisch
          ausnutzt – mit dem richtigen Moment, der richtigen Formulierung und einem Prozess,
          der keine manuelle Arbeit erfordert.
        </p>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Warum Bewertungen entscheidend sind</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        {/* Stats grid */}
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          {[
            {
              value: "93 %",
              label: "lesen Bewertungen",
              sub: "der Konsumenten prüfen Online-Bewertungen vor dem Besuch (BrightLocal, 2025)",
            },
            {
              value: "+35 %",
              label: "höhere Klickrate",
              sub: "wenn Sternebewertungen im Google-Suchergebnis sichtbar sind (CXL Research)",
            },
            {
              value: "2–4 h",
              label: "optimales Timing",
              sub: "nach dem Besuch für die Bewertungsanfrage – der Peak der positiven Erinnerung",
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

        <p className="mt-7 text-[16px] leading-relaxed text-[#2d3550]">
          Google-Bewertungen sind kein nettes Extra – sie sind ein handfester Umsatz- und
          Sichtbarkeitsfaktor. Laut einer Analyse führender lokaler SEO-Studien führt
          jede zusätzliche Bewertung rechnerisch zu rund&nbsp;<strong className="text-[#171923]">80&nbsp;zusätzlichen
          Website-Besuchen, 63 Anfragen nach dem Weg und 16 Anrufen</strong> pro Monat.
          Ein Anstieg um nur einen Stern im Durchschnitt kann den Umsatz um bis zu&nbsp;<strong className="text-[#171923]">10&nbsp;%</strong> steigern.
        </p>

        {/* Pull quote */}
        <blockquote className="my-9 rounded-2xl border-l-4 border-[#6b3a1e] bg-white p-6 shadow-[0_4px_16px_rgba(28,53,122,0.05)]">
          <p className="text-[17px] font-medium italic leading-relaxed text-[#2d3550]">
            „Bewertungen sind kein Resultat von Glück – sie sind das Resultat eines Systems.
            Wer nicht fragt, bekommt keine. Wer fragt, bekommt fast immer eine.&rdquo;
          </p>
          <p className="mt-3 font-mono text-[12px] text-[#7485ad]">
            ReviewTrackers Consumer Report, 2025
          </p>
        </blockquote>

        {/* Divider */}
        <div className="my-10 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#dde2ee]" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#7485ad]">Der vollständige Guide</span>
          <span className="h-px flex-1 bg-[#dde2ee]" />
        </div>

        <h2
          className="text-2xl font-semibold tracking-tight text-[#171923] sm:text-3xl"
          style={{ fontFamily: "var(--font-home-display)" }}
        >
          In 6 Schritten zum dauerhaften Bewertungsfluss
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die meisten Betriebe hoffen auf Bewertungen. Dieser Guide zeigt dir, wie du
          sie systematisch produzierst – ohne Aufdringlichkeit, ohne manuelle Arbeit und
          mit einem Ton, der zu deinem Business passt.
        </p>

        {/* Steps */}
        {[
          {
            n: "01",
            title: "Warum du Bewertungen systematisch einholen musst",
            body: `Die häufigste Aussage, die Betriebe machen: „Unsere Gäste wissen, dass sie eine Bewertung hinterlassen können." Das stimmt – aber es reicht nicht.

Studien belegen: Ohne aktive Anfrage hinterlassen lediglich 28 % der zufriedenen Kunden eine Bewertung. Der Grund liegt in der Psychologie: Zufriedenheit allein erzeugt keine Handlungsenergie. Unzufriedenheit hingegen treibt Menschen aktiv dazu an, sich zu äußern. Das erklärt, warum negative Bewertungen oft überrepräsentiert sind – nicht weil es mehr unzufriedene Gäste gibt, sondern weil Unzufriedenheit ein stärkerer Handlungsauslöser ist.

Das Gegenmittel ist einfach: ein systematischer Prozess, der jeden zufriedenen Gast zum richtigen Zeitpunkt mit der richtigen Nachricht erreicht. Eine individuelle, persönliche Anfrage wandelt Zufriedenheit in Handlung um – zuverlässig und skalierbar.`,
            tip: "Kein System = zufällige Ergebnisse. Selbst ein einfacher, konsequenter Prozess schlägt den besten gelegentlichen Versuch um ein Vielfaches.",
          },
          {
            n: "02",
            title: "Der perfekte Zeitpunkt für die Anfrage",
            body: `Timing ist der am meisten unterschätzte Faktor bei Bewertungsanfragen. Zu früh – und der Gast ist noch gar nicht zu Hause. Zu spät – und die Erinnerung ist verblasst, der emotionale Impuls verpufft.

Forschung zur optimalen Anfragezeit zeigt konsistent: Das Fenster liegt bei 2 bis 4 Stunden nach dem Besuch. In dieser Phase ist das Erlebnis noch präsent, der emotionale Peak aber bereits stabil – nicht mehr von der Aufregung des Moments überlagert, aber noch lebendig genug, um echte Motivation zu erzeugen.

Für die drei Hauptbranchen ergeben sich leichte Unterschiede:

→ Gastronomie: 2–3 Stunden nach Reservierungszeit (wenn der Gast zu Hause angekommen ist)
→ Kosmetik & Beauty: 1–2 Stunden nach dem Termin (direkt nach dem ersten Spiegel-Check)
→ Fitness & Training: 3–4 Stunden nach der Session (nach der Nachbrennphase)

Was du in jedem Fall vermeiden solltest: eine Anfrage am nächsten Tag oder später. Laut Timing-Studien sinkt die Antwortrate nach 24 Stunden um mehr als die Hälfte.`,
            tip: "Automatisiere das Timing exakt: nicht \"irgendwann nach dem Besuch\", sondern auf die Stunde genau. Automatisierter Versand zum optimalen Zeitpunkt ist der größte Einzelhebel bei Bewertungsanfragen.",
          },
          {
            n: "03",
            title: "Die Formulierung der Bewertungsanfrage",
            body: `Wie du fragst, entscheidet fast ebenso viel wie wann. Personalisierte Anfragen erzielen laut Studien 3 bis 5 Mal höhere Antwortquoten als generische Templates. Das liegt an einem einfachen psychologischen Prinzip: Menschen reagieren auf Menschen, nicht auf Formulare.

Die effektivste Anfrage enthält drei Elemente:
(1) Persönliche Ansprache mit Namen
(2) Bezug auf das konkrete Erlebnis (Datum, Anlass, Besonderheit)
(3) Eine direkte, einfache Bitte – ohne Ausweichmöglichkeit

Hier sind drei konkrete Beispielnachrichten, die du direkt verwenden kannst:

---

Gastronomie – Instagram DM oder SMS:
„Hallo [Name], schön, dass du heute Abend bei uns warst! Wenn du einen Moment hast – eine kurze Bewertung bei Google würde uns sehr helfen. Hier geht's direkt: [Link]. Danke von Herzen! 🙏"

---

Kosmetik & Beauty:
„Hey [Name]! Ich hoffe, du bist glücklich mit dem heutigen Ergebnis. Falls du kurz Zeit hast: Eine Bewertung bedeutet uns wirklich viel – und dauert nur eine Minute: [Link]. Bis zum nächsten Mal!"

---

Fitness & Training:
„Hi [Name], top Training heute! Wenn du möchtest, freue ich mich sehr über ein kurzes Feedback bei Google – das hilft mir sehr: [Link]. Danke und erhol dich gut!"

---

Was alle drei gemeinsam haben: kurz, persönlich, ohne Druck. Kein „Bitte bitte", kein Sternziel. Nur eine freundliche Einladung zum richtigen Moment.`,
            tip: "Vermeide es, explizit nach \"5 Sternen\" zu fragen. Das wirkt manipulativ und kann von Google sanktioniert werden. Formuliere stattdessen: \"deine ehrliche Meinung\" oder \"ein kurzes Feedback\".",
          },
          {
            n: "04",
            title: "Wie du den Google-Bewertungslink aufbereitest",
            body: `Der häufigste Grund, warum selbst motivierte Kunden keine Bewertung hinterlassen: Sie finden die Bewertungsseite nicht. Wer erst Google öffnen, deinen Betrieb suchen und dann das Sternemenü finden muss, bricht ab – nicht weil er nicht will, sondern weil die Hürde zu hoch ist.

Die Lösung ist ein direkter Deep-Link, der den Nutzer unmittelbar zum Bewertungsformular schickt. So erstellst du ihn:

1. Öffne dein Google Business Profil unter business.google.com
2. Navigiere zu „Bewertungen erhalten" oder „Profil teilen"
3. Kopiere den generierten Kurzlink (sieht aus wie: g.page/dein-betrieb/review)

Alternativ: Suche nach deinem Betrieb bei Google, öffne das Profil und klicke auf „Bewertung schreiben". Die URL in der Adressleiste ist dein direkter Link – kürze ihn mit einem Link-Shortener auf etwas wie bit.ly/bewertung-betrieb.

Dieser Link gehört in jede Bewertungsanfrage, auf deine Website, in deine Instagram-Bio und auf Aufkleber am Ausgang. Je weniger Klicks zwischen dem Wunsch und der Bewertung, desto höher die Abschlussrate.`,
            tip: "QR-Codes auf Tischen, Quittungen oder Visitenkarten senken die Hürde auf nahezu null. Ein Scan genügt – und der Gast ist direkt auf der Bewertungsseite.",
          },
          {
            n: "05",
            title: "Umgang mit negativem Feedback",
            body: `Nicht jede Rückmeldung wird positiv sein – und das ist auch gut so. Denn wer negative Rückmeldungen früh abfängt, schützt sein öffentliches Rating und gewinnt wertvolle Informationen.

Das Prinzip heißt: privater Kanal zuerst. Bevor ein unzufriedener Gast seine 2-Sterne-Bewertung öffentlich postet, solltest du ihm die Möglichkeit geben, sich direkt bei dir zu melden.

So funktioniert es in der Praxis:

Schritt 1: Stelle der Bewertungsanfrage eine kurze Zwischenfrage voran – zum Beispiel: „War alles zu deiner Zufriedenheit?" oder ein einfaches Daumen-hoch/runter-System per Quick Reply.

Schritt 2: Wer mit „Ja" antwortet, bekommt direkt den Google-Bewertungslink.

Schritt 3: Wer mit „Nein" oder „Könnte besser sein" antwortet, erhält eine persönliche Antwort: „Oh, das tut mir leid! Was können wir beim nächsten Mal besser machen?" – und wird so in einen privaten Feedback-Kanal geleitet, nicht auf Google.

Dieser zweistufige Ansatz verringert öffentliche Negativ-Bewertungen messbar, ohne unehrlich zu sein. Du filterst keine echten Meinungen – du lenkst sie auf den richtigen Kanal.`,
            tip: "Antworte auf jede öffentliche Bewertung – auch auf negative. Google-Studien zeigen, dass Conversion Rates bei Profilen, die auf alle Bewertungen antworten, um über 5 % steigen. Und potenzielle Kunden lesen deine Antworten genauso aufmerksam wie die Bewertungen selbst.",
          },
          {
            n: "06",
            title: "Aus Bewertungen lernen und antworten",
            body: `Bewertungen sind keine Einbahnstraße. Sie sind Rohdaten, die dir zeigen, was in deinem Betrieb wirklich gut läuft – und was du verbessern könntest.

Richte dir ein einfaches wöchentliches Ritual ein: 10 Minuten, um neue Bewertungen zu lesen und zu beantworten. Jede Antwort erfüllt drei Funktionen gleichzeitig:

(1) Sie signalisiert dem Reviewer Wertschätzung – und erhöht die Wahrscheinlichkeit, dass er wiederkommt.
(2) Sie zeigt potenziellen Neukunden, dass du aktiv und professionell auf Feedback reagierst.
(3) Sie enthält Keywords, die Google für dein Ranking auswertet.

Konkrete Antwortformeln:

Positiv: „Danke, [Name]! Das freut uns sehr zu hören – [spezifisches Detail aus der Bewertung aufgreifen]. Wir freuen uns, dich bald wieder bei uns begrüßen zu dürfen!"

Negativ: „Vielen Dank für dein offenes Feedback, [Name]. Das ist uns wichtig, und wir nehmen es ernst. Bitte melde dich gern direkt bei uns – wir möchten das gerne in Ordnung bringen."

Langfristig gilt: Bewertungen, in denen Kunden bestimmte Begriffe wiederholt nennen (z.B. „freundlich", „frisches Essen", „tolle Atmosphäre"), sind wertvolle SEO-Signale. Was Kunden schreiben, sollte in deine eigene Kommunikation einfließen.`,
            tip: "Nutze häufig genannte Stärken aus deinen Bewertungen als Content für deine Instagram-Stories und Website. Social Proof entfaltet seine stärkste Wirkung, wenn er konsistent wiederholt wird.",
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
                  {step.body.split("\n\n").map((para, i) => {
                    const trimmed = para.trim();
                    // Render horizontal rules as styled separators
                    if (trimmed === "---") {
                      return (
                        <div key={i} className="my-2 h-px bg-[#edf1f8]" />
                      );
                    }
                    // Render indented lines (→) as styled list items
                    if (trimmed.startsWith("→")) {
                      return (
                        <p key={i} className="font-mono text-[13px] leading-relaxed text-[#3d4255]">
                          {trimmed}
                        </p>
                      );
                    }
                    return (
                      <p key={i} className="text-[16px] leading-relaxed text-[#2d3550]">
                        {trimmed}
                      </p>
                    );
                  })}
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
          Was ein systematischer Bewertungsprozess bringt
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Kein einzelner Schritt macht den Unterschied – es ist das Zusammenspiel. Hier siehst
          du, wie die einzelnen Hebel zusammenwirken:
        </p>

        <div className="mt-7 space-y-4">
          {[
            {
              cause: "Systematische Anfrage",
              effect: "Aus 28 % spontanen Bewertungen werden 70–83 % – weil du fragst statt wartest",
              delta: "3× mehr",
            },
            {
              cause: "Optimales Timing (2–4 h)",
              effect: "Antwortrate sinkt nach 24 h um mehr als die Hälfte – der richtige Moment entscheidet",
              delta: "+50 %",
            },
            {
              cause: "Personalisierte Nachrichten",
              effect: "Persönliche Anfragen erzielen 3–5× höhere Konversionsraten als generische Templates",
              delta: "3–5× CTR",
            },
            {
              cause: "Privates Feedback-Routing",
              effect: "Unzufriedene Gäste melden sich direkt statt öffentlich – dein Rating bleibt stabil",
              delta: "Schutzschicht",
            },
            {
              cause: "Öffentliche Antworten",
              effect: "Conversion Rates von Google-Profilen mit Antworten auf alle Bewertungen liegen 5 % höher",
              delta: "+5 % CTR",
            },
          ].map((row) => (
            <div
              key={row.cause}
              className="flex items-start gap-4 rounded-2xl border border-[#2a4ea7]/12 bg-white p-5 shadow-[0_2px_8px_rgba(28,53,122,0.04)]"
            >
              <div
                className="mt-0.5 flex-shrink-0 rounded-xl px-3 py-1 font-mono text-[12px] font-semibold text-[#6b3a1e]"
                style={{ backgroundColor: "rgba(107,58,30,0.07)" }}
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
          Fazit: Bewertungen sind kein Glück – sie sind ein System
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Der Unterschied zwischen einem Restaurant mit 12 und einem mit 340 Google-Bewertungen
          liegt selten an der Qualität des Essens. Er liegt daran, dass eines der beiden
          Häuser einen Prozess hat – und das andere nicht.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Die Mechanik ist klar: Frage persönlich, zur richtigen Zeit, mit dem direkten Link.
          Leite negatives Feedback auf den privaten Kanal. Antworte öffentlich auf jede
          Bewertung. Wiederhole das nach jedem Besuch, nach jedem Termin, nach jeder Session.
        </p>
        <p className="mt-4 text-[16px] leading-relaxed text-[#2d3550]">
          Kein einzelner dieser Schritte ist schwierig. Was schwierig ist: ihn konsequent
          und ohne manuelle Arbeit durchzuhalten. Automatisierte Post-Visit-Nachrichten –
          zum Beispiel über Instagram DM – übernehmen genau das. Der Prozess läuft, auch wenn
          der Abendservice gerade auf Hochtouren läuft.
        </p>

        {/* CTA */}
        <div className="mt-12 overflow-hidden rounded-2xl">
          <div
            className="relative px-8 py-12 text-center sm:px-12"
            style={{ backgroundColor: "#3b1a08" }}
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
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#d4a889]">
                Bereit für die Umsetzung?
              </p>
              <h3
                className="mt-4 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-home-display)" }}
              >
                Bewertungsanfragen automatisch nach jedem Besuch senden
              </h3>
              <p
                className="mx-auto mt-3 max-w-md font-mono text-[14px] leading-relaxed"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                Wesponde verschickt deine personalisierten Bewertungsanfragen automatisch –
                zum richtigen Zeitpunkt, in deinem Ton, mit direktem Google-Link. Für
                Restaurants, Salons und Studios.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#3b1a08] transition-all hover:bg-[#fef3ec]"
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
