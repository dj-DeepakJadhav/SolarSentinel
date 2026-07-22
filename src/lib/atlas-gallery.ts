import type { AtlasChapter, AtlasSource } from "@/src/lib/atlas";
import { isAtlasDataBody, type AtlasArchiveImage } from "@/src/lib/atlas-data";

export type AtlasGalleryItem = {
  id: string;
  title: string;
  agency: string;
  mission: string;
  sourceUrl: string;
  previewUrl: string;
  fallbackUrl: string;
  note: string;
};

const sourcePreview = (sourceUrl: string) => `/api/source-preview?url=${encodeURIComponent(sourceUrl)}`;

function bodyVisual(chapter: AtlasChapter) {
  if (chapter.focus === "sun" || chapter.focus === "spacecraft") return "/api/solar-image/193";
  if (chapter.focus === "system") return "/api/solar-image/193";
  return `/api/planet-surface/${chapter.focus}`;
}

function primaryItem(chapter: AtlasChapter): AtlasGalleryItem {
  const isSolar = chapter.focus === "sun" || chapter.focus === "spacecraft";
  const isSystem = chapter.focus === "system";
  return {
    id: `${chapter.id}-primary`,
    title: isSolar ? "Latest solar frame" : isSystem ? "Orbital map reference" : `${chapter.title.replace("\n", " ")} surface`,
    agency: "NASA / JPL",
    mission: isSolar ? "Solar Dynamics Observatory" : isSystem ? "Horizons" : "Planetary map catalog",
    sourceUrl: isSolar ? "https://sdo.gsfc.nasa.gov/data/" : isSystem ? "https://ssd.jpl.nasa.gov/horizons/" : "https://maps.jpl.nasa.gov/tmaps/",
    previewUrl: bodyVisual(chapter),
    fallbackUrl: bodyVisual(chapter),
    note: isSolar ? "Latest available SDO AIA 193 Å image." : isSystem ? "Current body positions are supplied separately by Horizons." : "Reviewed body surface or explicitly labelled visual reference.",
  };
}

function sourceItem(chapter: AtlasChapter, source: AtlasSource, index: number): AtlasGalleryItem {
  const label = chapter.title.replace("\n", " ");
  return {
    id: `${chapter.id}-${source.agency}-${source.mission}-${index}`,
    title: label,
    agency: source.agency,
    mission: source.mission,
    sourceUrl: source.url,
    previewUrl: source.role === "live image" ? "/api/solar-image/193" : sourcePreview(source.url),
    fallbackUrl: bodyVisual(chapter),
    note: source.note ?? "Mission-page imagery is shown when an official preview is available; otherwise the reviewed body visual remains in view.",
  };
}

export function galleryForChapter(chapter: AtlasChapter): readonly AtlasGalleryItem[] {
  const sources = chapter.sources.filter((source) => source.url !== primaryItem(chapter).sourceUrl);
  const items = [primaryItem(chapter), ...sources.map((source, index) => sourceItem(chapter, source, index))];
  if (chapter.id === "earth") {
    items.push({
      id: "earth-moon-gallery",
      title: "Earth’s Moon",
      agency: "NASA",
      mission: "Lunar Reconnaissance Orbiter",
      sourceUrl: "https://science.nasa.gov/moon/image-galleries/",
      previewUrl: sourcePreview("https://science.nasa.gov/moon/image-galleries/"),
      fallbackUrl: "/api/planet-surface/earth",
      note: "Moon imagery belongs to its own archive card; the overview keeps Moon systems for detailed views.",
    });
  }
  return items;
}

export function archiveBodyForChapter(chapter: AtlasChapter) {
  if (chapter.focus === "spacecraft") return "sun";
  return isAtlasDataBody(chapter.focus) ? chapter.focus : null;
}

export function localArchiveItems(chapter: AtlasChapter, archive: readonly AtlasArchiveImage[]): AtlasGalleryItem[] {
  return archive.map((item) => ({
    id: `${chapter.id}-local-${item.stage}`,
    title: item.title,
    agency: item.source,
    mission: item.title,
    sourceUrl: item.sourceUrl,
    previewUrl: item.imageUrl,
    fallbackUrl: bodyVisual(chapter),
    note: `${item.year} · ${item.caption}`,
  }));
}
