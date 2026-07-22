# Solar System Atlas — Story Contract

The landing experience is a vertical, full-screen story. Scrolling advances a fixed WebGL stage between named scenes; it does not expose a dashboard by default.

| Chapter | Scene | Learner sees | Evidence on demand |
|---:|---|---|---|
| 01 | System Map | A close, full-bleed solar-system layout; object labels are visible on entry and remain toggleable | NASA/JPL Horizons; NASA, ESA, JAXA/ISAS, ISRO program gateways |
| 02 | Sun | Latest available NASA SDO solar texture, without Earth-response effects | NASA SDO, ESA Solar Orbiter, JAXA/NAOJ Hinode, ISRO Aditya-L1 |
| 03–04 | Mercury / Venus | Individual close-up scenes | NASA/JPL/USGS surface mosaics; NASA MESSENGER/Magellan; ESA BepiColombo/Venus Express; JAXA Mio/Akatsuki; documented Venera archive contribution |
| 05 | Earth | A quiet, source-linked Earth detail scene | NASA Blue Marble and relevant international Earth-observation context |
| 06 | Mars | Individual close-up scene | NASA/JPL/USGS Viking mosaic; ESA Mars Express; ISRO Mars Orbiter Mission; UAE/MBRSC Hope |
| 07–10 | Jupiter through Neptune | One close-up scene per planet | NASA Juno/Voyager, ESA JUICE, NASA/ESA/ASI Cassini–Huygens, JPL map-reference limitations |
| 11 | Pluto | Kuiper Belt close-up | NASA New Horizons, JPL historical visual-reference limitation |
| 12 | SDO → Earth | Final observer-to-Earth response scene; solar-wind and aurora effects appear only here | Latest NASA SDO image, NASA SDO MOC, NOAA SWPC observations and official forecast products |

## Visual rules

- The scene gets the screen; one short line of text is enough.
- `DISCOVER` opens the chapter description, one short quick fact, and its primary source. `IMAGES` opens the source archive. Both are optional floating controls, never a permanent data wall.
- Each chapter offers one exclusive overlay at a time: `DISCOVER`, `IMAGES`, or (only in the final scene) `EARTH SIGNALS`. Opening one closes the others, so provenance and explanation never overlap.
- Every overlay has the same visible close action; a source-image detail can return directly to its gallery. Object and Moon labels lead with their name and use minimal leader-line decoration rather than redundant category text.
- `ARCHIVE` is a compact floating gallery. It combines reviewed source-page previews with an on-demand chronological local research archive when one exists for the active body. Every supplied local item preserves its catalogued source, title, year, caption, and original link; an archival host is shown as such rather than implied to be a live agency feed.
- `LIVE` is reserved for current SDO, NOAA, and JPL Horizons data. Archival mission imagery and external mission links are labelled as imagery or context.
- A `SURFACE MOSAIC` is a source-derived map treatment, not a live image; a `VISUAL REFERENCE` is never a measurement. The source drawer exposes this difference in the scene.
- WebGL scenes use illustrative scale and motion. The origin and limits of every source are available through the chapter source panel.

## Future connectors

The atlas is designed for additional public source adapters, not indiscriminate link lists. Add a space-agency connector only when the product can preserve its source URL, timestamp or archival state, data type, and usage limitations.
