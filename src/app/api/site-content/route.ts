import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllContent, setContentBulk, CONTENT_DEFAULTS } from "@/lib/content";
import { UPLOADS_DIR } from "@/lib/db";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

export async function GET() {
  const content = getAllContent();
  return NextResponse.json(content);
}

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const entries: { key: string; value: string }[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (key in CONTENT_DEFAULTS && typeof value === "string") {
        entries.push({ key, value });
      }
    }

    if (entries.length === 0) {
      return NextResponse.json({ error: "No valid entries" }, { status: 400 });
    }

    setContentBulk(entries);
    return NextResponse.json({ updated: entries.length });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const key = formData.get("key") as string | null;

    if (!file || !key) {
      return NextResponse.json({ error: "File and key required" }, { status: 400 });
    }

    if (!(key in CONTENT_DEFAULTS) || CONTENT_DEFAULTS[key].type !== "image") {
      return NextResponse.json({ error: "Invalid content key for image" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const id = uuid();
    const storedName = `${id}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, storedName);

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const src = `/api/uploads/${storedName}`;
    setContentBulk([{ key, value: src }]);

    return NextResponse.json({ src }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
