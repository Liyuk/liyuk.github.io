ALTER TABLE comments
  ADD COLUMN reply_to_id TEXT REFERENCES comments(id) ON DELETE SET NULL;

UPDATE comments
SET reply_to_id = parent_id
WHERE parent_id IS NOT NULL;
