// O modelo do buquê: lírios, botões, folhas e caules que se cruzam num ponto de amarração.

import { TAU, DEG, lerp, clamp, sstep, easeOut, rngFrom, ramp, rotX, rotZ, mmul, mapply } from './util.js';
import { profile, profAt, phiPow, phiTepal, widthFn, makeSurface } from './geometry.js';
import { rasterize } from './gbuffer.js';

export const PALETTES = {
  blue: { dens: 1, front: ramp([[0, 240, 244, 255], [0.2, 150, 180, 240], [0.45, 62, 100, 220], [0.72, 66, 78, 200], [1, 104, 66, 184]]) },
  sky: { dens: 0.95, front: ramp([[0, 240, 248, 255], [0.2, 150, 200, 240], [0.45, 60, 132, 220], [0.72, 62, 100, 208], [1, 88, 80, 196]]) },
  violet: { dens: 0.95, front: ramp([[0, 244, 240, 255], [0.2, 190, 170, 236], [0.45, 124, 88, 204], [0.72, 104, 70, 190], [1, 84, 56, 168]]) },
  white: { dens: 0.6, front: ramp([[0, 250, 250, 255], [0.3, 226, 232, 250], [0.6, 190, 202, 244], [0.85, 150, 154, 232], [1, 122, 104, 206]]) },
  lavender: { dens: 0.78, front: ramp([[0, 246, 244, 255], [0.3, 204, 196, 240], [0.7, 150, 140, 220], [1, 116, 96, 196]]) },
};

// A stem runs from the flower down through the tie and on to its cut end; s = 0 at the cut end, 1 at the flower.
function addStem(M, S) {
  const rng = S.rng, x0 = S.from[0], y0 = S.from[1];
  let dx = S.dir[0], dy = S.dir[1];
  const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const T = [M.tie[0] + (rng() - 0.5) * 11, M.tie[1] + (rng() - 0.5) * 6];
  const E = [M.tie[0] - (x0 - M.tie[0]) * 0.3 + (rng() - 0.5) * 14, M.tie[1] + 108 + rng() * 24];
  let ex = E[0] - T[0], ey = E[1] - T[1];
  const el = Math.hypot(ex, ey); ex /= el; ey /= el;
  const dist = Math.hypot(T[0] - x0, T[1] - y0), frac = dist * 1.04 / (dist * 1.04 + el);
  const P1 = [x0 + dx * dist * 0.34, y0 + dy * dist * 0.34], P2 = [T[0] - ex * dist * 0.42, T[1] - ey * dist * 0.42];
  const pos = u => {
    if (u > frac) { const w = (u - frac) / (1 - frac); return [T[0] + ex * el * w, T[1] + ey * el * w]; }
    const w = u / frac, a = (1 - w) * (1 - w) * (1 - w), b = 3 * (1 - w) * (1 - w) * w, c = 3 * (1 - w) * w * w, d = w * w * w;
    return [a * x0 + b * P1[0] + c * P2[0] + d * T[0], a * y0 + b * P1[1] + c * P2[1] + d * T[1]];
  };
  const tan = u => { const a = pos(Math.max(0, u - 0.004)), b = pos(Math.min(1, u + 0.004)), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const zAt = u => lerp(S.z - 2, -230 + S.k * 3, sstep(0, 0.45, u));
  const hw0 = S.hw;
  const sf = makeSurface('stem', (s, v) => {
    const u = 1 - s, p = pos(u), t = tan(u), hw = hw0 * lerp(1.12, 0.92, s);
    return [p[0] - t[1] * v * hw, p[1] + t[0] * v * hw, zAt(u) + (1 - v * v) * hw];
  }, 64, 2, 0, 1);
  sf.NZ.fill(1); sf.wn = () => 1; sf.halfW = hw0; sf.t0 = S.t0; sf.dur = 0.62; sf.ease = easeOut; sf.tone = rng();
  M.surfaces.push(sf);
  for (const lf of S.leaves || []) {
    const u = lf[0] * frac, node = pos(u);
    let tt = 0;
    while (tt < sf.dur && easeOut(tt / sf.dur) < 1 - u) tt += 0.01;
    addLeaf(M, node, zAt(u), (lf[1] > 0 ? 0 : 180) * DEG + (rng() - 0.5) * 50 * DEG, lf[2] * (0.88 + rng() * 0.24), S.t0 + tt, rng);
  }
}
function addLeaf(M, node, nz0, al, len, t0, rng) {
  const W = len * 0.105, pf = profile(phiPow((24 + rng() * 16) * DEG, (86 + rng() * 36) * DEG, 1.25), 100);
  const wn = widthFn(0.55, 1.0), cup = 0.5, twist = (rng() - 0.5) * 0.9, ca = Math.cos(al), sa = Math.sin(al);
  const sf = makeSurface('leaf', (s, v) => {
    const pr = profAt(pf, s), w = W * wn(s), h = cup * w * v * v, tw = twist * s;
    const lat = v * w * Math.cos(tw) - h * Math.sin(tw), nor = v * w * Math.sin(tw) + h * Math.cos(tw);
    const rad = len * pr[0] - Math.cos(pr[2]) * nor, up = len * pr[1] + Math.sin(pr[2]) * nor;
    return [node[0] + rad * ca - lat * sa, node[1] - up, nz0 + rad * sa + lat * ca];
  }, 30, 8, 0.01, 0.996);
  sf.wn = wn; sf.halfW = W; sf.t0 = t0; sf.dur = 0.62; sf.tone = rng();
  M.surfaces.push(sf);
}

function addLily(M, P) {
  const rng = rngFrom(P.seed), L = P.L, open = P.open === undefined ? 1 : P.open, pal = PALETTES[P.pal];
  const R = mmul(rotZ(P.roll * DEG), mmul(rotX(-P.tilt * DEG), rotZ((P.spin || 0) * DEG)));
  const toScreen = p => { const q = mapply(R, p); return [P.cx + q[0], P.cy - q[1], P.z + q[2]]; };
  const A = mapply(R, [0, 0, 1]);
  addStem(M, { rng, from: [P.cx, P.cy], dir: [-A[0], A[1]], z: P.z, k: P.k, t0: P.t0, leaves: P.leaves, hw: clamp(L * 0.0135, 1.9, 2.8) });

  const mine = [];
  for (let i = 0; i < 6; i++) {
    const inner = i % 2 === 0;
    const tp = {
      theta: i * 60 * DEG + (rng() - 0.5) * 7 * DEG,
      len: L * (inner ? 1 : 0.97) * (0.96 + rng() * 0.08),
      W: L * (inner ? 0.176 : 0.122) * (0.94 + rng() * 0.12),
      phi0: ((inner ? 28 : 34) + (rng() - 0.5) * 6) * DEG,
      phiF: lerp(46, (inner ? 86 : 94) + (rng() - 0.5) * 10, open) * DEG,
      phi1: lerp(72, (inner ? 160 : 184) + (rng() - 0.5) * 30, open) * DEG,
      cup0: 0.6, cup1: -0.32,
      ruffAmp: inner ? 0.26 : 0.1, ruffFreq: inner ? 3.1 : 2.3, ruffPhase: rng() * TAU,
      twist: (rng() - 0.5) * 0.55, bend: (rng() - 0.5) * 0.09,
      inset: inner ? L * 0.022 : 0, r0: L * 0.022,
    };
    const pf = profile(phiTepal(tp.phi0, tp.phiF, tp.phi1), 160), wn = widthFn(inner ? 0.85 : 0.95, inner ? 1.3 : 1.45);
    const ct = Math.cos(tp.theta), st = Math.sin(tp.theta);
    const sf = makeSurface('tepal', (s, v) => {
      const pr = profAt(pf, s), ph = pr[2], w = tp.W * wn(s), av = Math.abs(v);
      let h = lerp(tp.cup0, tp.cup1, sstep(0.1, 0.95, s)) * w * v * v;
      h += tp.ruffAmp * w * Math.pow(av, 2.5) * Math.sin(TAU * tp.ruffFreq * s + tp.ruffPhase + (v > 0 ? 0 : 2.1)) * sstep(0.12, 0.45, s);
      const tw = tp.twist * s * s;
      const lat = v * w * Math.cos(tw) - h * Math.sin(tw) + tp.bend * tp.len * s * s;
      const nor = v * w * Math.sin(tw) + h * Math.cos(tw) + tp.inset;
      const rad = tp.r0 + tp.len * pr[0] - Math.cos(ph) * nor, ax = tp.len * pr[1] + Math.sin(ph) * nor;
      return toScreen([rad * ct - lat * st, rad * st + lat * ct, ax]);
    }, 44, 14, 0.012, 0.996);
    sf.inner = inner; sf.wn = wn; sf.halfW = tp.W; sf.tone = rng(); sf.pal = pal; sf.L = L;
    mine.push(sf); M.surfaces.push(sf); M.tepals.push(sf);
  }
  mine.slice().sort((a, b) => a.zMean - b.zMean).forEach((sf, rank) => { sf.t0 = P.t0 + 0.4 + rank * 0.07; sf.dur = 0.95; });

  const curve = (th, pf, len, t0, dur, role) => {
    const Mn = 26, n = Mn + 1, ct = Math.cos(th), st = Math.sin(th);
    const px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n), ps = new Float32Array(n);
    for (let m = 0; m <= Mn; m++) {
      const pr = profAt(pf, m / Mn), rad = L * 0.012 + len * pr[0], p = toScreen([rad * ct, rad * st, len * pr[1]]);
      px[m] = p[0]; py[m] = p[1]; pz[m] = p[2]; ps[m] = m / Mn;
    }
    const c = { px, py, pz, ps, n, role, L, tipX: px[Mn], tipY: py[Mn], tipZ: pz[Mn], dirX: px[Mn] - px[Mn - 3], dirY: py[Mn] - py[Mn - 3], t0, dur, s0: 0, s1: 1, ease: easeOut };
    M.curves.push(c);
    return c;
  };
  const spread = lerp(0.5, 1, open), reach = lerp(0.8, 1, open);
  for (let i = 0; i < 6; i++) {
    const c = curve(i * 60 * DEG + (rng() - 0.5) * 16 * DEG, profile(phiPow((5 + rng() * 5) * DEG, (40 + rng() * 18) * DEG * spread, 1.7), 50), L * (0.52 + rng() * 0.1) * reach, P.t0 + 1.05 + i * 0.03, 0.45, 'filament');
    c.ang = Math.atan2(c.dirY, c.dirX) + Math.PI / 2 + (rng() - 0.5) * 1.1;
    c.alen = L * 0.046; c.awid = L * 0.017;
  }
  const pc = curve(rng() * TAU, profile(phiPow(2 * DEG, (10 + rng() * 10) * DEG, 1.5), 50), L * 0.68 * reach, P.t0 + 1.1, 0.5, 'pistil');
  const r = L * 0.018, a0 = Math.atan2(pc.dirY, pc.dirX);
  pc.stigma = [0, 1, 2].map(i => [pc.tipX + Math.cos(a0 + i * TAU / 3) * r * 0.8, pc.tipY + Math.sin(a0 + i * TAU / 3) * r * 0.8, r]);
}

// A closed bud: a spindle with three soft ridges. Its seam (v = ±1) sits on the far side.
function addBud(M, P) {
  const rng = rngFrom(P.seed);
  const R = mmul(rotZ(P.roll * DEG), rotX(-P.tilt * DEG));
  const toScreen = p => { const q = mapply(R, p); return [P.cx + q[0], P.cy - q[1], P.z + q[2]]; };
  const A = mapply(R, [0, 0, 1]);
  addStem(M, { rng, from: [P.cx, P.cy], dir: [-A[0], A[1]], z: P.z, k: P.k, t0: P.t0, leaves: P.leaves, hw: 1.9 });
  const wn = s => Math.pow(Math.sin(Math.PI * Math.pow(clamp(s, 0, 1), 0.72)), 0.8), ph0 = rng() * TAU;
  const sf = makeSurface('bud', (s, v) => {
    const psi = v * Math.PI - Math.PI / 2, rb = P.rad * wn(s) * (1 + 0.07 * Math.cos(3 * psi + ph0));
    return toScreen([rb * Math.cos(psi), rb * Math.sin(psi), P.len * s]);
  }, 30, 24, 0.02, 0.985);
  sf.wn = wn; sf.halfW = P.rad; sf.t0 = P.t0 + 0.42; sf.dur = 0.7; sf.tone = rng(); sf.ph0 = ph0; sf.pal = PALETTES[P.pal || 'blue'];
  M.surfaces.push(sf);
}

const FLOWERS = [
  { cx: 304, cy: 318, L: 168, tilt: 42, roll: -5, spin: 0, z: 60, leaves: [[0.7, 1, 120], [0.8, -1, 128]] },
  { cx: 168, cy: 372, L: 142, tilt: 58, roll: 34, spin: 20, z: 15, leaves: [[0.55, -1, 104]] },
  { cx: 442, cy: 366, L: 146, tilt: 56, roll: -36, spin: 40, z: 5, leaves: [[0.55, 1, 108]] },
  { cx: 214, cy: 196, L: 134, tilt: 50, roll: 16, spin: 10, z: -70, open: 0.9, leaves: [] },
  { cx: 396, cy: 186, L: 126, tilt: 60, roll: -18, spin: 50, z: -85, open: 0.6, leaves: [] },
];
const BUDS = [
  { cx: 104, cy: 236, len: 66, rad: 12.5, tilt: 80, roll: 30, z: -110, leaves: [[0.35, -1, 84]] },
  { cx: 512, cy: 228, len: 60, rad: 11.5, tilt: 82, roll: -30, z: -110, leaves: [[0.4, 1, 80]] },
  { cx: 300, cy: 96, len: 56, rad: 10.5, tilt: 84, roll: 4, z: -130, leaves: [] },
];
const SIDE_PALETTES = ['violet', 'sky', 'white', 'lavender'];

// O buquê do dia. Fixos: lírio central azul e maior, ponto de amarração, paleta.
// Variam com o dia: forma das pétalas, pequenos deslocamentos e inclinações, que flor
// lateral leva qual tom, dois ou três botões, comprimento das folhas.
export function buildBouquet(day, opt) {
  const o = Object.assign({ W: 600, H: 800, res: 1.5 }, opt || {});
  const rng = rngFrom(1000 + day), jit = a => (rng() - 0.5) * 2 * a;
  const M = { o, surfaces: [], curves: [], tepals: [], tie: [300, 618], total: 5, bias: 2.4, flowers: [], budCount: 0 };
  const pals = SIDE_PALETTES.slice();
  for (let i = pals.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; [pals[i], pals[j]] = [pals[j], pals[i]]; }
  FLOWERS.forEach((f, k) => {
    const P = Object.assign({}, f, {
      k, t0: 0.05 + k * 0.55, seed: 7919 * (day + 1) + 101 * k, pal: k === 0 ? 'blue' : pals[k - 1],
      cx: f.cx + jit(k === 0 ? 5 : 10), cy: f.cy + jit(k === 0 ? 5 : 10), tilt: f.tilt + jit(5), roll: f.roll + jit(6), spin: f.spin + jit(30),
    });
    addLily(M, P);
    M.flowers.push({ pal: P.pal, cx: P.cx, cy: P.cy, L: P.L });
  });
  M.budCount = rng() < 0.5 ? 2 : 3;
  const budPals = ['violet', 'blue', 'lavender'];
  BUDS.slice(0, M.budCount).forEach((b, k) => addBud(M, Object.assign({}, b, {
    k: 5 + k, t0: 2.7 + k * 0.25, seed: 104729 * (day + 1) + 17 * k, pal: budPals[(k + day) % 3],
    cx: b.cx + jit(8), cy: b.cy + jit(8), roll: b.roll + jit(6),
  })));
  M.g = rasterize(M.surfaces, o.W, o.H, o.res);
  return M;
}
