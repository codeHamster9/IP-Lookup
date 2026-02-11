/**
 * Convert a 2-letter country code to its flag emoji.
 * e.g. "US" → "🇺🇸"
 */
export function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join('');
}
