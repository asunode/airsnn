// The fixed Alpina map: MapLibre + OpenFreeMap, loaded only after the desk is on screen.

let maplibre = null;
let map = null;
let ready = false;
let pending = null;
let journey = null;
let legLines = [];      // coordinates per leg
let progress = 0;       // legs completed, fractional
let tween = 0;
const markers = {};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

export function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'vendor/maplibre-gl.css';
    document.head.append(css);
    const s = document.createElement('script');
    s.src = 'vendor/maplibre-gl.js';
    s.async = true;
    s.onload = () => resolve(window.maplibregl);
    s.onerror = reject;
    document.head.append(s);
  });
}

// Quadratic arc between two points, bowed to the left of travel.
function arc(a, b, k, n = 64) {
  const [x1, y1] = a, [x2, y2] = b;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const cx = mx - dy * k, cy = my + dx * k;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2]);
  }
  return out;
}

// Chaikin smoothing so the mountain road reads as a road, not a zigzag.
function smooth(pts, rounds = 3) {
  let out = pts;
  for (let r = 0; r < rounds; r++) {
    const next = [out[0]];
    for (let i = 0; i < out.length - 1; i++) {
      const [a, b] = [out[i], out[i + 1]];
      next.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]);
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

function lineAt(p) {
  // all coordinates up to fractional progress p (in legs)
  const coords = [];
  legLines.forEach((line, i) => {
    if (p <= i) return;
    const f = Math.min(1, p - i);
    const upto = Math.max(1, Math.round(f * (line.length - 1)));
    coords.push(...line.slice(i ? 1 : 0, upto + 1));
  });
  return coords;
}

function headAt(p) {
  const c = lineAt(p);
  return c.length ? c[c.length - 1] : journey.places.geneva.lngLat;
}

function setProgress(p) {
  progress = p;
  if (!ready) return;
  const done = lineAt(p);
  map.getSource('route-done').setData({
    type: 'Feature', geometry: { type: 'LineString', coordinates: done.length > 1 ? done : [] }, properties: {},
  });
  map.getSource('route-head').setData({
    type: 'Feature', geometry: { type: 'Point', coordinates: headAt(p) }, properties: {},
  });
}

function tweenProgress(to, ms) {
  cancelAnimationFrame(tween);
  const from = progress;
  if (reduced.matches || ms < 50 || from === to) { setProgress(to); return; }
  const t0 = performance.now();
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / ms);
    setProgress(from + (to - from) * ease(t));
    if (t < 1) tween = requestAnimationFrame(tick);
  };
  tween = requestAnimationFrame(tick);
}

function padding(mode) {
  const w = innerWidth, h = innerHeight;
  if (mode === 'centre') return w <= 860 ? { top: 150, bottom: Math.round(h * .5), left: 20, right: 20 } : { top: Math.round(h * .42), bottom: 40, left: 120, right: 120 };
  if (w <= 860) return { top: 190, bottom: Math.round(h * .5), left: 24, right: 24 };
  return { top: 90, bottom: 60, left: 260, right: Math.min(520, Math.round(w * .36)) };
}

export function initMap(container, data) {
  journey = data;
  maplibre = window.maplibregl;
  const step0 = data.steps[0];
  const mobile = innerWidth <= 860;
  const cam = { ...step0.camera, ...(mobile ? step0.cameraMobile : {}) };

  legLines = data.legs.map((leg) => {
    if (leg.path) return smooth(leg.path);
    const a = data.places[leg.from].lngLat, b = data.places[leg.to].lngLat;
    return arc(a, b, leg.arc || 0);
  });

  map = new maplibre.Map({
    container,
    style: 'data/map-style.json',
    center: cam.center,
    zoom: cam.zoom,
    pitch: 0,
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    maxPitch: 70,
  });
  if (/[?&]debug/.test(location.search)) window.__airsnnMap = map; // inspection only, with ?debug
  map.on('error', () => {}); // tile hiccups must not reach the console as uncaught errors

  // stop markers (HTML, so they use the site's type)
  Object.entries(data.places).forEach(([id, p]) => {
    const el = document.createElement('div');
    el.className = 'stop-marker';
    el.dataset.id = id;
    el.innerHTML = `<span class="stop-marker__dot"></span><span class="stop-marker__name">${p.name}<span class="stop-marker__alt">${p.alt}</span></span>`;
    markers[id] = new maplibre.Marker({ element: el, anchor: 'left', offset: [-5, 0], opacityWhenCovered: '1' }).setLngLat(p.lngLat).addTo(map);
  });

  // Markers are placed before terrain tiles arrive; re-place them once the map settles.
  const far = () => container.classList.toggle('is-far', map.getZoom() < 10.5);
  map.on('zoom', far);
  far();
  map.on('idle', () => Object.values(markers).forEach((m) => m.setLngLat(m.getLngLat())));

  map.on('load', () => {
    const all = legLines.flatMap((l, i) => (i ? l.slice(1) : l));
    overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.setAttribute('class', 'route-overlay');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<path class="route-overlay__glow"/><path class="route-overlay__line"/>';
    const cc = map.getCanvasContainer();
    cc.insertBefore(overlay, cc.querySelector('.maplibregl-marker')); // under the stop markers
    map.on('render', drawOverlay);
    const alp = data.places.alpina.lngLat;
    map.addSource('route-all', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: all }, properties: {} } });
    map.addSource('route-done', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
    map.addSource('route-head', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: data.places.geneva.lngLat }, properties: {} } });
    // Alpina's fictional runway along the valley, bearing ~50°
    map.addSource('alpina-runway', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[alp[0] - .009, alp[1] - .0052], [alp[0] + .009, alp[1] + .0052]] }, properties: {} },
    });
    map.addLayer({ id: 'alpina-runway', type: 'line', source: 'alpina-runway', minzoom: 9,
      paint: { 'line-color': '#a9bad6', 'line-opacity': .45, 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 15, 14] } });
    // The whole route, quiet while you travel it, lit up when you see it from above (overview, arrival).
    map.addLayer({ id: 'route-all', type: 'line', source: 'route-all',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#a9bad6', 'line-opacity': .35, 'line-width': 1.2, 'line-dasharray': [1, 3],
        'line-opacity-transition': { duration: 900 } } });
    map.addLayer({ id: 'route-done', type: 'line', source: 'route-done',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#e3ebf7', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1.6, 14, 3], 'line-opacity-transition': { duration: 600 } } });
    map.addLayer({ id: 'route-head-glow', type: 'circle', source: 'route-head',
      paint: { 'circle-radius': 14, 'circle-color': '#f5b469', 'circle-opacity': .18, 'circle-blur': .6 } });
    map.addLayer({ id: 'route-head', type: 'circle', source: 'route-head',
      paint: { 'circle-radius': 3.5, 'circle-color': '#f5b469' } });
    ready = true;
    setProgress(progress);
    if (pending) { const p = pending; pending = null; goToStep(p.step, p.instant); }
  });
  return map;
}

function placeFor(stepId) {
  return ({ geneva: 'geneva', flight: null, alpina: 'alpina', valtor: 'valtor', chalet: 'chalet' })[stepId];
}

function setMarkerStates(stepId, prog) {
  const order = ['geneva', 'alpina', 'valtor', 'chalet'];
  const active = placeFor(stepId);
  order.forEach((id, i) => {
    const el = markers[id]?.getElement();
    if (!el) return;
    el.classList.toggle('is-active', id === active);
    el.classList.toggle('is-past', id !== active && i <= Math.floor(prog) && prog > 0);
  });
}

// Seen from above, the route is drawn as one clean path over the relief (a draped line
// zigzags across exaggerated ridges). The SVG follows the camera on every render.
let emphasised = null;
let overlay = null;
function drawOverlay() {
  if (!overlay || !emphasised) return;
  const tr = map.transform;
  const flat = (c) => (tr.locationToScreenPoint ? tr.locationToScreenPoint(new maplibre.LngLat(c[0], c[1])) : map.project(c));
  const lift = Math.min(innerWidth, innerHeight) * .05;
  // Each leg is projected without the relief, then bent so its ends sit exactly on the stop markers;
  // the jet leg also rises a little in the middle: it flies over the mountains, not through them.
  const pts = [];
  legLines.forEach((line, li) => {
    const a = line[0], b = line[line.length - 1];
    const pa = map.project(a), fa = flat(a), pb = map.project(b), fb = flat(b);
    const n = line.length - 1;
    line.forEach((c, i) => {
      if (li && !i) return;
      const t = i / n, f = flat(c);
      const up = journey.legs[li].mode === 'Jet' ? Math.sin(Math.PI * t) * lift : 0;
      pts.push([f.x + (pa.x - fa.x) * (1 - t) + (pb.x - fb.x) * t, f.y + (pa.y - fa.y) * (1 - t) + (pb.y - fb.y) * t - up]);
    });
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
  overlay.querySelectorAll('path').forEach((el) => el.setAttribute('d', d));
}
function emphasise(on) {
  if (emphasised === on) return;
  emphasised = on;
  overlay?.classList.toggle('is-on', on);
  map.setPaintProperty('route-all', 'line-opacity', on ? 0 : .35);
  map.setPaintProperty('route-done', 'line-opacity', on ? 0 : 1);
  if (on) drawOverlay();
}

// Relief is exaggerated only when the camera is far enough for the Alps to need it.
let terrainNow = 1.3;
let terrainTween = 0;
function setRelief(to, ms) {
  cancelAnimationFrame(terrainTween);
  const from = terrainNow;
  if (from === to) return;
  const apply = (v) => { terrainNow = v; map.setTerrain({ source: 'terrain', exaggeration: v }); };
  if (reduced.matches || ms < 50) { apply(to); return; }
  const t0 = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - t0) / ms);
    apply(from + (to - from) * (1 - Math.pow(1 - t, 3)));
    if (t < 1) terrainTween = requestAnimationFrame(tick);
  };
  terrainTween = requestAnimationFrame(tick);
}

export function goToStep(step, instant = false) {
  if (!map || !ready) { pending = { step, instant }; return; }
  emphasise(!!step.emphasis);
  const mobile = innerWidth <= 860;
  const cam = { ...step.camera, ...(mobile && step.cameraMobile ? step.cameraMobile : {}) };
  const pad = padding(step.padding);
  const opts = { center: cam.center, zoom: cam.zoom, pitch: cam.pitch || 0, bearing: cam.bearing || 0, padding: pad };
  const ms = instant || reduced.matches ? 0 : 2000;
  if (ms === 0) map.jumpTo(opts);
  else map.flyTo({ ...opts, duration: ms, curve: 1.3, essential: false });
  tweenProgress(step.progress, ms * .9);
  setRelief(step.terrain || 1.3, ms || 0);
  setMarkerStates(step.id, step.progress);
}

// Arrival: settle on the chalet, then pull back to the whole Alps.
export function arrivalCamera(stage) {
  if (!map || !ready) return;
  // A phone has no room beside the rows for the chalet close-up: it goes straight to the whole route.
  if (innerWidth <= 860) stage = 'out';
  const ms = reduced.matches ? 0 : stage === 'out' ? 3200 : 1800;
  const opts = stage === 'out'
    ? { center: [7.4, 46.36], zoom: innerWidth <= 860 ? 6.6 : 7.3, pitch: 40, bearing: -10 }
    : { center: journey.places.chalet.lngLat, zoom: 13.6, pitch: 50, bearing: -10 };
  emphasise(stage === 'out');
  setRelief(stage === 'out' ? 2.6 : 1.3, ms);
  // phone: the route lives in the strip between the top bar and the closing rows
  const pad = innerWidth <= 860 ? { top: 96, bottom: Math.max(0, innerHeight - 170), left: 48, right: 48 } : { top: 80, bottom: 80, left: Math.min(900, Math.round(innerWidth * .6)), right: 170 };
  if (ms === 0) map.jumpTo({ ...opts, padding: pad });
  else map.easeTo({ ...opts, padding: pad, duration: ms, easing: (t) => 1 - Math.pow(1 - t, 3) });
  tweenProgress(3, 0);
  setMarkerStates('chalet', 3);
}

export function resizeMap() { map?.resize(); }
