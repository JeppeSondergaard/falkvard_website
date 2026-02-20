import { getDb } from "./db";

export type StencilRecord = {
  id: string;
  filename: string;
  original_name: string | null;
  src: string;
  enabled: number;
  sort_order: number;
  created_at: string;
};

export function getAllStencils(): StencilRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM stencils ORDER BY sort_order ASC, created_at DESC")
    .all() as StencilRecord[];
}

export function getEnabledStencils(): StencilRecord[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM stencils WHERE enabled = 1 ORDER BY sort_order ASC, created_at DESC")
    .all() as StencilRecord[];
}

export function getStencilById(id: string): StencilRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM stencils WHERE id = ?").get(id) as StencilRecord | undefined;
}
