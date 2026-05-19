const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'pawswipe.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initSchema() {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      species TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      choice TEXT NOT NULL CHECK (choice IN ('yes', 'no')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (item_id, session_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_votes_item_id ON votes(item_id);
    CREATE INDEX IF NOT EXISTS idx_votes_session_id ON votes(session_id);
  `);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initSchema, closeDb, DB_PATH };
