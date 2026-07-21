import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllContent, setContentBulk, CONTENT_DEFAULTS } from "@/lib/content";
import { UPLOADS_DIR } from "@/lib/db";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";

export const runtime = "nodejs";

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
  } catch (error) {
    console.error("Site content PUT failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
];
const MAX_SIZE = 50 * 1024 * 1024;

function transcodeVideoToMp4(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y",
      "-nostdin",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-vf",
      "scale='min(1280,iw)':-2",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "24",
      "-pix_fmt",
      "yuv420p",
      "-an",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    const timeout = setTimeout(() => {
      ffmpeg.kill("SIGKILL");
      reject(new Error("ffmpeg timed out after 120 seconds"));
    }, 120_000);

    let stderr = "";
    ffmpeg.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffmpeg.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ffmpeg.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `ffmpeg exited with code ${code}`));
    });
  });
}

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

    if (
      !(key in CONTENT_DEFAULTS) ||
      !["image", "media"].includes(CONTENT_DEFAULTS[key].type)
    ) {
      return NextResponse.json({ error: "Invalid content key for upload" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const id = uuid();
    const isVideoUpload = file.type.startsWith("video/");
    const sourceExt = file.name.split(".").pop()?.toLowerCase() || (isVideoUpload ? "video" : "jpg");
    const rawName = isVideoUpload ? `${id}.source.${sourceExt}` : `${id}.${sourceExt}`;
    const rawPath = path.join(UPLOADS_DIR, rawName);

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(rawPath, buffer);

    let storedName = rawName;
    if (isVideoUpload) {
      const mp4Name = `${id}.mp4`;
      const mp4Path = path.join(UPLOADS_DIR, mp4Name);
      try {
        await transcodeVideoToMp4(rawPath, mp4Path);
        fs.unlinkSync(rawPath);
        storedName = mp4Name;
      } catch (error) {
        if (fs.existsSync(rawPath)) {
          fs.unlinkSync(rawPath);
        }
        if (fs.existsSync(mp4Path)) {
          fs.unlinkSync(mp4Path);
        }
        console.error("Video transcoding failed:", error);
        return NextResponse.json({ error: "Video conversion failed" }, { status: 500 });
      }
    }

    const src = `/api/uploads/${storedName}`;
    setContentBulk([{ key, value: src }]);

    return NextResponse.json({ src }, { status: 201 });
  } catch (error) {
    console.error("Site content upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
