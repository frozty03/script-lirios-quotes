import test from 'node:test';
import assert from 'node:assert/strict';
import { QUOTES } from '../js/quotes.js';

const AUTHORS = ['Albert Camus', 'Søren Kierkegaard', 'Fiódor Dostoiévski', 'Jean-Paul Sartre', 'Franz Kafka'];
test('30 frases, 6 por autor', () => { assert.equal(QUOTES.length, 30); for (const a of AUTHORS) assert.equal(QUOTES.filter(q => q.author === a).length, 6); });
test('campos preenchidos e limite de 220 caracteres', () => { for (const q of QUOTES) { for (const k of ['text', 'author', 'work', 'original', 'source']) assert.ok(q[k] && q[k].trim(), k); assert.ok(q.text.length <= 220, q.text); } });
test('sem autor repetido em dias seguidos, inclusive do 30 para o 1', () => { for (let i = 0; i < 30; i++) assert.notEqual(QUOTES[i].author, QUOTES[(i + 1) % 30].author); });
test('sem frases duplicadas', () => assert.equal(new Set(QUOTES.map(q => q.text)).size, 30));
