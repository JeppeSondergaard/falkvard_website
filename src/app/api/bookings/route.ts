import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendBookingNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, service, placement, size, description, reference_urls, source } = body;

  if (!name || !email || !service) {
    return NextResponse.json(
      { error: "name, email og service er påkrævet" },
      { status: 400 },
    );
  }

  const db = getDb();
  const id = uuid();

  db.prepare(`
    INSERT INTO bookings (id, name, email, phone, service, placement, size, description, reference_urls, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, email, phone || null, service, placement || null, size || null, description || null, reference_urls || null, source || "web");

  sendBookingNotification({
    id,
    name,
    email,
    phone: phone || null,
    service,
    placement: placement || null,
    size: size || null,
    description: description || null,
    reference_urls: reference_urls || null,
    chat_history: null,
    source: (source as "web" | "agent") || "web",
  }).catch((err) => console.error("[bookings] Email error:", err));

  return NextResponse.json({ id, status: "pending" }, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const db = getDb();

  const rows = status
    ? db.prepare("SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC").all(status)
    : db.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();

  return NextResponse.json(rows);
}
