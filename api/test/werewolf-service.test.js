const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { WerewolfService } = require('../src/werewolf/service.js');
const { BlobRoomStore } = require('../src/werewolf/storage.js');

class MemoryStore {
  constructor() { this.data = new Map(); this.queues = new Map(); }
  async transact(key, operation) {
    const run = (this.queues.get(key) || Promise.resolve()).then(async () => {
      const entry = this.data.get(key);
      const result = await operation(entry ? structuredClone(entry) : null);
      if (result.changed !== false) this.data.set(key, structuredClone(result.value));
      return result.result;
    });
    this.queues.set(key, run.catch(() => {})); return run;
  }
}
function setup() {
  const store = new MemoryStore(); let now = 100000;
  const service = new WerewolfService(store, () => now);
  const token = randomUUID();
  const call = (input) => service.handle({ token, requestId: randomUUID(), ...input }, 'test-ip');
  return { store, service, token, call, advance: ms => { now += ms; } };
}
async function sixPlayerGame() {
  const t = setup();
  const created = await t.call({ op: 'create', name: 'Host' });
  const code = created.view.code;
  const members = [t.token, ...Array.from({ length: 5 }, () => randomUUID())];
  for (const [i, token] of members.slice(1).entries()) await t.call({ op: 'join', code, token, name: `Player ${i}` });
  const dealt = await t.call({ op: 'command', code, command: { type: 'startGame', expectedPhaseId: created.view.phase.id } });
  for (const token of members) await t.call({op:'command',code,token,command:{type:'ready', expectedPhaseId:dealt.view.phase.id}});
  const started = await t.call({op:'command',code,command:{type:'startNight',expectedPhaseId:dealt.view.phase.id}});
  return { ...t, code, members, started };
}
test('create retries after lost response recover the same durable room and host secret', async () => {
  const t = setup(); const a = await t.call({ op: 'create', name: 'Host' });
  const b = await new WerewolfService(t.store, () => 100001).handle({ op: 'create', name: 'Host', token: t.token, requestId: randomUUID() });
  assert.equal(a.view.code, b.view.code); assert.equal(a.recoveryKey, b.recoveryKey);
  assert.equal(b.view.seats.length, 1); assert.equal(b.view.isHost, true);
});
test('concurrent lobby joins seat immediately and repeated join receipts never duplicate seats', async () => {
  const t = setup(); const { view } = await t.call({ op: 'create', name: 'Host' });
  const guests = [randomUUID(), randomUUID(), randomUUID()];
  const packets = guests.map((token, i) => ({ op: 'join', code: view.code, token, name: `Player ${i}`, requestId: randomUUID() }));
  const results = await Promise.all(packets.map(packet => t.call(packet)));
  assert.ok(results.every(reply => reply.view.me && reply.view.myRequest === null));
  const synced = await t.call({ op: 'sync', code: view.code });
  assert.equal(synced.view.requests.length, 0);
  assert.equal(synced.view.seats.length, 4);
  const retry = await t.call(packets[0]);
  assert.equal(retry.view.me.seatId, results[0].view.me.seatId);
  assert.equal(retry.view.seats.length, 4);
  await assert.rejects(t.call({ ...packets[0], name: 'Injected' }), { code: 'request-id-reused' });
});
test('replacement revokes prior token, keeps seat, and never exposes host recovery key', async () => {
  const t = setup(); const { view } = await t.call({ op: 'create', name: 'Host' });
  const oldToken = randomUUID(), newToken = randomUUID();
  await t.call({ op: 'join', code: view.code, token: oldToken, name: 'A' });
  for (let i = 0; i < 4; i++) await t.call({ op: 'join', code: view.code, token: randomUUID(), name: `Other ${i}` });
  let host = await t.call({ op: 'sync', code: view.code });
  host = await t.call({ op: 'command', code: view.code, command: { type: 'startGame', expectedPhaseId: host.view.phase.id } });
  const original = await t.call({ op: 'sync', code: view.code, token: oldToken });
  const seat = host.view.seats.find(s => s.name === 'A');
  const pending = await t.call({ op: 'join', code: view.code, token: newToken, name: 'A' });
  assert.equal(pending.recoveryKey, undefined); assert.equal(pending.view.me, null);
  host = await t.call({ op: 'sync', code: view.code });
  await t.call({ op: 'command', code: view.code, command: { type: 'approveJoin', requestId: host.view.requests[0].id, replaceSeatId: seat.id } });
  const replacement = await t.call({ op: 'sync', code: view.code, token: newToken });
  assert.equal(replacement.view.me.seatId, seat.id); assert.equal(replacement.view.me.roleId, original.view.me.roleId); assert.equal(replacement.recoveryKey, undefined);
  await assert.rejects(t.call({ op: 'command', code: view.code, token: oldToken, command: { type: 'addSeat', name: 'Attacker' } }), { code: 'HOST_ONLY' });
});
test('host recovery survives service restart, rotates key, and invalidates old host control', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' });
  const token = randomUUID();
  await assert.rejects(t.call({ op: 'recover', code: created.view.code, token, recoveryKey: 'wrong' }), { code: 'invalid-recovery-key' });
  const recovered = await t.call({ op: 'recover', code: created.view.code, token, recoveryKey: created.recoveryKey });
  assert.equal(recovered.view.isHost, true); assert.equal(recovered.view.me.seatId, created.view.me.seatId);
  assert.notEqual(recovered.recoveryKey, created.recoveryKey);
  await assert.rejects(t.call({ op: 'recover', code: created.view.code, token: randomUUID(), recoveryKey: created.recoveryKey }), { code: 'invalid-recovery-key' });
  await assert.rejects(t.call({ op: 'command', code: created.view.code, command: { type: 'addSeat', name: 'Old host' } }), { code: 'HOST_ONLY' });
});
test('host transfer rotates recovery key and only the new host receives it', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' }); const code = created.view.code;
  const token = randomUUID(); await t.call({ op: 'join', code, token, name: 'Next host' });
  let host = await t.call({ op: 'sync', code });
  const next = host.view.seats.find(s => s.name === 'Next host');
  const prior = await t.call({ op: 'command', code, command: { type: 'transferHost', seatId: next.id } });
  assert.equal(prior.recoveryKey, undefined);
  const current = await t.call({ op: 'sync', code, token });
  assert.ok(current.recoveryKey); assert.notEqual(current.recoveryKey, created.recoveryKey);
});
test('recovery attempts are durably rate limited across workers', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' });
  for (let i = 0; i < 12; i++) {
    const worker = new WerewolfService(t.store, () => 100000);
    await assert.rejects(worker.handle({ op: 'recover', code: created.view.code, token: randomUUID(), requestId: randomUUID(), recoveryKey: 'wrong' }, 'shared-address'), { code: 'invalid-recovery-key' });
  }
  await assert.rejects(t.service.handle({ op: 'recover', code: created.view.code, token: randomUUID(), requestId: randomUUID(), recoveryKey: created.recoveryKey }, 'shared-address'), { code: 'too-many-requests' });
});
test('inactive rooms expire, malformed requests rejected without creating state', async () => {
  const t = setup();
  await assert.rejects(t.call({ op: 'create', token: 'short', name: 'X' }), { code: 'invalid-session' });
  await assert.rejects(t.call({ op: 'join', code: '../secret', name: 'X' }), { code: 'invalid-room-code' });
  const created = await t.call({ op: 'create', name: 'Host' });
  t.advance(8 * 86400000);
  await assert.rejects(t.call({ op: 'sync', code: created.view.code }), { code: 'room-expired' });
});
test('Blob CAS retries against latest state instead of overwriting a concurrent action', async () => {
  const store = Object.create(BlobRoomStore.prototype); let stored = { count: 0 }; let version = 1, writes = 0;
  store.read = async () => ({ value: structuredClone(stored), etag: String(version) });
  store.write = async (_key, value, etag) => {
    writes++;
    if (writes === 1) { stored.count += 10; version++; return false; }
    assert.equal(etag, String(version)); stored = structuredClone(value); version++; return true;
  };
  const result = await store.transact('room', value => { value.count++; return { value, result: value.count }; });
  assert.equal(result, 11); assert.equal(stored.count, 11); assert.equal(writes, 2);
});
test('all room snapshots exclude server session hashes and recovery secrets', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' });
  const guest = await t.call({ op: 'join', code: created.view.code, token: randomUUID(), name: 'Guest' });
  const serialized = JSON.stringify(guest);
  for (const secret of [t.token, created.recoveryKey, '_requests', '_creator', 'actorId', 'hostId', 'members']) assert.ok(!serialized.includes(secret), secret);
});

test('successful command rate limits persist across workers and idempotent retries are free', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' }); const code = created.view.code;
  const request = { op: 'command', code, requestId: randomUUID(), command: { type: 'updateSettings', settings: { nightSeconds: 45 } } };
  await t.call(request);
  for (let i = 1; i < 60; i++) await t.call({ ...request, requestId: randomUUID() });
  await t.call(request);
  const worker = new WerewolfService(t.store, () => 100001);
  await assert.rejects(worker.handle({ ...request, requestId: randomUUID(), token: t.token }), { code: 'too-many-requests', status: 429 });
  t.advance(60000);
  await t.call({ ...request, requestId: randomUUID() });
});

test('lobby leave and rejoin receipts cannot resurrect or remove a later occupancy', async () => {
  const t = setup(); const { view } = await t.call({ op: 'create', name: 'Host' }); const code = view.code;
  const token = randomUUID();
  const join = { op: 'join', code, token, name: 'Guest', requestId: randomUUID() };
  const joined = await t.call(join);
  const leave = { op: 'command', code, token, command: { type: 'leave' }, requestId: randomUUID() };
  const left = await t.call(leave);
  assert.equal(left.view.me, null); assert.equal(left.view.seats.length, 1);
  const staleJoin = await t.call(join);
  assert.equal(staleJoin.view.me, null); assert.equal(staleJoin.view.seats.length, 1);
  const returned = await t.call({ ...join, requestId: randomUUID() });
  assert.notEqual(returned.view.me.seatId, joined.view.me.seatId);
  const staleLeave = await t.call(leave);
  assert.equal(staleLeave.view.me.seatId, returned.view.me.seatId);
  assert.equal(staleLeave.view.seats.length, 2);
});

test('host departure automatically transfers authority and rotates the recovery secret', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' }); const code = created.view.code;
  const next = randomUUID(); const joined = await t.call({ op: 'join', code, token: next, name: 'Successor' });
  const left = await t.call({ op: 'command', code, command: { type: 'leave' } });
  assert.equal(left.view.me, null); assert.equal(left.recoveryKey, undefined);
  assert.equal(left.view.hostSeatId, joined.view.me.seatId);
  const successor = await t.call({ op: 'sync', code, token: next });
  assert.equal(successor.view.isHost, true);
  assert.notEqual(successor.recoveryKey, created.recoveryKey);
  await assert.rejects(t.call({ op: 'recover', code, token: randomUUID(), recoveryKey: created.recoveryKey }), { code: 'invalid-recovery-key' });
  await assert.rejects(t.call({ op: 'command', code, command: { type: 'addSeat', name: 'Former host' } }), { code: 'HOST_ONLY' });
});

test('an empty lobby has no host until the next join receives a fresh recovery key', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' }); const code = created.view.code;
  await t.call({ op: 'command', code, command: { type: 'addSeat', name: 'Reserved' } });
  const left = await t.call({ op: 'command', code, command: { type: 'leave' } });
  assert.equal(left.view.hostSeatId, null); assert.ok(left.view.seats.every(seat => !seat.isHost));
  const newToken = randomUUID(); const joined = await t.call({ op: 'join', code, token: newToken, name: 'Reserved' });
  assert.equal(joined.view.isHost, true); assert.equal(joined.view.seats.length, 1);
  assert.ok(joined.recoveryKey); assert.notEqual(joined.recoveryKey, created.recoveryKey);
  await assert.rejects(t.call({ op: 'recover', code, token: randomUUID(), recoveryKey: created.recoveryKey }), { code: 'invalid-recovery-key' });
});

test('an underway leave/rejoin keeps the same hidden identity and restores presence', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' }); const code = created.view.code;
  const players = Array.from({ length: 5 }, () => randomUUID());
  for (const [i, token] of players.entries()) await t.call({ op: 'join', code, token, name: `Player ${i}` });
  const started = await t.call({ op: 'command', code, command: { type: 'startGame', expectedPhaseId: created.view.phase.id } });
  assert.equal(started.view.status, 'playing');
  const before = await t.call({ op: 'sync', code, token: players[0] });
  await t.call({ op: 'command', code, token: players[0], command: { type: 'leave' } });
  const returned = await t.call({ op: 'join', code, token: players[0], name: 'Returning' });
  assert.equal(returned.view.me.seatId, before.view.me.seatId);
  assert.equal(returned.view.me.roleId, before.view.me.roleId);
  assert.equal(returned.view.seats.length, 6);
  assert.equal(returned.view.seats.find(seat => seat.id === before.view.me.seatId).connected, true);
  assert.ok(returned.view.seats.every(seat => !Object.hasOwn(seat, 'roleId')));
});

test('concurrent start and join preserve the order of the room transaction without leaking cards', async () => {
  for (const joinFirst of [true, false]) {
    const t = setup(); const created = await t.call({ op: 'create', name: 'Host' }); const code = created.view.code;
    for (let i = 0; i < 5; i++) await t.call({ op: 'join', code, token: randomUUID(), name: `Player ${i}` });
    const newcomer = randomUUID();
    const join = { op: 'join', code, token: newcomer, name: 'Concurrent newcomer' };
    const start = { op: 'command', code, command: { type: 'startGame', expectedPhaseId: created.view.phase.id } };
    const originalTransact = t.store.transact.bind(t.store);
    let markEntered, release;
    const entered = new Promise(resolve => { markEntered = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    let armed = true;
    t.store.transact = (key, operation) => originalTransact(key, async old => {
      if (armed && key === `rooms/${code}`) { armed = false; markEntered(); await gate; }
      return operation(old);
    });
    const first = t.call(joinFirst ? join : start);
    await entered;
    const second = t.call(joinFirst ? start : join);
    release();
    await Promise.all([first, second]);
    const guest = await t.call({ op: 'sync', code, token: newcomer });
    const host = await t.call({ op: 'sync', code });
    assert.equal(host.view.status, 'playing');
    assert.equal(host.view.seats.length, joinFirst ? 7 : 6);
    if (joinFirst) { assert.ok(guest.view.me.roleId); assert.equal(guest.view.myRequest, null); }
    else { assert.equal(guest.view.me, null); assert.equal(guest.view.myRequest.status, 'pending'); }
    assert.ok(guest.view.seats.every(seat => !Object.hasOwn(seat, 'roleId')));
  }
});

test('legacy pending lobby sync auto-admits and rotates host recovery when previously empty', async () => {
  const t = setup(); const created = await t.call({ op: 'create', name: 'Host' }); const code = created.view.code;
  await t.call({ op: 'command', code, command: { type: 'leave' } });
  const token = randomUUID(); const actor = require('node:crypto').createHash('sha256').update(token).digest('hex');
  const room = t.store.data.get(`rooms/${code}`);
  room.requests.push({ id: randomUUID(), actorId: actor, name: 'Previously waiting', createdAt: 100000 });
  const admitted = await t.call({ op: 'sync', code, token });
  assert.equal(admitted.view.isHost, true); assert.equal(admitted.view.myRequest, null);
  assert.equal(admitted.view.seats.length, 1); assert.ok(admitted.recoveryKey);
  assert.notEqual(admitted.recoveryKey, created.recoveryKey);
});


test('night narration receipts advance once and stale acknowledgements cannot skip a stage', async () => {
  const t = await sixPlayerGame();
  const { code, started } = t;
  assert.equal(started.view.phase.nightStage, 'opening');
  assert.ok(started.view.phase.nightCues.length > 0);
  const before = await Promise.all(t.members.map(token => t.call({ op: 'sync', code, token })));
  assert.ok(before.every(reply => reply.view.me.action === null));
  const packet = { op: 'command', code, requestId: randomUUID(), command: { type: 'nightNarrationDone', expectedPhaseId: started.view.phase.id } };
  const first = await t.call(packet);
  assert.equal(first.view.phase.nightStage, 'acting');
  assert.notEqual(first.view.phase.id, started.view.phase.id);
  const retry = await t.call(packet);
  assert.equal(retry.view.phase.id, first.view.phase.id);
  assert.equal(retry.view.phase.nightStage, 'acting');
  await assert.rejects(t.call({ ...packet, requestId: randomUUID() }), { code: 'STALE_PHASE' });
  const current = await t.call({ op: 'sync', code });
  assert.equal(current.view.phase.id, first.view.phase.id);
});

test('concurrent eligible night actions close only after everyone submits and durable retries are harmless', async () => {
  const t = await sixPlayerGame();
  const { code } = t;
  const acting = await t.call({ op: 'command', code, command: { type: 'nightNarrationDone', expectedPhaseId: t.started.view.phase.id } });
  const phaseId = acting.view.phase.id;
  const snapshots = await Promise.all(t.members.map(token => t.call({ op: 'sync', code, token })));
  const eligible = snapshots.flatMap((reply, i) => reply.view.me.action?.kind === 'nightAction' ? [t.members[i]] : []);
  assert.equal(eligible.length, 2);
  await assert.rejects(t.call({ op: 'command', code, token: eligible[0], command: { type: 'nightAction', targetId: acting.view.seats.at(-1).id, expectedPhaseId: t.started.view.phase.id } }), { code: 'STALE_PHASE' });
  const packets = eligible.map(token => ({ op: 'command', code, token, requestId: randomUUID(), command: { type: 'nightAction', targetId: acting.view.seats.at(-1).id, expectedPhaseId: phaseId } }));
  const results = await Promise.all(packets.map(packet => t.call(packet)));
  assert.equal(results.filter(reply => reply.view.phase.nightStage === 'acting').length, 1);
  assert.equal(results.filter(reply => reply.view.phase.nightStage === 'closing').length, 1);
  const closing = await t.call({ op: 'sync', code });
  assert.equal(closing.view.phase.nightStage, 'closing');
  assert.notEqual(closing.view.phase.id, phaseId);
  assert.ok(closing.view.phase.nightCues.length > 0);
  for (const packet of packets) {
    const retry = await t.call(packet);
    assert.equal(retry.view.phase.id, closing.view.phase.id);
    await assert.rejects(t.call({ ...packet, requestId: randomUUID() }), { code: 'STALE_PHASE' });
  }
  const next = await t.call({ op: 'command', code, command: { type: 'nightNarrationDone', expectedPhaseId: closing.view.phase.id } });
  assert.equal(next.view.phase.nightStage, 'opening');
  assert.notEqual(next.view.phase.step, closing.view.phase.step);
});

test('a submitted night action survives disconnect and restart without pausing the room', async () => {
  const t = await sixPlayerGame(); const { code } = t;
  const acting = await t.call({ op: 'command', code, command: { type: 'nightNarrationDone', expectedPhaseId: t.started.view.phase.id } });
  const snapshots = await Promise.all(t.members.map(token => t.call({ op: 'sync', code, token })));
  const wolves = snapshots.flatMap((reply, i) => reply.view.me.action?.kind === 'nightAction' ? [t.members[i]] : []);
  const first = await t.call({ op: 'command', code, token: wolves[0], command: { type: 'nightAction', targetId: acting.view.seats.at(-1).id, expectedPhaseId: acting.view.phase.id } });
  assert.equal(first.view.phase.nightStage, 'acting');
  assert.equal(first.view.me.action.alreadySubmitted, true);
  await t.call({ op: 'command', code, token: wolves[0], command: { type: 'nightAction', targetId: acting.view.seats.at(-1).id, expectedPhaseId: acting.view.phase.id } });
  await t.call({ op: 'command', code, token: wolves[0], command: { type: 'leave' } });
  const restarted = new WerewolfService(t.store, () => 100001);
  const returned = await restarted.handle({ op: 'join', code, token: wolves[0], name: 'Returning player', requestId: randomUUID() }, 'test-ip');
  assert.equal(returned.view.phase.nightStage, 'acting');
  assert.equal(returned.view.phase.paused, false);
  assert.equal(returned.view.phase.id, acting.view.phase.id);
  const reconnected = await restarted.handle({ op: 'sync', code, token: wolves[0] }, 'test-ip');
  assert.equal(reconnected.view.me.action.alreadySubmitted, true);
  const closed = await restarted.handle({ op: 'command', code, token: wolves[1], requestId: randomUUID(), command: { type: 'nightAction', targetId: acting.view.seats.at(-1).id, expectedPhaseId: acting.view.phase.id } }, 'test-ip');
  assert.equal(closed.view.phase.nightStage, 'closing');
});


test('night actions wait offline until an idempotent host hard skip', async () => {
  const t = await sixPlayerGame(); const { code } = t;
  const acting = await t.call({ op: 'command', code, command: { type: 'nightNarrationDone', expectedPhaseId: t.started.view.phase.id } });
  assert.equal(acting.view.settings.autoAdvance, false);
  assert.equal(acting.view.phase.deadline, null);
  const snapshots = await Promise.all(t.members.map(token => t.call({ op: 'sync', code, token })));
  const wolves = snapshots.flatMap((reply, i) => reply.view.me.action?.kind === 'nightAction' ? [{ token: t.members[i], seatId: reply.view.me.seatId }] : []);
  const packet = { op: 'command', code, token: wolves[0].token, requestId: randomUUID(), command: { type: 'nightAction', ability: 'skip', expectedPhaseId: acting.view.phase.id } };
  await t.call(packet);
  const before = structuredClone(t.store.data.get(`rooms/${code}`).actions.wolves[wolves[0].seatId]);
  await t.call({ op: 'command', code, command: { type: 'leave' } });
  t.advance(45000);
  const waiting = await t.call({ op: 'sync', code, token: wolves[1].token });
  assert.equal(waiting.view.phase.id, acting.view.phase.id);
  const skip = { op: 'command', code, requestId: randomUUID(), command: { type: 'hardSkip', expectedPhaseId: acting.view.phase.id } };
  await assert.rejects(t.call({ ...skip, token: t.members[1] }), {code:'HOST_ONLY'});
  const closed = await t.call(skip);
  assert.equal((await t.call(skip)).view.phase.id, closed.view.phase.id);
  await assert.rejects(t.call({ op: 'command', code, token: wolves[1].token, command: { type: 'nightAction', ability: 'skip', expectedPhaseId: acting.view.phase.id } }), { code: 'STALE_PHASE' });
  assert.equal(closed.view.phase.nightStage, 'closing');
  assert.equal(closed.view.phase.paused, false);
  assert.equal(closed.view.phase.deadline, null);
  const stored = t.store.data.get(`rooms/${code}`);
  assert.deepEqual(stored.actions.wolves[wolves[0].seatId], before);
  assert.equal(stored.actions.wolves[wolves[1].seatId], undefined);
  const retry = await t.call(packet);
  assert.equal(retry.view.phase.id, closed.view.phase.id);
  assert.ok(!JSON.stringify(closed).includes('eligibleSeatIds'));
  assert.ok(!JSON.stringify(closed).includes('nightFlow'));
});

test('concurrent replacement and hard skip preserve one closing stage and idempotent approval', async () => {
  for (const replacementFirst of [true, false]) {
    const t = await sixPlayerGame(); const { code } = t;
    const acting = await t.call({ op: 'command', code, command: { type: 'nightNarrationDone', expectedPhaseId: t.started.view.phase.id } });
    const snapshots = await Promise.all(t.members.map(token => t.call({ op: 'sync', code, token })));
    const index = snapshots.findIndex((reply, i) => i > 0 && reply.view.me.action?.kind === 'nightAction');
    const oldToken = t.members[index], newToken = randomUUID();
    const seatId = snapshots[index].view.me.seatId;
    await t.call({ op: 'join', code, token: newToken, name: 'Returning wolf' });
    const requested = await t.call({ op: 'sync', code });
    const approval = { op: 'command', code, requestId: randomUUID(), command: { type: 'approveJoin', requestId: requested.view.requests[0].id, replaceSeatId: seatId } };
    const sync = { op: 'command', code, command: {type:'hardSkip', expectedPhaseId:acting.view.phase.id} };
    t.advance(45000);
    const results = await Promise.all((replacementFirst ? [approval, sync] : [sync, approval]).map(packet => t.call(packet)));
    assert.equal(results[1].view.phase.nightStage, 'closing');
    assert.equal(results[1].view.phase.paused, false);
    const retry = await t.call(approval);
    assert.equal(retry.view.phase.id, results[1].view.phase.id);
    const returned = await t.call({ op: 'sync', code, token: newToken });
    assert.equal(returned.view.me.seatId, seatId);
    assert.equal(returned.view.me.roleId, snapshots[index].view.me.roleId);
    await assert.rejects(t.call({ op: 'sync', code, token: oldToken }), { code: 'NOT_SEATED' });
    await assert.rejects(t.call({ op: 'command', code, token: newToken, command: { type: 'nightAction', ability: 'skip', expectedPhaseId: acting.view.phase.id } }), { code: 'STALE_PHASE' });
  }
});

test('a replacement can submit long after the former deadline', async () => {
  const t = await sixPlayerGame(); const { code } = t;
  const acting = await t.call({ op: 'command', code, command: { type: 'nightNarrationDone', expectedPhaseId: t.started.view.phase.id } });
  const snapshots = await Promise.all(t.members.map(token => t.call({ op: 'sync', code, token })));
  const index = snapshots.findIndex((reply, i) => i > 0 && reply.view.me.action?.kind === 'nightAction');
  const deadline = t.store.data.get(`rooms/${code}`).nightFlow.deadline;
  const token = randomUUID();
  t.advance(440000);
  await t.call({ op: 'join', code, token, name: 'Returning wolf' });
  const requested = await t.call({ op: 'sync', code });
  await t.call({ op: 'command', code, command: { type: 'approveJoin', requestId: requested.view.requests[0].id, replaceSeatId: snapshots[index].view.me.seatId } });
  const submitted = await t.call({ op: 'command', code, token, command: { type: 'nightAction', ability: 'skip', expectedPhaseId: acting.view.phase.id } });
  assert.equal(submitted.view.me.action.alreadySubmitted, true);
  assert.equal(submitted.view.phase.nightStage, 'acting');
  assert.equal(t.store.data.get(`rooms/${code}`).nightFlow.deadline, deadline);
});

test('legacy timed action windows and disconnect pauses migrate once across service restarts', async () => {
  for (const disconnected of [false, true]) {
    const t = await sixPlayerGame(); const { code } = t;
    const acting = await t.call({ op: 'command', code, command: { type: 'nightNarrationDone', expectedPhaseId: t.started.view.phase.id } });
    const room = t.store.data.get(`rooms/${code}`);
    room.nightFlow.deadline = 145000;
    if (disconnected) {
      room.phase.paused = true;
      room.phase.pauseReason = 'disconnected';
      room.nightFlow.remainingMs = 45000;
    }
    const migrated = await t.call({ op: 'sync', code, token: t.members[1] });
    const deadline = t.store.data.get(`rooms/${code}`).nightFlow.deadline;
    assert.equal(deadline, null);
    assert.equal(migrated.view.phase.paused, false);
    assert.equal(migrated.view.phase.deadline, null);
    assert.equal(migrated.view.phase.nightStage, 'acting');
    if (disconnected) assert.notEqual(migrated.view.phase.id, acting.view.phase.id);
    else assert.equal(migrated.view.phase.id, acting.view.phase.id);
    const restarted = new WerewolfService(t.store, () => 120000);
    await restarted.handle({ op: 'sync', code, token: t.members[1] }, 'test-ip');
    assert.equal(t.store.data.get(`rooms/${code}`).nightFlow.deadline, deadline);
    const expiredWorker = new WerewolfService(t.store, () => 999999);
    const closed = await expiredWorker.handle({ op: 'sync', code, token: t.members[1] }, 'test-ip');
    assert.equal(closed.view.phase.nightStage, 'acting');
    assert.equal(closed.view.phase.paused, false);
  }
});

test('four-letter codes are retry-safe and collisions never reveal or overwrite another room', async () => {
 const {createHash}=require('node:crypto'); const t=setup();
 const digest=createHash('sha256').update(`room:${t.token}:0`).digest('hex');
 const words=require('../src/werewolf/room-words.json');
 const collision=words[parseInt(digest.slice(0,10),16)%words.length];
 const occupied={_creator:'another-player',secret:'keep-private'};
 t.store.data.set(`rooms/${collision}`,occupied);
 const results=await Promise.all([t.call({op:'create',name:'Host'}),t.call({op:'create',name:'Host'})]);
 assert.ok(words.includes(results[0].view.code)); assert.match(results[0].view.code,/^[A-Z]{4}$/); assert.notEqual(results[0].view.code,collision);
 assert.equal(results[0].view.code,results[1].view.code);
 assert.deepEqual(t.store.data.get(`rooms/${collision}`),occupied);
 assert.ok(!JSON.stringify(results).includes('keep-private'));
 const guest=await t.call({op:'join',token:randomUUID(),code:results[0].view.code.toLowerCase(),name:'Guest'});
 assert.equal(guest.view.me.roleId,null);
});

test('host disband revokes all members, pending applicants, recovery and joins across restarts', async () => {
 const t=await sixPlayerGame(); const {code}=t; const applicant=randomUUID();
 await t.call({op:'join',code,token:applicant,name:'Pending'});
 const host=await t.call({op:'sync',code});
 await assert.rejects(t.call({op:'command',code,token:t.members[1],command:{type:'disbandRoom'}}),{code:'HOST_ONLY'});
 const closed=await t.call({op:'command',code,command:{type:'disbandRoom'}});
 assert.equal(closed.view.status,'disbanded'); assert.equal(closed.view.me,null); assert.deepEqual(closed.view.seats,[]);
 const restarted=new WerewolfService(t.store,()=>100001);
 for(const token of [...t.members,applicant]) await assert.rejects(restarted.handle({op:'sync',code,token}),{code:'room-disbanded'});
 await assert.rejects(t.call({op:'join',code,token:randomUUID(),name:'Late'}),{code:'room-disbanded'});
 await assert.rejects(t.call({op:'recover',code,token:randomUUID(),recoveryKey:host.recoveryKey}),{code:'room-disbanded'});
});

test('word codes can be reused after disbanding without restoring old sessions or secrets',async()=>{
 const t=setup(); const old=await t.call({op:'create',name:'Old host'}); const code=old.view.code;
 await t.call({op:'command',code,command:{type:'disbandRoom'}});
 const words=require('../src/werewolf/room-words.json'); const {createHash}=require('node:crypto');
 let token; do { token=randomUUID(); } while(words[parseInt(createHash('sha256').update(`room:${token}:0`).digest('hex').slice(0,10),16)%words.length]!==code);
 const fresh=await t.call({op:'create',token,name:'New host'}); assert.equal(fresh.view.code,code); assert.equal(fresh.view.seats.length,1); assert.equal(fresh.view.seats[0].name,'New host');
 await assert.rejects(t.call({op:'sync',code}),{code:'NOT_SEATED'});
 await assert.rejects(t.call({op:'recover',code,token:randomUUID(),recoveryKey:old.recoveryKey}),{code:'invalid-recovery-key'});
});
test('a full word pool safely falls back to four letters without overwriting occupied rooms',async()=>{
 const t=setup(); const words=require('../src/werewolf/room-words.json');
 for(const code of words) t.store.data.set(`rooms/${code}`,{_creator:'other',_lastActive:100000,secret:'private'});
 const created=await t.call({op:'create',name:'Host'}); assert.match(created.view.code,/^[A-Z]{4}$/); assert.ok(!words.includes(created.view.code));
 for(const code of words) assert.equal(t.store.data.get(`rooms/${code}`).secret,'private');
});
