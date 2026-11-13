import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBouquet } from '../js/scene/bouquet.js';

for (let d = 0; d < 30; d++) test(`dia ${d}: invariantes`, () => {
  const m = buildBouquet(d, { res: 0.5 });
  assert.equal(m.flowers.length, 5); assert.equal(m.flowers[0].pal, 'blue');
  assert.ok(m.flowers.slice(1).every(f => f.L < m.flowers[0].L));
  assert.deepEqual(m.flowers.slice(1).map(f => f.pal).sort(), ['lavender', 'sky', 'violet', 'white']);
  assert.ok(m.budCount === 2 || m.budCount === 3);
  for (const sf of m.surfaces) for (const A of [sf.X, sf.Y, sf.Z]) assert.ok(A.every(Number.isFinite));
  for (const sf of m.surfaces) assert.ok(sf.t0 >= 0 && sf.t0 + sf.dur <= 5);
});
test('mesmo dia, mesmo buquê; dias diferentes, buquês diferentes', () => {
  assert.deepEqual(buildBouquet(3, { res: 0.5 }).surfaces[9].X, buildBouquet(3, { res: 0.5 }).surfaces[9].X);
  assert.notDeepEqual(buildBouquet(3, { res: 0.5 }).surfaces[9].X, buildBouquet(4, { res: 0.5 }).surfaces[9].X);
});
