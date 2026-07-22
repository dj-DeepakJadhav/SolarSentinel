import type { SceneFocus } from "@/src/lib/celestial-focus";

export type AtlasScene = "system" | "sun" | "earth" | "spacecraft" | "planet";

export type AtlasSourceRole =
  | "live position"
  | "live image"
  | "surface mosaic"
  | "visual reference"
  | "mission imagery"
  | "mission context"
  | "space weather";

export type AtlasSource = {
  agency: string;
  mission: string;
  role: AtlasSourceRole;
  url: string;
  note?: string;
};

export type AtlasInfo = {
  label: string;
  description: string;
  fact: string;
  factDetails: readonly {
    label: string;
    copy: string;
  }[];
  sourceName: string;
  sourceUrl: string;
};

export type AtlasChapter = {
  id: string;
  number: string;
  scene: AtlasScene;
  focus: SceneFocus;
  eyebrow: string;
  title: string;
  line: string;
  earthLayer?: boolean;
  sources: readonly AtlasSource[];
};

export function enablesSdoEffects(chapter: Pick<AtlasChapter, "id">) {
  return chapter.id === "sdo";
}

const jpl: AtlasSource = { agency: "NASA / JPL", mission: "Horizons", role: "live position", url: "https://ssd.jpl.nasa.gov/horizons/", note: "Current heliocentric vector used by the Atlas." };
const jplMaps = "https://maps.jpl.nasa.gov/tmaps/";

export const atlasInfo: Record<string, AtlasInfo> = {
  system: {
    label: "LIVE ORBITAL MAP",
    description: "Bodies are positioned from a current JPL Horizons snapshot. Distances and diameters are intentionally composed for learning, not displayed at literal scale.",
    fact: "Light from the Sun reaches Earth in about eight minutes and 20 seconds.",
    factDetails: [
      { label: "THE MAP", copy: "Planet locations come from a current NASA/JPL Horizons snapshot; their spacing and sizes are deliberately composed so the system can be explored on one screen." },
      { label: "THE GRAVITY", copy: "Every planet, moon, dwarf planet, and small body in this story travels within the Sun’s gravitational domain." },
    ],
    sourceName: "NASA/JPL Horizons",
    sourceUrl: "https://ssd.jpl.nasa.gov/horizons/",
  },
  sun: {
    label: "G-TYPE STAR",
    description: "This chapter introduces the Sun as a star through the latest available SDO surface image. Its live motion and solar-weather response are intentionally held for the final SDO-to-Earth chapter.",
    fact: "The Sun holds more than 99% of the solar system’s total mass.",
    factDetails: [
      { label: "NOT THE SAME STREAM", copy: "Sunlight reaches Earth in minutes. Charged solar-wind particles make the journey over days, following a very different path through space." },
      { label: "HOW WE SEE IT", copy: "NASA’s Solar Dynamics Observatory observes the Sun in several wavelengths, revealing structures that ordinary visible light cannot show." },
    ],
    sourceName: "NASA Solar Dynamics Observatory",
    sourceUrl: "https://sdo.gsfc.nasa.gov/data/",
  },
  mercury: {
    label: "INNER ROCKY WORLD",
    description: "Mercury’s visual surface is a documented mission mosaic. The close scene expands its scale so its cratered character can be explored.",
    fact: "One solar day on Mercury lasts 176 Earth days — longer than its year.",
    factDetails: [
      { label: "FAST YEAR", copy: "Mercury completes one trip around the Sun in just 88 Earth days, the shortest year of any planet." },
      { label: "SCARRED SURFACE", copy: "With almost no atmosphere to erase impacts, its ancient craters remain visible for billions of years." },
    ],
    sourceName: "NASA/JPL planetary maps",
    sourceUrl: `${jplMaps}mercury.html`,
  },
  venus: {
    label: "CLOUD-WRAPPED WORLD",
    description: "The surface treatment is a radar mosaic; visible-light views chiefly show Venus’s atmosphere. Mission imagery can show those cloud patterns in different wavelengths.",
    fact: "Venus spins so slowly that one rotation takes longer than one trip around the Sun.",
    factDetails: [
      { label: "BACKWARDS SPIN", copy: "Venus rotates in the opposite direction to most planets, so its Sun rises in the west and sets in the east." },
      { label: "BENEATH THE CLOUDS", copy: "Its permanent cloud cover hides the ground in visible light; radar missions map the rocky surface below." },
    ],
    sourceName: "NASA/JPL planetary maps",
    sourceUrl: `${jplMaps}venus.html`,
  },
  earth: {
    label: "OUR HOME WORLD",
    description: "Earth is a planetary chapter here. Live solar-weather response is deliberately reserved for the final SDO-to-Earth chapter.",
    fact: "Earth is the only planet in this system known to sustain liquid water at its surface today.",
    factDetails: [
      { label: "BLUE PLANET", copy: "Oceans cover about 71% of Earth’s surface, helping regulate the climate and connect the planet’s water cycle." },
      { label: "TWO KINDS OF PROTECTION", copy: "Earth’s atmosphere and magnetic field are different systems; the final chapter explains how the magnetic field guides many charged particles." },
    ],
    sourceName: "NASA Blue Marble",
    sourceUrl: "https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/",
  },
  mars: {
    label: "THE RED PLANET",
    description: "Mars combines a reviewed global mosaic with mission imagery from NASA, ESA, ISRO, and the UAE. Each archive image keeps its own mission context.",
    fact: "Olympus Mons is the largest volcano known in the solar system.",
    factDetails: [
      { label: "GIANT LANDSCAPE", copy: "Olympus Mons rises roughly three times higher than Mount Everest above Mars’s average surface level." },
      { label: "A WATER STORY", copy: "Dry valleys, lake sediments, and minerals show that ancient Mars once had environments shaped by flowing water." },
    ],
    sourceName: "NASA/JPL planetary maps",
    sourceUrl: `${jplMaps}mars.html`,
  },
  jupiter: {
    label: "GAS GIANT",
    description: "Jupiter’s displayed atmosphere is a visual reference. Its clouds change constantly, so a static texture must not be read as a current observation.",
    fact: "More than 1,300 Earths could fit inside Jupiter by volume.",
    factDetails: [
      { label: "A MAGNETIC GIANT", copy: "Jupiter has the solar system’s largest planetary magnetic field, producing enormous radiation belts around the planet." },
      { label: "STORMS IN MOTION", copy: "Its coloured bands and giant storms constantly evolve, so this atlas texture is a reference, not a live weather map." },
    ],
    sourceName: "NASA Juno",
    sourceUrl: "https://science.nasa.gov/mission/juno/",
  },
  saturn: {
    label: "RINGED GAS GIANT",
    description: "The ring system is shown for orientation. Mission imagery supplies the rich close detail; the broad texture remains a labelled visual reference.",
    fact: "Saturn’s average density is lower than water’s.",
    factDetails: [
      { label: "A RING IS MANY PIECES", copy: "Saturn’s bright rings are made largely of water-ice particles, from dust-sized grains to chunks much larger than a house." },
      { label: "NOT A SOLID DISC", copy: "The rings are thin compared with their width, and gaps, waves, and moonlets continually reshape their structure." },
    ],
    sourceName: "NASA Cassini",
    sourceUrl: "https://science.nasa.gov/mission/cassini/",
  },
  uranus: {
    label: "ICE GIANT",
    description: "Uranus rotates with an extreme axial tilt. Its Atlas texture is a visual reference, paired with direct mission-source material in the archive.",
    fact: "Uranus is tilted by about 98°, so it effectively rolls around the Sun.",
    factDetails: [
      { label: "LONG SEASONS", copy: "That extreme tilt gives Uranus seasons that each last about 21 Earth years." },
      { label: "THE CLOSE FLYBY", copy: "Voyager 2 remains the only spacecraft to have visited Uranus, flying past the ice giant in 1986." },
    ],
    sourceName: "NASA Voyager",
    sourceUrl: "https://science.nasa.gov/mission/voyager/",
  },
  neptune: {
    label: "OUTER ICE GIANT",
    description: "Neptune’s fast-changing atmosphere is represented illustratively. The archive preserves the distinction between a visual reference and mission imagery.",
    fact: "Neptune has the fastest measured planetary winds in the solar system.",
    factDetails: [
      { label: "SUPERSONIC WEATHER", copy: "Some Neptune winds have been measured above 1,600 kilometres per hour, despite the planet receiving little sunlight." },
      { label: "CHANGING DARK SPOTS", copy: "Its large dark storms can appear and disappear, which is why a static surface is only a visual reference." },
    ],
    sourceName: "NASA Voyager",
    sourceUrl: "https://science.nasa.gov/mission/voyager/",
  },
  pluto: {
    label: "KUIPER BELT WORLD",
    description: "Pluto’s close geological detail comes from New Horizons. Its system-map texture remains a historical visual reference rather than a live global map.",
    fact: "Pluto and its largest moon, Charon, orbit a shared barycentre outside Pluto itself.",
    factDetails: [
      { label: "A DOUBLE-WORLD DANCE", copy: "Because the pair’s balance point lies in space between them, Pluto and Charon behave more like a binary system than a planet with a tiny moon." },
      { label: "A SURPRISINGLY ACTIVE WORLD", copy: "New Horizons revealed water-ice mountains and nitrogen-ice glaciers on a world once expected to be a frozen, featureless dot." },
    ],
    sourceName: "NASA New Horizons",
    sourceUrl: "https://science.nasa.gov/mission/new-horizons/",
  },
  sdo: {
    label: "FINAL LIVE OBSERVER",
    description: "SDO observes the Sun; it does not cause solar weather. This final chapter connects its latest solar image to an illustrative Earth-response view, clearly separated from the earlier planetary journey.",
    fact: "SDO has watched the Sun continuously from geosynchronous orbit since 2010.",
    factDetails: [
      { label: "WHAT SDO OBSERVES", copy: "SDO supplies solar observations and images. NOAA SWPC separately publishes official space-weather alerts and forecasts." },
      { label: "WHAT THIS SCENE MEANS", copy: "The magnetic response is an educational visualization informed by observations; it is not a prediction or an operational advisory." },
    ],
    sourceName: "NASA Solar Dynamics Observatory",
    sourceUrl: "https://sdo.gsfc.nasa.gov/mission/moc.php",
  },
};

export const atlasChapters: readonly AtlasChapter[] = [
  {
    id: "system", number: "01", scene: "system", focus: "system", eyebrow: "THE ATLAS", title: "ONE STAR.\nMANY WORLDS.", line: "A living map of where the solar system is now.", sources: [
      jpl,
      { agency: "NASA", mission: "Solar System Exploration", role: "mission context", url: "https://science.nasa.gov/solar-system/planets/" },
      { agency: "ESA", mission: "Space Science", role: "mission context", url: "https://www.esa.int/Science_Exploration/Space_Science" },
      { agency: "JAXA / ISAS", mission: "Space Science", role: "mission context", url: "https://www.isas.jaxa.jp/en/" },
      { agency: "ISRO", mission: "Space Science", role: "mission context", url: "https://www.isro.gov.in/" },
    ],
  },
  {
    id: "sun", number: "02", scene: "sun", focus: "sun", eyebrow: "THE STAR", title: "THE SUN", line: "The source of the stream that shapes every orbit beyond it.", sources: [
      { agency: "NASA", mission: "Solar Dynamics Observatory", role: "live image", url: "https://sdo.gsfc.nasa.gov/data/", note: "The latest image supplies the static solar surface here; live motion and the SDO-to-Earth response are reserved for the final chapter." },
      { agency: "ESA", mission: "Solar Orbiter", role: "mission imagery", url: "https://www.esa.int/Science_Exploration/Space_Science/Solar_Orbiter" },
      { agency: "JAXA / NAOJ", mission: "Hinode", role: "mission context", url: "https://hinode.nao.ac.jp/en/" },
      { agency: "ISRO", mission: "Aditya-L1", role: "mission context", url: "https://www.isro.gov.in/ISRO_EN/Aditya_L1.html" },
      { agency: "NOAA", mission: "Space Weather Prediction Center", role: "space weather", url: "https://www.swpc.noaa.gov/products-and-data" },
    ],
  },
  {
    id: "mercury", number: "03", scene: "planet", focus: "mercury", eyebrow: "THE INNER SYSTEM", title: "MERCURY", line: "A scarred world at the edge of the Sun’s glare.", sources: [
      jpl,
      { agency: "NASA / JPL / USGS", mission: "Mariner 10 global mosaic", role: "surface mosaic", url: `${jplMaps}mercury.html`, note: "Used as the sphere surface; incomplete longitude coverage is documented by JPL." },
      { agency: "NASA", mission: "MESSENGER", role: "mission imagery", url: "https://science.nasa.gov/mission/messenger/" },
      { agency: "ESA", mission: "BepiColombo", role: "mission context", url: "https://www.esa.int/Science_Exploration/Space_Science/BepiColombo" },
      { agency: "JAXA", mission: "Mio / BepiColombo", role: "mission context", url: "https://global.jaxa.jp/projects/sas/bepi/" },
    ],
  },
  {
    id: "venus", number: "04", scene: "planet", focus: "venus", eyebrow: "THE INNER SYSTEM", title: "VENUS", line: "A planet hidden beneath a moving atmosphere.", sources: [
      jpl,
      { agency: "NASA / JPL / Caltech", mission: "Magellan radar mosaic", role: "surface mosaic", url: `${jplMaps}venus.html`, note: "Radar data is used for the surface treatment, not a current visible-light view." },
      { agency: "ESA", mission: "Venus Express", role: "mission imagery", url: "https://www.esa.int/Science_Exploration/Space_Science/Venus_Express" },
      { agency: "JAXA", mission: "Akatsuki", role: "mission imagery", url: "https://global.jaxa.jp/press/2025/09/20250918-2_e.html" },
      { agency: "USSR", mission: "Venera archive contribution", role: "mission context", url: `${jplMaps}venus.html`, note: "The reviewed JPL composite identifies Venera among its historical source imagery." },
    ],
  },
  {
    id: "earth", number: "05", scene: "planet", focus: "earth", eyebrow: "HOME WORLD", title: "EARTH", line: "A world seen from many space agencies.", sources: [
      jpl,
      { agency: "NASA", mission: "Blue Marble", role: "mission imagery", url: "https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/" },
      { agency: "ESA", mission: "Earth Observation", role: "mission context", url: "https://www.esa.int/Applications/Observing_the_Earth" },
      { agency: "JAXA", mission: "Earth Observation", role: "mission context", url: "https://global.jaxa.jp/projects/" },
      { agency: "NOAA", mission: "Space Weather Prediction Center", role: "space weather", url: "https://www.swpc.noaa.gov/products-and-data" },
    ],
  },
  {
    id: "mars", number: "06", scene: "planet", focus: "mars", eyebrow: "THE INNER SYSTEM", title: "MARS", line: "A record of ancient water, dust storms, and a thin atmosphere.", sources: [
      jpl,
      { agency: "NASA / JPL / USGS", mission: "Viking global mosaic", role: "surface mosaic", url: `${jplMaps}mars.html` },
      { agency: "ESA", mission: "Mars Express", role: "mission imagery", url: "https://www.esa.int/Science_Exploration/Space_Science/Mars_Express" },
      { agency: "ISRO", mission: "Mars Orbiter Mission", role: "mission imagery", url: "https://www.isro.gov.in/ISRO_EN/MOM.html" },
      { agency: "UAE / MBRSC", mission: "Emirates Mars Mission · Hope", role: "mission imagery", url: "https://www.emiratesmarsmission.ae/" },
    ],
  },
  {
    id: "jupiter", number: "07", scene: "planet", focus: "jupiter", eyebrow: "THE GIANTS", title: "JUPITER", line: "A planet of storms, magnetism, and ocean worlds in orbit.", sources: [
      jpl,
      { agency: "NASA / JPL", mission: "JPL planetary-map reference", role: "visual reference", url: `${jplMaps}jupiter.html`, note: "JPL notes that gas-giant textures are representative because their atmospheres change." },
      { agency: "NASA", mission: "Juno", role: "mission imagery", url: "https://science.nasa.gov/mission/juno/" },
      { agency: "ESA", mission: "JUICE", role: "mission context", url: "https://www.esa.int/Science_Exploration/Space_Science/Juice" },
    ],
  },
  {
    id: "saturn", number: "08", scene: "planet", focus: "saturn", eyebrow: "THE GIANTS", title: "SATURN", line: "A ring system wide enough to tell its own story.", sources: [
      jpl,
      { agency: "NASA / JPL", mission: "JPL planetary-map reference", role: "visual reference", url: `${jplMaps}saturn.html`, note: "The map is a visual reference, not an observation product." },
      { agency: "NASA / ESA / ASI", mission: "Cassini–Huygens", role: "mission imagery", url: "https://science.nasa.gov/mission/cassini/" },
    ],
  },
  {
    id: "uranus", number: "09", scene: "planet", focus: "uranus", eyebrow: "THE FAR SYSTEM", title: "URANUS", line: "An ice giant turning almost on its side through the outer dark.", sources: [
      jpl,
      { agency: "NASA / JPL", mission: "JPL planetary-map reference", role: "visual reference", url: `${jplMaps}uranus.html`, note: "A visual treatment; no global scientific texture is implied." },
      { agency: "NASA", mission: "Voyager", role: "mission imagery", url: "https://science.nasa.gov/mission/voyager/" },
    ],
  },
  {
    id: "neptune", number: "10", scene: "planet", focus: "neptune", eyebrow: "THE FAR SYSTEM", title: "NEPTUNE", line: "A blue world of fast winds at the edge of the giant planets.", sources: [
      jpl,
      { agency: "NASA / JPL", mission: "JPL planetary-map reference", role: "visual reference", url: `${jplMaps}neptune.html`, note: "The atmosphere is dynamic; this is a visual reference." },
      { agency: "NASA", mission: "Voyager", role: "mission imagery", url: "https://science.nasa.gov/mission/voyager/" },
    ],
  },
  {
    id: "pluto", number: "11", scene: "planet", focus: "pluto", eyebrow: "THE KUIPER BELT", title: "PLUTO", line: "A small, complex world at the edge of the mapped journey.", sources: [
      jpl,
      { agency: "NASA / JPL", mission: "Historical map reference", role: "visual reference", url: `${jplMaps}pluto.html`, note: "JPL identifies this historical map as illustrative; it is not a New Horizons global mosaic." },
      { agency: "NASA", mission: "New Horizons", role: "mission imagery", url: "https://science.nasa.gov/mission/new-horizons/" },
    ],
  },
  {
    id: "sdo", number: "12", scene: "spacecraft", focus: "spacecraft", eyebrow: "THE LIVE OBSERVER", title: "SDO\nTO EARTH", line: "A final view of what SDO observes and how solar wind meets Earth’s magnetic shield.", earthLayer: true, sources: [
      { agency: "NASA", mission: "Solar Dynamics Observatory", role: "live image", url: "https://sdo.gsfc.nasa.gov/data/", note: "Latest available solar image powers this final live-observer chapter." },
      { agency: "NASA", mission: "SDO Mission Operations Center", role: "mission context", url: "https://sdo.gsfc.nasa.gov/mission/moc.php" },
      { agency: "NASA", mission: "Living With a Star", role: "mission context", url: "https://science.nasa.gov/mission/sdo/" },
      { agency: "NOAA", mission: "Space Weather Prediction Center", role: "space weather", url: "https://www.swpc.noaa.gov/products-and-data" },
    ],
  },
];
