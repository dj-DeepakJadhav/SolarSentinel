export function parseSourcePreview(html: string, sourceUrl: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const property = tag.match(/\b(?:property|name)=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (property !== "og:image" && property !== "twitter:image") continue;
    const content = tag.match(/\bcontent=["']([^"']+)["']/i)?.[1];
    if (!content) continue;
    try {
      const image = new URL(content, sourceUrl);
      if (image.protocol === "https:") return image.toString();
    } catch {
      continue;
    }
  }
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imageTags) {
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src || /(?:logo|menu|arrow|icon)\.(?:svg|png|webp)/i.test(src) || !/\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(src)) continue;
    try {
      const image = new URL(src, sourceUrl);
      if (image.protocol === "https:") return image.toString();
    } catch {
      continue;
    }
  }
  return null;
}
