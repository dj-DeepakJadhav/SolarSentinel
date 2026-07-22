import { SnapshotSchema, type SpaceWeatherSnapshot } from "@/src/domain/space-weather";

export const demoSnapshot: SpaceWeatherSnapshot = SnapshotSchema.parse({
  id: "demo-elevated-2026-07-17", capturedAt: "2026-07-17T10:20:00Z", status: "cached",
  kpObserved: 4.0, kpForecastMax: 5.0, solarWindSpeedKms: 523, solarWindDensityCm3: 6.1, imfBzNt: -3.2,
  activeAlerts: [],
  solarImage: { url: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg", fetchedAt: "2026-07-17T10:10:00Z", label: "SDO AIA 193 Å" },
  provenance: [
    { provider: "NASA_SDO", productName: "SDO AIA 193 Å", sourceUrl: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg", observedAt: null, issuedAt: null, fetchedAt: "2026-07-17T10:10:00Z", freshnessMinutes: 10, layer: "observed" },
    { provider: "NOAA_SWPC", productName: "Planetary K-index", sourceUrl: "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json", observedAt: "2026-07-17T10:15:00Z", issuedAt: null, fetchedAt: "2026-07-17T10:20:00Z", freshnessMinutes: 5, layer: "observed" },
    { provider: "NOAA_SWPC", productName: "NOAA planetary K-index forecast", sourceUrl: "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json", observedAt: null, issuedAt: "2026-07-17T09:00:00Z", fetchedAt: "2026-07-17T10:20:00Z", freshnessMinutes: 80, layer: "official_forecast" },
  ],
});

export const historicalReplaySnapshot: SpaceWeatherSnapshot = SnapshotSchema.parse({
  id: "replay-2024-05-11", capturedAt: "2024-05-11T00:00:00Z", status: "replay",
  kpObserved: 9, kpForecastMax: 9, solarWindSpeedKms: 800, solarWindDensityCm3: 18, imfBzNt: -35,
  activeAlerts: [{ message: "Historical replay: NOAA recorded severe geomagnetic-storm conditions during this May 2024 event.", issuedAt: "2024-05-11T00:00:00Z", sourceUrl: "https://www.swpc.noaa.gov/news/g5-conditions-reached-yet-again" }],
  solarImage: { url: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg", fetchedAt: "2024-05-11T00:00:00Z", label: "Replay visual — SDO reference image" },
  provenance: [
    { provider: "NASA_DONKI", productName: "May 2024 geomagnetic-storm replay", sourceUrl: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/", observedAt: "2024-05-11T00:00:00Z", issuedAt: null, fetchedAt: "2024-05-11T00:00:00Z", freshnessMinutes: null, layer: "observed" },
    { provider: "NOAA_SWPC", productName: "Historical NOAA event context", sourceUrl: "https://www.swpc.noaa.gov/news/g5-conditions-reached-yet-again", observedAt: "2024-05-11T00:00:00Z", issuedAt: "2024-05-11T00:00:00Z", fetchedAt: "2024-05-11T00:00:00Z", freshnessMinutes: null, layer: "official_forecast" },
  ],
});

export function createUnavailableSnapshot(capturedAt = new Date().toISOString()): SpaceWeatherSnapshot {
  return SnapshotSchema.parse({
    id: `unavailable-${capturedAt}`, capturedAt, status: "unavailable",
    kpObserved: null, kpForecastMax: null, solarWindSpeedKms: null, solarWindDensityCm3: null, imfBzNt: null,
    activeAlerts: [], solarImage: null,
    provenance: [{ provider: "SOLAR_SENTINEL", productName: "Solar Sentinel local fallback", sourceUrl: "https://github.com/", observedAt: null, issuedAt: null, fetchedAt: capturedAt, freshnessMinutes: null, layer: "model_output" }],
  });
}
