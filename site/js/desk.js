// The concierge desk. answer() is the single seam: scripted today, a local AI later.

let script = null;
let context = {};

export function setupDesk(deskData, ctx) {
  script = deskData;
  context = ctx;
}

export function updateContext(patch) { Object.assign(context, patch); }

function fill(text) {
  return text.replace(/\{(\w+)\}/g, (_, k) => context[k] ?? '');
}

function matches(q, key) {
  const k = key.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z])${k}([^a-z]|$)`, 'i').test(q);
}

// Returns { text, action } — same shape a model-backed version would return.
export async function answer(question) {
  const q = question.trim().toLowerCase();
  if (!q) return null;
  for (const intent of script.intents) {
    if (intent.keys.some((k) => matches(q, k))) {
      const needs = (intent.text.match(/\{(\w+)\}/g) || []).map((m) => m.slice(1, -1));
      const missing = needs.some((k) => context[k] == null);
      const text = missing && intent.textNoData ? intent.textNoData : fill(intent.text);
      return { text, action: intent.action };
    }
  }
  return { text: script.fallback.text, action: script.fallback.action };
}

export function greetingFor(date = new Date()) {
  const h = date.getHours();
  const g = script.greeting;
  return h < 12 ? g.morning : h < 18 ? g.afternoon : g.evening;
}

// Write a sentence into the headline, word by word.
export function speak(headline, text, { reduced = false } = {}) {
  headline.classList.add('is-answer');
  headline.innerHTML = '';
  const span = document.createElement('span');
  span.className = 'desk__answer';
  const words = text.split(/\s+/);
  words.forEach((w, i) => {
    const el = document.createElement('span');
    el.className = 'w';
    el.textContent = w;
    if (!reduced) el.style.animationDelay = `${i * 30}ms`;
    span.append(el, document.createTextNode(i < words.length - 1 ? ' ' : ''));
  });
  headline.append(span);
}
