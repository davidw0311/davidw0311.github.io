const test = require('node:test');
const assert = require('node:assert/strict');
const { Chess } = require('chess.js');
const { ChessService } = require('../src/chess/service.js');
const engine = require('../src/chess/engine.js');
const { makeHandler } = require('../src/chess/http.js');
const { SupabaseRoomStore } = require('../src/chess/supabase-storage.js');
const { randomUUID } = require('node:crypto');
class MemoryStore {
  data = new Map(); queues = new Map();
  transact(key, callback) {
    const task = (this.queues.get(key) || Promise.resolve()).then(async () => {
      const result = await callback(structuredClone(this.data.get(key) ?? null));
      if (result.changed !== false) this.data.set(key, structuredClone(result.value));
      return result.result;
    });
    this.queues.set(key, task.catch(() => {})); return task;
  }
}
async function fixture(removed = []) {
  const store = new MemoryStore(); let time = Date.now();
  const service = new ChessService(store, () => time);
  const host = randomUUID(), guest = randomUUID();
  let view = (await service.handle({ op: 'create', token: host, requestId: randomUUID(), name: 'Alice', color: 'w', removed })).view;
  const code = view.code;
  const sync = async (token = host) => (await service.handle({ op: 'sync', token, code })).view;
  const command = async (token, type, extra = {}, revision) => {
    const current = await sync(token);
    view = (await service.handle({ op: 'command', code, token, requestId: randomUUID(), command: { type, revision: revision ?? current.revision, ...(type === 'ready' ? { ready: !current.players.find(p => p.isMe).ready, setupRevision: current.setupRevision } : {}), ...extra } })).view;
    return view;
  };
  const join = async (token = guest) => (await service.handle({ op: 'join', code, token, requestId: randomUUID(), name: 'Bob' })).view;
  const start = async () => { await join(); await command(host, 'ready'); await command(guest, 'ready'); return sync(); };
  return { service, store, host, guest, code, sync, command, join, start, advance: ms => { time += ms; } };
}
test('two seats, complementary selected colors, ready agreement and setup locking', async () => {
  const f = await fixture(); let view = await f.join();
  await f.command(f.host, 'ready');
  view = await f.command(f.guest, 'color', { color: 'w' });
  assert.deepEqual(view.players.map(p => p.color), ['b', 'w']);
  assert.ok(view.players.every(p => !p.ready));
  await f.command(f.host, 'ready');
  view = await f.command(f.guest, 'ready'); assert.equal(view.status, 'playing');
  await assert.rejects(f.command(f.host, 'handicap', { removed: ['d1'] }), { code: 'game-started' });
  await assert.rejects(f.join(randomUUID()), { code: 'room-full' });
});
test('handicaps remove selected pieces and revoke castling for missing rooks', async () => {
  const f = await fixture(['d1', 'h8', 'a2']);
  const view = await f.sync(), game = new Chess(view.fen);
  assert.equal(game.get('d1'), undefined); assert.equal(game.get('a2'), undefined);
  assert.equal(game.getCastlingRights('b').k, false); assert.equal(game.getCastlingRights('b').q, true);
  for (const removed of [['e1'], ['e8'], ['e4'], ['a2', 'a2'], null, 'd1']) {
    assert.throws(() => engine.handicapFen(removed), { code: 'invalid-handicap' });
  }
  await f.join(); await f.command(f.host, 'ready');
  const next = await f.command(f.host, 'handicap', { removed: ['b8'] });
  assert.ok(next.players.every(p => !p.ready));
  await assert.rejects(f.command(f.guest, 'handicap', { removed: [] }), { code: 'host-only' });
});
test('server enforces legal moves, identity, turns and stale position protection', async () => {
  const f = await fixture(); await f.start();
  await assert.rejects(f.command(f.guest, 'move', { move: 'e7e5' }), { code: 'not-your-turn' });
  await assert.rejects(f.command(f.host, 'move', { move: 'e2e5' }), { code: 'illegal-move' });
  const before = await f.sync();
  const next = await f.command(f.host, 'move', { move: 'e2e4' });
  assert.equal(next.moves[0].san, 'e4'); assert.equal(next.turn, 'b');
  await assert.rejects(f.command(f.guest, 'move', { move: 'e7e5' }, before.revision), { code: 'stale-room' });
  await assert.rejects(f.service.handle({ op: 'sync', token: randomUUID(), code: f.code }), { code: 'invalid-session' });
});
test('takebacks require the other player’s explicit approval and can be declined or cancelled', async () => {
  const f = await fixture(); await f.start();
  await f.command(f.host, 'move', { move: 'e2e4' }); await f.command(f.guest, 'move', { move: 'e7e5' });
  const before = await f.sync(); const pending = await f.command(f.host, 'takeback', { plies: 2 });
  assert.equal(pending.fen, before.fen); assert.equal(pending.pending.mine, true);
  assert.equal((await f.sync(f.guest)).pending.mine, false);
  await assert.rejects(f.command(f.host, 'respond', { accept: true }), { code: 'opponent-only' });
  await assert.rejects(f.command(f.host, 'move', { move: 'g1f3' }), { code: 'request-pending' });
  let next = await f.command(f.guest, 'respond', { accept: false }); assert.equal(next.fen, before.fen);
  await f.command(f.guest, 'takeback'); await f.command(f.guest, 'cancel');
  await f.command(f.host, 'takeback', { plies: 2 });
  next = await f.command(f.guest, 'respond', { accept: true });
  assert.equal(next.fen, new Chess().fen()); assert.equal(next.moves.length, 0); assert.equal(next.pending, null);
});
test('request expiry unpauses the board without reverting any moves', async () => {
  const f = await fixture(); await f.start(); await f.command(f.host, 'move', { move: 'e2e4' });
  const old = await f.command(f.host, 'takeback'); f.advance(120001);
  const next = await f.sync(); assert.equal(next.pending, null); assert.equal(next.fen, old.fen);
  await assert.rejects(f.command(f.guest, 'respond', { accept: true }), { code: 'no-request' });
  assert.equal((await f.command(f.guest, 'move', { move: 'e7e5' })).moves.length, 2);
});
test('checkmate ends the game and an approved takeback can reopen it', async () => {
  const f = await fixture(); await f.start();
  for (const [token, move] of [[f.host, 'f2f3'], [f.guest, 'e7e5'], [f.host, 'g2g4'], [f.guest, 'd8h4']]) await f.command(token, 'move', { move });
  const end = await f.sync(); assert.equal(end.status, 'finished'); assert.deepEqual(end.result, { winner: 'b', reason: 'checkmate' });
  await f.command(f.guest, 'takeback');
  const reopened = await f.command(f.host, 'respond', { accept: true });
  assert.equal(reopened.status, 'playing'); assert.equal(reopened.turn, 'b'); assert.equal(reopened.result, null);
});
test('threefold repetitions use the full game history and draws need consent', async () => {
  const f = await fixture(); await f.start();
  await f.command(f.host, 'draw'); await f.command(f.guest, 'respond', { accept: false });
  for (let i = 0; i < 2; i++) for (const [token, move] of [[f.host, 'g1f3'], [f.guest, 'g8f6'], [f.host, 'f3g1'], [f.guest, 'f6g8']]) await f.command(token, 'move', { move });
  assert.equal((await f.sync()).result.reason, 'repetition');
  const g = await fixture(); await g.start(); await g.command(g.host, 'draw');
  assert.equal((await g.command(g.guest, 'respond', { accept: true })).result.reason, 'agreement');
});
test('resigning cannot be silently reversed', async () => {
  const f = await fixture(); await f.start(); await f.command(f.host, 'move', { move: 'e2e4' });
  const next = await f.command(f.guest, 'resign'); assert.equal(next.result.winner, 'w');
  await assert.rejects(f.command(f.host, 'takeback'), { code: 'game-not-playing' });
});
test('retries and service restarts never duplicate moves or rooms', async () => {
  const f = await fixture(); await f.start(); const view = await f.sync();
  const input = { op: 'command', token: f.host, code: f.code, requestId: randomUUID(), command: { type: 'move', move: 'e2e4', revision: view.revision } };
  const a = await f.service.handle(input), b = await new ChessService(f.store).handle(input);
  assert.deepEqual(a.view.moves, b.view.moves); assert.equal(b.view.moves.length, 1);
  await assert.rejects(f.service.handle({ ...input, command: { ...input.command, move: 'd2d4' } }), { code: 'request-id-reused' });
  const token = randomUUID(), create = { op: 'create', token, requestId: randomUUID(), name: 'Retry', color: 'b', removed: [] };
  const rooms = await Promise.all([f.service.handle(create), f.service.handle(create)]);
  assert.equal(rooms[0].view.code, rooms[1].view.code);
});
test('concurrent commands cannot both write on a stale board', async () => {
  const f = await fixture(); await f.start(); const view = await f.sync();
  const outcomes = await Promise.allSettled(['e2e4', 'd2d4'].map(move => f.service.handle({ op: 'command', token: f.host, code: f.code, requestId: randomUUID(), command: { type: 'move', move, revision: view.revision } })));
  assert.equal(outcomes.filter(o => o.status === 'fulfilled').length, 1);
  assert.equal((await f.sync()).moves.length, 1);
});
test('simultaneous ready confirmations succeed only for the same agreed setup', async () => {
  const f = await fixture(); await f.join(); const view = await f.sync();
  const outcomes = await Promise.all([f.host, f.guest].map(token => f.service.handle({ op: 'command', token, code: f.code, requestId: randomUUID(), command: { type: 'ready', ready: true, setupRevision: view.setupRevision, revision: view.revision } })));
  assert.equal(outcomes[1].view.status, 'playing');
  const g = await fixture(); await g.join(); const old = await g.sync();
  await g.command(g.host, 'handicap', { removed: ['d1'] });
  await assert.rejects(g.command(g.guest, 'ready', { ready: true, setupRevision: old.setupRevision }, old.revision), { code: 'stale-room' });
});
test('public views never contain tokens, hashes, receipts or other private storage', async () => {
  const f = await fixture(); await f.start(); const view = JSON.stringify(await f.sync());
  assert.ok(!view.includes(f.host) && !view.includes(f.guest));
  for (const key of ['_requests', '_commandLimits', '_lastActive', 'lastSeen', 'requester', 'host:']) assert.ok(!view.includes(key), key);
  const room = [...f.store.data.entries()].find(([k]) => k.startsWith('rooms/'))[1];
  for (const p of room.players) assert.ok(!view.includes(p.id));
});
test('lobby leave frees a seat, closing the host room stops both seats, and rooms expire', async () => {
  const f = await fixture(); await f.join(); await f.command(f.guest, 'leave');
  assert.equal((await f.sync()).players.length, 1); await f.join(randomUUID());
  await f.command(f.host, 'leave'); await assert.rejects(f.sync(), { code: 'room-closed' });
  const g = await fixture(); g.advance(86400001); await assert.rejects(g.sync(), { code: 'room-expired' });
});
test('HTTP origin, payload and error handling do not expose private server errors', async () => {
  const handler = makeHandler({ handle: async () => { throw new Error('secret backend token'); } });
  const send = (body, origin = 'https://davidw0311.github.io') => handler(new Request('https://example.com', { method: 'POST', headers: { origin }, body }));
  assert.equal((await send('{}', 'https://evil.test')).status, 403);
  assert.equal((await send('x'.repeat(16385))).status, 413);
  assert.equal((await send('bad')).status, 400);
  const failure = await send('{}'); assert.equal(failure.status, 503); assert.ok(!(await failure.text()).includes('secret'));
});
test('private storage CAS retries a concurrent write instead of losing it', async () => {
  let reads = 0, writes = 0;
  const store = new SupabaseRoomStore('https://example.com', 'server-only', async (url, options) => {
    const body = JSON.parse(options.body);
    if (url.endsWith('chess_read')) { reads++; return Response.json({ value: { count: reads }, version: 'version' }); }
    writes++; assert.equal(body.p_value.count, reads + 1); return Response.json(writes > 1);
  });
  assert.equal(await store.transact('rooms/ABCDEF', old => ({ value: { count: old.count + 1 }, result: old.count })), 2);
  assert.equal(writes, 2);
});
