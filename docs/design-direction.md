# AIRSNN design direction (2026-10-16)

*English translation of the working design document. The original was written in Turkish.*

Sources: an analysis of five reference sites (onyx, Sibal, studiors, 11moissanstoit, NexDash) and an earlier hero experiment. The synthesis was worked out together with the client. This document contains no code; it is the direction decided before building.

---

## Quality bar

**Client's verdict (16 October 2026):** Prototype v2 is the **lowest acceptable level**. Every design from here on must be above it.

**Reference:** prototype v2 (the `site/` folder of this repository) and its screenshots at 1440 and 390 px.

**Rule:** Whenever a new scene or page is built, it is compared side by side with the screenshot of the closest scene in prototype v2, at the same widths (1440 and 390 px). The new work may not be weaker in any respect: craft, depth, typography, motion, legibility, visual coherence. If it falls behind in one respect, it is not finished.

### The floor to keep (what makes prototype v2 strong)

1. **One evening, one world.** The desk, the map, the fleet and the closing all happen in the same blue hour; the only warm light is amber. Photos don't look pasted on: their edges melt into the navy, and their tone is pulled towards evening when needed.
2. **A map spine with depth.** The overview has a tilted camera, exaggerated 3D Alps and one bright route arc flying over the mountains; at the close stops the camera drops and the terrain returns to true scale.
3. **Two-voice typography.** A tight grotesk headline with a thin italic serif second line, used large and with confidence. The concierge's answer becomes the headline of the scene.
4. **Every number explains itself.** Luggage-tag cards show two clocks side by side; panels come with a big figure, a label and a sentence of context. "Sample journey, not live" is shown honestly everywhere.
5. **Measured legibility.** Smallest text 12 px, body text 15–16 px. Lowest contrast on navy 5.47:1. Muted text is made with measurable colours, not opacity.
6. **Motion that means something.** The camera changes scale, the background colour moves the time of day forward, the closing rows turn "Delivered" one by one. No decorative motion. `prefers-reduced-motion` is fully supported.
7. **Mobile thought through on its own.** The route rail becomes a row of chips, cards become a bottom drawer, and at the closing the map sits in the strip above the rows. Nothing overlaps. Performance: mobile LCP 788 ms, CLS 0.

### Targets to beat (where prototype v2 is still weak)

1. **Image resolution and authenticity.** Images are at most 1672 px wide, so the full-screen jet and cabin scenes look soft on retina screens. The fleet images have model errors and made-up badges. Three different jet types are used.
2. **The route at close stops.** The route line draped on the terrain is wavy in places. The clean arc of the overview has not been carried over to the close stops.
3. **Map-to-photo transition.** Map → jet → cabin is a plain crossfade; the change of scale doesn't yet feel like "the same camera moving closer".
4. **Empty areas inside scenes.** On mobile, the bottom of the overview and the closing stays dark and empty. On desktop, the left half of the map says little at the stops.
5. **Liveliness.** The concierge is a still photo, so the desk looks static at first glance. The idle-loop video (V2) doesn't exist yet.

---

## Image production notes

- Images are generated with one style anchor: **"a February evening, blue hour, Alpina"**. Images made with this anchor come out consistent with each other. New images should use the same anchor.
- AI image tools cannot draw specific aircraft and helicopter models correctly (the "PC-24" in prototype v2 is not a real PC-24). Fleet cards should use a class name instead of a model name ("Light jet", "Twin-engine helicopter"). If a model name stays, a real photo must replace the image before launch.
- The image tool stops at 1672 px wide. Keep this limit in mind for full-screen images: use tighter framing, a light blur or overlays to hide the softness, or find a higher-resolution source.

---

## 1. The idea

The AIRSNN site is not a page; it is a place and a journey. The visitor comes in through the door of the lounge at Alpina International, is met by a concierge desk and is asked what they would like. Behind the desk, in the background of the page, a dark map of Alpina stays fixed: the whole journey, from Geneva to the chalet, plays out on this map as one plan coordinated by one team. In front, a person greets you (clearly an AI concierge); behind, a flawless system coordinates everything. The site doesn't say this, it shows it, and it doesn't hide that the journey it shows is an example.

---

## 2. Design principles

| # | Principle | Learned from |
|---|---|---|
| 1 | **A threshold is an event, but only once:** entering or leaving feels like a small ceremony; the entrance is shown on the first visit only. | onyx, Sibal, 11moissanstoit, NexDash |
| 2 | **The place is the menu:** navigation happens through a desk and a route, not a list of pages. | onyx, 11moissanstoit |
| 3 | **Motion tells:** every movement carries information; the camera moving in = the scale changing, the background changing = time moving on. | 11moissanstoit, NexDash, studiors |
| 4 | **Zooming in on scale:** the story moves from the whole to the detail and the visitor is never lost: Alps → route → jet → cabin. | NexDash |
| 5 | **Time is an axis:** scrolling moves the journey's clock and the daylight forward; every stop shows two clocks side by side. | 11moissanstoit, studiors |
| 6 | **Every number explains itself:** a big figure, a monospace label and a sentence of context come together. | NexDash |
| 7 | **One colour, one job:** an almost colourless site; the single accent (runway amber) only ever means "live / action". | Sibal, NexDash, onyx |
| 8 | **Authenticity beats decoration, but it must be honest:** real clock, real weather, real photos; simulated data is clearly labelled "sample". | 11moissanstoit, NexDash |
| 9 | **Intent, not pages:** buttons state the visitor's intent ("Plan a journey"), not section names. | onyx |
| 10 | **Two voices:** a calm, strong grotesk next to a thin italic serif; AIRSNN's quiet luxury comes from this pairing. | studiors |
| 11 | **Memory is a courtesy:** the site remembers where the visitor left off and opens there. | 11moissanstoit |
| 12 | **Hand over the wheel at the end:** after the long show, the visitor is invited to build their own journey. | NexDash |

---

## 3. Site map and visitor flow

One page, one place. The map is the shared ground of every section. Each stop has its own address (hash), so it can be shared and remembered.

```
/                       Door (first visit) → Desk
/#desk                  Concierge desk
/#route/geneva          Stop 1  Geneva (departure)
/#route/alpina          Stop 2  Alpina International
/#route/valtor          Stop 3  Valtor heliport
/#route/chalet          Stop 4  Chalet
/#how                   How it works (noon → blue hour → night)
/#fleet                 Fleet and photos
/#arrival               Closing ("Journey complete")
/#plan                  Plan your own (request form)
```

**Flow (first visit):**

1. **Door.** The lounge glass is fogged; the AIRSNN mark and "Enter the lounge". On click (or by itself after 4 s) the glass melts. Total ≤ 2.5 s. `localStorage.intro_seen = 1`.
2. **Desk.** The concierge (labelled as AI) says "Good evening. Where would you like to be tonight?" Top right: the live Alpina clock and weather. Below: three intent buttons and a chat box.
3. **Choice:**
   - "Show me the route" → goes down to Stop 1 and the sample journey begins.
   - "Plan a journey" → straight to `#plan`.
   - "Speak with the desk" → the chat box gets focus; scripted answers.
   - Scrolling without pressing anything → same as "Show me the route".
4. **Route.** As you scroll, the camera moves stop by stop (Geneva → Alpina → Valtor → Chalet). The route rail on the left acts as the menu; clicking a stop flies there.
5. **How it works.** Pinned sections; the background turns from noon to night; a step diagram.
6. **Fleet and photos.** A muted grid; opening an item shows full colour and its record.
7. **Closing.** The journey steps turn "delivered" one by one → "Journey complete. Welcome to Alpina."
8. **Plan your own.** The request form, in the same voice as the desk and the concierge.

**Flow (returning visit):** The door is skipped. The site opens at the stop saved in `last_stop` and shows a small strip: "Your route, where you left it · Valtor heliport" + "Start from the desk". Without `last_stop`, it opens at the desk.

**Back from anywhere:** The AIRSNN mark at the top left and Esc → desk. Home is always the desk.

---

## 4. Scenes

### 4.1 Door (lounge entrance)

- **Purpose:** turn entering a site into entering a place; once only, and short.
- **Content:** a blurred lounge image (V1) behind fogged glass, the AIRSNN mark in the middle, a thin italic "Private journeys to Alpina" below it, one button "Enter the lounge". A small "Skip" link.
- **Interaction:** click, the Enter key or a 4 s wait opens it. Scrolling also opens it.
- **Motion:** glass blur `blur(24px) → 0`, opacity `1 → 0`, 1.2 s, `--ease-out`. The desk image behind goes from 104% to 100% scale. The mark fades 0.4 s earlier. With `prefers-reduced-motion`: a single 0.3 s crossfade.

### 4.2 Concierge desk (the front)

- **Purpose:** a person at the front. Take the visitor's intent and lead them to the right place.
- **Content:**
  - The concierge in the middle (image P1; idle loop V2 in a later phase). Next to it a fixed label: "AIRSNN Desk · AI concierge". The label is always visible; it cannot be hidden.
  - A big headline area: the concierge's sentence is written here (not a speech bubble, but the headline of the scene).
  - Three intent buttons: "Plan a journey", "Show me the route", "Speak with the desk".
  - Chat box: "Ask the desk anything…". A small note below: "Scripted answers for now. A person replies to every request."
  - Top right: "Alpina · 18:42 · −4 °C · light snow" (live) and the visitor's own time.
- **Interaction:**
  - In the first phase the chat is scripted: 10–15 key intents (land before dark, skis, pets, weather, price, how long, helicopter, chalet, privacy…) are answered by keyword matching. No match: "I'll pass that to the desk team. Shall I start a request?" → `#plan`.
  - The answer is written into the headline area word by word (30 ms per word), not letter by letter. If the answer mentions a place ("Valtor"), a "Show me" link appears below it and the map flies to that stop.
  - Built behind an `answer(question) → {text, action}` interface; in phase 2 the same interface is connected to a local AI.
- **Motion:** desk elements arrive in sequence (80 ms apart, `fadeUp` 12 px, 0.5 s). A runway light slides across "Plan a journey" once a minute (the only decorative motion). While the desk is open the map behind is 70% darkened and blurred 8 px.

### 4.3 Route (the spine)

- **Purpose:** show the system behind: one plan, one team, one unbroken journey.
- **Content:**
  - A fixed, dark Alpina map (behind the page, `position: fixed`).
  - A route rail on the left edge = the menu: `01 Geneva · 02 Alpina International · 03 Valtor heliport · 04 Chalet`. The active stop is an amber dot.
  - A **luggage-tag card** at every stop: stop name, altitude, vehicle, two clocks ("17:05 Alpina · 16:05 your time"), one sentence of context.
  - A fixed label at the start of the section and on every card: "Sample journey · not live".
- **Camera sequence (driven by scrolling):**

  | Step | Camera | Card |
  |---|---|---|
  | 0 | The whole Alps (zoom ~6), slight tilt | "Geneva to the chalet door, held by one desk." |
  | 1 | Geneva (zoom ~11) | Jet · stand 3 · "Wheels up 16:20 · slot confirmed" |
  | 2 | Along the route, the dashed line filling in | "41 min · cruise 31,000 ft" |
  | 3 | Alpina International (zoom ~13) | "Landed 17:01 · 1,040 m · helicopter on stand" |
  | 4 | Valtor heliport (zoom ~14, pitch 55°) | "Ridge wind 8 kt · cleared · 11 min" |
  | 5 | Chalet (zoom ~15) | "Car 3 at the door · fire lit" |
  | 6 | From the map to the jet (image J1), then into the cabin (K1) | End of the scale: "The cabin, ready before you are." |

- **Interaction:** scrolling moves forward; clicking a stop on the rail jumps there with `flyTo` and syncs the scroll position. Keyboard: ↑/↓ and J/K change stops. The map can't be dragged on its own (it must not steal the scroll). Arriving at each stop updates `localStorage.last_stop`.
- **Motion:** `flyTo` between stops, 1.6–2.4 s (by distance), MapLibre's curve. The route line fills via `line-dasharray` plus progress. Card entrance 0.45 s. Clock digits roll when they change. Map → jet → cabin: the map darkens, J1 crossfades in over 0.8 s and moves from 100% to 130% with scrolling; K1 follows the same way. With `prefers-reduced-motion`: `jumpTo` instead of `flyTo`, 0.2 s crossfade.

### 4.4 Panels (over the route)

- **Purpose:** show the system working through numbers, while keeping them readable.
- **Content:** at most 3 panels per stop. Each panel: a big figure (mono), a small uppercase label, one sentence of context. Example:
  ```
  8 kt
  RIDGE WIND · VALTOR
  Calm enough to land on the ridge. Pilot cleared at 16:48.
  ```
- **Rule:** a number without a sentence doesn't go on a panel. Status words: `READY` (amber dot), `WAITING` (mist-coloured ring), `DELIVERED` (solid amber). No other status colours.
- **Motion:** panel from 12 px above, 0.45 s; the figure counts up in 0.6 s (first view only).

### 4.5 How it works

- **Purpose:** unfold the promise "a person in front, a system behind" step by step.
- **Content:** a pinned (sticky) section with 4 steps: `Ask → Plan → Hold → Deliver`. Each step title uses the two voices: "ASK / in one sentence.", "PLAN / runway to ridge.", "HOLD / every moving part.", "DELIVER / at the door."
- **Background:** daylight step by step: noon (snow white `--snow`) → afternoon → blue hour → night. The map is hidden in this section; the background colour alone carries the scene.
- **Step diagram:** a horizontal four-node diagram. Hovering a node (tapping on mobile) opens a panel below showing, in three columns, who is doing what in the background at that moment:

  | | Flight desk | Mountain ops | Ground |
  |---|---|---|---|
  | Plan | "Slot requested 16:20" | "Ridge forecast pulled" | "Car 3 booked, chains fitted" |
  | Hold | "Slot moved to 16:20" | "Helicopter de-iced 15:35" | "Chalet heating on" |

  Rows drop in one at a time like log entries, but calmly: 120 ms apart, no effects.
- **Interaction:** arrow keys move between nodes; a "Step 02 / 04" counter.
- **Motion:** the background colour changes with scrolling via `color-mix` (native scroll-driven animation, JS `--p` as a fallback). Titles open with a `clip-path` curtain, 0.7 s.

### 4.6 Fleet and photos

- **Purpose:** authenticity: real vehicles, real places; every image is a journey record.
- **Content:** a grid (3 columns on desktop, 2 on mobile). Images are muted and blue-tinted in the grid. Categories: Jet, Helicopter, Car, Chalet, Mountain.
- **Interaction:** on hover the tint lifts by 50%. On click, a lightbox: full colour, with a mono record line below: `ALT 1,460 m · 16:52 · VALTOR → RIDGE · −6 °C · FR.004 / 18`. Esc and ←/→ to navigate.
- **Motion:** tint transition on `filter`, 0.5 s. The lightbox grows from the image's own position (FLIP), 0.55 s.

### 4.7 Closing

- **Purpose:** end the show with a warm ceremony and hand the wheel to the visitor.
- **Content:** night background, the map visible again and focused on the chalet. Journey rows:
  ```
  Jet          landed         17:01   DELIVERED
  Helicopter   on the ridge   17:24   DELIVERED
  Car          at the door    17:41   DELIVERED
  ```
  Then a big headline: "Journey complete. *Welcome to Alpina.*" Below: "Sample journey. Yours will have its own times." and a single button, "Plan your own".
- **Motion:** while scrolling, the rows turn `WAITING → DELIVERED` one by one. After the last row the headline opens with a curtain in 0.9 s. The map camera slowly pulls back to the whole Alps (back to where the journey began).

### 4.8 Plan your own

- **Purpose:** take the request.
- **Content:** a short 3-step form: (1) from where, when, how many people; (2) special requests (skis, pets, arrival time); (3) contact. Above it: "A person from the desk replies within the hour." Same voice as the desk.
- **Interaction:** steps slide in from the side; a "01 / 03" counter. In phase 1 the request goes to an email service (e.g. Web3Forms) or a `mailto` fallback.

---

## 5. Visual language

### 5.1 Typography

| Role | Font | Fallback | Use |
|---|---|---|---|
| Grotesk (headlines, UI) | **Neue Montreal** (Pangram Pangram, paid) | **Geist** (free, OFL) → `system-ui` | Headlines 400–500, tight (`letter-spacing: -0.02em`); UI 400 |
| Thin italic serif (accent) | **Instrument Serif Italic** | Cormorant Garamond Italic 300 → `Georgia` | The second line of headlines, the concierge's sentences |
| Monospace (numbers, labels) | **JetBrains Mono** | IBM Plex Mono → `ui-monospace` | Clocks, panels, record lines, `font-variant-numeric: tabular-nums` |

- Until the licensing decision, the default set is **Geist + Instrument Serif + JetBrains Mono** (all three free). All self-hosted as `woff2`, `font-display: swap`, with metric-matched fallbacks (`size-adjust`, `ascent-override`), following the CLS fix from the earlier hero experiment.
- Scale with `clamp()`. Display `clamp(2.75rem, 6vw, 6.5rem)`, subheads `clamp(1.5rem, 2.4vw, 2.25rem)`, body `1rem/1.55`, labels `0.75rem`, uppercase, `letter-spacing: 0.08em`.

### 5.2 Colour

| Token | Value | Job |
|---|---|---|
| `--night` | `#0a1020` | Night background, map background |
| `--night-2` | `#121a2c` | Panel background (under glass) |
| `--ink` | `#13203a` | Text on light backgrounds |
| `--ice` | `#e3ebf7` | Text on dark backgrounds |
| `--mist` | `#a9bad6` | Secondary text, labels, `WAITING` |
| `--slate` | `#58657d` | Secondary text on light backgrounds |
| `--snow` | `#eef2f6` | Noon background (cool, not cream) |
| `--dusk` | `#2a3a5e` | Blue-hour background |
| `--amber` | `#f5b469` | **The only accent: live / action / READY / DELIVERED** |
| `--amber-deep` | `#b8732a` | Amber on light backgrounds (for contrast) |

- Amber appears only in: the primary button, the live clock dot, the active stop, `READY`/`DELIVERED`, the moving tip of the route line. Nowhere else.
- Map: sea/ground `--night`, borders `--mist` at 20%, labels `--mist` at 60%, route `--ice`, moving tip `--amber`.
- Contrast: text at least WCAG AA (4.5:1). `--mist` on `--night` is above 8:1, no problem.

### 5.3 Glass and layers

Fixed layer order, back to front:

```
0  Map (fixed)                          z: 0
1  Map darkening / background colour    z: 1
2  Image scenes (jet, cabin, photos)    z: 2
3  Glass panels and cards               z: 10
4  Route rail, top bar, clock           z: 20
5  Lightbox / chat layer                z: 30
6  Door (first visit only)              z: 40
```

- **Glass:** `background: rgb(18 26 44 / 0.55)`; `backdrop-filter: blur(16px) saturate(120%)`; border `1px solid rgb(227 235 247 / 0.10)`; radius `14px`. On light backgrounds `rgb(238 242 246 / 0.65)`.
- `backdrop-filter` on at most 4 panels on screen at once. Browsers without support get an opaque `--night-2`.
- No shadows; depth comes from blur and tone.
- Grain: a single `SVG feTurbulence` layer over the whole page, opacity 0.04.

### 5.4 Motion

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(.16, 1, .3, 1)` | Entrances, panel and card openings (shared by four of the five references) |
| `--ease-inout` | `cubic-bezier(.65, 0, .35, 1)` | Scene changes, background transitions |
| `--ease-soft` | `cubic-bezier(.22, 1, .36, 1)` | Glass melting, blur |

| Duration | Value | Use |
|---|---|---|
| `--t-fast` | 200 ms | Hover, focus |
| `--t-base` | 450 ms | Panel, card and button states |
| `--t-slow` | 900 ms | Headline curtain, lightbox |
| `--t-scene` | 1200 ms | Door, scene change |
| Camera | 1600–2400 ms | `flyTo` (MapLibre curve) |
| Stagger | 80 ms | Consecutive items in a group |

- No bouncy easing. No glitch, jitter or cursor-following.
- `prefers-reduced-motion`: camera `jumpTo`, pinned sections fall back to normal flow, log rows appear at once, every transition ≤ 200 ms opacity. (The "scroll-linked animation keeps running" bug found in the earlier hero experiment goes on the checklist.)

---

## 6. Technical approach

- **Base:** plain HTML/CSS/ES modules, no framework. Vite for packaging (build only; the output is static).
- **Map:** **MapLibre GL JS** (v5; no `globe` needed, Mercator is enough). Camera via `flyTo`/`easeTo`, the route as a `line` layer, stops as a `symbol` layer.
- **Tile source:** **OpenFreeMap** vector tiles (free, no key). Our own style file: dark, almost colourless, only borders, water, contour lines and a few place names. For relief, **hillshade** from Mapzen/AWS Terrain Tiles (`terrarium`, free) at very low opacity. Fallback: MapTiler (with a key) only if needed.
  - Alpina International, Valtor and the Chalet are fictional: they are placed at chosen fixed coordinates on the real Alps, and their names come from our own `symbol` layer. To avoid clashing with real names, the real settlement labels in that area are hidden in the style. (Coordinates were an open decision; see §9.)
- **Plain JS for:**
  - Door, desk, intent buttons, chat (scripted `answer()`), clocks (`Intl.DateTimeFormat`, `timeZone: 'Europe/Zurich'`).
  - Scroll ↔ stop mapping: `IntersectionObserver` plus a single `requestAnimationFrame` loop; no Lenis (native scrolling).
  - Background transition: native `animation-timeline: view()`, JS `--p` fallback.
  - Panels, log rows, closing rows, lightbox, form steps.
  - Memory: `localStorage` (`intro_seen`, `last_stop`); every access in `try/catch`.
- **Live data (two things only):** the clock (client) and the weather (**open-meteo**, no key; 15-minute cache; on error the weather line is hidden, never invented). Weather is fetched for the chosen Alpina coordinate and labelled "Alpina weather".
- **Sample journey data:** `data/sample-journey.json` (stops, times, panel sentences, team logs). The interface prints the "Sample journey" label everywhere from the `sample: true` field in this file.
- **Load order:**
  1. First paint: HTML + critical CSS + door/desk image (AVIF/WebP) + fonts. Target LCP < 1.5 s (mobile 4G).
  2. After the desk is visible, when idle (`requestIdleCallback`): MapLibre (~250 KB gzip) and the style.
  3. On first need: lightbox code and large photos (`loading="lazy"`), jet/cabin scene images (via `IntersectionObserver` with `rootMargin: 100%` as the route section approaches), the V2 idle video (phase 2).
  4. Never loaded: WebGL effects, physics engines, sound.
- **Accessibility:** the route rail is a real `<nav>` with links; the map is `aria-hidden` and the same information is in the cards as text. The chat is `aria-live="polite"`. Every interaction works with the keyboard.
- **Mobile:** map in the top 55%, cards in a fixed bottom drawer. The route rail becomes a horizontal row of chips at the top. The step diagram works by tapping; its panel opens below.

---

## 7. Images and video needed

All in one visual language: cold, quiet, mostly blue hour; the only warm light is amber lamps. A human face only in P1. All at least 2400 px wide (the earlier hero experiment stayed soft at 1672 px). Source files kept separately; web copies AVIF + WebP at 800/1400/2400.

| Code | What | Brief | Use |
|---|---|---|---|
| **L1** | Lounge glass (door) | The private terminal lounge at Alpina International, looking out through the glass; the glass lightly fogged, runway lights and a snowy mountain silhouette outside at blue hour. No people. 16:9 and 9:16. | Door background |
| **P1** | Concierge | A concierge at the desk, looking at the camera with a calm smile; a dark navy suit, simple. Behind: a blurred lounge and the runway through the glass. Chest up, centred, with room for text at the sides. Clearly stated as AI-generated. Separate 16:9 and 9:16 crops. | Desk |
| **V2** *(phase 2)* | Concierge idle loop | Same framing as P1, 6–8 s: breathing, blinking, a slight head movement; start and end match so it loops. No sound. | Desk (liveliness) |
| **J1** | Jet, stand 3 | A higher-resolution version (≥ 3000 px) of the existing blue-hour jet image + **a clean transparent mask of the jet** (separate PNG). | Map → jet transition |
| **K1** | Cabin interior | A private jet cabin, two seats, a cup on the table and a journey card the size of a business card; through the window, a wingtip light at blue hour. No people. | End of the scale |
| **G1–G4** | Stop photos | (1) Geneva apron at night, jet stairs; (2) Alpina runway, helicopter stand; (3) Valtor heliport on the ridge, windsock, dusk; (4) chalet door, a car waiting, firelight inside. All the same time of day and colour. | Stop cards, fleet grid |
| **F1–F6** | Fleet | Jet exterior (side profile), helicopter (on the ridge), car (on a snowy road, with chains), cabin detail, ski case loading, chalet interior. Each delivered with its record details (altitude, time, route, temperature). | Fleet grid, lightbox |
| **D1–D4** | Daylight backgrounds | The same snowy ridge, same framing, four times of day: noon, afternoon, blue hour, night. Used very faintly, little detail. | "How it works" background (optional; flat colour also works) |
| **M1** | AIRSNN mark | SVG from the existing logo files, single colour (`--ice` and `--ink`). Not 3D. | Door, top bar, favicon |

---

## 8. What we won't do

- A 3D logo or a spinning brand object.
- Physics-driven letters, breaking or draggable type.
- Boot logs, "system starting" messages, percentage rings.
- Interface sounds, ambient sound, beeps.
- A talking avatar, TTS, lip sync, microphone → after phase 2.
- Glitch, RGB shift, neon colours, cursor-following light, custom cursors.
- 360° tours.
- A second accent colour; green/red status colours.
- Fake data played back as if live; a "LIVE" label only on the clock and the weather.
- Smooth scrolling that hijacks the scroll (Lenis), or a map that steals the scroll.
- Long pinned scenes like 330vh; no pinned section exceeds 220vh.
- Embedded iframe demos, external chat widgets, tracking that needs an analytics cookie banner.
- "Tech product" ornaments like a compass strip or a distance counter (lesson from the earlier hero experiment).

---

## 9. Phases

### Phase 1: a launch-ready core

- Door (first visit), desk, three intent buttons, scripted chat (through the `answer()` interface).
- AI label, live Alpina clock + visitor clock, open-meteo weather.
- MapLibre + OpenFreeMap + our own dark style; a 4-stop route, the route rail as menu, the `flyTo` camera sequence, luggage-tag cards, two clocks.
- Panels (≤ 3 per stop, each with a sentence).
- Map → jet → cabin transition (J1, K1 as still images).
- "How it works": 4 steps, background transition, three team columns on hover.
- Fleet grid + lightbox.
- Closing ceremony + 3-step "Plan your own" form (email / `mailto`).
- "Sample journey" labels, `last_stop` memory, `prefers-reduced-motion`, keyboard, mobile layout.
- Images: L1, P1, J1 (+ mask), K1, G1–G4, F1–F6, M1.
- Criteria: mobile LCP < 1.5 s, CLS < 0.05, clean console; tested in Chrome, Firefox and Safari.

### Phase 2: liveliness

- V2 idle video.
- Connect the chat to a local AI (same `answer()` interface; answers still labelled "AI").
- The visitor's own route: inputs from "Plan your own" drawn on the map as a draft route.
- Short looping videos for stop photos (runway lights, windsock).

### Phase 3 and beyond

- Talking avatar (TTS + lip sync), spoken questions.
- If real operations data arrives: real, approved and delayed journey records instead of "sample".
- Multiple languages (EN/FR/DE/TR).

### Open decisions (before starting phase 1)

1. Map coordinates for Alpina International, Valtor and the Chalet (the weather is also fetched from here).
2. Grotesk licence: Neue Montreal, or the free Geist.
3. Who/what produces the concierge image (P1), and whether the concierge gets a name.
4. Where the form submissions go (email address / service).

---

## Demo assumptions (not binding)

The goal of this phase is to see the design. The following are temporary choices for the demo, made by looking at airsnn.com; they are not final decisions. (The tone of airsnn.com: "calm, unhurried", "discreet guest handling", "dedicated host". The site openly presents itself as a "concept presentation" and Alpina as "fictional", and its form says "Submission is not active".)

| Decision | Demo choice | Reason |
|---|---|---|
| Coordinates | **Alpina International** 46.405 N, 8.135 E (1,055 m, Upper Valais / Goms valley floor). **Valtor heliport** 46.430 N, 8.150 E (1,455 m, north side of the valley). **Chalet** 46.440 N, 8.150 E (1,744 m, below the ridge). Departure: **Geneva** 46.238 N, 6.109 E (the real departure city). Elevations checked with the open-meteo elevation API. Weather is fetched for the Alpina coordinate (open-meteo). | The valley floor matches the ~1,040 m in the document, there is no real airport there, and once the real place labels in the area are hidden in the map style, the three fictional points rise in a believable order. |
| Fonts | **Geist** + Instrument Serif Italic + JetBrains Mono (all free). | Builds the document's typographic pairing exactly, without needing a licence. |
| Concierge | Name: **Elise** ("Elise · AIRSNN Desk · AI concierge"). In prototype v1 there was no image, only a placeholder built from light, blur and a silhouette; in v2 an AI-generated portrait is used, set in one line of `data/site.json` (`"portrait"`). | A short, calm name that reads naturally in the three languages of the Alpine region (FR/DE/EN) and fits airsnn.com's "dedicated host" and "discreet" tone. |
| Request form | In demo mode nothing is sent anywhere; after submitting, a "Demo: request not sent" confirmation appears. | airsnn.com's own form also says "Submission is not active"; the demo must not send any data out. |

Note: airsnn.com calls the airport "Alpina Private Airport"; the prototype uses the document's name "Alpina International". Which one stays is still to be decided.
