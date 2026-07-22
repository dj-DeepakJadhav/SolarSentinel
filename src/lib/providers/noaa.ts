import { SnapshotSchema, type DataProvenance, type SpaceWeatherSnapshot } from "@/src/domain/space-weather";
import { demoSnapshot } from "@/src/lib/fixture";

const NOAA = "https://services.swpc.noaa.gov";
const endpoints = {
  kp: `${NOAA}/json/planetary_k_index_1m.json`,
  forecast: `${NOAA}/products/noaa-planetary-k-index-forecast.json`,
  wind: `${NOAA}/products/summary/solar-wind-speed.json`,
  magneticField: `${NOAA}/products/summary/solar-wind-mag-field.json`,
  alerts: `${NOAA}/products/alerts.json`,
  aurora: `${NOAA}/json/ovation_aurora_latest.json`,
} as const;

type KpRow = { time_tag?: string; kp_index?: number };
type ForecastRow = { time_tag?: string; kp?: number; observed?: string | null };
type WindRow = { time_tag?: string; proton_speed?: number };
type MagneticRow = { time_tag?: string; bz_gsm?: number };
type AlertRow = { issue_datetime?: string; message?: string; product_id?: string };
type AuroraPayload = { "Observation Time"?: string; "Forecast Time"?: string; coordinates?: unknown };

function asArray<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }
function last<T>(values: T[]): T | undefined { return values.at(-1); }
function numberOrNull(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function toUtc(value: string | undefined): string | null { if (!value) return null; const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`); return Number.isNaN(date.valueOf()) ? null : date.toISOString(); }
function freshnessMinutes(timestamp: string | null, reference: string): number | null {
  if (!timestamp) return null;
  const age = (Date.parse(reference) - Date.parse(timestamp)) / 60_000;
  return Number.isFinite(age) ? Math.max(0, Math.round(age)) : null;
}

function normalizeAurora(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const payload = value as AuroraPayload;
  const coordinates = asArray<unknown>(payload.coordinates);
  let globalMaxProbability = 0;
  for (const coordinate of coordinates) {
    if (!Array.isArray(coordinate)) continue;
    const probability = numberOrNull(coordinate[2]);
    if (probability !== null) globalMaxProbability = Math.max(globalMaxProbability, probability);
  }
  if (coordinates.length === 0) return null;
  return { observationTime: toUtc(payload["Observation Time"]), forecastTime: toUtc(payload["Forecast Time"]), globalMaxProbability, sourceUrl: endpoints.aurora };
}

export function normalizeNoaaPayloads(input: { kp: unknown; forecast: unknown; wind: unknown; magneticField: unknown; alerts: unknown; aurora?: unknown; fetchedAt?: string }): SpaceWeatherSnapshot {
  const fetchedAt = input.fetchedAt ?? new Date().toISOString();
  const currentKp = last(asArray<KpRow>(input.kp));
  const forecastRows = asArray<ForecastRow>(input.forecast).filter((row) => row.observed !== "observed");
  const forecastKp = forecastRows.map((row) => numberOrNull(row.kp)).filter((value): value is number => value !== null);
  const wind = last(asArray<WindRow>(input.wind));
  const magnetic = last(asArray<MagneticRow>(input.magneticField));
  const kpObservedAt = toUtc(currentKp?.time_tag);
  const windObservedAt = toUtc(wind?.time_tag);
  const magneticObservedAt = toUtc(magnetic?.time_tag);
  const kpFreshness = freshnessMinutes(kpObservedAt, fetchedAt);
  const alertCutoff = Date.parse(fetchedAt) - 36 * 60 * 60 * 1_000;
  const alerts = asArray<AlertRow>(input.alerts).flatMap((alert) => {
    const issuedAt = toUtc(alert.issue_datetime);
    return alert.message && issuedAt && Date.parse(issuedAt) >= alertCutoff ? [{ message: alert.message.slice(0, 800), issuedAt, sourceUrl: endpoints.alerts }] : [];
  }).slice(0, 3);
  const aurora = normalizeAurora(input.aurora);
  const provenance: DataProvenance[] = [
    { provider: "NASA_SDO", productName: "SDO AIA 193 Å", sourceUrl: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg", observedAt: null, issuedAt: null, fetchedAt, freshnessMinutes: null, layer: "observed" },
    { provider: "NOAA_SWPC", productName: "Planetary K-index, 1 minute", sourceUrl: endpoints.kp, observedAt: kpObservedAt, issuedAt: null, fetchedAt, freshnessMinutes: kpFreshness, layer: "observed" },
    { provider: "NOAA_SWPC", productName: "Solar-wind speed", sourceUrl: endpoints.wind, observedAt: windObservedAt, issuedAt: null, fetchedAt, freshnessMinutes: freshnessMinutes(windObservedAt, fetchedAt), layer: "observed" },
    { provider: "NOAA_SWPC", productName: "Interplanetary magnetic field", sourceUrl: endpoints.magneticField, observedAt: magneticObservedAt, issuedAt: null, fetchedAt, freshnessMinutes: freshnessMinutes(magneticObservedAt, fetchedAt), layer: "observed" },
    { provider: "NOAA_SWPC", productName: "NOAA planetary K-index forecast", sourceUrl: endpoints.forecast, observedAt: null, issuedAt: toUtc(last(forecastRows)?.time_tag), fetchedAt, freshnessMinutes: null, layer: "official_forecast" },
  ];
  if (aurora) provenance.push({ provider: "NOAA_SWPC", productName: "OVATION aurora model", sourceUrl: endpoints.aurora, observedAt: aurora.observationTime, issuedAt: aurora.forecastTime, fetchedAt, freshnessMinutes: freshnessMinutes(aurora.observationTime, fetchedAt), layer: "model_output" });
  return SnapshotSchema.parse({
    id: `noaa-${fetchedAt}`, capturedAt: fetchedAt, status: kpFreshness !== null && kpFreshness > 30 ? "delayed" : "live", kpObserved: numberOrNull(currentKp?.kp_index),
    kpForecastMax: forecastKp.length ? Math.max(...forecastKp) : null, solarWindSpeedKms: numberOrNull(wind?.proton_speed),
    solarWindDensityCm3: null, imfBzNt: numberOrNull(magnetic?.bz_gsm), aurora, activeAlerts: alerts,
    solarImage: { url: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg", fetchedAt, label: "SDO AIA 193 Å — latest available" }, provenance,
  });
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(8_000), headers: { Accept: "application/json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`NOAA returned ${response.status} for ${url}`);
  return response.json();
}

let lastKnownGood: SpaceWeatherSnapshot | null = null;

export async function getSpaceWeatherSnapshot(): Promise<SpaceWeatherSnapshot> {
  try {
    const [kp, forecast, wind, magneticField, alerts, aurora] = await Promise.all([
      fetchJson(endpoints.kp), fetchJson(endpoints.forecast), fetchJson(endpoints.wind), fetchJson(endpoints.magneticField),
      fetchJson(endpoints.alerts).catch(() => []), fetchJson(endpoints.aurora).catch(() => null),
    ]);
    const snapshot = normalizeNoaaPayloads({ kp, forecast, wind, magneticField, alerts, aurora });
    if (snapshot.kpObserved === null) throw new Error("NOAA Kp payload did not contain a current measurement.");
    lastKnownGood = snapshot;
    return snapshot;
  } catch {
    if (lastKnownGood) return { ...lastKnownGood, status: "cached" };
    return demoSnapshot;
  }
}
