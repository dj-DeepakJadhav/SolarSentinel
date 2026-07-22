import { describe, expect, it } from "vitest";
import { normalizeNoaaPayloads } from "@/src/lib/providers/noaa";

describe("NOAA normalization", () => {
  it("keeps observed and forecast Kp separate", () => {
    const result = normalizeNoaaPayloads({
      kp: [{ time_tag: "2026-07-17T10:00:00Z", kp_index: 3 }],
      forecast: [{ time_tag: "2026-07-17T12:00:00Z", kp: 5, observed: "forecast" }],
      wind: [{ time_tag: "2026-07-17T10:00:00Z", proton_speed: 420 }],
      magneticField: [{ time_tag: "2026-07-17T10:00:00Z", bz_gsm: -2 }], alerts: [], fetchedAt: "2026-07-17T10:02:00Z",
    });
    expect(result.kpObserved).toBe(3);
    expect(result.kpForecastMax).toBe(5);
    expect(result.status).toBe("live");
  });

  it("marks a stale observed Kp reading as delayed instead of presenting it as live", () => {
    const result = normalizeNoaaPayloads({
      kp: [{ time_tag: "2026-07-17T10:00:00Z", kp_index: 3 }], forecast: [], wind: [], magneticField: [], alerts: [], fetchedAt: "2026-07-17T10:45:00Z",
    });
    expect(result.status).toBe("delayed");
    expect(result.provenance[1]?.freshnessMinutes).toBe(45);
  });

  it("keeps NOAA OVATION separate as a model-output layer", () => {
    const result = normalizeNoaaPayloads({
      kp: [{ time_tag: "2026-07-17T10:00:00Z", kp_index: 3 }], forecast: [], wind: [], magneticField: [], alerts: [], fetchedAt: "2026-07-17T10:02:00Z",
      aurora: { "Observation Time": "2026-07-17T10:00:00Z", "Forecast Time": "2026-07-17T10:15:00Z", coordinates: [[0, 65, 14], [1, 66, 32], [2, 67, 18]] },
    });
    expect(result.aurora?.globalMaxProbability).toBe(32);
    expect(result.provenance.some((source) => source.productName === "OVATION aurora model" && source.layer === "model_output")).toBe(true);
  });
});
