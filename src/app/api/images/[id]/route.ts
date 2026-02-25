import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb, UPLOADS_DIR } from "@/lib/db";
import { getImageById, getFolderIds } from "@/lib/images";
import path from "path";
import fs from "fs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const image = getImageById(id);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const db = getDb();

  if (body.folder !== undefined) {
    if (!getFolderIds().includes(body.folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }
    const maxOrder = db
      .prepare("SELECT MAX(sort_order) as m FROM images WHERE folder = ?")
      .get(body.folder) as { m: number | null };
    const newOrder = (maxOrder.m ?? -1) + 1;
    db.prepare("UPDATE images SET folder = ?, sort_order = ? WHERE id = ?").run(
      body.folder,
      newOrder,
      id
    );
  }

  if (body.enabled !== undefined) {
    db.prepare("UPDATE images SET enabled = ? WHERE id = ?").run(body.enabled ? 1 : 0, id);
  }

  if (body.alt_text !== undefined) {
    db.prepare("UPDATE images SET alt_text = ? WHERE id = ?").run(body.alt_text, id);
  }

  const updated = getImageById(id);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const image = getImageById(id);
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (image.src.startsWith("/api/uploads/")) {
    const filePath = path.join(UPLOADS_DIR, image.filename);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // File may already be gone
    }
  }

  const db = getDb();
  db.prepare("DELETE FROM images WHERE id = ?").run(id);

  return NextResponse.json({ deleted: true });
}
