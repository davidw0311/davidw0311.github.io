'use strict';
const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const engine = require('./engine.js');

const hash = value => createHash('sha256').update(value).digest('hex');
function fail(code, message, status = 400) { const error = new Error(message); error.code = code; error.status = status; error.clientSafe = true; throw error; }
function validToken(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{24,160}$/.test(value); }
function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  return timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}

class WerewolfService {
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
  async handle(input, address = 'unknown') {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('invalid-request', 'Invalid request.');
    const { op, token, requestId } = input;
    if (!['create', 'join', 'sync', 'command', 'recover'].includes(op)) fail('invalid-operation', 'Unknown operation.');
    if (!validToken(token)) fail('invalid-session', 'Please join with a new session.', 401);
    if (op !== 'sync' && (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(requestId))) fail('invalid-request-id', 'A unique request ID is required.');
    const actor = hash(token);
    const now = this.clock();
    const code = op === 'create' ? hash(`werewolf:${token}`).slice(0, 8).toUpperCase() : String(input.code || '').trim().toUpperCase();
    if (!/^[A-F0-9]{8}$/.test(code)) fail('invalid-room-code', 'Enter the eight-character room code.');
    if (['create', 'join', 'recover'].includes(op)) await this.limit(address, op, now);
    return this.store.transact(`rooms/${code}`, old => {
      let room = old;
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
      if (!room) fail('room-not-found', 'This room does not exist.', 404);
      if (now - room._lastActive > 7 * 86400000) fail('room-expired', 'This room expired after seven inactive days.', 410);
      const receiptKey = `${actor}:${requestId}`;
      const fingerprint = hash(JSON.stringify({ op, name: input.name, command: input.command, recoveryKey: input.recoveryKey }));
      if (op !== 'sync' && room._requests?.[receiptKey]) {
        if (room._requests[receiptKey].fingerprint !== fingerprint) fail('request-id-reused', 'Retry the original action or use a new request.', 409);
        return { value: room, changed: false, result: this.response(room, actor, now) };
      }
      const before = room.revision;
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
      if (previousHost !== room.hostId && op !== 'recover') room._recoveryKey = randomBytes(24).toString('base64url');
      if (op !== 'sync') {
        room._requests ??= {};
        room._requests[receiptKey] = { fingerprint, at: now };
        const keys = Object.keys(room._requests);
        for (const key of keys.slice(0, Math.max(0, keys.length - 512))) delete room._requests[key];
      }
      room._lastActive = now;
      const changed = op !== 'sync' || room.revision !== before;
      return { value: room, changed, result: this.response(room, actor, now) };
    });
  }
}
module.exports = { WerewolfService, sameSecret };
