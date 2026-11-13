// Aquarela por pixel. O resultado é um mapa de "fatores de pigmento": branco onde não
// há tinta, e a cor que multiplica o papel onde há. O papel em si é o fundo da página.

import { lerp, clamp, sstep, hash2, vnoise, fbm, ramp, mix3 } from './util.js';

// Grau de abstração "Solto", escolhido no protótipo.
export const SOLTO = { warp: 4.5, detail: 1, broken: 0.55, freckles: 3, gaps: 0.75, bleed: 0.22, bg: 0.7, pool: 0.8, lineA: 0.85 };

const leafR = ramp([[0, 96, 140, 96], [0.5, 78, 128, 104], [1, 104, 150, 120]]);
const VIOLET = [118, 70, 190], CERULEAN = [58, 146, 214], PALE = [206, 206, 236];
const WARP_CELL = 16;

// A cor escapa do traço: cada pixel olha para um ponto levemente deslocado do modelo.
// O campo de deslocamento é suave, então é amostrado numa grade e interpolado.
function warpField(g, amount) {
  const A = amount * g.R, lam = 92 * g.R, gw = Math.ceil(g.w / WARP_CELL) + 2, gh = Math.ceil(g.h / WARP_CELL) + 2;
  const dx = new Float32Array(gw * gh), dy = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const x = i * WARP_CELL, y = j * WARP_CELL;
    dx[j * gw + i] = A * (2 * vnoise(x / lam, y / lam, 201) - 1) + A * 0.4 * (2 * vnoise(x / (lam * 0.3), y / (lam * 0.3), 205) - 1);
    dy[j * gw + i] = A * (2 * vnoise(x / lam, y / lam, 203) - 1) + A * 0.4 * (2 * vnoise(x / (lam * 0.3), y / (lam * 0.3), 207) - 1);
  }
  return { gw, dx, dy };
}

function bounds(model, margin) {
  const R = model.g.R;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const sf of model.surfaces) for (let k = 0; k < sf.X.length; k++) {
    if (sf.X[k] < x0) x0 = sf.X[k]; if (sf.X[k] > x1) x1 = sf.X[k];
    if (sf.Y[k] < y0) y0 = sf.Y[k]; if (sf.Y[k] > y1) y1 = sf.Y[k];
  }
  return [Math.max(0, Math.floor((x0 - margin) * R)), Math.max(0, Math.floor((y0 - margin) * R)), Math.min(model.g.w, Math.ceil((x1 + margin) * R)), Math.min(model.g.h, Math.ceil((y1 + margin) * R))];
}

export function paintWash(model, K) {
  const g = model.g, sc = g.R, w = g.w, h = g.h, data = new Uint8ClampedArray(w * h * 4).fill(255);
  const [bx0, by0, bx1, by1] = bounds(model, K.warp * 1.5 + 6);
  const wf = K.warp > 0 ? warpField(g, K.warp) : null;
  const e1 = Math.max(1, Math.round(sc)), e2 = Math.max(2, Math.round(sc * 2.5));
  const diff = (q, k, z) => (g.ib[q] !== k || Math.abs(g.zb[q] - z) > 7 ? 1 : 0);

  for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) {
    let sx = x, sy = y;
    if (wf) {
      const gx = x / WARP_CELL, gy = y / WARP_CELL, i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, a = j * wf.gw + i, b = a + wf.gw;
      sx = Math.round(x + lerp(lerp(wf.dx[a], wf.dx[a + 1], fx), lerp(wf.dx[b], wf.dx[b + 1], fx), fy));
      sy = Math.round(y + lerp(lerp(wf.dy[a], wf.dy[a + 1], fx), lerp(wf.dy[b], wf.dy[b + 1], fx), fy));
    }
    if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
    const p = sy * w + sx, k = g.ib[p];
    if (k < 0) continue;
    let edge = 0;
    if (sx >= e2 && sy >= e2 && sx < w - e2 && sy < h - e2) {
      const z = g.zb[p];
      edge = 0.6 * Math.min(1, diff(p - e1, k, z) + diff(p + e1, k, z) + diff(p - e1 * w, k, z) + diff(p + e1 * w, k, z))
           + 0.4 * Math.min(1, diff(p - e2, k, z) + diff(p + e2, k, z) + diff(p - e2 * w, k, z) + diff(p + e2 * w, k, z));
    }
    const sf = model.surfaces[k], s = g.sb[p], v = g.vb[p], nz = g.nb[p], av = Math.abs(v);
    let pig, d;
    if (sf.kind === 'tepal') {
      const streak = fbm(v * 7 + sf.tone * 40, s * 1.6, 21), bloom = vnoise(x / (40 * sc), y / (40 * sc), 31), hue = fbm(x / (88 * sc), y / (88 * sc), 47);
      if (nz >= 0) {
        pig = sf.pal.front(s);
        d = 0.05 + 0.82 * sstep(0.02, 0.42, s);
        d *= 1 - 0.5 * Math.pow(1 - av, 5) * (1 - sstep(0.32, 0.8, s));
      } else { pig = mix3(sf.pal.front(0.3 + 0.6 * s), PALE, 0.5); d = 0.62; }
      pig = mix3(pig, VIOLET, 0.5 * sstep(0.5, 0.78, hue));
      pig = mix3(pig, CERULEAN, 0.42 * sstep(0.5, 0.22, hue));
      d *= sf.pal.dens * (0.7 + 0.5 * streak) * (0.78 + 0.44 * bloom) * (0.86 + 0.24 * (1 - Math.abs(nz)));
      const pool = sstep(0.8, 1, av) * K.pool;
      d += 0.2 * pool; pig = mix3(pig, [48, 52, 150], 0.3 * pool);
    } else if (sf.kind === 'bud') {
      pig = mix3(mix3([150, 178, 132], sf.pal.front(0.5), sstep(0.15, 0.6, s)), sf.pal.front(0.85), sstep(0.6, 1, s));
      const ridge = 0.5 + 0.5 * Math.cos(3 * (v * Math.PI - Math.PI / 2) + sf.ph0);
      d = (0.5 + 0.18 * ridge) * (0.72 + 0.5 * (1 - Math.abs(nz))) * (0.8 + 0.4 * vnoise(x / (30 * sc), y / (30 * sc), 53));
    } else if (sf.kind === 'leaf') {
      pig = mix3(leafR(s), [66, 108, 150], 0.45 * vnoise(x / (36 * sc), y / (36 * sc), 77));
      d = (nz >= 0 ? 0.74 : 0.56) * (0.74 + 0.5 * fbm(v * 5 + sf.tone * 30, s * 2, 61)) * (1 - 0.3 * Math.pow(1 - av, 6));
      d += 0.2 * sstep(0.78, 1, av) * K.pool;
    } else { pig = mix3([100, 142, 98], [84, 122, 120], sf.tone); d = 0.74 * (0.5 + 0.5 * sstep(0, 0.12, s)); }
    if (K.gaps > 0 && sf.kind !== 'stem') d *= 1 - K.gaps * 0.9 * sstep(0.6, 0.74, fbm(x / (27 * sc), y / (27 * sc), 91));
    d += 0.34 * edge * K.pool * (sf.kind === 'stem' ? 0.3 : 1);
    pig = mix3(pig, [40, 40, 110], 0.22 * edge * K.pool);
    d = clamp(d * (0.9 + 0.2 * hash2(x, y, 88)), 0, 1.08);
    const o4 = (y * w + x) * 4;
    data[o4] = 255 * (1 - d * (1 - pig[0] / 255)); data[o4 + 1] = 255 * (1 - d * (1 - pig[1] / 255)); data[o4 + 2] = 255 * (1 - d * (1 - pig[2] / 255));
  }
  if (K.bleed > 0) bleed(data, w, h, [bx0, by0, bx1, by1], K.bleed);
  return { w, h, data };
}

// Pigmento escorrendo no papel molhado: mistura de volta uma cópia bem desfocada.
function bleed(data, w, h, box, amount) {
  const C = 10, sw = Math.ceil(w / C) + 1, sh = Math.ceil(h / C) + 1, small = new Float32Array(sw * sh * 3), cnt = new Uint16Array(sw * sh);
  const [x0, y0, x1, y1] = box;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = ((y / C) | 0) * sw + ((x / C) | 0), o = (y * w + x) * 4;
    small[c * 3] += data[o]; small[c * 3 + 1] += data[o + 1]; small[c * 3 + 2] += data[o + 2]; cnt[c]++;
  }
  for (let c = 0; c < sw * sh; c++) { const n = cnt[c]; if (n) { small[c * 3] /= n; small[c * 3 + 1] /= n; small[c * 3 + 2] /= n; } else small[c * 3] = small[c * 3 + 1] = small[c * 3 + 2] = 255; }
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const gx = Math.max(0, (x + 0.5) / C - 0.5), gy = Math.max(0, (y + 0.5) / C - 0.5), i = Math.min(sw - 2, gx | 0), j = Math.min(sh - 2, gy | 0), fx = gx - i, fy = gy - j;
    const a = (j * sw + i) * 3, b = a + sw * 3, o = (y * w + x) * 4;
    for (let ch = 0; ch < 3; ch++) {
      const blur = lerp(lerp(small[a + ch], small[a + 3 + ch], fx), lerp(small[b + ch], small[b + 3 + ch], fx), fy);
      data[o + ch] = lerp(data[o + ch], blur, amount);
    }
  }
}

// Nuvens de tinta diluída atrás do buquê, em 1/4 da resolução (são difusas mesmo).
const CLOUDS = [[150, 170, 165, [150, 182, 236], 0.2], [452, 190, 150, [182, 164, 230], 0.18], [300, 430, 200, [160, 190, 238], 0.15], [118, 440, 115, [166, 198, 176], 0.14], [486, 452, 115, [176, 168, 232], 0.14]];
export function paintClouds(model, K) {
  const o = model.o, q = model.g.R / 4, w = Math.ceil(o.W * q), h = Math.ceil(o.H * q), data = new Uint8ClampedArray(w * h * 4).fill(255);
  if (K.bg <= 0) return { w, h, data };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const lx = x / q, ly = y / q, tex = 0.35 + 1.0 * fbm(lx / 46, ly / 46, 301);
    let r = 1, gg = 1, b = 1;
    for (const c of CLOUDS) {
      const dd = Math.hypot(lx - c[0], ly - c[1]) / c[2];
      if (dd >= 1) continue;
      const d = K.bg * c[4] * sstep(1, 0.25, dd) * tex * sstep(0.28, 0.5, fbm(lx / 30 + c[0], ly / 30, 311));
      r *= 1 - d * (1 - c[3][0] / 255); gg *= 1 - d * (1 - c[3][1] / 255); b *= 1 - d * (1 - c[3][2] / 255);
    }
    const o4 = (y * w + x) * 4;
    data[o4] = 255 * r; data[o4 + 1] = 255 * gg; data[o4 + 2] = 255 * b;
  }
  return { w, h, data };
}
