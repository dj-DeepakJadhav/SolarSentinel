import { NextResponse } from "next/server";
import { surfaceForTarget } from "@/src/lib/planet-surfaces";

export async function GET(_: Request, { params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  const surface = surfaceForTarget(target);
  if (!surface) return NextResponse.json({ error: "Unknown Atlas surface." }, { status: 404 });

  try {
    const response = await fetch(surface.renderTextureUrl ?? surface.imageUrl, { next: { revalidate: 604_800 }, signal: AbortSignal.timeout(8_000) });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/")) throw new Error("Surface image unavailable.");
    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "X-Solar-Atlas-Surface-Kind": surface.kind,
        "X-Solar-Atlas-Source": surface.provider,
        "X-Solar-Atlas-Render-Texture": surface.renderTextureCredit ?? surface.credit,
      },
    });
  } catch {
    return NextResponse.json({ error: "Planet surface is temporarily unavailable." }, { status: 503 });
  }
}
