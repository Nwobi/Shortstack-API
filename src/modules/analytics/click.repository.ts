import { getDb } from "../../db/database";

export interface ClickRow {
  id: number;
  link_id: number;
  clicked_at: string;
  referrer: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  country_hint: string | null;
}

export interface TimeBucket {
  bucket: string;
  count: number;
}
export interface BreakdownRow {
  label: string;
  count: number;
}

export const clickRepo = {
  record(input: {
    linkId: number;
    referrer?: string;
    browser?: string;
    os?: string;
    device?: string;
    countryHint?: string;
  }): void {
    getDb()
      .prepare(
        `INSERT INTO clicks (link_id, referrer, browser, os, device, country_hint)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.linkId,
        input.referrer ?? null,
        input.browser ?? null,
        input.os ?? null,
        input.device ?? null,
        input.countryHint ?? null,
      );
  },

  totalForLink(linkId: number): number {
    const row = getDb()
      .prepare("SELECT COUNT(*) as n FROM clicks WHERE link_id = ?")
      .get(linkId) as { n: number };
    return row.n;
  },

  /** Clicks grouped by hour for the last N hours */
  byHour(linkId: number, hours = 24): TimeBucket[] {
    return getDb()
      .prepare(
        `SELECT strftime('%Y-%m-%dT%H:00:00', clicked_at) AS bucket,
                COUNT(*) AS count
         FROM clicks
         WHERE link_id = ?
           AND clicked_at >= datetime('now', ? || ' hours')
         GROUP BY bucket
         ORDER BY bucket ASC`,
      )
      .all(linkId, `-${hours}`) as unknown as TimeBucket[];
  },

  /** Clicks grouped by day for the last N days */
  byDay(linkId: number, days = 30): TimeBucket[] {
    return getDb()
      .prepare(
        `SELECT strftime('%Y-%m-%d', clicked_at) AS bucket,
                COUNT(*) AS count
         FROM clicks
         WHERE link_id = ?
           AND clicked_at >= datetime('now', ? || ' days')
         GROUP BY bucket
         ORDER BY bucket ASC`,
      )
      .all(linkId, `-${days}`) as unknown as TimeBucket[];
  },

  /** Top referrers */
  topReferrers(linkId: number, limit = 10): BreakdownRow[] {
    return getDb()
      .prepare(
        `SELECT COALESCE(referrer, 'Direct') AS label, COUNT(*) AS count
         FROM clicks WHERE link_id = ?
         GROUP BY label ORDER BY count DESC LIMIT ?`,
      )
      .all(linkId, limit) as unknown as BreakdownRow[];
  },

  /** Browser breakdown */
  byBrowser(linkId: number): BreakdownRow[] {
    return getDb()
      .prepare(
        `SELECT COALESCE(browser, 'Unknown') AS label, COUNT(*) AS count
         FROM clicks WHERE link_id = ?
         GROUP BY label ORDER BY count DESC`,
      )
      .all(linkId) as unknown as BreakdownRow[];
  },

  /** OS breakdown */
  byOS(linkId: number): BreakdownRow[] {
    return getDb()
      .prepare(
        `SELECT COALESCE(os, 'Unknown') AS label, COUNT(*) AS count
         FROM clicks WHERE link_id = ?
         GROUP BY label ORDER BY count DESC`,
      )
      .all(linkId) as unknown as BreakdownRow[];
  },

  /** Device breakdown */
  byDevice(linkId: number): BreakdownRow[] {
    return getDb()
      .prepare(
        `SELECT COALESCE(device, 'Desktop') AS label, COUNT(*) AS count
         FROM clicks WHERE link_id = ?
         GROUP BY label ORDER BY count DESC`,
      )
      .all(linkId) as unknown as BreakdownRow[];
  },

  /** Country hint breakdown */
  byCountry(linkId: number): BreakdownRow[] {
    return getDb()
      .prepare(
        `SELECT COALESCE(country_hint, 'Unknown') AS label, COUNT(*) AS count
         FROM clicks WHERE link_id = ?
         GROUP BY label ORDER BY count DESC`,
      )
      .all(linkId) as unknown as BreakdownRow[];
  },
};
