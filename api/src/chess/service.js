'use strict';
const { createHash } = require('node:crypto');
const engine = require('./engine.js');
const hash = text => createHash('sha256').update(text).digest('hex');
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{24,160}$/.test(value);
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
class ChessService {
  constructor(store, clock = Date.now) { this.store = store; this.clock = clock; }
  async limit(address, op, now) {
    const maximum = op === 'create' ? 16 : 100;
    await this.store.transact(`limits/${hash(`${address}:${op}`)}`, old => {
      const window = Math.floor(now / 3600000);
      const value = old?.window === window ? old : { window, count: 0 };
      if (value.count >= maximum) engine.fail('too-many-requests', 'Please wait before creating or joining more rooms.', 429);
      value.count++; return { value, result: true };
    });
  }
  async allocate(actor, input, now) {
    engine.nameOf(input.name); engine.handicapFen(input.removed);
    if (!['w', 'b'].includes(input.color)) engine.fail('invalid-color', 'Choose White or Black.');
    return this.store.transact(`creators/${actor}`, async old => {
      if (old?.code) return { value: old, changed: false, result: old.code };
      for (let attempt = 0; attempt < 32; attempt++) {
        const digest = hash(`${input.token}:${attempt}`);
        const code = Array.from({ length: 6 }, (_, i) => alphabet[parseInt(digest.slice(i * 2, i * 2 + 2), 16) % alphabet.length]).join('');
        const claimed = await this.store.transact(`rooms/${code}`, room => {
          if (room && room.status !== 'closed' && now - room._lastActive < 86400000) return { value: room, changed: false, result: room.host === actor };
          const value = engine.createRoom(code, actor, input.name, input.color, input.removed, now);
          return { value, result: true };
        });
        if (claimed) return { value: { code }, result: code };
      }
      engine.fail('room-busy', 'Please try creating a room again.', 503);
    });
  }
  async handle(input, address = 'unknown') {
    if (!input || typeof input !== 'object' || Array.isArray(input)) engine.fail('invalid-request', 'Invalid request.');
    const { op, token, requestId } = input;
    if (!['create', 'join', 'sync', 'command'].includes(op)) engine.fail('invalid-operation', 'Unknown operation.');
    if (!validId(token)) engine.fail('invalid-session', 'Please create or join a room with this browser.', 401);
    if (op !== 'sync' && !validId(requestId)) engine.fail('invalid-request-id', 'A unique request ID is required.');
    const actor = hash(token), now = this.clock();
    if (op === 'create' || op === 'join') await this.limit(address, op, now);
    const code = op === 'create' ? await this.allocate(actor, input, now) : String(input.code || '').trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) engine.fail('invalid-room-code', 'Enter the six-character room code.');
    return this.store.transact(`rooms/${code}`, room => {
      if (!room) engine.fail('room-not-found', 'That room is unavailable. Check the code or create a new room.', 404);
      if (now - room._lastActive >= 86400000) engine.fail('room-expired', 'This room expired after 24 hours without a game action.', 410);
      const fingerprint = hash(JSON.stringify({ op, name: input.name, color: input.color, removed: input.removed, command: input.command }));
      const receipt = `${actor}:${requestId}`;
      if (op !== 'sync' && room._requests[receipt]) {
        if (room._requests[receipt] !== fingerprint) engine.fail('request-id-reused', 'Use a new request for a different action.', 409);
        return { value: room, changed: false, result: { view: op === 'command' && input.command?.type === 'leave' ? { code, status: 'left' } : engine.publicView(room, actor, now) } };
      }
      if (room.status === 'closed') engine.fail('room-closed', 'The host closed this room.', 410);
      let changed = engine.tick(room, now);
      if (op === 'create') {
        if (room.host !== actor) engine.fail('invalid-session', 'This room belongs to another player.', 403);
      } else if (op === 'join') {
        engine.joinRoom(room, actor, input.name, now); room._lastActive = now;
      } else {
        const player = engine.playerOf(room, actor);
        if (op === 'sync') {
          if (now - player.lastSeen > 15000) { player.lastSeen = now; changed = true; }
        } else {
          const window = Math.floor(now / 60000);
          const counter = room._commandLimits[actor]?.window === window ? room._commandLimits[actor] : { window, count: 0 };
          if (counter.count >= 90) engine.fail('too-many-requests', 'Please wait before sending more actions.', 429);
          counter.count++; room._commandLimits[actor] = counter;
          engine.applyCommand(room, actor, input.command, now);
        }
      }
      if (op !== 'sync') {
        room._requests[receipt] = fingerprint;
        for (const key of Object.keys(room._requests).slice(0, -256)) delete room._requests[key];
        changed = true;
      }
      // A player leaving the lobby receives a confirmation, never the other seat's state.
      const view = op === 'command' && input.command?.type === 'leave' ? { code, status: 'left' } : engine.publicView(room, actor, now);
      return { value: room, changed, result: { view } };
    });
  }
}
module.exports = { ChessService };
