import test from 'node:test';
import assert from 'node:assert/strict';
import { dayIndex, greeting } from '../js/day.js';

const D = (y, m, d, h = 12, mi = 0) => new Date(y, m - 1, d, h, mi);
test('dia da publicação é 0', () => assert.equal(dayIndex(D(2026, 11, 20), '2026-11-20'), 0));
test('23h59 ainda é o mesmo dia; 00h00 é o seguinte', () => {
  assert.equal(dayIndex(D(2026, 11, 20, 23, 59), '2026-11-20'), 0);
  assert.equal(dayIndex(D(2026, 11, 21, 0, 0), '2026-11-20'), 1);
});
test('dia 31 volta ao 0', () => assert.equal(dayIndex(D(2026, 12, 20), '2026-11-20'), 0));
test('antes da data de início é 0', () => assert.equal(dayIndex(D(2026, 11, 1), '2026-11-20'), 0));
test('um ano depois continua em 0..29', () => { const i = dayIndex(D(2027, 11, 20), '2026-11-20'); assert.ok(i >= 0 && i < 30); assert.equal(i, 365 % 30); });
test('saudação', () => {
  assert.equal(greeting(D(2026, 1, 1, 4, 59)), 'Boa noite'); assert.equal(greeting(D(2026, 1, 1, 5, 0)), 'Bom dia');
  assert.equal(greeting(D(2026, 1, 1, 11, 59)), 'Bom dia'); assert.equal(greeting(D(2026, 1, 1, 12, 0)), 'Boa tarde');
  assert.equal(greeting(D(2026, 1, 1, 17, 59)), 'Boa tarde'); assert.equal(greeting(D(2026, 1, 1, 18, 0)), 'Boa noite');
});
