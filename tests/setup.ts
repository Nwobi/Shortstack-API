import { beforeEach } from "vitest";
import { closeDatabase, getDb } from "../src/db/database";
import { urlCache } from "../src/cache/urlCache";

beforeEach(() => {
  closeDatabase();
  getDb();
  urlCache.clear();
});
