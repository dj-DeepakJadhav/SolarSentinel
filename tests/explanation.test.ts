import { describe, expect, it } from "vitest";
import { locations } from "@/src/domain/space-weather";
import { buildFallbackBriefing, sourceNotesForSnapshot } from "@/src/lib/explanation";
import { demoSnapshot } from "@/src/lib/fixture";

describe("source-grounded explanations", () => {
  it("uses snapshot provenance instead of generated citations", () => {
    const notes = sourceNotesForSnapshot(demoSnapshot);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every((note) => demoSnapshot.provenance.some((source) => source.sourceUrl === note.url))).toBe(true);
    expect(notes.every((note) => note.timestampUtc.includes("T"))).toBe(true);
  });

  it("keeps the student fallback separated into truth layers", () => {
    const briefing = buildFallbackBriefing(demoSnapshot, locations[0], "quiet", "student");
    expect(briefing.observed).toContain("LIVE OBSERVED");
    expect(briefing.officialForecast).toContain("NOAA FORECAST");
    expect(briefing.scenario).toContain("SCENARIO");
  });

  it("turns the same snapshot into a teacher facilitation guide", () => {
    const briefing = buildFallbackBriefing(demoSnapshot, locations[0], "quiet", "teacher");
    expect(briefing.summary).toContain("Class prompt");
    expect(briefing.observed).toContain("OBSERVE");
    expect(briefing.uncertainty).toContain("SOURCE CHECK");
  });
});
