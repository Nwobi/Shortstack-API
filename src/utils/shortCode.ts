import { randomBytes } from "node:crypto";

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const BASE = ALPHABET.length; // 62

/**
 * Generates a cryptographically random base62 short code.
 * 7 characters gives 62^7 ≈ 3.5 trillion combinations — negligible
 * collision probability even at millions of links.
 */
export function generateShortCode(length = 7): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % BASE]!)
    .join("");
}

/**
 * Validates a custom alias: alphanumeric + hyphens, 3-50 chars.
 * Rejects anything that could clash with API routes.
 */
export function isValidAlias(alias: string): boolean {
  return /^[a-zA-Z0-9-]{3,50}$/.test(alias);
}
