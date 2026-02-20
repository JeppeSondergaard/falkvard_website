import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb, UPLOADS_DIR } from "@/lib/db";
import { getAllStencils } from "@/lib/stencils";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function GET(req: NextRequest) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getAllStencils());
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const stencilDir = path.join(UPLOADS_DIR, "stencils");
    if (!fs.existsSync(stencilDir)) fs.mkdirSync(stencilDir, { recursive: true });

    const db = getDb();
    const maxOrder = db
      .prepare("SELECT MAX(sort_order) as m FROM stencils")
      .get() as { m: number | null };
    let nextOrder = (maxOrder.m ?? -1) + 1;

    const inserted: Array<{ id: string; src: string; filename: string }> = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_SIZE) continue;

      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const id = uuid();
      const storedName = `${id}.${ext}`;
      const filePath = path.join(stencilDir, storedName);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      const src = `/api/uploads/stencils/${storedName}`;
      db.prepare(
        "INSERT INTO stencils (id, filename, original_name, src, enabled, sort_order) VALUES (?, ?, ?, ?, 1, ?)"
      ).run(id, storedName, file.name, src, nextOrder);

      inserted.push({ id, src, filename: storedName });
      nextOrder++;
    }

    return NextResponse.json({ uploaded: inserted }, { status: 201 });
  } catch (err) {
    console.error("Stencil upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
