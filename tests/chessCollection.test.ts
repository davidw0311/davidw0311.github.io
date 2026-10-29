import assert from 'node:assert/strict';
import test from 'node:test';
import { changeCollection, collectionIndexes, readCollection } from '../lib/chessCollection.ts';

test('collection saves, deduplicates and removes positions without disturbing other saves', () => {
  let saved = changeCollection('', { index: 0, saved: true });
  saved = changeCollection(saved, { index: 11192, saved: true });
  saved = changeCollection(saved, { index: 7, saved: true });
  assert.deepEqual(collectionIndexes(saved), [0, 7, 11192]);
  assert.equal(changeCollection(saved, { index: 7, saved: true }), saved);
  saved = changeCollection(saved, { index: 7, saved: false });
  assert.deepEqual(collectionIndexes(saved), [0, 11192]);
  saved = changeCollection(saved, { index: 11192, saved: false }); assert.equal(saved.length, 4);
  assert.equal(changeCollection(saved, { index: 0, saved: false }), '');
});
test('collection data validates safely and rejects unsupported indexes', () => {
  for (const value of [null, {}, [], 5, '%%%', '===', 'a', btoa('x'.repeat(2501))]) assert.equal(readCollection(value), '');
  const saved = changeCollection('', { index: 3, saved: true });
  for (const index of [-1, 20000, NaN, 1.5]) assert.equal(changeCollection(saved, { index, saved: true }), saved);
  assert.equal(readCollection(saved), saved);
});
test('the entire library fits in a compact collection without a favorites limit', () => {
  let saved = '';
  for (let index = 0; index < 11193; index++) saved = changeCollection(saved, { index, saved: true });
  assert.equal(collectionIndexes(saved).length, 11193); assert.ok(saved.length < 1900);
  assert.equal(readCollection(saved), saved);
});
test('queued changes rebase onto another device’s collection and preserve removals', () => {
  const remote = [2, 8, 17].reduce((value, index) => changeCollection(value, { index, saved: true }), '');
  const pending = [{ index: 8, saved: false }, { index: 24, saved: true }];
  const merged = pending.reduce(changeCollection, remote);
  assert.deepEqual(collectionIndexes(merged), [2, 17, 24]);
  const whileSaving = [{ index: 24, saved: false }, { index: 5, saved: true }];
  assert.deepEqual(collectionIndexes(whileSaving.reduce(changeCollection, merged)), [2, 5, 17]);
});
