export const VERTICAL_KEYS = ["gastro", "fitness", "beauty"] as const;
export type VerticalKey = (typeof VERTICAL_KEYS)[number];

export type VerticalOption = {
  key: VerticalKey;
  label: string;
  description: string;
  examples: string[];
};

export const VERTICAL_OPTIONS: VerticalOption[] = [
  {
    key: "gastro",
    label: "Gastronomie",
    description: "Reservierungen für Restaurants & Bars",
    examples: ["Restaurant", "Bar", "Cafe"],
  },
  {
    key: "fitness",
    label: "Fitness & Trainer",
    description: "Terminbuchungen für Trainer & Studios",
    examples: ["Personal Training", "Pilates", "Yoga"],
  },
  {
    key: "beauty",
    label: "Kosmetik & Beauty",
    description: "Termine für Friseur & Beauty-Studios",
    examples: ["Friseur", "Kosmetik", "Tattoo"],
  },
];

export const VERTICAL_TEMPLATE_GROUPS: Record<VerticalKey, string[]> = {
  gastro: ["Restaurant & Bar"],
  fitness: ["Fitness & Wellness"],
  beauty: ["Friseur & Beauty", "Medizin & Praxis"],
};

export const isVerticalKey = (value: unknown): value is VerticalKey =>
  VERTICAL_KEYS.includes(value as VerticalKey);

export const getDefaultTemplateVertical = (vertical?: VerticalKey | null): string | null => {
  if (!vertical) return null;
  const options = VERTICAL_TEMPLATE_GROUPS[vertical];
  return options?.[0] ?? null;
};

export type WizardCopy = {
  businessTypeLabel: string;
  businessLabel: string;
  businessPlaceholder: string;
  customerPlural: string;
  greetingQuestion: string;
  confirmationText: string;
  startQuickReply: string;
  datePrompt: string;
  timePrompt: string;
  participantsLabel: string;
  participantsQuestion: string;
  participantsCustomLabel: string;
  participantsCustomPrompt: string;
  participantsPlaceholder: string;
  participantUnitSingular: string;
  participantUnitPlural: string;
  triggerKeywords: string[];
  flowNameSuffix: string;
  bookingNounPlural: string;
  bookingVerb: string;
};

export const WIZARD_COPY: Record<VerticalKey, WizardCopy> = {
  gastro: {
    businessTypeLabel: "Restaurant",
    businessLabel: "Restaurant-Name",
    businessPlaceholder: "z.B. Pizzeria Milano",
    customerPlural: "Gäste",
    greetingQuestion: "Möchtest du einen Tisch reservieren?",
    confirmationText: "Wir bestätigen dir die Reservierung in Kürze.",
    startQuickReply: "Ja, reservieren",
    datePrompt: "Für welchen Tag möchtest du reservieren?",
    timePrompt: "Welche Uhrzeit passt dir am besten?",
    participantsLabel: "Personenanzahl",
    participantsQuestion: "Für wie viele Personen möchtest du reservieren?",
    participantsCustomLabel: "Mehr Personen",
    participantsCustomPrompt: "Wie viele Personen seid ihr? (z. B. 4 Personen)",
    participantsPlaceholder: "z. B. 4 Personen",
    participantUnitSingular: "Person",
    participantUnitPlural: "Personen",
    triggerKeywords: ["reservieren", "tisch", "reservierung", "buchen"],
    flowNameSuffix: "Reservierung",
    bookingNounPlural: "Reservierungen",
    bookingVerb: "reservieren",
  },
  fitness: {
    businessTypeLabel: "Studio",
    businessLabel: "Trainer- oder Studio-Name",
    businessPlaceholder: "z.B. Max Personal Training",
    customerPlural: "Kunden",
    greetingQuestion: "Möchtest du einen Termin buchen?",
    confirmationText: "Wir bestätigen dir den Termin in Kürze.",
    startQuickReply: "Termin buchen",
    datePrompt: "Für welchen Tag möchtest du den Termin?",
    timePrompt: "Welche Uhrzeit passt dir am besten?",
    participantsLabel: "Teilnehmerzahl",
    participantsQuestion: "Wie viele Teilnehmer möchtest du einplanen?",
    participantsCustomLabel: "Mehr Teilnehmer",
    participantsCustomPrompt: "Wie viele Teilnehmer seid ihr? (z. B. 2)",
    participantsPlaceholder: "z. B. 2",
    participantUnitSingular: "Teilnehmer",
    participantUnitPlural: "Teilnehmer",
    triggerKeywords: ["termin", "training", "session", "buchen"],
    flowNameSuffix: "Terminbuchung",
    bookingNounPlural: "Termine",
    bookingVerb: "buchen",
  },
  beauty: {
    businessTypeLabel: "Studio",
    businessLabel: "Studio- oder Salon-Name",
    businessPlaceholder: "z.B. Studio Luna",
    customerPlural: "Kunden",
    greetingQuestion: "Möchtest du einen Termin buchen?",
    confirmationText: "Wir bestätigen dir den Termin in Kürze.",
    startQuickReply: "Termin buchen",
    datePrompt: "Für welchen Tag möchtest du den Termin?",
    timePrompt: "Welche Uhrzeit passt dir am besten?",
    participantsLabel: "Personenanzahl",
    participantsQuestion: "Für wie viele Personen ist der Termin?",
    participantsCustomLabel: "Weitere Personen",
    participantsCustomPrompt: "Wie viele Personen? (z. B. 2 Personen)",
    participantsPlaceholder: "z. B. 2 Personen",
    participantUnitSingular: "Person",
    participantUnitPlural: "Personen",
    triggerKeywords: ["termin", "buchen", "behandlung", "kosmetik", "haare"],
    flowNameSuffix: "Terminbuchung",
    bookingNounPlural: "Termine",
    bookingVerb: "buchen",
  },
};

export const getWizardCopy = (vertical?: VerticalKey | null): WizardCopy =>
  WIZARD_COPY[vertical ?? "gastro"];

export type BookingLabels = {
  bookingSingular: string;
  bookingPlural: string;
  bookingIndefiniteArticle: string;
  bookingAccusativeArticle: string;
  bookingDetails: string;
  bookingCreateTitle: string;
  bookingCreateAction: string;
  contactLabel: string;
  contactPlural: string;
  contactNameLabel: string;
  contactSearchPlaceholder: string;
  participantsLabel: string;
  participantsCountLabel: string;
  participantsTodayLabel: string;
};

export const getBookingLabels = (vertical?: VerticalKey | null): BookingLabels => {
  const isGastro = !vertical || vertical === "gastro";
  const bookingSingular = isGastro ? "Reservierung" : "Termin";
  const bookingPlural = isGastro ? "Reservierungen" : "Termine";
  const bookingIndefiniteArticle = isGastro ? "eine" : "ein";
  const bookingAccusativeArticle = isGastro ? "die" : "den";
  const contactLabel = isGastro ? "Gast" : "Kunde";
  const contactPlural = isGastro ? "Gäste" : "Kunden";
  const participantsLabel = isGastro ? "Personen" : "Teilnehmer";
  const participantsCountLabel = isGastro ? "Personenanzahl" : "Teilnehmerzahl";

  return {
    bookingSingular,
    bookingPlural,
    bookingIndefiniteArticle,
    bookingAccusativeArticle,
    bookingDetails: isGastro ? "Reservierungsdetails" : "Termindetails",
    bookingCreateTitle: isGastro ? "Neue Reservierung" : "Neuer Termin",
    bookingCreateAction: `${bookingSingular} erstellen`,
    contactLabel,
    contactPlural,
    contactNameLabel: isGastro ? "Gastname" : "Kundenname",
    contactSearchPlaceholder: isGastro ? "Gastname suchen..." : "Kundenname suchen...",
    participantsLabel,
    participantsCountLabel,
    participantsTodayLabel: isGastro ? "Gäste heute" : "Teilnehmer heute",
  };
};
