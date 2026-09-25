'use strict';
// Reproducible offline simulations use the production engine with seeded crypto
// only inside this isolated VM. Production randomness and APIs are unchanged.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const crypto = require('node:crypto');
const enginePath = path.resolve(__dirname, '../src/one-night/engine.js');
const engineSource = fs.readFileSync(enginePath, 'utf8');
const localRequire = createRequire(enginePath);
function rng(seed) { let n = seed >>> 0; return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function loadEngine(seed) {
  const random = rng(seed); let uuid = 0;
  const seededCrypto = { ...crypto, randomInt(a, b) { if (b == null) { b = a; a = 0; } return a + Math.floor(random() * (b - a)); }, randomUUID() { return `00000000-0000-4000-8000-${(++uuid).toString(16).padStart(12, '0')}`; } };
  const engineModule = { exports: {} };
  vm.runInNewContext(engineSource, { require: name => name === 'node:crypto' ? seededCrypto : localRequire(name), module: engineModule, exports: engineModule.exports, console }, { filename: enginePath });
  return engineModule.exports;
}
const serialized = value => JSON.stringify(value);
function simulate(preset, seed, options = {}) {
  const engine = loadEngine(seed), random = rng(seed ^ 0xDEADBEEF), count = preset.players;
  const actors = Array.from({ length: count }, (_, i) => `actor-${seed}-${i}`);
  let now = 1000000; const stats = { games: 1, players: count, actions: 0, replacements: 0, staleRejections: 0, ballots: 0, optionalSkips: 0 };
  const room = engine.createRoom({ code: 'TEST', hostId: actors[0], hostName: 'Player 1', now });
  const command = (actor, c) => { engine.applyCommand(room, actor, c, ++now); };
  const snapshot = () => serialized(room);
  const rejectsUnchanged = (actor, c) => { const before = snapshot(); assert.throws(() => command(actor, c)); assert.equal(snapshot(), before, 'rejected command changed room'); };
  actors.slice(1).forEach((actor, i) => command(actor, { type: 'requestJoin', name: `Player ${i + 2}` }));
  command(actors[0], { type: 'configure', roleDeck: preset.roles });
  command(actors[0], { type: 'start' });
  const cardIds = Object.values(room.cards).map(card => card.id).sort();
  const originalSeatOrder = room.seats.map(s => s.id).join(',');
  const assertPrivacy = () => {
    for (const actor of [actors[0], `outsider-${seed}`]) {
      const v = engine.publicView(room, actor, now);
      assert.equal(v.cards, undefined); assert.equal(v.members, undefined); assert.equal(v.actions, undefined); assert.equal(v.nightActors, undefined);
      if (actor !== actors[0]) { assert.equal(v.me, null); assert.equal(v.requests.length, 0); assert.equal(v.isHost, false); }
      if (room.status !== 'finished') {
        assert.equal(v.result, null); assert.ok(v.seats.every(s => !s.roleId && !s.actorId));
        for (const id of cardIds) assert.ok(!serialized(v).includes(id), 'physical card identifier leaked');
        if (room.phase.kind === 'night' && room.phase.nightStage === 'acting') assert.equal(v.phase.deadline, null, 'absence timeout leaked');
      }
    }
  };
  assertPrivacy();
  rejectsUnchanged(actors[0], { type: 'startNight', expectedPhaseId: room.phase.id });
  actors.forEach(actor => command(actor, { type: 'ready', expectedPhaseId: room.phase.id }));
  command(actors[0], { type: 'startNight', expectedPhaseId: room.phase.id });
  let steps = 0, replaced = false; const vampireTargets = new Map(); const actionChoices = [];
  while (room.phase.kind === 'night') {
    assert.ok(++steps < 400, `${preset.id} seed ${seed}: night stalled at ${room.phase.step}`);
    assert.equal(room.seats.map(s => s.id).join(','), originalSeatOrder, 'seats moved during night');
    assert.equal(Object.values(room.cards).map(card => card.id).sort().join(','), cardIds.join(','), 'physical cards were lost or duplicated');
    if (room.phase.nightStage !== 'acting') { command(actors[0], { type: 'narrationDone', expectedPhaseId: room.phase.id }); continue; }
    if (!replaced && seed % 3 === 0) {
      const index = Math.max(1, room.nightActors.map(id => room.seats.findIndex(s => s.id === id)).find(i => i > 0) ?? 1);
      const old = actors[index], seatId = room.seats[index].id, currentCard = serialized(room.cards[seatId]), notes = serialized(room.seats[index].knowledge);
      command(old, { type: 'leave' }); now += 60000;
      if (room.nightActors.length) { const before = room.phase.id; assert.equal(engine.tickRoom(room, now), false, 'a disconnected actor timed out'); assert.equal(room.phase.id, before); }
      const next = `replacement-${seed}-${index}`;
      command(next, { type: 'requestJoin', name: `Player ${index + 1}` });
      assert.equal(engine.publicView(room, next, now).me, null, 'new device seated without host consent');
      rejectsUnchanged(next, { type: 'approveJoin', requestId: room.requests.at(-1).id, replaceSeatId: seatId });
      command(actors[0], { type: 'approveJoin', requestId: room.requests.at(-1).id, replaceSeatId: seatId });
      actors[index] = next;
      assert.equal(serialized(room.cards[seatId]), currentCard); assert.equal(serialized(room.seats[index].knowledge), notes);
      assert.equal(engine.publicView(room, old, now).me, null);
      rejectsUnchanged(old, { type: 'ready', expectedPhaseId: room.phase.id });
      stats.replacements++; replaced = true;
    }
    const active = actors.map(actor => ({ actor, action: engine.publicView(room, actor, now).me.action })).filter(row => row.action);
    if (!active.length) {
      assert.ok(room.phase.deadline != null, `${preset.id} ${seed}: no active player and no absent-role timer`);
      now = room.phase.deadline + 1; assert.equal(engine.tickRoom(room, now), true); continue;
    }
    // Randomize response arrival order. Information must survive who answers first.
    active.sort(() => random() - .5);
    for (const { actor } of active) {
      const action = engine.publicView(room, actor, now).me.action; if (!action) continue;
      const c = { type: 'act', expectedPhaseId: room.phase.id, actionId: action.id, targets: [] };
      if (action.canSkip && (action.targets.length < action.min || random() < .17)) { c.skip = true; stats.optionalSkips++; }
      else {
        c.choice = action.options?.[Math.floor(random() * action.options.length)]?.id;
        let take = action.min + Math.floor(random() * (action.max - action.min + 1));
        if (action.roleId === 'nostradamus') take = c.choice === 'inspect' ? 1 : 0;
        const targets = [...action.targets];
        for (let i = targets.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [targets[i], targets[j]] = [targets[j], targets[i]]; }
        if (action.roleId === 'vampire' && action.max) {
          if (!vampireTargets.has(room.phase.id)) vampireTargets.set(room.phase.id, targets[0].id);
          c.targets = [vampireTargets.get(room.phase.id)];
        } else c.targets = targets.slice(0, take).map(t => t.id);
      }
      actionChoices.push(`${room.phase.step}:${action.roleId}:${c.choice || ''}:${c.targets.map(id => room.seats.findIndex(s => s.id === id)).join(',')}:${Boolean(c.skip)}`);
      try { command(actor, c); } catch (error) { error.message = `${preset.id}, seed ${seed}, ${room.phase.step}/${action.roleId}, ${serialized(c)}: ${error.message}`; throw error; }
      stats.actions++;
      if (stats.actions % 13 === 0) { rejectsUnchanged(actor, c); stats.staleRejections++; assertPrivacy(); }
    }
  }
  assert.equal(room.phase.kind, 'discussion'); assertPrivacy();
  rejectsUnchanged(actors[0], { type: 'reorderSeats', seatIds: room.seats.map(s => s.id).reverse() });
  command(actors[0], { type: 'startVote', expectedPhaseId: room.phase.id });
  rejectsUnchanged(actors[0], { type: 'finishVote', expectedPhaseId: room.phase.id });
  const votePattern = seed % 4;
  actors.forEach((actor, i) => {
    rejectsUnchanged(actor, { type: 'vote', expectedPhaseId: room.phase.id, targetId: room.seats[i].id });
    let target = votePattern === 0 ? (i + 1) % count : votePattern === 1 ? i === 0 ? 1 : 0 : votePattern === 2 ? i < count / 2 ? 1 : 0 : Math.floor(random() * (count - 1));
    if (votePattern === 3 && target >= i) target++;
    if (target === i) target = (target + 1) % count;
    command(actor, { type: 'vote', expectedPhaseId: room.phase.id, targetId: room.seats[target].id }); stats.ballots++;
  });
  assert.equal(engine.publicView(room, actors[0], now).pendingVoterIds.length, 0);
  command(actors[0], { type: 'finishVote', expectedPhaseId: room.phase.id });
  assert.equal(room.status, 'finished'); assert.equal(room.result.players.length, count);
  const playerIds = new Set(room.seats.map(s => s.id));
  for (const list of [room.result.deaths, room.result.winners]) { assert.equal(new Set(list).size, list.length); assert.ok(list.every(id => playerIds.has(id))); }
  assert.equal(room.result.center.length, 3 + Number(preset.roles.includes('alphaWolf')));
  room.result.players.forEach(p => { assert.equal(p.died, room.result.deaths.includes(p.seatId)); assert.equal(p.won, room.result.winners.includes(p.seatId)); });
  // Published large presets have no Bodyguard or artifact role-changing powers:
  // verify one real ballot per player, independently of winner implementation.
  if (!preset.roles.some(id => ['bodyguard', 'defenderEr', 'curator'].includes(id))) assert.equal(Object.values(room.result.counts).reduce((a, b) => a + b, 0), count);
  const fingerprint = serialized({ initial: room.seats.map(s => s.originalRoleId), actions: actionChoices, result: room.result });
  command(actors[0], { type: 'rematch', expectedPhaseId: room.phase.id });
  const reset = engine.publicView(room, actors[0], now); assert.equal(reset.status, 'lobby'); assert.equal(reset.me.roleId, null); assert.equal(reset.me.knowledge.length, 0); assert.equal(reset.result, null);
  assert.equal(Object.keys(room.cards).length, 0); assert.equal(Object.keys(room.marks).length, 0);
  if (options.disband) { command(actors[0], { type: 'disbandRoom' }); assert.equal(room.status, 'disbanded'); for (const actor of actors) assert.equal(engine.publicView(room, actor, now).me, null); }
  return { stats, fingerprint };
}
module.exports = { simulate, loadEngine };
