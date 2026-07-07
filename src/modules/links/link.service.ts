import { z } from "zod";
import { linkRepo } from "./link.repository";
import { clickRepo } from "../analytics/click.repository";
import { urlCache } from "../../cache/urlCache";
import { generateShortCode, isValidAlias } from "../../utils/shortCode";
import { parseUserAgent, extractCountryHint } from "../../utils/userAgent";
import { ApiError } from "../../utils/helpers";
import { env } from "../../config/env";
import QRCode from "qrcode";

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const createLinkSchema = z.object({
  body: z.object({
    url: z.string().url("Must be a valid URL"),
    alias: z
      .string()
      .optional()
      .refine(
        (v) => !v || isValidAlias(v),
        "Alias must be 3-50 alphanumeric characters or hyphens",
      ),
    title: z.string().max(200).optional(),
    expiresAt: z.string().datetime("Must be a valid ISO datetime").optional(),
  }),
});

export const analyticsQuerySchema = z.object({
  query: z.object({
    period: z.enum(["24h", "7d", "30d"]).default("7d"),
  }),
});

// ─── Service ─────────────────────────────────────────────────────────────────

export const linkService = {
  /** Create a new short link, retrying on short-code collision (rare but possible). */
  create(userId: number, input: z.infer<typeof createLinkSchema>["body"]) {
    if (input.alias) {
      if (linkRepo.aliasExists(input.alias)) {
        throw ApiError.conflict(`Alias "${input.alias}" is already taken`);
      }
    }

    // Retry loop: generate until we get a unique code (almost always first try)
    let shortCode = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateShortCode();
      if (!linkRepo.shortCodeExists(candidate)) {
        shortCode = candidate;
        break;
      }
    }
    if (!shortCode)
      throw new Error("Failed to generate a unique short code — try again");

    const link = linkRepo.create({
      userId,
      originalUrl: input.url,
      shortCode,
      alias: input.alias,
      title: input.title,
      expiresAt: input.expiresAt,
    });

    // Warm the cache immediately
    urlCache.set(shortCode, {
      original_url: link.original_url,
      expires_at: link.expires_at,
      is_active: link.is_active,
    });
    if (link.alias) {
      urlCache.set(link.alias, {
        original_url: link.original_url,
        expires_at: link.expires_at,
        is_active: link.is_active,
      });
    }

    return {
      ...link,
      short_url: `${env.BASE_URL}/${link.alias ?? link.short_code}`,
    };
  },

  /** Resolve a short code or alias to the original URL, recording a click. */
  resolve(
    code: string,
    headers: { userAgent?: string; referrer?: string; acceptLanguage?: string },
  ): string {
    // Hot path: try cache first
    let cached = urlCache.get(code);

    if (!cached) {
      const link = linkRepo.findByCode(code);
      if (!link) throw ApiError.notFound("Short link not found");
      cached = {
        original_url: link.original_url,
        expires_at: link.expires_at,
        is_active: link.is_active,
      };
      urlCache.set(code, cached);
    }

    if (!cached.is_active)
      throw ApiError.gone("This link has been deactivated");
    if (cached.expires_at && new Date(cached.expires_at) < new Date()) {
      urlCache.delete(code);
      throw ApiError.gone("This link has expired");
    }

    // Record click asynchronously (don't block the redirect)
    const link = linkRepo.findByCode(code);
    if (link) {
      const ua = parseUserAgent(headers.userAgent);
      const countryHint = extractCountryHint(headers.acceptLanguage);
      setImmediate(() => {
        clickRepo.record({
          linkId: link.id,
          referrer: headers.referrer,
          browser: ua.browser,
          os: ua.os,
          device: ua.device,
          countryHint: countryHint ?? undefined,
        });
      });
    }

    return cached.original_url;
  },

  /** Get all links for a user */
  listForUser(userId: number) {
    return linkRepo.findByUserId(userId).map((l) => ({
      ...l,
      short_url: `${env.BASE_URL}/${l.alias ?? l.short_code}`,
      total_clicks: clickRepo.totalForLink(l.id),
    }));
  },

  /** Get analytics for a link the user owns */
  getAnalytics(userId: number, linkId: number, period: "24h" | "7d" | "30d") {
    const link = linkRepo.findById(linkId);
    if (!link) throw ApiError.notFound("Link not found");
    if (link.user_id !== userId) throw ApiError.forbidden();

    const [hours, days] =
      period === "24h" ? [24, 1] : period === "7d" ? [168, 7] : [720, 30];

    return {
      link: {
        ...link,
        short_url: `${env.BASE_URL}/${link.alias ?? link.short_code}`,
      },
      total_clicks: clickRepo.totalForLink(linkId),
      clicks_by_hour: period === "24h" ? clickRepo.byHour(linkId, hours) : [],
      clicks_by_day: clickRepo.byDay(linkId, days),
      referrers: clickRepo.topReferrers(linkId),
      browsers: clickRepo.byBrowser(linkId),
      os: clickRepo.byOS(linkId),
      devices: clickRepo.byDevice(linkId),
      countries: clickRepo.byCountry(linkId),
    };
  },

  /** Generate a QR code PNG data URL for a link */
  async getQRCode(userId: number, linkId: number): Promise<string> {
    const link = linkRepo.findById(linkId);
    if (!link) throw ApiError.notFound("Link not found");
    if (link.user_id !== userId) throw ApiError.forbidden();
    const shortUrl = `${env.BASE_URL}/${link.alias ?? link.short_code}`;
    return QRCode.toDataURL(shortUrl, { width: 300, margin: 2 });
  },

  /** Deactivate a link (soft delete — keeps analytics) */
  deactivate(userId: number, linkId: number): void {
    const link = linkRepo.findById(linkId);
    if (!link) throw ApiError.notFound("Link not found");
    if (link.user_id !== userId) throw ApiError.forbidden();
    linkRepo.deactivate(linkId);
    urlCache.delete(link.short_code);
    if (link.alias) urlCache.delete(link.alias);
  },

  /** Hard delete a link and all its click data */
  delete(userId: number, linkId: number): void {
    const link = linkRepo.findById(linkId);
    if (!link) throw ApiError.notFound("Link not found");
    if (link.user_id !== userId) throw ApiError.forbidden();
    linkRepo.delete(linkId);
    urlCache.delete(link.short_code);
    if (link.alias) urlCache.delete(link.alias);
  },
};
