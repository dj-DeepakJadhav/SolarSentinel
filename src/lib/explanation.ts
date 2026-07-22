import type { Explanation, LearningMode, Location, ScenarioLevel, SpaceWeatherSnapshot } from "@/src/domain/space-weather";

function value(value: number | null, unit: string) {
  return value === null ? null : `${value}${unit}`;
}

function layerLabel(layer: SpaceWeatherSnapshot["provenance"][number]["layer"]) {
  if (layer === "official_forecast") return "NOAA FORECAST";
  if (layer === "simulated") return "SCENARIO";
  if (layer === "model_output") return "MODEL OUTPUT";
  return "LIVE OBSERVED";
}

export function sourceNotesForSnapshot(snapshot: SpaceWeatherSnapshot): Explanation["sourceNotes"] {
  const seen = new Set<string>();
  return snapshot.provenance.flatMap((source) => {
    const timestampUtc = source.observedAt ?? source.issuedAt ?? source.fetchedAt;
    const key = `${source.sourceUrl}:${timestampUtc}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ source: `${layerLabel(source.layer)} · ${source.productName}`, timestampUtc, url: source.sourceUrl }];
  }).slice(0, 6);
}

export function buildFallbackBriefing(snapshot: SpaceWeatherSnapshot, location: Location, scenario: ScenarioLevel, learningMode: LearningMode = "student"): Explanation {
  const observed = [
    value(snapshot.kpObserved, " Kp"),
    value(snapshot.solarWindSpeedKms, " km/s solar wind"),
    value(snapshot.imfBzNt, " nT Bz"),
  ].filter((item): item is string => item !== null);
  const observedSentence = observed.length > 0 ? observed.join(" · ") : "No current observed values were available in this snapshot.";
  const forecastSentence = snapshot.kpForecastMax === null
    ? "No official Kp forecast maximum was available in this snapshot."
    : `NOAA's displayed forecast maximum is ${snapshot.kpForecastMax} Kp. It is separate from the observed value and is not a local-impact prediction.`;
  const scenarioSentence = scenario === "quiet"
    ? "Scenario is off. The Earth scene responds to the displayed data layers, while illustrative motion remains explicitly non-operational."
    : `The ${scenario} scene is Solar Sentinel's educational simulation. It is not a prediction, arrival estimate, or operational advisory.`;

  const teacher = learningMode === "teacher";
  return {
    summary: teacher ? `Class prompt: what evidence in this ${snapshot.status.toUpperCase()} snapshot comes from observation, rather than a simulation?` : `A ${snapshot.status.toUpperCase()} space-weather snapshot is available for ${location.name}.`,
    observed: teacher ? `OBSERVE: ${observedSentence}. Ask students which number describes measured conditions, and why it does not predict a local outcome.` : `LIVE OBSERVED: ${observedSentence}. These are broad space-weather measurements, not a forecast for ${location.name}.`,
    officialForecast: teacher ? `COMPARE: ${forecastSentence}` : `NOAA FORECAST: ${forecastSentence}`,
    scenario: teacher ? `MODEL: ${scenarioSentence}` : `SOLAR SENTINEL SCENARIO: ${scenarioSentence}`,
    uncertainty: teacher ? "SOURCE CHECK: use the linked timestamps to ask what is current, what is modelled, and what remains uncertain. A live GPT briefing can add a concise, source-grounded facilitation guide when the server-side API key is configured." : "This fallback is generated from the displayed snapshot only. A live GPT briefing can add a concise, source-grounded interpretation when the server-side API key is configured.",
    sourceNotes: sourceNotesForSnapshot(snapshot),
  };
}
