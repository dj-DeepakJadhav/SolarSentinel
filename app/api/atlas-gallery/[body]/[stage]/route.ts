import { NextResponse } from "next/server";
import { loadAtlasArchiveImage } from "@/src/lib/atlas-data.server";

export async function GET(_: Request, { params }: { params: Promise<{ body: string; stage: string }> }) {
  const { body, stage } = await params;
  const image = await loadAtlasArchiveImage(body, stage);
  if (!image) return NextResponse.json({ error: "Archive image unavailable." }, { status: 404 });
  const responseBody = new ArrayBuffer(image.byteLength);
  new Uint8Array(responseBody).set(image);
  return new NextResponse(responseBody, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
