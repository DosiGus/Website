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
    description: "Begrüßung → Datum/Uhrzeit → Personenanzahl → Bestätigung",
    nodes: [
      {
        id: "start",
        type: "input",
        position: { x: 100, y: 60 },
        data: {
          label: "Ciao! Möchtest du einen Tisch reservieren?",
          text: "Ciao! Möchtest du einen Tisch reservieren?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-date",
        position: { x: 380, y: 20 },
        data: {
          label: "An welchem Datum möchtest du kommen?",
          text: "An welchem Datum möchtest du kommen?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "ask-size",
        position: { x: 380, y: 120 },
        data: {
          label: "Für wie viele Personen planst du?",
          text: "Für wie viele Personen planst du?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "confirm",
        position: { x: 640, y: 70 },
        data: {
          label: "Danke! Wir bestätigen dir die Reservierung gleich.",
          text: "Danke! Wir bestätigen dir die Reservierung gleich.",
          variant: "message",
          quickReplies: [],
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "ask-date" },
      { id: "e2", source: "ask-date", target: "ask-size" },
      { id: "e3", source: "ask-size", target: "confirm" },
    ],
    triggers: [
      {
        id: "trigger-restaurant",
        type: "KEYWORD",
        config: {
          keywords: ["reservierung", "tisch", "essen"],
          matchType: "CONTAINS",
        },
        startNodeId: "start",
      },
    ],
    metadata: { version: "1.0" },
  },
  {
    id: "template-salon",
    slug: "salon-appointment",
    name: "Salon — Terminbuchung",
    vertical: "Friseur & Beauty",
    description: "Behandlung wählen → Stylist → Terminoption → Kontakt",
    nodes: [
      {
        id: "start",
        type: "input",
        position: { x: 80, y: 60 },
        data: {
          label: "Hallo! Für welche Behandlung interessierst du dich?",
          text: "Hallo! Für welche Behandlung interessierst du dich?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "stylist",
        position: { x: 340, y: 40 },
        data: {
          label: "Hast du eine bevorzugte Stylistin?",
          text: "Hast du eine bevorzugte Stylistin?",
          variant: "choice",
          quickReplies: [],
        },
      },
      {
        id: "slot",
        position: { x: 340, y: 150 },
        data: {
          label: "Wir hätten Dienstag 15 Uhr oder Donnerstag 11 Uhr frei.",
          text: "Wir hätten Dienstag 15 Uhr oder Donnerstag 11 Uhr frei.",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "contact",
        position: { x: 620, y: 90 },
        data: {
          label: "Danke! Wie erreichen wir dich für die Bestätigung?",
          text: "Danke! Wie erreichen wir dich für die Bestätigung?",
          variant: "message",
          quickReplies: [],
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "stylist" },
      { id: "e2", source: "stylist", target: "slot" },
      { id: "e3", source: "slot", target: "contact" },
    ],
    triggers: [
      {
        id: "trigger-salon",
        type: "KEYWORD",
        config: {
          keywords: ["termin", "friseur", "styling"],
          matchType: "CONTAINS",
        },
        startNodeId: "start",
      },
    ],
    metadata: { version: "1.0" },
  },
  {
    id: "template-medical",
    slug: "medical-intake",
    name: "Praxis — Anfrage & Intake",
    vertical: "Medizin & Praxis",
    description: "Anliegen → Dringlichkeit → Kontaktdaten → Rückruf",
    nodes: [
      {
        id: "start",
        type: "input",
        position: { x: 90, y: 70 },
        data: {
          label: "Willkommen in unserer Praxis! Worum geht es bei dir?",
          text: "Willkommen in unserer Praxis! Worum geht es bei dir?",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "urgency",
        position: { x: 360, y: 30 },
        data: {
          label: "Wie dringend ist dein Anliegen?",
          text: "Wie dringend ist dein Anliegen?",
          variant: "choice",
          quickReplies: [],
        },
      },
      {
        id: "availability",
        position: { x: 360, y: 140 },
        data: {
          label: "Wir melden uns mit dem nächsten freien Termin.",
          text: "Wir melden uns mit dem nächsten freien Termin.",
          variant: "message",
          quickReplies: [],
        },
      },
      {
        id: "contact",
        position: { x: 600, y: 80 },
        data: {
          label: "Bitte gib uns deine Telefonnummer oder E-Mail.",
          text: "Bitte gib uns deine Telefonnummer oder E-Mail.",
          variant: "message",
          quickReplies: [],
        },
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "urgency" },
      { id: "e2", source: "urgency", target: "availability" },
      { id: "e3", source: "availability", target: "contact" },
    ],
    triggers: [
      {
        id: "trigger-medical",
        type: "KEYWORD",
        config: {
          keywords: ["termin", "arzt", "sprechstunde"],
          matchType: "CONTAINS",
        },
        startNodeId: "start",
      },
    ],
    metadata: { version: "1.0" },
  },
];
