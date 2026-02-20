import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";

const AGENT_SECRET = process.env.AGENT_SECRET;

function verifyAgent(req: NextRequest): boolean {
  if (!AGENT_SECRET) return true; // allow in dev without secret
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${AGENT_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!verifyAgent(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, phone, service, placement, size, description, reference_urls } = body;

  if (!name || !email || !service) {
    return NextResponse.json(
      { error: "name, email, and service are required" },
      { status: 400 },
    );
  }

  if (!["tatovering", "piercing", "konsultation"].includes(service)) {
    return NextResponse.json(
      { error: "service must be tatovering, piercing, or konsultation" },
      { status: 400 },
    );
  }

  const db = getDb();
  const id = uuid();

  db.prepare(`
    INSERT INTO bookings (id, name, email, phone, service, placement, size, description, reference_urls, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'agent')
  `).run(
    id,
    name,
    email,
    phone || null,
    service,
    placement || null,
    size || null,
    description || null,
    reference_urls || null,
  );

  return NextResponse.json({
    success: true,
    booking_id: id,
    message: `Booking oprettet for ${name}. Andrea vender tilbage med et tidspunkt. Booking-ID: ${id}`,
  });
}
