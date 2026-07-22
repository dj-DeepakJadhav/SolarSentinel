import { describe, expect, it } from "vitest";
import { normaliseAtlasArchive } from "@/src/lib/atlas-data";

describe("local Solar System archive normaliser", () => {
  it("keeps source-rich images and gives each a same-origin image route", () => {
    expect(normaliseAtlasArchive("mars", [{ stage: 2, title: "Perseverance", year: 2021, caption: "Jezero", source: "NASA/JPL", original_url: "https://images.nasa.gov/example" }])).toEqual([{
      stage: 2,
      title: "Perseverance",
      year: "2021",
      caption: "Jezero",
      source: "NASA/JPL",
      sourceUrl: "https://images.nasa.gov/example",
      imageUrl: "/api/atlas-gallery/mars/2",
    }]);
  });

  it("drops malformed records rather than exposing arbitrary links or files", () => {
    expect(normaliseAtlasArchive("earth", [{ stage: 0, original_url: "https://example.com" }, { stage: 1, original_url: "http://example.com" }])).toEqual([]);
  });
});
