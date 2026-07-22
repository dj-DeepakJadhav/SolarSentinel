# Solar Sentinel — Data Sources & Integration Links

> **Purpose:** The approved data-source register for Solar Sentinel.
>
> **Rule:** Fetch all live data from the server, validate it, cache it, preserve source timestamps, and render a source/provenance label in the product. Do not call these providers directly from the browser in production.
>
> **Truth layers:** `LIVE OBSERVED`, `NOAA FORECAST`, and `SOLAR SENTINEL SCENARIO` must always be visually distinct.

---

## 1. Required MVP sources

| Priority | Source | Product role | Truth layer | Access / endpoint |
|---:|---|---|---|---|
| 1 | NASA Solar Dynamics Observatory (SDO) | Live solar visual texture | LIVE OBSERVED | [SDO data / The Sun Now](https://sdo.gsfc.nasa.gov/data/) |
| 2 | NOAA SWPC Planetary K-index | Current geomagnetic activity | LIVE OBSERVED | [1-minute planetary Kp JSON](https://services.swpc.noaa.gov/json/planetary_k_index_1m.json) |
| 3 | NOAA SWPC Kp forecast | Official expected geomagnetic activity | NOAA FORECAST | [Kp forecast JSON](https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json) |
| 4 | NOAA SWPC solar-wind magnetic field | IMF / Bz status and live visual input | LIVE OBSERVED | [MAG 1-day JSON](https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json) |
| 5 | NOAA SWPC solar-wind plasma | Solar-wind speed and density | LIVE OBSERVED | [Plasma 1-day JSON](https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json) |
| 6 | NOAA SWPC OVATION | Aurora probability / oval visualisation | LIVE OBSERVED / model output | [Latest OVATION Aurora JSON](https://services.swpc.noaa.gov/json/ovation_aurora_latest.json) |
| 7 | NOAA SWPC alerts | Official watches, warnings and alerts | NOAA FORECAST | [Weather advisories JSON](https://services.swpc.noaa.gov/products/active_alerts.json) |
| 8 | NASA DONKI | Historical replay and event narrative | LIVE OBSERVED / archived analysis | [DONKI portal and API documentation](https://ccmc.gsfc.nasa.gov/tools/DONKI/) |
| 9 | NASA/JPL Horizons | Current planet and Moon state vectors for the system overview | LIVE OBSERVED / ephemeris | [Horizons API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html) |
| 10 | NASA Image and Video Library | Source-linked real imagery in selected object cards | Mission media / contextual reference | [NASA Image Library](https://images.nasa.gov/) |
| 11 | ESA Venus Express / Mars Express | Planetary mission context in the source drawer | Mission context / archival reference | [Venus Express](https://www.esa.int/Science_Exploration/Space_Science/Venus_Express) · [Mars Express](https://www.esa.int/Science_Exploration/Space_Science/Mars_Express) |
| 12 | JAXA Akatsuki | Venus atmospheric-mission context | Mission context / archival reference | [Akatsuki mission completion](https://global.jaxa.jp/press/2025/09/20250918-2_e.html) |
| 13 | ISRO Mars Orbiter Mission | Mars Color Camera mission context | Mission context / archival reference | [Mars Orbiter Mission](https://www.isro.gov.in/ISRO_EN/MOM.html) |

---

## 2. NASA SDO imagery

NASA SDO is the visual anchor of Solar Sentinel. Use it to show the Sun as it appears in current/latest available mission imagery.

### Primary images

| Asset | Product use | Direct latest image |
|---|---|---|
| AIA 193 Angstrom | Default hero-Sun corona texture; dramatic view of solar activity | [latest_1024_0193.jpg](https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg) |
| HMI colour magnetogram | Magnetic-activity mode / explainer panel | [latest_1024_HMIBC.jpg](https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIBC.jpg) |

### Optional image layers

| Asset | Useful for | Direct latest image |
|---|---|---|
| AIA 304 Angstrom | Chromosphere/prominence visual | [latest_1024_0304.jpg](https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0304.jpg) |
| AIA 171 Angstrom | Coronal-loop visual | [latest_1024_0171.jpg](https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg) |
| AIA 211/193/171 composite | Colour-rich alternative hero view | [latest_1024_211193171.jpg](https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_211193171.jpg) |
| HMI magnetogram | Non-colour magnetic field layer | [latest_1024_HMIB.jpg](https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIB.jpg) |

### SDO documentation

- [SDO data home / The Sun Now](https://sdo.gsfc.nasa.gov/data/)
- [AIA/HMI browse data](https://sdo.gsfc.nasa.gov/data/aiahmi/)
- [SDO channel guide](https://sdo.gsfc.nasa.gov/data/channels.php)
- [SDO data access](https://sdo.gsfc.nasa.gov/data/dataaccess.php)
- [SDO data rules](https://sdo.gsfc.nasa.gov/data/rules.php)
- [SDO best practices](https://sdo.gsfc.nasa.gov/data/bestpractice.php)

### Implementation rules

- Poll a server-side SDO adapter every 10–15 minutes; do not hotlink the image from every visitor’s browser.
- Save each fetched image to object storage with URL, fetch time, and source timestamp/metadata where available.
- Always show `Latest image fetched at <UTC time>`; do not call it “real-time” without disclosing latency.
- Ship local fallback solar images so the hero scene works during provider outages.

---

## 3. NOAA SWPC live data

NOAA’s Space Weather Prediction Center (SWPC) supplies the live measurements, official forecasts, models, and alerts used by Solar Sentinel.

### Main JSON index

- [NOAA SWPC JSON directory](https://services.swpc.noaa.gov/json/)
- [NOAA SWPC products and data](https://www.swpc.noaa.gov/products-and-data)

### Geomagnetic activity

| Data | Endpoint | Product treatment | Polling suggestion |
|---|---|---|---|
| Observed planetary Kp, 1-minute | [planetary_k_index_1m.json](https://services.swpc.noaa.gov/json/planetary_k_index_1m.json) | `LIVE OBSERVED`; chart and current-state card | 5 min |
| Observed planetary Kp, 3-hour | [noaa-planetary-k-index.json](https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json) | Optional historical chart / stable fallback | 15 min |
| Forecast planetary Kp | [noaa-planetary-k-index-forecast.json](https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json) | `NOAA FORECAST`; never merge with observed Kp | 30 min |
| Boulder local K-index | [boulder_k_index_1m.json](https://services.swpc.noaa.gov/json/boulder_k_index_1m.json) | Optional developer/science detail; not primary global metric | 5 min |

### Solar wind

| Data | Endpoint | Product treatment | Polling suggestion |
|---|---|---|---|
| Magnetic field / IMF (including Bz) | [mag-1-day.json](https://services.swpc.noaa.gov/products/solar-wind/mag-1-day.json) | `LIVE OBSERVED`; show current Bz and use only as an illustrative visual-state input | 5 min |
| Plasma (speed, density, temperature) | [plasma-1-day.json](https://services.swpc.noaa.gov/products/solar-wind/plasma-1-day.json) | `LIVE OBSERVED`; show speed/density and drive particle-flow intensity | 5 min |
| Solar wind landing page | [NOAA solar-wind observations](https://www.swpc.noaa.gov/products/solar-wind) | Context, definitions and user-facing source link | N/A |

### Aurora

| Data | Endpoint | Product treatment | Polling suggestion |
|---|---|---|---|
| Global aurora probability grid | [ovation_aurora_latest.json](https://services.swpc.noaa.gov/json/ovation_aurora_latest.json) | Render as a labelled NOAA model-output layer around Earth; do not promise local visibility | 10 min |
| Official aurora product page | [Aurora dashboard](https://www.swpc.noaa.gov/products/aurora-30-minute-forecast) | User-facing explainer/source link | N/A |

### Alerts and official messaging

| Data | Endpoint | Product treatment | Polling suggestion |
|---|---|---|---|
| Active alerts | [active_alerts.json](https://services.swpc.noaa.gov/products/active_alerts.json) | `NOAA FORECAST`; display official wording, issue time and source link | 5 min |
| 3-day forecast discussion | [3-day forecast](https://www.swpc.noaa.gov/products/3-day-forecast) | Optional “official outlook” link, not parsed MVP data | N/A |
| 45-day forecast | [45-day-forecast.json](https://services.swpc.noaa.gov/json/45-day-forecast.json) | Optional long-range science panel; not needed for core demo | Daily |
| ICAO advisories | [icao-space-weather-advisories.json](https://services.swpc.noaa.gov/json/icao-space-weather-advisories.json) | Optional advanced panel; do not provide aviation operating advice | 15 min |

### Solar activity extras (stretch)

| Data | Endpoint | Product use |
|---|---|---|
| Solar-region data | [solar_regions.json](https://services.swpc.noaa.gov/json/solar_regions.json) | Show active regions on a data/details panel |
| Solar probabilities | [solar_probabilities.json](https://services.swpc.noaa.gov/json/solar_probabilities.json) | Official probability context, labelled as NOAA forecast/product |
| Solar radio flux | [solar-radio-flux.json](https://services.swpc.noaa.gov/json/solar-radio-flux.json) | Optional science metric |
| Sunspot report | [sunspot_report.json](https://services.swpc.noaa.gov/json/sunspot_report.json) | Optional “Sun today” panel |
| GOES JSON directory | [NOAA GOES feeds](https://services.swpc.noaa.gov/json/goes/) | Advanced phase only—inspect schema before implementing |

---

## 4. NASA DONKI event data

DONKI is Solar Sentinel’s historical replay and event-context source. It provides near-real-time analyses and relationships between events, model outputs, and notifications.

### Documentation and discovery

- [NASA CCMC DONKI documentation](https://ccmc.gsfc.nasa.gov/tools/DONKI/)
- [DONKI web app](https://kauai.ccmc.gsfc.nasa.gov/DONKI/)
- [DONKI search](https://kauai.ccmc.gsfc.nasa.gov/DONKI/search/)
- [NASA Open APIs key registration](https://api.nasa.gov/#signUp)

### Direct API patterns

Replace `yyyy-MM-dd` with UTC dates. Use a date range of 30 days or less per request unless the provider documents otherwise.

| Event | Endpoint pattern | Product use |
|---|---|---|
| Coronal mass ejections | [CME endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/CME?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd) | Event cards and replay timeline |
| CME analysis | [CMEAnalysis endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/CMEAnalysis?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&mostAccurateOnly=true) | Optional CME visual context; do not present as our own prediction |
| Geomagnetic storms | [GST endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/GST?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd) | Best first historical replay source |
| Solar flares | [FLR endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd) | Solar event timeline |
| Solar energetic particles | [SEP endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/SEP?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd) | Optional advanced event context |
| Interplanetary shocks | [IPS endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/IPS?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd) | Optional Earth-arrival storyline |
| High-speed streams | [HSS endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/HSS?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd) | Optional event timeline |
| Notifications | [notifications endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/notifications?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&type=all) | Event narrative / official notices |
| WSA-ENLIL simulations | [WSAEnlilSimulations endpoint](https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/WSAEnlilSimulations?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd) | Stretch goal: show official model output with strong provenance labels |

### DONKI implementation rules

- Start with `GST` for the historical-replay MVP.
- Store event payloads locally as fixtures after fetching so your demo is deterministic.
- Treat DONKI real-time information/simulations as research/prototyping context; never turn it into operational advice.
- Preserve `link`, `submissionTime`, event IDs and source catalogue in the UI/provenance drawer.

---

## 5. NASA/JPL Horizons system positions

NASA/JPL Horizons provides programmatic ephemerides and Cartesian state vectors for planets, natural satellites, and spacecraft. Solar Sentinel requests `VECTORS` in the ecliptic frame with `AU-D` output units for the eight planets relative to the Sun and the Moon relative to Earth.

### Product rules

- Display the returned vector time and a direct Horizons source link in the selected-object card and provenance drawer. Request the small body set sequentially from the server and retain only the last complete response as a fallback; do not preserve an `UNAVAILABLE` result as a cache entry.
- Treat values as an ephemeris snapshot. The animation advances the returned velocity for a short, labelled accelerated-learning view; it is not an orbital propagator.
- Keep visual body diameters, orbit guides, and Moon separation clearly labelled as expanded or illustrative.
- Do not present SDO’s animated Earth orbit as live spacecraft tracking. Its live contribution is the SDO imagery layer.

## 5a. Planetary imagery and international mission context

Planet detail views request a single image from the NASA Image and Video Library after selection. It is a source-linked mission image for visual context, not a live global texture or a planet-wide map. If no image is available, the view uses a clearly visual fallback surface.

The provenance drawer also links to ESA Venus Express and Mars Express, JAXA Akatsuki, and ISRO Mars Orbiter Mission. These are primary mission-context sources for learning; Solar Sentinel does not currently ingest them as live telemetry or claim their imagery is an up-to-date global map.

## 5b. Solar System Atlas chapter policy

The Atlas uses a fixed WebGL stage with scroll-directed chapters. NASA/JPL Horizons is the current-location source for every mapped body, including Pluto. NASA SDO supplies the Sun’s latest available image.

ESA, JAXA, ISRO, NOAA, UAE/MBRSC, ASI, and historical-program chapter links are curated only when they are body-relevant and role-labelled. Do not label these contextual links as live data.

## 5c. Planet surface policy

The Atlas surface catalog is deliberately reviewed rather than generated from a generic image search. It currently proxies selected [NASA/JPL Solar System Simulator maps](https://maps.jpl.nasa.gov/tmaps/) through `/api/planet-surface/[target]` for reliable browser delivery.

- Mercury, Venus, Earth, and Mars are shown as source-derived map or mosaic treatments where JPL documents the underlying historical mission imagery.
- Jupiter, Saturn, Uranus, Neptune, and Pluto are explicitly marked as **visual references** where the JPL catalog says the map is representative, historical, or not a global scientific texture.
- The renderer derives a small normal map from the luminance of approved rocky/radar mosaics solely for material micro-relief. It is not a digital elevation model, must not be used for measurement, and is disabled for illustrative gas-giant maps and Pluto.
- The Sun uses the current NASA SDO AIA image as an observed, front-facing surface treatment with an emissive/corona shader. It is a current view from one observation direction, not a full global solar map.
- NASA [Solar System Treks](https://trek.nasa.gov/) is the preferred future connector for true terrain/DEM layers: its portals use spacecraft data and expose elevation-capable map services. Do not substitute an image-derived normal map for a Trek/mission DEM in a scientific feature.
- Live orbital positions remain NASA/JPL Horizons. A texture is never used as evidence of a planet’s current surface or atmosphere.
- Add a global agency connector only when the product can preserve its source URL, timestamp or archival state, data type, and limitations.

## 5d. Atlas visual archive policy

The per-chapter `ARCHIVE` is a compact, source-labelled gallery rather than an unqualified image search. It begins with the reviewed chapter visual (a JPL surface treatment or the latest SDO image) and can include preview imagery exposed by body-relevant official NASA, ESA, JAXA, ISRO, UAE/MBRSC, NOAA, or other reviewed agency mission pages.

The local `SolarSystemData/data` archive is also served on demand through `/api/atlas-gallery/[body]` and `/api/atlas-gallery/[body]/[stage]`. Its `body_profile.json` metadata is treated as a curated research catalog: the product preserves each item’s source, year, caption, and original URL, but does not upgrade archival hosting or a mission credit into a claim of live data, a reusable texture, or a verified licence. The server reads the sibling folder by default and accepts `SOLAR_SYSTEM_DATA_ROOT` for a deliberately configured source location; production must use a reviewed rights/provenance manifest and durable asset hosting.

- A gallery tile always carries its agency and mission name and opens its specific official source page.
- A page preview is archival/contextual imagery unless the app fetches and labels a current data product. It is never described as live merely because it is retrieved during page load.
- If an approved source page does not expose a safe image preview, the tile falls back to the reviewed chapter visual while retaining the mission source link and limitation.
- The gallery is limited to agencies with a body-relevant primary mission source. It is not a claim that every world has been imaged by every space agency.

---

## 6. Optional location and map data

These are optional because Solar Sentinel’s core data is space-weather data. Add them only after the live Sun-to-Earth experience is reliable.

| Need | Recommended source | Link | Notes |
|---|---|---|---|
| City coordinates | Static app configuration for Lübeck, Delhi and Bengaluru | N/A | Hard-code three vetted coordinates for MVP; no geocoding API required |
| Day/night terminator | Compute locally from UTC time and selected location | N/A | No external data required |
| Base map | MapLibre + OpenStreetMap-compatible tiles | [MapLibre](https://maplibre.org/) | Use only if a map improves the location view |
| Cloud cover | Add later from a weather provider | N/A | Do not block MVP on weather; cloud cover is necessary before making any strong viewing guidance |

### Approved MVP locations

```ts
export const locations = {
  luebeck: { name: "Lübeck", country: "Germany", lat: 53.8655, lon: 10.6866 },
  delhi: { name: "Delhi", country: "India", lat: 28.6139, lon: 77.2090 },
  bengaluru: { name: "Bengaluru", country: "India", lat: 12.9716, lon: 77.5946 },
} as const;
```

---

## 6. Polling, cache and fallback policy

| Source class | Server poll | Browser refresh | Cache / retention | Fallback |
|---|---:|---:|---|---|
| SDO images | 10–15 min | Read app API only | Object storage; retain selected snapshots | Local fallback image |
| Kp / solar wind | 5 min | 60–120 sec | Postgres/Redis latest + raw archive | Last known good snapshot |
| Aurora grid | 10 min | 5 min | Object storage or database snapshot | Cached grid / hidden layer with message |
| Alerts | 5 min | 60–120 sec | Latest record + history | Cached official alert list |
| DONKI | 30–60 min or on demand | User initiated | Database + bundled replay fixture | Historical fixture |

The UI must never silently show stale data. Every view displays `Live`, `Delayed`, `Cached`, `Replay`, or `Unavailable`.

---

## 7. Required provenance fields

Attach this metadata to every source-derived value or visual layer:

```ts
export type DataProvenance = {
  provider: "NASA_SDO" | "NOAA_SWPC" | "NASA_DONKI";
  productName: string;
  sourceUrl: string;
  observedAt: string | null;
  issuedAt: string | null;
  fetchedAt: string;
  freshnessMinutes: number | null;
  layer: "observed" | "official_forecast" | "model_output";
};
```

The `SOLAR SENTINEL SCENARIO` uses a different object because it is our educational model:

```ts
export type ScenarioProvenance = {
  provider: "SOLAR_SENTINEL";
  layer: "simulated";
  assumptions: string[];
  disclaimer: "Educational simulation. Not a prediction or operational advisory.";
  generatedAt: string;
};
```

---

## 8. Environment variables

```bash
# NASA API key is needed only where the chosen NASA API requires it.
NASA_API_KEY=replace_with_own_key

# Do not expose secrets to the browser.
OPENAI_API_KEY=replace_with_server_secret

# Optional database/cache/storage variables
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Do not use `DEMO_KEY` in the deployed project. NASA documents substantially lower limits for the demo key; register a personal developer key before production/demo deployment.

---

## 9. Build sequence

1. Fetch/cache **SDO AIA 193** and display it as the hero texture.
2. Fetch **observed Kp** and **forecast Kp**, displaying them under separate truth labels.
3. Add **solar-wind plasma and IMF** cards and use them only for illustrative scene intensity.
4. Add the **OVATION aurora grid** around Earth.
5. Add **active NOAA alerts** as an official-status panel.
6. Add one **DONKI GST historical replay**, with a bundled fixture.
7. Connect the validated snapshot to the GPT explanation endpoint.

---

## 10. Strict implementation boundaries

### We may say

- “NOAA currently reports…”
- “NASA’s latest available SDO image shows…”
- “NOAA’s aurora model indicates…”
- “In this Solar Sentinel scenario…”

### We must not say

- “Solar Sentinel predicts a storm.”
- “Your GPS will be inaccurate by X metres.”
- “Your grid will fail.”
- “You will definitely see aurora in Lübeck.”
- “A CME will arrive at your city at this time.”

---

## 11. Credits for the product

Add a permanent source panel and include this concise credit:

```text
Solar imagery: NASA Solar Dynamics Observatory (SDO).
Space-weather observations, forecasts, alerts and aurora model data: NOAA Space Weather Prediction Center (SWPC).
Historical space-weather event analysis: NASA CCMC DONKI.
Solar Sentinel scenarios are educational visual simulations, not forecasts.
```

Review NASA/NOAA usage and branding policies before release. Do not use NASA or NOAA logos/insignia as Solar Sentinel branding.
