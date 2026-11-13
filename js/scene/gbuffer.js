// Rasterizador em software: profundidade e atributos por pixel, e teste de visibilidade.

import { lerp } from './util.js';

export function rasterize(surfaces, W, H, R) {
  const w = Math.round(W * R), h = Math.round(H * R), n = w * h;
  const zb = new Float32Array(n).fill(-1e9), sb = new Float32Array(n), vb = new Float32Array(n), nb = new Float32Array(n), ib = new Int8Array(n).fill(-1);
  function tri(sf, k, a, sa, va, b, sb_, vb_, c, sc, vc) {
    const x0 = sf.X[a] * R, y0 = sf.Y[a] * R, x1 = sf.X[b] * R, y1 = sf.Y[b] * R, x2 = sf.X[c] * R, y2 = sf.Y[c] * R;
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(area) < 1e-9) return;
    const minx = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxx = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2)));
    const miny = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxy = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2)));
    const inv = 1 / area, z0 = sf.Z[a], z1 = sf.Z[b], z2 = sf.Z[c], n0 = sf.NZ[a], n1 = sf.NZ[b], n2 = sf.NZ[c];
    for (let y = miny; y <= maxy; y++) {
      const py = y + 0.5;
      for (let x = minx; x <= maxx; x++) {
        const px = x + 0.5;
        const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) * inv, w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) * inv, w2 = 1 - w0 - w1;
        if (w0 < -0.001 || w1 < -0.001 || w2 < -0.001) continue;
        const z = w0 * z0 + w1 * z1 + w2 * z2, p = y * w + x;
        if (z > zb[p]) { zb[p] = z; ib[p] = k; sb[p] = w0 * sa + w1 * sb_ + w2 * sc; vb[p] = w0 * va + w1 * vb_ + w2 * vc; nb[p] = w0 * n0 + w1 * n1 + w2 * n2; }
      }
    }
  }
  surfaces.forEach((sf, k) => {
    const row = sf.nV + 1;
    for (let i = 0; i < sf.nS; i++) {
      const sA = lerp(sf.s0, sf.s1, i / sf.nS), sB = lerp(sf.s0, sf.s1, (i + 1) / sf.nS);
      for (let j = 0; j < sf.nV; j++) {
        const vA = -1 + 2 * j / sf.nV, vB = -1 + 2 * (j + 1) / sf.nV, a = i * row + j, b = a + 1, c = a + row, d = c + 1;
        tri(sf, k, a, sA, vA, b, sA, vB, c, sB, vA);
        tri(sf, k, b, sA, vB, d, sB, vB, c, sB, vA);
      }
    }
  });
  return { w, h, R, zb, sb, vb, nb, ib };
}
export function isVisible(g, x, y, z, bias) {
  const xi = (x * g.R) | 0, yi = (y * g.R) | 0, d = Math.max(1, g.R | 0);
  if (xi < d || yi < d || xi >= g.w - d || yi >= g.h - d) return true;
  let m = 1e9;
  for (let oy = -d; oy <= d; oy += d) for (let ox = -d; ox <= d; ox += d) { const q = g.zb[(yi + oy) * g.w + xi + ox]; if (q < m) m = q; }
  return z >= m - bias;
}
