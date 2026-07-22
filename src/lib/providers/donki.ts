import { SnapshotSchema, type SpaceWeatherSnapshot } from "@/src/domain/space-weather";
import { historicalReplaySnapshot } from "@/src/lib/fixture";

const may2024Url = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/GST?startDate=2024-05-10&endDate=2024-05-12";
type GstEvent = { gstID?: string; startTime?: string; allKpIndex?: Array<{ observedTime?: string; kpIndex?: number; source?: string }>; link?: string; linkedEvents?: Array<{ activityID?: string }>; submissionTime?: string };

export type ReplayBeat = {
  id: string;
  observedAt: string;
  kpIndex: number;
};

export type May2024Replay = {
  snapshot: SpaceWeatherSnapshot;
  timeline: ReplayBeat[];
};

type DatedKp = { observedTime: string; kpIndex: number };

function isDatedKp(point: { observedTime?: string; kpIndex?: number }): point is DatedKp {
  return typeof point.observedTime === "string" && !Number.isNaN(Date.parse(point.observedTime)) && typeof point.kpIndex === "number" && Number.isFinite(point.kpIndex);
}

export function createReplayTimeline(payload: unknown): ReplayBeat[] {
  const event = Array.isArray(payload) ? payload[0] as GstEvent | undefined : undefined;
  const points = (event?.allKpIndex ?? []).filter(isDatedKp)
    .sort((a, b) => Date.parse(a.observedTime) - Date.parse(b.observedTime));
  if (!points.length) return [];

  // A restrained sequence: first, middle, and peak are all catalogued DONKI readings.
  const peakIndex = points.reduce((best, point, index) => point.kpIndex > points[best].kpIndex ? index : best, 0);
  const selected = [0, Math.floor((points.length - 1) / 2), peakIndex, points.length - 1]
    .filter((index, position, list) => list.indexOf(index) === position)
    .sort((a, b) => a - b);

  return selected.map((index) => ({ id: `${event?.gstID ?? "may-2024"}-${index}`, observedAt: points[index].observedTime, kpIndex: points[index].kpIndex }));
}

export function normalizeMay2024Replay(payload: unknown, fetchedAt = new Date().toISOString()): SpaceWeatherSnapshot {
  const event = Array.isArray(payload) ? payload[0] as GstEvent | undefined : undefined;
  const points = event?.allKpIndex ?? [];
  const kps = points.map((point) => point.kpIndex).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!event?.gstID || !event.startTime || !event.link || !kps.length) throw new Error("DONKI GST response did not contain the May 2024 event contract.");
  const peakKp = Math.max(...kps);
  const observedAt = points.find((point) => point.kpIndex === peakKp)?.observedTime ?? event.startTime;
  const linkedEventCount = event.linkedEvents?.length ?? 0;
  return SnapshotSchema.parse({
    id: event.gstID, capturedAt: event.startTime, status: "replay", kpObserved: peakKp, kpForecastMax: null,
    solarWindSpeedKms: null, solarWindDensityCm3: null, imfBzNt: null,
    activeAlerts: [{ message: `NASA DONKI catalogued this geomagnetic storm with a peak observed Kp of ${peakKp.toFixed(2)} and ${linkedEventCount} linked solar events.`, issuedAt: event.submissionTime ?? event.startTime, sourceUrl: event.link }],
    solarImage: { url: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg", fetchedAt, label: "SDO AIA 193 Å — current visual reference" },
    provenance: [
      { provider: "NASA_DONKI", productName: `DONKI geomagnetic storm ${event.gstID}`, sourceUrl: event.link, observedAt, issuedAt: event.submissionTime ?? null, fetchedAt, freshnessMinutes: null, layer: "observed" },
      { provider: "NASA_SDO", productName: "SDO AIA 193 Å", sourceUrl: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg", observedAt: null, issuedAt: null, fetchedAt, freshnessMinutes: null, layer: "observed" },
    ],
  });
}

function archivedTimeline(snapshot: SpaceWeatherSnapshot): ReplayBeat[] {
  return snapshot.kpObserved === null ? [] : [{ id: `${snapshot.id}-peak`, observedAt: snapshot.capturedAt, kpIndex: snapshot.kpObserved }];
}

export async function getMay2024Replay(): Promise<May2024Replay> {
  try {
    const response = await fetch(may2024Url, { signal: AbortSignal.timeout(8_000), next: { revalidate: 86_400 } });
    if (!response.ok) throw new Error(`DONKI returned ${response.status}`);
    const payload = await response.json();
    const snapshot = normalizeMay2024Replay(payload);
    const timeline = createReplayTimeline(payload);
    if (!timeline.length) throw new Error("DONKI GST response had no dated Kp readings.");
    return { snapshot, timeline };
  } catch { return { snapshot: historicalReplaySnapshot, timeline: archivedTimeline(historicalReplaySnapshot) }; }
}
