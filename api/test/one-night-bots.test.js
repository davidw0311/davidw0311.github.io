'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRoom, applyCommand, publicView, tickRoom, recoverHost, chooseBotCommand } = require('../src/one-night/engine');
const { OneNightService } = require('../src/one-night/service');
let now = 1800000000000;
const send = (room, actor, type, data = {}) => applyCommand(room, actor, { type, expectedPhaseId: room.phase.id, ...data }, ++now);
const host = (room, type, data) => send(room, room.hostId, type, data);
const view = (room, actor = room.hostId) => publicView(room, actor, now);
const bots = room => room.seats.filter(seat => seat.isBot);
function lobby(count = 4) {
    const room = createRoom({ code: 'TEST', hostId: 'human', hostName: 'Human', now: ++now });
    host(room, 'addBots', { count });
    return room;
}
function game(roles = ['villager', 'werewolf', 'seer', 'robber', 'witch'], centers = ['troublemaker', 'drunk', 'tanner'], mode = 'manual') {
    const room = lobby(roles.length - 1);
    host(room, 'setBotMode', { mode });
    host(room, 'configure', { roleDeck: [...roles, ...centers] });
    host(room, 'start');
    // Stable dealt fixture, preserving physical card ids and the real schedule.
    room.seats.forEach((seat, i) => {
        seat.originalRoleId = seat.nightRoleId = roles[i];
        room.cards[seat.id].roleId = roles[i];
    });
    centers.forEach((role, i) => { room.cards[`center:${i}`].roleId = role; });
    return room;
}
function begin(room) {
    host(room, 'ready');
    while (bots(room).some(seat => !seat.ready)) host(room, 'botStep');
    host(room, 'startNight');
}
function acting(room, step) {
    for (let attempts = 0; attempts < 120; attempts++) {
        assert.equal(room.phase.kind, 'night');
        if (room.phase.step === step && room.phase.nightStage === 'acting') return;
        if (room.phase.nightStage !== 'acting') host(room, 'narrationDone');
        else host(room, 'hardSkip');
    }
    assert.fail(`Did not reach ${step}`);
}
function unchangedFailure(room, command, code) {
    const before = JSON.stringify(room);
    assert.throws(() => host(room, command.type, command), { code });
    assert.equal(JSON.stringify(room), before);
}

test('bot controls enforce host authorization, the 16-seat limit and public privacy', () => {
    const room = lobby();
    send(room, 'guest', 'requestJoin', { name: 'Guest' });
    for (const type of ['addBots', 'removeBots', 'setBotMode', 'botStep']) assert.throws(() => send(room, 'guest', type, { count: 1, mode: 'manual' }), { code: 'HOST_ONLY' });
    for (const count of [0, -1, 1.5, '2', 16]) unchangedFailure(room, { type: 'addBots', count }, 'INVALID_BOT_COUNT');
    unchangedFailure(room, { type: 'addBots', count: 15 }, 'ROOM_FULL');
    unchangedFailure(room, { type: 'setBotMode', mode: 'fast' }, 'INVALID_BOT_MODE');
    unchangedFailure(room, { type: 'setBotMode', mode: 'manual', expectedPhaseId: 'stale' }, 'STALE_PHASE');
    now += 3600000;
    const projection = view(room), observer = view(room, 'observer');
    assert.deepEqual(projection.bots, { mode: 'automatic', count: 4 });
    assert.ok(projection.seats.filter(seat => seat.isBot).every(seat => seat.connected && seat.occupied));
    assert.equal(observer.me, null);
    for (const field of ['members', 'cards', 'botState', 'actions', 'nightState']) assert.equal(projection[field], undefined);
    for (const bot of bots(room)) assert.ok(!JSON.stringify(projection).includes(bot.actorId));
    assert.equal(projection.me.botActivity, undefined);
    host(room, 'setBotMode', { mode: 'manual' });
    host(room, 'removeBots');
    assert.deepEqual(view(room).bots, { mode: 'manual', count: 0 });
    assert.deepEqual(Object.keys(room.members).sort(), ['guest', 'human']);
    host(room, 'removeBots');
    host(room, 'addBots', { count: 14 });
    assert.equal(room.seats.length, 16);
});

test('manual and automatic readiness remain paced and cannot advance a human or a host phase', () => {
    const room = game(undefined, undefined, 'automatic');
    const id = room.phase.id;
    assert.equal(tickRoom(room, now + 1499), false);
    now += 1500;
    assert.equal(tickRoom(room, now), true);
    assert.equal(bots(room).filter(seat => seat.ready).length, 1);
    assert.equal(tickRoom(room, now), false);
    host(room, 'botStep');
    assert.equal(bots(room).filter(seat => seat.ready).length, 2);
    assert.equal(tickRoom(room, now), false);
    host(room, 'setBotMode', { mode: 'manual' });
    now += 10000;
    assert.equal(tickRoom(room, now), false);
    host(room, 'botStep'); host(room, 'botStep');
    assert.equal(view(room).me.ready, false);
    assert.equal(room.phase.id, id);
    unchangedFailure(room, { type: 'botStep' }, 'BOT_IDLE');
    unchangedFailure(room, { type: 'startNight' }, 'NOT_READY');
    host(room, 'ready'); host(room, 'startNight');
    unchangedFailure(room, { type: 'botStep', expectedPhaseId: id }, 'STALE_PHASE');
    unchangedFailure(room, { type: 'botStep' }, 'BOT_IDLE');
    // Narration fallback remains its original timer; botStep cannot skip it.
    const deadline = room.phase.deadline;
    assert.equal(tickRoom(room, deadline - 1), false);
    assert.equal(tickRoom(room, deadline), true);
});

test('human replacements lose automation and bots cannot become host or survive removal', () => {
    const room = game();
    host(room, 'botStep');
    const bot = bots(room)[0], oldActor = bot.actorId, role = bot.originalRoleId;
    unchangedFailure(room, { type: 'transferHost', seatId: bot.id }, 'EMPTY_SEAT');
    unchangedFailure(room, { type: 'leave' }, 'HOST_LEAVE');
    unchangedFailure(room, { type: 'removeBots' }, 'WRONG_PHASE');
    unchangedFailure(room, { type: 'removeSeat', seatId: bot.id }, 'WRONG_PHASE');
    send(room, 'replacement', 'requestJoin', { name: 'Replacement' });
    host(room, 'approveJoin', { requestId: room.requests[0].id, replaceSeatId: bot.id });
    assert.equal(view(room, oldActor).me, null);
    assert.equal(view(room, 'replacement').me.roleId, role);
    assert.equal(view(room, 'replacement').me.ready, false);
    assert.equal(chooseBotCommand(view(room, 'replacement')), null);
    assert.equal(view(room).bots.count, 3);
    recoverHost(room, 'recovered', ++now);
    assert.equal(view(room, 'recovered').seats.find(seat => seat.isHost).isBot, false);
    host(room, 'disband');
    assert.equal(view(room).bots.count, 0);
    assert.equal(tickRoom(room, now + 100000), false);
    const waiting = lobby();
    const removed = bots(waiting)[0];
    host(waiting, 'removeSeat', { seatId: removed.id });
    assert.equal(waiting.members[removed.actorId], undefined);
    assert.equal(view(waiting).bots.count, 3);
});

test('Vampire bots yield after their ballot, follow human consensus and reveal ballots only to Vampires', () => {
    const room = game(['vampire', 'master', 'count', 'villager', 'villager'], ['werewolf', 'seer', 'robber']);
    begin(room); acting(room, 'vampire');
    const vampBots = bots(room).slice(0, 2);
    host(room, 'botStep');
    assert.equal(chooseBotCommand(view(room, vampBots[0].actorId)), null);
    assert.equal(room.phase.nightStage, 'acting');
    host(room, 'botStep');
    unchangedFailure(room, { type: 'botStep' }, 'BOT_IDLE');
    const human = view(room), current = human.me.action.votes.find(vote => vote.seatId === vampBots[0].id).targetId;
    const target = human.me.action.targets.find(candidate => candidate.id !== current).id;
    assert.equal(view(room, bots(room)[2].actorId).me.action, null);
    assert.ok(!JSON.stringify(view(room, 'observer')).includes('targetId'));
    host(room, 'act', { actionId: human.me.action.id, targets: [target] });
    for (const bot of vampBots) assert.deepEqual(chooseBotCommand(view(room, bot.actorId)).targets, [target]);
    host(room, 'botStep'); host(room, 'botStep');
    assert.equal(room.phase.nightStage, 'closing');
    assert.equal(room.marks[target], 'vampire');
    assert.equal(room.nightState[`vampire:${human.me.seatId}`].target, target);
});

for (const role of ['witch', 'voodooLou', 'detector', 'marksman', 'nostradamus']) {
    test(`${role} bot completes mandatory sequential actions with fresh action ids`, () => {
        const room = game(['villager', role, 'werewolf', 'villager', 'villager'], ['seer', 'robber', 'tanner']);
        begin(room); acting(room, role);
        const bot = bots(room)[0], ids = new Set();
        for (let attempts = 0; room.phase.nightStage === 'acting' && attempts < 5; attempts++) {
            const projection = view(room, bot.actorId), before = JSON.stringify(projection), decision = chooseBotCommand(projection);
            assert.ok(decision); assert.equal(JSON.stringify(projection), before);
            assert.equal(ids.has(decision.actionId), false); ids.add(decision.actionId);
            if (role === 'nostradamus') { assert.equal(decision.choice, 'inspect'); assert.equal(decision.targets.length, 1); }
            host(room, 'botStep');
        }
        assert.equal(room.phase.nightStage, 'closing');
        assert.equal(ids.size, role === 'nostradamus' ? 3 : 2);
        if (['witch', 'voodooLou'].includes(role)) assert.equal(room.actionLog.filter(entry => entry.seatId === bot.id && entry.type === 'move').length, 1);
    });
}

test('Empath bot answers use only its own activity and original identity, leaving humans unanswered', () => {
    for (const question of ['viewed', 'moved', 'evil']) {
        const room = game(['empath', 'werewolf', 'villager', 'villager', 'villager'], ['seer', 'robber', 'tanner']);
        room.expansion.empathQuestion = question;
        begin(room); acting(room, 'empath');
        const bot = bots(room)[0], other = bots(room)[1];
        room.actionLog.push({ seatId: bot.id, type: 'view', targets: [other.id] }, { seatId: bot.id, type: 'move', targets: [bot.id, other.id] });
        const projection = view(room, bot.actorId);
        assert.deepEqual(projection.me.botActivity, { viewed: true, moved: true });
        assert.equal(chooseBotCommand(projection).choice, 'yes');
        assert.equal(chooseBotCommand(view(room, other.actorId)).choice, 'no');
        assert.equal(view(room).me.botActivity, undefined);
        for (let i = 0; i < 4; i++) host(room, 'botStep');
        assert.equal(room.phase.nightStage, 'acting');
        assert.equal(room.expansion.empathAnswers[room.seats[0].id], undefined);
        assert.ok(view(room).me.knowledge.some(note => note.text.en.includes('Empath response')));
        unchangedFailure(room, { type: 'botStep' }, 'BOT_IDLE');
        host(room, 'act', { actionId: view(room).me.action.id, targets: [] });
        assert.equal(room.phase.nightStage, 'closing');
    }
});

test('Empath counts actual own-card night inspections but excludes reading the initial deal', () => {
    for (const role of ['robber', 'insomniac', 'selfAwarenessGirl']) {
        const room = game(['empath', role, 'werewolf', 'villager', 'villager'], ['seer', 'troublemaker', 'tanner']);
        room.expansion.empathQuestion = 'viewed';
        const actor = bots(room)[0].actorId;
        assert.equal(view(room, actor).me.botActivity.viewed, false);
        begin(room); acting(room, role);
        host(room, 'botStep');
        assert.ok(room.actionLog.some(entry => entry.seatId === view(room, actor).me.seatId && entry.type === 'view' && entry.targets.includes(view(room, actor).me.seatId)));
        acting(room, 'empath');
        const projection = view(room, actor);
        assert.equal(projection.me.botActivity.viewed, true);
        assert.equal(chooseBotCommand(projection).choice, 'yes');
        assert.match(projection.me.action.prompt.en, /during a night action/);
        assert.equal(view(room).me.botActivity, undefined);
    }
});

class MemoryStore {
    constructor() { this.data = new Map(); this.queues = new Map(); }
    async transact(key, callback) {
        const run = (this.queues.get(key) || Promise.resolve()).then(async () => {
            const old = this.data.get(key), result = await callback(old ? structuredClone(old) : null);
            if (result.changed !== false) this.data.set(key, structuredClone(result.value));
            return result.result;
        });
        this.queues.set(key, run.catch(() => {}));
        return run;
    }
}
test('service retries and concurrent syncs perform one paced decision and idle errors roll back', async () => {
    const store = new MemoryStore(); let time = 1800000000000;
    const service = new OneNightService(store, () => time), token = randomUUID();
    const call = input => service.handle({ token, requestId: randomUUID(), ...input }, 'bot-test');
    const created = await call({ op: 'create', name: 'Host' }), code = created.view.code;
    const command = (type, phaseId, data = {}) => ({ op: 'command', code, command: { type, expectedPhaseId: phaseId, ...data } });
    await call(command('addBots', created.view.phase.id, { count: 11 }));
    const started = await call(command('start', created.view.phase.id));
    time += 5000;
    const packet = { ...command('botStep', started.view.phase.id), requestId: randomUUID() };
    const replies = await Promise.all([call(packet), call(packet), call({ op: 'sync', code })]);
    assert.ok(replies.every(reply => reply.view.seats.filter(seat => seat.isBot && seat.ready).length === 1));
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
