import { describe, expect, it } from "vitest";
import { planetSurfaces, surfaceForTarget } from "@/src/lib/planet-surfaces";

describe("planet surface catalog", () => {
  it("uses reviewed JPL map records rather than search-result thumbnails", () => {
    expect(surfaceForTarget("mars")).toMatchObject({
      imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/mar0kuu2.jpg",
      kind: "surface mosaic",
      material: { normalStrength: 3 },
    });
    expect(surfaceForTarget("pluto")?.kind).toBe("illustrative surface");
    expect(surfaceForTarget("jupiter")?.material.normalStrength).toBe(0);
    expect(surfaceForTarget("moon")).toMatchObject({
      kind: "surface mosaic",
      provider: "NASA-USGS",
      material: { roughness: .95, normalStrength: 1.1 },
    });
    expect(surfaceForTarget("spacecraft")).toBeNull();
  });

  it("keeps complete renderer maps separate from scientific source records", () => {
    expect(surfaceForTarget("mercury")).toMatchObject({
      imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/mer0muu2.jpg",
      renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_mercury.jpg",
      renderTextureCredit: expect.stringContaining("renderer texture"),
    });
    expect(surfaceForTarget("earth")?.renderTextureUrl).toContain("2k_earth_daymap.jpg");
    expect(surfaceForTarget("uranus")?.renderTextureUrl).toContain("2k_uranus.jpg");
    expect(surfaceForTarget("moon")?.renderTextureUrl).toBeUndefined();
  });

  it("covers every planetary close-up in the first Atlas release", () => {
    expect(Object.keys(planetSurfaces)).toEqual(["mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]);
  });
});
