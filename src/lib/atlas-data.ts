export const atlasDataBodies = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"] as const;

export type AtlasDataBody = (typeof atlasDataBodies)[number];

export type AtlasArchiveImage = {
  stage: number;
  title: string;
  year: string;
  caption: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
};

export type AtlasArchiveResponse = {
  body: AtlasDataBody;
  available: boolean;
  items: AtlasArchiveImage[];
};

export function isAtlasDataBody(value: string): value is AtlasDataBody {
  return (atlasDataBodies as readonly string[]).includes(value);
}

function readable(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function normaliseAtlasArchive(body: AtlasDataBody, value: unknown): AtlasArchiveImage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const stage = Number(record.stage);
    const sourceUrl = typeof record.original_url === "string" && /^https:\/\//.test(record.original_url) ? record.original_url : null;
    if (!Number.isInteger(stage) || stage < 1 || !sourceUrl) return [];
    return [{
      stage,
      title: readable(record.title, `${body} observation ${stage}`),
      year: readable(record.year === undefined || record.year === null ? undefined : String(record.year), "Archive"),
      caption: readable(record.caption, "Curated source image from the local Solar System archive."),
      source: readable(record.source, "Archive source"),
      sourceUrl,
      imageUrl: `/api/atlas-gallery/${body}/${stage}`,
    }];
  }).sort((a, b) => a.stage - b.stage);
}
