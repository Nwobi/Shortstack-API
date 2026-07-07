import { getDb } from "../../db/database";

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export const userRepo = {
  create(email: string, hash: string): UserRow {
    const r = getDb()
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(email, hash);
    return this.findById(Number(r.lastInsertRowid))!;
  },
  findByEmail(email: string): UserRow | undefined {
    return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as
      UserRow | undefined;
  },
  findById(id: number): UserRow | undefined {
    return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as
      UserRow | undefined;
  },
};
