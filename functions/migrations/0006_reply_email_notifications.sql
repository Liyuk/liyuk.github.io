ALTER TABLE comments ADD COLUMN notification_email TEXT;
ALTER TABLE comments ADD COLUMN notify_on_reply INTEGER NOT NULL DEFAULT 0
  CHECK (notify_on_reply IN (0, 1));
ALTER TABLE comments ADD COLUMN notification_token TEXT;
ALTER TABLE comments ADD COLUMN locale TEXT NOT NULL DEFAULT 'zh-CN'
  CHECK (locale IN ('zh-CN', 'en'));

CREATE TABLE comment_reply_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id TEXT NOT NULL UNIQUE REFERENCES comments(id) ON DELETE CASCADE,
  target_comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  notification_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'cancelled', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  locked_at TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX comment_reply_notifications_queue
  ON comment_reply_notifications (status, id);

CREATE TRIGGER enqueue_reply_notification_after_approval
AFTER UPDATE OF status ON comments
WHEN OLD.status = 'pending' AND NEW.status = 'approved' AND NEW.reply_to_id IS NOT NULL
BEGIN
  INSERT OR IGNORE INTO comment_reply_notifications
    (comment_id, target_comment_id, recipient_email, notification_token)
  SELECT NEW.id, target.id, target.notification_email, target.notification_token
  FROM comments target
  WHERE target.id = NEW.reply_to_id
    AND target.notify_on_reply = 1
    AND target.notification_email IS NOT NULL
    AND target.notification_token IS NOT NULL;
END;
