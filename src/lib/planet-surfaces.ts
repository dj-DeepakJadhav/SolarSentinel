export type SurfaceKind = "surface mosaic" | "illustrative surface";

export type SurfaceTarget =
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export type SurfaceMaterialProfile = {
  roughness: number;
  normalStrength: number;
  atmosphere: number;
};

export type PlanetSurface = {
  target: SurfaceTarget;
  imageUrl: string;
  /**
   * A complete equirectangular texture used only for WebGL material rendering.
   * It is intentionally separate from the primary scientific map/source link.
   */
  renderTextureUrl?: string;
  renderTextureCredit?: string;
  sourceUrl: string;
  credit: string;
  provider: string;
  kind: SurfaceKind;
  material: SurfaceMaterialProfile;
};

/**
 * A deliberately small, reviewed catalog of sphere-ready maps.
 *
 * The JPL Solar System Simulator makes the distinction that matters here:
 * some maps are stitched from mission imagery, while distant-gas-giant maps
 * are visual references.  The UI carries that distinction through to the
 * source panel instead of presenting every texture as a measurement.
 */
export const planetSurfaces: Record<PlanetSurface["target"], PlanetSurface> = {
  mercury: {
    target: "mercury",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/mer0muu2.jpg",
    renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_mercury.jpg",
    renderTextureCredit: "Solar System Scope · complete equirectangular renderer texture",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/mercury.html",
    credit: "NASA/JPL/USGS · Mariner 10 mosaic",
    provider: "NASA-JPL-USGS",
    kind: "surface mosaic",
    material: { roughness: .88, normalStrength: 4, atmosphere: .015 },
  },
  venus: {
    target: "venus",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/ven0aaa2.jpg",
    renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_venus_atmosphere.jpg",
    renderTextureCredit: "Solar System Scope · complete equirectangular renderer texture",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/venus.html",
    credit: "NASA/JPL/Caltech · Magellan radar mosaic",
    provider: "NASA-JPL-Caltech",
    kind: "surface mosaic",
    material: { roughness: .79, normalStrength: 1.6, atmosphere: .2 },
  },
  earth: {
    target: "earth",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/ear0xuu2.jpg",
    renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg",
    renderTextureCredit: "Solar System Scope · complete equirectangular renderer texture",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/earth.html",
    credit: "NASA/JPL/USGS · Earth surface map",
    provider: "NASA-JPL-USGS",
    kind: "surface mosaic",
    material: { roughness: .68, normalStrength: .5, atmosphere: .13 },
  },
  moon: {
    target: "moon",
    imageUrl: "https://astrogeology.usgs.gov/ckan/dataset/db948a2d-4d6a-4775-a0d3-12613d36f9e7/resource/addbb065-8435-43d7-a7b0-99da43b7a0fa/download/moon_lro_lroc-wac_mosaic_global_512.jpg",
    sourceUrl: "https://astrogeology.usgs.gov/search/map/moon_lro_lroc_wac_global_morphology_mosaic_100m",
    credit: "NASA/GSFC/ASU/USGS · LRO LROC WAC morphology mosaic",
    provider: "NASA-USGS",
    kind: "surface mosaic",
    material: { roughness: .95, normalStrength: 1.1, atmosphere: 0 },
  },
  mars: {
    target: "mars",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/mar0kuu2.jpg",
    renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_mars.jpg",
    renderTextureCredit: "Solar System Scope · complete equirectangular renderer texture",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/mars.html",
    credit: "NASA/JPL/USGS · Viking mosaic",
    provider: "NASA-JPL-USGS",
    kind: "surface mosaic",
    material: { roughness: .9, normalStrength: 3, atmosphere: .045 },
  },
  jupiter: {
    target: "jupiter",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/jup0vss1.jpg",
    renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg",
    renderTextureCredit: "Solar System Scope · complete equirectangular renderer texture",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/jupiter.html",
    credit: "NASA/JPL · Voyager-informed visual reference",
    provider: "NASA-JPL",
    kind: "illustrative surface",
    material: { roughness: .64, normalStrength: 0, atmosphere: .17 },
  },
  saturn: {
    target: "saturn",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/sat0fds1.jpg",
    renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_saturn.jpg",
    renderTextureCredit: "Solar System Scope · complete equirectangular renderer texture",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/saturn.html",
    credit: "NASA/JPL · visual reference for a changing atmosphere",
    provider: "NASA-JPL",
    kind: "illustrative surface",
    material: { roughness: .57, normalStrength: 0, atmosphere: .2 },
  },
  uranus: {
    target: "uranus",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/ura0fss1.jpg",
    renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_uranus.jpg",
    renderTextureCredit: "Solar System Scope · complete equirectangular renderer texture",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/uranus.html",
    credit: "NASA/JPL · visual reference",
    provider: "NASA-JPL",
    kind: "illustrative surface",
    material: { roughness: .61, normalStrength: 0, atmosphere: .18 },
  },
  neptune: {
    target: "neptune",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/nep0fds1.jpg",
    renderTextureUrl: "https://www.solarsystemscope.com/textures/download/2k_neptune.jpg",
    renderTextureCredit: "Solar System Scope · complete equirectangular renderer texture",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/neptune.html",
    credit: "NASA/JPL · visual reference for a changing atmosphere",
    provider: "NASA-JPL",
    kind: "illustrative surface",
    material: { roughness: .58, normalStrength: 0, atmosphere: .2 },
  },
  pluto: {
    target: "pluto",
    imageUrl: "https://maps.jpl.nasa.gov/tmaps/pix/plu0rss1.jpg",
    sourceUrl: "https://maps.jpl.nasa.gov/tmaps/pluto.html",
    credit: "NASA/JPL · historical visual reference",
    provider: "NASA-JPL",
    kind: "illustrative surface",
    material: { roughness: .86, normalStrength: 0, atmosphere: .015 },
  },
};

export function surfaceForTarget(target: string): PlanetSurface | null {
  return Object.prototype.hasOwnProperty.call(planetSurfaces, target)
    ? planetSurfaces[target as PlanetSurface["target"]]
    : null;
}
