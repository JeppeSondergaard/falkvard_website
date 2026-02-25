import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { sendBookingNotification } from "@/lib/email";

const AGENT_SECRET = process.env.AGENT_SECRET;

function verifyRequest(req: NextRequest): boolean {
  if (!AGENT_SECRET) return true;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${AGENT_SECRET}`) return true;

  const origin = req.headers.get("origin") || "";
  const host = req.headers.get("host") || "";
  if (origin && host && origin.includes(host)) return true;

  const referer = req.headers.get("referer") || "";
  if (referer && host && referer.includes(host)) return true;

  return false;
}

export async function POST(req: NextRequest) {
  console.log("[agent/booking] POST received");
  console.log("[agent/booking] Headers — origin:", req.headers.get("origin"), "host:", req.headers.get("host"), "referer:", req.headers.get("referer"), "auth:", req.headers.get("authorization")?.slice(0, 20));

  if (!verifyRequest(req)) {
    console.error("[agent/booking] Auth FAILED");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log("[agent/booking] Auth OK");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (err) {
    console.error("[agent/booking] JSON parse error:", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log("[agent/booking] Body keys:", Object.keys(body));
  console.log("[agent/booking] name:", body.name, "email:", body.email, "service:", body.service);

  const { name, email, phone, service, placement, size, description, reference_urls, chat_history } = body as Record<string, string | undefined>;

  if (!name || !email || !service) {
    console.error("[agent/booking] Missing required fields — name:", !!name, "email:", !!email, "service:", !!service);
    return NextResponse.json(
      { error: "name, email, and service are required" },
      { status: 400 },
    );
  }

  if (!["tatovering", "piercing", "konsultation"].includes(service)) {
    console.error("[agent/booking] Invalid service:", service);
    return NextResponse.json(
      { error: "service must be tatovering, piercing, or konsultation" },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const id = uuid();

    const chatJson = chat_history
      ? (typeof chat_history === "string" ? chat_history : JSON.stringify(chat_history))
      : null;

    db.prepare(`
      INSERT INTO bookings (id, name, email, phone, service, placement, size, description, reference_urls, chat_history, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agent')
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
      chatJson,
    );

    console.log("[agent/booking] Booking created:", id);

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
      chat_history: chatJson,
      source: "agent",
    }).catch((err) => console.error("[agent/booking] Email error:", err));

    return NextResponse.json({
      success: true,
      booking_id: id,
      message: `Booking oprettet for ${name}. Andrea vender tilbage med et tidspunkt. Booking-ID: ${id}`,
    });
  } catch (err) {
    console.error("[agent/booking] DB error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
