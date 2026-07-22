import type { DataStatus } from "@/src/domain/space-weather";

const HORIZONS_API = "https://ssd.jpl.nasa.gov/api/horizons.api";
export const horizonsSourceUrl = "https://ssd.jpl.nasa.gov/horizons/";

type BodyDefinition = {
  id: "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "moon";
  name: string;
  command: string;
  center: string;
  kind: "planet" | "dwarf" | "moon";
  color: string;
  size: number;
  orbitAu: number;
  sourceUrl: string;
};

export type EphemerisBody = Omit<BodyDefinition, "command" | "center"> & {
  positionAu: readonly [number, number, number];
  velocityAuPerDay: readonly [number, number, number];
};

export type SolarSystemSnapshot = {
  capturedAt: string;
  ephemerisTime: string;
  status: Extract<DataStatus, "live" | "cached" | "unavailable">;
  bodies: EphemerisBody[];
  sourceUrl: string;
};

const planetSource = "https://science.nasa.gov/solar-system/planets/";
const bodies: readonly BodyDefinition[] = [
  { id: "mercury", name: "Mercury", command: "199", center: "@sun", kind: "planet", color: "#c7b6a1", size: .07, orbitAu: .39, sourceUrl: `${planetSource}mercury/` },
  { id: "venus", name: "Venus", command: "299", center: "@sun", kind: "planet", color: "#e8bf7d", size: .1, orbitAu: .72, sourceUrl: `${planetSource}venus/` },
  { id: "earth", name: "Earth", command: "399", center: "@sun", kind: "planet", color: "#5ba8ff", size: .12, orbitAu: 1, sourceUrl: `${planetSource}earth/` },
  { id: "mars", name: "Mars", command: "499", center: "@sun", kind: "planet", color: "#df6d4f", size: .085, orbitAu: 1.52, sourceUrl: `${planetSource}mars/` },
  { id: "jupiter", name: "Jupiter", command: "599", center: "@sun", kind: "planet", color: "#d9a878", size: .23, orbitAu: 5.2, sourceUrl: `${planetSource}jupiter/` },
  { id: "saturn", name: "Saturn", command: "699", center: "@sun", kind: "planet", color: "#e6ce91", size: .2, orbitAu: 9.58, sourceUrl: `${planetSource}saturn/` },
  { id: "uranus", name: "Uranus", command: "799", center: "@sun", kind: "planet", color: "#90d9e2", size: .15, orbitAu: 19.2, sourceUrl: `${planetSource}uranus/` },
  { id: "neptune", name: "Neptune", command: "899", center: "@sun", kind: "planet", color: "#5b85df", size: .15, orbitAu: 30.05, sourceUrl: `${planetSource}neptune/` },
  { id: "pluto", name: "Pluto", command: "999", center: "@sun", kind: "dwarf", color: "#bb8d74", size: .07, orbitAu: 39.48, sourceUrl: "https://science.nasa.gov/dwarf-planets/pluto/" },
  { id: "moon", name: "Moon", command: "301", center: "399", kind: "moon", color: "#c8cfdb", size: .055, orbitAu: .00257, sourceUrl: "https://science.nasa.gov/moon/" },
] as const;

type HorizonsPayload = { signature?: { source?: string; version?: string }; result?: string };
export type HorizonsVector = { position: readonly [number, number, number]; velocity: readonly [number, number, number] };

const scientificNumber = "([-+]?\\d+(?:\\.\\d+)?(?:E[-+]?\\d+)?)";

export function parseHorizonsVector(payload: unknown): HorizonsVector {
  const candidate = (payload as HorizonsPayload | null)?.result;
  const result = typeof candidate === "string" ? candidate : "";
  const body = result.split("$$SOE")[1]?.split("$$EOE")[0] ?? "";
  const position = body.match(new RegExp(`X\\s*=\\s*${scientificNumber}\\s+Y\\s*=\\s*${scientificNumber}\\s+Z\\s*=\\s*${scientificNumber}`));
  const velocity = body.match(new RegExp(`VX\\s*=\\s*${scientificNumber}\\s+VY\\s*=\\s*${scientificNumber}\\s+VZ\\s*=\\s*${scientificNumber}`));
  if (!position || !velocity) throw new Error("Horizons response did not contain a Cartesian state vector.");
  const values = [...position.slice(1), ...velocity.slice(1)].map(Number);
  if (values.some((value) => !Number.isFinite(value))) throw new Error("Horizons response contained an invalid state vector.");
  return { position: [values[0], values[1], values[2]], velocity: [values[3], values[4], values[5]] };
}

function queryTime(reference = new Date()) {
  const start = reference.toISOString().replace("T", " ").slice(0, 16);
  const stop = new Date(reference.valueOf() + 60_000).toISOString().replace("T", " ").slice(0, 16);
  return { start, stop };
}

async function fetchBody(definition: BodyDefinition, start: string, stop: string): Promise<EphemerisBody> {
  const params = new URLSearchParams({
    format: "json", COMMAND: `'${definition.command}'`, CENTER: `'${definition.center}'`, EPHEM_TYPE: "VECTORS",
    START_TIME: `'${start}'`, STOP_TIME: `'${stop}'`, STEP_SIZE: "'1 m'", TIME_TYPE: "UT", OUT_UNITS: "AU-D", REF_PLANE: "ECLIPTIC", VEC_CORR: "NONE", OBJ_DATA: "NO",
  });
  const response = await fetch(`${HORIZONS_API}?${params}`, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Horizons returned ${response.status} for ${definition.name}.`);
  const payload = await response.json() as HorizonsPayload;
  if (!payload.signature?.source?.includes("NASA/JPL Horizons")) throw new Error("Horizons response signature was not recognised.");
  const vector = parseHorizonsVector(payload);
  const { command: _, center: __, ...body } = definition;
  return { ...body, positionAu: vector.position, velocityAuPerDay: vector.velocity };
}

function approximateBody(definition: BodyDefinition, reference: Date): EphemerisBody {
  const index = bodies.findIndex((body) => body.id === definition.id);
  const periodDays = definition.id === "moon" ? 27.3 : Math.max(88, Math.pow(definition.orbitAu, 1.5) * 365.25);
  const phase = (reference.valueOf() / 86_400_000 / periodDays * Math.PI * 2 + index * .71) % (Math.PI * 2);
  const speed = Math.PI * 2 * definition.orbitAu / periodDays;
  const { command: _, center: __, ...body } = definition;
  return { ...body, positionAu: [Math.cos(phase) * definition.orbitAu, Math.sin(phase) * definition.orbitAu, 0], velocityAuPerDay: [-Math.sin(phase) * speed, Math.cos(phase) * speed, 0] };
}

let lastKnownGood: SolarSystemSnapshot | null = null;

export async function getSolarSystemSnapshot(reference = new Date()): Promise<SolarSystemSnapshot> {
  const { start, stop } = queryTime(reference);
  try {
    const resolvedBodies: EphemerisBody[] = [];
    for (const body of bodies) resolvedBodies.push(await fetchBody(body, start, stop));
    const snapshot: SolarSystemSnapshot = { capturedAt: reference.toISOString(), ephemerisTime: `${start} UT`, status: "live", bodies: resolvedBodies, sourceUrl: horizonsSourceUrl };
    lastKnownGood = snapshot;
    return snapshot;
  } catch {
    if (lastKnownGood) return { ...lastKnownGood, status: "cached" };
    return { capturedAt: reference.toISOString(), ephemerisTime: `${start} UT`, status: "unavailable", bodies: bodies.map((body) => approximateBody(body, reference)), sourceUrl: horizonsSourceUrl };
  }
}
