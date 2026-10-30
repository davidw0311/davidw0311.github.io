// Creates disposable test rooms; prints no player tokens or private data.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const base = 'https://vxbhzddlhopsgbwmjzdm.supabase.co';
const key = 'sb_publishable_nDzp9-G2TVUZ2_-NGsxrvA_sczyap7E';
const endpoint = process.argv.find(a => a.startsWith('--url='))?.slice(6) || `${base}/functions/v1/chess`;
const headers = { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, Origin: 'https://davidw0311.github.io' };
async function call(input, expectedError) {
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(input), signal: AbortSignal.timeout(30000) });
  const body = await response.json();
  if (expectedError) { assert.equal(body.error, expectedError); return; }
  assert.equal(response.status, 200, JSON.stringify(body)); assert.ok(body.view); return body.view;
}
const host = randomUUID(), guest = randomUUID();
let view = await call({ op: 'create', token: host, requestId: randomUUID(), name: 'Chess smoke host', color: 'b', removed: ['b1', 'h8'] });
const code = view.code;
const sync = token => call({ op: 'sync', code, token });
const command = async (token, type, extra = {}, expectedError) => {
  const current = await sync(token);
  return call({ op: 'command', code, token, requestId: randomUUID(), command: { type, revision: current.revision, ...extra } }, expectedError);
};
view = await call({ op: 'join', code, token: guest, requestId: randomUUID(), name: 'Chess smoke guest' });
assert.equal(view.me.color, 'w'); assert.deepEqual(view.removed, ['b1', 'h8']);
await call({ op: 'join', code, token: randomUUID(), requestId: randomUUID(), name: 'Third seat' }, 'room-full');
const ready = { type: 'ready', ready: true, setupRevision: view.setupRevision, revision: view.revision };
await Promise.all([host, guest].map(token => call({ op: 'command', code, token, requestId: randomUUID(), command: ready })));
assert.equal((await sync(host)).status, 'playing');
await command(host, 'move', { move: 'e7e5' }, 'not-your-turn');
const current = await sync(guest), move = { op: 'command', code, token: guest, requestId: randomUUID(), command: { type: 'move', move: 'e2e4', revision: current.revision } };
await call(move); assert.equal((await call(move)).moves.length, 1);
await command(host, 'move', { move: 'e7e5' });
const before = await sync(host);
await command(guest, 'takeback', { plies: 2 });
assert.equal((await sync(host)).fen, before.fen);
await command(guest, 'respond', { accept: true }, 'opponent-only');
await command(host, 'respond', { accept: false });
assert.equal((await sync(guest)).moves.length, 2);
await command(guest, 'takeback', { plies: 2 });
await command(host, 'respond', { accept: true });
assert.equal((await sync(guest)).moves.length, 0);
const after = await command(guest, 'resign'); assert.equal(after.result.winner, 'b');
const privateRead = await fetch(`${base}/rest/v1/chess_state?select=key&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
assert.ok([401, 403].includes(privateRead.status), `Private state was accessible: ${privateRead.status}`);
const privateRPC = await fetch(`${base}/rest/v1/rpc/chess_read`, { method: 'POST', headers, body: JSON.stringify({ p_key: `rooms/${code}` }) });
assert.ok([401, 403].includes(privateRPC.status), `Private RPC was accessible: ${privateRPC.status}`);
console.log('Live chess smoke passed: colors, handicap, two-seat limit, simultaneous ready, legal turns, idempotency, agreed/declined takebacks, resignation, and private storage.');
