-- schema.sql
DROP TABLE IF EXISTS tasks;

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
  position INTEGER NOT NULL,
  deadline DATETIME NULL -- <-- ADD THIS LINE
);