CREATE TABLE IF NOT EXISTS comparisons (
  id TEXT PRIMARY KEY,
  left_content TEXT NOT NULL,
  right_content TEXT NOT NULL,
  format TEXT NOT NULL,
  filters TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  view_count INTEGER DEFAULT 0,
  delete_token TEXT NOT NULL
);
