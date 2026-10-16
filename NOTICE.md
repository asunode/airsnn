# Notice

## What the MIT License covers

The MIT License in [`LICENSE`](LICENSE) applies to the **source code** of this repository: the HTML, CSS and JavaScript in `site/`, and the structure of the JSON files in `site/data/`.

## What it does not cover: © ASUNODE, all rights reserved

The following are **not** licensed under MIT. They are © ASUNODE, all rights reserved:

- **Images:** everything in `site/img/` and `docs/screens/`. The photographs are AI-generated (concierge portrait, aircraft, helicopter, car, cabin, chalet door) and are fictional.
- **Written content:** the copy on the site, the concierge's scripted answers (`site/data/desk.json`), the sample journey text (`site/data/sample-journey.json`), the README and `docs/design-direction.md`.
- **The AIRSNN name and mark**, and the fictional places Alpina, Alpina International and Valtor as used here.

You may link to, discuss and take screenshots of this project for commentary or review. Please ask before reusing the images, text or name in another product.

## Third-party software, fonts and data

| What | Where | License / terms |
|---|---|---|
| **Geist** (Vercel) | `site/fonts/Geist-Variable.woff2` | SIL Open Font License 1.1, [`site/fonts/licenses/OFL-Geist.txt`](site/fonts/licenses/OFL-Geist.txt) |
| **Instrument Serif** | `site/fonts/instrument-serif-*.woff2` | SIL Open Font License 1.1, [`site/fonts/licenses/OFL-InstrumentSerif.txt`](site/fonts/licenses/OFL-InstrumentSerif.txt) |
| **JetBrains Mono** | `site/fonts/jetbrains-mono-*.woff2` | SIL Open Font License 1.1, [`site/fonts/licenses/OFL-JetBrainsMono.txt`](site/fonts/licenses/OFL-JetBrainsMono.txt) |
| **MapLibre GL JS** 5.24.0 | `site/vendor/maplibre-gl.js`, `.css` | BSD 3-Clause, [`site/vendor/LICENSE.txt`](site/vendor/LICENSE.txt) |
| **Map data** | loaded at runtime from OpenFreeMap | © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL), © [OpenMapTiles](https://www.openmaptiles.org/), served by [OpenFreeMap](https://openfreemap.org) |
| **Terrain (elevation)** | loaded at runtime from AWS Open Data Terrain Tiles | Mapzen / Tilezen Terrain Tiles; sources and required notices in the [Tilezen attribution list](https://github.com/tilezen/joerd/blob/master/docs/attribution.md) |
| **Weather and sunset** | loaded at runtime from Open-Meteo | [Open-Meteo](https://open-meteo.com), data under CC BY 4.0 |

### Where attribution is shown on the site

- **On the map:** a small credit line ("OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors · Terrain: Mapzen") stays in the corner whenever the map is the scene (the route and the closing).
- **In the footer:** map, terrain and weather sources are credited on every page view.
