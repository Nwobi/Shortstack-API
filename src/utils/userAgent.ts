import UAParser from "ua-parser-js";

export interface ParsedUA {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(ua: string | undefined): ParsedUA {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Desktop" };
  const result = UAParser(ua);
  return {
    browser: result.browser.name ?? "Unknown",
    os: result.os.name ?? "Unknown",
    device: result.device.type ?? "Desktop",
  };
}

/**
 * Extracts a rough country hint from the Accept-Language header.
 * Not geolocation — just the region tag in the locale string (e.g. "en-NG" → "NG").
 * Good enough for portfolio analytics without needing a GeoIP database.
 */
export function extractCountryHint(
  acceptLanguage: string | undefined,
): string | null {
  if (!acceptLanguage) return null;
  const match = /[a-z]{2}-([A-Z]{2})/.exec(acceptLanguage);
  return match?.[1] ?? null;
}
