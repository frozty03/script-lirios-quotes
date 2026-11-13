// O que é desenhado ao longo do tempo, como dados: contornos a lápis que crescem,
// carimbos (pólen, sardas, barbante, respingos) e as pinceladas que revelam a aquarela.

import { TAU, lerp, sstep, easeOut, noise1 } from './util.js';
import { evalS } from './geometry.js';
import { isVisible } from './gbuffer.js';

const PENCIL = 'rgb(62,70,118)';
const ROLE = {
  edge: { a: 0.5, w: 0.85, color: PENCIL }, rib: { a: 0.26, w: 0.8, color: PENCIL }, vein: { a: 0.14, w: 0.7, color: PENCIL },
  filament: { a: 0.8, w: 1.25, color: 'rgb(132,160,98)' }, pistil: { a: 0.8, w: 1.6, color: 'rgb(140,172,112)' },
};
const easeName = tm => (tm.ease === easeOut ? 'out' : 'io');

function surfLine(model, sf, vv, n, sa, sb) {
  const px = new Float32Array(n + 1), py = new Float32Array(n + 1), ps = new Float32Array(n + 1), vis = new Uint8Array(n + 1);
  for (let m = 0; m <= n; m++) {
    const s = lerp(sa, sb, m / n), e = evalS(sf, s, vv);
    px[m] = e[0]; py[m] = e[1]; ps[m] = s; vis[m] = isVisible(model.g, e[0], e[1], e[2], model.bias) ? 1 : 0;
  }
  return { px, py, ps, vis, n: n + 1 };
}
function visibleRuns(line, vis) {
  const out = [];
  let start = 0, on = 0;
  for (let m = 0; m <= line.n; m++) {
    const k = m < line.n ? vis[m] : 0;
    if (k !== on) {
      const end = Math.min(line.n, m + 1);
      if (on && end - start >= 2) out.push({ px: line.px.slice(start, end), py: line.py.slice(start, end), ps: line.ps.slice(start, end) });
      start = m; on = k;
    }
  }
  return out;
}
// Linhas de dobra: onde a superfície vira as costas para quem olha.
function silhouettes(model, sf) {
  const out = [], row = sf.nV + 1, { X, Y, Z, NZ } = sf;
  const ip = (a, b) => { const t = NZ[a] / (NZ[a] - NZ[b]); return [lerp(X[a], X[b], t), lerp(Y[a], Y[b], t), lerp(Z[a], Z[b], t)]; };
  for (let i = 1; i < sf.nS - 1; i++) for (let j = 0; j < sf.nV; j++) {
    const a = i * row + j, b = a + 1, c = a + row + 1, d = a + row, pts = [];
    if ((NZ[a] < 0) !== (NZ[b] < 0)) pts.push(ip(a, b));
    if ((NZ[b] < 0) !== (NZ[c] < 0)) pts.push(ip(b, c));
    if ((NZ[c] < 0) !== (NZ[d] < 0)) pts.push(ip(c, d));
    if ((NZ[d] < 0) !== (NZ[a] < 0)) pts.push(ip(d, a));
    const s = lerp(sf.s0, sf.s1, (i + 0.5) / sf.nS);
    for (let q = 0; q + 1 < pts.length; q += 2) {
      const A = pts[q], B = pts[q + 1];
      if (isVisible(model.g, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2, model.bias)) out.push({ px: Float32Array.of(A[0], B[0]), py: Float32Array.of(A[1], B[1]), ps: Float32Array.of(s, s + 0.004) });
    }
  }
  return out;
}

export function buildStrokes(model, K, rng) {
  const out = [], wobble = noise1(rng);
  let id = 0;
  const push = (run, role, tm, kind) => {
    const R = ROLE[role], alpha = new Float32Array(run.ps.length), sid = id++;
    for (let m = 0; m < alpha.length; m++) {
      const s = run.ps[m];
      let a = R.a;
      if (kind === 'stem') a *= 0.75 * (0.35 + 0.65 * sstep(0, 0.14, s));
      if (K.broken > 0 && role !== 'filament' && role !== 'pistil') a *= 1 - K.broken * sstep(-0.25, 0.25, wobble(sid * 3.17 + s * 5));
      alpha[m] = a * K.lineA;
    }
    out.push({ px: run.px, py: run.py, ps: run.ps, alpha, width: R.w, color: R.color, t0: tm.t0, dur: tm.dur, s0: tm.s0, s1: tm.s1, ease: easeName(tm) });
  };
  for (const sf of model.surfaces) {
    const add = (vv, sa, sb, role) => { const line = surfLine(model, sf, vv, 80, sa, sb); for (const r of visibleRuns(line, line.vis)) push(r, role, sf, sf.kind); };
    if (K.detail === 0 && sf.kind !== 'tepal' && sf.kind !== 'bud') continue;
    if (sf.kind !== 'bud') { add(-1, sf.s0, sf.s1, 'edge'); add(1, sf.s0, sf.s1, 'edge'); }
    if (sf.kind !== 'stem') for (const r of silhouettes(model, sf)) push(r, 'edge', sf, sf.kind);
    if (K.detail >= 1 && (sf.kind === 'tepal' || sf.kind === 'leaf')) add(0, sf.s0, lerp(sf.s0, sf.s1, 0.93), 'rib');
    if (K.detail >= 1 && sf.kind === 'bud') for (const vv of [0.5, -0.167, -0.833]) add(vv, 0.08, 0.95, 'rib');
    if (K.detail >= 2 && sf.kind === 'tepal') for (const [vv, a, b] of [[-0.36, 0.07, 0.88], [0.36, 0.07, 0.88], [-0.68, 0.12, 0.76], [0.68, 0.12, 0.76]]) add(vv, a, b, 'vein');
  }
  if (K.detail >= 1) for (const c of model.curves) {
    const vis = new Uint8Array(c.n);
    for (let m = 0; m < c.n; m++) vis[m] = isVisible(model.g, c.px[m], c.py[m], c.pz[m], model.bias) ? 1 : 0;
    for (const r of visibleRuns(c, vis)) push(r, c.role, c, 'curve');
  }
  return out;
}

export function buildStamps(model, K, rng) {
  const out = [], loose = K.warp / 8, T = model.tie;
  const dot = (t0, dur, n, x, y, r, color, alpha) => out.push({ t0, dur, n, shape: 'ellipse', x, y, rx: r, ry: r, ang: 0, color, alpha });
  for (const c of model.curves) {
    if (c.role === 'filament') {
      const grow = 1 + 0.5 * loose;
      out.push({ t0: c.t0 + c.dur - 0.08, dur: 0.32, n: 5, shape: 'ellipse', x: c.tipX + (rng() - 0.5) * K.warp * 1.2, y: c.tipY + (rng() - 0.5) * K.warp * 1.2, rx: c.alen * grow * (0.9 + 0.2 * rng()), ry: c.awid * grow * (0.95 + 0.4 * rng()), ang: c.ang, color: 'rgb(208,112,28)', alpha: 0.34 });
    } else for (const d of c.stigma) dot(c.t0 + c.dur - 0.08, 0.25, 4, d[0], d[1], d[2], 'rgb(118,78,160)', 0.3);
  }
  // sardas perto da garganta de cada flor
  for (const sf of model.tepals) for (let i = 0; i < K.freckles; i++) {
    const e = evalS(sf, 0.14 + rng() * 0.34, (rng() - 0.5) * 1.3), x = e[0], y = e[1], z = e[2], facing = e[3], r = (0.55 + rng() * 0.8) * sf.L / 190, t0 = 4.2 + rng() * 0.6;
    if (facing > 0.1 && isVisible(model.g, x, y, z, model.bias)) dot(t0, 0.1, 1, x, y, r, 'rgb(70,40,138)', 0.6);
  }
  // barbante dourado: quatro voltas e duas pontas soltas
  for (let i = 0; i < 4; i++) {
    const y = T[1] - 7 + i * 4.6, pts = [T[0] - 15, y + 2.4, T[0], y - 2.2, T[0] + 15, y + 2.6], t0 = 4.22 + i * 0.09;
    out.push({ t0, dur: 0.12, n: 2, shape: 'quad', pts, color: 'rgb(176,128,52)', alpha: 0.48, width: 2.5 });
    out.push({ t0, dur: 0.12, n: 2, shape: 'quad', pts, color: 'rgb(96,64,30)', alpha: 0.3, width: 0.7 });
  }
  out.push({ t0: 4.6, dur: 0.2, n: 3, shape: 'bezier', pts: [T[0] + 12, T[1] + 4, T[0] + 30, T[1] + 6, T[0] + 30, T[1] + 30, T[0] + 42, T[1] + 40], color: 'rgb(176,128,52)', alpha: 0.34, width: 1.7 });
  out.push({ t0: 4.6, dur: 0.2, n: 3, shape: 'bezier', pts: [T[0] + 11, T[1] + 6, T[0] + 20, T[1] + 18, T[0] + 12, T[1] + 34, T[0] + 22, T[1] + 48], color: 'rgb(176,128,52)', alpha: 0.34, width: 1.7 });
  // respingos de um pincel carregado
  for (let i = 0; i < 16 + 14 * loose; i++) {
    const an = rng() * TAU, rr = 150 + rng() * 150;
    dot(4.4 + rng() * 0.5, 0.1, 1, 300 + Math.cos(an) * rr * 1.05, 300 + Math.sin(an) * rr * 0.95, 0.8 + rng() * rng() * (3.4 + 2.5 * loose), rng() < 0.5 ? 'rgb(70,110,222)' : 'rgb(112,74,190)', 0.26 + 0.2 * rng());
  }
  return out;
}

// A aquarela aparece onde o "pincel" já passou: manchas macias ao longo de cada forma.
export function buildDabs(model, K) {
  const spread = 9 + K.warp * 1.6, out = [];
  for (const sf of model.surfaces) {
    const s = [], x = [], y = [], r = [];
    for (let t = sf.s0; t < sf.s1; t += 0.02) {
      const hw = sf.halfW * sf.wn(t), R = hw * 0.8 + spread;
      for (const vv of hw > 12 ? [-0.55, 0, 0.55] : [0]) { const e = evalS(sf, t, vv); s.push(t); x.push(e[0]); y.push(e[1]); r.push(R); }
    }
    out.push({ t0: sf.t0 + 0.18, dur: sf.dur, s0: sf.s0, s1: sf.s1, ease: easeName(sf), s: Float32Array.from(s), x: Float32Array.from(x), y: Float32Array.from(y), r: Float32Array.from(r) });
  }
  return out;
}
