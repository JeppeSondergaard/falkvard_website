import { getDb } from "./db";

export type ImageRecord = {
  id: string;
  filename: string;
  original_name: string | null;
  src: string;
  folder: string;
  enabled: number;
  sort_order: number;
  alt_text: string | null;
  created_at: string;
};

export const FOLDERS = [
  { id: "frontpage", label: "Forside" },
  { id: "nordisk", label: "Nordisk" },
  { id: "ornamental", label: "Ornamental" },
  { id: "dark-art", label: "Dark Art" },
  { id: "blomster", label: "Blomster" },
  { id: "blackwork", label: "Blackwork" },
  { id: "fineline", label: "Fineline" },
  { id: "unsorted", label: "Usorteret" },
] as const;

export const FOLDER_IDS = FOLDERS.map((f) => f.id);

export function getAllImages(folder?: string): ImageRecord[] {
  const db = getDb();
  if (folder) {
    return db
      .prepare("SELECT * FROM images WHERE folder = ? ORDER BY sort_order ASC, created_at DESC")
      .all(folder) as ImageRecord[];
  }
  return db
    .prepare("SELECT * FROM images ORDER BY folder, sort_order ASC, created_at DESC")
    .all() as ImageRecord[];
}

export function getEnabledImages(folder?: string): ImageRecord[] {
  const db = getDb();
  if (folder) {
    return db
      .prepare("SELECT * FROM images WHERE enabled = 1 AND folder = ? ORDER BY sort_order ASC, created_at DESC")
      .all(folder) as ImageRecord[];
  }
  return db
    .prepare("SELECT * FROM images WHERE enabled = 1 ORDER BY folder, sort_order ASC, created_at DESC")
    .all() as ImageRecord[];
}

export function getGalleryImages(): ImageRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM images WHERE enabled = 1 AND folder != 'frontpage' ORDER BY sort_order ASC, created_at DESC")
    .all() as ImageRecord[];
}

export function getFrontpageImages(): ImageRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM images WHERE enabled = 1 AND folder = 'frontpage' ORDER BY sort_order ASC")
    .all() as ImageRecord[];
}

export function getImageById(id: string): ImageRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM images WHERE id = ?").get(id) as ImageRecord | undefined;
}

export function getFolderCounts(): Record<string, number> {
  const db = getDb();
  const rows = db
    .prepare("SELECT folder, COUNT(*) as count FROM images GROUP BY folder")
    .all() as Array<{ folder: string; count: number }>;

  const counts: Record<string, number> = {};
  for (const f of FOLDERS) counts[f.id] = 0;
  for (const row of rows) counts[row.folder] = row.count;
  return counts;
}
