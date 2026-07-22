import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { BriefingContentSchema, LearningModeSchema, LocationSchema, ScenarioLevelSchema, SnapshotSchema, locations } from "@/src/domain/space-weather";
import { buildFallbackBriefing, sourceNotesForSnapshot } from "@/src/lib/explanation";
import { takeRateLimit } from "@/src/lib/request-rate-limit";

type ExplainBody = { snapshot: unknown; locationId?: string; location?: unknown; scenarioLevel: string; learningMode?: string; question?: string };

export async function POST(request: Request) {
  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rateLimit = takeRateLimit(clientKey);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Please wait a moment before requesting another briefing." }, { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } });
  let body: ExplainBody;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const snapshot = SnapshotSchema.safeParse(body.snapshot);
  const scenario = ScenarioLevelSchema.safeParse(body.scenarioLevel);
  const learningMode = LearningModeSchema.safeParse(body.learningMode ?? "student");
  const location = LocationSchema.safeParse(body.location).success ? LocationSchema.parse(body.location) : locations.find((item) => item.id === body.locationId);
  if (!snapshot.success || !scenario.success || !learningMode.success || !location) return NextResponse.json({ error: "Invalid explanation context." }, { status: 400 });
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 320) : `What does this mean for ${location.name}?`;

  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ mode: "demo", briefing: buildFallbackBriefing(snapshot.data, location, scenario.data, learningMode.data) });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const context = { snapshotTimestampUtc: snapshot.data.capturedAt, location, learningMode: learningMode.data, observed: { kp: snapshot.data.kpObserved, solarWindSpeedKms: snapshot.data.solarWindSpeedKms, imfBzNt: snapshot.data.imfBzNt }, officialForecast: { kpMaxNext24h: snapshot.data.kpForecastMax }, scenario: { enabled: body.scenarioLevel !== "quiet", level: body.scenarioLevel }, provenance: snapshot.data.provenance };
  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_EXPLAINER_MODEL || "gpt-5.6-sol",
      input: [{ role: "system", content: "Role: Solar Sentinel's source-grounded space-weather explainer. Goal: make a live Sun–Earth data scene understandable without overstating it. Success criteria: use only the supplied JSON context; keep every field to one or two short sentences; clearly distinguish LIVE OBSERVED, NOAA FORECAST, and SOLAR SENTINEL SCENARIO; state uncertainty directly when context is incomplete. Teaching mode: for student, use plain language and invite observation; for teacher, phrase the fields as a short, source-first classroom facilitation guide. Constraints: never predict solar eruptions, CME arrival, local outages, GPS errors, satellite failure, or guaranteed local aurora. Do not invent sources, timestamps, or measurements; the application attaches verified source notes separately." }, { role: "user", content: JSON.stringify({ context, question }) }],
      text: { format: zodTextFormat(BriefingContentSchema, "solar_sentinel_briefing"), verbosity: "low" },
    });
    if (!response.output_parsed) throw new Error("Model response did not match the explanation contract.");
    return NextResponse.json({ mode: "live", briefing: { ...response.output_parsed, sourceNotes: sourceNotesForSnapshot(snapshot.data) } });
  } catch {
    return NextResponse.json({ mode: "demo", briefing: buildFallbackBriefing(snapshot.data, location, scenario.data, learningMode.data), warning: "Live AI briefing was unavailable; showing a snapshot-grounded fallback." });
  }
}
