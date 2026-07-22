import { NextResponse } from "next/server";
import { atlasChapters } from "@/src/lib/atlas";
import { parseSourcePreview } from "@/src/lib/source-preview";

const sourceUrls = new Set([
  ...atlasChapters.flatMap((chapter) => chapter.sources.map((source) => source.url)),
  "https://science.nasa.gov/moon/image-galleries/",
]);
const trustedAssetHosts = new Set([
  "science.nasa.gov", "images-assets.nasa.gov", "www.esa.int", "sci.esa.int", "global.jaxa.jp", "www.isro.gov.in", "www.emiratesmarsmission.ae", "sdo.gsfc.nasa.gov", "maps.jpl.nasa.gov", "ssd.jpl.nasa.gov",
]);

export async function GET(request: Request) {
  const sourceUrl = new URL(request.url).searchParams.get("url");
  if (!sourceUrl || !sourceUrls.has(sourceUrl)) return NextResponse.json({ error: "Unknown source preview." }, { status: 400 });
  try {
    const page = await fetch(sourceUrl, { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8_000) });
    const contentType = page.headers.get("content-type") ?? "";
    if (!page.ok || !contentType.includes("text/html")) throw new Error("Source page unavailable.");
    const imageUrl = parseSourcePreview(await page.text(), sourceUrl);
    if (!imageUrl || !trustedAssetHosts.has(new URL(imageUrl).hostname)) throw new Error("No trusted image preview.");
    const image = await fetch(imageUrl, { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(8_000) });
    const imageType = image.headers.get("content-type") ?? "";
    if (!image.ok || !imageType.startsWith("image/")) throw new Error("Preview image unavailable.");
    return new NextResponse(await image.arrayBuffer(), { headers: { "Content-Type": imageType, "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  } catch {
    return NextResponse.json({ error: "Source preview is temporarily unavailable." }, { status: 503 });
  }
}
