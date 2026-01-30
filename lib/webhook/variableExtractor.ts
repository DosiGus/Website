/**
 * Variable Extractor - Extracts user data from messages
 * Used to capture name, date, time, guest count, phone, etc.
 */

export type ExtractedVariables = {
  name?: string;
  date?: string;
  time?: string;
  guestCount?: number;
  phone?: string;
  email?: string;
  specialRequests?: string;
  [key: string]: string | number | undefined;
};

type VariableDefinition = {
  key: string;
  pattern: RegExp;
  transform?: (match: string) => string | number;
};

// Standard variable patterns for German restaurant/service businesses
const VARIABLE_PATTERNS: VariableDefinition[] = [
  {
    key: "guestCount",
    pattern: /(\d+)\s*(?:person|personen|leute|gäste|gaeste|pax)/i,
    transform: (match) => parseInt(match, 10),
  },
  {
    key: "date",
    pattern: /(\d{1,2}[.\-/]\d{1,2}(?:[.\-/]\d{2,4})?)/,
  },
  {
    key: "time",
    pattern: /(\d{1,2}[.:]\d{2})\s*(?:uhr)?/i,
  },
  {
    key: "phone",
    pattern: /(?:tel|telefon|handy|mobil|nummer)?[:\s]*(\+?[\d\s\-/]{8,})/i,
    transform: (match) => match.replace(/[\s\-/]/g, ""),
  },
  {
    key: "email",
    pattern: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  },
];

/**
 * Extracts variables from a message text.
 * Will not overwrite existing variables.
 */
export function extractVariables(
  messageText: string,
  existingVariables: ExtractedVariables = {}
): ExtractedVariables {
  const variables = { ...existingVariables };

  for (const def of VARIABLE_PATTERNS) {
    // Don't overwrite existing values
    if (variables[def.key] !== undefined) continue;

    const match = messageText.match(def.pattern);
    if (match && match[1]) {
      variables[def.key] = def.transform
        ? def.transform(match[1])
        : match[1].trim();
    }
  }

  return variables;
}

/**
 * Extracts a name from a message.
 * Called separately when the current node is asking for a name.
 */
export function extractName(messageText: string): string | null {
  const trimmed = messageText.trim();

  // If it's a short message (likely just a name), use it
  if (trimmed.length < 50) {
    const words = trimmed.split(/\s+/);
    // Accept 1-3 words as a name
    if (words.length <= 3) {
      // Check if all words look like names (letters only, including German umlauts)
      const looksLikeName = words.every((w) =>
        /^[A-Za-zÄÖÜäöüß]+$/.test(w)
      );
      if (looksLikeName) {
        return trimmed;
      }
    }
  }

  // Try to extract from patterns like "Ich heiße Max" or "Mein Name ist Max"
  const namePatterns = [
    /(?:ich\s+(?:heiße|heisse|bin))\s+([A-Za-zÄÖÜäöüß]+(?:\s+[A-Za-zÄÖÜäöüß]+)?)/i,
    /(?:mein\s+name\s+ist)\s+([A-Za-zÄÖÜäöüß]+(?:\s+[A-Za-zÄÖÜäöüß]+)?)/i,
    /(?:name[:\s]+)([A-Za-zÄÖÜäöüß]+(?:\s+[A-Za-zÄÖÜäöüß]+)?)/i,
  ];

  for (const pattern of namePatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

// German month names for parsing
const GERMAN_MONTHS: Record<string, number> = {
  januar: 1, jan: 1,
  februar: 2, feb: 2,
  märz: 3, maerz: 3, mrz: 3, mar: 3,
  april: 4, apr: 4,
  mai: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  dezember: 12, dez: 12,
};

/**
 * Extracts a date from a message, handling German date formats.
 * Supports: "heute", "morgen", "Samstag", "15. Februar", "15.02", "15/02/2024"
 */
export function extractDate(messageText: string): string | null {
  const trimmed = messageText.trim().toLowerCase();
  const today = new Date();

  // Handle relative dates
  if (trimmed === "heute" || /^heute\b/.test(trimmed)) {
    return formatDate(today);
  }
  if (trimmed === "morgen" || /^morgen\b/.test(trimmed)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }
  if (trimmed === "übermorgen" || /^übermorgen\b/.test(trimmed)) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return formatDate(dayAfter);
  }

  // Handle day names (e.g., "Samstag", "am Freitag")
  const dayNames = [
    "sonntag", "montag", "dienstag", "mittwoch",
    "donnerstag", "freitag", "samstag"
  ];
  for (let i = 0; i < dayNames.length; i++) {
    if (trimmed.includes(dayNames[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysUntil);
      return formatDate(targetDate);
    }
  }

  // Handle "15. Februar", "15 Februar", "15. Feb", "am 15. Februar"
  const monthNameMatch = trimmed.match(
    /(\d{1,2})\.?\s*(januar|jan|februar|feb|märz|maerz|mrz|mar|april|apr|mai|juni|jun|juli|jul|august|aug|september|sep|sept|oktober|okt|november|nov|dezember|dez)(?:\s+(\d{2,4}))?/i
  );
  if (monthNameMatch) {
    const day = monthNameMatch[1].padStart(2, "0");
    const monthName = monthNameMatch[2].toLowerCase();
    const month = String(GERMAN_MONTHS[monthName] || 1).padStart(2, "0");
    let year = monthNameMatch[3] || today.getFullYear().toString();
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }

  // Handle explicit dates like "15.01", "15.01.2024", "15/01/24"
  const dateMatch = trimmed.match(/(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    let year = dateMatch[3] || today.getFullYear().toString();
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Extracts a time from a message.
 * Only matches clear time patterns, NOT date patterns like "15.03"
 */
export function extractTime(messageText: string): string | null {
  const trimmed = messageText.trim().toLowerCase();

  // Handle "19:00" (with colon - clearly a time)
  const colonTimeMatch = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (colonTimeMatch) {
    const hour = parseInt(colonTimeMatch[1], 10);
    if (hour >= 0 && hour <= 24) {
      return `${colonTimeMatch[1].padStart(2, "0")}:${colonTimeMatch[2]}`;
    }
  }

  // Handle "19.00 Uhr", "19.30 uhr" (dot with "uhr" - clearly a time)
  const dotTimeWithUhr = trimmed.match(/(\d{1,2})\.(\d{2})\s*uhr/i);
  if (dotTimeWithUhr) {
    const hour = parseInt(dotTimeWithUhr[1], 10);
    if (hour >= 0 && hour <= 24) {
      return `${dotTimeWithUhr[1].padStart(2, "0")}:${dotTimeWithUhr[2]}`;
    }
  }

  // Handle "19 Uhr", "um 19 uhr" (hour with "uhr")
  const hourMatch = trimmed.match(/(\d{1,2})\s*uhr/i);
  if (hourMatch) {
    const hour = parseInt(hourMatch[1], 10);
    if (hour >= 0 && hour <= 24) {
      return `${hourMatch[1].padStart(2, "0")}:00`;
    }
  }

  // Handle "um 19:30", "gegen 20:00"
  const prefixTimeMatch = trimmed.match(/(?:um|gegen|ab)\s*(\d{1,2})[:\.](\d{2})/i);
  if (prefixTimeMatch) {
    const hour = parseInt(prefixTimeMatch[1], 10);
    if (hour >= 0 && hour <= 24) {
      return `${prefixTimeMatch[1].padStart(2, "0")}:${prefixTimeMatch[2]}`;
    }
  }

  return null;
}

/**
 * Extracts guest count from a message.
 * Only matches clear guest count patterns, NOT dates like "15. Februar"
 */
export function extractGuestCount(messageText: string): number | null {
  const trimmed = messageText.trim().toLowerCase();

  // Check if this looks like a date - don't extract guest count from dates
  const looksLikeDate = /\d{1,2}\.\s*(?:januar|jan|februar|feb|märz|maerz|april|apr|mai|juni|jun|juli|jul|august|aug|september|sep|oktober|okt|november|nov|dezember|dez)/i.test(trimmed);
  if (looksLikeDate) {
    return null;
  }

  // Direct number (only if the entire message is just a number)
  const directNumber = trimmed.match(/^(\d+)$/);
  if (directNumber) {
    const num = parseInt(directNumber[1], 10);
    if (num > 0 && num <= 20) return num; // Max 20 for direct numbers
  }

  // "4 Personen", "für 4 Personen", "4 Leute", "4 Gäste"
  const countWithWord = trimmed.match(/(\d+)\s*(?:person|personen|leute|gäste|gaeste|pax)/i);
  if (countWithWord) {
    const num = parseInt(countWithWord[1], 10);
    if (num > 0 && num <= 100) return num;
  }

  // "für 4", "wir sind 4", "zu 4"
  const countWithPrefix = trimmed.match(/(?:für|wir\s+sind|zu)\s+(\d+)/i);
  if (countWithPrefix) {
    const num = parseInt(countWithPrefix[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  return null;
}

/**
 * Merges new variables into existing ones without overwriting.
 */
export function mergeVariables(
  existing: ExtractedVariables,
  incoming: ExtractedVariables
): ExtractedVariables {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined && merged[key] === undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
