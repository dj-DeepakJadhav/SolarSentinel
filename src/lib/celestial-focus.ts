import type { EphemerisBody } from "@/src/lib/providers/horizons";

export type SceneFocus = "system" | "sun" | "spacecraft" | EphemerisBody["id"];

export type FocusDetail = {
  title: string;
  eyebrow: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  mediaUrl?: string;
  mediaAlt?: string;
  fieldView?: "sun" | "earth" | "spacecraft" | "planet";
};

const planetDetail = (title: string, sourceUrl: string): FocusDetail => ({
  title,
  eyebrow: "NASA/JPL HORIZONS · LIVE VECTOR",
  description: "Current heliocentric position is drawn from NASA/JPL Horizons. Open the close view for source-linked mission imagery and an illustrative major-moon layer.",
  sourceName: "NASA/JPL Horizons",
  sourceUrl,
  fieldView: "planet",
});

export const focusDetails: Record<Exclude<SceneFocus, "system">, FocusDetail> = {
  sun: {
    title: "The Sun", eyebrow: "NASA SDO · LATEST AVAILABLE", description: "AIA observes the corona in extreme ultraviolet. Switch wavelength in field view to compare how the Sun changes.",
    sourceName: "NASA Solar Dynamics Observatory", sourceUrl: "https://science.nasa.gov/mission/sdo/", mediaUrl: "/api/solar-image/193", mediaAlt: "Latest available NASA SDO AIA 193 Angstrom solar image", fieldView: "sun",
  },
  mercury: planetDetail("Mercury", "https://science.nasa.gov/solar-system/planets/mercury/"),
  venus: planetDetail("Venus", "https://science.nasa.gov/solar-system/planets/venus/"),
  earth: {
    title: "Earth", eyebrow: "NASA/JPL HORIZONS · LIVE VECTOR", description: "Current heliocentric position is from Horizons. Enter field view to see Earth’s geographic surface, magnetic shield, aurora model, and your selected city.",
    sourceName: "NASA Blue Marble", sourceUrl: "https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/", fieldView: "earth",
  },
  moon: {
    title: "The Moon", eyebrow: "NASA/JPL HORIZONS · EARTH-RELATIVE VECTOR", description: "Its current Earth-relative direction comes from Horizons. The Moon’s displayed separation is expanded so it remains visible in the system view.",
    sourceName: "NASA Moon", sourceUrl: "https://science.nasa.gov/moon/", fieldView: "earth",
  },
  mars: planetDetail("Mars", "https://science.nasa.gov/solar-system/planets/mars/"),
  jupiter: planetDetail("Jupiter", "https://science.nasa.gov/solar-system/planets/jupiter/"),
  saturn: planetDetail("Saturn", "https://science.nasa.gov/solar-system/planets/saturn/"),
  uranus: planetDetail("Uranus", "https://science.nasa.gov/solar-system/planets/uranus/"),
  neptune: planetDetail("Neptune", "https://science.nasa.gov/solar-system/planets/neptune/"),
  pluto: planetDetail("Pluto", "https://science.nasa.gov/dwarf-planets/pluto/"),
  spacecraft: {
    title: "SDO", eyebrow: "NASA · SOLAR OBSERVER", description: "SDO is shown in an illustrative Earth-orbit context. This is not live spacecraft tracking; its science images are the live observation layer.",
    sourceName: "NASA Solar Dynamics Observatory", sourceUrl: "https://science.nasa.gov/mission/sdo/", mediaUrl: "/api/solar-image/193", mediaAlt: "Latest available NASA SDO AIA 193 Angstrom solar image", fieldView: "spacecraft",
  },
};
