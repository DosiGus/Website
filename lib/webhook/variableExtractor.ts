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

/**
 * Extracts a date from a message, handling German date formats.
 */
export function extractDate(messageText: string): string | null {
  const trimmed = messageText.trim().toLowerCase();

  // Handle relative dates
  const today = new Date();
  if (trimmed === "heute" || trimmed.includes("heute")) {
    return formatDate(today);
  }
  if (trimmed === "morgen" || trimmed.includes("morgen")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }
  if (trimmed === "übermorgen" || trimmed.includes("übermorgen")) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return formatDate(dayAfter);
  }

  // Handle day names
  const dayNames = [
    "sonntag",
    "montag",
    "dienstag",
    "mittwoch",
    "donnerstag",
    "freitag",
    "samstag",
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

  // Handle explicit dates like "15.01" or "15.01.2024"
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
 */
export function extractTime(messageText: string): string | null {
  const trimmed = messageText.trim().toLowerCase();

  // Handle "19:00", "19.00", "19 Uhr"
  const timeMatch = trimmed.match(/(\d{1,2})[.:](\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  const hourMatch = trimmed.match(/(\d{1,2})\s*uhr/i);
  if (hourMatch) {
    return `${hourMatch[1].padStart(2, "0")}:00`;
  }

  return null;
}

/**
 * Extracts guest count from a message.
 */
export function extractGuestCount(messageText: string): number | null {
  const trimmed = messageText.trim();

  // Direct number
  const directNumber = trimmed.match(/^(\d+)$/);
  if (directNumber) {
    const num = parseInt(directNumber[1], 10);
    if (num > 0 && num <= 100) return num;
  }

  // "4 Personen", "für 4", etc.
  const countMatch = trimmed.match(/(\d+)\s*(?:person|personen|leute|gäste|pax)?/i);
  if (countMatch) {
    const num = parseInt(countMatch[1], 10);
    if (num > 0 && num <= 100) return num;
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
