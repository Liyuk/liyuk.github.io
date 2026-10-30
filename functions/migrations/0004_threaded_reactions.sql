ALTER TABLE comments ADD COLUMN parent_id TEXT REFERENCES comments(id);

CREATE INDEX comments_replies_by_parent
  ON comments (article_key, parent_id, status, created_at ASC);

CREATE TABLE likes_with_targets (
  article_key TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('article', 'comment')),
  target_id TEXT NOT NULL DEFAULT '',
  visitor_token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (target_type = 'article' AND target_id = '') OR
    (target_type = 'comment' AND target_id <> '')
  ),
  PRIMARY KEY (article_key, target_type, target_id, visitor_token)
);

INSERT INTO likes_with_targets (article_key, target_type, target_id, visitor_token, created_at)
SELECT article_key, 'article', '', visitor_token, created_at FROM likes;

DROP TABLE likes;
ALTER TABLE likes_with_targets RENAME TO likes;

CREATE INDEX likes_by_target
  ON likes (article_key, target_type, target_id);
