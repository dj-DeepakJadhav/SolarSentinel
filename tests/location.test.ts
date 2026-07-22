import { describe, expect, it } from "vitest";
import { locations } from "@/src/domain/space-weather";
import { getDayNightContext } from "@/src/lib/location";

describe("day/night context", () => {
  it("returns a presentation-safe phase and does not make aurora claims", () => {
    const result = getDayNightContext(locations[0], new Date("2026-06-21T12:00:00Z"));
    expect(["daylight", "civil_twilight", "night"]).toContain(result.phase);
    expect(result.detail.toLowerCase()).not.toContain("guaranteed");
  });
});
