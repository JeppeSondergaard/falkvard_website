import { getDb } from "./db";
export { CONTENT_DEFAULTS } from "./content-defaults";
export type { ContentType, ContentEntry } from "./content-defaults";
import { CONTENT_DEFAULTS } from "./content-defaults";

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

export function getContent(key: string): string {
  const db = getDb();
  const row = db.prepare("SELECT value FROM site_content WHERE key = ?").get(key) as { value: string } | undefined;
  if (row) return row.value;
  return CONTENT_DEFAULTS[key]?.value ?? "";
}

export function getContentBulk(keys: string[]): Record<string, string> {
  const db = getDb();
  const placeholders = keys.map(() => "?").join(",");
  const rows = db.prepare(`SELECT key, value FROM site_content WHERE key IN (${placeholders})`).all(...keys) as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const k of keys) {
    map[k] = CONTENT_DEFAULTS[k]?.value ?? "";
  }
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export function getAllContent(): Record<string, string> {
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM site_content").all() as { key: string; value: string }[];
  const map: Record<string, string> = {};
  for (const [k, def] of Object.entries(CONTENT_DEFAULTS)) {
    map[k] = def.value;
  }
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export function setContent(key: string, value: string): void {
  const db = getDb();
  const type = CONTENT_DEFAULTS[key]?.type ?? "text";
  db.prepare(
    `INSERT INTO site_content (key, value, type, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  ).run(key, value, type);
}

export function setContentBulk(entries: { key: string; value: string }[]): void {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO site_content (key, value, type, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  );
  const tx = db.transaction(() => {
    for (const { key, value } of entries) {
      const type = CONTENT_DEFAULTS[key]?.type ?? "text";
      stmt.run(key, value, type);
    }
  });
  tx();
}
