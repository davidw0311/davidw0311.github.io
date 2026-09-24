'use strict';
const ROOM_WORDS = require('./room-words.json');
const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const engine = require('./engine.js');
const ROOM_TTL = 24 * 60 * 60 * 1000;
const RESULT_TTL = 24 * 60 * 60 * 1000;

const hash = value => createHash('sha256').update(value).digest('hex');
function fail(code, message, status = 400) { const error = new Error(message); error.code = code; error.status = status; error.clientSafe = true; throw error; }
function validToken(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{24,160}$/.test(value); }
function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

class OneNightService {
  constructor(store, clock = Date.now) { this.store = store; this.clock = clock; }
  async limit(address, action, now) {
    const windowMs = action === 'recover' ? 900000 : 3600000;
    const maximum = action === 'create' ? 16 : action === 'recover' ? 12 : 100;
    const window = Math.floor(now / windowMs);
    // One bounded record per address and operation; no ever-growing bucket list.
    await this.store.transact(`limits/${hash(`${address}:${action}`)}`, old => {
      const value = old?.window === window ? old : { window, count: 0 };
      if (value.count >= maximum) fail('too-many-requests', 'Please wait before trying again.', 429);
      value.count += 1;
      return { value, result: true };
    });
  }
  response(room, actor, now) {
    const view = engine.publicView(room, actor, now);
    view.serverTime = now;
    return { view, ...(view.isHost ? { recoveryKey: room._recoveryKey } : {}) };
  }
  async createCode(actor, token, name, now) {
    // One durable allocation per creator makes retries safe across workers.
    // Each candidate is reserved with the same CAS used by normal room writes.
    return this.store.transact(`creators/${actor}`, async old => {
      if (old?.code) return { value: old, changed: false, result: old.code };
      const offset = parseInt(hash(`room:${token}:0`).slice(0, 10), 16) % ROOM_WORDS.length;
      for (let attempt = 0; attempt < ROOM_WORDS.length + 64; attempt++) {
        let value = parseInt(hash(`room:${token}:${attempt}`).slice(0, 10), 16) % (26 ** 4);
        let code = '';
        for (let i = 0; i < 4; i++) { code = String.fromCharCode(65 + value % 26) + code; value = Math.floor(value / 26); }
        if (attempt < ROOM_WORDS.length) code = ROOM_WORDS[(offset + attempt) % ROOM_WORDS.length];
        const claimed = await this.store.transact(`rooms/${code}`, room => {
          if (room && room.status !== 'disbanded' && now - room._lastActive <= ROOM_TTL) return { value: room, changed: false, result: room._creator === actor };
          if (room && room._lastActive == null && room.status !== 'disbanded') return {value: room, changed: false, result: false};
          room = engine.createRoom({ code, hostId: actor, hostName: name, now });
          room._creator = actor; room._recoveryKey = randomBytes(24).toString('base64url');
          room._requests = {}; room._lastActive = now;
          return { value: room, result: true };
        });
        if (claimed) return { value: { code }, result: code };
      }
      fail('room-code-busy', 'Please try creating a room again.', 503);
    });
  }
  async handle(input, address = 'unknown') {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('invalid-request', 'Invalid request.');
    const { op, token, requestId } = input;
    if (!['create', 'join', 'sync', 'command', 'recover'].includes(op)) fail('invalid-operation', 'Unknown operation.');
    if (!validToken(token)) fail('invalid-session', 'Please join with a new session.', 401);
    if (op !== 'sync' && (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId))) fail('invalid-request-id', 'A unique request ID is required.');
    const actor = hash(token);
    const now = this.clock();
    if (['create', 'join', 'recover'].includes(op)) await this.limit(address, op, now);
    const code = op === 'create' ? await this.createCode(actor, token, input.name, now) : String(input.code || '').trim().toUpperCase();
    if (!/^(?:[A-Z]{4}|[A-F0-9]{8})$/.test(code)) fail('invalid-room-code', 'Enter the four-letter room code. Older eight-character invitations still work.');
    return this.store.transact(`rooms/${code}`, old => {
      let room = old;
      if (room?.status === 'disbanded') fail('room-disbanded', 'The host has disbanded this room.', 410);
      if (op === 'create') {
        if (room) {
          if (room._creator !== actor) fail('room-code-collision', 'Create a new session and try again.', 409);
          return { value: room, changed: false, result: this.response(room, actor, now) };
        }
        room = engine.createRoom({ code, hostId: actor, hostName: input.name, now });
        room._creator = actor;
        room._recoveryKey = randomBytes(24).toString('base64url');
        room._requests = {};
        room._lastActive = now;
        return { value: room, result: this.response(room, actor, now) };
      }
      if (!room) fail('room-not-found', 'This room has ended or expired. Please create or join a new room.', 404);
      if (room._expiresAt && now >= room._expiresAt) fail('room-expired', 'This game has ended and its room has been deleted.', 410);
      if (now - room._lastActive > ROOM_TTL) fail('room-expired', 'This room expired after 24 hours without player activity.', 410);
      const receiptKey = `${actor}:${requestId}`;
      const fingerprint = hash(JSON.stringify({ op, name: input.name, command: input.command, recoveryKey: input.recoveryKey }));
      if (op !== 'sync' && room._requests?.[receiptKey]) {
        if (room._requests[receiptKey].fingerprint !== fingerprint) fail('request-id-reused', 'Retry the original action or use a new request.', 409);
        return { value: room, changed: false, result: this.response(room, actor, now) };
      }
      // Completed rounds remain available for a rematch until the room expires.
      const before = room.revision;
      const previousExpiry = room._expiresAt;
      const previousHost = room.hostId;
      if (op === 'recover') {
        if (!sameSecret(input.recoveryKey, room._recoveryKey)) fail('invalid-recovery-key', 'The host recovery key is incorrect.', 403);
        engine.recoverHost(room, actor, now);
        room._recoveryKey = randomBytes(24).toString('base64url');
      } else if (op === 'join') {
        engine.applyCommand(room, actor, { type: 'requestJoin', name: input.name }, now);
      } else if (op === 'sync') {
        engine.applyCommand(room, actor, { type: 'heartbeat' }, now);
      } else {
        if (!input.command || typeof input.command !== 'object' || Array.isArray(input.command)) fail('invalid-command', 'Choose a game action.');
        if (['heartbeat', 'requestJoin'].includes(input.command.type)) fail('invalid-command', 'Use the join or sync operation.');
        // Receipts are checked above: retrying a successful action consumes no allowance.
        // This counter shares the room CAS, so limits survive restarts and multiple workers.
        room._commandLimits ??= {};
        const window = Math.floor(now / 60000);
        const counter = room._commandLimits[actor]?.window === window ? room._commandLimits[actor] : { window, count: 0 };
        if (counter.count >= 60) fail('too-many-requests', 'Please wait before sending more room actions.', 429);
        counter.count++;
        room._commandLimits[actor] = counter;
        for (const identity of Object.keys(room._commandLimits)) {
          if (identity !== actor && !room.members[identity]) delete room._commandLimits[identity];
        }
        engine.applyCommand(room, actor, input.command, now);
      }
      if (engine.tickRoom) engine.tickRoom(room, now);
      // A transferred host receives a fresh recovery secret; the old host loses it.
      if (previousHost !== room.hostId && room.hostId && op !== 'recover') room._recoveryKey = randomBytes(24).toString('base64url');
      if (op !== 'sync') {
        room._requests ??= {};
        room._requests[receiptKey] = { fingerprint, at: now };
        const keys = Object.keys(room._requests);
        for (const key of keys.slice(0, Math.max(0, keys.length - 512))) delete room._requests[key];
      }
      if (op !== 'sync' && input.command?.type !== 'narrationDone') room._lastActive = Math.max(room._lastActive || 0, now);
      if (room.status === 'disbanded') room._expiresAt ??= now + 60000;
      else if (room.status === 'finished') room._expiresAt ??= now + RESULT_TTL;
      else delete room._expiresAt;
      const changed = op !== 'sync' || room.revision !== before || room._expiresAt !== previousExpiry;
      return { value: room, changed, result: this.response(room, actor, now) };
    });
  }
}
module.exports = { OneNightService, sameSecret };
