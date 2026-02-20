import { NextRequest, NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/db";
import path from "path";
import fs from "fs";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

type Params = { params: Promise<{ path: string[] }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const segments = (await params).path;

  if (segments.some((s) => s.includes(".."))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filePath = path.join(UPLOADS_DIR, ...segments);
  const filename = segments[segments.length - 1];
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
