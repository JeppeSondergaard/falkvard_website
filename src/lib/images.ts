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

export type FolderRecord = {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
  show_in_gallery: number;
  created_at: string;
};

export function getAllFolders(): FolderRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM folders ORDER BY sort_order ASC, label ASC")
    .all() as FolderRecord[];
}

export function getGalleryFolders(): FolderRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM folders WHERE show_in_gallery = 1 ORDER BY sort_order ASC, label ASC")
    .all() as FolderRecord[];
}

export function getFolderIds(): string[] {
  return getAllFolders().map((f) => f.id);
}

export function getFolderByIdFromDb(id: string): FolderRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM folders WHERE id = ?").get(id) as FolderRecord | undefined;
}

export function createFolder(id: string, label: string, icon: string, showInGallery: boolean): FolderRecord {
  const db = getDb();
  const maxOrder = db
    .prepare("SELECT MAX(sort_order) as m FROM folders")
    .get() as { m: number | null };
  const sortOrder = (maxOrder.m ?? -1) + 1;

  db.prepare(
    "INSERT INTO folders (id, label, icon, sort_order, show_in_gallery) VALUES (?, ?, ?, ?, ?)"
  ).run(id, label, icon, sortOrder, showInGallery ? 1 : 0);

  return getFolderByIdFromDb(id)!;
}

export function deleteFolder(id: string): void {
  const db = getDb();
  db.prepare("UPDATE images SET folder = 'unsorted' WHERE folder = ?").run(id);
  db.prepare("DELETE FROM folders WHERE id = ?").run(id);
}

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
    .prepare("SELECT * FROM images WHERE enabled = 1 AND folder NOT IN ('frontpage','unsorted') ORDER BY sort_order ASC, created_at DESC")
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

  const folders = getAllFolders();
  const counts: Record<string, number> = {};
  for (const f of folders) counts[f.id] = 0;
  for (const row of rows) counts[row.folder] = row.count;
  return counts;
}
