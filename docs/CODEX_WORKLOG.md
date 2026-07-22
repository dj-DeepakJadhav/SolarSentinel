# Codex Worklog — Solar Sentinel

This is the concise evidence trail for the OpenAI Build Week submission. It describes actual implementation work, not a claim that an AI model performed scientific analysis autonomously.

## Codex contribution

- Designed and implemented the interactive Next.js / React Three Fiber experience: NASA SDO Sun, solar-wind shader particles, magnetosphere, aurora curtains, spacecraft, camera transition, mouse trail, reduced-motion path, replay, and source drawer.
- Integrated server-side NASA SDO image proxying, NOAA SWPC snapshot normalization, NASA DONKI replay normalization, global city geocoding, validation schemas, outage fallbacks, and live/cached/replay states.
- Implemented the city-presented Earth: a NASA Blue Marble geographic texture, latitude/longitude beacon, and a tested Earth rotation that presents the selected city while retaining a Sun-aligned magnetosphere.
- Created the Student and Teacher modes and the reusable `SpaceMission` content contract for future source-first space learning experiences.
- Implemented the GPT briefing route with schema-constrained output. It receives only validated snapshot context and returns the four truth layers; source links and timestamps are attached from trusted server provenance.
- Added rate-limit protection and tests for source normalization, truth layers, geographic presentation, scenario states, and geocoding.
- Prepared the README, demo script, provenance messaging, and deployment handoff.

## GPT contribution in the product

When `OPENAI_API_KEY` is configured, the server calls the OpenAI Responses API using a structured output schema. GPT is used to translate verified context into a short educational explanation. It is not permitted to create measurements, forecasts, citations, or local impact predictions.

If the API key or model is unavailable, the same UI receives a deterministic source-grounded fallback labelled `SNAPSHOT GUIDE`.

## Reproducibility

```bash
npm install
cp .env.example .env.local
npm run test
npm run build
npm run dev
```

The project’s Devpost submission must include the **real** `/feedback` session ID from the Codex app. It is intentionally not stored in the repository.
