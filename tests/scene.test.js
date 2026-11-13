import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareScene } from '../js/scene/scene.js';

test('cena do dia 0 é bem formada', () => {
  const s = prepareScene(0, { res: 1 });
  assert.equal(s.paint.data.length, s.paint.w * s.paint.h * 4);
  assert.ok(s.strokes.length > 100 && s.dabs.length > 20 && s.stamps.length > 30);
  for (const st of s.strokes) assert.ok(st.px.every(Number.isFinite) && st.t0 + st.dur <= 5.01);
  for (const sp of s.stamps) assert.ok(sp.t0 + sp.dur <= 5.01);
});
test('azul domina a tinta em todos os 30 dias', () => {
  for (let d = 0; d < 30; d++) {
    const { data } = prepareScene(d, { res: 0.5 }).paint; let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] + data[i + 1] + data[i + 2] < 720) { r += 255 - data[i]; g += 255 - data[i + 1]; b += 255 - data[i + 2]; }
    assert.ok(b < r && b < g, `dia ${d}`);
  }
});
test('preparo em resolução de celular cabe no orçamento', () => {
  prepareScene(1, { res: 1.5 }); const t = performance.now(); prepareScene(2, { res: 1.5 });
  const ms = performance.now() - t; assert.ok(ms < 450, `${ms} ms`);
});
