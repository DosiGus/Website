import type { FlowMetadata, FlowTrigger } from "./flowTypes";

export type FlowTemplate = {
  id: string;
  slug: string;
  name: string;
  vertical: string;
  description: string;
  nodes: any[];
  edges: any[];
  triggers: FlowTrigger[];
  metadata?: FlowMetadata;
};

export const fallbackTemplates: FlowTemplate[] = [
  {
    id: "template-restaurant",
    slug: "restaurant-reservation",
    name: "Restaurant — Reservierung",
    vertical: "Restaurant & Bar",
    description: "Vollständiger Reservierungsflow mit Datum, Uhrzeit, Gästeanzahl, Kontaktdaten und Bestätigung",
    nodes: [
      // === HAUPTMENÜ ===
      {
        id: "welcome",
        type: "input",
        position: { x: 0, y: 200 },
        data: {
          label: "Willkommen",
          text: "Herzlich willkommen! 🍽️ Wie kann ich dir heute helfen?",
          variant: "message",
          quickReplies: [
            { id: "qr-reserve", label: "Tisch reservieren", payload: "reserve", targetNodeId: "ask-date" },
            { id: "qr-hours", label: "Öffnungszeiten", payload: "hours", targetNodeId: "info-hours" },
            { id: "qr-menu", label: "Speisekarte", payload: "menu", targetNodeId: "info-menu" },
          ],
        },
      },

      // === INFO PFADE ===
      {
        id: "info-hours",
        position: { x: 0, y: 400 },
        data: {
          label: "Öffnungszeiten",
          text: "Unsere Öffnungszeiten:\n\n📅 Mo-Fr: 11:30 - 14:30 & 17:30 - 22:00\n📅 Sa: 17:30 - 23:00\n📅 So: 11:30 - 21:00\n\nKüche schließt 30 Min. vor Ladenschluss.",
          variant: "message",
          quickReplies: [
            { id: "qr-hours-reserve", label: "Jetzt reservieren", payload: "reserve", targetNodeId: "ask-date" },
            { id: "qr-hours-back", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },
      {
        id: "info-menu",
        position: { x: 0, y: 550 },
        data: {
          label: "Speisekarte",
          text: "Unsere aktuelle Speisekarte findest du hier:\n\n🔗 [Link zur Speisekarte einfügen]\n\nWir bieten auch vegetarische und vegane Optionen an. Bei Allergien oder Unverträglichkeiten sprich uns gerne an!",
          variant: "message",
          quickReplies: [
            { id: "qr-menu-reserve", label: "Tisch reservieren", payload: "reserve", targetNodeId: "ask-date" },
            { id: "qr-menu-back", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },

      // === RESERVIERUNG: DATUM ===
      {
        id: "ask-date",
        position: { x: 300, y: 100 },
        data: {
          label: "Datum erfragen",
          text: "Wunderbar! 📅 Für welches Datum möchtest du reservieren?",
          variant: "message",
          quickReplies: [
            { id: "qr-date-today", label: "Heute", payload: "heute", targetNodeId: "ask-time" },
            { id: "qr-date-tomorrow", label: "Morgen", payload: "morgen", targetNodeId: "ask-time" },
            { id: "qr-date-other", label: "Anderes Datum", payload: "anderes", targetNodeId: "ask-date-custom" },
          ],
        },
      },
      {
        id: "ask-date-custom",
        position: { x: 300, y: 280 },
        data: {
          label: "Datum eingeben",
          text: "Kein Problem! Nenne mir bitte das gewünschte Datum.\n\nBeispiele: \"15. Februar\", \"Samstag\", \"nächsten Freitag\"",
          variant: "message",
          quickReplies: [],
        },
      },

      // === RESERVIERUNG: UHRZEIT ===
      {
        id: "ask-time",
        position: { x: 600, y: 100 },
        data: {
          label: "Uhrzeit erfragen",
          text: "Super! ⏰ Um wie viel Uhr möchtest du kommen?\n\nUnsere Küche ist von 11:30-14:30 und 17:30-22:00 Uhr geöffnet.",
          variant: "message",
          quickReplies: [
            { id: "qr-time-12", label: "12:00", payload: "12:00", targetNodeId: "ask-guests" },
            { id: "qr-time-19", label: "19:00", payload: "19:00", targetNodeId: "ask-guests" },
            { id: "qr-time-20", label: "20:00", payload: "20:00", targetNodeId: "ask-guests" },
            { id: "qr-time-other", label: "Andere Uhrzeit", payload: "andere", targetNodeId: "ask-time-custom" },
          ],
        },
      },
      {
        id: "ask-time-custom",
        position: { x: 600, y: 280 },
        data: {
          label: "Uhrzeit eingeben",
          text: "Kein Problem! Bitte nenne mir deine gewünschte Uhrzeit.",
          variant: "message",
          quickReplies: [],
        },
      },

      // === RESERVIERUNG: GÄSTEANZAHL ===
      {
        id: "ask-guests",
        position: { x: 900, y: 100 },
        data: {
          label: "Personenanzahl",
          text: "Perfekt! 👥 Für wie viele Personen soll ich reservieren?",
          variant: "message",
          quickReplies: [
            { id: "qr-guests-2", label: "2 Personen", payload: "2", targetNodeId: "ask-name" },
            { id: "qr-guests-3", label: "3 Personen", payload: "3", targetNodeId: "ask-name" },
            { id: "qr-guests-4", label: "4 Personen", payload: "4", targetNodeId: "ask-name" },
            { id: "qr-guests-more", label: "Mehr als 4", payload: "mehr", targetNodeId: "ask-guests-large" },
          ],
        },
      },
      {
        id: "ask-guests-large",
        position: { x: 900, y: 280 },
        data: {
          label: "Größere Gruppe",
          text: "Schön, dass ihr mit einer größeren Gruppe kommt! 🎉 Bitte nenne mir die genaue Personenanzahl.\n\nFür Gruppen ab 8 Personen empfehlen wir eine telefonische Reservierung unter [Telefonnummer].",
          variant: "message",
          quickReplies: [
            { id: "qr-large-5", label: "5 Personen", payload: "5", targetNodeId: "ask-name" },
            { id: "qr-large-6", label: "6 Personen", payload: "6", targetNodeId: "ask-name" },
            { id: "qr-large-7", label: "7 Personen", payload: "7", targetNodeId: "ask-name" },
          ],
        },
      },

      // === RESERVIERUNG: NAME ===
      {
        id: "ask-name",
        position: { x: 1200, y: 100 },
        data: {
          label: "Name erfragen",
          text: "Fast geschafft! 📝 Auf welchen Namen darf ich den Tisch reservieren?",
          variant: "message",
          quickReplies: [],
        },
      },

      // === RESERVIERUNG: TELEFON ===
      {
        id: "ask-phone",
        position: { x: 1200, y: 280 },
        data: {
          label: "Telefon erfragen",
          text: "Danke! 📱 Unter welcher Telefonnummer können wir dich erreichen, falls sich etwas ändert?",
          variant: "message",
          quickReplies: [],
        },
      },

      // === RESERVIERUNG: SONDERWÜNSCHE ===
      {
        id: "ask-special",
        position: { x: 1200, y: 460 },
        data: {
          label: "Sonderwünsche",
          text: "Hast du besondere Wünsche? 🔔\n\nZ.B. Hochstuhl, Allergien, besonderer Anlass, Tisch am Fenster...",
          variant: "message",
          quickReplies: [
            { id: "qr-special-no", label: "Keine Wünsche", payload: "keine", targetNodeId: "summary" },
            { id: "qr-special-allergy", label: "Allergien/Diät", payload: "allergie", targetNodeId: "special-allergy" },
            { id: "qr-special-occasion", label: "Besonderer Anlass", payload: "anlass", targetNodeId: "special-occasion" },
          ],
        },
      },
      {
        id: "special-allergy",
        position: { x: 1500, y: 380 },
        data: {
          label: "Allergien notieren",
          text: "Danke für den Hinweis! Bitte teile mir die Allergien oder Unverträglichkeiten mit, damit wir uns darauf einstellen können.",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "special-occasion",
        position: { x: 1500, y: 530 },
        data: {
          label: "Anlass notieren",
          text: "Wie schön! 🎂 Um welchen Anlass handelt es sich? (Geburtstag, Jubiläum, Geschäftsessen...)\n\nWir sorgen gerne für eine kleine Überraschung!",
          variant: "message",
          quickReplies: [],
        },
      },

      // === ZUSAMMENFASSUNG ===
      {
        id: "summary",
        position: { x: 1500, y: 100 },
        data: {
          label: "Zusammenfassung",
          text: "Perfekt! ✅ Hier sind deine Angaben:\n\n📅 Datum: {{date}}\n⏰ Uhrzeit: {{time}}\n👥 Personen: {{guestCount}}\n👤 Name: {{name}}\n📱 Telefon: {{phone}}\n\nSoll ich die Reservierung so abschicken?",
          variant: "message",
          quickReplies: [
            { id: "qr-confirm", label: "Ja, bestätigen!", payload: "confirm", targetNodeId: "confirmed" },
            { id: "qr-edit", label: "Etwas ändern", payload: "edit", targetNodeId: "edit-options" },
            { id: "qr-cancel", label: "Abbrechen", payload: "cancel", targetNodeId: "cancelled" },
          ],
        },
      },

      // === BEARBEITUNG ===
      {
        id: "edit-options",
        position: { x: 1800, y: 200 },
        data: {
          label: "Was ändern?",
          text: "Was möchtest du ändern?",
          variant: "message",
          quickReplies: [
            { id: "qr-edit-date", label: "Datum", payload: "date", targetNodeId: "ask-date" },
            { id: "qr-edit-time", label: "Uhrzeit", payload: "time", targetNodeId: "ask-time" },
            { id: "qr-edit-guests", label: "Personenanzahl", payload: "guests", targetNodeId: "ask-guests" },
            { id: "qr-edit-name", label: "Name", payload: "name", targetNodeId: "ask-name" },
          ],
        },
      },

      // === BESTÄTIGUNG ===
      {
        id: "confirmed",
        position: { x: 1800, y: 0 },
        data: {
          label: "Reservierung bestätigt",
          text: "Vielen Dank! 🎉 Deine Reservierung ist bestätigt.\n\nWir freuen uns auf deinen Besuch! Falls du Fragen hast oder die Reservierung ändern möchtest, schreib uns einfach.\n\nBis bald! 👋",
          variant: "message",
          quickReplies: [
            { id: "qr-done-menu", label: "Speisekarte ansehen", payload: "menu", targetNodeId: "info-menu" },
            { id: "qr-done-hours", label: "Öffnungszeiten", payload: "hours", targetNodeId: "info-hours" },
          ],
        },
      },

      // === ABBRUCH ===
      {
        id: "cancelled",
        position: { x: 1800, y: 350 },
        data: {
          label: "Abgebrochen",
          text: "Kein Problem! Die Reservierung wurde abgebrochen. 👋\n\nFalls du es dir anders überlegst, starte einfach eine neue Anfrage. Wir freuen uns auf dich!",
          variant: "message",
          quickReplies: [
            { id: "qr-restart", label: "Neue Reservierung", payload: "reserve", targetNodeId: "ask-date" },
            { id: "qr-back-menu", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },
    ],
    edges: [
      // Welcome -> Info
      { id: "e-hours", source: "welcome", target: "info-hours", data: { condition: "Öffnungszeiten", tone: "neutral" } },
      { id: "e-menu", source: "welcome", target: "info-menu", data: { condition: "Speisekarte", tone: "neutral" } },
      // Welcome -> Reservation
      { id: "e-reserve", source: "welcome", target: "ask-date", data: { condition: "Tisch reservieren", tone: "positive" } },
      // Info -> Actions
      { id: "e-hours-reserve", source: "info-hours", target: "ask-date", data: { condition: "Jetzt reservieren", tone: "positive" } },
      { id: "e-hours-back", source: "info-hours", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      { id: "e-menu-reserve", source: "info-menu", target: "ask-date", data: { condition: "Tisch reservieren", tone: "positive" } },
      { id: "e-menu-back", source: "info-menu", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      // Date flow
      { id: "e-date-today", source: "ask-date", target: "ask-time", data: { condition: "Heute", tone: "positive" } },
      { id: "e-date-tomorrow", source: "ask-date", target: "ask-time", data: { condition: "Morgen", tone: "positive" } },
      { id: "e-date-other", source: "ask-date", target: "ask-date-custom", data: { condition: "Anderes Datum", tone: "neutral" } },
      { id: "e-date-custom-time", source: "ask-date-custom", target: "ask-time", data: { condition: "Datum eingegeben", tone: "positive" } },
      // Time -> Guests
      { id: "e-time-guests", source: "ask-time", target: "ask-guests", data: { condition: "Uhrzeit gewählt", tone: "positive" } },
      { id: "e-time-custom", source: "ask-time", target: "ask-time-custom", data: { condition: "Andere Uhrzeit", tone: "neutral" } },
      { id: "e-time-custom-guests", source: "ask-time-custom", target: "ask-guests", data: { condition: "Uhrzeit eingegeben", tone: "positive" } },
      // Guests flow
      { id: "e-guests-name", source: "ask-guests", target: "ask-name", data: { condition: "Anzahl gewählt", tone: "positive" } },
      { id: "e-guests-large", source: "ask-guests", target: "ask-guests-large", data: { condition: "Mehr als 4", tone: "neutral" } },
      { id: "e-large-name", source: "ask-guests-large", target: "ask-name", data: { condition: "Anzahl gewählt", tone: "positive" } },
      // Name -> Phone
      { id: "e-name-phone", source: "ask-name", target: "ask-phone", data: { condition: "Name eingegeben", tone: "positive" } },
      // Phone -> Special
      { id: "e-phone-special", source: "ask-phone", target: "ask-special", data: { condition: "Telefon eingegeben", tone: "positive" } },
      // Special wishes
      { id: "e-special-summary", source: "ask-special", target: "summary", data: { condition: "Keine Wünsche", tone: "neutral" } },
      { id: "e-special-allergy", source: "ask-special", target: "special-allergy", data: { condition: "Allergien", tone: "neutral" } },
      { id: "e-special-occasion", source: "ask-special", target: "special-occasion", data: { condition: "Anlass", tone: "neutral" } },
      { id: "e-allergy-summary", source: "special-allergy", target: "summary", data: { condition: "Notiert", tone: "positive" } },
      { id: "e-occasion-summary", source: "special-occasion", target: "summary", data: { condition: "Notiert", tone: "positive" } },
      // Summary actions
      { id: "e-summary-confirm", source: "summary", target: "confirmed", data: { condition: "Bestätigen", tone: "positive" } },
      { id: "e-summary-edit", source: "summary", target: "edit-options", data: { condition: "Ändern", tone: "neutral" } },
      { id: "e-summary-cancel", source: "summary", target: "cancelled", data: { condition: "Abbrechen", tone: "negative" } },
      // Edit options
      { id: "e-edit-date", source: "edit-options", target: "ask-date", data: { condition: "Datum ändern", tone: "neutral" } },
      { id: "e-edit-time", source: "edit-options", target: "ask-time", data: { condition: "Uhrzeit ändern", tone: "neutral" } },
      { id: "e-edit-guests", source: "edit-options", target: "ask-guests", data: { condition: "Personen ändern", tone: "neutral" } },
      { id: "e-edit-name", source: "edit-options", target: "ask-name", data: { condition: "Name ändern", tone: "neutral" } },
      // Confirmed actions
      { id: "e-confirmed-menu", source: "confirmed", target: "info-menu", data: { condition: "Speisekarte", tone: "neutral" } },
      { id: "e-confirmed-hours", source: "confirmed", target: "info-hours", data: { condition: "Öffnungszeiten", tone: "neutral" } },
      // Cancelled actions
      { id: "e-cancelled-restart", source: "cancelled", target: "ask-date", data: { condition: "Neue Reservierung", tone: "positive" } },
      { id: "e-cancelled-menu", source: "cancelled", target: "welcome", data: { condition: "Zurück zum Menü", tone: "neutral" } },
    ],
    triggers: [
      {
        id: "trigger-restaurant-reserve",
        type: "KEYWORD",
        config: {
          keywords: ["reservieren", "reservierung", "tisch", "buchen"],
          matchType: "CONTAINS",
        },
        startNodeId: "welcome",
      },
      {
        id: "trigger-restaurant-hello",
        type: "KEYWORD",
        config: {
          keywords: ["hallo", "hi", "hey", "guten tag", "moin"],
          matchType: "CONTAINS",
        },
        startNodeId: "welcome",
      },
      {
        id: "trigger-restaurant-menu",
        type: "KEYWORD",
        config: {
          keywords: ["speisekarte", "menu", "menü", "essen", "karte"],
          matchType: "CONTAINS",
        },
        startNodeId: "info-menu",
      },
      {
        id: "trigger-restaurant-hours",
        type: "KEYWORD",
        config: {
          keywords: ["öffnungszeiten", "geöffnet", "offen", "wann"],
          matchType: "CONTAINS",
        },
        startNodeId: "info-hours",
      },
    ],
    metadata: {
      version: "2.0",
      output_config: {
        type: "reservation",
        requiredFields: ["name", "date", "time", "guestCount"],
      },
    },
  },
  {
    id: "template-salon",
    slug: "salon-appointment",
    name: "Salon — Terminbuchung",
    vertical: "Friseur & Beauty",
    description: "Vollständiger Buchungsflow mit Behandlungsauswahl, Stylist-Präferenz, Terminvorschlägen und Kontaktdaten",
    nodes: [
      // === WILLKOMMEN ===
      {
        id: "welcome",
        type: "input",
        position: { x: 0, y: 200 },
        data: {
          label: "Willkommen",
          text: "Herzlich willkommen! 💇‍♀️ Wie kann ich dir heute helfen?",
          variant: "message",
          quickReplies: [
            { id: "qr-book", label: "Termin buchen", payload: "book", targetNodeId: "choose-service" },
            { id: "qr-prices", label: "Preisliste", payload: "prices", targetNodeId: "info-prices" },
            { id: "qr-hours", label: "Öffnungszeiten", payload: "hours", targetNodeId: "info-hours" },
          ],
        },
      },

      // === INFO PFADE ===
      {
        id: "info-prices",
        position: { x: 0, y: 400 },
        data: {
          label: "Preisliste",
          text: "Hier sind unsere Preise:\n\n💇‍♀️ Damenhaarschnitt: ab 45€\n💇 Herrenhaarschnitt: ab 25€\n🎨 Färben/Strähnen: ab 60€\n✨ Balayage: ab 120€\n💆‍♀️ Haarpflege: ab 20€\n\nPreise variieren je nach Länge und Aufwand.",
          variant: "message",
          quickReplies: [
            { id: "qr-prices-book", label: "Jetzt buchen", payload: "book", targetNodeId: "choose-service" },
            { id: "qr-prices-back", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },
      {
        id: "info-hours",
        position: { x: 0, y: 550 },
        data: {
          label: "Öffnungszeiten",
          text: "Unsere Öffnungszeiten:\n\n📅 Di-Fr: 9:00 - 18:30\n📅 Sa: 9:00 - 15:00\n📅 Mo & So: Geschlossen\n\nTermine nach 18 Uhr auf Anfrage möglich!",
          variant: "message",
          quickReplies: [
            { id: "qr-hours-book", label: "Termin buchen", payload: "book", targetNodeId: "choose-service" },
            { id: "qr-hours-back", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },

      // === BEHANDLUNG WÄHLEN ===
      {
        id: "choose-service",
        position: { x: 300, y: 100 },
        data: {
          label: "Behandlung wählen",
          text: "Super! 💫 Welche Behandlung möchtest du buchen?",
          variant: "message",
          quickReplies: [
            { id: "qr-cut", label: "Haarschnitt", payload: "schnitt", targetNodeId: "service-cut" },
            { id: "qr-color", label: "Färben/Strähnen", payload: "farbe", targetNodeId: "service-color" },
            { id: "qr-styling", label: "Styling/Frisur", payload: "styling", targetNodeId: "service-styling" },
            { id: "qr-other", label: "Anderes", payload: "andere", targetNodeId: "service-other" },
          ],
        },
      },

      // === BEHANDLUNGSDETAILS ===
      {
        id: "service-cut",
        position: { x: 300, y: 280 },
        data: {
          label: "Haarschnitt-Details",
          text: "Haarschnitt! ✂️ Was genau soll es sein?",
          variant: "message",
          quickReplies: [
            { id: "qr-cut-women", label: "Damen", payload: "damen", targetNodeId: "choose-stylist" },
            { id: "qr-cut-men", label: "Herren", payload: "herren", targetNodeId: "choose-stylist" },
            { id: "qr-cut-kids", label: "Kinder", payload: "kinder", targetNodeId: "choose-stylist" },
          ],
        },
      },
      {
        id: "service-color",
        position: { x: 300, y: 430 },
        data: {
          label: "Farb-Details",
          text: "Färben oder Strähnen! 🎨 Was schwebt dir vor?",
          variant: "message",
          quickReplies: [
            { id: "qr-color-full", label: "Komplett färben", payload: "komplett", targetNodeId: "choose-stylist" },
            { id: "qr-color-highlights", label: "Strähnen/Highlights", payload: "straehnen", targetNodeId: "choose-stylist" },
            { id: "qr-color-balayage", label: "Balayage", payload: "balayage", targetNodeId: "choose-stylist" },
          ],
        },
      },
      {
        id: "service-styling",
        position: { x: 300, y: 580 },
        data: {
          label: "Styling-Details",
          text: "Styling! ✨ Für welchen Anlass?",
          variant: "message",
          quickReplies: [
            { id: "qr-style-event", label: "Hochzeit/Event", payload: "event", targetNodeId: "choose-stylist" },
            { id: "qr-style-casual", label: "Föhnen/Glätten", payload: "casual", targetNodeId: "choose-stylist" },
          ],
        },
      },
      {
        id: "service-other",
        position: { x: 300, y: 720 },
        data: {
          label: "Andere Behandlung",
          text: "Kein Problem! Bitte beschreibe kurz, was du dir wünschst.\n\n(z.B. Haarpflege, Extensions, Bart-Trimmen...)",
          variant: "message",
          quickReplies: [],
        },
      },

      // === STYLIST WÄHLEN ===
      {
        id: "choose-stylist",
        position: { x: 600, y: 200 },
        data: {
          label: "Stylist wählen",
          text: "Hast du eine Lieblings-Stylistin oder -Stylisten? 💇‍♀️",
          variant: "message",
          quickReplies: [
            { id: "qr-stylist-anna", label: "Anna", payload: "anna", targetNodeId: "choose-date" },
            { id: "qr-stylist-max", label: "Max", payload: "max", targetNodeId: "choose-date" },
            { id: "qr-stylist-lisa", label: "Lisa", payload: "lisa", targetNodeId: "choose-date" },
            { id: "qr-stylist-any", label: "Egal", payload: "egal", targetNodeId: "choose-date" },
          ],
        },
      },

      // === DATUM WÄHLEN ===
      {
        id: "choose-date",
        position: { x: 900, y: 100 },
        data: {
          label: "Datum wählen",
          text: "Perfekt! 📅 Wann passt es dir am besten?",
          variant: "message",
          quickReplies: [
            { id: "qr-date-today", label: "Heute", payload: "heute", targetNodeId: "choose-time" },
            { id: "qr-date-tomorrow", label: "Morgen", payload: "morgen", targetNodeId: "choose-time" },
            { id: "qr-date-week", label: "Diese Woche", payload: "woche", targetNodeId: "choose-time" },
            { id: "qr-date-other", label: "Anderer Tag", payload: "anderer", targetNodeId: "choose-date-custom" },
          ],
        },
      },
      {
        id: "choose-date-custom",
        position: { x: 900, y: 280 },
        data: {
          label: "Datum eingeben",
          text: "Kein Problem! Schreib mir einfach deinen Wunschtermin (z.B. \"nächsten Samstag\" oder \"15. März\").",
          variant: "message",
          quickReplies: [
            { id: "qr-date-back", label: "Zurück", payload: "back", targetNodeId: "choose-date" },
          ],
        },
      },

      // === UHRZEIT WÄHLEN ===
      {
        id: "choose-time",
        position: { x: 1200, y: 100 },
        data: {
          label: "Uhrzeit wählen",
          text: "Super! ⏰ Welche Uhrzeit passt dir?\n\nVerfügbar wären:",
          variant: "message",
          quickReplies: [
            { id: "qr-time-10", label: "10:00", payload: "10:00", targetNodeId: "ask-name" },
            { id: "qr-time-13", label: "13:00", payload: "13:00", targetNodeId: "ask-name" },
            { id: "qr-time-15", label: "15:00", payload: "15:00", targetNodeId: "ask-name" },
            { id: "qr-time-17", label: "17:00", payload: "17:00", targetNodeId: "ask-name" },
          ],
        },
      },

      // === KONTAKTDATEN ===
      {
        id: "ask-name",
        position: { x: 1500, y: 100 },
        data: {
          label: "Name erfragen",
          text: "Fast geschafft! 📝 Auf welchen Namen darf ich den Termin buchen?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-phone",
        position: { x: 1500, y: 280 },
        data: {
          label: "Telefon erfragen",
          text: "Danke! 📱 Unter welcher Nummer können wir dich erreichen, falls sich etwas ändert?",
          variant: "message",
          quickReplies: [],
        },
      },

      // === SONDERWÜNSCHE ===
      {
        id: "ask-notes",
        position: { x: 1500, y: 460 },
        data: {
          label: "Sonderwünsche",
          text: "Gibt es noch etwas, das wir wissen sollten? 💬\n\n(z.B. Allergien, Inspirationsbilder, besondere Wünsche...)",
          variant: "message",
          quickReplies: [
            { id: "qr-notes-no", label: "Nein, alles gut", payload: "keine", targetNodeId: "summary" },
            { id: "qr-notes-yes", label: "Ja, ich schreibe...", payload: "ja", targetNodeId: "notes-input" },
          ],
        },
      },
      {
        id: "notes-input",
        position: { x: 1500, y: 640 },
        data: {
          label: "Notiz eingeben",
          text: "Bitte schreib mir deine Anmerkungen. Ich notiere alles für deine Stylistin!",
          variant: "message",
          quickReplies: [],
        },
      },

      // === ZUSAMMENFASSUNG ===
      {
        id: "summary",
        position: { x: 1800, y: 200 },
        data: {
          label: "Zusammenfassung",
          text: "Perfekt! Hier ist deine Buchung:\n\n✂️ Behandlung: [wird eingetragen]\n💇‍♀️ Stylist: [wird eingetragen]\n📅 Datum: [wird eingetragen]\n⏰ Uhrzeit: [wird eingetragen]\n👤 Name: [wird eingetragen]\n📱 Telefon: [wird eingetragen]\n\nIst alles korrekt?",
          variant: "message",
          quickReplies: [
            { id: "qr-confirm", label: "Ja, buchen!", payload: "confirm", targetNodeId: "confirmed" },
            { id: "qr-edit", label: "Ändern", payload: "edit", targetNodeId: "edit-options" },
            { id: "qr-cancel", label: "Abbrechen", payload: "cancel", targetNodeId: "cancelled" },
          ],
        },
      },

      // === BEARBEITUNG ===
      {
        id: "edit-options",
        position: { x: 2100, y: 300 },
        data: {
          label: "Was ändern?",
          text: "Was möchtest du ändern?",
          variant: "message",
          quickReplies: [
            { id: "qr-edit-service", label: "Behandlung", payload: "service", targetNodeId: "choose-service" },
            { id: "qr-edit-stylist", label: "Stylist", payload: "stylist", targetNodeId: "choose-stylist" },
            { id: "qr-edit-date", label: "Datum/Uhrzeit", payload: "date", targetNodeId: "choose-date" },
            { id: "qr-edit-name", label: "Kontaktdaten", payload: "contact", targetNodeId: "ask-name" },
          ],
        },
      },

      // === BESTÄTIGUNG ===
      {
        id: "confirmed",
        position: { x: 2100, y: 100 },
        data: {
          label: "Termin bestätigt",
          text: "Dein Termin ist gebucht! 🎉\n\nWir freuen uns auf dich! Du erhältst eine Bestätigung per SMS.\n\nBitte komm ca. 5 Minuten vorher. Bei Verhinderung sag bitte 24h vorher ab.\n\nBis bald! 💇‍♀️",
          variant: "message",
          quickReplies: [
            { id: "qr-done-prices", label: "Preisliste", payload: "prices", targetNodeId: "info-prices" },
            { id: "qr-done-hours", label: "Öffnungszeiten", payload: "hours", targetNodeId: "info-hours" },
          ],
        },
      },

      // === ABBRUCH ===
      {
        id: "cancelled",
        position: { x: 2100, y: 450 },
        data: {
          label: "Abgebrochen",
          text: "Kein Problem, die Buchung wurde abgebrochen. 👋\n\nFalls du es dir anders überlegst, starte einfach eine neue Anfrage!\n\nWir freuen uns auf dich!",
          variant: "message",
          quickReplies: [
            { id: "qr-restart", label: "Neuen Termin buchen", payload: "book", targetNodeId: "choose-service" },
            { id: "qr-back-menu", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },
    ],
    edges: [
      // Welcome -> Info
      { id: "e-prices", source: "welcome", target: "info-prices", data: { condition: "Preisliste", tone: "neutral" } },
      { id: "e-hours", source: "welcome", target: "info-hours", data: { condition: "Öffnungszeiten", tone: "neutral" } },
      // Welcome -> Booking
      { id: "e-book", source: "welcome", target: "choose-service", data: { condition: "Termin buchen", tone: "positive" } },
      // Info -> Actions
      { id: "e-prices-book", source: "info-prices", target: "choose-service", data: { condition: "Jetzt buchen", tone: "positive" } },
      { id: "e-prices-back", source: "info-prices", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      { id: "e-hours-book", source: "info-hours", target: "choose-service", data: { condition: "Termin buchen", tone: "positive" } },
      { id: "e-hours-back", source: "info-hours", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      // Service selection
      { id: "e-service-cut", source: "choose-service", target: "service-cut", data: { condition: "Haarschnitt", tone: "positive" } },
      { id: "e-service-color", source: "choose-service", target: "service-color", data: { condition: "Färben", tone: "positive" } },
      { id: "e-service-styling", source: "choose-service", target: "service-styling", data: { condition: "Styling", tone: "positive" } },
      { id: "e-service-other", source: "choose-service", target: "service-other", data: { condition: "Anderes", tone: "neutral" } },
      // Service details -> Stylist
      { id: "e-cut-stylist", source: "service-cut", target: "choose-stylist", data: { condition: "Auswahl getroffen", tone: "positive" } },
      { id: "e-color-stylist", source: "service-color", target: "choose-stylist", data: { condition: "Auswahl getroffen", tone: "positive" } },
      { id: "e-styling-stylist", source: "service-styling", target: "choose-stylist", data: { condition: "Auswahl getroffen", tone: "positive" } },
      { id: "e-other-stylist", source: "service-other", target: "choose-stylist", data: { condition: "Beschreibung erhalten", tone: "positive" } },
      // Stylist -> Date
      { id: "e-stylist-date", source: "choose-stylist", target: "choose-date", data: { condition: "Stylist gewählt", tone: "positive" } },
      // Date flow
      { id: "e-date-time", source: "choose-date", target: "choose-time", data: { condition: "Datum gewählt", tone: "positive" } },
      { id: "e-date-custom", source: "choose-date", target: "choose-date-custom", data: { condition: "Anderer Tag", tone: "neutral" } },
      { id: "e-date-custom-time", source: "choose-date-custom", target: "choose-time", data: { condition: "Datum eingegeben", tone: "positive" } },
      // Time -> Contact
      { id: "e-time-name", source: "choose-time", target: "ask-name", data: { condition: "Uhrzeit gewählt", tone: "positive" } },
      { id: "e-name-phone", source: "ask-name", target: "ask-phone", data: { condition: "Name eingegeben", tone: "positive" } },
      { id: "e-phone-notes", source: "ask-phone", target: "ask-notes", data: { condition: "Telefon eingegeben", tone: "positive" } },
      // Notes flow
      { id: "e-notes-summary", source: "ask-notes", target: "summary", data: { condition: "Keine Wünsche", tone: "neutral" } },
      { id: "e-notes-input", source: "ask-notes", target: "notes-input", data: { condition: "Ja, ich schreibe", tone: "neutral" } },
      { id: "e-input-summary", source: "notes-input", target: "summary", data: { condition: "Notiz eingegeben", tone: "positive" } },
      // Summary actions
      { id: "e-summary-confirm", source: "summary", target: "confirmed", data: { condition: "Buchen", tone: "positive" } },
      { id: "e-summary-edit", source: "summary", target: "edit-options", data: { condition: "Ändern", tone: "neutral" } },
      { id: "e-summary-cancel", source: "summary", target: "cancelled", data: { condition: "Abbrechen", tone: "negative" } },
      // Edit options
      { id: "e-edit-service", source: "edit-options", target: "choose-service", data: { condition: "Behandlung", tone: "neutral" } },
      { id: "e-edit-stylist", source: "edit-options", target: "choose-stylist", data: { condition: "Stylist", tone: "neutral" } },
      { id: "e-edit-date", source: "edit-options", target: "choose-date", data: { condition: "Datum", tone: "neutral" } },
      { id: "e-edit-contact", source: "edit-options", target: "ask-name", data: { condition: "Kontaktdaten", tone: "neutral" } },
      // Confirmed actions
      { id: "e-confirmed-prices", source: "confirmed", target: "info-prices", data: { condition: "Preisliste", tone: "neutral" } },
      { id: "e-confirmed-hours", source: "confirmed", target: "info-hours", data: { condition: "Öffnungszeiten", tone: "neutral" } },
      // Cancelled actions
      { id: "e-cancelled-restart", source: "cancelled", target: "choose-service", data: { condition: "Neuer Termin", tone: "positive" } },
      { id: "e-cancelled-menu", source: "cancelled", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
    ],
    triggers: [
      {
        id: "trigger-salon-book",
        type: "KEYWORD",
        config: {
          keywords: ["termin", "buchen", "reservieren", "appointment"],
          matchType: "CONTAINS",
        },
        startNodeId: "welcome",
      },
      {
        id: "trigger-salon-hello",
        type: "KEYWORD",
        config: {
          keywords: ["hallo", "hi", "hey", "guten tag", "moin"],
          matchType: "CONTAINS",
        },
        startNodeId: "welcome",
      },
      {
        id: "trigger-salon-haircut",
        type: "KEYWORD",
        config: {
          keywords: ["friseur", "haarschnitt", "schneiden", "haare"],
          matchType: "CONTAINS",
        },
        startNodeId: "choose-service",
      },
      {
        id: "trigger-salon-prices",
        type: "KEYWORD",
        config: {
          keywords: ["preis", "kosten", "preisliste", "was kostet"],
          matchType: "CONTAINS",
        },
        startNodeId: "info-prices",
      },
    ],
    metadata: {
      version: "2.0",
      output_config: {
        type: "reservation",
        requiredFields: ["name", "date", "time", "phone"],
        defaults: { guestCount: 1 },
      },
    },
  },
  {
    id: "template-medical",
    slug: "medical-intake",
    name: "Praxis — Anfrage & Intake",
    vertical: "Medizin & Praxis",
    description: "Vollständiger Patientenflow mit Anliegen, Dringlichkeit, Terminwahl, Versicherung und Kontaktdaten",
    nodes: [
      // === WILLKOMMEN ===
      {
        id: "welcome",
        type: "input",
        position: { x: 0, y: 200 },
        data: {
          label: "Willkommen",
          text: "Willkommen in unserer Praxis! 🏥 Wie können wir Ihnen helfen?",
          variant: "message",
          quickReplies: [
            { id: "qr-appointment", label: "Termin vereinbaren", payload: "termin", targetNodeId: "choose-reason" },
            { id: "qr-prescription", label: "Rezept anfordern", payload: "rezept", targetNodeId: "prescription-flow" },
            { id: "qr-hours", label: "Sprechzeiten", payload: "zeiten", targetNodeId: "info-hours" },
            { id: "qr-emergency", label: "Akuter Notfall", payload: "notfall", targetNodeId: "emergency-info" },
          ],
        },
      },

      // === INFO PFADE ===
      {
        id: "info-hours",
        position: { x: 0, y: 400 },
        data: {
          label: "Sprechzeiten",
          text: "Unsere Sprechzeiten:\n\n📅 Mo, Di, Do: 8:00 - 12:00 & 14:00 - 18:00\n📅 Mi, Fr: 8:00 - 12:00\n📅 Sa & So: Geschlossen\n\nOffene Sprechstunde: Mo-Fr 8:00-9:00 (ohne Termin)",
          variant: "message",
          quickReplies: [
            { id: "qr-hours-book", label: "Termin vereinbaren", payload: "termin", targetNodeId: "choose-reason" },
            { id: "qr-hours-back", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },
      {
        id: "emergency-info",
        position: { x: 0, y: 550 },
        data: {
          label: "Notfall-Info",
          text: "🚨 Bei akuten Notfällen:\n\n📞 Rettungsdienst: 112\n📞 Ärztlicher Bereitschaftsdienst: 116 117\n📞 Unsere Praxis (dringend): [Telefonnummer]\n\nBei lebensbedrohlichen Notfällen rufen Sie bitte sofort den Rettungsdienst!",
          variant: "message",
          quickReplies: [
            { id: "qr-emergency-urgent", label: "Dringender Termin", payload: "dringend", targetNodeId: "urgent-appointment" },
            { id: "qr-emergency-back", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },

      // === REZEPT PFAD ===
      {
        id: "prescription-flow",
        position: { x: 0, y: 720 },
        data: {
          label: "Rezept anfordern",
          text: "Rezeptanforderung 📋\n\nFür welches Medikament benötigen Sie ein Folgerezept?\n\nBitte nennen Sie den genauen Medikamentennamen und die Dosierung.",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "prescription-confirm",
        position: { x: 300, y: 720 },
        data: {
          label: "Rezept bestätigt",
          text: "Vielen Dank! ✅\n\nWir prüfen Ihre Anfrage und das Rezept liegt in der Regel am nächsten Werktag zur Abholung bereit.\n\nBitte bringen Sie Ihre Versichertenkarte mit.",
          variant: "message",
          quickReplies: [
            { id: "qr-rx-appointment", label: "Zusätzlich Termin", payload: "termin", targetNodeId: "choose-reason" },
            { id: "qr-rx-done", label: "Fertig, danke!", payload: "done", targetNodeId: "goodbye" },
          ],
        },
      },

      // === TERMINGRUND WÄHLEN ===
      {
        id: "choose-reason",
        position: { x: 300, y: 100 },
        data: {
          label: "Anliegen wählen",
          text: "Was ist der Grund für Ihren Besuch? 🩺",
          variant: "message",
          quickReplies: [
            { id: "qr-reason-checkup", label: "Vorsorge/Check-up", payload: "vorsorge", targetNodeId: "choose-urgency" },
            { id: "qr-reason-acute", label: "Akute Beschwerden", payload: "akut", targetNodeId: "describe-symptoms" },
            { id: "qr-reason-followup", label: "Kontrolltermin", payload: "kontrolle", targetNodeId: "choose-urgency" },
            { id: "qr-reason-other", label: "Sonstiges", payload: "sonstiges", targetNodeId: "describe-reason" },
          ],
        },
      },
      {
        id: "describe-symptoms",
        position: { x: 300, y: 280 },
        data: {
          label: "Beschwerden beschreiben",
          text: "Bitte beschreiben Sie kurz Ihre Beschwerden, damit wir den passenden Termin für Sie finden können. 📝",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "describe-reason",
        position: { x: 300, y: 430 },
        data: {
          label: "Anliegen beschreiben",
          text: "Bitte beschreiben Sie kurz Ihr Anliegen. 📝",
          variant: "message",
          quickReplies: [],
        },
      },

      // === DRINGENDER TERMIN ===
      {
        id: "urgent-appointment",
        position: { x: 300, y: 580 },
        data: {
          label: "Dringender Termin",
          text: "Für dringende Termine rufen Sie uns bitte direkt an:\n\n📞 [Telefonnummer]\n\nUnser Team kann Ihnen zeitnah einen Termin geben.\n\nOffene Sprechstunde: Mo-Fr 8:00-9:00 Uhr",
          variant: "message",
          quickReplies: [
            { id: "qr-urgent-normal", label: "Normaler Termin reicht", payload: "normal", targetNodeId: "choose-urgency" },
            { id: "qr-urgent-back", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },

      // === DRINGLICHKEIT ===
      {
        id: "choose-urgency",
        position: { x: 600, y: 100 },
        data: {
          label: "Dringlichkeit",
          text: "Wie zeitnah benötigen Sie einen Termin? ⏰",
          variant: "message",
          quickReplies: [
            { id: "qr-urgency-today", label: "Heute/Morgen", payload: "heute", targetNodeId: "urgent-appointment" },
            { id: "qr-urgency-week", label: "Diese Woche", payload: "woche", targetNodeId: "choose-date" },
            { id: "qr-urgency-flexible", label: "Flexibel", payload: "flexibel", targetNodeId: "choose-date" },
          ],
        },
      },

      // === DATUM WÄHLEN ===
      {
        id: "choose-date",
        position: { x: 900, y: 100 },
        data: {
          label: "Datum wählen",
          text: "Wann passt es Ihnen am besten? 📅",
          variant: "message",
          quickReplies: [
            { id: "qr-date-mon", label: "Montag", payload: "montag", targetNodeId: "choose-time" },
            { id: "qr-date-tue", label: "Dienstag", payload: "dienstag", targetNodeId: "choose-time" },
            { id: "qr-date-wed", label: "Mittwoch", payload: "mittwoch", targetNodeId: "choose-time" },
            { id: "qr-date-other", label: "Anderer Tag", payload: "anderer", targetNodeId: "choose-date-custom" },
          ],
        },
      },
      {
        id: "choose-date-custom",
        position: { x: 900, y: 280 },
        data: {
          label: "Datum eingeben",
          text: "Bitte nennen Sie Ihren Wunschtermin (z.B. \"nächsten Donnerstag\" oder \"15. März\").",
          variant: "message",
          quickReplies: [
            { id: "qr-date-back", label: "Zurück", payload: "back", targetNodeId: "choose-date" },
          ],
        },
      },

      // === UHRZEIT WÄHLEN ===
      {
        id: "choose-time",
        position: { x: 1200, y: 100 },
        data: {
          label: "Uhrzeit wählen",
          text: "Welche Uhrzeit bevorzugen Sie? ⏰",
          variant: "message",
          quickReplies: [
            { id: "qr-time-morning", label: "Vormittag (8-12)", payload: "vormittag", targetNodeId: "ask-insurance" },
            { id: "qr-time-afternoon", label: "Nachmittag (14-18)", payload: "nachmittag", targetNodeId: "ask-insurance" },
            { id: "qr-time-any", label: "Egal", payload: "egal", targetNodeId: "ask-insurance" },
          ],
        },
      },

      // === VERSICHERUNG ===
      {
        id: "ask-insurance",
        position: { x: 1500, y: 100 },
        data: {
          label: "Versicherung",
          text: "Wie sind Sie versichert? 💳",
          variant: "message",
          quickReplies: [
            { id: "qr-ins-public", label: "Gesetzlich", payload: "gkv", targetNodeId: "ask-patient-type" },
            { id: "qr-ins-private", label: "Privat", payload: "pkv", targetNodeId: "ask-patient-type" },
            { id: "qr-ins-self", label: "Selbstzahler", payload: "selbst", targetNodeId: "ask-patient-type" },
          ],
        },
      },

      // === PATIENTENART ===
      {
        id: "ask-patient-type",
        position: { x: 1500, y: 280 },
        data: {
          label: "Neu- oder Bestandspatient",
          text: "Waren Sie schon einmal bei uns in der Praxis? 🏥",
          variant: "message",
          quickReplies: [
            { id: "qr-patient-new", label: "Neupatient", payload: "neu", targetNodeId: "ask-name" },
            { id: "qr-patient-existing", label: "Bestandspatient", payload: "bestand", targetNodeId: "ask-name" },
          ],
        },
      },

      // === KONTAKTDATEN ===
      {
        id: "ask-name",
        position: { x: 1800, y: 100 },
        data: {
          label: "Name erfragen",
          text: "Fast geschafft! 📝 Wie ist Ihr vollständiger Name?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-birthdate",
        position: { x: 1800, y: 280 },
        data: {
          label: "Geburtsdatum",
          text: "Und Ihr Geburtsdatum? (TT.MM.JJJJ) 📅",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-phone",
        position: { x: 1800, y: 460 },
        data: {
          label: "Telefon erfragen",
          text: "Unter welcher Telefonnummer können wir Sie erreichen? 📱",
          variant: "message",
          quickReplies: [],
        },
      },

      // === ZUSAMMENFASSUNG ===
      {
        id: "summary",
        position: { x: 2100, y: 200 },
        data: {
          label: "Zusammenfassung",
          text: "Vielen Dank! Hier ist Ihre Terminanfrage:\n\n🩺 Anliegen: [wird eingetragen]\n📅 Wunschtermin: [wird eingetragen]\n⏰ Uhrzeit: [wird eingetragen]\n💳 Versicherung: [wird eingetragen]\n👤 Name: [wird eingetragen]\n🎂 Geburtsdatum: [wird eingetragen]\n📱 Telefon: [wird eingetragen]\n\nIst alles korrekt?",
          variant: "message",
          quickReplies: [
            { id: "qr-confirm", label: "Ja, absenden", payload: "confirm", targetNodeId: "confirmed" },
            { id: "qr-edit", label: "Ändern", payload: "edit", targetNodeId: "edit-options" },
            { id: "qr-cancel", label: "Abbrechen", payload: "cancel", targetNodeId: "cancelled" },
          ],
        },
      },

      // === BEARBEITUNG ===
      {
        id: "edit-options",
        position: { x: 2400, y: 300 },
        data: {
          label: "Was ändern?",
          text: "Was möchten Sie ändern?",
          variant: "message",
          quickReplies: [
            { id: "qr-edit-reason", label: "Anliegen", payload: "anliegen", targetNodeId: "choose-reason" },
            { id: "qr-edit-date", label: "Termin", payload: "termin", targetNodeId: "choose-date" },
            { id: "qr-edit-contact", label: "Kontaktdaten", payload: "kontakt", targetNodeId: "ask-name" },
          ],
        },
      },

      // === BESTÄTIGUNG ===
      {
        id: "confirmed",
        position: { x: 2400, y: 100 },
        data: {
          label: "Anfrage bestätigt",
          text: "Vielen Dank! ✅ Ihre Terminanfrage ist eingegangen.\n\nWir melden uns schnellstmöglich mit einer Terminbestätigung.\n\nBitte bringen Sie zum Termin mit:\n• Versichertenkarte\n• Überweisung (falls vorhanden)\n• Aktuelle Medikamentenliste\n\nBis bald! 👋",
          variant: "message",
          quickReplies: [
            { id: "qr-done-hours", label: "Sprechzeiten", payload: "zeiten", targetNodeId: "info-hours" },
            { id: "qr-done-prescription", label: "Rezept anfordern", payload: "rezept", targetNodeId: "prescription-flow" },
          ],
        },
      },

      // === ABBRUCH ===
      {
        id: "cancelled",
        position: { x: 2400, y: 450 },
        data: {
          label: "Abgebrochen",
          text: "Kein Problem, die Anfrage wurde abgebrochen. 👋\n\nFalls Sie es sich anders überlegen, starten Sie einfach eine neue Anfrage.\n\nBleiben Sie gesund!",
          variant: "message",
          quickReplies: [
            { id: "qr-restart", label: "Neue Anfrage", payload: "termin", targetNodeId: "choose-reason" },
            { id: "qr-back-menu", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },

      // === VERABSCHIEDUNG ===
      {
        id: "goodbye",
        position: { x: 600, y: 720 },
        data: {
          label: "Verabschiedung",
          text: "Vielen Dank! 👋 Wir wünschen Ihnen alles Gute.\n\nBei Fragen sind wir jederzeit für Sie da!",
          variant: "message",
          quickReplies: [
            { id: "qr-goodbye-appointment", label: "Termin vereinbaren", payload: "termin", targetNodeId: "choose-reason" },
            { id: "qr-goodbye-menu", label: "Zurück zum Menü", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },
    ],
    edges: [
      // Welcome -> Paths
      { id: "e-appointment", source: "welcome", target: "choose-reason", data: { condition: "Termin vereinbaren", tone: "positive" } },
      { id: "e-prescription", source: "welcome", target: "prescription-flow", data: { condition: "Rezept anfordern", tone: "neutral" } },
      { id: "e-hours", source: "welcome", target: "info-hours", data: { condition: "Sprechzeiten", tone: "neutral" } },
      { id: "e-emergency", source: "welcome", target: "emergency-info", data: { condition: "Notfall", tone: "negative" } },
      // Info -> Actions
      { id: "e-hours-book", source: "info-hours", target: "choose-reason", data: { condition: "Termin vereinbaren", tone: "positive" } },
      { id: "e-hours-back", source: "info-hours", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      { id: "e-emergency-urgent", source: "emergency-info", target: "urgent-appointment", data: { condition: "Dringender Termin", tone: "positive" } },
      { id: "e-emergency-back", source: "emergency-info", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      // Prescription flow
      { id: "e-rx-confirm", source: "prescription-flow", target: "prescription-confirm", data: { condition: "Medikament genannt", tone: "positive" } },
      { id: "e-rx-appointment", source: "prescription-confirm", target: "choose-reason", data: { condition: "Zusätzlich Termin", tone: "positive" } },
      { id: "e-rx-done", source: "prescription-confirm", target: "goodbye", data: { condition: "Fertig", tone: "positive" } },
      // Reason selection
      { id: "e-reason-checkup", source: "choose-reason", target: "choose-urgency", data: { condition: "Vorsorge", tone: "positive" } },
      { id: "e-reason-acute", source: "choose-reason", target: "describe-symptoms", data: { condition: "Akut", tone: "neutral" } },
      { id: "e-reason-followup", source: "choose-reason", target: "choose-urgency", data: { condition: "Kontrolle", tone: "positive" } },
      { id: "e-reason-other", source: "choose-reason", target: "describe-reason", data: { condition: "Sonstiges", tone: "neutral" } },
      { id: "e-symptoms-urgency", source: "describe-symptoms", target: "choose-urgency", data: { condition: "Beschrieben", tone: "positive" } },
      { id: "e-describe-urgency", source: "describe-reason", target: "choose-urgency", data: { condition: "Beschrieben", tone: "positive" } },
      // Urgent appointment
      { id: "e-urgent-normal", source: "urgent-appointment", target: "choose-urgency", data: { condition: "Normal reicht", tone: "neutral" } },
      { id: "e-urgent-back", source: "urgent-appointment", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      // Urgency -> Date
      { id: "e-urgency-today", source: "choose-urgency", target: "urgent-appointment", data: { condition: "Heute/Morgen", tone: "neutral" } },
      { id: "e-urgency-week", source: "choose-urgency", target: "choose-date", data: { condition: "Diese Woche", tone: "positive" } },
      { id: "e-urgency-flex", source: "choose-urgency", target: "choose-date", data: { condition: "Flexibel", tone: "positive" } },
      // Date flow
      { id: "e-date-time", source: "choose-date", target: "choose-time", data: { condition: "Tag gewählt", tone: "positive" } },
      { id: "e-date-custom", source: "choose-date", target: "choose-date-custom", data: { condition: "Anderer Tag", tone: "neutral" } },
      { id: "e-date-custom-time", source: "choose-date-custom", target: "choose-time", data: { condition: "Datum genannt", tone: "positive" } },
      // Time -> Insurance
      { id: "e-time-insurance", source: "choose-time", target: "ask-insurance", data: { condition: "Uhrzeit gewählt", tone: "positive" } },
      // Insurance -> Patient type
      { id: "e-insurance-type", source: "ask-insurance", target: "ask-patient-type", data: { condition: "Versicherung angegeben", tone: "positive" } },
      // Patient type -> Contact
      { id: "e-type-name", source: "ask-patient-type", target: "ask-name", data: { condition: "Typ gewählt", tone: "positive" } },
      // Contact flow
      { id: "e-name-birth", source: "ask-name", target: "ask-birthdate", data: { condition: "Name eingegeben", tone: "positive" } },
      { id: "e-birth-phone", source: "ask-birthdate", target: "ask-phone", data: { condition: "Geburtsdatum eingegeben", tone: "positive" } },
      { id: "e-phone-summary", source: "ask-phone", target: "summary", data: { condition: "Telefon eingegeben", tone: "positive" } },
      // Summary actions
      { id: "e-summary-confirm", source: "summary", target: "confirmed", data: { condition: "Absenden", tone: "positive" } },
      { id: "e-summary-edit", source: "summary", target: "edit-options", data: { condition: "Ändern", tone: "neutral" } },
      { id: "e-summary-cancel", source: "summary", target: "cancelled", data: { condition: "Abbrechen", tone: "negative" } },
      // Edit options
      { id: "e-edit-reason", source: "edit-options", target: "choose-reason", data: { condition: "Anliegen", tone: "neutral" } },
      { id: "e-edit-date", source: "edit-options", target: "choose-date", data: { condition: "Termin", tone: "neutral" } },
      { id: "e-edit-contact", source: "edit-options", target: "ask-name", data: { condition: "Kontaktdaten", tone: "neutral" } },
      // Confirmed actions
      { id: "e-confirmed-hours", source: "confirmed", target: "info-hours", data: { condition: "Sprechzeiten", tone: "neutral" } },
      { id: "e-confirmed-rx", source: "confirmed", target: "prescription-flow", data: { condition: "Rezept", tone: "neutral" } },
      // Cancelled actions
      { id: "e-cancelled-restart", source: "cancelled", target: "choose-reason", data: { condition: "Neue Anfrage", tone: "positive" } },
      { id: "e-cancelled-menu", source: "cancelled", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      // Goodbye actions
      { id: "e-goodbye-appointment", source: "goodbye", target: "choose-reason", data: { condition: "Termin", tone: "positive" } },
      { id: "e-goodbye-menu", source: "goodbye", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
    ],
    triggers: [
      {
        id: "trigger-medical-appointment",
        type: "KEYWORD",
        config: {
          keywords: ["termin", "arzt", "sprechstunde", "praxis"],
          matchType: "CONTAINS",
        },
        startNodeId: "welcome",
      },
      {
        id: "trigger-medical-hello",
        type: "KEYWORD",
        config: {
          keywords: ["hallo", "hi", "hey", "guten tag"],
          matchType: "CONTAINS",
        },
        startNodeId: "welcome",
      },
      {
        id: "trigger-medical-prescription",
        type: "KEYWORD",
        config: {
          keywords: ["rezept", "medikament", "verschreibung"],
          matchType: "CONTAINS",
        },
        startNodeId: "prescription-flow",
      },
      {
        id: "trigger-medical-emergency",
        type: "KEYWORD",
        config: {
          keywords: ["notfall", "dringend", "akut", "sofort"],
          matchType: "CONTAINS",
        },
        startNodeId: "emergency-info",
      },
    ],
    metadata: {
      version: "2.0",
      output_config: {
        type: "custom",
      },
    },
  },
  {
    id: "template-fitness",
    slug: "fitness-appointment",
    name: "Fitness — Terminbuchung",
    vertical: "Fitness & Wellness",
    description: "Einfacher Terminflow für Trainer, Studios und Kurse.",
    nodes: [
      {
        id: "welcome",
        type: "input",
        position: { x: 0, y: 200 },
        data: {
          label: "Willkommen",
          text: "Hi! 👋 Möchtest du einen Trainingstermin buchen?",
          variant: "message",
          quickReplies: [
            { id: "qr-book", label: "Termin buchen", payload: "book", targetNodeId: "ask-date" },
            { id: "qr-prices", label: "Preise", payload: "prices", targetNodeId: "info-prices" },
            { id: "qr-hours", label: "Öffnungszeiten", payload: "hours", targetNodeId: "info-hours" },
          ],
        },
      },
      {
        id: "info-prices",
        position: { x: 0, y: 380 },
        data: {
          label: "Preise",
          text: "Unsere aktuellen Preise findest du hier:\n\n🔗 [Link zur Preisliste]\n\nBei Fragen helfen wir dir gern weiter.",
          variant: "message",
          quickReplies: [
            { id: "qr-prices-book", label: "Termin buchen", payload: "book", targetNodeId: "ask-date" },
            { id: "qr-prices-back", label: "Zurück", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },
      {
        id: "info-hours",
        position: { x: 0, y: 520 },
        data: {
          label: "Öffnungszeiten",
          text: "Unsere Trainingszeiten:\n\n📅 Mo-Fr: 7:00 - 21:00\n📅 Sa: 9:00 - 18:00\n📅 So: 10:00 - 16:00",
          variant: "message",
          quickReplies: [
            { id: "qr-hours-book", label: "Termin buchen", payload: "book", targetNodeId: "ask-date" },
            { id: "qr-hours-back", label: "Zurück", payload: "back", targetNodeId: "welcome" },
          ],
        },
      },
      {
        id: "ask-date",
        position: { x: 320, y: 200 },
        data: {
          label: "Datum wählen",
          text: "Für welchen Tag möchtest du den Termin?",
          variant: "message",
          quickReplies: [
            { id: "qr-date-today", label: "Heute", payload: "heute", targetNodeId: "ask-time" },
            { id: "qr-date-tomorrow", label: "Morgen", payload: "morgen", targetNodeId: "ask-time" },
            { id: "qr-date-other", label: "Anderes Datum", payload: "anderes", targetNodeId: "ask-date-custom" },
          ],
        },
      },
      {
        id: "ask-date-custom",
        position: { x: 320, y: 380 },
        data: {
          label: "Wunschdatum",
          text: "Kein Problem! Nenne mir bitte dein Wunschdatum.",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-time",
        position: { x: 640, y: 200 },
        data: {
          label: "Uhrzeit wählen",
          text: "Welche Uhrzeit passt dir am besten?",
          variant: "message",
          quickReplies: [
            { id: "qr-time-09", label: "09:00", payload: "09:00", targetNodeId: "ask-guests" },
            { id: "qr-time-17", label: "17:00", payload: "17:00", targetNodeId: "ask-guests" },
            { id: "qr-time-19", label: "19:00", payload: "19:00", targetNodeId: "ask-guests" },
            { id: "qr-time-other", label: "Andere Uhrzeit", payload: "andere", targetNodeId: "ask-time-custom" },
          ],
        },
      },
      {
        id: "ask-time-custom",
        position: { x: 640, y: 380 },
        data: {
          label: "Wunschzeit",
          text: "Bitte nenne mir deine Wunschzeit (z. B. 18:30).",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-guests",
        position: { x: 960, y: 200 },
        data: {
          label: "Teilnehmerzahl",
          text: "Wie viele Teilnehmer möchtet ihr einplanen?",
          variant: "message",
          quickReplies: [
            { id: "qr-guests-1", label: "1 Teilnehmer", payload: "1", targetNodeId: "ask-name" },
            { id: "qr-guests-2", label: "2 Teilnehmer", payload: "2", targetNodeId: "ask-name" },
            { id: "qr-guests-3", label: "3 Teilnehmer", payload: "3", targetNodeId: "ask-name" },
            { id: "qr-guests-more", label: "Mehr", payload: "mehr", targetNodeId: "ask-guests-custom" },
          ],
        },
      },
      {
        id: "ask-guests-custom",
        position: { x: 960, y: 380 },
        data: {
          label: "Teilnehmerzahl",
          text: "Wie viele Teilnehmer seid ihr?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-name",
        position: { x: 1280, y: 200 },
        data: {
          label: "Name",
          text: "Wie lautet dein Name?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-phone",
        position: { x: 1280, y: 380 },
        data: {
          label: "Telefon",
          text: "Wie lautet deine Telefonnummer?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "confirm",
        position: { x: 1600, y: 200 },
        data: {
          label: "Bestätigung",
          text: "Perfekt! ✅ Hier sind deine Angaben:\n\n📅 Datum: {{date}}\n⏰ Uhrzeit: {{time}}\n👥 Teilnehmer: {{guestCount}}\n👤 Name: {{name}}\n📱 Telefon: {{phone}}\n\nSoll ich den Termin so anlegen?",
          variant: "message",
          quickReplies: [],
        },
      },
    ],
    edges: [
      { id: "e-welcome-book", source: "welcome", target: "ask-date", data: { condition: "Termin buchen", tone: "positive" } },
      { id: "e-welcome-prices", source: "welcome", target: "info-prices", data: { condition: "Preise", tone: "neutral" } },
      { id: "e-welcome-hours", source: "welcome", target: "info-hours", data: { condition: "Öffnungszeiten", tone: "neutral" } },
      { id: "e-prices-book", source: "info-prices", target: "ask-date", data: { condition: "Termin buchen", tone: "positive" } },
      { id: "e-prices-back", source: "info-prices", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      { id: "e-hours-book", source: "info-hours", target: "ask-date", data: { condition: "Termin buchen", tone: "positive" } },
      { id: "e-hours-back", source: "info-hours", target: "welcome", data: { condition: "Zurück", tone: "neutral" } },
      { id: "e-date-today", source: "ask-date", target: "ask-time", data: { condition: "Heute", tone: "positive" } },
      { id: "e-date-tomorrow", source: "ask-date", target: "ask-time", data: { condition: "Morgen", tone: "positive" } },
      { id: "e-date-custom", source: "ask-date", target: "ask-date-custom", data: { condition: "Anderes Datum", tone: "neutral" } },
      { id: "e-date-custom-time", source: "ask-date-custom", target: "ask-time", data: { condition: "Datum", tone: "positive" } },
      { id: "e-time-09", source: "ask-time", target: "ask-guests", data: { condition: "09:00", tone: "positive" } },
      { id: "e-time-17", source: "ask-time", target: "ask-guests", data: { condition: "17:00", tone: "positive" } },
      { id: "e-time-19", source: "ask-time", target: "ask-guests", data: { condition: "19:00", tone: "positive" } },
      { id: "e-time-other", source: "ask-time", target: "ask-time-custom", data: { condition: "Andere Uhrzeit", tone: "neutral" } },
      { id: "e-time-custom-guests", source: "ask-time-custom", target: "ask-guests", data: { condition: "Uhrzeit", tone: "positive" } },
      { id: "e-guests-1", source: "ask-guests", target: "ask-name", data: { condition: "1", tone: "positive" } },
      { id: "e-guests-2", source: "ask-guests", target: "ask-name", data: { condition: "2", tone: "positive" } },
      { id: "e-guests-3", source: "ask-guests", target: "ask-name", data: { condition: "3", tone: "positive" } },
      { id: "e-guests-more", source: "ask-guests", target: "ask-guests-custom", data: { condition: "Mehr", tone: "neutral" } },
      { id: "e-guests-custom-name", source: "ask-guests-custom", target: "ask-name", data: { condition: "Teilnehmer", tone: "positive" } },
      { id: "e-name-phone", source: "ask-name", target: "ask-phone", data: { condition: "Name", tone: "positive" } },
      { id: "e-phone-confirm", source: "ask-phone", target: "confirm", data: { condition: "Telefon", tone: "positive" } },
    ],
    triggers: [
      {
        id: "trigger-fitness-appointment",
        type: "KEYWORD",
        config: {
          keywords: ["termin", "training", "session", "coach", "trainer"],
          matchType: "CONTAINS",
        },
        startNodeId: "welcome",
      },
    ],
    metadata: {
      version: "2.0",
      output_config: {
        type: "reservation",
        requiredFields: ["name", "date", "time"],
        defaults: { guestCount: 1 },
      },
    },
  },
  {
    id: "template-google-review",
    slug: "google-review-followup",
    name: "Google Bewertung — Nach dem Besuch",
    vertical: "Bewertungen",
    description: "Bewertungsflow für Google Reviews (anpassbar für Ton & Text).",
    nodes: [
      {
        id: "review-rating",
        type: "input",
        position: { x: 0, y: 120 },
        data: {
          label: "Bewertung abfragen",
          text: "Danke für deinen Besuch! ⭐️\n\nWie würdest du deinen Aufenthalt bewerten?",
          variant: "message",
          quickReplies: [
            { id: "qr-review-1", label: "⭐️ 1", payload: "1", targetNodeId: "review-feedback" },
            { id: "qr-review-2", label: "⭐️ 2", payload: "2", targetNodeId: "review-feedback" },
            { id: "qr-review-3", label: "⭐️ 3", payload: "3", targetNodeId: "review-link" },
            { id: "qr-review-4", label: "⭐️ 4", payload: "4", targetNodeId: "review-link" },
            { id: "qr-review-5", label: "⭐️ 5", payload: "5", targetNodeId: "review-link" },
          ],
        },
      },
      {
        id: "review-feedback",
        position: { x: 320, y: 60 },
        data: {
          label: "Feedback einholen",
          text: "Es tut uns leid, dass es nicht perfekt war. Was können wir verbessern?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "review-link",
        position: { x: 320, y: 220 },
        data: {
          label: "Google Bewertung",
          text: "Danke dir! 🙏 Wenn du magst, kannst du hier eine Google Bewertung hinterlassen:\n{{googleReviewUrl}}",
          variant: "message",
          quickReplies: [],
        },
      },
    ],
    edges: [
      { id: "e-review-1", source: "review-rating", target: "review-feedback", data: { condition: "1 Stern", tone: "negative" } },
      { id: "e-review-2", source: "review-rating", target: "review-feedback", data: { condition: "2 Sterne", tone: "negative" } },
      { id: "e-review-3", source: "review-rating", target: "review-link", data: { condition: "3 Sterne", tone: "neutral" } },
      { id: "e-review-4", source: "review-rating", target: "review-link", data: { condition: "4 Sterne", tone: "positive" } },
      { id: "e-review-5", source: "review-rating", target: "review-link", data: { condition: "5 Sterne", tone: "positive" } },
      { id: "e-review-feedback-link", source: "review-feedback", target: "review-link", data: { condition: "Feedback erhalten", tone: "neutral" } },
    ],
    triggers: [],
    metadata: {
      version: "1.0",
      reviewFlow: true,
      startNodeId: "review-rating",
      systemTemplate: true,
      output_config: {
        type: "custom",
      },
    },
  },
];
