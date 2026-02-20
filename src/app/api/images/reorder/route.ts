import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PUT(req: NextRequest) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { items } = body as { items: Array<{ id: string; sort_order: number }> };

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  const db = getDb();
  const update = db.prepare("UPDATE images SET sort_order = ? WHERE id = ?");

  const tx = db.transaction(() => {
    for (const item of items) {
      update.run(item.sort_order, item.id);
    }
  });

  tx();
  return NextResponse.json({ updated: items.length });
}
