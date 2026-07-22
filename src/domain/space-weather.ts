import { z } from "zod";

export const DataStatusSchema = z.enum(["live", "delayed", "cached", "replay", "unavailable"]);
export type DataStatus = z.infer<typeof DataStatusSchema>;

export const ProvenanceSchema = z.object({
  provider: z.enum(["NASA_SDO", "NASA_JPL", "NOAA_SWPC", "NASA_DONKI", "SOLAR_SENTINEL"]),
  productName: z.string(), sourceUrl: z.string().url(), observedAt: z.string().nullable(),
  issuedAt: z.string().nullable(), fetchedAt: z.string(), freshnessMinutes: z.number().nullable(),
  layer: z.enum(["observed", "official_forecast", "model_output", "simulated"]),
});
export type DataProvenance = z.infer<typeof ProvenanceSchema>;

export const SnapshotSchema = z.object({
  id: z.string(), capturedAt: z.string(), status: DataStatusSchema,
  kpObserved: z.number().min(0).max(9).nullable(), kpForecastMax: z.number().min(0).max(9).nullable(),
  solarWindSpeedKms: z.number().nullable(), solarWindDensityCm3: z.number().nullable(), imfBzNt: z.number().nullable(),
  aurora: z.object({ observationTime: z.string().nullable(), forecastTime: z.string().nullable(), globalMaxProbability: z.number().min(0).max(100), sourceUrl: z.string().url() }).nullable().default(null),
  activeAlerts: z.array(z.object({ message: z.string(), issuedAt: z.string(), sourceUrl: z.string().url() })),
  solarImage: z.object({ url: z.string().url(), fetchedAt: z.string(), label: z.string() }).nullable(),
  provenance: z.array(ProvenanceSchema),
});
export type SpaceWeatherSnapshot = z.infer<typeof SnapshotSchema>;

export const ScenarioLevelSchema = z.enum(["quiet", "elevated", "strong", "extreme"]);
export type ScenarioLevel = z.infer<typeof ScenarioLevelSchema>;

export const LearningModeSchema = z.enum(["student", "teacher"]);
export type LearningMode = z.infer<typeof LearningModeSchema>;

export const BriefingContentSchema = z.object({
  summary: z.string().max(380), observed: z.string().max(500), officialForecast: z.string().max(500),
  scenario: z.string().max(500), uncertainty: z.string().max(450),
});
export type BriefingContent = z.infer<typeof BriefingContentSchema>;

export const ExplanationSchema = BriefingContentSchema.extend({
  sourceNotes: z.array(z.object({ source: z.string(), timestampUtc: z.string(), url: z.string().url() })).max(8),
});
export type Explanation = z.infer<typeof ExplanationSchema>;

export const LocationSchema = z.object({
  id: z.string().min(1).max(160),
  name: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Location = z.infer<typeof LocationSchema>;

export const locations = [
  { id: "luebeck", name: "Lübeck", country: "Germany", latitude: 53.8655, longitude: 10.6866 },
  { id: "delhi", name: "Delhi", country: "India", latitude: 28.6139, longitude: 77.2090 },
  { id: "bengaluru", name: "Bengaluru", country: "India", latitude: 12.9716, longitude: 77.5946 },
] as const satisfies readonly Location[];
