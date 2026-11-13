// Superfícies paramétricas (tépalas, folhas, caules, botões) já projetadas na tela.

import { lerp, clamp, sstep, easeIO } from './util.js';

// Midrib of a tepal/leaf in the (radial, axial) plane, from its tangent angle phi(s) measured from the axis.
export function profile(phi, n) {
  const r = new Float32Array(n + 1), z = new Float32Array(n + 1), ph = new Float32Array(n + 1);
  let rr = 0, zz = 0;
  const ds = 1 / n;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    ph[i] = phi(s);
    if (i > 0) { const pm = phi(s - ds / 2); rr += Math.sin(pm) * ds; zz += Math.cos(pm) * ds; }
    r[i] = rr; z[i] = zz;
  }
  return { r, z, ph, n };
}
export function profAt(pf, s) {
  const x = clamp(s, 0, 1) * pf.n, i = Math.min(pf.n - 1, x | 0), f = x - i;
  return [lerp(pf.r[i], pf.r[i + 1], f), lerp(pf.z[i], pf.z[i + 1], f), lerp(pf.ph[i], pf.ph[i + 1], f)];
}
export const phiPow = (p0, p1, gamma) => s => p0 + (p1 - p0) * Math.pow(s, gamma);
// A lily tepal rises out of the throat, flares flat, then the tip curls back.
export const phiTepal = (p0, pf, pt) => s => p0 + (pf - p0) * (1 - Math.pow(1 - clamp(s / 0.36, 0, 1), 2)) + (pt - pf) * Math.pow(sstep(0.5, 1, s), 1.4);
export function widthFn(p, q) {
  const sm = p / (p + q), norm = Math.pow(sm, p) * Math.pow(1 - sm, q);
  return s => Math.pow(clamp(s, 0, 1), p) * Math.pow(clamp(1 - s, 0, 1), q) / norm;
}

export function makeSurface(kind, fn, nS, nV, s0, s1) {
  const row = nV + 1, n = (nS + 1) * row;
  const X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n), NZ = new Float32Array(n);
  for (let i = 0; i <= nS; i++) {
    const s = lerp(s0, s1, i / nS);
    for (let j = 0; j <= nV; j++) {
      const p = fn(s, -1 + 2 * j / nV), k = i * row + j;
      X[k] = p[0]; Y[k] = p[1]; Z[k] = p[2];
    }
  }
  for (let i = 0; i <= nS; i++) for (let j = 0; j <= nV; j++) {
    const a = Math.min(nS, i + 1) * row + j, b = Math.max(0, i - 1) * row + j, c = i * row + Math.min(nV, j + 1), d = i * row + Math.max(0, j - 1);
    const sx = X[a] - X[b], sy = -(Y[a] - Y[b]), sz = Z[a] - Z[b];
    const vx = X[c] - X[d], vy = -(Y[c] - Y[d]), vz = Z[c] - Z[d];
    const nx = sy * vz - sz * vy, ny = sz * vx - sx * vz, nz = sx * vy - sy * vx;
    NZ[i * row + j] = nz / (Math.hypot(nx, ny, nz) || 1);
  }
  let zs = 0;
  for (let k = 0; k < n; k++) zs += Z[k];
  return { kind, nS, nV, s0, s1, X, Y, Z, NZ, zMean: zs / n, ease: easeIO, tone: 0.5 };
}
export const _ev = [0, 0, 0, 0];
export function evalS(sf, s, v) {
  const gi = clamp((s - sf.s0) / (sf.s1 - sf.s0), 0, 1) * sf.nS, gj = clamp((v + 1) / 2, 0, 1) * sf.nV;
  const i = Math.min(sf.nS - 1, gi | 0), j = Math.min(sf.nV - 1, gj | 0), fi = gi - i, fj = gj - j, row = sf.nV + 1;
  const a = i * row + j, b = a + 1, c = a + row, d = c + 1;
  const w00 = (1 - fi) * (1 - fj), w01 = (1 - fi) * fj, w10 = fi * (1 - fj), w11 = fi * fj;
  _ev[0] = sf.X[a] * w00 + sf.X[b] * w01 + sf.X[c] * w10 + sf.X[d] * w11;
  _ev[1] = sf.Y[a] * w00 + sf.Y[b] * w01 + sf.Y[c] * w10 + sf.Y[d] * w11;
  _ev[2] = sf.Z[a] * w00 + sf.Z[b] * w01 + sf.Z[c] * w10 + sf.Z[d] * w11;
  _ev[3] = sf.NZ[a] * w00 + sf.NZ[b] * w01 + sf.NZ[c] * w10 + sf.NZ[d] * w11;
  return _ev;
}
