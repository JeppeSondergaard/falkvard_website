import { NextResponse } from "next/server";
import { getEnabledStencils } from "@/lib/stencils";

export async function GET() {
  const stencils = getEnabledStencils();
  return NextResponse.json(stencils.map((s) => ({ id: s.id, src: s.src })));
}
