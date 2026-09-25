// Public HTTP only. An explicit endpoint is required; every room is disposable.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import backend from '../public/assets/one-night/backend.json' with { type: 'json' };
import catalogue from '../public/assets/one-night/core-roles.json' with { type: 'json' };

const endpoint = process.argv.find(arg => arg.startsWith('--url='))?.slice(6);
if (!endpoint || !/^https?:\/\//.test(endpoint)) throw new Error('Pass --url=<One Night API endpoint>.');
const url = new URL(endpoint);
const headers = {
  'Content-Type': 'application/json',
  Origin: ['localhost', '127.0.0.1'].includes(url.hostname) ? 'http://localhost:3010' : 'https://davidw0311.github.io',
  ...(url.origin === new URL(backend.url).origin ? { apikey: backend.publishableKey, Authorization: `Bearer ${backend.publishableKey}` } : {}),
};
const deck = ['werewolf', 'werewolf', 'robber', 'troublemaker', 'villager', 'villager', 'villager', 'hunter', 'tanner'];
const covered = new Set();
const summary = { ok: false, rooms: 0, playersPerRoom: 6, requests: 0, packetRetries: 0, absentRolesSkipped: 0, cleanedRooms: 0, centerSwaps: [] };

async function call(token, op, code, fields = {}) {
  const packet = JSON.stringify({ token, op, code, requestId: randomUUID(), ...fields });
  // Only retry transport/server failures, using the identical idempotency key.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      summary.requests++;
      const response = await fetch(endpoint, { method: 'POST', headers, body: packet, signal: AbortSignal.timeout(16000) });
      const reply = await response.json();
      if (!response.ok || reply.error) {
        const error = new Error(`${op} failed: ${reply.error || response.status}`);
        error.retryable = response.status >= 500 || reply.error === 'room-busy';
        throw error;
      }
      assert.ok(reply.view, 'The API must return a public view');
      return reply.view;
    } catch (error) {
      if (attempt || error.retryable === false || error.code === 'ERR_ASSERTION') throw error;
      summary.packetRetries++;
    }
  }
}
function assertPrivate(view) {
  for (const field of ['cards', 'members', 'actions', 'actionLog', 'nightActors', 'nightState']) assert.equal(view[field], undefined, `${field} must remain private`);
  assert.equal(view.result, null);
  assert.ok(view.seats.every(seat => seat.roleId === undefined && seat.actorId === undefined));
  assert.ok(view.centerCards.every(card => card.roleId === undefined));
}

async function round(number) {
  const players = Array.from({ length: 6 }, (_, index) => ({ token: randomUUID(), name: `Center swap test ${index + 1}` }));
  const host = players[0], observer = randomUUID();
  let code, view;
  const performed = [];
  const send = (player, type, fields = {}) => call(player.token, 'command', code, { command: { type, expectedPhaseId: view.phase.id, ...fields } });
  try {
    view = await call(host.token, 'create', undefined, { name: host.name });
    code = view.code; summary.rooms++;
    await Promise.all(players.slice(1).map(player => call(player.token, 'join', code, { name: player.name })));
    view = await send(host, 'configure', { roleDeck: deck });
    view = await send(host, 'start');
    assert.equal(view.phase.kind, 'ready'); assert.equal(view.seats.length, 6);
    const readyViews = await Promise.all(players.map(player => send(player, 'ready')));
    players.forEach((player, index) => {
      assertPrivate(readyViews[index]);
      player.seatId = readyViews[index].me.seatId;
      player.originalRole = readyViews[index].me.originalRoleId;
    });
    const waiting = await call(observer, 'join', code, { name: 'Unseated privacy check' });
    assert.equal(waiting.me, null); assertPrivate(waiting);
    view = await send(host, 'startNight');
    for (let step = 0; view.phase.kind === 'night' && step < 30; step++) {
      if (view.phase.nightStage !== 'acting') { view = await send(host, 'narrationDone'); continue; }
      // This isolated deck has no copy/response powers. Each test session knows
      // its own starting role, so absent-role waits need no blind polling.
      const actors = players.filter(player => player.originalRole === view.phase.step);
      if (!actors.length) {
        view = await send(host, 'hardSkip'); summary.absentRolesSkipped++; continue;
      }
      for (const player of actors) {
        const personal = await call(player.token, 'sync', code), action = personal.me.action;
        assert.ok(action, `The ${player.originalRole} session must have its own action`);
        assertPrivate(personal);
        const tested = ['robber', 'troublemaker'].includes(action.roleId);
        const targets = action.roleId === 'robber' ? ['center:0'] : action.roleId === 'troublemaker' ? ['center:1', 'center:2'] : [];
        for (const target of targets) assert.ok(action.targets.some(candidate => candidate.id === target), `${action.roleId} must offer ${target}`);
        const packet = { requestId: randomUUID(), command: { type: 'act', expectedPhaseId: personal.phase.id, actionId: action.id, targets } };
        const submitted = await call(player.token, 'command', code, packet);
        view = submitted;
        if (!tested) continue;
        const notes = submitted.me.knowledge.slice(personal.me.knowledge.length);
        assert.equal(notes.length, action.roleId === 'robber' ? 1 : 0, 'Only Robber may inspect its one received card');
        const retried = await call(player.token, 'command', code, packet);
        assert.equal(retried.revision, submitted.revision, 'An action retry must not execute twice');
        assert.deepEqual(retried.me.knowledge, submitted.me.knowledge);
        view = retried;
        const unseen = await call(observer, 'sync', code);
        assert.equal(unseen.me, null); assertPrivate(unseen);
        if (unseen.revision > view.revision) view = unseen;
        const other = players.find(candidate => candidate.seatId !== player.seatId);
        const otherView = await call(other.token, 'sync', code);
        assertPrivate(otherView);
        if (otherView.revision > view.revision) view = otherView;
        for (const note of notes) assert.ok(!otherView.me.knowledge.some(entry => entry.id === note.id), 'Private inspection must not reach another session');
        performed.push({ role: action.roleId, seatId: player.seatId, targets, notes });
      }
    }
    assert.equal(view.phase.kind, 'discussion', 'The complete night must finish within its bound');
    view = await send(host, 'startVote');
    const seats = view.seats;
    for (const player of players) {
      const index = seats.findIndex(seat => seat.id === player.seatId);
      view = await send(player, 'vote', { targetId: seats[(index + 1) % seats.length].id });
    }
    view = await send(host, 'finishVote');
    assert.equal(view.status, 'finished'); assert.equal(view.result.players.length, 6);
    assert.equal(Object.keys(view.result.votes).length, 6);
    for (const performedAction of performed) {
      const { role, seatId, targets, notes } = performedAction;
      const events = view.result.timeline.filter(entry => entry.seatId === seatId && entry.roleId === role);
      const moves = events.filter(entry => entry.type === 'move');
      assert.equal(moves.length, 1, 'A retried action must leave exactly one movement in the final timeline');
      assert.deepEqual(moves[0].targets, role === 'robber' ? [seatId, ...targets] : targets);
      const inspections = events.filter(entry => entry.type === 'view');
      if (role === 'robber') {
        assert.equal(inspections.length, 1); assert.deepEqual(inspections[0].targets, [seatId]);
        assert.equal(view.result.center.find(card => card.id === 'center:0').roleId, 'robber');
        const receivedRole = view.result.players.find(player => player.seatId === seatId).roleId;
        const receivedName = catalogue.find(card => card.id === receivedRole).name.en;
        assert.ok(notes[0].text.en.endsWith(`: ${receivedName}.`), 'The private note must describe only the received card');
      } else assert.equal(inspections.length, 0);
      covered.add(role); summary.centerSwaps.push({ round: number, role, targets, idempotentRetry: true });
    }
  } finally {
    if (code) {
      const closed = await call(host.token, 'command', code, { command: { type: 'disbandRoom' } });
      assert.equal(closed.status, 'disbanded'); summary.cleanedRooms++;
    }
  }
}

// A dealt role has a 2/3 chance of being in a player's hand. Fresh sessions also
// keep each room's host below its per-minute command allowance without sleeps.
for (let number = 1; number <= 12 && covered.size < 2; number++) await round(number);
assert.deepEqual([...covered].sort(), ['robber', 'troublemaker'], 'Both roles must be exercised within 12 random deals');
assert.equal(summary.cleanedRooms, summary.rooms);
summary.ok = true;
console.log(JSON.stringify(summary));
