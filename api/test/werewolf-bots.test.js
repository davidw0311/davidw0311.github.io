'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRoom, applyCommand, publicView, tickRoom, recoverHost, chooseBotCommand } = require('../src/werewolf/engine');
const { WerewolfService } = require('../src/werewolf/service');
let now = 1800000000000;
const send = (room, actor, type, data = {}) => applyCommand(room, actor, { type, expectedPhaseId: room.phase.id, ...data }, ++now);
const host = (room, type, data) => send(room, room.hostId, type, data);
const view = (room, actor = room.hostId) => publicView(room, actor, now);
const bots = room => room.seats.filter(seat => seat.isBot);
function lobby(count = 5) {
    const room = createRoom({ code: 'TEST', hostId: 'human', hostName: 'Human', now: ++now });
    host(room, 'addBots', { count });
    return room;
}
function game(roles = ['villager', 'werewolf', 'werewolf', 'seer', 'witch', 'guard'], mode = 'manual') {
    const room = lobby(roles.length - 1);
    host(room, 'setBotMode', { mode });
    host(room, 'updateSettings', { settings: { sheriff: false, winCondition: 'all' } });
    host(room, 'startGame', { roleDeck: roles });
    // Assign stable fixtures after exercising the real shuffle, preserving seats.
    room.seats.forEach((seat, index) => {
        seat.roleId = seat.originalRoleId = roles[index];
        seat.team = seat.originalTeam = ['werewolf', 'wolfKing', 'mechanicalWolf'].includes(roles[index]) ? 'wolf' : 'village';
    });
    return room;
}
function begin(room) {
    host(room, 'ready');
    while (bots(room).some(seat => !seat.ready)) host(room, 'botStep');
    host(room, 'startNight');
}
function acting(room, step) {
    for (let attempts = 0; attempts < 80; attempts++) {
        if (room.phase.kind === 'night' && room.phase.step === step && room.phase.nightStage === 'acting') return;
        assert.equal(room.phase.kind, 'night');
        if (room.phase.nightStage !== 'acting') host(room, 'nightNarrationDone');
        else if (room.nightFlow.eligibleSeatIds.length) host(room, 'botStep');
        else { now = room.nightFlow.deadline; tickRoom(room, now); }
    }
    assert.fail(`Did not reach ${step}`);
}

test('test bot lobby controls are host-only, bounded, labelled and private', () => {
    const room = lobby();
    assert.deepEqual(view(room).bots, { mode: 'automatic', count: 5 });
    assert.ok(view(room).seats.slice(1).every(seat => seat.isBot && seat.connected && seat.occupied));
    now += 3600000;
    assert.ok(view(room).seats.slice(1).every(seat => seat.connected));
    send(room, 'guest', 'requestJoin', { name: 'Guest' });
    for (const type of ['addBots', 'removeBots', 'setBotMode', 'botStep']) assert.throws(() => send(room, 'guest', type, { count: 1, mode: 'manual' }), { code: 'HOST_ONLY' });
    for (const count of [0, -1, 1.5, '2', 24]) assert.throws(() => host(room, 'addBots', { count }), { code: 'INVALID_BOT_COUNT' });
    const before = JSON.stringify(room);
    assert.throws(() => host(room, 'addBots', { count: 18 }), { code: 'ROOM_FULL' });
    assert.equal(JSON.stringify(room), before);
    const serialized = JSON.stringify(view(room));
    for (const bot of bots(room)) assert.ok(!serialized.includes(bot.actorId));
    assert.ok(!serialized.includes('nextActionAt'));
    host(room, 'setBotMode', { mode: 'manual' });
    host(room, 'removeBots');
    assert.deepEqual(view(room).bots, { mode: 'manual', count: 0 });
    assert.equal(room.seats.length, 2);
    assert.deepEqual(Object.keys(room.members).sort(), ['guest', 'human']);
    host(room, 'removeBots');
    host(room, 'addBots', { count: 22 });
    assert.equal(room.seats.length, 24);
});

test('bots never inherit hosting, while human replacements stop automation', () => {
    const room = lobby();
    const botId = bots(room)[0].id;
    assert.throws(() => host(room, 'transferHost', { seatId: botId }), { code: 'INVALID_TARGET' });
    host(room, 'leave');
    assert.equal(room.hostId, null);
    assert.ok(room.seats.every(seat => seat.isBot));
    send(room, 'new-human', 'requestJoin', { name: 'New host' });
    assert.equal(room.hostId, 'new-human');
    recoverHost(room, 'recovered-human', ++now);
    assert.equal(view(room, 'recovered-human').seats.find(seat => seat.isHost).isBot, false);
    const playing = game();
    const old = bots(playing)[0];
    host(playing, 'botStep');
    const card = old.roleId;
    send(playing, 'replacement', 'requestJoin', { name: 'Replacement' });
    host(playing, 'approveJoin', { requestId: playing.requests[0].id, replaceSeatId: old.id });
    assert.equal(view(playing, 'replacement').me.roleId, card);
    assert.equal(view(playing, 'replacement').me.ready, false);
    assert.equal(view(playing, 'replacement').seats.find(seat => seat.id === old.id).isBot, false);
    assert.equal(view(playing, old.actorId).me, null);
    assert.equal(chooseBotCommand(view(playing, 'replacement')), null);
    host(playing, 'removeSeat', { seatId: bots(playing)[0].id });
    assert.equal(view(playing).bots.count, 3);
});

test('manual stepping readies exactly one bot and never readies the human or advances the host phase', () => {
    const room = game();
    const readyPhase = room.phase.id;
    for (let count = 1; count <= 5; count++) {
        host(room, 'botStep');
        assert.equal(bots(room).filter(seat => seat.ready).length, count);
        assert.equal(room.phase.id, readyPhase);
        assert.equal(room.seats[0].ready, false);
    }
    const before = JSON.stringify(room);
    assert.throws(() => host(room, 'botStep'), { code: 'BOT_IDLE' });
    assert.equal(JSON.stringify(room), before);
    assert.throws(() => host(room, 'startNight'), { code: 'NOT_READY' });
    assert.throws(() => host(room, 'addBots', { count: 1 }), { code: 'WRONG_PHASE' });
    assert.throws(() => host(room, 'removeBots'), { code: 'WRONG_PHASE' });
    host(room, 'ready');
    host(room, 'startNight');
    assert.throws(() => host(room, 'botStep', { expectedPhaseId: readyPhase }), { code: 'STALE_PHASE' });
    assert.throws(() => host(room, 'botStep'), { code: 'BOT_IDLE' });
    assert.equal(room.phase.nightStage, 'opening');
});

test('automatic bots are paced one decision per tick and respect manual mode and pause', () => {
    const room = game(undefined, 'automatic');
    now = room.botState.nextActionAt;
    assert.equal(tickRoom(room, now), true);
    assert.equal(bots(room).filter(seat => seat.ready).length, 1);
    assert.equal(tickRoom(room, now), false);
    assert.equal(tickRoom(room, now + 1499), false);
    now += 1500;
    assert.equal(tickRoom(room, now), true);
    assert.equal(bots(room).filter(seat => seat.ready).length, 2);
    host(room, 'pause');
    now += 10000;
    assert.equal(tickRoom(room, now), false);
    assert.throws(() => host(room, 'botStep'), { code: 'PAUSED' });
    host(room, 'setBotMode', { mode: 'manual' });
    host(room, 'resume');
    now += 10000;
    assert.equal(tickRoom(room, now), false);
    assert.throws(() => host(room, 'setBotMode', { mode: 'automatic', expectedPhaseId: 'old-phase' }), { code: 'STALE_PHASE' });
    host(room, 'botStep');
    assert.equal(bots(room).filter(seat => seat.ready).length, 3);
});

test('pack bots agree, follow human pack votes, and revise to a human no-kill choice', () => {
    const room = game(['werewolf', 'werewolf', 'werewolf', 'seer', 'witch', 'guard', 'villager', 'villager']);
    begin(room); acting(room, 'wolves');
    host(room, 'botStep'); host(room, 'botStep');
    const packIds = room.nightFlow.eligibleSeatIds;
    assert.equal(new Set(Object.values(room.actions.wolves).map(action => action.targetId)).size, 1);
    assert.equal(room.phase.nightStage, 'acting', 'Missing human decision must not be bypassed');
    const targetId = room.seats.find(seat => seat.team === 'village' && seat.id !== Object.values(room.actions.wolves)[0].targetId).id;
    host(room, 'nightAction', { targetId });
    // The two bot votes may already form a majority, so exercise revisions in a
    // four-wolf fixture where a human abstention and one withheld vote keep it open.
    const second = game(['werewolf', 'werewolf', 'werewolf', 'werewolf', 'seer', 'witch', 'guard', 'villager', 'villager', 'villager']);
    begin(second); acting(second, 'wolves');
    const firstBot = bots(second).find(seat => seat.roleId === 'werewolf');
    const botActor = firstBot.actorId;
    applyCommand(second, botActor, chooseBotCommand(view(second, botActor)), ++now);
    host(second, 'nightAction', { ability: 'skip' });
    host(second, 'botStep');
    assert.equal(second.actions.wolves[firstBot.id].skip, true);
    while (second.phase.nightStage === 'acting') host(second, 'botStep');
    assert.ok(Object.values(second.actions.wolves).every(action => action.skip));
    assert.equal(second.phase.nightStage, 'closing');
    assert.equal(packIds.length, 3);
});

test('bot policy uses only the private view and respects spent potions and exhausted target pairs', () => {
    const room = game();
    begin(room); acting(room, 'witch');
    const witch = room.seats.find(seat => seat.roleId === 'witch');
    let projection = view(room, witch.actorId);
    const before = JSON.stringify(projection);
    assert.equal(chooseBotCommand(projection).ability, 'save');
    assert.equal(JSON.stringify(projection), before);
    witch.state.antidoteUsed = true;
    projection = view(room, witch.actorId);
    assert.equal(chooseBotCommand(projection).ability, 'poison');
    assert.equal(projection.me.action.victimId, null);
    witch.state.poisonUsed = true;
    assert.equal(chooseBotCommand(view(room, witch.actorId)), null);
    const magicianView = structuredClone(projection);
    magicianView.me.roleId = 'magician';
    magicianView.me.roleState = { usedSwaps: ['a:b'] };
    magicianView.me.action = { kind: 'nightAction', step: 'magician', input: 'double', targets: ['a', 'b'], minTargets: 2, maxTargets: 2, canSkip: true, alreadySubmitted: false };
    magicianView.phase.step = 'magician';
    assert.equal(chooseBotCommand(magicianView).ability, 'skip');
    magicianView.me.action.targets.push('c');
    const pair = chooseBotCommand(magicianView).targetIds.sort().join(':');
    assert.notEqual(pair, 'a:b');
    const humanView = structuredClone(magicianView);
    humanView.seats.find(seat => seat.id === humanView.me.seatId).isBot = false;
    assert.equal(chooseBotCommand(humanView), null);
});

class MemoryStore {
    constructor() { this.data = new Map(); this.queues = new Map(); }
    async transact(key, callback) {
        const run = (this.queues.get(key) || Promise.resolve()).then(async () => {
            const old = this.data.get(key);
            const result = await callback(old ? structuredClone(old) : null);
            if (result.changed !== false) this.data.set(key, structuredClone(result.value));
            return result.result;
        });
        this.queues.set(key, run.catch(() => {}));
        return run;
    }
}
test('service bot steps are idempotent and automatic syncs cannot append or race a second decision', async () => {
    const store = new MemoryStore();
    let time = 1800000000000;
    const service = new WerewolfService(store, () => time);
    const token = randomUUID();
    const call = input => service.handle({ token, requestId: randomUUID(), ...input }, 'bot-test');
    const created = await call({ op: 'create', name: 'Host' });
    const code = created.view.code;
    const command = (type, phaseId, data = {}) => ({ op: 'command', code, command: { type, expectedPhaseId: phaseId, ...data } });
    await call(command('addBots', created.view.phase.id, { count: 11 }));
    const started = await call(command('startGame', created.view.phase.id));
    time += 5000;
    const packet = { ...command('botStep', started.view.phase.id), requestId: randomUUID() };
    const replies = await Promise.all([call(packet), call(packet), call({ op: 'sync', code })]);
    assert.ok(replies.every(reply => reply.view.seats.filter(seat => seat.isBot && seat.ready).length === 1));
    const synced = await Promise.all(Array.from({ length: 8 }, () => call({ op: 'sync', code })));
    assert.ok(synced.every(reply => reply.view.seats.filter(seat => seat.ready).length === 1));
    time += 1500;
    const next = await Promise.all(Array.from({ length: 8 }, () => call({ op: 'sync', code })));
    assert.ok(next.every(reply => reply.view.seats.filter(seat => seat.ready).length === 2));
    assert.ok(next.every(reply => !reply.view.me.ready));
    await call(command('setBotMode', started.view.phase.id, { mode: 'manual' }));
    for (let remaining = 9; remaining > 0; remaining--) await call(command('botStep', started.view.phase.id));
    const before = structuredClone(store.data.get(`rooms/${code}`));
    await assert.rejects(call(command('botStep', started.view.phase.id)), { code: 'BOT_IDLE' });
    assert.deepEqual(store.data.get(`rooms/${code}`), before);
});
