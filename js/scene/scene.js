// A cena de um dia, pronta para desenhar: só dados, sem DOM. Roda num Worker ou no Node.

import { rngFrom } from './util.js';
import { buildBouquet } from './bouquet.js';
import { SOLTO, paintWash, paintClouds } from './paint.js';
import { buildStrokes, buildStamps, buildDabs } from './strokes.js';

export function prepareScene(day, opts = {}) {
  const model = buildBouquet(day, { res: opts.res || 1.5 }), K = SOLTO, rng = rngFrom(977 + day);
  return {
    W: model.o.W, H: model.o.H, total: model.total,
    paint: paintWash(model, K),
    clouds: paintClouds(model, K),
    strokes: buildStrokes(model, K, rng),
    stamps: buildStamps(model, K, rng),
    dabs: buildDabs(model, K),
  };
}

// Buffers que podem ser transferidos de um Worker sem cópia.
export function sceneTransferables(scene) {
  const list = [scene.paint.data.buffer, scene.clouds.data.buffer];
  for (const st of scene.strokes) list.push(st.px.buffer, st.py.buffer, st.ps.buffer, st.alpha.buffer);
  for (const d of scene.dabs) list.push(d.s.buffer, d.x.buffer, d.y.buffer, d.r.buffer);
  return list;
}
