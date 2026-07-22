# Solar Sentinel — Product & Technical Specification

> **Purpose:** This document is the implementation brief for Codex and the development team.
>
> **Project:** Solar Sentinel
> **Hackathon category:** Apps for your life (recommended)
> **Alternative category:** Education, only if classroom missions and teacher workflow become the core product.
> **Product status:** Hackathon MVP specification

---

## 1. The original idea

**Solar Sentinel** is a beautiful live space-weather application that makes an invisible system understandable.

It follows current solar activity from the Sun to Earth using real NASA and NOAA data. It combines a cinematic 3D Sun–Earth scene, official space-weather observations and forecasts, location-aware explanations for places such as Lübeck and Delhi, and an explicitly hypothetical scenario simulator.

### One-line pitch

> **From a solar eruption to your sky: see space weather arrive.**

### Core human question

> “The Sun is active now. What has actually been observed, what do official agencies forecast, and what could it mean for my chosen place?”

### Why this is a strong hackathon idea

- It uses changing, real mission data rather than a static dataset.
- It has a memorable visual journey: Sun -> solar wind -> Earth magnetosphere -> a user’s city.
- It solves an explanation problem, not merely a data-display problem.
- It has an honest AI role: translate structured, source-stamped facts into clear language; do not invent scientific claims.
- It shows meaningful Codex use across data engineering, UI, 3D visualisation, tests, resilience, and review.

---

## 2. Category decision

Submit as **Apps for your life**.

The main experience should be designed for an individual: a photographer in northern Germany, an aviation/technology-curious person, a student, or anyone asking whether current space weather is calm or elevated and why it matters.

Do not submit as Education unless the final app mainly contains guided classroom lessons, teacher controls, learning objectives, and student assessment. A generic science visualisation is weaker in Education than a polished personal live-information product in Apps for your life.

---

## 3. Product principles

1. **Truth before spectacle.** Never blur data, forecasts, and hypothetical simulation.
2. **One exceptional journey.** Build a coherent 3-minute demo flow, not a giant observatory dashboard.
3. **Live, but resilient.** The application must still work if an upstream public feed is delayed or unavailable.
4. **Explain, do not predict.** Solar Sentinel is not a flare/CME prediction engine or emergency operations tool.
5. **Beautiful because it clarifies.** 3D animation must communicate scale, direction, state, or causality; it must not be decoration.
6. **Source-grounded AI only.** The language model may explain supplied data but may not browse freely, calculate operational advice, or make unsupported claims.

---

## 4. Non-negotiable truth layers

Every item visible in the product belongs to exactly one of these layers.

| Layer | Persistent UI label | Definition | Examples |
|---|---|---|---|
| Observation | `LIVE OBSERVED` | A measurement, current image, or measured/modelled data product from a named source | SDO image; observed Kp; solar wind speed |
| Official forecast | `NOAA FORECAST` | Forecast, watch, warning, or alert issued by an official agency | Forecast Kp; official geomagnetic storm watch |
| Simulation | `SOLAR SENTINEL SCENARIO` | An educational, hypothetical visual scenario created by our transparent rules | “If geomagnetic activity reached strong conditions” |

Rules:

- Observation and forecast are never visually mixed.
- Simulation must remain labelled even during transitions or screenshots.
- Each data card displays source, UTC measurement/issue time, and fetch time.
- AI answers must say whether their claim is observation, official forecast, or simulation.

---

## 5. Target users

### Primary

A curious person in Lübeck, northern Germany, or India who has heard that the Sun is active and wants a trustworthy, understandable answer—not raw scientific telemetry.

### Secondary

- Aurora photographers and sky watchers
- Students and science communicators
- Developers/designers interested in live data visualisation
- General users who want to understand how satellite and navigation systems relate to the Sun

### Not target users

- Grid operators
- Emergency dispatchers
- Pilots/airline operational teams
- Satellite mission controllers
- Researchers who need raw calibrated scientific data

We must not imply that Solar Sentinel is appropriate for operational decisions by these groups.

---

## 6. MVP user story

1. A visitor opens Solar Sentinel.
2. They see the latest available NASA solar image mapped to a 3D Sun.
3. They see a short current-status sentence sourced from latest NOAA data.
4. They click **Trace impact to Earth**.
5. The camera travels through an illustrative solar-wind stream to Earth’s magnetosphere.
6. They choose **Lübeck**, **Delhi**, or **Bengaluru**.
7. They see the current truth layers: observed data, official forecast, and source status.
8. They ask a constrained question, such as: “What does this mean for Lübeck tonight?”
9. They activate a clearly labelled scenario slider and see a hypothetical stronger event.
10. They open a historical replay showing a real catalogued solar event.

### Definition of done for the demo

A judge can complete the above journey even if NASA/NOAA are unavailable, because the application falls back to a timestamped cached snapshot or bundled replay fixture.

---

## 7. Visual direction

### Hero composition

- **Left:** large, detailed live/near-live solar texture.
- **Middle:** sparse, elegant solar-wind particle flow. It is labelled illustrative.
- **Right:** Earth, thin transparent blue/violet magnetosphere, animated auroral oval, selected-city card.
- **Bottom:** source timeline and three truth-layer tabs.
- **Mood:** black space, warm solar gold/orange, electric cyan/violet magnetic field, emerald aurora; premium scientific editorial design, not a game HUD.

### Required UI elements

- `LIVE / DELAYED / CACHED / REPLAY / UNAVAILABLE` data-status pill
- Latest-data timestamp in UTC
- Source cards and direct source URLs
- Selected location card
- `Observed`, `Official forecast`, `Scenario` segment control
- Reduced-motion option and 2D fallback
- “How do we know?” drawer explaining data provenance and assumptions

### Do not do

- Do not display fake spacecraft telemetry.
- Do not show numerical precision that sources cannot support.
- Do not make every object glow or animate continuously.
- Do not use NASA logos or insignia as app branding.

---

## 8. Data sources

Use server-side adapters. Do not scrape human-facing dashboards for core values.

### NASA SDO

Use SDO images as the live visual anchor.

Start with exactly two images:

- AIA 193 Angstrom: corona/activity visual
- HMI colour magnetogram: magnetic-field visual

Example current image URLs (verify availability before release):

```ts
export const sdoAssets = {
  corona193: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg",
  magnetogram: "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIBC.jpg",
};
```

Poll every 10-15 minutes. Persist the image and metadata to application storage; do not force every client to hotlink NASA.

### NOAA SWPC

Start with a narrow set of feeds:

- Observed planetary Kp
- Kp forecast
- Solar-wind plasma values
- Interplanetary magnetic field values
- Active official alerts, watches, warnings
- OVATION aurora model output, if available
- Solar X-ray flux, optional for MVP

Use public NOAA SWPC JSON endpoints via server adapters. Validate all payloads. Do not treat all products as having identical latency or scientific meaning.

### NASA DONKI

Use DONKI for one historical replay and event context:

- Solar flare
- Coronal mass ejection (CME)
- Geomagnetic storm
- Interplanetary shock
- Solar energetic particle event
- High-speed stream

### Source policy

For every data element, store:

```ts
export type DataProvenance = {
  source: "NASA_SDO" | "NOAA_SWPC" | "NASA_DONKI" | "SOLAR_SENTINEL";
  sourceUrl: string;
  observedAt: string | null;
  issuedAt: string | null;
  fetchedAt: string;
  freshnessMinutes: number | null;
  confidence: "observed" | "official_forecast" | "model_output" | "simulated";
};
```

---

## 9. Technical architecture

### Recommended stack

| Area | Technology |
|---|---|
| Front end | Next.js + React + TypeScript |
| 3D | React Three Fiber + Three.js |
| 2D map (optional) | MapLibre GL or deck.gl |
| Styling | Tailwind CSS + CSS variables/design tokens |
| Charts | Recharts or D3 |
| API | Next.js route handlers |
| Database | Postgres via Supabase or Neon |
| Object storage | Supabase Storage, Cloudflare R2, or Vercel Blob |
| Cache | Upstash Redis or framework cache |
| Validation | Zod |
| Jobs | Vercel Cron / Trigger.dev / GitHub Actions |
| Tests | Vitest + Playwright |
| Deployment | Vercel |

Use a **modular monolith**. Do not build microservices, Kubernetes, Kafka, or distributed queues for a hackathon MVP.

### High-level architecture

```text
Browser
  └─ Next.js UI
      ├─ 3D Sun-Earth visualisation
      ├─ accessible 2D status/cards
      ├─ scenario controls
      └─ grounded AI explanation UI

Next.js server
  ├─ /api/snapshot
  ├─ /api/explain
  ├─ /api/replay/:eventId
  ├─ data adapters
  ├─ schema validation
  ├─ cache + last-known-good fallback
  └─ OpenAI gateway

Scheduled ingestion
  ├─ NASA SDO image collector
  ├─ NOAA SWPC collectors
  ├─ snapshot normaliser
  └─ object/database persistence

External sources
  ├─ NASA SDO
  ├─ NOAA SWPC
  └─ NASA DONKI
```

---

## 10. Domain model

```ts
export type SpaceWeatherSnapshot = {
  id: string;
  capturedAt: string;
  status: "live" | "delayed" | "cached" | "replay" | "unavailable";
  kpObserved: number | null;
  kpForecastMax: number | null;
  solarWindSpeedKms: number | null;
  solarWindDensityCm3: number | null;
  imfBzNt: number | null;
  xrayClass: string | null;
  activeAlerts: OfficialAlert[];
  aurora: AuroraGrid | null;
  solarImage: SolarImage | null;
  provenance: DataProvenance[];
};

export type ScenarioLevel = "quiet" | "elevated" | "strong" | "extreme";

export type ScenarioResult = {
  level: ScenarioLevel;
  disclaimer: "Educational simulation. Not a prediction or operational advisory.";
  visual: {
    particleDensity: number;
    particleVelocity: number;
    magnetosphereCompression: number;
    auroraExpansion: number;
    colorTheme: "calm" | "elevated" | "strong" | "extreme";
  };
  broadImpactBands: {
    aurora: "low" | "elevated" | "high" | "very_high";
    satelliteNavigation: "normal" | "possible_degradation" | "elevated_risk";
    radioCommunication: "normal" | "possible_degradation" | "elevated_risk";
  };
  assumptions: string[];
};
```

Use real scientific units in raw/observed cards, but use broad, non-operational labels in consumer-facing impact cards.

---

## 11. Data ingestion and resilience

### Collector requirements

Each provider adapter must:

1. Fetch server-side with a timeout.
2. Validate payload with Zod.
3. Parse all timestamps as UTC.
4. Normalise fields and units.
5. Store raw payload for debugging.
6. Store a normalized immutable snapshot.
7. Update `lastKnownGood` only after successful validation.
8. Emit provider health metadata.
9. Never crash the page if one provider fails.

### Example adapter shape

```ts
export interface SpaceWeatherProvider<T> {
  name: string;
  fetch(): Promise<T>;
  validate(input: unknown): T;
  normalize(data: T): Partial<SpaceWeatherSnapshot>;
}
```

### Required states

| Status | Rule | UI copy |
|---|---|---|
| Live | Data freshness within expected interval | “Live data” |
| Delayed | Provider works but data is old | “Source delay: showing latest available data” |
| Cached | Provider failed; verified prior snapshot exists | “Cached verified snapshot” |
| Replay | User selected a historical event | “Historical replay” |
| Unavailable | No trusted data exists | “This source is currently unavailable” |

### Demo fallback

Bundle at least:

- one quiet/calm snapshot;
- one elevated current-like snapshot;
- one strong historical event replay;
- SDO fallback imagery;
- deterministic test fixtures.

---

## 12. Scenario engine

### Purpose

The scenario engine changes visual and educational states; it does **not** forecast or physically propagate a CME.

### Inputs

- Latest validated snapshot
- Selected scenario level
- Selected location
- Time-of-day / simple sky-view context, optional

### Output

- Visual parameters for the 3D scene
- General impact bands
- Explicit assumptions
- Required disclaimer
- Structured context for the AI explainer

### Scenario levels

| Level | User name | Visual changes | Allowed language |
|---|---|---|---|
| `quiet` | Quiet | Gentle solar particles; normal magnetosphere | “Typical conditions” |
| `elevated` | Elevated | More active particles; small auroral expansion | “Potentially elevated conditions” |
| `strong` | Strong | Larger auroral oval; amber system indicators | “Higher likelihood of disruption to some systems” |
| `extreme` | Extreme | Intense aurora; red educational impact layer | “Extreme educational scenario, not a forecast” |

### Explicit non-goals

- No solar flare prediction
- No CME arrival-time calculation
- No local GPS-position-error measurement
- No power-grid operations advice
- No airline routing instruction
- No satellite collision or failure prediction

### Visual-state rule example

```ts
export function deriveLiveVisualState(snapshot: SpaceWeatherSnapshot): number {
  const kp = snapshot.kpObserved ?? 0;
  const speed = snapshot.solarWindSpeedKms ?? 350;
  const southwardBz = Math.max(-(snapshot.imfBzNt ?? 0), 0);

  return (
    Math.min(kp / 9, 1) * 0.55 +
    Math.min(Math.max(speed - 350, 0) / 650, 1) * 0.25 +
    Math.min(southwardBz / 25, 1) * 0.20
  );
}
```

This is a UI intensity score, not a scientific forecasting model. State that clearly in code comments, docs, and UI.

---

## 13. Location-specific output

### Supported MVP locations

- Lübeck, Germany
- Delhi, India
- Bengaluru, India

### What the app can say

- Current observed space-weather conditions
- Current official forecast or alert status
- Broad aurora visibility context when supported by an official aurora model
- Day/night state
- General explanation of satellite-navigation, radio, and satellite-system exposure

### What the app must not say

- “Your GPS will be inaccurate by X metres.”
- “Your local grid will fail.”
- “You will definitely see an aurora.”
- “A solar storm will hit your city at X time.”

For Delhi/Bengaluru, ensure the UI does not imply ordinary aurora visibility. The education value is that global infrastructure and space weather remain connected even where aurora is unlikely.

---

## 14. OpenAI / GPT-5.6 integration

### AI role

The model is a **source-grounded explainer**, not an authority on the current Sun. It only receives a server-created, validated context object.

### Use cases

- Explain current state in plain English, German, Hindi, or another supported language.
- Compare observed status with the selected scenario.
- Answer “What is Kp?” or “Why does Bz matter?” using app-approved explanation content.
- Produce a short, source-aware mission briefing.
- Explain uncertainty and data freshness.

### Non-use cases

- Web browsing at user request
- Independent data retrieval by the model
- Free-form astrophysics diagnosis
- Infrastructure operating advice
- Claims beyond supplied input

### Context contract

```json
{
  "snapshotTimestampUtc": "2026-07-16T20:45:00Z",
  "location": {
    "name": "Lübeck",
    "country": "Germany",
    "latitude": 53.87,
    "longitude": 10.69
  },
  "observed": {
    "kp": 3.67,
    "solarWindSpeedKms": 425,
    "imfBzNt": -2.1,
    "activeAlerts": []
  },
  "officialForecast": {
    "kpMaxNext24h": 4,
    "auroraProvider": "NOAA OVATION"
  },
  "scenario": {
    "enabled": false,
    "level": null
  },
  "provenance": []
}
```

### Response schema

```ts
export const ExplanationSchema = z.object({
  summary: z.string().max(380),
  observed: z.string().max(500),
  officialForecast: z.string().max(500),
  scenario: z.string().max(500),
  uncertainty: z.string().max(450),
  sourceNotes: z.array(z.object({
    source: z.string(),
    timestampUtc: z.string(),
    url: z.string().url()
  })).max(8)
});
```

### System instructions for the explainer

```text
You are Solar Sentinel's source-grounded space-weather explainer.
Use only the structured context provided by the application.
Never claim to predict solar eruptions, CME arrival times, local power outages, GPS error, or satellite failure.
Clearly distinguish: LIVE OBSERVED, NOAA FORECAST, and SOLAR SENTINEL SCENARIO.
A scenario is hypothetical and must always be labelled as such.
If a requested answer is not supported by the context, say so plainly.
Use clear non-alarmist language.
Return valid JSON matching the required schema only.
```

### Model usage strategy

- Use the current GPT-5.6 model suitable for structured explanations at runtime.
- Use the strongest available coding model in Codex for complex build/review tasks.
- Use a cheaper/faster model only for deterministic translation/classification if it passes schema and quality tests.
- Pin exact model IDs in environment configuration rather than scattering model names through application code.

---

## 15. Security and safety

- All third-party keys and OpenAI calls are server-side only.
- Apply request rate limits to `/api/explain`.
- Cache repeated explanations keyed by snapshot + location + language + scenario.
- Validate all upstream data with Zod.
- Validate all model output before UI render.
- Treat user text as untrusted; never concatenate it into system instructions.
- Add CSP headers and restrict image origins.
- Log provider failures without exposing sensitive values.
- Use only public/non-sensitive data for the hackathon.

---

## 16. Accessibility and performance

### Accessibility requirements

- Full keyboard navigation for all controls.
- Semantic labels for 3D scene controls.
- High-contrast text and data-state indicators beyond colour alone.
- `prefers-reduced-motion` mode: pause decorative particle movement and camera flight.
- Accessible 2D alternative view for essential status and maps.
- Text alternatives for the current visual scene.

### Performance targets

- First meaningful status in under 3 seconds on normal broadband.
- Dynamic-import 3D scene after essential data/status UI.
- Limit particle count on mobile/low-power GPUs.
- Use compressed, cached SDO image derivatives.
- Graceful fallback to static image plus 2D cards.

---

## 17. Testing plan

### Unit tests

- Provider schema validation
- Unit normalization
- Timestamp and freshness calculation
- Last-known-good fallback
- Scenario-level boundaries
- Truth-layer label rules
- Location output safeguards
- AI response schema parsing

### Integration tests

- NOAA/NASA adapter uses fixture payloads
- Snapshot aggregation handles one failed provider
- API returns cached snapshot on upstream failure
- AI endpoint rejects invalid structured output

### Playwright end-to-end test

```text
Open app
-> see LIVE/CACHED status
-> select Lübeck
-> open source/provenance drawer
-> activate Strong scenario
-> confirm scenario disclaimer is visible
-> ask “What does this mean for Lübeck?”
-> receive structured answer with observed/forecast/scenario sections
-> switch to historical replay
```

---

## 18. Recommended repository structure

```text
solar-sentinel/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── api/
│   │   ├── snapshot/route.ts
│   │   ├── explain/route.ts
│   │   ├── replay/[eventId]/route.ts
│   │   └── cron/ingest/route.ts
│   └── about/page.tsx
├── components/
│   ├── scene/
│   │   ├── SolarSystemScene.tsx
│   │   ├── Sun.tsx
│   │   ├── Earth.tsx
│   │   ├── Magnetosphere.tsx
│   │   ├── Aurora.tsx
│   │   └── ParticleStream.tsx
│   ├── status/
│   ├── scenario/
│   ├── explain/
│   └── ui/
├── src/
│   ├── domain/
│   ├── lib/providers/
│   │   ├── noaa-swpc.ts
│   │   ├── nasa-sdo.ts
│   │   ├── nasa-donki.ts
│   │   └── schemas.ts
│   ├── lib/scenario/
│   ├── lib/openai/
│   ├── lib/storage/
│   └── lib/format/
├── fixtures/
│   ├── quiet.json
│   ├── elevated.json
│   └── historical-event.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── architecture.md
│   ├── data-provenance.md
│   ├── scientific-limitations.md
│   └── codex-worklog.md
└── README.md
```

---

## 19. Codex execution plan

Codex should make small, reviewable changes. Do not ask it to create the whole application in one unreviewable operation.

### Phase 1: plan and contracts

**Prompt to Codex**

```text
Inspect this repository and this specification. Do not write UI yet.
Create a concise implementation plan, an architecture decision record, TypeScript domain types, Zod schemas, and fixtures for a SpaceWeatherSnapshot.
List unknown upstream API details separately rather than inventing them.
Add Vitest tests for schema parsing and timestamp/freshness calculations.
```

Acceptance criteria:

- Typed snapshot contract exists.
- All fixtures parse.
- Tests pass.
- Unknown data details are documented, not guessed.

### Phase 2: provider adapters

**Prompt to Codex**

```text
Implement NASA SDO, NOAA SWPC, and NASA DONKI provider adapters behind a shared interface.
Each adapter must have timeout handling, Zod validation, UTC normalization, provenance metadata, and fixture-based tests.
Implement last-known-good fallback. Do not create frontend components in this task.
```

Acceptance criteria:

- One provider can fail without failing the aggregate snapshot.
- Raw and normalized payload types are separated.
- Source freshness is calculable.

### Phase 3: scenario engine

**Prompt to Codex**

```text
Implement a non-predictive scenario engine with quiet, elevated, strong, and extreme states.
It must return visual parameters, broad impact bands, mandatory disclaimer text, and assumptions.
Add exhaustive tests proving every scenario output remains labelled as a simulation and never returns operational advice.
```

### Phase 4: data UI

**Prompt to Codex**

```text
Build accessible status cards for Observed, NOAA Forecast, and Solar Sentinel Scenario.
Every card must show source and UTC timestamp. Implement live, delayed, cached, replay, and unavailable states.
Use fixtures first. Do not build 3D yet.
```

### Phase 5: 3D scene

**Prompt to Codex**

```text
Build a React Three Fiber Sun-Earth scene based on the visual direction in the specification.
Use a live SDO image texture when available; use a local fallback texture otherwise.
Make solar particles and auroral oval illustrative. Add reduced-motion support, mobile particle limits, and a 2D fallback.
```

### Phase 6: grounded AI

**Prompt to Codex**

```text
Implement a server-only OpenAI explanation endpoint.
Construct the model context solely from the validated snapshot, selected location, and scenario output.
Enforce JSON schema validation on the response. Render observed, official forecast, scenario, uncertainty, and source notes separately.
Add tests for invalid model output and prompts asking for unsupported prediction claims.
```

### Phase 7: review and hardening

**Prompt to Codex**

```text
Audit this codebase for: unsupported scientific claims, source/provenance gaps, stale-data failures, prompt injection, missing error states, accessibility issues, mobile performance risks, and duplicated logic.
Propose a prioritised remediation plan, then make fixes in small commits with tests.
```

### Codex evidence to preserve

- Architecture docs and decision records
- Meaningful commits
- Test suite and CI output
- `docs/codex-worklog.md` showing prompts, decisions, and accepted/rejected changes
- A short demo sequence of Codex creating an adapter/test or improving an issue

---

## 20. Build schedule

### Day 1

- Initialise project, visual tokens, typed contracts
- Add fixtures, adapters skeleton, tests
- Implement static hero composition

### Day 2

- Implement SDO and NOAA fetch/validation/cache
- Implement data state cards and provenance drawer
- Add one location selector

### Day 3

- Connect snapshot to 3D visual state
- Build scenario engine and UI
- Add Lübeck, Delhi, Bengaluru cards

### Day 4

- Add grounded GPT explanation API
- Add DONKI historical replay
- Add fallback/replay mode and E2E tests

### Final day

- Accessibility/mobile/performance pass
- Scientific-claims audit
- Record demo video
- Write README, architecture, limitations, and Codex worklog

---

## 21. Demo script (under 3 minutes)

1. **0:00-0:15 — Hook:** “The Sun is active. What does that actually mean for someone in Lübeck?”
2. **0:15-0:35 — Live proof:** Show current SDO image and NOAA source timestamps.
3. **0:35-1:00 — Visual journey:** Press Trace impact to Earth; camera travels from Sun to Earth.
4. **1:00-1:25 — Personal context:** Select Lübeck; show observed conditions and official forecast separately.
5. **1:25-1:50 — AI explanation:** Ask what it means; show concise, sourced response with uncertainty.
6. **1:50-2:15 — Scenario:** Turn on Strong scenario; screen visibly changes but simulation label stays prominent.
7. **2:15-2:35 — Reliability:** Turn on historical replay/cached mode; show app remains usable without live feed.
8. **2:35-3:00 — Codex:** Show tests, provider adapters, and source/limitation docs; close with the mission statement.

---

## 22. Honest risk register

| Risk | Severity | Mitigation |
|---|---:|---|
| App looks like an existing dashboard | High | Make location-specific explanation and three truth layers the centre of the experience |
| Fake-looking science | High | Cite every metric; label illustrative elements and scenario outputs permanently |
| Upstream feeds fail in demo | High | Cache, fixtures, replay mode, and last-known-good snapshot |
| 3D causes poor performance | Medium | Dynamic load, fewer particles, static/2D fallback, test on normal laptop/mobile |
| AI hallucinates | High | Pass structured context only; schema validation; constrained system instructions; show source notes |
| Scope explosion | High | Commit to one polished journey, 3 locations, 2 solar images, and a limited feed set |
| Inaccurate local impact claims | High | Use broad educational bands only; no GPS/grid/outage precision |
| Data licence/branding issue | Medium | Credit sources; review usage policy; do not use agency logos/insignia as branding |

---

## 23. What not to build

- A real solar prediction model
- Full heliophysics simulation or MHD equations
- Every satellite/mission tracker
- Real-time satellite orbit collision analysis
- Grid-control, aviation, or emergency instructions
- A generic unrestricted “ask the Sun” chatbot
- Accounts, social features, payments, or notifications before core experience works
- More than three initial locations

---

## 24. Final quality bar

This project is successful when a judge says:

> “I can see where the data came from, understand what is real versus hypothetical, and immediately understand why the visual experience matters.”

This project fails if it is only a rotating Sun, generic AI prose, unlabelled simulations, or an impressive visual with no source provenance.

### Final definition

**Solar Sentinel is a source-grounded, visually cinematic, live space-weather companion—not a prediction engine.** It connects real observations from the Sun to an understandable Earth-level story, then uses an honest scenario layer to teach possible consequences without overstating certainty.
