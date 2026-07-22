import { NextResponse } from "next/server";

const channels = {
  "193": "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg",
  magnetogram: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIBC.jpg",
} as const;

export async function GET(_: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const sourceUrl = channels[channel as keyof typeof channels];
  if (!sourceUrl) return NextResponse.json({ error: "Unknown SDO channel." }, { status: 404 });
  try {
    const source = await fetch(sourceUrl, { next: { revalidate: 600 } });
    if (!source.ok) throw new Error(`SDO returned ${source.status}`);
    return new NextResponse(source.body, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=600, s-maxage=600", "X-Solar-Sentinel-Source": "NASA SDO", "X-Solar-Sentinel-Image-Updated": source.headers.get("last-modified") ?? "unknown" } });
  } catch {
    return NextResponse.json({ error: "Latest NASA SDO image is temporarily unavailable." }, { status: 503 });
  }
}
