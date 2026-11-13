// Desenha uma cena pronta num canvas ao longo dos seus 5 segundos.
// Três camadas multiplicadas sobre branco: nuvens de fundo, aquarela revelada pela
// máscara das pinceladas, e o lápis com os carimbos.

import { lerp, clamp, sstep, easeOut, easeIO } from './scene/util.js';

const TAU = Math.PI * 2;
const EASE = { out: easeOut, io: easeIO };

function layer(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function fromPixels(img) { const c = layer(img.w, img.h); c.getContext('2d').putImageData(new ImageData(img.data, img.w, img.h), 0, 0); return c; }
function wipe(ctx) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore(); }

// Até onde uma forma já cresceu no instante t, no seu parâmetro s.
function headOf(tm, t) {
  const e = (t - tm.t0) / tm.dur;
  if (e <= 0) return -1;
  if (e >= 1) return tm.s1 + 1;
  return lerp(tm.s0, tm.s1, EASE[tm.ease](e));
}

export function createRenderer(canvas, scene) {
  const ctx = canvas.getContext('2d'), cw = canvas.width, ch = canvas.height, k = cw / scene.W;
  const paintC = fromPixels(scene.paint), cloudsC = fromPixels(scene.clouds);
  const lineC = layer(cw, ch), lctx = lineC.getContext('2d');
  const tmpC = layer(cw, ch), tctx = tmpC.getContext('2d');
  const maskC = layer(scene.W, scene.H), mctx = maskC.getContext('2d');
  const strokes = scene.strokes.map(st => ({ st, i: 0, h: -1, done: false }));
  const stamps = scene.stamps.map(sp => ({ sp, k: 0 }));
  const dabs = scene.dabs.map(d => ({ d, i: 0 }));
  let raf = 0;

  function reset() {
    wipe(lctx); wipe(mctx);
    for (const s of strokes) { s.i = 0; s.h = -1; s.done = false; }
    for (const s of stamps) s.k = 0;
    for (const d of dabs) d.i = 0;
  }

  // Estende um traço do ponto em que parou até `head`, em pedaços curtos para o alfa variar.
  function growStroke(state, head) {
    const { px, py, ps, alpha } = state.st, n = ps.length;
    if (n < 2) { state.done = true; return; }
    const first = ps[0], last = ps[n - 1];
    if (head <= first) return;
    let a = state.h < first ? first : state.h, i = state.i;
    const end = Math.min(head, last);
    while (a < end) {
      const b = Math.min(end, a + 0.2);
      while (i < n - 2 && ps[i + 1] <= a) i++;
      let f = clamp((a - ps[i]) / ((ps[i + 1] - ps[i]) || 1e-9), 0, 1);
      lctx.beginPath();
      lctx.moveTo(px[i] + (px[i + 1] - px[i]) * f, py[i] + (py[i + 1] - py[i]) * f);
      let j = i;
      while (j < n - 1 && ps[j + 1] <= b) { j++; lctx.lineTo(px[j], py[j]); }
      if (j < n - 1) { f = clamp((b - ps[j]) / ((ps[j + 1] - ps[j]) || 1e-9), 0, 1); lctx.lineTo(px[j] + (px[j + 1] - px[j]) * f, py[j] + (py[j + 1] - py[j]) * f); }
      lctx.globalAlpha = alpha[Math.min(n - 1, (i + j + 1) >> 1)];
      lctx.stroke();
      i = Math.min(j, n - 2); a = b;
    }
    state.i = i; state.h = end;
    if (head >= last) state.done = true;
  }

  function drawStamp(sp) {
    lctx.globalAlpha = sp.alpha;
    lctx.beginPath();
    if (sp.shape === 'ellipse') { lctx.ellipse(sp.x, sp.y, sp.rx, sp.ry, sp.ang, 0, TAU); lctx.fillStyle = sp.color; lctx.fill(); return; }
    const p = sp.pts;
    lctx.moveTo(p[0], p[1]);
    if (sp.shape === 'quad') lctx.quadraticCurveTo(p[2], p[3], p[4], p[5]); else lctx.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]);
    lctx.strokeStyle = sp.color; lctx.lineWidth = sp.width; lctx.stroke();
  }

  function growMask(state, head) {
    const { s, x, y, r } = state.d;
    while (state.i < s.length && s[state.i] < head) {
      const i = state.i++, g = mctx.createRadialGradient(x[i], y[i], 0, x[i], y[i], r[i]);
      g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.55, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = g; mctx.beginPath(); mctx.arc(x[i], y[i], r[i], 0, TAU); mctx.fill();
    }
  }

  function compose(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = sstep(0, 1.6, t); ctx.drawImage(cloudsC, 0, 0, cw, ch); ctx.globalAlpha = 1;
    wipe(tctx);
    tctx.globalCompositeOperation = 'source-over'; tctx.drawImage(paintC, 0, 0, cw, ch);
    tctx.globalCompositeOperation = 'destination-in'; tctx.drawImage(maskC, 0, 0, cw, ch);
    ctx.drawImage(tmpC, 0, 0);
    ctx.drawImage(lineC, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  function advance(t) {
    lctx.setTransform(k, 0, 0, k, 0, 0);
    lctx.globalCompositeOperation = 'source-over'; lctx.lineCap = 'round'; lctx.lineJoin = 'round';
    for (const s of strokes) if (!s.done) {
      const head = headOf(s.st, t);
      if (head > s.h) { lctx.strokeStyle = s.st.color; lctx.lineWidth = s.st.width; growStroke(s, head); }
    }
    for (const s of stamps) {
      const want = Math.floor(clamp((t - s.sp.t0) / s.sp.dur, 0, 1) * s.sp.n);
      while (s.k < want) { drawStamp(s.sp); s.k++; }
    }
    lctx.globalAlpha = 1;
    for (const d of dabs) growMask(d, headOf(d.d, t));
    compose(t);
  }

  function stop() { cancelAnimationFrame(raf); raf = 0; }
  return {
    // Pinta do zero; onFirstFrame avisa quando o primeiro quadro foi desenhado.
    play(onFirstFrame) {
      stop(); reset();
      const t0 = performance.now();
      let first = true;
      const frame = () => {
        const t = (performance.now() - t0) / 1000;
        advance(Math.min(t, scene.total));
        if (first) { first = false; if (onFirstFrame) onFirstFrame(); }
        raf = t < scene.total ? requestAnimationFrame(frame) : 0;
      };
      raf = requestAnimationFrame(frame);
    },
    // Mostra a pintura já terminada, sem animação.
    finish() { stop(); reset(); for (let t = 0; t < scene.total; t += 0.25) advance(t); advance(scene.total); },
    stop,
  };
}
