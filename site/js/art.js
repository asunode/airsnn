// Placeholder pictures: light, blur and silhouette, never a grey box.
// Each one is clearly tagged as a placeholder by the caller.

const SKY = {
  night: ['#060b18', '#0d1834', '#1d2c50', '#3a3550'],
  dusk: ['#0b1430', '#1b2b55', '#3d4a78', '#c98a5e'],
  day: ['#9db4d4', '#c3d3e8', '#e3ebf7', '#eef2f6'],
};

const RIDGE_FAR = 'M0 300 L60 262 L110 280 L170 230 L220 256 L270 214 L330 250 L390 222 L450 260 L520 226 L580 252 L640 240 L640 400 L0 400Z';
const RIDGE_NEAR = 'M0 330 L80 296 L140 318 L210 286 L300 322 L380 292 L470 326 L560 300 L640 318 L640 400 L0 400Z';

const SUBJECTS = {
  jet: `
    <g class="subj">
      <path d="M150 300 C200 282 330 276 452 282 C488 284 506 292 512 300 C506 306 488 310 452 310 L180 314 C162 312 150 306 150 300Z" fill="#05080f"/>
      <path d="M440 284 L486 222 L506 222 L486 288Z" fill="#05080f"/>
      <path d="M300 300 L380 300 L330 338 L300 338Z" fill="#05080f"/>
      <path d="M470 236 L520 232 L520 238 L470 242Z" fill="#05080f"/>
    </g>
    <circle class="glow" cx="168" cy="304" r="5"/>
    <circle class="glow glow--soft" cx="506" cy="226" r="3"/>`,
  heli: `
    <g class="subj">
      <path d="M210 290 C210 262 248 248 290 248 L350 250 C380 252 396 270 396 290 C396 306 380 314 352 314 L250 314 C226 314 210 306 210 290Z" fill="#05080f"/>
      <path d="M392 278 L520 270 L528 262 L536 262 L534 290 L392 296Z" fill="#05080f"/>
      <rect x="296" y="236" width="12" height="14" fill="#05080f"/>
      <rect x="150" y="228" width="310" height="5" rx="2" fill="#05080f"/>
      <path d="M230 326 L380 326 M250 314 L244 326 M350 314 L356 326" stroke="#05080f" stroke-width="5" fill="none"/>
    </g>
    <path d="M226 280 C232 266 246 260 262 258 L262 284Z" fill="#c9d6ea" opacity=".12"/>
    <circle class="glow" cx="530" cy="264" r="4"/>`,
  car: `
    <g class="subj">
      <path d="M150 316 L160 290 C164 280 172 276 184 274 L240 268 L284 240 C292 234 300 232 312 232 L420 232 C432 232 440 236 448 242 L482 270 L516 276 C530 278 538 286 540 298 L540 316 C540 322 536 326 528 326 L162 326 C154 326 150 322 150 316Z" fill="#05080f"/>
      <circle cx="226" cy="328" r="26" fill="#05080f"/>
      <circle cx="464" cy="328" r="26" fill="#05080f"/>
    </g>
    <path d="M296 246 L330 240 L330 268 L270 270Z M344 240 L420 240 C428 240 436 244 442 250 L460 268 L344 268Z" fill="#c9d6ea" opacity=".10"/>
    <ellipse class="glow" cx="536" cy="296" rx="8" ry="5"/>
    <path class="beam" d="M540 296 L640 270 L640 330Z"/>`,
  chalet: `
    <g class="subj">
      <path d="M200 340 L200 250 L320 180 L440 250 L440 340Z" fill="#05080f"/>
      <path d="M176 258 L320 168 L464 258 L452 264 L320 184 L188 264Z" fill="#05080f"/>
    </g>
    <rect class="win" x="236" y="270" width="34" height="40"/>
    <rect class="win" x="370" y="270" width="34" height="40"/>
    <rect class="win win--door" x="302" y="282" width="36" height="58"/>
    <rect class="win" x="306" y="216" width="28" height="30"/>`,
  cabin: `
    <rect x="0" y="0" width="640" height="400" fill="#0a0f1c"/>
    <g class="cabin-win">
      <rect x="110" y="96" width="80" height="120" rx="40"/>
      <rect x="280" y="96" width="80" height="120" rx="40"/>
      <rect x="450" y="96" width="80" height="120" rx="40"/>
    </g>
    <g class="subj">
      <path d="M60 400 L60 250 C60 226 76 212 100 212 L150 212 C172 212 186 226 186 250 L186 300 L250 300 L250 400Z" fill="#03050b"/>
      <path d="M580 400 L580 250 C580 226 564 212 540 212 L490 212 C468 212 454 226 454 250 L454 300 L390 300 L390 400Z" fill="#03050b"/>
      <rect x="262" y="300" width="116" height="14" rx="4" fill="#03050b"/>
    </g>
    <rect class="card" x="296" y="292" width="40" height="7" rx="1"/>
    <path d="M0 0 L640 0 L560 60 L80 60Z" fill="#070b16"/>
    <circle class="glow glow--soft" cx="150" cy="70" r="5"/>
    <circle class="glow glow--soft" cx="490" cy="70" r="5"/>
    <path class="beam" d="M146 72 L120 210 L184 210 L154 72Z"/>`,
};

const WINDOW_GRAD = `
  <linearGradient id="cw" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#1d2c50"/><stop offset=".7" stop-color="#3d4a78"/><stop offset="1" stop-color="#c98a5e"/>
  </linearGradient>`;

export function artSVG(kind, tone = 'dusk') {
  const s = SKY[tone] || SKY.dusk;
  const id = `a${Math.random().toString(36).slice(2, 8)}`;
  const isCabin = kind === 'cabin';
  return `
<svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" class="art art--${kind}" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="${id}s" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="${s[0]}"/><stop offset=".45" stop-color="${s[1]}"/>
      <stop offset=".78" stop-color="${s[2]}"/><stop offset="1" stop-color="${s[3]}"/>
    </linearGradient>
    <filter id="${id}b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.2"/></filter>
    <filter id="${id}g" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="9"/></filter>
    ${isCabin ? WINDOW_GRAD : ''}
  </defs>
  ${isCabin ? '' : `<rect width="640" height="400" fill="url(#${id}s)"/>
  <path d="${RIDGE_FAR}" fill="#1b2747" opacity=".85" filter="url(#${id}b)"/>
  <path d="${RIDGE_NEAR}" fill="#0b1224" filter="url(#${id}b)"/>
  <rect y="330" width="640" height="70" fill="#070b16"/>`}
  <g filter="url(#${id}b)">${SUBJECTS[kind] || ''}</g>
</svg>`;
}

// Fill every [data-art] element in a root.
export function paintArt(root = document) {
  root.querySelectorAll('[data-art]').forEach((el) => {
    if (el.dataset.painted) return;
    el.insertAdjacentHTML('afterbegin', artSVG(el.dataset.art, el.dataset.tone));
    el.dataset.painted = '1';
  });
}
