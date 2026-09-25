'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRoom, applyCommand, publicView, tickRoom, chooseBotCommand } = require('../src/one-night/engine');
const now = 1800000000000;
function lobby(count = 6) {
    const room = createRoom({ code: 'TEST', hostId: 'p0', hostName: 'Host', now });
    for (let i = 1; i < count; i++) applyCommand(room, `p${i}`, { type: 'requestJoin', name: `Player ${i}` }, now);
    return room;
}
function send(room, actor, type, fields = {}) { applyCommand(room, actor, { type, expectedPhaseId: room.phase.id, ...fields }, now); }
function deal(roles, centers = ['villager', 'drunk', 'tanner']) {
    const room = lobby(roles.length);
    send(room, 'p0', 'configure', { roleDeck: [...roles, ...centers] });
    send(room, 'p0', 'start');
    // Fix the otherwise random deal; the actual schedule and transitions stay intact.
    room.seats.forEach((seat, index) => { seat.originalRoleId = seat.nightRoleId = roles[index]; room.cards[seat.id].roleId = roles[index]; });
    centers.forEach((role, index) => { room.cards[`center:${index}`].roleId = role; });
    return room;
}
function openNight(room) {
    room.seats.forEach(seat => send(room, seat.actorId, 'ready'));
    send(room, 'p0', 'startNight');
    send(room, 'p0', 'narrationDone');
}
function act(room, actor, targets = []) {
    const action = publicView(room, actor, now).me.action;
    assert.ok(action, `${actor} must have a usable action`);
    send(room, actor, 'act', { actionId: action.id, targets });
}
function unchangedOnError(room, actor, type, fields, code) {
    const before = structuredClone(room);
    assert.throws(() => send(room, actor, type, fields), { code });
    assert.deepEqual(room, before);
}
test('seat number moves preserve stable seats, owners and profiles; invalid or non-host changes are atomic', () => {
    const room = lobby(12), seats = room.seats.map(seat => seat.id);
    send(room, 'p0', 'profile', { photo: 'cat', name: 'Host renamed' });
    send(room, 'p0', 'moveSeat', { seatId: seats[0], number: 12 });
    assert.deepEqual(room.seats.map(seat => seat.id), [...seats.slice(1), seats[0]]);
    assert.equal(publicView(room, 'p0', now).seats[11].number, 12);
    assert.equal(publicView(room, 'p0', now).me.seatId, seats[0]);
    assert.equal(room.seats[11].photo, 'cat');
    send(room, 'p0', 'moveSeat', { seatId: seats[0], number: 1 });
    assert.deepEqual(room.seats.map(seat => seat.id), seats);
    for (const number of [0, 13, 1.5, '2', null]) unchangedOnError(room, 'p0', 'moveSeat', { seatId: seats[0], number }, 'INVALID_SEATS');
    unchangedOnError(room, 'p1', 'moveSeat', { seatId: seats[0], number: 2 }, 'HOST_ONLY');
    unchangedOnError(room, 'p0', 'moveSeat', { seatId: 'missing', number: 2 }, 'INVALID_TARGET');
    unchangedOnError(room, 'p0', 'moveSeat', { seatId: seats[0], number: 2, expectedPhaseId: 'old' }, 'STALE_PHASE');
    send(room, 'p0', 'start');
    unchangedOnError(room, 'p0', 'moveSeat', { seatId: seats[0], number: 2 }, 'WRONG_PHASE');
    unchangedOnError(room, 'p0', 'reorderSeats', { seatIds: seats.slice().reverse() }, 'WRONG_PHASE');
});
test('host restart clears every round secret and timer from every playable phase, while keeping the table and settings', () => {
    for (const kind of ['ready', 'night', 'discussion', 'voting', 'finished']) {
        const room = deal(['werewolf', 'dreamWolf', 'seer']);
        room.phase.kind = kind; room.phase.deadline = now + 1000; room.phase.paused = true;
        room.status = kind === 'finished' ? 'finished' : 'playing';
        room.seats[1].isBot = true; room.seats[2].actorId = null;
        room.seats[0].photo = 'dog'; room.seats[0].copyMode = 'doppel'; room.seats[0].copySourceId = room.seats[1].id; room.seats[0].doppelImmediate = 'robber'; room.seats[0].duskMark = 'fear';
        room.seats.forEach(seat => { seat.ready = true; seat.knowledge = [{ id: 'private', text: { en: 'Secret', zh: '秘密' } }]; });
        room.nightActors = [room.seats[0].id]; room.nightState = { secret: true }; room.actions = { werewolf: { secret: true } }; room.actionLog = [{ type: 'view', targets: ['center:0'] }]; room.votes = { secret: 'vote' }; room.result = { private: true }; room.expansion = { private: true }; room.revealed = [room.seats[0].id]; room.shields = [room.seats[1].id]; room.artifacts = { secret: 'claw' };
        const table = room.seats.map(({ id, actorId, name, photo, isBot }) => ({ id, actorId, name, photo, isBot }));
        const deck = [...room.roleDeck], settings = structuredClone(room.settings), oldPhase = room.phase.id;
        unchangedOnError(room, 'p1', 'restartRound', {}, 'HOST_ONLY');
        unchangedOnError(room, 'p0', 'restartRound', { expectedPhaseId: undefined }, 'STALE_PHASE');
        send(room, 'p0', 'restartRound');
        assert.equal(room.status, 'lobby'); assert.equal(room.phase.kind, 'lobby'); assert.notEqual(room.phase.id, oldPhase); assert.equal(room.phase.deadline, null); assert.equal(room.gameId, null);
        for (const field of ['cards', 'marks', 'artifacts', 'actions', 'nightState', 'votes', 'expansion']) assert.deepEqual(room[field], {}, `${kind}: ${field}`);
        for (const field of ['schedule', 'nightActors', 'actionLog', 'revealed', 'shields']) assert.deepEqual(room[field], [], field);
        assert.equal(room.result, null); assert.equal(room.nightIndex, 0);
        assert.deepEqual(room.roleDeck, deck); assert.deepEqual(room.settings, settings);
        assert.deepEqual(room.seats.map(({ id, actorId, name, photo, isBot }) => ({ id, actorId, name, photo, isBot })), table);
        for (const seat of room.seats) { assert.equal(seat.ready, false); assert.equal(seat.originalRoleId, null); assert.equal(seat.originalCardId, null); assert.deepEqual(seat.knowledge, []); for (const field of ['copyMode', 'copySourceId', 'doppelImmediate', 'duskMark']) assert.equal(seat[field], undefined); }
        const view = publicView(room, 'p0', now); assert.equal(view.result, null); assert.equal(view.me.action, null); assert.deepEqual(view.me.knowledge, []); assert.ok(view.seats.every(seat => !seat.roleId && !seat.revealedRoleId));
        unchangedOnError(room, 'p0', 'restartRound', { expectedPhaseId: oldPhase }, 'STALE_PHASE');
        unchangedOnError(room, 'p0', 'restartRound', {}, 'WRONG_PHASE');
    }
});
test('restarting permits seating changes and a fresh deal; old readiness, actions and narration cannot cross rounds', () => {
    const room = deal(['werewolf', 'dreamWolf', 'seer']);
    const readyPhase = room.phase.id, oldGame = room.gameId, cards = Object.values(room.cards).map(card => card.id);
    openNight(room); const oldPhase = room.phase.id, oldAction = publicView(room, 'p0', now).me.action.id;
    send(room, 'p0', 'restartRound');
    send(room, 'p0', 'moveSeat', { seatId: room.seats[1].id, number: 3 });
    send(room, 'p0', 'start');
    assert.notEqual(room.gameId, oldGame); assert.ok(Object.values(room.cards).every(card => !cards.includes(card.id)));
    unchangedOnError(room, 'p1', 'ready', { expectedPhaseId: readyPhase }, 'STALE_PHASE');
    unchangedOnError(room, 'p0', 'startNight', {}, 'NOT_READY');
    openNight(room);
    unchangedOnError(room, 'p0', 'act', { expectedPhaseId: oldPhase, actionId: oldAction }, 'STALE_PHASE');
    unchangedOnError(room, 'p0', 'narrationDone', { expectedPhaseId: oldPhase }, 'STALE_PHASE');
});
test('Dream Wolf confirms with normal wolves, sees no teammates/cards, and cannot be silently skipped', () => {
    const room = deal(['werewolf', 'dreamWolf', 'seer']); openNight(room);
    const dream = publicView(room, 'p1', now).me;
    assert.equal(dream.action.roleId, 'dreamWolf'); assert.equal(dream.action.min, 0); assert.equal(dream.action.max, 0); assert.deepEqual(dream.action.targets, []); assert.deepEqual(dream.knowledge, []);
    assert.ok(room.seats[0].knowledge.some(entry => entry.text.en.includes('#2')));
    assert.equal(publicView(room, 'p0', now).me.action.targets.length, 0);
    unchangedOnError(room, 'p1', 'act', { actionId: dream.action.id, targets: ['center:0'] }, 'INVALID_TARGET');
    act(room, 'p0'); assert.equal(room.phase.nightStage, 'acting');
    tickRoom(room, now + 60000); assert.equal(room.phase.nightStage, 'acting');
    const offline = publicView(room, 'p1', now + 60000); assert.ok(offline.me.action);
    act(room, 'p1'); assert.equal(room.phase.nightStage, 'closing'); assert.deepEqual(room.seats[1].knowledge, []);
});
test('Dream Wolf alone can confirm, and a bot gets the same zero-target legal action', () => {
    const room = deal(['dreamWolf', 'seer', 'robber']); openNight(room);
    assert.deepEqual(room.nightActors, [room.seats[0].id]);
    room.seats[0].isBot = true;
    const view = publicView(room, 'p0', now), command = chooseBotCommand(view);
    assert.equal(command.type, 'act'); assert.deepEqual(command.targets, []);
    applyCommand(room, 'p0', command, now); assert.equal(room.phase.nightStage, 'closing'); assert.deepEqual(room.seats[0].knowledge, []);
});
test('Alpha and Mystic wolves close the pack turn before their separate abilities; unrelated roles cannot act', () => {
    const room = deal(['dreamWolf', 'werewolf', 'alphaWolf', 'mysticWolf', 'seer']); openNight(room);
    assert.equal(room.phase.step, 'werewolf'); assert.equal(room.nightActors.length, 4);
    assert.equal(publicView(room, 'p4', now).me.action, null);
    for (let index = 0; index < 4; index++) { act(room, `p${index}`); assert.equal(room.phase.nightStage, index === 3 ? 'closing' : 'acting'); }
    send(room, 'p0', 'narrationDone'); assert.equal(room.phase.step, 'alphaWolf'); assert.equal(room.phase.nightStage, 'opening'); assert.ok(room.seats.every(seat => !publicView(room, seat.actorId, now).me.action));
    send(room, 'p0', 'narrationDone'); assert.deepEqual(room.nightActors, [room.seats[2].id]); act(room, 'p2', [room.seats[4].id]);
    send(room, 'p0', 'narrationDone'); assert.equal(room.phase.step, 'mysticWolf'); send(room, 'p0', 'narrationDone'); assert.deepEqual(room.nightActors, [room.seats[3].id]);
});
test('copied Dream Wolf joins only the shared confirmation; fear still suppresses its action', () => {
    const room = deal(['doppelganger', 'dreamWolf', 'seer']); openNight(room);
    act(room, 'p0', [room.seats[1].id]);
    const copyKnowledge = structuredClone(room.seats[0].knowledge);
    send(room, 'p0', 'narrationDone'); assert.equal(room.phase.step, 'werewolf');
    room.seats[1].duskMark = 'fear';
    send(room, 'p0', 'narrationDone'); assert.deepEqual(room.nightActors, [room.seats[0].id]);
    const copied = publicView(room, 'p0', now).me; assert.equal(copied.action.roleId, 'dreamWolf'); assert.deepEqual(copied.knowledge, copyKnowledge); // no new teammate knowledge
    assert.equal(publicView(room, 'p1', now).me.action, null); act(room, 'p0'); assert.equal(room.phase.nightStage, 'closing');
});
