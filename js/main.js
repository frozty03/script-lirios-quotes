// Liga tudo: o dia escolhe a frase e o buquê; a cena é preparada num Worker e pintada.

import { START_DATE } from './config.js';
import { dayIndex, greeting } from './day.js';
import { QUOTES } from './quotes.js';
import { createRenderer } from './renderer.js';
import { hash2, vnoise } from './scene/util.js';

const WORDS_AT_MS = 4400;       // a frase surge perto do fim dos 5 s de pintura
const WORDS_FALLBACK_MS = 9000; // e aparece de qualquer jeito se a pintura não vier

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('bouquet');
const words = document.getElementById('words');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Parâmetros só para teste: ?now=2026-11-14T23:59:58 desloca o relógio, ?day=N fixa o dia,
// ?noworker=1 força o preparo no fio principal.
const clockOffset = params.has('now') ? new Date(params.get('now')).getTime() - Date.now() : 0;
const now = () => new Date(Date.now() + clockOffset);
const today = () => (params.has('day') ? ((Number(params.get('day')) % 30) + 30) % 30 : dayIndex(now(), START_DATE));

let shownDay = -1, renderer = null, request = 0, wordsTimer = 0, worker = null;

function paperGrain() {
  const n = 256, c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d'), img = ctx.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const k = 1 - 0.03 * hash2(x, y, 5) - 0.03 * vnoise(x / 2.2, y / 2.2, 11) - 0.012 * vnoise(x / 3, y / 34, 9), q = (y * n + x) * 4;
    img.data[q] = 245 * k; img.data[q + 1] = 239 * k; img.data[q + 2] = 228 * k; img.data[q + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  document.body.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
  document.body.style.backgroundSize = '128px 128px';
}

function showWords() { clearTimeout(wordsTimer); words.classList.add('on'); }

function writeWords(day) {
  const q = QUOTES[day];
  document.getElementById('greeting').textContent = `${greeting(now())}, meu bem.`;
  document.getElementById('quote').textContent = q.text;
  document.getElementById('credit').textContent = `${q.author} · ${q.work}`;
}

function sizeCanvas() {
  const cssW = canvas.clientWidth || 360, dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(canvas.width * 4 / 3);
  const cap = window.innerWidth < 700 ? 1.5 : 2;
  return Math.min(cap, Math.max(1, canvas.width / 600));
}

function paint(scene) {
  if (renderer) renderer.stop();
  renderer = createRenderer(canvas, scene);
  if (reduceMotion) { renderer.finish(); showWords(); return; }
  renderer.play(() => { performance.mark('bouquet-first-frame'); });
  clearTimeout(wordsTimer);
  wordsTimer = setTimeout(showWords, WORDS_AT_MS);
}

async function prepareOnMainThread(day, res) {
  const { prepareScene } = await import('./scene/scene.js');
  await new Promise(r => setTimeout(r, 30));   // deixa o papel e o layout aparecerem antes
  return prepareScene(day, { res });
}

function prepare(day, res) {
  if (params.has('noworker') || typeof Worker === 'undefined') return prepareOnMainThread(day, res);
  return new Promise(resolve => {
    const id = ++request;
    let settled = false;
    const fallback = () => { if (!settled) { settled = true; if (worker) worker.terminate(); worker = null; resolve(prepareOnMainThread(day, res)); } };
    try {
      worker = worker || new Worker(new URL('./scene/worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = e => { if (e.data.id === id && !settled) { settled = true; resolve(e.data.scene); } };
      worker.onerror = fallback;
      worker.onmessageerror = fallback;
      worker.postMessage({ id, day, res });
    } catch (err) { fallback(); }
  });
}

async function show(day) {
  shownDay = day;
  words.classList.remove('on');
  writeWords(day);
  clearTimeout(wordsTimer);
  wordsTimer = setTimeout(showWords, WORDS_FALLBACK_MS);
  try {
    const scene = await prepare(day, sizeCanvas());
    if (day === shownDay) paint(scene);
  } catch (err) {
    console.error('Não foi possível pintar o buquê:', err);
    showWords();   // sem pintura, a frase aparece mesmo assim
  }
}

canvas.addEventListener('click', () => { if (renderer && !reduceMotion) renderer.play(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && today() !== shownDay) show(today());
});

paperGrain();
show(today());
