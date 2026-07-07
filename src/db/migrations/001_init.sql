CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS links (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_url TEXT   NOT NULL,
  short_code  TEXT    NOT NULL UNIQUE,
  alias       TEXT    UNIQUE,              -- optional vanity slug
  title       TEXT,                        -- optional human label
  expires_at  TEXT,                        -- ISO datetime or NULL
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clicks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  link_id     INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  clicked_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  referrer    TEXT,
  browser     TEXT,
  os          TEXT,
  device      TEXT,
  country_hint TEXT   -- derived from Accept-Language as a rough proxy
);

CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_alias      ON links(alias);
CREATE INDEX IF NOT EXISTS idx_links_user       ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_link      ON clicks(link_id, clicked_at DESC);
