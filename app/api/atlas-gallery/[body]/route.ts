import { NextResponse } from "next/server";
import { loadAtlasArchive } from "@/src/lib/atlas-data.server";

export async function GET(_: Request, { params }: { params: Promise<{ body: string }> }) {
  const { body } = await params;
  const archive = await loadAtlasArchive(body);
  if (!archive) return NextResponse.json({ error: "Unknown archive body." }, { status: 404 });
  return NextResponse.json(archive, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
}
