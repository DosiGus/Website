/**
 * Variable Substitutor - Replaces placeholders in text with actual values
 * Supports {{name}}, {{date}}, {{time}}, {{guestCount}}, etc.
 */

import { ExtractedVariables } from "./variableExtractor";

/**
 * Substitutes all {{variable}} placeholders in text with their values.
 * If a variable is not found, the placeholder is kept as-is.
 */
export function substituteVariables(
  text: string,
  variables: ExtractedVariables
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined) {
      return match; // Keep placeholder if not filled
    }
    return formatValue(key, value);
  });
}

/**
 * Formats a variable value for display.
 * Handles special formatting for dates, times, etc.
 */
function formatValue(key: string, value: string | number): string {
  if (typeof value === "number") {
    return String(value);
  }

  // Format date for German display (DD.MM.YYYY)
  if (key === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}`;
  }

  return value;
}

/**
 * Finds all unfilled placeholders in a text.
 * Useful for validation and debugging.
 */
export function findUnfilledPlaceholders(
  text: string,
  variables: ExtractedVariables
): string[] {
  const placeholders: string[] = [];
  const regex = /\{\{(\w+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const key = match[1];
    if (variables[key] === undefined) {
      placeholders.push(key);
    }
  }

  return Array.from(new Set(placeholders)); // Remove duplicates
}

/**
 * Checks if a text contains any placeholders.
 */
export function hasPlaceholders(text: string): boolean {
  return /\{\{(\w+)\}\}/.test(text);
}

/**
 * Gets all placeholder names from a text.
 */
export function getPlaceholderNames(text: string): string[] {
  const names: string[] = [];
  const regex = /\{\{(\w+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    names.push(match[1]);
  }

  return Array.from(new Set(names));
}
