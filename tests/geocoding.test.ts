import { describe, expect, it } from "vitest";
import { normalizeGeocodingResults } from "@/src/lib/geocoding";

describe("global city search", () => {
  it("normalizes valid geocoding results into locations usable by the sky context", () => {
    expect(normalizeGeocodingResults({ results: [{ id: 1850147, name: "Tokyo", country: "Japan", latitude: 35.6895, longitude: 139.6917 }] })).toEqual([
      { id: "geocode-1850147", name: "Tokyo", country: "Japan", latitude: 35.6895, longitude: 139.6917 },
    ]);
  });
});
