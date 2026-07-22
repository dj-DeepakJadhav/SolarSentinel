import "server-only";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { isAtlasDataBody, normaliseAtlasArchive, type AtlasArchiveImage, type AtlasDataBody, type AtlasArchiveResponse } from "@/src/lib/atlas-data";

const defaultDataRoot = resolve(/* turbopackIgnore: true */ process.cwd(), "..", "SolarSystemData", "data");
const dataRoot = resolve(process.env.SOLAR_SYSTEM_DATA_ROOT ?? defaultDataRoot);

type RawBodyProfile = { gallery?: unknown };

function safeArchivePath(relativePath: string) {
  const absolutePath = resolve(dataRoot, relativePath);
  if (!absolutePath.startsWith(`${dataRoot}${sep}`)) throw new Error("Archive path is outside the configured data root.");
  return absolutePath;
}

async function readProfile(body: AtlasDataBody): Promise<RawBodyProfile | null> {
  try {
    return JSON.parse(await readFile(safeArchivePath(`bodies/${body}/body_profile.json`), "utf8")) as RawBodyProfile;
  } catch {
    return null;
  }
}

export async function loadAtlasArchive(bodyValue: string): Promise<AtlasArchiveResponse | null> {
  if (!isAtlasDataBody(bodyValue)) return null;
  const profile = await readProfile(bodyValue);
  return { body: bodyValue, available: Boolean(profile), items: normaliseAtlasArchive(bodyValue, profile?.gallery) };
}

export async function loadAtlasArchiveImage(bodyValue: string, stageValue: string): Promise<Uint8Array | null> {
  const archive = await loadAtlasArchive(bodyValue);
  const stage = Number(stageValue);
  if (!archive || !Number.isInteger(stage)) return null;
  const item = archive.items.find((candidate) => candidate.stage === stage);
  if (!item) return null;
  try {
    return new Uint8Array(await readFile(safeArchivePath(`bodies/${archive.body}/gallery/${String(stage).padStart(2, "0")}_progress.jpg`)));
  } catch {
    return null;
  }
}
