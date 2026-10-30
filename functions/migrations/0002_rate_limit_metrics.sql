DROP TABLE IF EXISTS comment_rate_limits_legacy;
DROP TABLE comment_rate_limits;

CREATE TABLE comment_rate_limits (
  ip_hash TEXT PRIMARY KEY NOT NULL,
  window_start TEXT NOT NULL,
  comments INTEGER NOT NULL CHECK (comments BETWEEN 0 AND 6),
  likes INTEGER NOT NULL CHECK (likes BETWEEN 0 AND 61)
);
