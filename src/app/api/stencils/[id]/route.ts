import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb, UPLOADS_DIR } from "@/lib/db";
import { getStencilById } from "@/lib/stencils";
import path from "path";
import fs from "fs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const stencil = getStencilById(id);
  if (!stencil) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const db = getDb();

  if (body.enabled !== undefined) {
    db.prepare("UPDATE stencils SET enabled = ? WHERE id = ?").run(body.enabled ? 1 : 0, id);
  }

  const updated = getStencilById(id);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const stencil = getStencilById(id);
  if (!stencil) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (stencil.src.startsWith("/api/uploads/")) {
    const filePath = path.join(UPLOADS_DIR, "stencils", stencil.filename);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // File may already be gone
    }
  }

  const db = getDb();
  db.prepare("DELETE FROM stencils WHERE id = ?").run(id);

  return NextResponse.json({ deleted: true });
}
