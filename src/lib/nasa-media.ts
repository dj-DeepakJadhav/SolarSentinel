type NasaImagePayload = {
  collection?: { items?: Array<{ data?: Array<{ nasa_id?: string; title?: string; description?: string }>; links?: Array<{ href?: string }> }> };
};

export type NasaMedia = { title: string; thumbnailUrl: string; sourceUrl: string };

export function parseNasaImage(payload: unknown): NasaMedia | null {
  const item = (payload as NasaImagePayload | null)?.collection?.items?.find((candidate) => {
    const thumbnail = candidate.links?.[0]?.href;
    return typeof candidate.data?.[0]?.nasa_id === "string" && typeof thumbnail === "string" && thumbnail.startsWith("https://images-assets.nasa.gov/");
  });
  const nasaId = item?.data?.[0]?.nasa_id;
  const thumbnailUrl = item?.links?.[0]?.href;
  if (!nasaId || !thumbnailUrl) return null;
  return { title: item.data?.[0]?.title?.trim() || nasaId, thumbnailUrl, sourceUrl: `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}` };
}
