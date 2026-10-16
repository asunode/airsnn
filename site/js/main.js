import { paintArt, artSVG } from './art.js?v=202610161227';
import { setupDesk, updateContext, answer, greetingFor, speak } from './desk.js?v=202610161227';
import { loadMapLibre, initMap, goToStep, arrivalCamera, resizeMap } from './map.js?v=202610161227';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => reducedMQ.matches;
const store = {
  get(k) { try { return localStorage.getItem(`airsnn.${k}`); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(`airsnn.${k}`, v); } catch { /* private mode */ } },
};

const [site, journey, deskData] = await Promise.all([
  window.__site || fetch('data/site.json').then((r) => r.json()), // started early by index.html
  ...['data/sample-journey.json', 'data/desk.json'].map((u) => fetch(u).then((r) => r.json())),
]);

const initialHash = location.hash;
const TZ = site.alpina.timezone;
const visitorTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const hhmm = (d, tz) => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(d);
const minus = (s) => String(s).replace(/^-/, '−');

/* ---------- Labels from data ---------- */
$$('[data-sample-label]').forEach((el) => { el.textContent = journey.label; });
$$('[data-concierge-name]').forEach((el) => { el.textContent = site.concierge.name; });

/* The concierge portrait is placed by the small inline script in index.html, from data/site.json. */

/* ---------- Live clocks ---------- */
function tickClocks() {
  const now = new Date();
  $$('[data-clock="alpina"]').forEach((el) => { el.textContent = hhmm(now, TZ); });
  $$('[data-clock="you"]').forEach((el) => { el.textContent = hhmm(now, visitorTZ); });
}
tickClocks();
setInterval(tickClocks, 10_000);

/* ---------- Live weather (hidden if it cannot be fetched) ---------- */
const WMO = [
  [[0], 'clear'], [[1], 'mostly clear'], [[2], 'partly cloudy'], [[3], 'overcast'], [[45, 48], 'fog'],
  [[51, 53, 55, 56, 57], 'drizzle'], [[61, 63, 65, 66, 67], 'rain'], [[71, 73, 75, 77], 'snow'],
  [[80, 81, 82], 'showers'], [[85, 86], 'snow showers'], [[95, 96, 99], 'thunderstorm'],
];
const sky = (code) => (WMO.find(([codes]) => codes.includes(code)) || [, ''])[1];

async function loadWeather() {
  const key = 'weather';
  let data = null;
  try {
    const cached = JSON.parse(store.get(key) || 'null');
    if (cached && Date.now() - cached.t < site.weather.cacheMinutes * 60_000) data = cached.d;
  } catch { /* ignore */ }
  if (!data) {
    const u = new URL(site.weather.endpoint);
    u.search = new URLSearchParams({
      latitude: site.alpina.lat, longitude: site.alpina.lon,
      current: 'temperature_2m,weather_code,wind_speed_10m', daily: 'sunset', timezone: TZ, forecast_days: '1',
    });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const r = await fetch(u, { signal: ctrl.signal });
      if (!r.ok) throw new Error(r.status);
      data = await r.json();
      store.set(key, JSON.stringify({ t: Date.now(), d: data }));
    } catch { data = null; } finally { clearTimeout(timer); }
  }
  const el = $('#weather');
  if (!data?.current) { el.hidden = true; return; }
  const t = Math.round(data.current.temperature_2m);
  const desc = sky(data.current.weather_code);
  el.textContent = `${minus(t)} °C${desc ? `, ${desc}` : ''}`;
  el.hidden = false;
  const sunset = data.daily?.sunset?.[0]?.slice(11, 16) || null;
  let leaveBy = null;
  if (sunset) {
    const [h, m] = sunset.split(':').map(Number);
    const mins = h * 60 + m - 41 - 25; // flight time plus a margin
    leaveBy = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  }
  updateContext({ weather: `${minus(t)} °C${desc ? ` and ${desc}` : ''}`, sunset, leaveBy });
}

/* ---------- Desk ---------- */
setupDesk(deskData, { name: site.concierge.name, weather: null, sunset: null, leaveBy: null });
const headline = $('#desk-headline');
if (innerWidth <= 480) $('#ask-input').placeholder = 'Ask the desk anything';
$('[data-greet]').textContent = greetingFor();
$('[data-question]').textContent = deskData.greeting.question;
// the portrait is not part of the entrance: it is the first thing on screen and stays put
['#desk-headline', '.intents', '#ask', '.desk__fineprint'].forEach((s, i) => {
  const el = $(s); el.dataset.enter = ''; el.style.setProperty('--i', i);
});
function showDesk() { requestAnimationFrame(() => $('#desk').classList.add('is-in')); }

const deskAction = $('#desk-action');
async function respond(q) {
  const res = await answer(q);
  if (!res) return;
  speak(headline, res.text, { reduced: reduced() });
  deskAction.innerHTML = '';
  deskAction.hidden = !res.action;
  if (res.action) {
    const a = document.createElement('a');
    a.className = 'btn btn--glass';
    a.href = `#${res.action.go}`;
    a.dataset.go = res.action.go;
    a.textContent = res.action.label;
    deskAction.append(a);
  }
}
$('#ask').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#ask-input');
  respond(input.value);
  input.value = '';
});
$('#speak').addEventListener('click', () => {
  speak(headline, deskData.speak, { reduced: reduced() });
  deskAction.hidden = true;
  $('#ask-input').focus({ preventScroll: true });
});

/* ---------- Route (rendered from the sample journey) ---------- */
const stepsEl = $('#route-steps');
const railList = $('#rail-list');
const tripDate = (t) => new Date(`${journey.date}T${t}:00${journey.utcOffset}`);

function timesFor(t) {
  const d = tripDate(t);
  const a = hhmm(d, TZ), y = hhmm(d, visitorTZ);
  return { a, y, same: a === y };
}

function tagHTML(tag) {
  const { a, y, same } = timesFor(tag.time);
  return `
    <article class="tag">
      <p class="tag__route">
        <span class="tag__from">From ${tag.from}</span>
        <span class="tag__to">${tag.to}</span>
        <span class="tag__mode">by ${tag.mode.toLowerCase()}</span>
      </p>
      <hr class="tag__rule">
      <dl class="tag__times">
        <div><dt>Alpina time</dt><dd>${a}</dd></div>
        <div><dt>Your time</dt><dd>${y}${same ? '<small>same</small>' : ''}</dd></div>
      </dl>
      <p class="tag__note">${tag.note}</p>
      <div class="tag__foot"><p class="sample-flag"><span class="sample-flag__dot" aria-hidden="true"></span><span>${journey.label}, not live</span></p></div>
    </article>`;
}

const panelHTML = (p) => `
  <div class="panel">
    <span class="panel__value">${p.value}</span>
    <span class="panel__label">${p.label}</span>
    <p class="panel__sentence">${p.sentence}</p>
  </div>`;

journey.steps.forEach((s, i) => {
  const el = document.createElement('article');
  el.className = `step${i === 0 ? ' step--intro' : ''}${s.scene ? ` step--scene` : ''}`;
  el.dataset.step = s.id;
  el.id = `step-${s.id}`;
  const title = s.title ? `<h3 class="step__title">${s.title}${s.titleItalic ? ` <em>${s.titleItalic}</em>` : ''}</h3>` : '';
  el.innerHTML = `
    <div class="step__content">
      ${title}
      ${s.tag ? tagHTML(s.tag) : ''}
      ${s.panels.length ? `<div class="panels">${s.panels.map(panelHTML).join('')}</div>` : ''}
      <p class="step__body">${s.body}</p>
      ${i === 0 ? `<p class="sample-flag"><span class="sample-flag__dot" aria-hidden="true"></span><span>${journey.disclaimer}</span></p>` : ''}
    </div>`;
  stepsEl.append(el);
});

const railSteps = journey.steps.filter((s) => s.rail);
railList.innerHTML = railSteps.map((s, i) => `
  <li><a href="#route/${s.id}" data-go="route/${s.id}" data-rail="${s.id}"><span><span class="num">0${i + 1}</span>${s.rail}</span></a></li>`).join('');

/* ---------- How it works ---------- */
const how = $('#how');
$('#how-words').innerHTML = journey.how.map((h) => `
  <p class="how__word" data-how="${h.id}">${h.word}<em>${h.italic}</em><span class="how__summary">${h.summary}</span></p>`).join('')
  + `<p class="how__clock"><span class="how__clock-time num" id="how-time">${journey.how[0].time}</span><span class="how__clock-label" id="how-light">${journey.how[0].lightName} in Alpina, ${journey.label.toLowerCase()}</span></p>`;
$('#diagram').innerHTML = journey.how.map((h, i) => `
  <button class="node" type="button" role="tab" id="node-${h.id}" aria-selected="false" aria-controls="ops" data-node="${i}">
    <span class="node__dot" aria-hidden="true"></span>
    <span class="node__name">${h.word}</span>
  </button>`).join('');
$$('.how__summary').forEach((s) => { s.style.display = 'block'; });

let howIdx = -1;
let howPreview = null; // a node under the pointer or keyboard focus; never moves the selection
const fineHover = matchMedia('(hover: hover) and (pointer: fine)');
function renderOps(i) {
  const h = journey.how[i];
  $('#ops').innerHTML = Object.entries(h.ops).map(([team, lines], c) => `
    <div class="ops__col${c === 0 ? ' ops__col--all' : ''}">
      <p class="ops__team">${team}</p>
      <ul class="ops__log">${lines.map((l, k) => `<li style="--i:${k + c}">${l}</li>`).join('')}</ul>
    </div>`).join('') + '<p class="ops__hint">Hover or select a step to see who is doing what behind it.</p>';
  $('#ops').setAttribute('aria-labelledby', `node-${h.id}`);
}
let opsShown = -1;
function paintNodes() {
  // The selected node, the counter, the big word and the light always name the same step.
  $$('.node').forEach((n, k) => {
    n.setAttribute('aria-selected', String(k === howIdx));
    n.classList.toggle('is-preview', k === howPreview);
  });
  const shown = howPreview ?? howIdx;
  if (shown !== opsShown) { opsShown = shown; renderOps(shown); }
}
function setHow(i) {
  if (i === howIdx) return;
  howIdx = i;
  how.dataset.light = journey.how[i].light;
  $$('.how__word').forEach((w, k) => w.classList.toggle('is-on', k === i));
  $('#how-counter').textContent = innerWidth <= 860 ? `${journey.how[i].time}, step ${i + 1} of 4` : `Step ${i + 1} of 4`;
  $('#how-time').textContent = journey.how[i].time;
  $('#how-light').textContent = `${journey.how[i].lightName} in Alpina, ${journey.label.toLowerCase()}`;
  paintNodes();
}
function preview(i) { howPreview = i; paintNodes(); }
$$('.node').forEach((n) => {
  const i = Number(n.dataset.node);
  // Touch screens fire mouseenter/focus on tap; there a tap only selects, it never previews.
  n.addEventListener('mouseenter', () => { if (fineHover.matches) preview(i); });
  n.addEventListener('mouseleave', () => { if (howPreview === i) preview(null); });
  n.addEventListener('focus', () => { if (n.matches(':focus-visible')) preview(i); });
  n.addEventListener('blur', () => { if (howPreview === i) preview(null); });
  n.addEventListener('click', () => {
    preview(null);
    setHow(i);
    // scroll to the part of the pinned section that shows this step
    const top = how.offsetTop + (how.offsetHeight - innerHeight) * ((i + .5) / 4);
    scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' });
  });
  n.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = $$('.node')[(i + (e.key === 'ArrowRight' ? 1 : 3)) % 4];
    next.focus();
  });
});
setHow(0);

/* ---------- Fleet ---------- */
const fleet = journey.fleet;
const pictureHTML = (base, sizes, focus = '') => `
  <picture>
    <source type="image/avif" srcset="${base}-800.avif 800w, ${base}-1200.avif 1200w, ${base}-1672.avif 1672w" sizes="${sizes}">
    <img src="${base}-1200.webp" srcset="${base}-800.webp 800w, ${base}-1200.webp 1200w, ${base}-1672.webp 1672w" sizes="${sizes}" alt="" loading="lazy" decoding="async"${focus ? ` style="object-position: ${focus}"` : ''}>
  </picture>`;
$('#fleet-grid').innerHTML = fleet.map((f, i) => `
  <li class="fleet__item">
    <button class="tile" type="button" data-tile="${i}" aria-label="Open ${f.title}">
      ${f.image ? pictureHTML(f.image, i === 0 ? '(max-width: 860px) 100vw, 66vw' : '(max-width: 860px) 50vw, 33vw', f.focus) : `<span class="tile__art" data-art="${f.art}" data-tone="dusk"></span>`}
      ${f.image ? '' : '<span class="placeholder-tag">Placeholder: photo to come</span>'}
      <span class="tile__cap"><span class="tile__title">${f.title}</span><span class="tile__type">${f.type}</span></span>
    </button>
  </li>`).join('');
paintArt($('#fleet-grid'));
paintArt($('#scene'));

const lb = $('#lightbox');
let lbIdx = 0;
function openLightbox(i) {
  lbIdx = (i + fleet.length) % fleet.length;
  const f = fleet[lbIdx];
  $('#lb-media').innerHTML = f.image
    ? pictureHTML(f.image, '100vw').replace('loading="lazy"', '')
    : `${artSVG(f.art, 'dusk')}<span class="placeholder-tag">Placeholder: photo to come</span>`;
  $('#lb-title').innerHTML = `${f.title} <span class="lightbox__type">${f.type}</span>`;
  const r = f.record;
  $('#lb-record').innerHTML = `Alt <b>${r.alt}</b>&ensp;Time <b>${r.time}</b>&ensp;Route <b>${r.route}</b>&ensp;<b>${r.temp}</b>`;
  $('#lb-count').textContent = `${String(lbIdx + 1).padStart(2, '0')} / ${String(fleet.length).padStart(2, '0')}, ${journey.label.toLowerCase()}`;
  if (!lb.open) lb.showModal();
}
$$('[data-tile]').forEach((t) => t.addEventListener('click', () => openLightbox(Number(t.dataset.tile))));
$('#lb-prev').addEventListener('click', () => openLightbox(lbIdx - 1));
$('#lb-next').addEventListener('click', () => openLightbox(lbIdx + 1));
$('#lb-close').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') openLightbox(lbIdx + 1);
  if (e.key === 'ArrowLeft') openLightbox(lbIdx - 1);
});

/* ---------- Arrival ---------- */
$('#arrival-rows').innerHTML = journey.closing.map((r) => `
  <li class="arrival__row">
    <span class="arrival__mode">${r.mode}</span>
    <span class="arrival__what">${r.what}</span>
    <span class="arrival__time">${r.time}</span>
    <span class="arrival__state" data-state>Waiting</span>
  </li>`).join('');

/* ---------- Plan form (demo: sends nothing) ---------- */
const form = $('#plan-form');
let planStep = 1;
function showPlanStep(n) {
  planStep = n;
  $$('.plan__step', form).forEach((f) => { f.hidden = Number(f.dataset.step) !== n; });
  $('#plan-count').textContent = `${n} of 3`;
  $('#plan-back').hidden = n === 1;
  $('#plan-next').textContent = n === 3 ? 'Send request' : 'Continue';
}
$('#plan-next').addEventListener('click', () => {
  if (planStep < 3) { showPlanStep(planStep + 1); $('.plan__step:not([hidden]) input', form)?.focus(); return; }
  // Demo mode: nothing is transmitted or stored.
  $$('.plan__step', form).forEach((f) => { f.hidden = true; });
  $('.plan__nav', form).hidden = true;
  $('#plan-count').hidden = true;
  const done = $('#plan-done');
  done.hidden = false;
  done.focus();
});
$('#plan-back').addEventListener('click', () => showPlanStep(planStep - 1));
$('#plan-again').addEventListener('click', () => {
  form.reset();
  $('#plan-done').hidden = true;
  $('.plan__nav', form).hidden = false;
  $('#plan-count').hidden = false;
  showPlanStep(1);
});
form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('input', () => {
  const f = form.elements;
  $('#plan-from').textContent = f.from.value.trim() || 'Your airport';
  $('#plan-arrive').textContent = f.arrive.value ? `before ${f.arrive.value}` : '';
  $('#plan-valtor').hidden = !f.heli.checked;
  $('#plan-heli').textContent = f.heli.checked ? 'by helicopter' : 'by car';
});

/* ---------- Navigation ---------- */
function go(target, { instant = false } = {}) {
  const behavior = instant || reduced() ? 'auto' : 'smooth';
  if (target === 'desk') { scrollTo({ top: 0, behavior }); return; }
  if (target === 'plan') { $('#plan').scrollIntoView({ behavior }); return; }
  const m = target.match(/^route\/(\w+)$/);
  if (m) {
    const el = $(`#step-${m[1]}`);
    if (el) scrollTo({ top: el.offsetTop + $('#route').offsetTop + 2, behavior });
  }
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-go]');
  if (!a) return;
  e.preventDefault();
  go(a.dataset.go);
});
document.addEventListener('keydown', (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
  if (e.key === 'Escape' && !lb.open && !typing && root.classList.contains('gate-done')) go('desk');
  if (!typing && root.dataset.zone === 'route' && (e.key === 'j' || e.key === 'k')) {
    const ids = journey.steps.map((s) => s.id);
    const i = ids.indexOf(activeStep?.id);
    const next = ids[Math.max(0, Math.min(ids.length - 1, i + (e.key === 'j' ? 1 : -1)))];
    go(`route/${next}`);
  }
});

/* ---------- Scroll: zones, active step, scenes, pinned sections ---------- */
let activeStep = null;
let arrivalStage = null;
const zones = ['desk', 'route', 'how', 'fleet', 'arrival', 'plan'].map((id) => [id, $(`#${id}`)]);
const stepEls = $$('.step');
const glassUnder = [how, $('#fleet'), $('#plan'), $('.foot')];

function progressIn(el) {
  const r = el.getBoundingClientRect();
  const span = r.height - innerHeight;
  return span <= 0 ? (r.top <= 0 ? 1 : 0) : Math.min(1, Math.max(0, -r.top / span));
}

function setActiveStep(s) {
  if (activeStep === s) return;
  activeStep = s;
  stepEls.forEach((el) => el.classList.toggle('is-active', el.dataset.step === s.id));
  root.dataset.scene = s.scene || '';
  if (!s.scene) delete root.dataset.scene;
  if (!s.scene) goToStep(s);
  // rail
  const railIdx = railSteps.findIndex((r) => r.id === s.id);
  const lastPassed = Math.max(-1, ...journey.steps.slice(0, journey.steps.indexOf(s) + 1).map((x) => railSteps.findIndex((r) => r.id === x.id)));
  $$('[data-rail]').forEach((a, i) => {
    a.toggleAttribute('aria-current', i === railIdx);
    if (i === railIdx) a.setAttribute('aria-current', 'step');
    a.classList.toggle('is-past', i < lastPassed || (railIdx < 0 && i <= lastPassed));
  });
  const cur = railIdx >= 0 ? $$('[data-rail]')[railIdx] : null;
  if (cur && railList.scrollWidth > railList.clientWidth) {
    railList.scrollTo({ left: cur.parentElement.offsetLeft - 16, behavior: reduced() ? 'auto' : 'smooth' });
  }
  railList.style.setProperty('--rail-p', Math.max(0, lastPassed) / (railSteps.length - 1));
  if (s.rail) store.set('last_stop', s.id);
  history.replaceState(null, '', `#route/${s.id}`);
}

function onScroll() {
  const mid = innerHeight * .5;
  let zone = 'desk';
  for (const [id, el] of zones) {
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) { zone = id; break; }
  }
  if (root.dataset.zone !== zone) {
    if (root.dataset.zone && zone !== 'route') $('#resume').hidden = true;
    root.dataset.zone = zone;
    if (zone === 'desk' && location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (zone === 'plan') history.replaceState(null, '', '#plan');
  }

  if (zone === 'route') {
    const s = stepEls.find((el) => { const r = el.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
    if (s) {
      setActiveStep(journey.steps.find((x) => x.id === s.dataset.step));
      if (activeStep.scene) {
        const r = s.getBoundingClientRect();
        $('#scene').style.setProperty('--scene-p', Math.min(1, Math.max(0, (mid - r.top) / r.height)).toFixed(3));
      }
    }
  } else if (root.dataset.scene) {
    delete root.dataset.scene;
  }
  if (zone !== 'route' && activeStep && zone !== 'arrival') { activeStep = null; stepEls.forEach((el) => el.classList.remove('is-active')); }

  // How it works: pinned, four lights of the day
  const hp = progressIn(how);
  setHow(Math.min(3, Math.floor(hp * 4)));
  const light = how.dataset.light === 'noon' || how.dataset.light === 'afternoon';
  root.dataset.bar = zone === 'how' && light ? 'light' : 'dark';

  // Top bar: glass floor once text sections slide under it (How only after its pin lets go)
  const barH = $('#bar').offsetHeight;
  root.toggleAttribute('data-glass', glassUnder.some((el) => {
    const r = el.getBoundingClientRect();
    return el === how ? r.bottom < innerHeight && r.bottom > 0 : r.top < barH && r.bottom > 0;
  }));

  // Arrival: rows delivered one by one, then the title
  const arrival = $('#arrival');
  const ap = progressIn(arrival);
  $$('.arrival__row').forEach((row, i) => {
    const on = ap > .12 + i * .14;
    if (row.classList.contains('is-delivered') !== on) {
      row.classList.toggle('is-delivered', on);
      $('[data-state]', row).textContent = on ? 'Delivered' : 'Waiting';
    }
  });
  const complete = ap > .6;
  arrival.classList.toggle('is-complete', complete);
  if (zone === 'arrival') {
    const stage = complete ? 'out' : 'in';
    if (stage !== arrivalStage) { arrivalStage = stage; arrivalCamera(stage); }
  } else if (arrivalStage && zone !== 'arrival') {
    arrivalStage = null;
  }
}
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; onScroll(); });
}, { passive: true });
addEventListener('resize', () => { resizeMap(); onScroll(); });
addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (/^route\/\w+$/.test(h) || h === 'plan') go(h);
});

/* ---------- Map: only after the desk is on screen ---------- */
function bootMap() {
  loadMapLibre().then(() => {
    initMap($('#map'), journey);
    if (activeStep && !activeStep.scene) goToStep(activeStep, true);
  }).catch(() => { /* the page still works without the map */ });
}
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 300));

/* ---------- Gate (first visit only) ---------- */
const gate = $('#gate');
function afterGate() {
  root.classList.add('gate-done');
  showDesk();
  const h = initialHash.slice(1);
  if (/^route\/\w+$/.test(h) || h === 'plan') setTimeout(() => go(h), 300);
  idle(bootMap, { timeout: 1500 });
  loadWeather();
}
if (root.classList.contains('has-gate')) {
  let opened = false;
  const hold = /[?&]hold/.test(location.search);
  const open = () => {
    if (opened) return;
    opened = true;
    store.set('intro_seen', '1');
    gate.classList.add('is-wiping');
    setTimeout(() => {
      gate.classList.add('is-open');
      afterGate();
      setTimeout(() => gate.remove(), 800);
    }, reduced() ? 0 : 650);
  };
  requestAnimationFrame(() => setTimeout(() => gate.classList.add('is-ready'), 200));
  $('#gate-enter').addEventListener('click', open);
  $('#gate-skip').addEventListener('click', open);
  addEventListener('wheel', open, { once: true, passive: true });
  addEventListener('touchmove', open, { once: true, passive: true });
  if (!hold) setTimeout(open, 4000);
  addEventListener('keydown', (e) => {
    if (opened || e.target.closest?.('a')) return; // Enter on the GitHub link follows the link
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
} else {
  gate.remove();
  root.classList.add('gate-done');
  // Memory: reopen at the stop the visitor last looked at.
  const last = store.get('last_stop');
  const hashStep = initialHash.match(/^#route\/(\w+)/)?.[1];
  const want = hashStep || (initialHash === '#plan' ? null : last);
  if (initialHash === '#plan') go('plan', { instant: true });
  else if (want && $(`#step-${want}`)) {
    go(`route/${want}`, { instant: true });
    if (!hashStep && last) {
      const stop = journey.steps.find((s) => s.id === last);
      $('#resume-stop').textContent = stop?.rail || last;
      $('#resume').hidden = false;
    }
  }
  showDesk();
  idle(bootMap, { timeout: 800 });
  loadWeather();
}
$('#resume-desk').addEventListener('click', () => { $('#resume').hidden = true; go('desk'); });
$('#resume-close').addEventListener('click', () => { $('#resume').hidden = true; });
addEventListener('scroll', function hideResume() {
  if (scrollY < 40) { $('#resume').hidden = true; }
}, { passive: true });

onScroll();
