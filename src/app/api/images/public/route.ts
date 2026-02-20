import { NextRequest, NextResponse } from "next/server";
import { getGalleryImages, getFrontpageImages, getEnabledImages } from "@/lib/images";

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get("location");

  if (location === "frontpage") {
    return NextResponse.json(getFrontpageImages());
  }

  if (location === "gallery") {
    return NextResponse.json(getGalleryImages());
  }

  const folder = req.nextUrl.searchParams.get("folder") || undefined;
  return NextResponse.json(getEnabledImages(folder));
}
