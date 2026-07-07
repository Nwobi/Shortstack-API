import { LRUCache } from "./LRUCache";
import { env } from "../config/env";

interface CachedLink {
  original_url: string;
  expires_at: string | null;
  is_active: number;
}

// Single shared cache instance for the process lifetime.
export const urlCache = new LRUCache<string, CachedLink>(env.CACHE_MAX_SIZE);
