DROP TABLE comment_rate_limits;

CREATE TABLE comment_rate_limits (
  ip_hash TEXT PRIMARY KEY NOT NULL,
  comments_window_start TEXT NOT NULL,
  likes_window_start TEXT NOT NULL,
  comments INTEGER NOT NULL CHECK (comments BETWEEN 0 AND 6),
  likes INTEGER NOT NULL CHECK (likes BETWEEN 0 AND 6)
);

CREATE INDEX comment_rate_limits_comments_expiry
  ON comment_rate_limits (comments_window_start);

CREATE INDEX comment_rate_limits_likes_expiry
  ON comment_rate_limits (likes_window_start);
