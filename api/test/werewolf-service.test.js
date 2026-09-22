const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { WerewolfService } = require('../src/werewolf/service.js');
const { BlobRoomStore } = require('../src/werewolf/storage.js');

class MemoryStore {
  constructor() { this.data = new Map(); this.queue = Promise.resolve(); }
  async transact(key, operation) {
    const run = this.queue.then(async () => {
      const entry = this.data.get(key);
      const result = await operation(entry ? structuredClone(entry) : null);
      if (result.changed !== false) this.data.set(key, structuredClone(result.value));
      return result.result;
    });
    this.queue = run.catch(() => {}); return run;
  }
}
function setup() {
  const store = new MemoryStore(); let now = 100000;
  const service = new WerewolfService(store, () => now);
  const token = randomUUID();
  const call = (input) => service.handle({ token, requestId: randomUUID(), ...input }, 'test-ip');
  return { store, service, token, call, advance: ms => { now += ms; } };
}
test('create retries after lost response recover the same durable room and host secret', async () => {
  const t = setup(); const a = await t.call({ op: 'create', name: 'Host' });
  const b = await new WerewolfService(t.store, () => 100001).handle({ op: 'create', name: 'Host', token: t.token, requestId: randomUUID() });
  assert.equal(a.view.code, b.view.code); assert.equal(a.recoveryKey, b.recoveryKey);
  assert.equal(b.view.seats.length, 1); assert.equal(b.view.isHost, true);
});
test('concurrent joins are durable; approval retry does not add duplicate seats', async () => {
  const t = setup(); const { view } = await t.call({ op: 'create', name: 'Host' });
  const guests = [randomUUID(), randomUUID(), randomUUID()];
  await Promise.all(guests.map((token, i) => t.call({ op: 'join', code: view.code, token, name: `Player ${i}` })));
  const synced = await t.call({ op: 'sync', code: view.code });
  assert.equal(synced.view.requests.length, 3);
  const command = { type: 'approveJoin', requestId: synced.view.requests[0].id };
  const request = { op: 'command', code: view.code, requestId: randomUUID(), command };
  const a = await t.call(request); const b = await t.call(request);
  assert.equal(a.view.seats.length, 2); assert.equal(b.view.seats.length, 2);
  await assert.rejects(t.call({ ...request, command: { type: 'addSeat', name: 'Injected' } }), { code: 'request-id-reused' });
});
test('replacement revokes prior token, keeps seat, and never exposes host recovery key', async () => {
  const t = setup(); const { view } = await t.call({ op: 'create', name: 'Host' });
  const oldToken = randomUUID(), newToken = randomUUID();
  await t.call({ op: 'join', code: view.code, token: oldToken, name: 'A' });
  let host = await t.call({ op: 'sync', code: view.code });
  host = await t.call({ op: 'command', code: view.code, command: { type: 'approveJoin', requestId: host.view.requests[0].id } });
  const seat = host.view.seats.find(s => s.name === 'A');
  const pending = await t.call({ op: 'join', code: view.code, token: newToken, name: 'A' });
  assert.equal(pending.recoveryKey, undefined); assert.equal(pending.view.me, null);
  host = await t.call({ op: 'sync', code: view.code });
  await t.call({ op: 'command', code: view.code, command: { type: 'approveJoin', requestId: host.view.requests[0].id, replaceSeatId: seat.id } });
  const replacement = await t.call({ op: 'sync', code: view.code, token: newToken });
  assert.equal(replacement.view.me.seatId, seat.id); assert.equal(replacement.recoveryKey, undefined);
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
  host = await t.call({ op: 'command', code, command: { type: 'approveJoin', requestId: host.view.requests[0].id } });
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
