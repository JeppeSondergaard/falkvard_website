import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, createAdminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Forkert adgangskode" }, { status: 401 });
  }

  const token = createAdminToken();
  return NextResponse.json({ token });
}
