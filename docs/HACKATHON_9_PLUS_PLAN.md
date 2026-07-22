# Solar Atlas — 9+/10 Hackathon Plan

## Product promise

**Turn live solar observations into a clear, source-grounded explanation of what they mean for Earth.**

The planetary Atlas is the beautiful entry point and the context for the story. The judged product is not an encyclopedia or a decorative simulation: it is a short, visual learning journey from a real Sun observation to a careful explanation of Earth impact.

## Winning demo path

```text
Solar system → Sun → live observation → Earth shield → May 2024 replay → AI explanation
```

Everything outside this route supports curiosity, but must not interrupt the three-minute narrative.

## Four moves

### 1. Make the promise visible

Put the promise on the first narrative handoff after the orbital map, not as a large landing-page wall of text. The Sun chapter should immediately expose one compact action: **EXPLAIN THIS LIVE SUN**.

Success criteria:

- a learner understands the product purpose in one sentence;
- current SDO timestamp and NOAA state are one interaction away;
- the source and freshness state remain visible without claiming a forecast.

### 2. Make GPT-5.6 indispensable

Build one bounded explainer, not a generic chatbot. Its inputs are a reviewed snapshot object containing the latest SDO metadata, NOAA/SWPC readings and forecast, the selected location, the active Solar Sentinel scenario, and—when selected—the May 2024 archived event.

Required prompt actions:

1. **Explain this live Sun**
2. **Compare it to the May 2024 event**
3. **Teach me why Earth is protected**
4. **Check my understanding** — one evidence-backed multiple-choice question, followed by a short explanation.

Every response must return these four labelled fields in a structured response:

| Field | Rule |
| --- | --- |
| Observed | Only values and timestamps present in the supplied snapshot. |
| Official forecast | Only NOAA/SWPC forecast or alert information supplied to the model. |
| Scenario | Clearly labelled educational simulation; never future prediction. |
| Uncertainty | Freshness, location limits, and what the data cannot establish. |

Implementation direction:

- Use the Responses API with `gpt-5.6`/`gpt-5.6-sol` for the final quality pass; use `gpt-5.6-terra` only if evaluation confirms the same evidence discipline at lower cost.
- Require structured output matching the four fields above plus `sourceIds` and `sourceTimes`.
- Start at `reasoning.effort: "medium"`; evaluate `low` for prompt chips and `high` for the replay comparison. Do not use a higher reasoning mode without a measured quality gain.
- Use a fixed source bundle; the model should explain supplied evidence, not search for or invent operational advice.
- Evaluate at least 12 fixed snapshot prompts: quiet/elevated live conditions, each city, May 2024 replay, source delay, unavailable forecast, and misleading prediction requests.

GPT-5.6 is available on the Responses API, supports structured responses and intentional reasoning settings. This plan follows the current [GPT-5.6 guidance](https://developers.openai.com/api/docs/guides/model-guidance?model=gpt-5.6-sol); API integration begins only after an `OPENAI_API_KEY` is intentionally configured.

### 3. Protect the central arc

Ship quality in this order:

1. Source/live-state proof and the dedicated Sun observation transition.
2. Earth shield scene with selected location, observed state, official forecast, and permanent scenario disclaimer.
3. One excellent NASA DONKI May 2024 replay with a labelled historical time scrubber and return-to-live control.
4. The bounded GPT-5.6 explainer and one knowledge check.
5. Planet detail/galleries, extra bodies, and non-critical visual enhancements.

Do not add accounts, notifications, free-form prediction chat, more replay events, or more scenario levels before the first four are polished.

### 4. Win the evidence package

The submission package needs a 3-minute video, a concise README, and an explicit Codex contribution record.

| Video time | What judges see | Proof |
| --- | --- | --- |
| 0:00–0:15 | Orbital Atlas collapses into the live Sun | Immediate visual quality and source timestamp. |
| 0:15–0:45 | SDO image plus live data state | NASA SDO + NOAA/SWPC provenance. |
| 0:45–1:20 | Sun-to-Earth shield transition and city view | Observed vs official forecast vs scenario separation. |
| 1:20–1:55 | May 2024 historical replay | NASA DONKI archive labels and time scrubber. |
| 1:55–2:35 | GPT-5.6 explains/compares/checks understanding | Structured evidence fields and source times in the answer. |
| 2:35–3:00 | Provenance, disclaimer, and impact | Honest limitations; return to live now. |

README checklist:

- product promise and the six-step demo path;
- exact NASA/NOAA/DONKI sources and data-state fallbacks;
- the GPT-5.6 prompt contract and evaluation cases;
- what Codex implemented: 3D scene direction, source-informed shaders, source routes, replay/data states, and UX decisions;
- a one-command local run path and a short limitations section.

## Definition of a 9+/10 vertical slice

- The first 15 seconds are visually memorable without confusing the user about what is observed.
- A judge can inspect source, timestamp, freshness state, and limitation for every live claim.
- The AI response is visibly more valuable than static copy because it compares the supplied evidence and teaches from it.
- No slider, animation, or AI answer implies a prediction or operational advisory.
- The May 2024 replay works regardless of quiet current conditions.
- The source route, current-state fallback, and GPT evaluation cases are demonstrated in the video and documented in the README.
