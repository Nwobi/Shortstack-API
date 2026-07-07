import { getDb } from "../../db/database";

export interface LinkRow {
  id: number;
  user_id: number;
  original_url: string;
  short_code: string;
  alias: string | null;
  title: string | null;
  expires_at: string | null;
  is_active: number;
  created_at: string;
}

export const linkRepo = {
  create(input: {
    userId: number;
    originalUrl: string;
    shortCode: string;
    alias?: string;
    title?: string;
    expiresAt?: string;
  }): LinkRow {
    const r = getDb()
      .prepare(
        `INSERT INTO links (user_id, original_url, short_code, alias, title, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.userId,
        input.originalUrl,
        input.shortCode,
        input.alias ?? null,
        input.title ?? null,
        input.expiresAt ?? null,
      );
    return this.findById(Number(r.lastInsertRowid))!;
  },

  findById(id: number): LinkRow | undefined {
    return getDb().prepare("SELECT * FROM links WHERE id = ?").get(id) as
      LinkRow | undefined;
  },

  findByCode(code: string): LinkRow | undefined {
    return getDb()
      .prepare("SELECT * FROM links WHERE short_code = ? OR alias = ?")
      .get(code, code) as LinkRow | undefined;
  },

  findByUserId(userId: number): LinkRow[] {
    return getDb()
      .prepare("SELECT * FROM links WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId) as unknown as LinkRow[];
  },

  shortCodeExists(code: string): boolean {
    return !!getDb()
      .prepare("SELECT 1 FROM links WHERE short_code = ?")
      .get(code);
  },

  aliasExists(alias: string): boolean {
    return !!getDb().prepare("SELECT 1 FROM links WHERE alias = ?").get(alias);
  },

  deactivate(id: number): void {
    getDb().prepare("UPDATE links SET is_active = 0 WHERE id = ?").run(id);
  },

  delete(id: number): void {
    getDb().prepare("DELETE FROM links WHERE id = ?").run(id);
  },

  updateTitle(id: number, title: string): void {
    getDb().prepare("UPDATE links SET title = ? WHERE id = ?").run(title, id);
  },
};
