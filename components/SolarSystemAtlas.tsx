"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SolarSystemScene, type ExperienceScene } from "@/components/SolarSystemScene";
import { locations, type ScenarioLevel, type SpaceWeatherSnapshot } from "@/src/domain/space-weather";
import { demoSnapshot, createUnavailableSnapshot } from "@/src/lib/fixture";
import { deriveLiveVisualState, deriveScenario } from "@/src/lib/scenario";
import type { SolarSystemSnapshot } from "@/src/lib/providers/horizons";
import { atlasChapters, atlasInfo, enablesSdoEffects } from "@/src/lib/atlas";
import { archiveBodyForChapter, galleryForChapter, localArchiveItems, type AtlasGalleryItem } from "@/src/lib/atlas-gallery";
import type { AtlasArchiveImage, AtlasArchiveResponse } from "@/src/lib/atlas-data";
import type { SceneFocus } from "@/src/lib/celestial-focus";

const statusLabel: Record<SpaceWeatherSnapshot["status"], string> = { live: "LIVE", delayed: "DELAYED", cached: "CACHED", replay: "REPLAY", unavailable: "UNAVAILABLE" };
type AtlasPanel = "fact" | "gallery" | "info" | "earth" | null;
type AtlasPreviewPanel = "fact" | "gallery" | "info";
type EarthSignalTab = "observed" | "forecast" | "scenario" | "sources";

export function SolarSystemAtlas() {
  const [snapshot, setSnapshot] = useState<SpaceWeatherSnapshot>(demoSnapshot);
  const [solarSystem, setSolarSystem] = useState<SolarSystemSnapshot | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<AtlasPanel>(null);
  const [previewPanel, setPreviewPanel] = useState<AtlasPreviewPanel | null>(null);
  const [earthSignalTab, setEarthSignalTab] = useState<EarthSignalTab>("observed");
  const [scenarioLevel, setScenarioLevel] = useState<ScenarioLevel>("quiet");
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<AtlasGalleryItem | null>(null);
  const [localArchive, setLocalArchive] = useState<AtlasArchiveImage[]>([]);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioFadeFrame = useRef<number | null>(null);
  const activeChapter = atlasChapters[activeIndex] ?? atlasChapters[0];
  const sdoEffectsEnabled = enablesSdoEffects(activeChapter);
  const archiveBody = archiveBodyForChapter(activeChapter);
  const galleryItems = useMemo(() => [...galleryForChapter(activeChapter), ...localArchiveItems(activeChapter, localArchive)], [activeChapter, localArchive]);
  const chapterInfo = atlasInfo[activeChapter.id];
  const visualState = useMemo(() => deriveLiveVisualState(snapshot), [snapshot]);
  const sceneState = useMemo(() => scenarioLevel === "quiet" ? visualState : deriveScenario(scenarioLevel), [scenarioLevel, visualState]);
  const observedTimestamp = useMemo(() => {
    const capturedAt = new Date(snapshot.capturedAt);
    if (Number.isNaN(capturedAt.getTime())) return "LATEST OBSERVATION";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short",
    }).format(capturedAt).toUpperCase();
  }, [snapshot.capturedAt]);

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
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);
    return () => preference.removeEventListener("change", syncPreference);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const leading = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!leading) return;
      const index = Number((leading.target as HTMLElement).dataset.chapterIndex);
      if (Number.isFinite(index)) setActiveIndex(index);
    }, { threshold: [.38, .58, .78] });
    chapterRefs.current.forEach((chapter) => chapter && observer.observe(chapter));
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setActivePanel(null); setPreviewPanel(null); setSelectedGalleryItem(null); setEarthSignalTab("observed"); setScenarioLevel("quiet"); }, [activeIndex]);
  useEffect(() => {
    let active = true;
    if (!archiveBody) { setLocalArchive([]); return () => { active = false; }; }
    setLocalArchive([]);
    fetch(`/api/atlas-gallery/${archiveBody}`).then((response) => response.ok ? response.json() : Promise.reject(new Error("Archive unavailable"))).then((data: AtlasArchiveResponse) => active && setLocalArchive(data.items)).catch(() => active && setLocalArchive([]));
    return () => { active = false; };
  }, [archiveBody]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePanel(null);
        setPreviewPanel(null);
        setSelectedGalleryItem(null);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  useEffect(() => () => {
    if (audioFadeFrame.current !== null) window.cancelAnimationFrame(audioFadeFrame.current);
    ambientAudioRef.current?.pause();
  }, []);

  function fadeAudio(audio: HTMLAudioElement, targetVolume: number, onComplete?: () => void) {
    if (audioFadeFrame.current !== null) window.cancelAnimationFrame(audioFadeFrame.current);
    const startVolume = audio.volume;
    const duration = targetVolume > startVolume ? 520 : 240;
    const startedAt = window.performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      audio.volume = startVolume + ((targetVolume - startVolume) * progress);
      if (progress < 1) audioFadeFrame.current = window.requestAnimationFrame(step);
      else {
        audioFadeFrame.current = null;
        onComplete?.();
      }
    };
    audioFadeFrame.current = window.requestAnimationFrame(step);
  }

  function toggleAmbientSound() {
    const audio = ambientAudioRef.current;
    if (!audio) return;
    if (soundEnabled && !audio.paused) {
      setSoundEnabled(false);
      fadeAudio(audio, 0, () => {
        audio.pause();
        audio.currentTime = 0;
      });
      return;
    }
    setSoundEnabled(true);
    audio.volume = 0;
    void audio.play().then(() => {
      fadeAudio(audio, 0.1);
    }).catch(() => undefined);
  }

  useEffect(() => {
    const audio = ambientAudioRef.current;
    if (!audio) return;
    audio.volume = 0;
    void audio.play().then(() => fadeAudio(audio, 0.1)).catch(() => undefined);
  }, []);

  function selectFocus(focus: SceneFocus) {
    const destination = atlasChapters.findIndex((chapter) => chapter.focus === focus);
    if (destination < 0) return;
    chapterRefs.current[destination]?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function openPanel(panel: Exclude<AtlasPanel, null>) {
    setPreviewPanel(null);
    setSelectedGalleryItem(null);
    if (panel === "earth") setEarthSignalTab("observed");
    setActivePanel(panel);
  }

  function closePanel() {
    setActivePanel(null);
    setPreviewPanel(null);
    setSelectedGalleryItem(null);
  }

  function openPreview(panel: AtlasPreviewPanel) {
    if (!activePanel) setPreviewPanel(panel);
  }

  function closePreview(panel: AtlasPreviewPanel) {
    if (!activePanel) setPreviewPanel((current) => current === panel ? null : current);
  }

  function openImage(item: AtlasGalleryItem) {
    setPreviewPanel(null);
    setSelectedGalleryItem(item);
    setActivePanel("info");
  }

  function chapterActions(chapter: (typeof atlasChapters)[number], index: number) {
    const title = chapter.title.replace("\n", " ");
    const imageCount = index === activeIndex ? galleryItems.length : galleryForChapter(chapter).length;
    return <div className="atlas-copy-actions">
      <button className="fact-node" onPointerEnter={() => openPreview("fact")} onPointerLeave={() => closePreview("fact")} onFocus={() => openPreview("fact")} onBlur={() => closePreview("fact")} onClick={() => openPanel("fact")} aria-label={`Open ${title} fun fact`}><i />FUN FACT</button>
      <button className="info-node" onPointerEnter={() => openPreview("info")} onPointerLeave={() => closePreview("info")} onFocus={() => openPreview("info")} onBlur={() => closePreview("info")} onClick={() => openPanel("info")} aria-label={`Open ${title} information`}><i />DISCOVER</button>
      <button className="source-node" onPointerEnter={() => openPreview("gallery")} onPointerLeave={() => closePreview("gallery")} onFocus={() => openPreview("gallery")} onBlur={() => closePreview("gallery")} onClick={() => openPanel("gallery")} aria-label={`Open ${title} image archive`}><i />IMAGES <b>{imageCount}</b></button>
      {chapter.earthLayer && <button className="sentinel-node" onClick={() => openPanel("earth")} aria-label="Open Earth observation layer"><i />EARTH SIGNALS</button>}
    </div>;
  }

  const panelPreview = previewPanel === "fact"
    ? { eyebrow: "FUN FACT", title: activeChapter.title.replace("\n", " "), copy: chapterInfo.fact }
    : previewPanel === "info"
      ? { eyebrow: "DISCOVER", title: chapterInfo.label, copy: chapterInfo.description }
      : previewPanel === "gallery"
        ? { eyebrow: `IMAGES · ${galleryItems.length}`, title: "Source-linked views", copy: galleryItems[0] ? `${galleryItems[0].agency} · ${galleryItems[0].mission}` : "Curated imagery is loading." }
        : null;

  return <main className="atlas-experience">
    <audio ref={ambientAudioRef} src="/audio/smooth-meditation-mixkit.mp3" autoPlay loop preload="metadata" aria-hidden="true" />
    <div className="atlas-stage">
      <SolarSystemScene state={sceneState} tracing={sdoEffectsEnabled} skipFlight storyAct={activeChapter.scene === "earth" ? "earth" : activeChapter.scene === "spacecraft" ? "observer" : "sun"} reducedMotion={reducedMotion} instrument="193" location={locations[0]} auroraProbability={snapshot.aurora?.globalMaxProbability ?? null} view={activeChapter.scene as ExperienceScene} solarSystem={solarSystem} selectedFocus={activeChapter.focus} labelsVisible={labelsVisible} sdoEffectsEnabled={sdoEffectsEnabled} onSelectFocus={selectFocus} />
    </div>

    <header className="atlas-topbar">
      <button className="atlas-brand" onClick={() => chapterRefs.current[0]?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" })}><span />SOLAR <b>SENTINEL</b></button>
      <div className="atlas-actions"><button className={labelsVisible ? "atlas-toggle is-active" : "atlas-toggle"} onClick={() => setLabelsVisible((value) => !value)}>{labelsVisible ? "LABELS ON" : "LABELS"}</button><button className={!reducedMotion ? "atlas-toggle is-active" : "atlas-toggle"} onClick={() => setReducedMotion((value) => !value)} aria-label={reducedMotion ? "Turn motion on" : "Turn motion off"} aria-pressed={!reducedMotion}>{reducedMotion ? "MOTION OFF" : "MOTION ON"}</button><button className={soundEnabled ? "atlas-toggle atlas-sound-toggle is-active" : "atlas-toggle atlas-sound-toggle"} onClick={toggleAmbientSound} aria-label={soundEnabled ? "Turn ambient sound off" : "Turn ambient sound on"} aria-pressed={soundEnabled} title="Smooth Meditation — Mixkit"><span className="atlas-sound-icon" aria-hidden="true"><i /><i /><i /></span>{soundEnabled ? "SOUND ON" : "SOUND OFF"}</button></div>
    </header>

    <nav className="atlas-progress" aria-label="Solar System Atlas chapters">
      {atlasChapters.map((chapter, index) => <button key={chapter.id} className={index === activeIndex ? "active" : ""} onClick={() => chapterRefs.current[index]?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" })} aria-label={`${chapter.number}: ${chapter.title.replace("\n", " ")}`}><span>{chapter.number}</span></button>)}
    </nav>

    <div className="atlas-scroll">
      {atlasChapters.map((chapter, index) => <section key={chapter.id} className={index === activeIndex ? "atlas-chapter active" : "atlas-chapter"} data-chapter-index={index} ref={(element) => { chapterRefs.current[index] = element; }}>
        <div className="atlas-copy"><p>{chapter.eyebrow}</p><h1>{chapter.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1><small>{chapter.line}</small>{chapterActions(chapter, index)}</div>
      </section>)}
    </div>

    {panelPreview && !activePanel && <aside className="atlas-panel-preview" aria-live="polite"><span>{panelPreview.eyebrow}</span><b>{panelPreview.title}</b><small>{panelPreview.copy}</small></aside>}

    {activePanel === "gallery" && <aside className="atlas-gallery atlas-popup-card" role="dialog" aria-modal="true" aria-label={`${activeChapter.title.replace("\n", " ")} image archive`}>
      <div className="popup-grain" aria-hidden="true" />
      <div className="popup-content">
        <button className="popup-close" onClick={closePanel} aria-label="Close image archive" title="Close">×</button>
        <p>CURATED IMAGE ARCHIVE · {galleryItems.length}</p>
        <h2>{activeChapter.title.replace("\n", " ")}</h2>
        <div className="gallery-grid">
          {galleryItems.map((item) => <button className="gallery-tile" key={item.id} onClick={() => openImage(item)} style={{ backgroundImage: `url(${item.previewUrl}), url(${item.fallbackUrl})` }}><span className="gallery-shade" aria-hidden="true" /><small>{item.agency}</small><b>{item.mission}</b><i>OPEN ↗</i></button>)}
        </div>
        <small className="popup-disclaimer">Local research-archive imagery preserves its original source link, year, and caption. Mission-page previews remain source-linked; every tile falls back visually to the reviewed body treatment only when necessary.</small>
      </div>
    </aside>}

    {activePanel === "fact" && <aside className="atlas-info-card atlas-popup-card atlas-fact-card" role="dialog" aria-modal="true" aria-label={`${activeChapter.title.replace("\n", " ")} fun fact`}>
      <div className="popup-visual" aria-hidden="true" style={{ backgroundImage: `url(${galleryItems[0]?.previewUrl}), url(${galleryItems[0]?.fallbackUrl})` }} />
      <div className="popup-grain" aria-hidden="true" />
      <div className="popup-content">
        <button className="popup-close" onClick={closePanel} aria-label="Close fun fact" title="Close">×</button>
        <p>FUN FACT</p>
        <h2>{activeChapter.title.replace("\n", " ")}</h2>
        <div className="atlas-fact"><span>ONE THING TO REMEMBER</span><b>{chapterInfo.fact}</b></div>
        <div className="fact-detail-list">{chapterInfo.factDetails.map((detail) => <div className="fact-detail" key={detail.label}><span>{detail.label}</span><p>{detail.copy}</p></div>)}</div>
        <a className="popup-source-tile info-source" href={chapterInfo.sourceUrl} target="_blank" rel="noreferrer"><span>PRIMARY SOURCE</span><b>{chapterInfo.sourceName}</b><i>OPEN ↗</i></a>
      </div>
    </aside>}

    {activePanel === "info" && <aside className="atlas-info-card atlas-popup-card" role="dialog" aria-modal="true" aria-label={`${selectedGalleryItem?.mission ?? activeChapter.title.replace("\n", " ")} information`}>
      <div className="popup-visual" aria-hidden="true" style={{ backgroundImage: `url(${selectedGalleryItem?.previewUrl ?? galleryItems[0]?.previewUrl}), url(${selectedGalleryItem?.fallbackUrl ?? galleryItems[0]?.fallbackUrl})` }} />
      <div className="popup-grain" aria-hidden="true" />
      <div className="popup-content">
        <button className="popup-close" onClick={closePanel} aria-label="Close information" title="Close">×</button>
        <p>{selectedGalleryItem ? "SOURCE IMAGE" : chapterInfo.label}</p>
        <h2>{selectedGalleryItem ? selectedGalleryItem.mission : activeChapter.title.replace("\n", " ")}</h2>
        <p className="atlas-info-copy">{selectedGalleryItem ? selectedGalleryItem.note : chapterInfo.description}</p>
        {selectedGalleryItem && <button className="panel-return" onClick={() => openPanel("gallery")}>← IMAGE ARCHIVE</button>}
        <a className="popup-source-tile info-source" href={selectedGalleryItem?.sourceUrl ?? chapterInfo.sourceUrl} target="_blank" rel="noreferrer"><span>{selectedGalleryItem?.agency ?? "PRIMARY SOURCE"}</span><b>{selectedGalleryItem?.mission ?? chapterInfo.sourceName}</b><i>OPEN ↗</i></a>
      </div>
    </aside>}

    {activePanel === "earth" && <aside className="atlas-popup-card atlas-earth-card" role="dialog" aria-modal="true" aria-label="Earth signals console">
      <div className="earth-card-glow" aria-hidden="true" />
      <div className="popup-grain" aria-hidden="true" />
      <div className="popup-content">
        <button className="popup-close" onClick={closePanel} aria-label="Close Earth layer" title="Close">×</button>
        <p>EARTH SIGNALS · {earthSignalTab === "scenario" ? "SIMULATED" : earthSignalTab === "forecast" ? "OFFICIAL FORECAST" : earthSignalTab === "sources" ? "PROVENANCE" : "OBSERVED"}</p><h2>{earthSignalTab === "scenario" ? "What if?" : earthSignalTab === "forecast" ? "NOAA forecast" : earthSignalTab === "sources" ? "How we know" : "Magnetic shield"}</h2>
        <div className="earth-console-tabs" role="tablist" aria-label="Earth signals layers">
          {(["observed", "forecast", "scenario", "sources"] as EarthSignalTab[]).map((tab) => <button key={tab} className={earthSignalTab === tab ? "active" : ""} onClick={() => setEarthSignalTab(tab)} aria-pressed={earthSignalTab === tab}>{tab === "observed" ? "LIVE" : tab === "forecast" ? "NOAA" : tab === "scenario" ? "WHAT IF" : "SOURCES"}</button>)}
        </div>
        {earthSignalTab === "observed" && <><div className="earth-readings"><span><small>KP INDEX</small><b>{snapshot.kpObserved ?? "—"}</b></span><span><small>SOLAR WIND</small><b>{snapshot.solarWindSpeedKms ?? "—"}<em> KM/S</em></b></span><span><small>IMF Bz</small><b>{snapshot.imfBzNt ?? "—"}<em> nT</em></b></span></div>{snapshot.activeAlerts[0] ? <p className="earth-alert">OFFICIAL ALERT · {snapshot.activeAlerts[0].message}</p> : <p className="earth-alert is-clear">NO OFFICIAL ALERTS IN THE LATEST SNAPSHOT.</p>}<div className="earth-card-footer"><span>{statusLabel[snapshot.status]} · {observedTimestamp}</span><a href="https://www.swpc.noaa.gov/products-and-data" target="_blank" rel="noreferrer">NOAA SWPC ↗</a></div></>}
        {earthSignalTab === "forecast" && <div className="earth-layer-copy"><span>NOAA SWPC · OFFICIAL FORECAST</span><b>Kp {snapshot.kpForecastMax ?? "—"}</b><p>This is the official forecast layer. It is separate from live observations and Solar Sentinel scenarios.</p><a href="https://www.swpc.noaa.gov/products/3-day-forecast" target="_blank" rel="noreferrer">OPEN NOAA FORECAST ↗</a></div>}
        {earthSignalTab === "scenario" && <div className="earth-layer-copy"><span>SOLAR SENTINEL SCENARIO</span><div className="earth-scenario-levels">{(["quiet", "elevated", "strong", "extreme"] as ScenarioLevel[]).map((level) => <button key={level} className={scenarioLevel === level ? "active" : ""} onClick={() => setScenarioLevel(level)}>{level}</button>)}</div><p>Educational simulation — not a prediction or operational advisory.</p></div>}
        {earthSignalTab === "sources" && <div className="earth-source-list"><a href="https://sdo.gsfc.nasa.gov/mission/" target="_blank" rel="noreferrer"><span>LIVE SOLAR OBSERVATION</span><b>NASA SDO</b><i>↗</i></a><a href="https://www.swpc.noaa.gov/products-and-data" target="_blank" rel="noreferrer"><span>SPACE WEATHER PRODUCTS</span><b>NOAA SWPC</b><i>↗</i></a><a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noreferrer"><span>ARCHIVED EVENT RECORD</span><b>NASA DONKI</b><i>↗</i></a></div>}
      </div>
    </aside>}

    <style jsx global>{`
      .atlas-experience { min-height: 100svh; background: #02040b; color: #eef5ff; }.atlas-stage { position: fixed; z-index: 0; inset: 0; }.atlas-stage .scene { position: absolute; }.atlas-stage .scene:after { background: linear-gradient(90deg, rgba(2,4,11,.68), transparent 48%, rgba(2,4,11,.24)), linear-gradient(0deg, rgba(2,4,11,.82), transparent 36%); }.atlas-topbar { position: fixed; z-index: 5; inset: 0 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 24px clamp(20px, 3.5vw, 58px); pointer-events: none; }.atlas-topbar button { pointer-events: auto; }.atlas-brand { display: flex; align-items: center; gap: 8px; border: 0; background: transparent; color: #dde8f7; font: 11px "DM Mono"; letter-spacing: .28em; }.atlas-brand b { color: #8da6c6; font-weight: 400; }.atlas-brand span { width: 10px; height: 10px; border-radius: 50%; background: #f3ae2e; box-shadow: 0 0 18px 4px rgba(247,158,24,.45); }.atlas-actions { display: flex; align-items: center; gap: 10px; }.atlas-toggle { border: 1px solid rgba(135,174,220,.26); border-radius: 999px; background: rgba(3,13,28,.36); padding: 7px 10px; color: #a9bfd9; font: 8px "DM Mono"; letter-spacing: .12em; }.atlas-toggle.is-active { border-color: rgba(96,242,185,.6); color: #baffdf; background: rgba(38,166,120,.12); }.atlas-sound-toggle { display: inline-flex; align-items: center; gap: 6px; }.atlas-sound-icon { display: inline-flex; align-items: end; gap: 1px; width: 9px; height: 9px; }.atlas-sound-icon i { width: 1px; height: 3px; background: currentColor; opacity: .4; transition: height .22s ease, opacity .22s ease; }.atlas-sound-icon i:nth-child(2) { height: 6px; }.atlas-sound-icon i:nth-child(3) { height: 4px; }.atlas-sound-toggle.is-active .atlas-sound-icon i { opacity: 1; animation: atlas-sound-wave .8s ease-in-out infinite alternate; }.atlas-sound-toggle.is-active .atlas-sound-icon i:nth-child(2) { animation-delay: -.28s; }.atlas-sound-toggle.is-active .atlas-sound-icon i:nth-child(3) { animation-delay: -.5s; }@keyframes atlas-sound-wave { to { height: 9px; } }.atlas-progress { position: fixed; z-index: 5; right: clamp(20px, 3.4vw, 58px); top: 50%; display: grid; gap: 8px; transform: translateY(-50%); }.atlas-progress button { width: 24px; height: 24px; padding: 0; border: 1px solid rgba(135,174,220,.22); border-radius: 50%; background: rgba(3,13,28,.32); color: #8292a7; font: 7px "DM Mono"; transition: .3s ease; }.atlas-progress button.active { width: 40px; border-color: #69f2bd; border-radius: 999px; background: rgba(38,166,120,.15); color: #c7ffe2; }.atlas-scroll { position: relative; z-index: 2; pointer-events: none; }.atlas-chapter { position: relative; display: flex; min-height: 100svh; align-items: center; padding: 90px clamp(24px, 8vw, 136px) 76px; pointer-events: none; }.atlas-copy { width: min(400px, calc(100vw - 95px)); opacity: 0; transform: translateY(22px); transition: opacity .55s ease, transform .75s cubic-bezier(.2,.8,.2,1); }.atlas-chapter.active .atlas-copy { opacity: 1; transform: translateY(0); }.atlas-copy p { margin: 0 0 16px; color: #89a2c0; font: 9px "DM Mono"; letter-spacing: .2em; }.atlas-copy h1 { display: grid; gap: 0; margin: 0; color: #f4f7fb; font: 500 clamp(50px, 7vw, 110px)/.78 "Playfair Display", serif; letter-spacing: -.075em; text-shadow: 0 14px 40px rgba(0,0,0,.38); }.atlas-copy h1 span:last-child { color: #f3b544; }.atlas-copy small { display: block; max-width: 290px; margin-top: 23px; color: #a7b5c6; font: 11px/1.6 Manrope, sans-serif; }.source-node, .sentinel-node { display: flex; align-items: center; gap: 8px; margin-top: 22px; border: 0; background: transparent; padding: 0; color: #d4e8fb; font: 8px "DM Mono"; letter-spacing: .14em; pointer-events: auto; }.source-node i, .sentinel-node i { width: 7px; height: 7px; border: 1px solid #79ecbd; border-radius: 50%; box-shadow: 0 0 12px rgba(105,242,189,.5); }.sentinel-node { color: #f4c96f; }.sentinel-node i { border-color: #f4c96f; }.atlas-scroll-cue { position: absolute; bottom: 36px; left: clamp(24px, 8vw, 136px); display: flex; align-items: center; gap: 10px; color: #7f91a8; font: 8px "DM Mono"; letter-spacing: .17em; }.atlas-scroll-cue i { width: 36px; height: 1px; background: linear-gradient(90deg, #76f1bb, transparent); animation: atlas-pulse 1.5s ease-in-out infinite alternate; }@keyframes atlas-pulse { to { transform: scaleX(.35); opacity: .35; } }.atlas-sources, .earth-sentinel { position: fixed; z-index: 7; top: 50%; right: clamp(20px, 4vw, 64px); width: min(300px, calc(100vw - 40px)); max-height: min(78svh, 680px); overflow-y: auto; transform: translateY(-50%); border: 1px solid rgba(141,188,238,.28); border-radius: 18px; background: linear-gradient(145deg, rgba(5,20,43,.92), rgba(3,8,20,.86)); box-shadow: 0 28px 90px rgba(0,0,0,.48); padding: 17px; backdrop-filter: blur(20px); animation: atlas-panel-in .38s cubic-bezier(.2,.85,.2,1); }.atlas-sources > button, .earth-sentinel > button { position: absolute; top: 10px; right: 10px; border: 0; background: transparent; color: #c0d0e0; font-size: 19px; }.atlas-sources p, .earth-sentinel p { margin: 0; color: #77edbb; font: 8px "DM Mono"; letter-spacing: .15em; }.atlas-sources h2, .earth-sentinel h2 { margin: 10px 0 15px; color: #f4f7ff; font: 500 29px/1 "Playfair Display", serif; }.atlas-sources a { position: relative; display: grid; gap: 4px; margin-top: 8px; border-top: 1px solid rgba(141,188,238,.15); padding: 10px 20px 4px 0; color: #dbe8f7; text-decoration: none; }.atlas-sources a span { color: #8095ad; font: 7px "DM Mono"; letter-spacing: .12em; }.atlas-sources a b { font: 10px/1.35 Manrope, sans-serif; font-weight: 500; }.atlas-sources a em { color: #8da2bb; font: 8px/1.4 Manrope, sans-serif; font-style: normal; }.atlas-sources a i { position: absolute; right: 0; top: 17px; color: #7eeec0; font-style: normal; }.atlas-sources small, .earth-sentinel small { display: block; margin-top: 15px; color: #8292a7; font-size: 9px; line-height: 1.45; }.earth-sentinel { top: auto; bottom: 28px; transform: none; }.earth-sentinel > div { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 15px 0; }.earth-sentinel > div span { border: 1px solid rgba(115,180,237,.18); border-radius: 10px; background: rgba(103,171,255,.06); padding: 8px; color: #a9bed4; font: 7px "DM Mono"; letter-spacing: .05em; }.earth-sentinel > div b { display: block; margin-bottom: 5px; color: #73f4bf; font: 18px/1 "DM Mono"; letter-spacing: -.09em; }.earth-sentinel a { display: block; margin-top: 8px; color: #a8d7f8; font: 8px "DM Mono"; letter-spacing: .08em; text-decoration: none; }@keyframes atlas-panel-in { from { opacity: 0; transform: translate(12px, -50%) scale(.98); } to { opacity: 1; transform: translate(0, -50%) scale(1); } }@media (max-width: 700px) { .atlas-topbar { padding: 18px; }.atlas-brand { font-size: 9px; }.atlas-actions { gap: 6px; }.atlas-toggle { padding: 6px 7px; font-size: 7px; }.atlas-progress { right: 13px; }.atlas-chapter { padding: 84px 24px 70px; align-items: flex-end; }.atlas-copy { margin-bottom: 48px; }.atlas-copy h1 { font-size: clamp(52px, 16vw, 76px); }.atlas-sources { top: auto; right: 16px; bottom: 16px; transform: none; }.earth-sentinel { right: 16px; bottom: 16px; }.atlas-scroll-cue { left: 24px; }.atlas-stage .scene-note { display: none; } }@media (prefers-reduced-motion: reduce) { .atlas-copy, .atlas-stage .scene canvas { transition: none; }.atlas-scroll-cue i { animation: none; } }
    `}</style>
  </main>;
}
