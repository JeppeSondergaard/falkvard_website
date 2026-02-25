import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getFolderByIdFromDb, deleteFolder } from "@/lib/images";

type Params = { params: Promise<{ id: string }> };

const PROTECTED_FOLDERS = ["frontpage", "unsorted"];

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const folder = getFolderByIdFromDb(id);

  if (!folder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (PROTECTED_FOLDERS.includes(id)) {
    return NextResponse.json({ error: "Cannot delete this folder" }, { status: 403 });
  }

  deleteFolder(id);
  return NextResponse.json({ deleted: true });
}
