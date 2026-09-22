// Explicit endpoint required: this creates one disposable room that expires after inactivity.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const endpoint = process.argv.find(arg => arg.startsWith('--url='))?.slice(6);
if (!endpoint || !/^https?:\/\//.test(endpoint)) throw new Error('Pass --url=<werewolf API endpoint>.');
let code;
async function call(token, op, fields = {}, expectedError) {
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://davidw0311.github.io' },
    body: JSON.stringify({ token, op, code, requestId: randomUUID(), ...fields }), signal: AbortSignal.timeout(45000),
  });
  const body = await response.json();
  if (expectedError) { assert.equal(body.error, expectedError); return body; }
  assert.equal(response.status, 200, `${op}: ${body.error || response.status}`);
  assert.ok(body.view); return body;
}
let host = randomUUID();
const created = await call(host, 'create', { name: 'Verification host' });
code = created.view.code;
let view = created.view;
const members = [host];
const tokens = Array.from({ length: 5 }, () => randomUUID());
view = (await call(host, 'command', { command: { type: 'addSeat', name: 'Verification A' } })).view;
const reservedSeat = view.seats.find(seat => seat.name === 'Verification A').id;
const joins = await Promise.all(tokens.map((token, i) => call(token, 'join', { name: `Verification ${String.fromCharCode(65 + i)}` })));
assert.ok(joins.every(reply => reply.view.me && !reply.view.myRequest));
assert.equal(joins[0].view.me.seatId, reservedSeat);
view = (await call(host, 'sync')).view;
assert.equal(view.requests.length, 0);
members.push(...tokens);
view = (await call(host, 'sync')).view;
assert.equal(view.seats.length, 6);
// Explicit lobby exits remove seats; reconnecting creates one seat without approval.
const guestBefore = (await call(tokens[0], 'sync')).view.me.seatId;
const guestLeft = await call(tokens[0], 'command', { command: { type: 'leave' } });
assert.equal(guestLeft.view.me, null);
assert.equal(guestLeft.view.seats.length, 5);
await call(tokens[0], 'sync', {}, 'NOT_SEATED');
const guestReturned = await call(tokens[0], 'join', { name: 'Verification A' });
assert.ok(guestReturned.view.me);
assert.notEqual(guestReturned.view.me.seatId, guestBefore);
// A lobby host exit transfers control and rotates its recovery key atomically.
const lobbySnapshots = await Promise.all(members.map(token => call(token, 'sync')));
const formerHost = host;
const formerKey = lobbySnapshots[0].recoveryKey;
const departure = await call(host, 'command', { command: { type: 'leave' } });
assert.equal(departure.view.me, null);
const successorIndex = lobbySnapshots.findIndex(reply => reply.view.me.seatId === departure.view.hostSeatId);
assert.ok(successorIndex > 0);
host = members[successorIndex];
const successor = await call(host, 'sync');
assert.equal(successor.view.isHost, true);
assert.notEqual(successor.recoveryKey, formerKey);
await call(randomUUID(), 'recover', { recoveryKey: formerKey }, 'invalid-recovery-key');
await call(formerHost, 'join', { name: 'Verification former host' });
members.splice(0, members.length, host, ...members.filter(token => token !== host));
view = (await call(host, 'sync')).view;
assert.equal(view.seats.length, 6);
view = (await call(host, 'command', { command: { type: 'startGame', expectedPhaseId: view.phase.id } })).view;
assert.equal(view.status, 'playing');
assert.equal(view.phase.nightStage, 'opening');
assert.ok(view.phase.nightCues.length > 0);
const initial = await Promise.all(members.map(token => call(token, 'sync')));
for (const reply of initial) {
  assert.ok(reply.view.me.roleId);
  assert.equal(reply.view.seats.filter(seat => seat.roleId).length, 0);
}
const before = initial[1].view.me;
const replacement = randomUUID();
await call(replacement, 'join', { name: 'Verification A returned' });
view = (await call(host, 'sync')).view;
const pending = view.requests.find(r => r.name === 'Verification A returned');
await call(host, 'command', { command: { type: 'approveJoin', requestId: pending.id, replaceSeatId: before.seatId } });
const restored = await call(replacement, 'sync');
assert.equal(restored.view.me.seatId, before.seatId);
assert.equal(restored.view.me.roleId, before.roleId);
assert.equal(restored.recoveryKey, undefined);
await call(members[1], 'sync', {}, 'NOT_SEATED');
members[1] = replacement;
// Narration ACKs and explicit participant actions drive the entire night.
// Every turn in the default six-player deck has living actors, so none needs an idle wait.
view = (await call(host, 'sync')).view;
await call(host, 'command', { command: { type: 'nextPhase', expectedPhaseId: view.phase.id } }, 'NIGHT_FLOW_CONTROLLED');
const nightSteps = new Set();
let nightStages = 0;
while (view.phase.kind === 'night') {
  assert.ok(++nightStages <= 20, 'Night did not finish after the expected role turns.');
  const phase = view.phase;
  if (phase.nightStage === 'opening' || phase.nightStage === 'closing') {
    assert.ok(phase.nightCues.length > 0);
    const packet = { requestId: randomUUID(), command: { type: 'nightNarrationDone', expectedPhaseId: phase.id } };
    const first = await call(host, 'command', packet);
    const retry = await call(host, 'command', packet);
    assert.equal(first.view.phase.id, retry.view.phase.id);
    assert.notEqual(first.view.phase.id, phase.id);
    await call(host, 'command', { command: packet.command }, first.view.phase.kind === 'night' ? 'STALE_PHASE' : 'WRONG_PHASE');
  } else {
    assert.equal(phase.nightStage, 'acting');
    nightSteps.add(phase.step);
    const snapshots = await Promise.all(members.map(token => call(token, 'sync')));
    const participants = snapshots.flatMap((reply, index) => {
      const action = reply.view.me.action;
      assert.ok(reply.view.seats.every(seat => !Object.hasOwn(seat, 'roleId')));
      return action?.kind === 'nightAction' && !action.alreadySubmitted ? [{ token: members[index], action }] : [];
    });
    assert.ok(participants.length > 0, `No living actors in ${phase.step}.`);
    const packets = participants.map(({ token, action }) => {
      assert.equal(action.canSkip, true, 'The default deck must support explicit night skips.');
      return { token, fields: { requestId: randomUUID(), command: { type: 'nightAction', ability: 'skip', expectedPhaseId: phase.id } } };
    });
    await Promise.all(packets.map(({ token, fields }) => call(token, 'command', fields)));
    const closed = (await call(host, 'sync')).view;
    assert.equal(closed.phase.nightStage, 'closing');
    assert.notEqual(closed.phase.id, phase.id);
    const repeated = await call(packets[0].token, 'command', packets[0].fields);
    assert.equal(repeated.view.phase.id, closed.phase.id);
    await call(packets[0].token, 'command', { command: packets[0].fields.command }, 'STALE_PHASE');
  }
  view = (await call(host, 'sync')).view;
}
assert.deepEqual([...nightSteps], ['wolves', 'seer', 'witch']);
assert.equal(view.phase.kind, 'day');
assert.equal(view.day, 1);
assert.ok(view.seats.every(seat => seat.alive));
// Host secret can recover the existing seat on another device; old token is revoked.
const hostState = await call(host, 'sync'); const oldHost = host; host = randomUUID();
const recovery = await call(host, 'recover', { recoveryKey: hostState.recoveryKey, name: 'Recovered host' });
assert.equal(recovery.view.me.seatId, hostState.view.me.seatId);
assert.equal(recovery.view.me.roleId, hostState.view.me.roleId);
assert.notEqual(recovery.recoveryKey, hostState.recoveryKey);
await call(oldHost, 'sync', {}, 'NOT_SEATED');
await call(members[1], 'command', { command: { type: 'startNight', expectedPhaseId: recovery.view.phase.id } }, 'HOST_ONLY');
// A final pause leaves the verification room idle and recoverable.
await call(host, 'command', { command: { type: 'pause', expectedPhaseId: recovery.view.phase.id } });
console.log('Live multiplayer checks passed: six players, automatic concurrent seating, reserved seats, voluntary lobby exits, automatic host transfer, hidden cards, replacement, complete event-driven night, duplicate narration/action protection, host recovery, and permissions.');
