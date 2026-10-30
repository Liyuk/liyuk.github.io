CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  article_key TEXT NOT NULL,
  nickname TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS comments_public_by_article
  ON comments (article_key, status, created_at DESC);

CREATE TABLE IF NOT EXISTS comment_rate_limits (
  ip_hash TEXT PRIMARY KEY NOT NULL,
  window_start TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count BETWEEN 1 AND 6)
);

CREATE TABLE IF NOT EXISTS likes (
  article_key TEXT NOT NULL,
  visitor_token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (article_key, visitor_token)
);
