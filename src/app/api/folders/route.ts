import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllFolders, getGalleryFolders, getFolderByIdFromDb, createFolder } from "@/lib/images";

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");

  if (scope === "gallery") {
    return NextResponse.json(getGalleryFolders());
  }

  if (!requireAdmin(req.headers)) {
    return NextResponse.json(getGalleryFolders());
  }

  return NextResponse.json(getAllFolders());
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, label, icon, show_in_gallery } = body;

  if (!id || !label) {
    return NextResponse.json({ error: "id and label are required" }, { status: 400 });
  }

  const idClean = String(id).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!idClean) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  if (getFolderByIdFromDb(idClean)) {
    return NextResponse.json({ error: "Folder already exists" }, { status: 409 });
  }

  const folder = createFolder(idClean, label, icon || "📁", show_in_gallery !== false);
  return NextResponse.json(folder, { status: 201 });
}
