'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const presets = require('../../public/assets/one-night/presets.json');
const { simulate } = require('./one-night-simulator');
const repetitions = Number(process.env.ONE_NIGHT_SIMULATIONS || 60);
for (const preset of presets.filter(p => p.players >= 12)) test(`${preset.name.en}: ${repetitions} seeded complete games with rejoin, voting and privacy checks`, t => {
  const totals = { games: 0, actions: 0, replacements: 0, staleRejections: 0, ballots: 0, optionalSkips: 0 };
  for (let i = 1; i <= repetitions; i++) {
    const { stats } = simulate(preset, i * 977 + preset.players, { disband: i % 7 === 0 });
    for (const key of Object.keys(totals)) totals[key] += stats[key];
  }
  assert.equal(totals.games, repetitions); assert.ok(totals.actions > repetitions); assert.ok(totals.replacements > 0);
  t.diagnostic(JSON.stringify(totals));
});
test('large-game simulations replay exactly from the same seed', () => {
  const preset = presets.find(p => p.id === 'epic-midnight-16');
  assert.equal(simulate(preset, 240916).fingerprint, simulate(preset, 240916).fingerprint);
});
function mixedDeck(seed, n) {
  const roles = require('../src/one-night/engine').catalogue;
  let value = seed >>> 0;
  const next = () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  const deck = ['werewolf', 'werewolf', 'sentinel'];
  const candidates = roles.filter(r => !['werewolf', 'sentinel', 'mason'].includes(r.id)).map(r => r.id);
  for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
  if (seed % 2 === 0) { deck.push('doppelganger'); candidates.splice(candidates.indexOf('doppelganger'), 1); }
  deck.push(...candidates.slice(0, n + 3 - deck.length));
  return { id: `mixed-expansions-${seed}`, players: n, roles: deck };
}
test('120 mixed-expansion large games vary legal decks, copies, shields and independent teams', t => {
  const totals = { games: 0, actions: 0, replacements: 0, staleRejections: 0, ballots: 0, optionalSkips: 0 };
  for (let i = 1; i <= 120; i++) {
    const seed = i * 1021, preset = mixedDeck(seed, [12, 14, 16][i % 3]);
    const { stats } = simulate(preset, seed, { disband: true });
    for (const key of Object.keys(totals)) totals[key] += stats[key];
  }
  t.diagnostic(JSON.stringify(totals));
});
