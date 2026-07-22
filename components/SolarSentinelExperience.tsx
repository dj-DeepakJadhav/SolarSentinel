"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SolarSystemScene, type ExperienceScene } from "@/components/SolarSystemScene";
import { locations, type Explanation, type LearningMode, type Location, type ScenarioLevel, type SpaceWeatherSnapshot } from "@/src/domain/space-weather";
import type { ReplayBeat } from "@/src/lib/providers/donki";
import { getDayNightContext } from "@/src/lib/location";
import { deriveLiveVisualState, deriveScenario } from "@/src/lib/scenario";
import { createUnavailableSnapshot, demoSnapshot } from "@/src/lib/fixture";
import { getStoryAct, storyActs, type StoryAct } from "@/src/lib/story";
import { solarWeatherMission } from "@/src/lib/space-missions";
import { focusDetails, type SceneFocus } from "@/src/lib/celestial-focus";
import type { SolarSystemSnapshot } from "@/src/lib/providers/horizons";
import type { NasaMedia } from "@/src/lib/nasa-media";

type MissionPanel = "location" | "scenario" | "instrument" | "spacecraft" | "replay" | "ask" | null;

const statusLabel: Record<SpaceWeatherSnapshot["status"], string> = { live: "LIVE", delayed: "DELAYED", cached: "CACHED", replay: "REPLAY", unavailable: "UNAVAILABLE" };
const metric = (value: number | null, unit: string) => value === null ? "—" : `${value}${unit}`;

export function SolarSentinelExperience() {
  const [snapshot, setSnapshot] = useState<SpaceWeatherSnapshot>(demoSnapshot);
  const [location, setLocation] = useState<Location>(locations[0]);
  const [cityQuery, setCityQuery] = useState("");
  const [cityMatches, setCityMatches] = useState<Location[]>([]);
  const [citySearchPending, setCitySearchPending] = useState(false);
  const [scenario, setScenario] = useState<ScenarioLevel>("quiet");
  const [learningMode, setLearningMode] = useState<LearningMode>("student");
  const [storyAct, setStoryAct] = useState<StoryAct>("sun");
  const [journeyAutoplay, setJourneyAutoplay] = useState(false);
  const [tracing, setTracing] = useState(false);
  const [skipFlight, setSkipFlight] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [missionPanel, setMissionPanel] = useState<MissionPanel>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [briefing, setBriefing] = useState<Explanation | null>(null);
  const [briefingMode, setBriefingMode] = useState<"live" | "demo" | null>(null);
  const [briefingLearningMode, setBriefingLearningMode] = useState<LearningMode>("student");
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [instrument, setInstrument] = useState<"193" | "magnetogram">("193");
  const [sceneView, setSceneView] = useState<ExperienceScene>("system");
  const [selectedFocus, setSelectedFocus] = useState<SceneFocus>("system");
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [solarSystem, setSolarSystem] = useState<SolarSystemSnapshot | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [booting, setBooting] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [replayTimeline, setReplayTimeline] = useState<ReplayBeat[]>([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const sky = useMemo(() => getDayNightContext(location, now), [location, now]);
  const story = getStoryAct(storyAct);
  const selectedDetail = selectedFocus === "system" ? null : focusDetails[selectedFocus];
  const replayBeat = snapshot.status === "replay" ? replayTimeline[replayIndex] : undefined;
  const visualState = useMemo(() => {
    if (scenario !== "quiet") return deriveScenario(scenario);
    return deriveLiveVisualState(replayBeat ? { ...snapshot, kpObserved: replayBeat.kpIndex } : snapshot);
  }, [snapshot, scenario, replayBeat]);

  useEffect(() => {
    let active = true;
    fetch("/api/snapshot").then((response) => response.ok ? response.json() : Promise.reject(new Error("Snapshot unavailable"))).then((data) => active && setSnapshot(data)).catch(() => active && setSnapshot(createUnavailableSnapshot()));
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/solar-system").then((response) => response.ok ? response.json() : Promise.reject(new Error("Solar system unavailable"))).then((data: SolarSystemSnapshot) => active && setSolarSystem(data)).catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), reducedMotion ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);
  useEffect(() => { if (reducedMotion) { setTracing(false); setSkipFlight(false); } }, [reducedMotion]);
  useEffect(() => {
    if (storyAct !== "observer" || reducedMotion || !journeyAutoplay) return;
    const handoff = window.setTimeout(() => { setStoryAct("stream"); setSkipFlight(false); setJourneyAutoplay(false); }, 1_850);
    return () => window.clearTimeout(handoff);
  }, [storyAct, reducedMotion, journeyAutoplay]);
  useEffect(() => {
    if (storyAct !== "stream" || reducedMotion) return;
    const arrival = window.setTimeout(() => { setStoryAct("earth"); setSkipFlight(true); }, 5_900);
    return () => window.clearTimeout(arrival);
  }, [storyAct, reducedMotion]);
  useEffect(() => { const interval = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(interval); }, []);
  useEffect(() => {
    const query = cityQuery.trim();
    if (query.length < 2) { setCityMatches([]); setCitySearchPending(false); return; }
    const controller = new AbortController();
    const delay = window.setTimeout(async () => {
      setCitySearchPending(true);
      try {
        const response = await fetch(`/api/location-search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const payload = await response.json() as { results?: Location[] };
        if (!controller.signal.aborted) setCityMatches(payload.results ?? []);
      } catch { if (!controller.signal.aborted) setCityMatches([]); }
      finally { if (!controller.signal.aborted) setCitySearchPending(false); }
    }, 280);
    return () => { controller.abort(); window.clearTimeout(delay); };
  }, [cityQuery]);

  function beginTrace() { setSceneView("sun"); setSelectedFocus("sun"); setJourneyAutoplay(false); setStoryAct("sun"); setSkipFlight(false); setTracing(false); }
  function enterSolarWind() { setSceneView("earth"); setSelectedFocus("earth"); setJourneyAutoplay(false); setStoryAct("stream"); setSkipFlight(reducedMotion); setTracing(true); }
  function openMission(panel: MissionPanel) { setSceneView(panel === "spacecraft" ? "spacecraft" : "earth"); if (panel === "scenario") { setStoryAct("scenario"); setTracing(true); setSkipFlight(true); } if (panel === "spacecraft") { setJourneyAutoplay(false); setStoryAct("observer"); setTracing(true); setSkipFlight(true); } setConsoleOpen(true); setMissionPanel(panel); }
  function chooseLocation(next: Location) { setSceneView("earth"); setSelectedFocus("earth"); setLocation(next); setCityQuery(""); setCityMatches([]); setJourneyAutoplay(false); setStoryAct("earth"); setTracing(true); setSkipFlight(true); }

  function chooseFocus(focus: SceneFocus) { setSelectedFocus(focus); }
  function enterFocusedFieldView() {
    const target = selectedFocus === "moon" ? "earth" : selectedFocus === "spacecraft" ? "spacecraft" : selectedFocus;
    if (target !== "sun" && target !== "earth" && target !== "spacecraft") {
      setSceneView("planet");
      setTracing(false);
      setSkipFlight(false);
      setConsoleOpen(false);
      return;
    }
    setSceneView(target === "sun" ? "sun" : target === "earth" ? "earth" : "spacecraft");
    setStoryAct(target === "sun" ? "sun" : target === "earth" ? "earth" : "observer");
    setTracing(target !== "sun");
    setSkipFlight(target !== "sun");
    if (target === "spacecraft") openMission("spacecraft");
  }

  function returnToSystem() { setSceneView("system"); setSelectedFocus("system"); setTracing(false); setSkipFlight(false); setConsoleOpen(false); }

  function chooseScenario(next: ScenarioLevel) {
    setScenario(next);
    if (next === "quiet") { setStoryAct("earth"); return; }
    setStoryAct("scenario");
    setTracing(true);
    setSkipFlight(true);
  }

  async function returnToLive() {
    const response = await fetch("/api/snapshot");
    if (!response.ok) return;
    setSnapshot(await response.json());
    setReplayTimeline([]);
    setReplayIndex(0);
  }

  function chooseStoryAct(next: StoryAct) {
    setJourneyAutoplay(false);
    setSceneView(next === "sun" ? "sun" : next === "observer" ? "spacecraft" : "earth");
    if (next === "replay") { setStoryAct("replay"); setTracing(true); setSkipFlight(true); if (snapshot.status !== "replay") void openReplay(); return; }
    if (snapshot.status === "replay") void returnToLive();
    setStoryAct(next);
    if (next === "sun") { setTracing(false); setSkipFlight(false); setConsoleOpen(false); return; }
    setTracing(true);
    setSkipFlight(next !== "stream");
    if (next === "scenario") openMission("scenario");
  }

  async function openReplay() {
    if (snapshot.status === "replay") return;
    const response = await fetch("/api/replay/may-2024");
    if (!response.ok) return;
    const payload = await response.json() as { snapshot?: SpaceWeatherSnapshot; timeline?: ReplayBeat[] };
    if (!payload.snapshot) return;
    setSnapshot(payload.snapshot);
    setReplayTimeline(payload.timeline ?? []);
    setReplayIndex(0);
    setScenario("quiet");
    setTracing(true);
    setSkipFlight(true);
  }

  async function toggleReplay() {
    if (snapshot.status === "replay") { await returnToLive(); setStoryAct("earth"); return; }
    setStoryAct("replay");
    await openReplay();
  }

  async function requestBriefing(question: string) {
    setLoadingBriefing(true);
    try {
      const response = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshot, locationId: location.id, location, scenarioLevel: scenario, learningMode, question }) });
      const payload = await response.json() as { briefing?: Explanation; mode?: "live" | "demo" };
      setBriefing(payload.briefing ?? null);
      setBriefingMode(payload.mode ?? "demo");
      setBriefingLearningMode(learningMode);
      setMissionPanel(null);
      setConsoleOpen(false);
    } finally { setLoadingBriefing(false); }
  }

  return <div className={reducedMotion ? "experience reduced-motion" : "experience"}>
    <SolarSystemScene state={visualState} tracing={tracing} skipFlight={skipFlight} reducedMotion={reducedMotion} instrument={instrument} location={location} auroraProbability={scenario === "quiet" ? snapshot.aurora?.globalMaxProbability ?? null : null} storyAct={storyAct} view={sceneView} solarSystem={solarSystem} selectedFocus={selectedFocus} labelsVisible={labelsVisible} onSelectFocus={chooseFocus} />
    <MouseTrail disabled={reducedMotion} />
    {booting && <div className="boot-sequence" aria-hidden="true"><span>SOLAR SENTINEL</span><i /></div>}

    <header className="topbar cinematic-topbar">
      <div className="brand"><span className="brand-mark" />SOLAR <b>SENTINEL</b></div>
      <div className="top-actions">{(sceneView === "system" || sceneView === "planet") && <button className={labelsVisible ? "label-toggle active" : "label-toggle"} onClick={() => setLabelsVisible((visible) => !visible)} title="Toggle transparent object labels">{labelsVisible ? "LABELS ON" : "LABELS"}</button>}<button className="learning-toggle" onClick={() => setLearningMode((mode) => mode === "student" ? "teacher" : "student")} title="Switch between student and teacher learning modes">{learningMode.toUpperCase()}</button><span className={`status ${snapshot.status}`} title={`Latest data status: ${statusLabel[snapshot.status]}`}>{statusLabel[snapshot.status]}</span><button className="motion-toggle" onClick={() => setReducedMotion((value) => !value)}>{reducedMotion ? "MOTION ON" : "MOTION"}</button></div>
    </header>

    <section className={`${tracing ? "hero-copy is-tracing" : "hero-copy"}${sceneView === "system" ? " system-copy" : ""}`}>
      <p className="eyebrow">{sceneView === "system" ? "LIVE ORBITAL MAP · DRAG / SELECT" : sceneView === "planet" ? "MISSION IMAGE · EXPLORE DETAIL" : sceneView === "spacecraft" ? "NASA SDO · OBSERVER" : sceneView === "earth" ? "EARTH MAGNETIC SHIELD" : "NASA SDO · LATEST AVAILABLE"}</p>
      {sceneView !== "system" && <h1>{sceneView === "planet" ? <>{selectedDetail?.title.toUpperCase()}<br /><em>DETAIL</em></> : sceneView === "spacecraft" ? <>THE<br /><em>OBSERVER</em></> : sceneView === "earth" ? <>EARTH<br /><em>NOW</em></> : <>THE SUN<br /><em>NOW</em></>}</h1>}
      {sceneView === "system" && <button className="trace-button" onClick={beginTrace}>{reducedMotion ? "OPEN FIELD VIEW" : "TRACE THE STREAM"}<span>→</span></button>}
      {sceneView === "planet" && <button className="trace-button" onClick={returnToSystem}>SYSTEM VIEW<span>↗</span></button>}
      {sceneView === "sun" && <button className="trace-button" onClick={enterSolarWind}>{reducedMotion ? "VIEW EARTH" : "TRACE THE WIND"}<span>→</span></button>}
      {tracing && !skipFlight && <button className="trace-button" onClick={() => { setStoryAct("earth"); setSkipFlight(true); }}>SKIP FLIGHT<span>→</span></button>}
      {(sceneView === "earth" || sceneView === "spacecraft") && tracing && skipFlight && <button className="trace-button" onClick={returnToSystem}>SYSTEM VIEW<span>↗</span></button>}
    </section>

    {(sceneView === "system" || sceneView === "planet") && selectedFocus !== "system" && <ObjectFocusPanel focus={selectedFocus} snapshot={solarSystem} onFieldView={enterFocusedFieldView} onClose={returnToSystem} detailOpen={sceneView === "planet"} />}

    <nav className="story-rail" aria-label="Solar Sentinel story chapters">
      {storyActs.map((act) => <button key={act.id} className={storyAct === act.id ? "active" : ""} aria-label={`${act.number}: ${act.label}`} title={`${act.number} · ${act.label}`} onClick={() => chooseStoryAct(act.id)}><span>{act.number}</span></button>)}
    </nav>
    {storyAct !== "sun" && <div className="story-marker" aria-live="polite"><span>{story.number}</span><i />{story.label.toUpperCase()}</div>}

    <aside className="telemetry-pod" aria-label="Current observed space weather">
      <div className="pod-state"><span className="pulse" /><span>{snapshot.status === "replay" ? "ARCHIVED" : "OBSERVED"}</span></div>
      <div className="pod-reading"><strong>{snapshot.kpObserved ?? "—"}</strong><span>KP</span></div>
      <div className="pod-subreading"><span>{metric(snapshot.solarWindSpeedKms, " KM/S")}</span><span>{metric(snapshot.imfBzNt, " nT")}</span></div>
      <button className="pod-location" onClick={() => openMission("location")}><i />{location.name.toUpperCase()}<b aria-label={sky.label}>{sky.phase === "night" ? "☾" : sky.phase === "civil_twilight" ? "◐" : "☼"}</b></button>
    </aside>

    {scenario !== "quiet" && <div className="scenario-signal" role="status"><span>SCENARIO · {scenario.toUpperCase()}</span><small>EDUCATIONAL SIMULATION · NOT A FORECAST</small></div>}
    {snapshot.status === "replay" && <div className="replay-rail"><span>DONKI · MAY 2024</span><input aria-label="May 2024 historical event timeline" type="range" min="0" max={Math.max(replayTimeline.length - 1, 0)} value={Math.min(replayIndex, Math.max(replayTimeline.length - 1, 0))} onChange={(event) => setReplayIndex(Number(event.target.value))} disabled={replayTimeline.length < 2} /><output>{replayBeat ? formatReplayTime(replayBeat.observedAt) : "ARCHIVED"}</output></div>}

    <button className="mission-trigger" aria-expanded={consoleOpen} onClick={() => { setConsoleOpen((value) => !value); if (!consoleOpen) setMissionPanel("location"); }}><span>✦</span> MISSION</button>

    {consoleOpen && <section className="mission-console" aria-label="Mission controls">
      <div className="mission-rail" aria-label="Mission sections">
        <button className={missionPanel === "location" ? "active" : ""} onClick={() => setMissionPanel("location")} title="Choose location"><span>⌖</span><small>LOCATE</small></button>
        <button className={missionPanel === "scenario" ? "active" : ""} onClick={() => setMissionPanel("scenario")} title="Explore scenario"><span>◇</span><small>WHAT IF</small></button>
        <button className={missionPanel === "instrument" ? "active" : ""} onClick={() => setMissionPanel("instrument")} title="Switch SDO view"><span>◉</span><small>SDO</small></button>
        <button className={missionPanel === "spacecraft" ? "active" : ""} onClick={() => openMission("spacecraft")} title="Focus the SDO spacecraft"><span>⌁</span><small>CRAFT</small></button>
        <button className={missionPanel === "replay" ? "active" : ""} onClick={() => setMissionPanel("replay")} title="Open historical replay"><span>◷</span><small>REPLAY</small></button>
        <button className={missionPanel === "ask" ? "active" : ""} onClick={() => setMissionPanel("ask")} title="Ask Solar Sentinel"><span>✣</span><small>ASK</small></button>
        <button onClick={() => { setDrawerOpen(true); setConsoleOpen(false); }} title="Open sources"><span>↗</span><small>SOURCE</small></button>
      </div>
      <div className="mission-content">
        <div className="truth-strip"><span className="observed">LIVE OBSERVED</span><span className="forecast">NOAA FORECAST</span><span className={scenario === "quiet" ? "scenario" : "scenario active"}>SCENARIO</span><button onClick={() => setConsoleOpen(false)} aria-label="Close mission controls">×</button></div>
        {missionPanel === "location" && <LocationPanel location={location} auroraPeak={snapshot.aurora?.globalMaxProbability ?? null} cityQuery={cityQuery} cityMatches={cityMatches} pending={citySearchPending} onQuery={setCityQuery} onChoose={chooseLocation} />}
        {missionPanel === "scenario" && <ScenarioPanel scenario={scenario} onChange={chooseScenario} />}
        {missionPanel === "instrument" && <InstrumentPanel instrument={instrument} onChange={setInstrument} />}
        {missionPanel === "spacecraft" && <SpacecraftPanel />}
        {missionPanel === "replay" && <ReplayPanel active={snapshot.status === "replay"} onToggle={toggleReplay} />}
        {missionPanel === "ask" && <AskPanel learningMode={learningMode} loading={loadingBriefing} onAsk={requestBriefing} />}
      </div>
    </section>}

    {briefing && <section className="briefing-panel"><button className="close-briefing" onClick={() => setBriefing(null)} aria-label="Close explanation">×</button><div><span className="eyebrow">{briefingMode === "live" ? `${briefingLearningMode.toUpperCase()} · SOURCE-GROUNDED` : `${briefingLearningMode.toUpperCase()} · SNAPSHOT GUIDE`}</span><h3>{briefing.summary}</h3></div><div className="briefing-columns"><p><b>Observed</b>{briefing.observed}</p><p><b>Official forecast</b>{briefing.officialForecast}</p><p><b>Scenario</b>{briefing.scenario}</p><p><b>Uncertainty</b>{briefing.uncertainty}</p></div><div className="briefing-sources"><span>VERIFY</span>{briefing.sourceNotes.map((source) => <a key={`${source.url}-${source.timestampUtc}`} href={source.url} target="_blank" rel="noreferrer">{source.source} · {formatSourceTime(source.timestampUtc)} ↗</a>)}</div></section>}

    {drawerOpen && <div className="drawer-backdrop" role="presentation" onClick={() => setDrawerOpen(false)}><aside className="provenance" role="dialog" aria-modal="true" aria-label="Data provenance" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setDrawerOpen(false)}>×</button><p className="eyebrow">HOW WE KNOW</p><h2>Signal provenance</h2><p className="context">Every live layer carries its origin and timestamp. Illustrative movement is separate from observation and forecast.</p>{snapshot.provenance.map((source) => <a key={source.productName} href={source.sourceUrl} target="_blank" rel="noreferrer"><span>{source.layer === "official_forecast" ? "NOAA FORECAST" : "LIVE OBSERVED"}</span><b>{source.productName}</b><small>Fetched {new Date(source.fetchedAt).toUTCString()}</small></a>)}<a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noreferrer"><span>{solarSystem?.status === "live" ? "LIVE POSITION" : solarSystem?.status === "cached" ? "CACHED POSITION" : "REFERENCE ORBITS"}</span><b>NASA/JPL Horizons</b><small>{solarSystem?.ephemerisTime ?? "Planetary vectors unavailable"} · actual positions in the system view</small></a><a href="https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/" target="_blank" rel="noreferrer"><span>EARTH BASE MAP</span><b>NASA Blue Marble</b><small>Geographic surface texture for city orientation</small></a><a href="https://sdo.gsfc.nasa.gov/mission/" target="_blank" rel="noreferrer"><span>MISSION CONTEXT</span><b>NASA Solar Dynamics Observatory</b><small>Living With a Star · AIA / EVE / HMI</small></a><a href="https://www.esa.int/Science_Exploration/Space_Science/Venus_Express" target="_blank" rel="noreferrer"><span>MISSION CONTEXT</span><b>ESA Venus Express</b><small>Venus atmospheric and thermal mapping</small></a><a href="https://global.jaxa.jp/press/2025/09/20250918-2_e.html" target="_blank" rel="noreferrer"><span>MISSION CONTEXT</span><b>JAXA Akatsuki</b><small>Venus atmosphere observations</small></a><a href="https://www.isro.gov.in/ISRO_EN/MOM.html" target="_blank" rel="noreferrer"><span>MISSION CONTEXT</span><b>ISRO Mars Orbiter Mission</b><small>Mars Color Camera mission archive</small></a><a href="https://www.esa.int/Science_Exploration/Space_Science/Mars_Express" target="_blank" rel="noreferrer"><span>MISSION CONTEXT</span><b>ESA Mars Express</b><small>Mars surface, atmosphere, Phobos and Deimos</small></a><a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer"><span>LOCATION SEARCH</span><b>Open-Meteo Geocoding</b><small>Global city-coordinate lookup</small></a><p className="credit">Solar imagery: NASA Solar Dynamics Observatory. Planetary positions: NASA/JPL Horizons. Selected close-up images: NASA Image and Video Library. ESA, JAXA and ISRO links provide mission context; their data is not represented as live telemetry. Earth surface texture: NASA Blue Marble. Space-weather observations, forecasts and alerts: NOAA SWPC. Historical analysis: NASA CCMC DONKI. Scenarios are educational visual simulations, not forecasts.</p></aside></div>}

    <style jsx global>{`
      .experience { min-height: 100svh; overflow: hidden; background: #02040b; }
      .scene:after { background: linear-gradient(90deg, rgba(2,4,11,.28), transparent 47%, rgba(2,4,11,.2)), linear-gradient(0deg, #02040b 0%, transparent 28%); }
      .scene canvas { transition: opacity .22s ease, filter .22s ease; }.scene-transitioning canvas { opacity: .18; filter: blur(3px) saturate(1.4); }.scene-warp { position: absolute; z-index: 2; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 50%, transparent 0 12%, rgba(96,215,255,.08) 30%, rgba(250,174,62,.16) 45%, rgba(2,4,11,.95) 76%); mix-blend-mode: screen; animation: scene-warp .56s cubic-bezier(.2,.75,.2,1) both; }@keyframes scene-warp { from { opacity: 0; transform: scale(.55); filter: blur(20px); } 48% { opacity: 1; } to { opacity: 0; transform: scale(1.8); filter: blur(4px); } }
      .cinematic-topbar { padding: 24px clamp(20px, 3.5vw, 58px); }
      .brand { font-size: 11px; letter-spacing: .29em; }
      .status { min-width: 52px; text-align: center; color: #a6ffe0; border-color: rgba(103,255,197,.34); background: rgba(78,243,178,.045); }
      .motion-toggle { border: 0; background: transparent; color: #718298; font: 9px "DM Mono"; letter-spacing: .12em; }
      .learning-toggle, .label-toggle { border: 1px solid rgba(112,207,255,.3); border-radius: 999px; background: rgba(91,165,255,.08); padding: 6px 9px; color: #a9dcff; font: 8px "DM Mono"; letter-spacing: .11em; }.label-toggle { color: #92b8d6; background: rgba(5,14,29,.26); border-color: rgba(123,171,214,.22); }.label-toggle.active { border-color: rgba(103,255,197,.48); background: rgba(78,243,178,.1); color: #b9ffe0; }
      .hero-copy { width: auto; margin: clamp(70px, 13vh, 142px) 0 0 clamp(24px, 7vw, 122px); transition: opacity .7s ease, transform .7s ease; }.hero-copy.system-copy { position: fixed; z-index: 3; top: 103px; left: clamp(22px, 4vw, 66px); margin: 0; }.hero-copy.system-copy .eyebrow { color: #b7c9df; font-size: 8px; opacity: .82; }.hero-copy.system-copy .trace-button { margin-top: 10px; padding: 9px 13px; font-size: 8px; }
      .hero-copy.is-tracing { opacity: .7; transform: translateY(-12px); }.hero-copy.is-tracing .eyebrow, .hero-copy.is-tracing h1 { opacity: 0; }
      .hero-copy h1 { font: 500 clamp(54px, 7vw, 112px)/.82 "Playfair Display", serif; letter-spacing: -.075em; margin: 0; text-shadow: 0 8px 38px rgba(0,0,0,.44); }
      .hero-copy h1 em { color: #f2ba4b; font-style: normal; }
      .trace-button { margin-top: 26px; border-radius: 999px; border-color: rgba(245,184,66,.68); padding: 12px 17px; background: rgba(245,137,19,.12); backdrop-filter: blur(10px); }
      .trace-button span { margin-left: 16px; }
      .story-rail { position: fixed; z-index: 4; left: clamp(20px, 3.5vw, 58px); bottom: 31px; display: flex; gap: 7px; align-items: center; }
      .story-rail button { width: 23px; height: 23px; padding: 0; border: 1px solid rgba(151,185,229,.22); border-radius: 50%; background: rgba(5,14,29,.42); color: #73849a; font: 7px "DM Mono"; letter-spacing: 0; backdrop-filter: blur(10px); transition: width .32s ease, color .22s ease, border-color .22s ease, background .22s ease; }
      .story-rail button:hover { border-color: rgba(131,238,202,.65); color: #e4fff5; }.story-rail button.active { width: 40px; border-radius: 999px; border-color: rgba(105,246,190,.72); background: rgba(30,145,109,.14); color: #b8ffdf; }
      .story-marker { position: fixed; z-index: 3; top: 100px; right: clamp(20px, 3.5vw, 58px); display: flex; align-items: center; gap: 9px; color: #d4e4f5; font: 9px "DM Mono"; letter-spacing: .16em; text-shadow: 0 2px 18px #02040b; animation: story-marker-in .5s ease both; }
      .story-marker span { color: #69f2bd; }.story-marker i { width: 21px; height: 1px; background: linear-gradient(90deg, #69f2bd, transparent); }
      @keyframes story-marker-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      .telemetry-pod { position: absolute; z-index: 3; right: clamp(20px, 5.1vw, 84px); top: 53%; width: 177px; padding: 14px 15px 12px; border: 1px solid rgba(139,178,232,.22); border-radius: 18px; background: linear-gradient(135deg, rgba(11,28,54,.63), rgba(2,8,20,.35)); backdrop-filter: blur(17px); box-shadow: 0 24px 80px rgba(0,0,0,.22); }
      .pod-state { display: flex; gap: 7px; align-items: center; color: #8ea0b9; font: 8px "DM Mono"; letter-spacing: .16em; }
      .pod-state .pulse { width: 6px; height: 6px; margin: 0; box-shadow: 0 0 0 4px rgba(78,243,178,.1); }
      .pod-reading { display: flex; align-items: baseline; gap: 8px; margin-top: 10px; }
      .pod-reading strong { color: #73f4bf; font: 500 40px/.82 "DM Mono"; letter-spacing: -.1em; }
      .pod-reading span { color: #b5c3d5; font: 9px "DM Mono"; letter-spacing: .12em; }
      .pod-subreading { display: flex; justify-content: space-between; margin-top: 12px; color: #a7b6ca; font: 8px "DM Mono"; letter-spacing: .04em; }
      .pod-location { width: 100%; display: flex; align-items: center; gap: 7px; margin-top: 13px; padding: 10px 0 0; border: 0; border-top: 1px solid rgba(163,190,230,.18); background: transparent; color: #d9e4f1; text-align: left; font: 9px "DM Mono"; letter-spacing: .1em; }
      .pod-location i { width: 6px; height: 6px; border-radius: 50%; background: #4ef3b2; box-shadow: 0 0 12px 2px rgba(78,243,178,.35); }
      .pod-location b { margin-left: auto; color: ${sky.phase === "night" ? "#a3b8ff" : sky.phase === "civil_twilight" ? "#d49bff" : "#f6c35f"}; font-size: 14px; font-weight: 400; }
      .mission-trigger { position: fixed; z-index: 4; left: 50%; bottom: 26px; transform: translateX(-50%); border: 1px solid rgba(151,185,229,.3); border-radius: 999px; padding: 12px 17px; background: rgba(4,13,30,.56); box-shadow: 0 14px 50px rgba(0,0,0,.28); backdrop-filter: blur(14px); color: #dbe8fa; font: 10px "DM Mono"; letter-spacing: .15em; }
      .mission-trigger span { color: #62f4bf; margin-right: 8px; }
      .mission-console { position: fixed; z-index: 5; left: 50%; bottom: 24px; display: flex; width: min(780px, calc(100vw - 32px)); min-height: 180px; transform: translateX(-50%); border: 1px solid rgba(144,178,226,.28); border-radius: 20px; overflow: hidden; background: linear-gradient(130deg, rgba(6,19,42,.92), rgba(3,9,21,.88)); box-shadow: 0 30px 100px rgba(0,0,0,.48); backdrop-filter: blur(24px); animation: console-in .42s cubic-bezier(.2,.85,.25,1); }
      @keyframes console-in { from { opacity: 0; transform: translate(-50%, 22px) scale(.98); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
      .mission-rail { display: grid; grid-template-columns: 1fr; grid-template-rows: repeat(7, 1fr); width: 58px; padding: 9px 7px; border-right: 1px solid rgba(144,178,226,.16); background: rgba(255,255,255,.018); }
      .mission-rail button { border: 0; border-radius: 10px; background: transparent; color: #8494aa; transition: .2s; }
      .mission-rail button:hover, .mission-rail button.active { background: rgba(102,158,255,.12); color: #c9e9ff; }
      .mission-rail span { display: block; font-size: 17px; line-height: 1; }
      .mission-rail small { display: none; }
      .mission-content { flex: 1; min-width: 0; padding: 16px 19px 18px; }
      .truth-strip { display: flex; gap: 13px; align-items: center; color: #73849a; font: 8px "DM Mono"; letter-spacing: .1em; }
      .truth-strip .observed { color: #65f0bc; }.truth-strip .forecast { color: #ecc36e; }.truth-strip .scenario.active { color: #d4a1ff; }
      .truth-strip button { margin-left: auto; border: 0; background: transparent; color: #9aa9bc; font-size: 20px; line-height: .6; }
      .mission-view { margin-top: 15px; }.mission-view h2 { margin: 0; color: #f0f6ff; font: 500 23px/1 "Playfair Display"; }.mission-view p { margin: 6px 0 0; color: #8c9caf; font-size: 11px; line-height: 1.45; }
      .location-preset-row, .scenario-levels, .instrument-options, .ask-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
      .location-preset-row button, .scenario-levels button, .instrument-options button, .ask-chips button, .replay-action { border: 1px solid rgba(157,187,230,.25); border-radius: 999px; background: rgba(255,255,255,.025); padding: 8px 10px; color: #c7d4e5; font: 9px "DM Mono"; letter-spacing: .07em; transition: .2s; }
      .location-preset-row button.selected, .scenario-levels button.selected { border-color: #4ef3b2; background: #4ef3b2; color: #07110f; }.scenario-levels button.selected { border-color: #c88cff; background: #c88cff; }
      .instrument-options button.selected { border-color: #99b9ff; color: #f4f7ff; background: rgba(88,128,239,.23); }
      .city-search { display: flex; align-items: center; margin-top: 10px; padding: 0 10px; border: 1px solid rgba(163,190,230,.2); border-radius: 999px; background: rgba(255,255,255,.02); }.city-search span { color: #65f0bc; }.city-search input { width: 100%; border: 0; outline: 0; background: transparent; padding: 9px 8px; color: #eaf1ff; font: 9px "DM Mono"; letter-spacing: .08em; }
      .city-results { position: relative; z-index: 3; display: grid; gap: 2px; margin-top: 5px; padding: 4px; border: 1px solid rgba(163,190,230,.2); border-radius: 11px; background: rgba(4,12,27,.96); }.city-results button { display: flex; justify-content: space-between; border: 0; border-radius: 7px; background: transparent; padding: 7px; color: #dce6f5; text-align: left; font-size: 10px; }.city-results button span:last-child { color: #8191a7; font: 8px "DM Mono"; }
      .scenario-disclaimer { color: #d9b9fa !important; font: 9px "DM Mono" !important; letter-spacing: .03em; }.instrument-note { color: #95a5bd !important; }.model-note { color: #6ce1c1 !important; font: 8px "DM Mono" !important; letter-spacing: .08em; }
      .sdo-mission-link { display: inline-block; margin-top: 12px; color: #8ddaff; font: 9px "DM Mono"; letter-spacing: .12em; text-decoration: none; }.sdo-mission-link:hover { color: #ddf6ff; }
      .craft-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-top: 13px; }.craft-stats span { min-height: 52px; padding: 9px 8px; border: 1px solid rgba(139,187,239,.18); border-radius: 10px; background: rgba(106,166,255,.045); color: #7acff4; font: 16px/1 "DM Mono"; }.craft-stats small { display: block; margin-top: 6px; color: #9aa9bc; font: 7px "DM Mono"; letter-spacing: .08em; }
      .replay-action { margin-top: 14px; border-color: rgba(204,142,255,.42); color: #e7cbff; }.replay-action.active { border-color: #4ef3b2; color: #8fffcf; }
      .replay-rail { position: fixed; z-index: 4; right: clamp(18px, 5vw, 76px); bottom: 28px; display: flex; align-items: center; width: min(330px, calc(100vw - 160px)); gap: 9px; color: #d7b7fa; font: 8px "DM Mono"; letter-spacing: .08em; }.replay-rail input { flex: 1; accent-color: #be7bff; }.replay-rail output { color: #b9c8db; white-space: nowrap; }
      .scenario-signal { position: fixed; z-index: 4; right: clamp(18px, 5vw, 76px); bottom: 28px; display: grid; gap: 4px; border-left: 1px solid #ce9bff; padding-left: 10px; color: #e1c4ff; font: 9px "DM Mono"; letter-spacing: .08em; }.scenario-signal small { color: #a99aba; font: 7px "DM Mono"; letter-spacing: .05em; }
      .system-label { display: flex; align-items: center; gap: 7px; border: 1px solid rgba(118,240,197,.58); border-radius: 999px; background: rgba(3,13,28,.74); padding: 6px 8px; box-shadow: 0 0 26px rgba(74,243,184,.18); color: #e4fff5; font: 8px "DM Mono"; letter-spacing: .11em; white-space: nowrap; backdrop-filter: blur(8px); }.system-label.passive { border-color: rgba(147,185,225,.24); background: rgba(3,13,28,.38); box-shadow: none; color: #c7d8e8; }.system-label span { color: #69f2bd; font-size: 6px; letter-spacing: .08em; }.system-label.passive span { color: #8da5bf; }.system-label i { color: #9ec7f5; font-style: normal; }.detail-moon-label { display: inline-block; border: 1px solid rgba(159,198,239,.25); border-radius: 999px; background: rgba(3,13,28,.54); padding: 4px 6px; color: #d7e8fa; font: 7px "DM Mono"; letter-spacing: .1em; white-space: nowrap; backdrop-filter: blur(7px); }
      .object-focus { position: fixed; z-index: 5; top: clamp(92px, 17vh, 164px); right: clamp(18px, 4vw, 64px); width: min(245px, calc(100vw - 40px)); overflow: hidden; border: 1px solid rgba(117,197,255,.3); border-radius: 16px; background: linear-gradient(145deg, rgba(5,20,43,.88), rgba(3,8,20,.72)); box-shadow: 0 22px 75px rgba(0,0,0,.4); backdrop-filter: blur(18px); animation: object-focus-in .36s cubic-bezier(.2,.85,.25,1); }.object-focus img { display: block; width: 100%; height: 96px; object-fit: cover; opacity: .84; mix-blend-mode: screen; }.object-focus-content { padding: 14px; }.object-focus .close-focus { position: absolute; top: 7px; right: 7px; width: 24px; height: 24px; border: 1px solid rgba(194,218,247,.3); border-radius: 50%; background: rgba(4,12,27,.66); color: #d8e8f9; font-size: 15px; line-height: 1; }.object-focus h2 { margin: 0; color: #eff7ff; font: 500 27px/1 "Playfair Display"; }.object-focus p { margin: 8px 0 0; color: #9baabd; font-size: 10px; line-height: 1.45; }.object-vector { display: flex; gap: 9px; margin-top: 11px; padding-top: 10px; border-top: 1px solid rgba(147,182,229,.16); color: #a6c6e7; font: 8px "DM Mono"; letter-spacing: .03em; }.object-actions { display: flex; gap: 7px; margin-top: 13px; }.object-actions button, .object-actions a { flex: 1; border: 1px solid rgba(132,204,255,.3); border-radius: 999px; background: rgba(87,158,255,.08); padding: 8px 9px; color: #cce9ff; text-align: center; text-decoration: none; font: 8px "DM Mono"; letter-spacing: .07em; }.object-actions button { border-color: rgba(104,244,193,.42); color: #baffdf; }.object-actions a:hover, .object-actions button:hover { background: rgba(112,216,255,.17); }@keyframes object-focus-in { from { opacity: 0; transform: translateY(-10px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .briefing-panel { position: fixed; z-index: 6; left: 50%; bottom: 24px; width: min(780px, calc(100vw - 32px)); margin: 0; transform: translateX(-50%); border-color: rgba(86,241,182,.32); background: rgba(5,20,29,.94); box-shadow: 0 30px 100px rgba(0,0,0,.52); animation: console-in .42s cubic-bezier(.2,.85,.25,1); }.close-briefing { float: right; border: 0; background: transparent; color: #a8b9ca; font-size: 22px; }
      .briefing-columns { grid-template-columns: repeat(4, 1fr); gap: 13px; }.briefing-columns p { font-size: 10px; }.briefing-sources { display: flex; flex-wrap: wrap; align-items: center; gap: 7px 12px; margin-top: 17px; padding-top: 12px; border-top: 1px solid rgba(149,188,229,.16); }.briefing-sources > span { color: #6bf1bf; font: 8px "DM Mono"; letter-spacing: .13em; }.briefing-sources a { color: #9eb5d2; font: 8px/1.3 "DM Mono"; letter-spacing: .04em; text-decoration: none; }.briefing-sources a:hover { color: #e1f5ff; }
      .boot-sequence { position: fixed; z-index: 9; inset: 0; display: grid; place-content: center; gap: 14px; background: #02040b; color: #e1edf9; font: 10px "DM Mono"; letter-spacing: .35em; pointer-events: none; animation: boot-out .95s ease forwards; animation-delay: .42s; }.boot-sequence i { width: 150px; height: 1px; background: linear-gradient(90deg, transparent, #f0b84c, transparent); box-shadow: 0 0 16px #f0b84c; animation: boot-pulse .7s ease-in-out infinite alternate; }@keyframes boot-out { to { opacity: 0; visibility: hidden; }}@keyframes boot-pulse { to { transform: scaleX(.45); opacity: .35; }}
      .mouse-trail { z-index: 2; }.scene-note { z-index: 1; }
      .trail-particle { background: radial-gradient(circle at 35% 30%, #fff5c6 0 8%, #f6b84a 28%, rgba(246,184,74,.1) 68%, transparent 72%); }
      @media (max-width: 760px) { .hero-copy { margin: 68px 0 0 24px; }.hero-copy h1 { font-size: clamp(48px, 15vw, 76px); }.story-rail { left: 18px; bottom: 79px; }.story-marker { top: 70px; right: 18px; font-size: 8px; }.telemetry-pod { top: auto; bottom: 97px; right: 16px; width: 155px; }.object-focus { top: auto; right: 16px; bottom: 101px; width: min(240px, calc(100vw - 32px)); }.mission-console { flex-direction: column; bottom: 14px; }.mission-rail { display: flex; width: 100%; padding: 7px; border-right: 0; border-bottom: 1px solid rgba(144,178,226,.16); }.mission-rail button { flex: 1; padding: 6px 2px; }.mission-content { min-height: 168px; }.replay-rail, .scenario-signal { right: 16px; bottom: 80px; }.briefing-panel { bottom: 14px; }.briefing-columns { grid-template-columns: 1fr; gap: 12px; }.pod-subreading { font-size: 7px; } }
      @media (max-width: 480px) { .cinematic-topbar { padding: 18px; }.top-actions { gap: 9px; }.hero-copy { margin-top: 58px; }.telemetry-pod { bottom: 76px; transform: scale(.88); transform-origin: bottom right; }.mission-trigger { bottom: 15px; }.mission-console { width: calc(100vw - 16px); bottom: 8px; }.truth-strip { gap: 8px; font-size: 7px; }.mission-content { padding: 13px; }.replay-rail { display: none; } }
      @media (pointer: coarse) { .mouse-trail { display: none; } }
    `}</style>
  </div>;
}

function ObjectFocusPanel({ focus, snapshot, onFieldView, onClose, detailOpen = false }: { focus: Exclude<SceneFocus, "system">; snapshot: SolarSystemSnapshot | null; onFieldView: () => void; onClose: () => void; detailOpen?: boolean }) {
  const detail = focusDetails[focus];
  const body = snapshot?.bodies.find((item) => item.id === focus);
  const precision = focus === "moon" ? 4 : 2;
  const [media, setMedia] = useState<NasaMedia | null>(null);
  useEffect(() => {
    if (detail.mediaUrl) { setMedia(null); return; }
    let active = true;
    fetch(`/api/celestial-media/${focus}`).then((response) => response.ok ? response.json() : Promise.reject(new Error("NASA media unavailable"))).then((payload: NasaMedia) => active && setMedia(payload)).catch(() => active && setMedia(null));
    return () => { active = false; };
  }, [detail.mediaUrl, focus]);
  const imageUrl = detail.mediaUrl ?? media?.thumbnailUrl;
  const imageAlt = detail.mediaAlt ?? media?.title ?? "";
  return <aside className="object-focus" aria-label={`${detail.title} data and sources`}>
    <button className="close-focus" onClick={onClose} aria-label="Close object details">×</button>
    {imageUrl && <img src={imageUrl} alt={imageAlt} />}
    <div className="object-focus-content"><p className="eyebrow">{detail.eyebrow}</p><h2>{detail.title}</h2><p>{detail.description}</p>{body && snapshot?.status !== "unavailable" && <div className="object-vector" title="NASA/JPL Horizons ecliptic position in astronomical units"><span>X {body.positionAu[0].toFixed(precision)} AU</span><span>Y {body.positionAu[1].toFixed(precision)} AU</span></div>}<div className="object-actions">{detail.fieldView && !detailOpen && <button onClick={onFieldView}>{detail.fieldView === "planet" ? "DETAIL VIEW" : "FIELD VIEW"}</button>}<a href={detail.sourceUrl} target="_blank" rel="noreferrer">SOURCE ↗</a>{media && <a href={media.sourceUrl} target="_blank" rel="noreferrer">NASA IMAGE ↗</a>}</div></div>
  </aside>;
}

function LocationPanel({ location, auroraPeak, cityQuery, cityMatches, pending, onQuery, onChoose }: { location: Location; auroraPeak: number | null; cityQuery: string; cityMatches: Location[]; pending: boolean; onQuery: (value: string) => void; onChoose: (location: Location) => void }) {
  return <div className="mission-view"><p className="eyebrow">YOUR VIEWPORT</p><h2>{location.name}</h2>{auroraPeak !== null && <p className="model-note">NOAA OVATION MODEL · GLOBAL OVAL PEAK {auroraPeak}%</p>}<div className="location-preset-row">{locations.map((item) => <button className={item.id === location.id ? "selected" : ""} onClick={() => onChoose(item)} key={item.id}>{item.name.toUpperCase()}</button>)}</div><div className="city-search"><span>⌕</span><input aria-label="Search any city in the world" value={cityQuery} onChange={(event) => onQuery(event.target.value)} placeholder="SEARCH ANY CITY" /><span aria-live="polite">{pending ? "…" : ""}</span></div>{cityMatches.length > 0 && <div className="city-results">{cityMatches.map((item) => <button key={item.id} onClick={() => onChoose(item)}><span>{item.name}</span><span>{item.country}</span></button>)}</div>}</div>;
}

function ScenarioPanel({ scenario, onChange }: { scenario: ScenarioLevel; onChange: (level: ScenarioLevel) => void }) {
  return <div className="mission-view"><p className="eyebrow">WHAT IF?</p><h2>Visual scenario</h2><div className="scenario-levels">{(["quiet", "elevated", "strong", "extreme"] as ScenarioLevel[]).map((level) => <button key={level} className={scenario === level ? "selected" : ""} onClick={() => onChange(level)}>{level.toUpperCase()}</button>)}</div><p className="scenario-disclaimer">SOLAR SENTINEL SCENARIO · EDUCATIONAL SIMULATION, NOT A PREDICTION OR OPERATIONAL ADVISORY.</p></div>;
}

function InstrumentPanel({ instrument, onChange }: { instrument: "193" | "magnetogram"; onChange: (instrument: "193" | "magnetogram") => void }) {
  return <div className="mission-view"><p className="eyebrow">NASA SDO · LATEST AVAILABLE</p><h2>See the observer</h2><div className="instrument-options"><button className={instrument === "193" ? "selected" : ""} onClick={() => onChange("193")}>AIA · CORONA 193 Å</button><button className={instrument === "magnetogram" ? "selected" : ""} onClick={() => onChange("magnetogram")}>HMI · MAGNETIC FIELD</button></div><p className="instrument-note">AIA sees the corona. HMI maps the magnetic field. EVE measures the Sun’s changing EUV output.</p><a className="sdo-mission-link" href="https://sdo.gsfc.nasa.gov/mission/" target="_blank" rel="noreferrer">SDO MISSION ↗</a></div>;
}

function SpacecraftPanel() {
  return <div className="mission-view"><p className="eyebrow">NASA SDO · OBSERVER</p><h2>The spacecraft</h2><div className="craft-stats"><span>2010<small>LAUNCHED</small></span><span>4.5 M<small>HEIGHT</small></span><span>3<small>INSTRUMENTS</small></span></div><p className="instrument-note">Sun-pointing, geosynchronous observation feeds the AIA, EVE and HMI science layers behind this experience.</p><a className="sdo-mission-link" href="https://sdo.gsfc.nasa.gov/mission/" target="_blank" rel="noreferrer">SDO SPACECRAFT ↗</a></div>;
}

function ReplayPanel({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return <div className="mission-view"><p className="eyebrow">NASA DONKI · ARCHIVED ANALYSIS</p><h2>May 2024 storm</h2><p>A real historical event for a reliable, source-labelled flight through the system.</p><button className={active ? "replay-action active" : "replay-action"} onClick={onToggle}>{active ? "RETURN TO LIVE" : "OPEN REPLAY"}</button></div>;
}

function AskPanel({ learningMode, loading, onAsk }: { learningMode: LearningMode; loading: boolean; onAsk: (question: string) => void }) {
  const prompts = solarWeatherMission.prompts[learningMode];
  return <div className="mission-view"><p className="eyebrow">{learningMode === "teacher" ? "FIVE-MINUTE CLASSROOM MISSION" : "STUDENT OBSERVATION MISSION"}</p><h2>{learningMode === "teacher" ? "Guide the room" : "Follow the evidence"}</h2><p className="instrument-note">{solarWeatherMission.sourceLabel}</p><div className="ask-chips">{prompts.map((question) => <button key={question} onClick={() => onAsk(question)} disabled={loading}>{loading ? "THINKING…" : question.toUpperCase()}</button>)}</div></div>;
}

function MouseTrail({ disabled }: { disabled: boolean }) {
  const trail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (disabled || !window.matchMedia("(pointer: fine)").matches || !trail.current) return;
    const root = trail.current;
    const particles = Array.from(root.querySelectorAll<HTMLElement>(".trail-particle"));
    const positions = particles.map(() => ({ x: -100, y: -100 }));
    let target = { x: -100, y: -100 };
    let visible = false;
    let frame = 0;
    const animate = () => {
      positions.forEach((position, index) => {
        const follow = .3 - index * .011;
        position.x += (target.x - position.x) * follow;
        position.y += (target.y - position.y) * follow;
        const particle = particles[index];
        particle.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${1 - index * .035})`;
        particle.style.opacity = visible ? String(Math.max(.08, .88 - index * .055)) : "0";
      });
      frame = window.requestAnimationFrame(animate);
    };
    const move = (event: PointerEvent) => { if (event.pointerType === "mouse") { target = { x: event.clientX, y: event.clientY }; visible = true; } };
    const leave = () => { visible = false; };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", leave);
    document.addEventListener("mouseleave", leave);
    frame = window.requestAnimationFrame(animate);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("pointermove", move); window.removeEventListener("blur", leave); document.removeEventListener("mouseleave", leave); };
  }, [disabled]);
  return <div ref={trail} className="mouse-trail" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <span className="trail-particle" key={index} />)}<style jsx global>{`.mouse-trail { position: fixed; inset: 0; pointer-events: none; overflow: hidden; mix-blend-mode: screen; }.trail-particle { position: fixed; top: 0; left: 0; width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px 2px rgba(248,173,62,.44), 0 0 22px 8px rgba(225,100,22,.13); will-change: transform, opacity; opacity: 0; }.trail-particle:nth-child(4n) { width: 5px; height: 5px; }.trail-particle:nth-child(5n) { background: radial-gradient(circle, #d8fff3 0 14%, rgba(78,243,178,.5) 32%, transparent 70%); box-shadow: 0 0 12px 3px rgba(78,243,178,.28); }`}</style></div>;
}

function formatReplayTime(timestamp: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date(timestamp)).toUpperCase() + " UTC";
}

function formatSourceTime(timestamp: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(new Date(timestamp)).toUpperCase() + " UTC";
}
