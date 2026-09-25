'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRoom, applyCommand, publicView, chooseBotCommand } = require('../src/one-night/engine');
const { OneNightService } = require('../src/one-night/service');
let now = 1800000000000;
function game(role = 'robber') {
    const room = createRoom({ code: 'TEST', hostId: 'a0', hostName: 'Host', now });
    for (let i = 1; i < 3; i++) applyCommand(room, `a${i}`, { type: 'requestJoin', name: `Player ${i}` }, now);
    const roles = ['villager', role, 'werewolf'];
    room.seats.forEach((seat, i) => {
        seat.number = i + 1; seat.originalRoleId = seat.nightRoleId = roles[i];
        room.cards[seat.id] = { id: `player-card-${i}`, roleId: roles[i] };
    });
    ['seer', 'witch', 'tanner', 'werewolf'].forEach((roleId, i) => { room.cards[`center:${i}`] = { id: `center-card-${i}`, roleId }; });
    room.cards['reserve:villain'] = { id: 'villain-reserve', roleId: 'henchman' };
    room.status = 'playing'; room.roleDeck = [...roles, 'seer', 'witch', 'tanner'];
    at(room, role);
    return room;
}
function at(room, role) {
    room.phase = { id: `phase-${++now}`, kind: 'night', step: role, roleId: role, nightStage: 'acting', deadline: null, cueIds: [] };
    room.nightActors = [room.seats[1].id];
    room.schedule = [{ roleId: role, step: role, order: 1 }]; room.nightIndex = 0;
}
const view = (room, actor = 'a1') => publicView(room, actor, now);
function command(room, targets, extra = {}) {
    return { type: 'act', expectedPhaseId: room.phase.id, actionId: view(room).me.action.id, targets, ...extra };
}
const act = (room, targets, extra) => applyCommand(room, 'a1', command(room, targets, extra), ++now);
const inventory = room => Object.values(room.cards).map(card => JSON.stringify(card)).sort();
function rejectUnchanged(room, targets) {
    const before = JSON.stringify(room);
    assert.throws(() => act(room, targets), { code: 'INVALID_TARGET' });
    assert.equal(JSON.stringify(room), before);
}
function assertHidden(room) {
    for (const actor of ['a0', 'a2', 'observer']) {
        const projection = view(room, actor);
        assert.equal(projection.cards, undefined); assert.equal(projection.actionLog, undefined); assert.equal(projection.result, null);
        assert.ok(projection.centerCards.every(card => card.roleId === undefined));
        assert.ok(projection.seats.every(seat => seat.roleId === undefined));
        if (projection.me) assert.equal(projection.me.knowledge.length, 0);
    }
}

test('Robber exchanges with a center card and learns only the received printed identity', () => {
    const room = game(), own = room.seats[1].id;
    // Earlier movement may already have changed the Robber's current card.
    room.cards[own].roleId = 'witch';
    room.cards['center:0'] = { id: 'copied-center', roleId: 'doppelganger', copiedRoleId: 'tanner' };
    const before = inventory(room), outgoing = structuredClone(room.cards[own]), received = structuredClone(room.cards['center:0']);
    const targets = view(room).me.action.targets.map(target => target.id);
    assert.ok(targets.includes('center:0') && targets.includes('center:3'));
    assert.ok(!targets.includes(own) && !targets.includes('reserve:villain'));
    const packet = command(room, ['center:0']);
    applyCommand(room, 'a1', packet, ++now);
    assert.deepEqual(room.cards[own], received); assert.deepEqual(room.cards['center:0'], outgoing);
    assert.deepEqual(inventory(room), before);
    const me = view(room).me;
    assert.equal(me.originalRoleId, 'robber'); assert.equal(me.knowledge.length, 1);
    assert.match(me.knowledge[0].text.en, /Doppelgänger/);
    assert.doesNotMatch(me.knowledge[0].text.en, /Tanner|Witch/);
    assert.deepEqual(room.actionLog.map(entry => [entry.type, entry.targets]), [['move', [own, 'center:0']], ['view', [own]]]);
    assertHidden(room);
    const after = JSON.stringify(room);
    assert.throws(() => applyCommand(room, 'a1', packet, ++now), { code: 'STALE_PHASE' });
    assert.equal(JSON.stringify(room), after, 'A stale action cannot reverse the exchange');
});

for (const pair of ['player/player', 'player/center', 'center/center', 'center/alpha-center']) {
    test(`Troublemaker exchanges ${pair} without inspecting or losing any card`, () => {
        const room = game('troublemaker'), own = room.seats[1].id;
        const targets = pair === 'player/player' ? [room.seats[0].id, room.seats[2].id]
            : pair === 'player/center' ? [room.seats[2].id, 'center:0']
                : ['center:0', pair === 'center/alpha-center' ? 'center:3' : 'center:1'];
        const cards = targets.map(id => structuredClone(room.cards[id])), before = inventory(room), original = structuredClone(room.cards[own]);
        act(room, targets);
        assert.deepEqual(room.cards[targets[0]], cards[1]); assert.deepEqual(room.cards[targets[1]], cards[0]);
        assert.deepEqual(room.cards[own], original); assert.deepEqual(inventory(room), before);
        assert.equal(view(room).me.knowledge.length, 0);
        assert.deepEqual(room.actionLog.map(entry => [entry.type, entry.targets]), [['move', targets]]);
        assertHidden(room);
    });
}

test('center swaps retain self, distinct-target, shield and reserve restrictions atomically', () => {
    for (const role of ['robber', 'troublemaker']) {
        const room = game(role), own = room.seats[1].id, protectedPlayer = room.seats[2].id;
        room.shields = [protectedPlayer, 'center:1'];
        const targets = view(room).me.action.targets.map(target => target.id);
        assert.ok(targets.includes('center:0') && targets.includes('center:3'));
        for (const invalid of [own, protectedPlayer, 'center:1', 'reserve:villain', 'center:99']) {
            assert.ok(!targets.includes(invalid));
            rejectUnchanged(room, role === 'robber' ? [invalid] : ['center:0', invalid]);
        }
        if (role === 'troublemaker') rejectUnchanged(room, ['center:0', 'center:0']);
        const before = inventory(room);
        act(room, [], { skip: true });
        assert.deepEqual(inventory(room), before); assert.equal(room.actionLog.length, 0);
    }
    const room = game(), own = room.seats[1].id;
    room.shields = [own];
    assert.equal(view(room).me.action.targets.length, 0);
    rejectUnchanged(room, ['center:0']);
    act(room, [], { skip: true });
});

for (const copied of ['robber', 'troublemaker']) {
    test(`Doppelganger's immediate ${copied} action can exchange center cards`, () => {
        const room = game('doppelganger'), own = room.seats[1].id, source = room.seats[2].id;
        room.cards[source].roleId = room.seats[2].originalRoleId = room.seats[2].nightRoleId = copied;
        const first = command(room, [source]);
        applyCommand(room, 'a1', first, ++now);
        const action = view(room).me.action;
        assert.equal(action.roleId, copied); assert.notEqual(action.id, first.actionId);
        const afterCopy = JSON.stringify(room);
        assert.throws(() => applyCommand(room, 'a1', first, ++now), { code: 'STALE_ACTION' });
        assert.equal(JSON.stringify(room), afterCopy);
        const before = inventory(room), received = structuredClone(room.cards['center:0']);
        act(room, copied === 'robber' ? ['center:0'] : ['center:0', 'center:1']);
        assert.deepEqual(inventory(room), before);
        assert.equal(room.seats[1].originalRoleId, 'doppelganger');
        assert.equal(room.seats[1].nightRoleId, copied);
        if (copied === 'robber') {
            assert.deepEqual(room.cards[own], received);
            assert.equal(room.cards['center:0'].copiedRoleId, 'robber');
            assert.equal(view(room).me.knowledge.length, 3); // copied card, copied ability, received card
        } else {
            assert.equal(room.cards[own].copiedRoleId, 'troublemaker');
            assert.equal(view(room).me.knowledge.length, 2); // copying itself is the only inspection
        }
        assertHidden(room);
    });
}

test('bots legally use center-only Robber and Troublemaker targets', () => {
    for (const role of ['robber', 'troublemaker']) {
        const room = game(role), bot = room.seats[1]; bot.isBot = true;
        room.shields = room.seats.filter(seat => seat.id !== bot.id || role === 'troublemaker').map(seat => seat.id);
        const decision = chooseBotCommand(view(room));
        assert.equal(decision.skip, undefined); assert.equal(decision.targets.length, role === 'robber' ? 1 : 2);
        assert.ok(decision.targets.every(id => id.startsWith('center:')));
        const before = inventory(room);
        applyCommand(room, bot.actorId, decision, ++now);
        assert.deepEqual(inventory(room), before); assert.equal(room.phase.nightStage, 'closing');
    }
});

class MemoryStore {
    constructor() { this.data = new Map(); this.queues = new Map(); }
    async transact(key, callback) {
        const task = (this.queues.get(key) || Promise.resolve()).then(async () => {
            const result = await callback(structuredClone(this.data.get(key) ?? null));
            if (result.changed !== false) this.data.set(key, structuredClone(result.value));
            return result.result;
        });
        this.queues.set(key, task.catch(() => {})); return task;
    }
}
test('concurrent service retries do not swap a center card back or duplicate its private inspection', async () => {
    const store = new MemoryStore(), service = new OneNightService(store, () => now), tokens = [randomUUID(), randomUUID(), randomUUID()];
    const call = input => service.handle({ token: tokens[0], requestId: randomUUID(), ...input }, 'center-test');
    const { view: created } = await call({ op: 'create', name: 'Host' }), code = created.code;
    for (let i = 1; i < 3; i++) await call({ op: 'join', code, token: tokens[i], name: `Player ${i}` });
    await call({ op: 'command', code, command: { type: 'start' } });
    await store.transact(`rooms/${code}`, room => {
        room.seats[1].originalRoleId = room.seats[1].nightRoleId = 'robber';
        room.cards['center:0'].roleId = 'seer';
        at(room, 'robber');
        return { value: room };
    });
    const before = structuredClone(store.data.get(`rooms/${code}`)), own = before.seats[1].id;
    const projection = (await call({ op: 'sync', code, token: tokens[1] })).view;
    const packet = { op: 'command', code, token: tokens[1], requestId: randomUUID(), command: { type: 'act', expectedPhaseId: projection.phase.id, actionId: projection.me.action.id, targets: ['center:0'] } };
    const replies = await Promise.all([call(packet), call(packet), call(packet)]);
    assert.ok(replies.every(reply => reply.view.me.knowledge.length === 1));
    const after = store.data.get(`rooms/${code}`);
    assert.deepEqual(after.cards[own], before.cards['center:0']); assert.deepEqual(after.cards['center:0'], before.cards[own]);
    assert.deepEqual(inventory(after), inventory(before)); assert.equal(after.actionLog.length, 2);
});
