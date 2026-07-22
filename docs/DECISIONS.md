# Solar Sentinel — Decision Record

This file captures durable product and implementation choices so future work preserves the experience’s scientific integrity and visual direction.

## 2026-07-22 — Use Smooth Meditation as the Atlas ambient bed

**Decision** — Replace the prior *Feedback Dreams* ambient loop with the user-supplied Mixkit download, *Smooth Meditation*.

**Why** — The user selected this calmer track for the Solar Sentinel experience.

**Supersedes** — “Use opt-in ambient sound as a persistent Atlas control” only with respect to the selected track.

**Consequence** — The local looping file is `public/audio/smooth-meditation-mixkit.mp3`. Its original Mixkit attribution and licence record must be retained or reconfirmed before public distribution because the supplied file does not itself establish a public source URL.

## 2026-07-22 — Keep Solar Sentinel as the primary product name

**Decision** — Brand the experience as **Solar Sentinel**. Use “Global Solar-System Atlas” only as a descriptive subtitle in metadata and submission copy.

**Why** — Solar Sentinel retains the memorable identity of the original Sun-to-Earth story while allowing the broader planetary Atlas to remain an understandable product descriptor.

**Consequence** — The visible masthead and browser metadata use Solar Sentinel. Code-level component names that describe the Atlas remain implementation details rather than a competing public brand.

## 2026-07-22 — Keep the Atlas header to three learner controls

**Decision** — Remove the persistent delayed-data status pill from the top bar, hide Next.js’s development-only indicator, and retain three explicit visitor controls: Labels, Motion on/off, and Sound on/off. Ambient sound defaults to on and attempts to start at page load; the sound toggle remains the immediate fallback when a browser blocks unmuted autoplay.

**Why** — The top bar should act as a quiet control deck, not a status dashboard or development surface. The status belongs in the on-demand Earth Signals console where it can be explained. The user also explicitly wants motion control available alongside the music control.

**Supersedes** — “Use opt-in ambient sound as a persistent Atlas control” only with respect to the default audio state and the replacement of the motion control.

**Consequence** — The shipped header is visually limited to Labels, Motion, and Sound. `devIndicators: false` only removes the local Next.js indicator; it does not hide runtime or build errors. The Earth Signals panel remains the source of truth for live, delayed, cached, replay, or unavailable data state.

## 2026-07-22 — Use opt-in ambient sound as a persistent Atlas control

**Decision** — Replace the former top-right motion control with an explicit `SOUND OFF` / `SOUND ON` control and use a locally served looping copy of *Feedback Dreams* by Eugenio Mininni. Audio begins only after a visitor turns it on, then fades in at a restrained 10% volume.

**Why** — The Atlas benefits from a quiet, space-documentary atmosphere, but sound must never interrupt a learner, violate browser autoplay rules, or take visual priority over the scenes. The user selected this Mixkit track for its ambient, atmospheric, synth, space, and documentary character.

**Consequence** — The interface has no top-right delete-style control; it retains Labels, current data status, and sound. System reduced-motion preference remains honoured automatically. Track provenance and licence details live in `docs/ASSET_CREDITS.md`; source: [Mixkit — Feedback Dreams](https://mixkit.co/free-stock-music/atmospheres/).

## 2026-07-21 — Prioritise a source-grounded Sun-to-Earth learning arc

**Decision** — Keep the full Solar Atlas as the visual entry, but define the hackathon product around one promise: “Turn live solar observations into a clear, source-grounded explanation of what they mean for Earth.” The winning journey is Solar system → Sun → live observation → Earth shield → May 2024 replay → GPT explanation.

**Why** — A broad planetary atlas can show visual craft but risks reading as an attractive simulation. The specific Sun-to-Earth arc gives the live sources, DONKI replay, and GPT-5.6 a shared educational purpose that judges can understand in minutes.

**Consequence** — The next delivery work prioritises an evidence-bounded explainer, one historical replay, the distinction among observed data/official forecast/scenario/uncertainty, and a three-minute proof video. Planet galleries and future agency additions remain valuable context but cannot delay this vertical slice. The detailed acceptance criteria and submission outline live in `docs/HACKATHON_9_PLUS_PLAN.md`.

## 2026-07-21 — Use source-informed hybrid materials for every celestial body

**Decision** — Keep reviewed NASA/JPL/USGS/SDO images as the authoritative source/provenance layer, but render the Sun, planets, and Moon through body-class shader materials rather than expose raw maps directly. Each material combines its cited map with a deterministic, full-sphere visual field appropriate to its class—rock and crater, cloud, terrestrial, Mars dust, gas bands, ice giant haze, or Pluto ice—and applies the same solar-light response. The Sun’s SDO disc is used as a softly projected front-side observation influence over a continuous solar field; it is not wrapped as a false global solar map.

**Why** — Raw public maps have different projections, lighting, eras, resolutions, and image-processing conventions. Directly placing them on spheres caused visible joins, uneven hemispheres, and planets that looked like unrelated coloured assets. A structured img2threejs reference study of supplied solar imagery confirmed that the right reconstruction contract is a coherent spherical silhouette, active-region detail, and restrained corona—not invented solar terrain.

**Supersedes** — “Use source-aware materials, not one generic planet shader” with respect to browser-derived normal maps and direct raw-map presentation; it retains that decision’s source taxonomy and limitation labels. It also supersedes “Give the Earth chapter’s Moon a real survey surface” only where it describes the old luminance-derived normal-map implementation.

**Consequence** — The visual shader is explicitly source-informed illustration, never a scientific surface reconstruction, elevation model, current atmospheric measurement, or prediction. Source cards continue to name the actual map/image and limitations. The shader applies a seam fade and filtered derivative micro-relief only for light response; no colour image is represented as measured topography. The Overview Sun remains a scientifically honest camera-facing SDO observation disc, while close Sun and SDO scenes use the source-informed spherical treatment.

## 2026-07-21 — Treat source maps as material evidence, not guaranteed globe textures

**Decision** — Sample source maps only where the catalogue verifies that they are useful global colour references. Mercury’s incomplete Mariner mosaic and Uranus’ nearly uniform JPL reference no longer drive the 3D albedo; their cited imagery stays visible in the source gallery. The close Sun is now a continuous procedural plasma sphere, while the live SDO image remains a correctly shaped observed disc in the system overview and SDO chapter.

**Why** — Inspection of the actual source bytes showed that Mercury’s supplied map contains a large no-data area and Uranus’ reference is effectively flat cyan. Treating either as a literal wrap created the visible hemisphere break the experience is meant to avoid. An SDO full-disc observation likewise cannot truthfully wrap around an unseen solar hemisphere.

**Consequence** — All shader lighting relief now derives from seamless planet-space fields rather than image derivatives, preventing an image join from becoming a lighting seam. Cited global maps still supply restrained albedo for suitable worlds; public imagery remains primary evidence in the gallery. This is a visual reconstruction with source provenance, never a claim that the shader is a scientific global model.

## 2026-07-21 — Separate complete renderer maps from scientific provenance

**Decision** — Use the complete 2K equirectangular renderer-map links supplied in `SolarSystemData/data/3d_rendering_specs.md` for Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Keep NASA/JPL/USGS science-map URLs, mission imagery, and the local worldwide-agency archive as the primary learning and provenance layer.

**Why** — Direct inspection showed the JPL map catalogue is excellent scientific context but not a uniform WebGL texture feed: some entries contain no-data regions, uneven illumination, or intentionally low-detail references. The supplied renderer map set is made for the one thing the scene requires: continuous globe coverage.

**Consequence** — The system never calls a renderer texture “live” or treats it as a measurement. The material proxy response exposes a render-texture credit separately from the NASA/JPL/USGS source role. The shader still owns continuity, atmospheric behaviour, lighting, and non-topographic micro-relief; local source-gallery photos remain the proof layer.

## 2026-07-21 — Direct Chapter 01 as a cinematic orbital tableau

**Decision** — Use a closer, deliberately low-orbit camera and expanded visual body sizes for the ready state of the system map. Keep the JPL-derived body directions, but make the composition legible through a clear size hierarchy, quiet blue inner orbits, amber primary outer orbits, and a deterministic field of amber solar motes.

**Why** — The intended first impression is an explorable observatory display: the Sun anchors the frame, large planets show their source maps at a glance, and light has a visible route across the scene. A more distant, uniformly weighted map read as a diagram rather than a cinematic learning environment.

**Consequence** — The camera, apparent sizes, orbit emphasis, and motes are authored visual scale rather than a literal physical rendering. The planets remain sourced from real maps and their directions continue to come from NASA/JPL data; the motes communicate illustrative solar light, not individually observed particles.

## 2026-07-21 — Gate the system map on source readiness

**Decision** — Do not render substitute planets in Chapter 01. Hold the opening on a minimal loading state until a non-unavailable NASA/JPL position snapshot and all nine source-backed planet maps have loaded; if a required source fails, retain the source-unavailable state instead of presenting a flat-colour stand-in.

**Why** — A visually complete but uncited or untextured orbital map contradicts the Atlas’s provenance-first promise. A short, clear loading interval is preferable to displaying a source failure as if it were a real planetary surface.

**Supersedes** — “Present the opening map as a lit, navigable heliocentric tableau” only with respect to its static loading-time reference layout.

**Consequence** — Cached NASA/JPL snapshots may still open the map when they contain real previously fetched positions. An unavailable position feed or failed surface map is visible as a loading/error state; it never becomes an invented solar-system tableau.

## 2026-07-21 — Present the opening map as a lit, navigable heliocentric tableau

**Decision** — Keep every principal world from Mercury through Pluto inside the Chapter 01 composition, make the Sun and all planets direct chapter links with generous 3D hit areas, and light their source-backed materials from the central Sun. Add slow, expanding solar wavefronts and a faint tilted stellar dust band to establish a cinematic space environment.

**Why** — The opening must communicate the whole system at first glance while inviting learners into a specific world. Literal orbital distance and radiometric falloff would make the outer planets too dim or too distant to serve that role in one interactive frame.

**Consequence** — Orbital distances, apparent body sizes, solar wavefronts, and the galactic band are explicitly illustrative visual language, not a measurement, forecast, or live all-sky survey. NASA/JPL Horizons remains the position source; the no-falloff solar key only preserves readable day/night form within the compressed visual scale. The dedicated SDO response remains exclusive to Chapter 12.

## 2026-07-21 — Model SDO as a source-labelled observatory, not a generic satellite

**Decision** — Use a procedural, source-informed SDO assembly in Chapter 12: the solar-array silhouettes, central bus, gold sun-facing deck, AIA telescope cluster, HMI and EVE housings, and high-gain antenna follow NASA’s published spacecraft reference. Keep the model confined to the final SDO-to-Earth scene and stage it beside Earth through an authored observer shot.

**Why** — The previous box-and-two-panels icon did not communicate that SDO is a real solar observatory. A recognisable spacecraft gives the culminating chapter a stronger scientific identity without replacing the actual SDO image, NOAA context, or Earth response with decorative fiction.

**Consequence** — The assembly carries its source URL at runtime and is labelled as a source-informed front/three-quarter representation; its unseen rear structure and orbit are illustrative, not an engineering or orbital reconstruction. The planetary, lunar, and solar surface rule remains unchanged: those continue to use cited mission imagery rather than generated geometry. Primary reference: [NASA SDO spacecraft](https://sdo.gsfc.nasa.gov/mission/spacecraft.php).

## 2026-07-21 — Use a disciplined Three.js graphics-quality workflow

**Decision** — Adopt the focused Three.js Awesome Graphics skill set as the Atlas’s visual-production workflow: camera direction, texture-backed PBR materials, procedural fields and VFX, atmospheric perspective, bloom, exposure/color grading, render-pipeline ownership, shadows, and fixed-view visual validation.

**Why** — Solar Atlas aims for a source-backed cinematic learning experience, but a collection of isolated effects can make scenes look synthetic or inconsistent. The selected workflows give each enhancement an explicit visual role, a no-post baseline, performance bounds, and a way to validate it across the whole journey.

**Consequence** — Future graphics work should begin with the visual router, use the smallest relevant specialist workflow, and validate every material/light/post-processing change in representative system, planet, Earth, and SDO views. `img2threejs` is available for source-labelled, procedural hard-surface models such as spacecraft and instruments; it must not fabricate planetary, lunar, or solar science surfaces. The upstream references are [Three.js Awesome Graphics Agent Skills](https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills) and [img2threejs](https://github.com/hoainho/img2threejs).

## 2026-07-19 — Light every chapter from a shared solar-cinematic baseline

**Decision** — Use a scene-profiled lighting system across the Atlas: a warm solar key and restrained cool hemispheric fill for the system map, Earth, and planet close views; a lighter, non-flattening treatment for the Sun observatory. Use one sRGB/ACES renderer configuration and reserve bloom for genuinely luminous highlights.

**Why** — Independent ambient and point-light values made adjacent chapters feel as though they were rendered in different products. Overexposed ambient light and a low bloom threshold also washed source textures into flat colour fields, while darker faces became unreadable.

**Consequence** — `SceneLighting` is the single lighting vocabulary for the four 3D scene families. Planets retain a physically legible day side, soft cool space-side fill, and texture detail; solar emission, aurora, and spacecraft lights remain special effects rather than the primary scene illumination. The renderer uses sRGB output, ACES tone mapping, lower exposure, and selective bloom so the live Sun can glow without making every material glow.

## 2026-07-19 — Render the overview Sun as an observed disc

**Decision** — Render the latest SDO image as a camera-facing solar disc in the full-system overview, rather than wrapping a two-dimensional solar observation around a sphere. Keep richer close-view Sun rendering in the dedicated Sun and SDO chapters.

**Why** — An SDO full-disc image records one visible hemisphere. Wrapping it around a sphere created a black seam and an artificial rim that undermined the system map’s credibility.

**Consequence** — The overview shows the observed image in its scientifically honest geometry, with only a restrained visual edge glow. The map also uses quieter orbit guides, dust, and Saturn rings so source-backed celestial bodies remain the focus.

## 2026-07-19 — Make the system map a legible heliocentric tableau

**Decision** — Compose Chapter 01 as a centred, full-system solar tableau: visibly textured worlds at intentionally expanded visual sizes, crisp orbit paths, direct labels, and a subtle ornamental dust field. Keep NASA/JPL Horizons as the position source and retain the explicit non-to-scale treatment.

**Why** — The former off-centre camera, small worlds, generic ring, and pill labels read as a prototype rather than an explorable solar-system view. The reference direction calls for immediate spatial legibility before a learner enters any close chapter.

**Consequence** — The scene is clearer at first glance without claiming literal planetary scale. The dust field is atmospheric art direction only, not an astronomical observation; source-backed maps remain the texture layer and the source panel preserves their limitations.

## 2026-07-19 — Separate SDO source imagery from SDO effects

**Decision** — Keep the latest available SDO image as the Sun’s static source texture throughout the Atlas, while reserving live motion and all SDO-to-Earth effects—corona loops, solar wind, magnetic shield, aurora, impact pulse, and spacecraft—for Chapter 12.

**Why** — Removing the source image from early chapters left a low-detail procedural fallback that looked synthetic. A quiet, source-backed Sun establishes visual credibility without weakening the dedicated SDO-to-Earth reveal.

**Supersedes** — “Reserve SDO effects for Chapter 12” with respect to the SDO source texture only.

**Consequence** — Chapters 01–11 load a real SDO surface image but freeze its animation and render no SDO weather effects. `enablesSdoEffects()` remains the single gate for Chapter 12’s reactive visual system.

## 2026-07-19 — Reserve SDO effects for Chapter 12

**Decision** — Do not request or render the live SDO solar texture, corona loops, solar-wind particles, magnetic shield, aurora, impact pulse, or SDO spacecraft in Atlas Chapters 01–11. Enable the full SDO-to-Earth response only in Chapter 12.

**Why** — The planetary journey needs visual hierarchy. Showing solar-weather effects before the dedicated observer chapter conflates the Sun’s general role with the SDO mission and makes the final reveal less meaningful.

**Consequence** — Earlier chapters use a quiet Sun treatment and planetary views. `enablesSdoEffects()` is the single Chapter-12 gate; it is covered by a unit test so new chapters cannot unintentionally re-enable the reactive layer.

## 2026-07-19 — Give the Earth chapter’s Moon a real survey surface

**Decision** — Render the Moon with the LRO LROC WAC Global Morphology Mosaic supplied by NASA/GSFC, ASU, and USGS, through the same source-aware material path as the rocky planets.

**Why** — The Earth chapter’s former plain-gray Moon was visibly inconsistent with the source-backed Sun and planets. The LRO WAC product is a public-domain global morphology mosaic and its USGS record identifies its coverage, coordinate system, source imagery, and limitations.

**Consequence** — `/api/planet-surface/moon` returns the attributed USGS proxy image with a correct `NASA-USGS` source header. Its normal map remains visual micro-relief derived from the mosaic, not a terrain measurement. A future close lunar terrain scene should use the separate LRO/LOLA elevation product rather than infer height from imagery.

## 2026-07-18 — Use source-aware materials, not one generic planet shader

**Decision** — Render each Atlas body through a source-aware material profile: JPL mission mosaics supply the albedo layer for Mercury, Venus, Earth, and Mars; only those rocky/radar treatments receive a browser-derived micro-relief normal map. Jupiter, Saturn, Uranus, and Neptune stay smooth, rough atmospheric shells because JPL classifies those maps as representative and their appearance changes daily. The Sun uses the latest SDO image as an observed projected surface layer with an emissive corona shader. The Solar Sentinel Earth scene now uses the reviewed Atlas Earth source rather than third-party demo textures.

**Why** — A colour-only sphere does not communicate material character, but treating an image as a literal elevation map or a changing gas atmosphere as fixed topography would overclaim what the source supports. JPL’s map catalog explicitly distinguishes mission mosaics from illustrative/representative outer-planet maps; SDO publishes current AIA image feeds rather than a global solar texture.

**Consequence** — `planet-surfaces.ts` holds roughness, atmosphere, and normal-map eligibility beside each source record. The normal map is rendered from source-image luminance at runtime for visual micro-relief only; it is never presented as a digital elevation model. NASA Solar System Treks remains the future route for true DEM-backed terrain because it exposes elevation-capable map services.

## 2026-07-18 — Make chapter knowledge a compact card, not scene clutter

**Decision** — Every Atlas chapter has one on-demand `DISCOVER` card containing a concise source-backed description, one clearly marked quick fact, and a primary-source link. `IMAGES` opens its own gallery; selecting an image replaces the gallery with a single source-image card that can return to the gallery. All overlay cards use the same visible close control and support Escape.

**Why** — Generic `INFO`/`ARCHIVE` labels, dense technical type, and overlapping-looking overlays made the experience feel like a debug interface rather than a polished learning environment. The core visual story should remain unobstructed until a learner asks for context.

**Consequence** — Atlas labels use restrained DM Sans for navigation and display text, reserving DM Mono for small data accents. World labels show the object name first rather than redundant `OBJECT` text; moon annotations use only their names and a leader. The gallery, information, image-detail, and Earth cards remain mutually exclusive.

## 2026-07-18 — Serve the curated local Solar System archive as on-demand provenance

**Decision** — Read the sibling `SolarSystemData/data` archive through same-origin, read-only Atlas routes and append each supported body’s chronological image set to its chapter `ARCHIVE`. Keep the JPL surface maps and live SDO imagery as the WebGL surface layer; use the local photographs as source-linked gallery cards, never as assumed equirectangular textures or live observation.

**Why** — The supplied 610 MB archive contains ten body galleries, 38 mission profiles, and agency records for NASA, ESA, ISRO, JAXA, DLR, ASI, CNSA, and Roscosmos. It gives the Atlas a stronger visual record while preserving the source title, agency string, year, caption, and original link for every image.

**Consequence** — The app sends only requested metadata and JPEG bytes, rather than copying the archive into the Next.js bundle. `SOLAR_SYSTEM_DATA_ROOT` can override the sibling-directory default. An archive card opens one exclusive information card; it does not overlap the gallery. Some supplied profiles point to archival hosting such as Wikimedia even when the pictured mission is official, so the UI preserves the catalogued source/original link and does not label every local image as current or primary-agency telemetry. A deployed product will require a reviewed licence/provenance manifest and durable public or object-storage asset location before this local adapter becomes a production data source.

## 2026-07-18 — End with an SDO-to-Earth observation scene and a curated visual archive

**Decision** — Restore Earth as a quiet planetary chapter and move the SDO, solar-wind, magnetosphere, and aurora response to the final chapter. Every body chapter can now open one exclusive on-demand panel: an information card or a source-labelled gallery of reviewed surface/live imagery and official mission-page previews.

**Why** — Solar-weather effects distorted the normal Solar System story and made SDO look like it caused Earth’s response. A small curated archive gives learners a visual path into relevant worldwide missions without turning the scene into a wall of links or unverified imagery.

**Supersedes** — “Separate the SDO observatory from the Earth environment” in chapter placement: the scientific distinction remains, but SDO now closes the journey rather than interrupting the early planetary sequence.

**Consequence** — The final `SDO → Earth` chapter explicitly frames SDO as an observer and space-weather response as an illustrative, NOAA-backed context. Gallery cards identify agency and mission, retain their direct source links, and fall back to the chapter’s reviewed visual if an official page preview is unavailable. The gallery, info card, and Earth panel share one state, so opening one always closes the others.

## 2026-07-18 — Open inside the orbital map, not on a title slide

**Decision** — Chapter 01 opens as a tighter full-bleed system composition with the Sun and major bodies immediately legible. Remove its headline, paragraph, scroll prompt, and source control; show the compact object labels by default, while keeping the global label toggle.

**Why** — The first frame must make the user feel present in an explorable solar-system scene. A large editorial headline competed with the real-time composition and delayed the moment of curiosity.

**Supersedes** — “Make labels art direction, not an inspection overlay” only with respect to the opening default: system labels now begin visible.

**Consequence** — The opener communicates through planetary scale, orbits, and selection affordances rather than copy. Source cards remain available from every narrative chapter after the map; object selection remains the route out of the overview.

## 2026-07-18 — Make provenance panels scene objects, not utility drawers

**Decision** — Present chapter sources and the Earth environment as large, image-backed translucent cards with rounded luminous edges, restrained typography, and a small number of deliberate interaction tiles.

**Why** — The previous narrow source drawer was correct but visually generic. It did not participate in the world or match the cinematic language established by the Atlas reference direction.

**Consequence** — A panel uses the current chapter’s real SDO image or reviewed planetary surface as an atmospheric backdrop, never as an uncredited decorative asset. Source roles, links, limitations, and the separate SDO/Earth boundary stay explicit, but detailed information remains on demand instead of permanently over the scene.

## 2026-07-18 — Separate the SDO observatory from the Earth environment

**Decision** — Give SDO a dedicated observatory chapter directly after the Sun, while Earth remains a separate chapter for its magnetic shield, aurora, and NOAA-backed environment layer.

**Why** — SDO is a Sun-observing spacecraft and its mission identity should not be conflated with the Earth response. The split makes both chapters visually and scientifically clearer.

**Consequence** — The Atlas expands to 12 chapters. The Earth panel contains NOAA space-weather context only; the SDO latest-image and Mission Operations Center links live in the new SDO chapter.

## 2026-07-18 — Make labels art direction, not an inspection overlay

**Decision** — Use a condensed technical-display typography system for Atlas labels, with restrained chromatic edge, sparse leader-line callouts, and no persistent scene-footnote. Moon labels remain optional but become small annotations rather than oversized floating names.

**Why** — The first Atlas label implementation exposed raw object names with browser-default styling because those classes were only defined by an unused legacy component. It read as a development overlay and competed with the planet scene.

**Consequence** — Atlas now loads Barlow Condensed and Space Mono for display/callout language. System labels use a minimal focus/object marker; Moon labels use numbered micro-callouts with short leaders. All scene labels remain off by default and the source drawer remains the full-information affordance.

## 2026-07-18 — Treat NASA Eyes as a spatial-credibility baseline, not a cloning target

**Decision** — Raise the Atlas system map toward the legibility and material credibility expected of a modern 3D solar-system explorer, then differentiate it through scroll-directed storytelling and translucent, on-demand provenance UI.

**Why** — A cinematic wrapper cannot compensate for generic coloured spheres. NASA Eyes already demonstrates the baseline expectation for a credible interactive system view; Solar Atlas should add a more approachable narrative and international research context rather than reproduce its product wholesale.

**Consequence** — Planet surfaces now use a reviewed JPL map catalog through a same-origin proxy rather than arbitrary archive-search thumbnails. Mercury, Venus, Earth, and Mars are identified as map/mosaic treatments; outer-planet and Pluto maps are visibly and textually classified as illustrative visual references where JPL says that a global scientific map is not available or atmospheres are dynamic. Directional lighting, oblate gas giants, and a planar Saturn ring improve scene depth without claiming true scale.

## 2026-07-18 — Make provenance international, relevant, and type-labelled

**Decision** — Each chapter presents a compact source constellation of the relevant global missions and agencies—NASA/JPL, ESA, JAXA, ISRO, NOAA, UAE/MBRSC, ASI, and historical USSR contribution where supported—while preserving the distinction between live observations, source mosaics, mission imagery, context, and visual reference.

**Why** — The Atlas should feel like a trustworthy entrance into worldwide space science, not a collection of unqualified logos or a NASA-only experience. “All agencies” must mean verified, body-relevant primary sources, not an unreviewed exhaustive directory.

**Consequence** — The optional drawer now exposes each source’s role and any material limitation. NASA/JPL Horizons remains the only current position layer for the system; NASA SDO and NOAA remain current Earth/Sun observation layers. Agency links that are not fetched by the app remain mission imagery or context, never live data.

## 2026-07-18 — Evolve Solar Sentinel into the Solar System Atlas

**Decision** — Make the product a scroll-directed Solar System Atlas for any curious learner. Solar Sentinel becomes a compact, live Earth subchapter rather than the entire interface; remove student/teacher and mission-console framing from the landing experience.

**Why** — A wider solar-system story has more educational value and makes the space-weather experience meaningful in its physical context. Full-screen scroll chapters create a cinematic narrative without forcing data panels onto every scene.

**Consequence** — The landing page is an 11-chapter scroll sequence: System Map, Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto. A fixed WebGL stage changes scene as chapters become active; sources open as an optional constellation panel. Planet positions come from NASA/JPL Horizons, Sun imagery from NASA SDO, Earth keeps NASA/NOAA Solar Sentinel layers, and partner-agency links are explicitly mission context until their data is ingested.

## 2026-07-18 — Direct the experience as separate cinematic scenes

**Decision** — Model Solar Sentinel as named scenes rather than one continuously overloaded 3D scene: System Map, Sun Observatory, Earth Shield, SDO Observer, and selected Planet Detail.

**Why** — Each subject needs its own composition, camera, data layers, and visual pacing. A scene director also makes the learning journey feel intentional, like moving between levels in a realtime experience.

**Consequence** — Story navigation changes the active scene through a brief reduced-motion-aware warp/fade. The system map opens the Sun scene; Sun proceeds to the Earth/wind scene; selecting a planet opens its detail-scene instance. New science missions can add a scene without destabilising existing compositions.

## 2026-07-18 — Treat the overview as a composed orbital map

**Decision** — Preserve each planet’s current NASA/JPL direction, but map astronomical distance logarithmically into a bounded cinematic system view and enlarge display radii for interaction.

**Why** — Literal AU distance and diameter ratios made planets nearly invisible and pushed outer orbits off-screen, defeating the overview’s learning and visual purpose.

**Consequence** — The system map is visibly labelled as a visual scale. The Sun has an emissive base beneath its latest SDO image so a failed/dark image never produces a black hole in the composition; this does not alter the provenance of the SDO layer.

## 2026-07-18 — Prefer a fresh, reliable ephemeris snapshot to an unstable visual cache

**Decision** — Fetch the small JPL Horizons body set sequentially without framework-level response caching, then retain the last successful complete snapshot in the server process as the fallback.

**Why** — The parallel/cached route could preserve an unavailable result even when JPL was available, leaving the opening map without current body positions.

**Consequence** — Initial position loading can take a few seconds, but only an all-body, current result is labelled `LIVE`; a complete last-good snapshot is labelled `CACHED`; otherwise the map uses its labelled reference-orbit fallback.

## 2026-07-18 — Keep the system overview clean and reveal moons only in detail

**Decision** — The opening solar-system scene contains the Sun, eight planets, orbital guides, and the SDO observer. Transparent labels are optional; Moon systems appear only after opening a planet detail view.

**Why** — The overview needs to communicate a readable Sun-to-planet composition first. Always-visible Moon icons and labels make that visual hierarchy noisy, especially around Earth.

**Consequence** — Current positions continue to come from NASA/JPL Horizons. Planet close views load one source-linked NASA mission image on demand and use an explicitly illustrative scale and major-moon arrangement. Sun and Earth retain their richer, live space-weather field views.

## 2026-07-18 — Separate mission context from live data

**Decision** — NASA, ESA, JAXA, and ISRO mission pages are exposed as provenance/context links, while only data the product actually fetches is labelled as live or cached.

**Why** — International mission context gives learners a richer path into planetary science, but it must not make archival imagery or mission background appear to be current telemetry.

**Consequence** — The source drawer identifies NASA Image Library close-ups as contextual mission imagery and labels ESA Venus Express/Mars Express, JAXA Akatsuki, and ISRO Mars Orbiter links as mission context.

## 2026-07-18 — Begin with a live system overview and reveal detail on selection

**Decision** — Open Solar Sentinel in a drag-to-explore solar-system map, then let students select an object to centre it, inspect primary-source context, and enter a richer Sun–Earth field view.

**Why** — A wide view gives students a sense of relative position and invites curiosity; progressive level of detail keeps the experience visual instead of turning it into a dense dashboard.

**Consequence** — NASA/JPL Horizons supplies current planet and Moon vectors through `/api/solar-system`. Planet sizes, orbit guides, Moon separation, time acceleration, and SDO’s animated Earth-orbit path are labelled visual explanations rather than a live, to-scale orbital simulation. Object cards link to the relevant NASA/JPL source.

## 2026-07-18 — Load selected-object imagery from the source, on demand

**Decision** — Fetch one NASA Image and Video Library result only after a learner selects a planet or Moon; keep the latest SDO image as the Sun/SDO card media.

**Why** — Real reference imagery increases curiosity and trust, but loading a gallery would slow the opening system view and clutter the screen.

**Consequence** — `/api/celestial-media/[target]` accepts only known celestial targets, validates the NASA asset host, caches results, and links each image back to its NASA archive page.

## 2026-07-18 — Use the Code MCP graph before broad source reads

**Decision** — Index Solar Sentinel in Codebase Memory and make graph-first discovery the default for structural code questions.

**Why** — Relationship queries can identify symbols, dependencies, and impact with much less context than repeatedly loading broad file trees or source files.

**Consequence** — The `solar-sentinel` graph is persisted in `.codebase-memory/graph.db.zst`. Future implementation work should use graph search and call traces first, falling back to targeted text search only for literal content, unindexed material, or graph misses.

## 2026-07-18 — Build a visual Sun-to-Earth story, not a data dashboard

**Decision** — Keep persistent text sparse and use a cinematic 3D journey, subtle telemetry, and on-demand controls to tell the story.

**Why** — The product needs an immediate emotional “wow” moment while remaining legible enough for learning; crowded scientific panels weaken that experience.

**Consequence** — The core flow is Sun, spacecraft, solar wind, Earth, scenario, explainer, replay, and provenance. Detail lives in the Mission console and source drawer.

## 2026-07-18 — Preserve three visible truth layers

**Decision** — Keep `LIVE OBSERVED`, `NOAA FORECAST`, and `SOLAR SENTINEL SCENARIO` separate in both UI and generated explanations.

**Why** — A beautiful simulation cannot be allowed to appear to be an operational forecast or a physical model.

**Consequence** — Scenarios have a permanent educational disclaimer; GPT receives only validated context and must return Observed, Official forecast, Scenario, and Uncertainty separately.

## 2026-07-18 — Turn Solar Sentinel into a student and teacher experience

**Decision** — Ship one live Solar Weather mission with Student and Teacher modes, using the same evidence but different learning prompts.

**Why** — This gives the project a clearer Education-track value proposition and makes the interface useful for a five-minute classroom activity as well as individual exploration.

**Consequence** — `src/lib/space-missions.ts` defines a small reusable source-first mission contract; no unbuilt future missions are presented as product features.

## 2026-07-18 — Make global city selection spatially truthful

**Decision** — Use a geographic Earth surface and latitude/longitude beacon; rotate the Earth’s surface to present the selected city while leaving the magnetic shield Sun-facing.

**Why** — A location should change the scene in a real, understandable way instead of only changing a text label.

**Consequence** — Global city search feeds a tested geographic placement utility. The base map is a NASA Blue Marble visual reference, not live Earth imagery; local aurora visibility is never claimed.

## 2026-07-18 — Use GPT only as a source-grounded explainer

**Decision** — Use the OpenAI Responses API with schema-constrained output and server-attached provenance; keep a labelled deterministic fallback when no key or model is available.

**Why** — GPT should make evidence understandable, not create measurements, citations, solar-event predictions, or local operational advice.

**Consequence** — The explainer is optional to the live data experience and requests are rate limited. Production deployment requires a server-only `OPENAI_API_KEY`.

## 2026-07-21 — Give every Atlas chapter one consistent inquiry rhythm

**Decision** — Each narrative chapter exposes the same three source-backed actions: **Fun fact**, **Discover**, and **Images**. Hovering previews one compact translucent card; clicking pins that card until the learner closes it. Opening another action always replaces the previous card.

**Why** — This makes the story feel spacious and visual while preserving a predictable path to deeper learning. It also prevents stacked overlays from competing with the planet scene.

**Consequence** — Facts, explanatory copy, and image galleries remain separate but use the same chapter source record. Earth may retain its additional live-signal control because it is a dedicated Solar Sentinel use case, rather than general planet copy.

## 2026-07-21 — Source textures must load before a planet is shown

**Decision** — Detailed planet scenes wait for their mapped source surface instead of substituting a procedural colour texture. Major moons share the reviewed lunar source surface with restrained per-moon colour variation.

**Why** — A temporary or permanent generated sphere reads as a fake planet and undermines the Atlas’s evidence-first premise.

**Consequence** — The detailed-body source texture is the visible surface authority. System lighting includes a subtle cool fill so the Sun-facing shadow still reads as material texture, without eliminating the lighting direction.

## 2026-07-21 — Advance the Atlas in full scene chapters

**Decision** — The Atlas scroll container snaps each 100svh chapter into place, one scene at a time.

**Why** — The learner should experience a deliberate sequence of locations and transitions, not land between two unrelated scenes.

**Consequence** — Wheel, trackpad, keyboard, and progress-button navigation settle on a chapter boundary. Reduced-motion preferences use proximity snapping and remove smooth scrolling.

## 2026-07-21 — Treat Chapter 12 readings as an optional instrument, not a scene overlay

**Decision** — Keep the SDO-to-Earth scene clear by placing Earth signals in a compact, dismissible, non-scrollable glass readout. It opens only through **Earth signals** and remains mutually exclusive with the chapter’s other inquiry cards.

**Why** — The final Sun-to-Earth composition is the learning moment; a large central panel makes it feel like an embedded dashboard and hides the visual explanation.

**Consequence** — The readout exposes only current Kp, solar-wind speed, IMF Bz, freshness state, timestamp, and the NOAA SWPC source. It is positioned in the lower-right safe area and never uses native scrollbars.

## 2026-07-21 — Keep full Earth Signals capability behind compact truth-layer tabs

**Decision** — The Chapter 12 Earth Signals instrument exposes four on-demand layers: **Live observed**, **NOAA forecast**, **Solar Sentinel Scenario**, and **Sources**.

**Why** — Reducing the card to only three numbers removed the educational and evidence-backed capabilities that make Solar Sentinel more than a visual scene.

**Consequence** — Observed alerts and timestamps, the official Kp forecast, the four-level educational scenario, and NASA SDO / NOAA SWPC / NASA DONKI provenance are all available without reintroducing a scrollable or scene-blocking dashboard. Scenario selection changes the Earth-response visual while remaining explicitly non-predictive.

## 2026-07-22 — Begin the Atlas with the same learning rhythm

**Decision** — Chapter 01 now uses the same full left-side chapter composition as the Sun and every other destination: eyebrow, title, short summary, then **Fun fact**, **Discover**, and **Images**. Every Fun Fact card contains one memorable claim plus two short source-linked learning cues.

**Supersedes** — The earlier compact Chapter 01 action-only layout in this decision.

**Why** — The system overview is the learner’s first interaction, so it should not be the sole chapter without a route into the evidence or appear to use a different visual language. One-line facts were also too slight to reward opening a card.

**Consequence** — The system map remains visually dominant behind a familiar chapter frame, while facts behave as compact mini-stories: a claim to remember, a little context, and a primary mission source. The same layout and information density now apply consistently from the system map through the SDO-to-Earth finale.

## 2026-07-22 — Make deployment hygiene explicit

**Decision** — Keep runtime credentials server-only and ignore all environment variants and common private certificate formats, while retaining the empty `.env.example` setup template.

**Why** — Solar Sentinel can use an OpenAI API key in production, so a polished public repository must make the safe path the default and never encourage committing deployment credentials.

**Consequence** — `.env`, `.env.*`, private keys, and local build-tool caches stay out of Git. `OPENAI_API_KEY` is read only in the server-side explainer route; a release audit must still resolve production dependency advisories before a public deployment.

## 2026-07-22 — Keep one canonical release branch

**Decision** — Integrate the reviewed Solar Sentinel work into `main` and remove temporary local feature branches after merge.

**Why** — This is a solo hackathon project; a single canonical branch keeps the demo, submission material, and deployment state unambiguous.

**Consequence** — `main` now includes the security hardening, refreshed README, and project screenshots. Future short-lived work may branch from `main`, but only `main` is retained once reviewed work is integrated.

## 2026-07-22 — Keep ambient sound enabled by default

**Decision** — Sound preference starts enabled and is not changed to off when a browser blocks unmuted autoplay.

**Why** — A browser playback policy is not a learner's preference; showing Sound Off after a blocked autoplay attempt made the experience appear to ignore the chosen default.

**Consequence** — The control begins as **Sound On**, autoplay is attempted, and a press on the control starts playback when the browser requires a user gesture. Only an explicit press while audio is playing turns it off.

## 2026-07-22 — Publish one canonical project snapshot

**Decision** — Squash the current Solar Sentinel repository history into one `main` commit.

**Why** — For this solo hackathon submission, one self-contained project snapshot makes the handoff and deployment state easier to inspect.

**Consequence** — The current files, documentation, screenshots, security hygiene, and visual refinements are retained, while earlier incremental commit history is replaced on the remote through a lease-protected force push.
