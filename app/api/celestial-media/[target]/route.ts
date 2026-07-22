import { NextResponse } from "next/server";
import { parseNasaImage } from "@/src/lib/nasa-media";

const queries: Record<string, string> = {
  sun: "Sun Solar Dynamics Observatory", mercury: "Mercury planet", venus: "Venus planet", earth: "Earth planet", moon: "Moon", mars: "Mars planet", jupiter: "Jupiter planet", saturn: "Saturn planet", uranus: "Uranus planet", neptune: "Neptune planet", pluto: "Pluto New Horizons", spacecraft: "Solar Dynamics Observatory spacecraft",
};

export async function GET(_: Request, { params }: { params: Promise<{ target: string }> }) {
  const { target } = await params;
  const query = queries[target];
  if (!query) return NextResponse.json({ error: "Unknown celestial target." }, { status: 404 });
  try {
    const response = await fetch(`https://images-api.nasa.gov/search?${new URLSearchParams({ q: query, media_type: "image", page_size: "1" })}`, { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`NASA Image Library returned ${response.status}.`);
    const image = parseNasaImage(await response.json());
    if (!image) throw new Error("NASA Image Library returned no usable image.");
    return NextResponse.json(image, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return NextResponse.json({ error: "NASA Image Library is temporarily unavailable." }, { status: 503 });
  }
}
