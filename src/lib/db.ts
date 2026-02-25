import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), "data", "falkvard.db");

export const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

let _db: Database.Database | null = null;

function isDbHealthy(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return true; // will be created fresh
  try {
    const db = new Database(filePath, { readonly: true });
    db.pragma("integrity_check");
    db.close();
    return true;
  } catch {
    return false;
  }
}

function removeCorruptedFiles(filePath: string) {
  const timestamp = Date.now();
  for (const suffix of ["", "-wal", "-shm"]) {
    const f = filePath + suffix;
    if (!fs.existsSync(f)) continue;
    try {
      fs.renameSync(f, `${f}.corrupt.${timestamp}`);
    } catch {
      try { fs.unlinkSync(f); } catch { /* best effort */ }
    }
  }
}

export function getDb(): Database.Database {
  if (_db) {
    try {
      _db.prepare("SELECT 1").get();
      return _db;
    } catch {
      try { _db.close(); } catch { /* ignore */ }
      _db = null;
    }
  }

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  if (!isDbHealthy(DB_PATH)) {
    console.warn(`[db] Corrupt database detected at ${DB_PATH}, moving aside and recreating`);
    removeCorruptedFiles(DB_PATH);
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  migrate(_db);
  return _db;
}

export function closeDb() {
  if (_db) {
    try { _db.close(); } catch { /* ignore */ }
    _db = null;
  }
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      phone         TEXT,
      service       TEXT NOT NULL CHECK (service IN ('tatovering','piercing','konsultation')),
      placement     TEXT,
      size          TEXT,
      description   TEXT,
      reference_urls TEXT,
      chat_history  TEXT,
      status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed')),
      source        TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web','agent')),
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS generated_designs (
      id          TEXT PRIMARY KEY,
      booking_id  TEXT REFERENCES bookings(id),
      prompt      TEXT NOT NULL,
      image_url   TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS images (
      id            TEXT PRIMARY KEY,
      filename      TEXT NOT NULL,
      original_name TEXT,
      src           TEXT NOT NULL,
      folder        TEXT NOT NULL DEFAULT 'unsorted',
      enabled       INTEGER NOT NULL DEFAULT 1,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      alt_text      TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stencils (
      id            TEXT PRIMARY KEY,
      filename      TEXT NOT NULL,
      original_name TEXT,
      src           TEXT NOT NULL,
      enabled       INTEGER NOT NULL DEFAULT 1,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS folders (
      id              TEXT PRIMARY KEY,
      label           TEXT NOT NULL,
      icon            TEXT NOT NULL DEFAULT '📁',
      sort_order      INTEGER NOT NULL DEFAULT 0,
      show_in_gallery INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','image','json')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN chat_history TEXT`);
  } catch {
    // column already exists
  }

  seedFolders(db);
  seedImagesFromJson(db);
}

function seedFolders(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM folders").get() as { c: number };
  if (count.c > 0) return;

  const defaults = [
    { id: "frontpage", label: "Forside", icon: "★", sort_order: 0, show_in_gallery: 0 },
    { id: "nordisk", label: "Nordisk", icon: "ᛟ", sort_order: 1, show_in_gallery: 1 },
    { id: "ornamental", label: "Ornamental", icon: "◈", sort_order: 2, show_in_gallery: 1 },
    { id: "dark-art", label: "Dark Art", icon: "☽", sort_order: 3, show_in_gallery: 1 },
    { id: "blomster", label: "Blomster", icon: "✿", sort_order: 4, show_in_gallery: 1 },
    { id: "blackwork", label: "Blackwork", icon: "■", sort_order: 5, show_in_gallery: 1 },
    { id: "fineline", label: "Fineline", icon: "╱", sort_order: 6, show_in_gallery: 1 },
    { id: "unsorted", label: "Usorteret", icon: "…", sort_order: 99, show_in_gallery: 1 },
  ];

  const insert = db.prepare(
    "INSERT INTO folders (id, label, icon, sort_order, show_in_gallery) VALUES (?, ?, ?, ?, ?)"
  );
  const tx = db.transaction(() => {
    for (const f of defaults) {
      insert.run(f.id, f.label, f.icon, f.sort_order, f.show_in_gallery);
    }
  });
  tx();
}

function seedImagesFromJson(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM images").get() as { c: number };
  if (count.c > 0) return;

  try {
    const jsonPath = path.join(process.cwd(), "src", "data", "instagram-posts.json");
    if (!fs.existsSync(jsonPath)) return;

    const raw = fs.readFileSync(jsonPath, "utf-8");
    const posts: Array<{
      shortcode: string;
      src: string;
      caption?: string;
      style: string;
      timestamp: number;
    }> = JSON.parse(raw);

    const insert = db.prepare(
      "INSERT INTO images (id, filename, original_name, src, folder, enabled, sort_order, alt_text, created_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, datetime(?, 'unixepoch'))"
    );

    const tx = db.transaction(() => {
      posts.forEach((post, idx) => {
        const filename = post.src.split("/").pop() || post.shortcode;
        const alt = post.caption ? post.caption.split("\n")[0].substring(0, 120) : "";
        insert.run(
          post.shortcode,
          filename,
          filename,
          post.src,
          post.style || "unsorted",
          idx,
          alt,
          post.timestamp
        );
      });
    });

    tx();
  } catch {
    // Seeding is best-effort; skip if JSON is missing or malformed
  }
}
