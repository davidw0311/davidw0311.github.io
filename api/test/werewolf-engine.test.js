'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRoom, applyCommand, publicView, tickRoom, recoverHost, ROLES } = require('../src/werewolf/engine');
let time = 1800000000000;
test('pending applicants can cancel their request without occupying or changing a seat', () => {
    const room = setup();
    const seatCount = room.seats.length;
    applyCommand(room, 'pending', { type: 'requestJoin', name: 'Guest' }, ++time);
    assert.equal(room.requests.length, 1);
    applyCommand(room, 'pending', { type: 'leave' }, ++time);
    assert.equal(room.requests.length, 0);
    assert.equal(room.seats.length, seatCount);
    assert.throws(() => applyCommand(room, 'pending', { type: 'heartbeat' }, ++time), { code: 'NOT_SEATED' });
});
function send(room, actor, type, data = {}) { return applyCommand(room, actor, { type, expectedPhaseId: room.phase.id, ...data }, ++time); }
function setup(roles = ['werewolf', 'werewolf', 'seer', 'witch', 'guard', 'hunter', 'villager', 'villager', 'villager'], settings = {}) {
    const room = createRoom({ code: 'ABCDEF', hostId: 'actor0', hostName: 'A', now: ++time });
    for (let i = 1; i < roles.length; i++) {
        send(room, `actor${i}`, 'requestJoin', { name: String.fromCharCode(65 + i) });
    }
    send(room, 'actor0', 'updateSettings', { settings: { winCondition: 'all', sheriff: true, ...settings } });
    send(room, 'actor0', 'startGame', { roleDeck: roles });
    // Tests assign deterministic server-only cards after exercising production shuffle.
    room.seats.forEach((s, i) => { s.roleId = roles[i]; s.team = ['werewolf', 'wolfKing', 'whiteWolfKing', 'wolfBeauty', 'hiddenWolf', 'gargoyle', 'mechanicalWolf', 'bloodMoonApostle', 'wolfWitch'].includes(roles[i]) ? 'wolf' : ['angel', 'jester', 'piper'].includes(roles[i]) ? 'independent' : 'village'; s.originalRoleId = s.roleId; s.originalTeam = s.team; });
    return room;
}
const id = (r, i) => r.seats[i].id;
function advanceTestNight(r) {
    if (r.phase.nightStage === 'opening' || r.phase.nightStage === 'closing') {
        send(r, r.hostId, 'nightNarrationDone');
        return;
    }
    const actors = r.seats.map(seat => ({ seat, action: publicView(r, seat.actorId, time).me?.action }))
        .filter(({ action }) => action && !action.alreadySubmitted);
    for (const { seat, action } of actors) {
        const data = action.input === 'choice' ? { choice: action.options.includes('guard') ? 'guard' : action.options[0] } : { ability: 'skip' };
        send(r, seat.actorId, 'nightAction', data);
    }
    if (r.phase.nightStage === 'acting' && !r.nightFlow.eligibleSeatIds.length) {
        time = Math.max(time + 1, r.nightFlow.deadline);
        for (const member of Object.values(r.members)) member.lastSeen = time;
        tickRoom(r, time);
    }
}
function stepTo(r, step, nightRole) {
    let n = 0;
    while (r.phase.kind === 'night' && (r.phase.step !== step || r.phase.nightStage !== 'acting' || nightRole && r.phase.nightRole !== nightRole) && n++ < 150) advanceTestNight(r);
    assert.equal(r.phase.step, step);
    assert.equal(r.phase.nightStage, 'acting');
    if (nightRole) assert.equal(r.phase.nightRole, nightRole);
}
function dawn(r) { let n = 0; while (r.phase.kind === 'night' && n++ < 200) advanceTestNight(r); assert.notEqual(r.phase.kind, 'night'); }
function nightAct(r, i, data) {
    const openingRole = ['cupid', 'wildChild', 'wolfHound', 'thief', 'mechanicalWolf'].includes(r.seats[i].roleId) && r.night === 1 && r.phase.step === 'opening' ? r.seats[i].roleId : null;
    if (openingRole) stepTo(r, 'opening', openingRole);
    else if (r.phase.nightStage === 'opening') send(r, r.hostId, 'nightNarrationDone');
    send(r, `actor${i}`, 'nightAction', data);
}
function exile(r, index) { if (r.phase.kind === 'reaction')
    send(r, 'actor0', 'nextPhase'); send(r, 'actor0', 'startVoting'); for (const [i, s] of r.seats.entries())
    if (s.alive && s.canVote)
        send(r, `actor${i}`, 'vote', { targetId: id(r, index) }); send(r, 'actor0', 'resolveVoting'); }
function custom(special) { return ['werewolf', 'werewolf', special, 'seer', 'witch', 'villager', 'villager', 'villager', 'villager']; }
test('catalogues mirror exactly and every advertised role is implemented', () => { const canonical = fs.readFileSync(path.join(__dirname, '../src/werewolf/roles.json'), 'utf8'); assert.equal(canonical, fs.readFileSync(path.join(__dirname, '../../public/assets/werewolf/roles.json'), 'utf8')); const catalogue = JSON.parse(canonical); assert.equal(catalogue.roles.length, 31); assert.deepEqual(new Set(catalogue.roles.map(r => r.id)), ROLES); for (const r of catalogue.roles) {
    assert.ok(r.description.en);
    assert.ok(r.description.zh);
} });
test('role assignment remains private including for the participating host', () => { const r = setup(); const v = publicView(r, 'actor0', time); assert.equal(v.me.roleId, 'werewolf'); assert.ok(v.seats.every(s => !Object.hasOwn(s, 'roleId'))); const serialized = JSON.stringify(v); assert.ok(!serialized.includes('actor0')); assert.ok(!serialized.includes('actor1')); assert.ok(!serialized.includes('privateLog\":[' + JSON.stringify(r.seats[2].privateLog))); assert.deepEqual(v.me.allies, [id(r, 1)]); });
test('replacement retains identity and actions and permanently revokes old token', () => { const r = setup(); nightAct(r, 1, { targetId: id(r, 6) }); const oldId = id(r, 1); send(r, 'replacement', 'requestJoin', { name: 'B' }); send(r, 'actor0', 'approveJoin', { requestId: r.requests.at(-1).id, replaceSeatId: oldId }); const view = publicView(r, 'replacement', time); assert.equal(view.me.seatId, oldId); assert.equal(view.me.roleId, 'werewolf'); assert.equal(view.me.action.alreadySubmitted, true); assert.equal(publicView(r, 'actor1', time).me, null); assert.throws(() => nightAct(r, 1, { targetId: id(r, 5) }), e => e.code === 'NOT_SEATED'); });
test('active-game removal disconnects a seat without killing or losing its card', () => { const r = setup(); send(r, 'actor0', 'removeSeat', { seatId: id(r, 2) }); assert.equal(r.seats[2].alive, true); assert.equal(r.seats[2].roleId, 'seer'); assert.equal(r.seats[2].actorId, null); send(r, 'new', 'requestJoin', { name: 'New' }); assert.throws(() => send(r, 'actor0', 'approveJoin', { requestId: r.requests.at(-1).id }), e => e.code === 'REPLACEMENT_REQUIRED'); send(r, 'actor0', 'approveJoin', { requestId: r.requests.at(-1).id, replaceSeatId: id(r, 2) }); assert.equal(publicView(r, 'new', time).me.roleId, 'seer'); });
test('reconnect uses the same identity; names alone cannot take a seat', () => { const r = setup(); send(r, 'actor2', 'leave'); assert.equal(publicView(r, 'actor2', time).me.roleId, 'seer'); send(r, 'actor2', 'heartbeat'); assert.equal(publicView(r, 'actor2', time).seats[2].connected, true); send(r, 'intruder', 'requestJoin', { name: 'C' }); assert.equal(publicView(r, 'intruder', time).me, null); assert.equal(publicView(r, 'intruder', time).myRequest.status, 'pending'); });
test('host permissions and stale phases are enforced with complete rollback', () => { const r = setup(); const before = JSON.stringify(r); assert.throws(() => send(r, 'actor1', 'nextPhase'), e => e.code === 'HOST_ONLY'); assert.equal(JSON.stringify(r), before); const phase = r.phase.id; send(r, 'actor0', 'nightNarrationDone'); assert.throws(() => send(r, 'actor0', 'nextPhase', { expectedPhaseId: phase }), e => e.code === 'STALE_PHASE'); assert.throws(() => send(r, 'actor2', 'nightAction', { expectedPhaseId: phase, targetId: id(r, 0) }), e => e.code === 'STALE_PHASE'); });
test('host transfer and recovery revoke previous host control and occupant token', () => { const r = setup(); send(r, 'actor0', 'transferHost', { seatId: id(r, 1) }); assert.throws(() => send(r, 'actor0', 'nextPhase'), e => e.code === 'HOST_ONLY'); const card = r.seats[1].roleId; recoverHost(r, 'recovered', ++time); assert.equal(r.hostId, 'recovered'); assert.equal(publicView(r, 'recovered', time).me.roleId, card); assert.equal(publicView(r, 'actor1', time).me, null); assert.equal(publicView(r, 'actor0', time).isHost, false); });
test('offline narration progresses but daylight waits for the host', () => {
 const r=setup(undefined,{autoAdvance:true});
 for(const m of Object.values(r.members)) m.lastSeen=0;
 time=r.nightFlow.deadline; assert.equal(tickRoom(r,time),true);
 assert.equal(r.phase.nightStage,'acting'); assert.equal(r.phase.paused,false);
 dawn(r); const phase=r.phase.id; time+=999999;
 assert.equal(tickRoom(r,time),false); assert.equal(r.phase.id,phase);
 send(r,r.hostId,'hardSkip'); assert.equal(r.phase.kind,'voting');
});

test('night schedule never changes when a configured role dies', () => { const r = setup(); const first = [...r.nightSchedule]; dawn(r); r.seats[2].alive = false; send(r, 'actor0', 'startNight'); assert.deepEqual(r.nightSchedule, first); stepTo(r, 'seer'); assert.equal(publicView(r, 'actor2', time).me.action, null); });
test('pack ties mean no attack and private votes are not public before resolution', () => { const r = setup(); nightAct(r, 0, { targetId: id(r, 6) }); nightAct(r, 1, { targetId: id(r, 7) }); dawn(r); assert.ok(r.seats.every(s => s.alive)); send(r, 'actor0', 'startVoting'); send(r, 'actor0', 'vote', { targetId: id(r, 6) }); const v = publicView(r, 'actor1', time); assert.equal(v.voteCount, 1); assert.equal(v.lastVote, null); assert.ok(!Object.hasOwn(v, 'votes')); });
test('guard blocks wolves; guard restrictions reset after skipping a night', () => { const r = setup(); nightAct(r, 0, { targetId: id(r, 6) }); stepTo(r, 'guard'); nightAct(r, 4, { targetId: id(r, 6) }); dawn(r); assert.equal(r.seats[6].alive, true); send(r, 'actor0', 'startNight'); stepTo(r, 'guard'); assert.throws(() => nightAct(r, 4, { targetId: id(r, 6) }), e => e.code === 'INVALID_TARGET'); nightAct(r, 4, { ability: 'skip' }); dawn(r); send(r, 'actor0', 'startNight'); stepTo(r, 'guard'); nightAct(r, 4, { targetId: id(r, 6) }); });
test('witch potion inventories, target secrecy and guard plus antidote rule', () => { const r = setup(); r.settings.guardAntidote = 'kill'; nightAct(r, 0, { targetId: id(r, 6) }); stepTo(r, 'guard'); nightAct(r, 4, { targetId: id(r, 6) }); stepTo(r, 'witch'); assert.equal(publicView(r, 'actor3', time).me.action.victimId, id(r, 6)); assert.equal(publicView(r, 'actor2', time).me.action, null); nightAct(r, 3, { ability: 'save' }); dawn(r); assert.equal(r.seats[6].alive, false); assert.equal(r.seats[3].state.antidoteUsed, true); send(r, 'actor0', 'startNight'); nightAct(r, 0, { targetId: id(r, 7) }); stepTo(r, 'witch'); assert.equal(publicView(r, 'actor3', time).me.action.victimId, null); assert.throws(() => nightAct(r, 3, { ability: 'save' }), e => e.code === 'INVALID_ACTION'); });
test('hunter death exposes a private shot; poison suppresses it', () => { const r = setup(); nightAct(r, 0, { targetId: id(r, 5) }); dawn(r); assert.equal(r.phase.kind, 'reaction'); assert.equal(publicView(r, 'actor5', time).me.action.kind, 'shoot'); send(r, 'actor5', 'shoot', { targetId: id(r, 0) }); assert.equal(r.seats[0].alive, false); const p = setup(); nightAct(p, 0, { targetId: id(p, 5) }); stepTo(p, 'witch'); nightAct(p, 3, { ability: 'poison', targetId: id(p, 5) }); dawn(p); assert.ok(!p.pendingShots.includes(id(p, 5))); });
test('seer result is private and Hidden Wolf appears village', () => { const r = setup(['werewolf', 'hiddenWolf', 'seer', 'witch', 'guard', 'villager', 'villager', 'villager', 'villager']); stepTo(r, 'seer'); nightAct(r, 2, { targetId: id(r, 1) }); dawn(r); assert.match(publicView(r, 'actor2', time).me.privateLog.at(-1).text.en, /village/); assert.equal(publicView(r, 'actor0', time).me.privateLog.length, 0); assert.deepEqual(publicView(r, 'actor0', time).me.allies, []); assert.deepEqual(publicView(r, 'actor1', time).me.allies, [id(r, 0)]); });
test('Idiot survives first exile and loses voting rights', () => { const r = setup(custom('idiot')); dawn(r); exile(r, 2); assert.equal(r.seats[2].alive, true); assert.equal(r.seats[2].canVote, false); assert.equal(publicView(r, 'actor0', time).seats[2].roleId, 'idiot'); send(r, 'actor0', 'startVoting'); assert.throws(() => send(r, 'actor2', 'vote', { targetId: id(r, 0) }), e => e.code === 'NO_VOTE'); });
test('Cupid death link and Wild Child transformation survive replacement', () => { const r = setup(['werewolf', 'werewolf', 'cupid', 'wildChild', 'seer', 'villager', 'villager', 'villager', 'villager']); nightAct(r, 2, { targetIds: [id(r, 5), id(r, 6)] }); nightAct(r, 3, { targetId: id(r, 5) }); stepTo(r, 'wolves'); nightAct(r, 0, { targetId: id(r, 5) }); dawn(r); assert.equal(r.seats[5].alive, false); assert.equal(r.seats[6].alive, false); assert.equal(r.seats[3].team, 'wolf'); assert.ok(publicView(r, 'actor0', time).me.allies.includes(id(r, 3))); });
test('Thief, Wolf Hound and Mechanical Wolf opening choices are applied', () => { const r = setup(['werewolf', 'mechanicalWolf', 'wolfHound', 'thief', 'seer', 'guard', 'villager', 'villager', 'villager']); nightAct(r, 2, { choice: 'wolf' }); nightAct(r, 3, { choice: 'guard' }); nightAct(r, 1, { targetId: id(r, 4) }); stepTo(r, 'wolves'); assert.equal(r.seats[1].state.copiedRole, 'seer'); assert.equal(r.seats[2].team, 'wolf'); assert.equal(r.seats[3].roleId, 'guard'); stepTo(r, 'seer'); nightAct(r, 1, { targetId: id(r, 4) }); dawn(r); assert.match(r.seats[1].privateLog.at(-1).text.en, /village/); });
test('Magician swaps all targeted night actions and cannot reuse a pair', () => { const r = setup(custom('magician')); nightAct(r, 0, { targetId: id(r, 5) }); stepTo(r, 'magician'); nightAct(r, 2, { targetIds: [id(r, 5), id(r, 6)] }); dawn(r); assert.equal(r.seats[5].alive, true); assert.equal(r.seats[6].alive, false); });
test('Dreamweaver protects a target and consecutive dreaming kills', () => { const r = setup(custom('dreamweaver')); nightAct(r, 0, { targetId: id(r, 5) }); stepTo(r, 'dreamweaver'); nightAct(r, 2, { targetId: id(r, 5) }); dawn(r); assert.equal(r.seats[5].alive, true); send(r, 'actor0', 'startNight'); stepTo(r, 'dreamweaver'); nightAct(r, 2, { targetId: id(r, 5) }); dawn(r); assert.equal(r.seats[5].alive, false); });
test('Knight duel and White Wolf King explosion are server validated', () => { const r = setup(custom('knight')); dawn(r); send(r, 'actor2', 'knightDuel', { targetId: id(r, 0) }); assert.equal(r.seats[0].alive, false); assert.equal(r.seats[2].alive, true); assert.throws(() => send(r, 'actor2', 'knightDuel', { targetId: id(r, 1) }), e => e.code === 'NO_ABILITY'); const w = setup(['whiteWolfKing', 'werewolf', 'seer', 'witch', 'guard', 'villager', 'villager', 'villager', 'villager']); dawn(w); send(w, 'actor0', 'wolfExplode', { targetId: id(w, 5) }); assert.equal(w.seats[0].alive, false); assert.equal(w.seats[5].alive, false); });
test('Wolf Beauty charm kills the current target on death', () => { const r = setup(['werewolf', 'wolfBeauty', 'seer', 'witch', 'guard', 'villager', 'villager', 'villager', 'villager']); stepTo(r, 'wolfBeauty'); nightAct(r, 1, { targetId: id(r, 5) }); dawn(r); exile(r, 1); assert.equal(r.seats[5].alive, false); });
test('Blood Moon self-destruction suppresses village powers on next night only', () => { const r = setup(['bloodMoonApostle', 'werewolf', 'seer', 'witch', 'guard', 'villager', 'villager', 'villager', 'villager']); dawn(r); send(r, 'actor0', 'wolfExplode'); send(r, 'actor0', 'startNight'); stepTo(r, 'seer'); assert.equal(publicView(r, 'actor2', time).me.action, null); dawn(r); send(r, 'actor0', 'startNight'); stepTo(r, 'seer'); assert.ok(publicView(r, 'actor2', time).me.action); });
test('Pure White kills an inspected wolf only from the second night', () => { const r = setup(custom('pureWhite')); stepTo(r, 'pureWhite'); nightAct(r, 2, { targetId: id(r, 0) }); dawn(r); assert.equal(r.seats[0].alive, true); send(r, 'actor0', 'startNight'); stepTo(r, 'pureWhite'); nightAct(r, 2, { targetId: id(r, 0) }); dawn(r); assert.equal(r.seats[0].alive, false); });
test('Gargoyle and Wolf Witch inspect exact roles; Wolf Witch poison is single use', () => { const r = setup(['werewolf', 'wolfWitch', 'gargoyle', 'seer', 'guard', 'villager', 'villager', 'villager', 'villager']); stepTo(r, 'wolfWitch'); assert.throws(() => nightAct(r, 1, { ability: 'poison', targetId: id(r, 5) }), e => e.code === 'INVALID_ACTION'); nightAct(r, 1, { ability: 'inspect', targetId: id(r, 4) }); stepTo(r, 'gargoyle'); nightAct(r, 2, { targetId: id(r, 3) }); dawn(r); assert.match(r.seats[1].privateLog.at(-1).text.en, /Guard/); assert.match(r.seats[2].privateLog.at(-1).text.en, /Seer/); send(r, 'actor0', 'startNight'); stepTo(r, 'wolfWitch'); nightAct(r, 1, { ability: 'poison', targetId: id(r, 5) }); dawn(r); assert.equal(r.seats[5].alive, false); assert.equal(r.seats[1].state.poisonUsed, true); });
test('Demon Hunter is immune to poison and kills a wolf from night two', () => { const r = setup(custom('demonHunter')); stepTo(r, 'witch'); nightAct(r, 4, { ability: 'poison', targetId: id(r, 2) }); dawn(r); assert.equal(r.seats[2].alive, true); send(r, 'actor0', 'startNight'); stepTo(r, 'demonHunter'); nightAct(r, 2, { targetId: id(r, 0) }); dawn(r); assert.equal(r.seats[0].alive, false); });
test('Piper wins when all other living players are charmed', () => { const r = setup(custom('piper')); r.seats.forEach(s => { if (s.id !== id(r, 2))
    s.state.charmed = true; }); stepTo(r, 'piper'); nightAct(r, 2, { ability: 'skip' }); dawn(r); assert.equal(r.winner.team, 'piper'); });
test('Angel and Jester have explicit exile victories', () => { for (const role of ['angel', 'jester']) {
    const r = setup(custom(role));
    dawn(r);
    exile(r, 2);
    assert.equal(r.winner.team, role);
} const r = setup(custom('angel')); dawn(r); exile(r, 5); assert.equal(r.seats[2].team, 'village'); });
test('Elder survives one wolf attack and exile disables village active powers', () => { const r = setup(custom('elder')); nightAct(r, 0, { targetId: id(r, 2) }); dawn(r); assert.equal(r.seats[2].alive, true); exile(r, 2); assert.equal(r.villagePowersLost, true); send(r, 'actor0', 'startNight'); stepTo(r, 'seer'); assert.equal(publicView(r, 'actor3', time).me.action, null); });
test('Scapegoat dies on a tied exile and Raven adds one vote', () => { const r = setup(custom('scapegoat')); dawn(r); send(r, 'actor0', 'startVoting'); send(r, 'actor0', 'vote', { targetId: id(r, 5) }); send(r, 'actor1', 'vote', { targetId: id(r, 6) }); send(r, 'actor0', 'resolveVoting'); assert.equal(r.seats[2].alive, false); const c = setup(custom('raven')); stepTo(c, 'raven'); nightAct(c, 2, { targetId: id(c, 5) }); dawn(c); send(c, 'actor0', 'startVoting'); send(c, 'actor0', 'vote', { targetId: id(c, 5) }); send(c, 'actor1', 'vote', { targetId: id(c, 6) }); send(c, 'actor0', 'resolveVoting'); assert.equal(c.seats[5].alive, false); });
test('Gravekeeper learns the actual last exiled alignment', () => { const r = setup(custom('gravekeeper')); dawn(r); exile(r, 0); send(r, 'actor0', 'startNight'); stepTo(r, 'gravekeeper'); nightAct(r, 2, {}); dawn(r); assert.match(r.seats[2].privateLog.at(-1).text.en, /Werewolves/); });
test('Sheriff vote and badge produce 1.5 votes on exile only', () => { const r = setup(); dawn(r); send(r, 'actor0', 'startSheriff'); send(r, 'actor0', 'vote', { targetId: id(r, 2) }); send(r, 'actor0', 'resolveVoting'); assert.equal(r.sheriffSeatId, id(r, 2)); send(r, 'actor0', 'startVoting'); send(r, 'actor2', 'vote', { targetId: id(r, 6) }); send(r, 'actor0', 'vote', { targetId: id(r, 7) }); send(r, 'actor0', 'resolveVoting'); assert.equal(r.lastVote.tally[id(r, 6)], 1.5); assert.equal(r.seats[6].alive, false); send(r, 'actor2', 'passBadge', { targetId: id(r, 3) }); assert.equal(r.sheriffSeatId, id(r, 3)); });
test('public, wolf and dead chats enforce faction and phase boundaries', () => { const r = setup(); send(r, 'actor0', 'chat', { text: 'Pack secret', channel: 'wolves' }); assert.equal(publicView(r, 'actor1', time).messages.length, 1); assert.equal(publicView(r, 'actor2', time).messages.length, 0); assert.throws(() => send(r, 'actor2', 'chat', { text: 'Guess', channel: 'wolves' }), e => e.code === 'CHAT_CLOSED'); assert.throws(() => send(r, 'actor2', 'chat', { text: 'Night speech', channel: 'public' }), e => e.code === 'CHAT_CLOSED'); dawn(r); time += 1000; send(r, 'actor2', 'chat', { text: 'Day discussion', channel: 'public' }); assert.equal(publicView(r, 'actor3', time).messages.length, 1); });
test('victory and finished reveal are explicit; changing rules midgame is rejected', () => { const r = setup(); assert.throws(() => send(r, 'actor0', 'updateSettings', { settings: { winCondition: 'edge' } }), e => e.code === 'WRONG_PHASE'); r.seats[0].alive = false; r.seats[1].alive = false; dawn(r); assert.equal(r.winner.team, 'village'); assert.ok(publicView(r, 'actor2', time).seats.every(s => s.roleId)); });
test('host hard skips progress daylight and begin the next event-driven night', () => {
    const r = setup(); r.settings.autoAdvance = true;
    dawn(r);
    const advance = () => send(r,r.hostId,'hardSkip');
    assert.equal(r.phase.kind, 'day'); advance(); assert.equal(r.phase.kind, 'voting'); advance(); assert.equal(r.phase.step, 'afterVote'); advance();
    assert.equal(r.phase.kind, 'night'); assert.equal(r.phase.nightStage, 'opening'); assert.equal(r.night, 2);
});
test('pending Hunter reactions resolve before victory and allow a final reversal', () => { const r = setup(['wolfKing', 'werewolf', 'seer', 'witch', 'guard', 'villager', 'villager', 'villager', 'villager']); r.seats[1].alive = false; dawn(r); exile(r, 0); assert.equal(r.phase.kind, 'reaction'); assert.equal(r.status, 'playing'); send(r, 'actor0', 'shoot', { targetId: id(r, 3) }); assert.equal(r.winner.team, 'village'); });
test('mixed lovers can win together and ordinary lovers do not create a new faction', () => { const r = setup(['werewolf', 'werewolf', 'cupid', 'seer', 'witch', 'villager', 'villager', 'villager', 'villager']); nightAct(r, 2, { targetIds: [id(r, 0), id(r, 5)] }); dawn(r); r.seats.forEach((s, i) => { if (i !== 0 && i !== 5)
    s.alive = false; }); send(r, 'actor0', 'startNight'); dawn(r); assert.equal(r.winner.team, 'lovers'); });
test('all-player randomized simulation keeps immutable seat identities and private action boundaries', () => {
    let seed = 7123;
    const rand = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
    const roles = ['werewolf', 'wolfKing', 'wolfBeauty', 'wolfWitch', 'mechanicalWolf', 'hiddenWolf', 'seer', 'witch', 'guard', 'hunter', 'cupid', 'magician', 'dreamweaver', 'gravekeeper', 'raven', 'demonHunter', 'pureWhite', 'wildChild', 'wolfHound', 'thief', 'piper', 'elder', 'knight', 'villager'];
    const r = setup(roles), stableIds = r.seats.map(s => s.id);
    let commands = 0;
    for (let turn = 0; turn < 700 && r.status === 'playing'; turn++) {
        for (let i = 0; i < r.seats.length; i++) {
            const view = publicView(r, `actor${i}`, time), a = view.me.action;
            assert.deepEqual(view.seats.map(s => s.id), stableIds);
            assert.ok(view.seats.every(s => !Object.hasOwn(s, 'team')));
            if (!a)
                continue;
            let data = {};
            if (a.input === 'choice')
                data.choice = a.options[rand(a.options.length)];
            else if (a.input === 'none')
                data = {};
            else if (a.options?.includes('poison')) {
                data.ability = 'poison';
                if (a.targets.length)
                    data.targetId = a.targets[rand(a.targets.length)];
            }
            else if (a.input === 'double' && a.targets.length >= a.minTargets) {
                const options = [...a.targets].sort(() => rand(3) - 1);
                data.targetIds = options.slice(0, a.minTargets);
            }
            else if (a.targets.length)
                data.targetId = a.targets[rand(a.targets.length)];
            else
                data = a.kind === 'nightAction' ? { ability: 'skip' } : { targetId: null };
            try {
                send(r, `actor${i}`, a.kind, data);
                commands++;
            }
            catch (error) {
                assert.ok(['INVALID_TARGET', 'WRONG_PHASE', 'NO_ABILITY', 'STALE_PHASE', 'INVALID_ACTION'].includes(error.code), error.message);
            }
            if (r.status !== 'playing')
                break;
        }
        if (r.status === 'playing') {
            if (r.phase.kind === 'night') advanceTestNight(r); else send(r, 'actor0', 'nextPhase');
            commands++;
        }
    }
    assert.ok(commands > 100);
    assert.equal(r.status, 'finished');
    assert.ok(['village', 'wolf', 'lovers', 'piper', 'draw'].includes(r.winner.team));
});
test('heartbeat persistence is throttled without granting revoked clients access', () => { const r = setup(); const revision = r.revision; send(r, 'actor1', 'heartbeat'); assert.equal(r.revision, revision); time += 11000; send(r, 'actor1', 'heartbeat'); assert.equal(r.revision, revision + 1); send(r, 'pending', 'requestJoin', { name: 'Pending' }); const pendingRevision = r.revision; send(r, 'pending', 'heartbeat'); assert.equal(r.revision, pendingRevision); assert.throws(() => send(r, 'unknown', 'heartbeat'), e => e.code === 'NOT_SEATED'); });
test('legacy timer settings cannot enable action expiry and role rules stay locked', () => {
 const r=setup(); const deadline=r.nightFlow.deadline;
 send(r,r.hostId,'updateSettings',{settings:{autoAdvance:true,nightSeconds:60}});
 assert.equal(r.settings.autoAdvance,false); assert.equal(r.nightFlow.deadline,deadline);
 dawn(r); send(r,r.hostId,'pause'); send(r,r.hostId,'updateSettings',{settings:{daySeconds:90}});
 assert.equal(r.phase.paused,true); assert.equal(r.phase.remainingMs,null);
 assert.throws(()=>send(r,r.hostId,'updateSettings',{settings:{witchSelfSave:true}}),{code:'WRONG_PHASE'});
});

test('night action replay is revealed only when the game is finished and contains seat IDs only', () => { const r = setup(); nightAct(r, 0, { targetId: id(r, 6) }); dawn(r); assert.deepEqual(publicView(r, 'actor0', time).replay, []); r.seats[0].alive = false; r.seats[1].alive = false; send(r, 'actor0', 'startVoting'); send(r, 'actor0', 'resolveVoting'); const replay = publicView(r, 'actor2', time).replay; assert.equal(replay[0].actions.wolves[id(r, 0)].targetId, id(r, 6)); assert.ok(!JSON.stringify(replay).includes('actor')); });

test('votes remain valid after legacy deadlines and host skip counts submitted votes', () => {
 const r=setup(); dawn(r); send(r,r.hostId,'hardSkip');
 r.settings.autoAdvance=true; r.phase.deadline=time+100;
 time+=999999; tickRoom(r,time); assert.equal(r.phase.kind,'voting');
 send(r,r.hostId,'vote',{targetId:id(r,6)}); send(r,r.hostId,'pause');
 send(r,r.hostId,'hardSkip'); assert.equal(r.seats[6].alive,false);
 assert.equal(r.phase.kind,'day'); send(r,r.hostId,'hardSkip'); assert.equal(r.phase.kind,'night');
});

test('Mechanical Wolf copies the starting card independently of first-night seat order', () => {
    for (const roles of [
        ['werewolf', 'mechanicalWolf', 'thief', 'seer', 'witch', 'villager', 'villager', 'villager', 'villager'],
        ['werewolf', 'thief', 'mechanicalWolf', 'seer', 'witch', 'villager', 'villager', 'villager', 'villager'],
    ]) {
        const r = setup(roles), mechanical = roles.indexOf('mechanicalWolf'), thief = roles.indexOf('thief');
        nightAct(r, thief, { choice: 'guard' });
        nightAct(r, mechanical, { targetId: id(r, thief) });
        stepTo(r, 'wolves');
        assert.equal(r.seats[thief].roleId, 'guard');
        assert.equal(r.seats[mechanical].state.copiedRole, 'seer');
    }
});

test('offline Hunter reactions wait indefinitely for action or host skip', () => {
 for(const skip of [false,true]) {
 const r=setup(); nightAct(r,0,{targetId:id(r,5)}); dawn(r);
 send(r,'actor5','leave'); time+=999999; assert.equal(tickRoom(r,time),false);
 assert.equal(r.phase.kind,'reaction'); assert.equal(r.phase.paused,false);
 if(skip) { send(r,r.hostId,'pause'); send(r,r.hostId,'hardSkip'); assert.equal(r.seats[0].alive,true); }
 else send(r,'actor5','shoot',{targetId:id(r,0)});
 assert.equal(r.phase.kind,'day'); assert.deepEqual(r.pendingShots,[]);
 assert.equal(r.seats[5].state.shotUsed,true);
 }
});

test('lobby joins immediately occupy a seat and same-session retries preserve it', () => {
    const r = createRoom({ code: 'LOBBY', hostId: 'host', hostName: 'Host', now: ++time });
    send(r, 'guest', 'requestJoin', { name: '  New   guest ' });
    const joined = publicView(r, 'guest', time);
    assert.equal(joined.me.seatId, r.seats[1].id);
    assert.equal(r.seats[1].name, 'New guest');
    assert.equal(joined.me.roleId, null);
    assert.equal(joined.myRequest, null);
    assert.equal(r.requests.length, 0);
    const stableId = joined.me.seatId;
    time += 40000;
    send(r, 'guest', 'requestJoin', { name: 'Same browser' });
    assert.equal(r.seats.length, 2);
    assert.equal(publicView(r, 'guest', time).me.seatId, stableId);
    assert.equal(publicView(r, 'guest', time).seats[1].connected, true);
});

test('lobby names fill matching empty reservations but never claim occupied or disconnected seats', () => {
    const r = createRoom({ code: 'LOBBY', hostId: 'host', hostName: 'Host', now: ++time });
    send(r, 'host', 'addSeat', { name: 'A' });
    const reservation = r.seats[1].id;
    send(r, 'first-a', 'requestJoin', { name: ' A ' });
    assert.equal(publicView(r, 'first-a', time).me.seatId, reservation);
    r.members['first-a'].lastSeen = 0;
    send(r, 'second-a', 'requestJoin', { name: 'A' });
    assert.equal(r.seats.length, 3);
    assert.equal(publicView(r, 'first-a', time).me.seatId, reservation);
    assert.notEqual(publicView(r, 'second-a', time).me.seatId, reservation);
    assert.equal(r.members['first-a'].lastSeen, 0);
});

test('full lobby accepts a matching reserved seat and rejects overflow without mutations', () => {
    const r = createRoom({ code: 'LOBBY', hostId: 'host', hostName: 'Host', now: ++time });
    for (let i = 1; i < 24; i++) send(r, 'host', 'addSeat', { name: `Reserved ${i}` });
    const reservedId = r.seats[23].id;
    send(r, 'guest', 'requestJoin', { name: 'Reserved 23' });
    assert.equal(publicView(r, 'guest', time).me.seatId, reservedId);
    assert.equal(r.seats.length, 24);
    const before = JSON.stringify(r);
    assert.throws(() => send(r, 'overflow', 'requestJoin', { name: 'No reservation' }), { code: 'ROOM_FULL' });
    assert.equal(JSON.stringify(r), before);
    assert.throws(() => send(r, 'same-name-overflow', 'requestJoin', { name: 'Reserved 23' }), { code: 'ROOM_FULL' });
    assert.equal(publicView(r, 'guest', time).me.seatId, reservedId);
});

test('voluntary lobby exit removes a seat while connection loss preserves it', () => {
    const r = createRoom({ code: 'LOBBY', hostId: 'host', hostName: 'Host', now: ++time });
    send(r, 'guest', 'requestJoin', { name: 'Guest' });
    const guestId = publicView(r, 'guest', time).me.seatId;
    assert.equal(publicView(r, 'guest', time + 40000).seats.find(s => s.id === guestId).connected, false);
    assert.equal(r.seats.length, 2);
    send(r, 'guest', 'heartbeat');
    assert.equal(publicView(r, 'guest', time).me.seatId, guestId);
    send(r, 'guest', 'leave');
    assert.equal(r.seats.length, 1);
    assert.equal(r.members.guest, undefined);
    assert.equal(publicView(r, 'guest', time).me, null);
    assert.throws(() => send(r, 'guest', 'heartbeat'), { code: 'NOT_SEATED' });
    send(r, 'guest', 'requestJoin', { name: 'Guest' });
    assert.notEqual(publicView(r, 'guest', time).me.seatId, guestId);
});

test('departing lobby host transfers to a connected player before offline occupants', () => {
    const r = createRoom({ code: 'LOBBY', hostId: 'host', hostName: 'Host', now: ++time });
    send(r, 'offline', 'requestJoin', { name: 'Offline' });
    send(r, 'online', 'requestJoin', { name: 'Online' });
    r.members.offline.lastSeen = 0;
    send(r, 'host', 'leave');
    assert.equal(r.hostId, 'online');
    assert.equal(publicView(r, 'online', time).isHost, true);
    assert.equal(publicView(r, 'host', time).isHost, false);
    assert.throws(() => send(r, 'host', 'addSeat', { name: 'Old host command' }), { code: 'HOST_ONLY' });
    send(r, 'online', 'leave');
    assert.equal(r.hostId, 'offline', 'An occupied offline player still inherits when nobody connected remains');
    assert.equal(publicView(r, 'offline', time).isHost, true);
});

test('empty lobby has no host even with reserved seats and next join takes control', () => {
    const r = createRoom({ code: 'LOBBY', hostId: 'host', hostName: 'Host', now: ++time });
    send(r, 'host', 'addSeat', { name: 'Reserved guest' });
    const reservedId = r.seats[1].id;
    send(r, 'host', 'leave');
    assert.equal(r.hostId, null);
    const vacant = publicView(r, 'host', time);
    assert.equal(vacant.isHost, false);
    assert.equal(vacant.hostSeatId, null);
    assert.ok(vacant.seats.every(seat => !seat.isHost));
    send(r, 'new-host', 'requestJoin', { name: 'Reserved guest' });
    assert.equal(r.hostId, 'new-host');
    assert.equal(publicView(r, 'new-host', time).me.seatId, reservedId);
    assert.equal(r.seats.length, 1);
});

test('legacy lobby requests remain approvable and auto-joining clears only the caller request', () => {
    const r = createRoom({ code: 'LOBBY', hostId: 'host', hostName: 'Host', now: ++time });
    r.requests.push({ id: 'legacy-one', actorId: 'one', name: 'One', createdAt: time });
    r.requests.push({ id: 'legacy-two', actorId: 'two', name: 'Two', createdAt: time });
    send(r, 'one', 'requestJoin', { name: 'One' });
    assert.equal(r.requests.length, 1);
    assert.equal(r.requests[0].id, 'legacy-two');
    assert.equal(publicView(r, 'one', time).myRequest, null);
    send(r, 'host', 'approveJoin', { requestId: 'legacy-two' });
    assert.ok(publicView(r, 'two', time).me);
    assert.equal(r.requests.length, 0);
});

test('underway host exit preserves its card, powers, control and reconnectable identity', () => {
    const r = setup();
    nightAct(r, 0, { targetId: id(r, 6) });
    const before = publicView(r, 'actor0', time).me;
    send(r, 'actor0', 'leave');
    assert.equal(r.hostId, 'actor0');
    assert.equal(r.seats.length, 9);
    assert.equal(r.members.actor0.lastSeen, 0);
    send(r, 'actor0', 'requestJoin', { name: 'Original host' });
    const returned = publicView(r, 'actor0', time);
    assert.equal(returned.me.seatId, before.seatId);
    assert.equal(returned.me.roleId, before.roleId);
    assert.equal(returned.me.action.alreadySubmitted, true);
    assert.equal(returned.isHost, true);
    assert.equal(returned.seats.find(seat => seat.id === before.seatId).connected, true);
});

test('legacy pending lobby polls auto-admit when capacity opens and stay quiet when full', () => {
    const r = createRoom({ code: 'LOBBY', hostId: 'host', hostName: 'Host', now: ++time });
    for (let i = 1; i < 24; i++) send(r, 'host', 'addSeat', { name: `Reserved ${i}` });
    r.requests.push({ id: 'waiting', actorId: 'waiting', name: 'Waiting', createdAt: time });
    const fullRevision = r.revision;
    send(r, 'waiting', 'heartbeat');
    assert.equal(r.revision, fullRevision);
    assert.equal(publicView(r, 'waiting', time).myRequest.status, 'pending');
    send(r, 'host', 'removeSeat', { seatId: r.seats[1].id });
    send(r, 'waiting', 'heartbeat');
    assert.ok(publicView(r, 'waiting', time).me);
    assert.equal(publicView(r, 'waiting', time).myRequest, null);
    r.requests.push({ id: 'reserved-request', actorId: 'reserved-player', name: 'Reserved 23', createdAt: time });
    const reservedId = r.seats.find(seat => seat.name === 'Reserved 23').id;
    send(r, 'reserved-player', 'heartbeat');
    assert.equal(publicView(r, 'reserved-player', time).me.seatId, reservedId);
    assert.equal(r.seats.length, 24);
});

test('first-night-only Witch self-save saves its owner on night one and consumes the antidote', () => {
    const r = setup(undefined, { witchSelfSave: 'firstNight' });
    assert.equal(publicView(r, 'actor3', time).settings.witchSelfSave, 'firstNight');
    nightAct(r, 0, { targetId: id(r, 3) });
    stepTo(r, 'witch');
    assert.ok(publicView(r, 'actor3', time).me.action.options.includes('save'));
    nightAct(r, 3, { ability: 'save' });
    dawn(r);
    assert.equal(r.seats[3].alive, true);
    assert.equal(r.seats[3].state.antidoteUsed, true);
    assert.equal(r.seats[3].state.poisonUsed, undefined);
});

test('first-night-only Witch rejects later self-save transactionally while poison remains usable', () => {
    const r = setup(undefined, { witchSelfSave: 'firstNight' });
    dawn(r); send(r, 'actor0', 'startNight');
    nightAct(r, 0, { targetId: id(r, 3) });
    stepTo(r, 'witch');
    const action = publicView(r, 'actor3', time).me.action;
    assert.equal(action.victimId, id(r, 3));
    assert.ok(!action.options.includes('save'));
    assert.ok(action.options.includes('poison'));
    const before = JSON.stringify(r);
    assert.throws(() => nightAct(r, 3, { ability: 'save' }), { code: 'INVALID_ACTION' });
    assert.equal(JSON.stringify(r), before);
    assert.equal(r.seats[3].state.antidoteUsed, undefined);
    nightAct(r, 3, { ability: 'poison', targetId: id(r, 0) });
    dawn(r);
    assert.equal(r.seats[0].alive, false);
    assert.equal(r.seats[3].state.poisonUsed, true);
    assert.equal(r.seats[3].state.antidoteUsed, undefined);
});

test('first-night-only rule still permits saving other players after night one', () => {
    const r = setup(undefined, { witchSelfSave: 'firstNight' });
    dawn(r); send(r, 'actor0', 'startNight');
    nightAct(r, 0, { targetId: id(r, 6) });
    stepTo(r, 'witch');
    assert.ok(publicView(r, 'actor3', time).me.action.options.includes('save'));
    nightAct(r, 3, { ability: 'save' });
    dawn(r);
    assert.equal(r.seats[6].alive, true);
    assert.equal(r.seats[3].state.antidoteUsed, true);
});

test('legacy boolean Witch self-save settings keep never and any-night behavior', () => {
    for (const witchSelfSave of [false, true]) for (const night of [1, 2]) {
        const r = setup(undefined, { witchSelfSave });
        if (night === 2) { dawn(r); send(r, 'actor0', 'startNight'); }
        nightAct(r, 0, { targetId: id(r, 3) });
        stepTo(r, 'witch');
        assert.equal(publicView(r, 'actor3', time).me.action.options.includes('save'), witchSelfSave);
        if (witchSelfSave) {
            nightAct(r, 3, { ability: 'save' }); dawn(r);
            assert.equal(r.seats[3].alive, true);
            assert.equal(r.seats[3].state.antidoteUsed, true);
        }
        else {
            assert.throws(() => nightAct(r, 3, { ability: 'save' }), { code: 'INVALID_ACTION' });
            assert.equal(r.seats[3].state.antidoteUsed, undefined);
        }
    }
});

test('Mechanical Wolf copying Witch obeys the same first-night-only self-save rule', () => {
    const roles = ['werewolf', 'mechanicalWolf', 'seer', 'witch', 'guard', 'hunter', 'villager', 'villager', 'villager'];
    for (const night of [1, 2]) {
        const r = setup(roles, { witchSelfSave: 'firstNight' });
        nightAct(r, 1, { targetId: id(r, 3) }); stepTo(r, 'wolves');
        if (night === 2) { dawn(r); send(r, 'actor0', 'startNight'); }
        nightAct(r, 0, { targetId: id(r, 1) });
        stepTo(r, 'witch');
        assert.equal(publicView(r, 'actor1', time).me.action.options.includes('save'), night === 1);
        if (night === 1) {
            nightAct(r, 1, { ability: 'save' }); dawn(r);
            assert.equal(r.seats[1].alive, true);
            assert.equal(r.seats[1].state.antidoteUsed, true);
        }
        else {
            assert.throws(() => nightAct(r, 1, { ability: 'save' }), { code: 'INVALID_ACTION' });
            assert.equal(r.seats[1].state.antidoteUsed, undefined);
        }
    }
});

test('Witch self-save accepts exactly its three modes and remains locked during a game', () => {
    const room = createRoom({ code: 'RULES', hostId: 'host', hostName: 'Host', now: ++time });
    for (const witchSelfSave of [false, true, 'firstNight']) {
        send(room, 'host', 'updateSettings', { settings: { witchSelfSave } });
        assert.equal(room.settings.witchSelfSave, witchSelfSave);
    }
    for (const value of ['firstnight', 'always', 'true', 'false', '', 1, 0, null, {}, []]) {
        const before = JSON.stringify(room);
        assert.throws(() => send(room, 'host', 'updateSettings', { settings: { witchSelfSave: value } }), { code: 'INVALID_SETTINGS' });
        assert.equal(JSON.stringify(room), before);
    }
    const playing = setup();
    const before = JSON.stringify(playing);
    assert.throws(() => send(playing, 'actor0', 'updateSettings', { settings: { witchSelfSave: 'firstNight' } }), { code: 'WRONG_PHASE' });
    assert.equal(JSON.stringify(playing), before);
});

function keepConnected(r, at = time) { for (const member of Object.values(r.members)) member.lastSeen = at; }

test('night stages expose only narration cues and block actions until opening completes', () => {
    const r = setup();
    const opening = publicView(r, 'actor0', time);
    assert.equal(opening.phase.nightStage, 'opening');
    assert.deepEqual(opening.phase.nightCues, ['night', 'wolves']);
    assert.equal(opening.phase.deadline, null);
    assert.equal(opening.me.action, null);
    assert.throws(() => send(r, 'actor0', 'nightAction', { targetId: id(r, 6) }), { code: 'NO_ABILITY' });
    assert.throws(() => send(r, 'actor1', 'nightNarrationDone'), { code: 'HOST_ONLY' });
    const openingId = r.phase.id;
    send(r, 'actor0', 'nightNarrationDone');
    assert.notEqual(r.phase.id, openingId);
    assert.equal(r.phase.nightStage, 'acting');
    assert.deepEqual(r.phase.nightCues, []);
    assert.ok(publicView(r, 'actor0', time).me.action);
    assert.throws(() => send(r, 'actor0', 'nightNarrationDone', { expectedPhaseId: openingId }), { code: 'STALE_PHASE' });
});

test('wolves require every explicit submission, then closing advances only after narration', () => {
    const r = setup(); stepTo(r, 'wolves'); const actingId = r.phase.id;
    nightAct(r, 0, { ability: 'skip' });
    assert.equal(r.phase.id, actingId);
    assert.equal(r.phase.nightStage, 'acting');
    assert.equal(publicView(r, 'actor0', time).me.action.alreadySubmitted, true);
    assert.throws(() => nightAct(r, 0, { targetId: id(r, 6) }), { code: 'ACTION_ALREADY_SUBMITTED' });
    nightAct(r, 1, { ability: 'skip' });
    assert.equal(r.phase.nightStage, 'closing');
    assert.notEqual(r.phase.id, actingId);
    assert.deepEqual(r.phase.nightCues, ['role-sleep']);
    assert.equal(publicView(r, 'actor0', time).me.action, null);
    assert.throws(() => send(r, 'actor0', 'nextPhase'), { code: 'NIGHT_FLOW_CONTROLLED' });
    send(r, 'actor0', 'nightNarrationDone');
    assert.equal(r.phase.step, 'guard');
    assert.equal(r.phase.nightStage, 'opening');
    assert.deepEqual(r.phase.nightCues, ['guard']);
});

test('living night actions never expire; hard skip retains submitted choices', () => {
 for(const paused of [false,true]) {
 const r=setup(); stepTo(r,'wolves'); const phase=r.phase.id;
 nightAct(r,0,{targetId:id(r,6)});
 for(const m of Object.values(r.members)) m.lastSeen=0;
 time+=999999; assert.equal(tickRoom(r,time),false);
 assert.equal(r.phase.id,phase); assert.equal(r.nightFlow.deadline,null);
 if(paused) send(r,r.hostId,'pause');
 send(r,r.hostId,'hardSkip'); assert.equal(r.phase.nightStage,'closing');
 assert.equal(r.phase.paused,false); assert.equal(r.actions.wolves[id(r,0)].targetId,id(r,6));
 assert.throws(()=>send(r,'actor1','nightAction',{ability:'skip',expectedPhaseId:phase}),{code:'STALE_PHASE'});
 dawn(r); assert.equal(r.seats[6].alive,false);
 }
});

test('dead role turns retain open and close announcements with one hidden 7–15 second wait', () => {
    const r = setup(); r.seats[2].alive = false;
    stepTo(r, 'seer');
    const entered = time, deadline = r.nightFlow.deadline, actingId = r.phase.id;
    assert.ok(deadline - entered >= 7000 && deadline - entered <= 15000);
    assert.deepEqual(r.nightFlow.eligibleSeatIds, []);
    const serialized = JSON.stringify(publicView(r, 'actor0', time));
    for (const hidden of ['nightFlow', 'eligibleSeatIds', 'remainingMs', String(deadline)]) assert.ok(!serialized.includes(hidden), hidden);
    assert.equal(publicView(r, 'actor0', time).phase.deadline, null);
    const persisted = JSON.parse(JSON.stringify(r));
    for (const offset of [100, 2000, 6999]) {
        keepConnected(persisted, entered + offset);
        assert.equal(tickRoom(persisted, entered + offset), false);
        assert.equal(persisted.nightFlow.deadline, deadline);
        assert.equal(persisted.phase.id, actingId);
    }
    keepConnected(r, deadline);
    assert.equal(tickRoom(r, deadline), true);
    assert.equal(r.phase.nightStage, 'closing');
    assert.deepEqual(r.phase.nightCues, ['role-sleep']);
});

test('inactive and suppressed roles receive the same hidden wait instead of actor prompts', () => {
    const disabled = setup(custom('demonHunter')); stepTo(disabled, 'demonHunter');
    assert.equal(publicView(disabled, 'actor2', time).me.action, null);
    assert.ok(disabled.nightFlow.deadline - time >= 7000 && disabled.nightFlow.deadline - time <= 15000);
    const suppressed = setup(); suppressed.silencedNight = 1; stepTo(suppressed, 'seer');
    assert.equal(publicView(suppressed, 'actor2', time).me.action, null);
    assert.deepEqual(suppressed.nightFlow.eligibleSeatIds, []);
    const exhausted = setup(); exhausted.seats[3].state.antidoteUsed = true; exhausted.seats[3].state.poisonUsed = true; stepTo(exhausted, 'witch');
    assert.equal(publicView(exhausted, 'actor3', time).me.action, null);
    assert.ok(exhausted.nightFlow.deadline - time >= 7000 && exhausted.nightFlow.deadline - time <= 15000);
});

test('narration fallback progresses both edges independently of daytime autoAdvance', () => {
    const r = setup(undefined, { autoAdvance: false });
    const firstDeadline = r.nightFlow.deadline;
    assert.equal(firstDeadline - time, 45000);
    keepConnected(r, firstDeadline - 1);
    assert.equal(tickRoom(r, firstDeadline - 1), false);
    keepConnected(r, firstDeadline);
    assert.equal(tickRoom(r, firstDeadline), true);
    time = firstDeadline;
    assert.equal(r.phase.nightStage, 'acting');
    nightAct(r, 0, { ability: 'skip' }); nightAct(r, 1, { ability: 'skip' });
    const closeDeadline = r.nightFlow.deadline;
    assert.equal(closeDeadline - time, 12000);
    keepConnected(r, closeDeadline);
    assert.equal(tickRoom(r, closeDeadline), true);
    assert.equal(r.phase.nightStage, 'opening');
    assert.equal(r.phase.step, 'guard');
    assert.equal(r.nightFlow.deadline - closeDeadline, 30000);
});

test('manual pause freezes private night clocks while disconnects leave their deadlines intact', () => {
    const r = setup(); r.seats[2].alive = false; stepTo(r, 'seer');
    const deadline = r.nightFlow.deadline, originalId = r.phase.id;
    time += 2000;
    send(r, 'actor0', 'pause');
    const remaining = r.nightFlow.remainingMs;
    assert.equal(remaining, deadline - time);
    assert.equal(r.phase.deadline, null);
    assert.equal(r.nightFlow.deadline, null);
    assert.notEqual(r.phase.id, originalId);
    assert.ok(!JSON.stringify(publicView(r, 'actor0', time).phase).includes('remainingMs'));
    time += 90000; keepConnected(r);
    assert.equal(tickRoom(r, time), false);
    send(r, 'actor0', 'resume');
    assert.equal(r.nightFlow.deadline, time + remaining);
    assert.notEqual(r.phase.id, originalId);
    r.members.actor4.lastSeen = 0;
    assert.equal(tickRoom(r, time + 1), false);
    assert.equal(r.phase.paused, false);
    assert.equal(r.nightFlow.deadline, time + remaining);
    assert.equal(tickRoom(r, time + remaining), true);
    assert.equal(r.phase.nightStage, 'closing');
});

test('host recovery and player replacement preserve the waiting role and submitted decisions', () => {
    const r = setup(); stepTo(r, 'wolves'); nightAct(r, 0, { targetId: id(r, 6) });
    send(r, 'actor0', 'pause');
    const originalHostSeat = id(r, 0);
    recoverHost(r, 'recovered-host', ++time);
    assert.equal(publicView(r, 'recovered-host', time).me.seatId, originalHostSeat);
    assert.equal(r.actions.wolves[originalHostSeat].targetId, id(r, 6));
    send(r, 'replacement-wolf', 'requestJoin', { name: 'Returning wolf' });
    send(r, 'recovered-host', 'approveJoin', { requestId: r.requests[0].id, replaceSeatId: id(r, 1) });
    send(r, 'recovered-host', 'resume');
    assert.equal(publicView(r, 'recovered-host', time).me.action.alreadySubmitted, true);
    send(r, 'replacement-wolf', 'nightAction', { ability: 'skip' });
    assert.equal(r.phase.nightStage, 'closing');
    assert.equal(publicView(r, 'actor1', time).me, null);
});

test('first-night setup roles take separate turns and choices resolve together before wolves', () => {
    const r = setup(['werewolf', 'mechanicalWolf', 'cupid', 'wildChild', 'wolfHound', 'thief', 'seer', 'villager', 'villager']);
    const expected = ['cupid', 'wildChild', 'wolfHound', 'thief', 'mechanicalWolf'];
    assert.deepEqual(r.nightSchedule.filter(turn => turn.step === 'opening').map(turn => turn.role), expected);
    for (const role of expected) {
        stepTo(r, 'opening', role);
        const eligible = r.seats.filter(seat => publicView(r, seat.actorId, time).me.action);
        assert.equal(eligible.length, 1);
        assert.equal(eligible[0].roleId, role);
        const action = publicView(r, eligible[0].actorId, time).me.action;
        send(r, eligible[0].actorId, 'nightAction', action.input === 'choice' ? { choice: role === 'thief' ? 'guard' : 'wolf' } : { ability: 'skip' });
        if (role !== 'mechanicalWolf') assert.equal(r.seats[5].roleId, 'thief');
    }
    send(r, 'actor0', 'nightNarrationDone');
    assert.equal(r.phase.step, 'wolves');
    assert.equal(r.seats[5].roleId, 'guard');
    assert.equal(r.seats[4].team, 'wolf');
});

test('hard skip is host-only, phase-scoped, and works at every night stage without revealing actors', () => {
 for(const stage of ['opening','acting','closing']) for(const paused of [false,true]) {
 const r=setup(); if(stage!=='opening') stepTo(r,'wolves');
 if(stage==='closing') { nightAct(r,0,{ability:'skip'}); nightAct(r,1,{ability:'skip'}); }
 if(paused) send(r,r.hostId,'pause');
 const phase=r.phase.id, before=JSON.stringify(r);
 assert.throws(()=>send(r,'actor1','hardSkip'),{code:'HOST_ONLY'});
 assert.equal(JSON.stringify(r),before);
 assert.throws(()=>send(r,r.hostId,'hardSkip',{expectedPhaseId:'old'}),{code:'STALE_PHASE'});
 assert.equal(JSON.stringify(r),before);
 send(r,r.hostId,'hardSkip'); assert.equal(r.phase.paused,false);
 assert.notEqual(r.phase.id,phase);
 assert.equal(r.phase.nightStage,stage==='closing'?'opening':'closing');
 assert.equal(r.events.at(-1).text.en,'The host skipped the current step. Submitted choices were retained.');
 const view=publicView(r,r.hostId,time);
 for(const key of ['nightFlow','eligibleSeatIds','pendingShots']) assert.ok(!Object.hasOwn(view,key));
 assert.ok(view.seats.every(seat=>!Object.hasOwn(seat,'roleId')));
 assert.throws(()=>send(r,r.hostId,'hardSkip',{expectedPhaseId:phase}),{code:'STALE_PHASE'});
 }
});

test('legacy active nights retain their current actions and upgrade on the following night', () => {
    const r = setup();
    r.nightSchedule = ['wolves', 'guard', 'seer', 'witch']; r.nightIndex = 0; delete r.nightFlow;
    r.phase = { id: 'legacy-phase', kind: 'night', step: 'wolves', number: 1, deadline: time + 45000, paused: false };
    send(r, 'actor0', 'nightAction', { ability: 'skip' });
    assert.equal(r.phase.nightStage, undefined);
    while (r.phase.kind === 'night') send(r, 'actor0', 'nextPhase');
    assert.equal(r.phase.kind, 'day');
    send(r, 'actor0', 'startNight');
    assert.equal(r.phase.nightStage, 'opening');
    assert.deepEqual(r.phase.nightCues, ['night', 'wolves']);
});


test('legacy timed actions migrate to indefinite waits including manually paused rooms', () => {
 for(const paused of [false,true]) {
 const r=setup(); stepTo(r,'wolves'); nightAct(r,0,{targetId:id(r,6)});
 r.nightFlow.deadline=time+10000;
 if(paused) send(r,r.hostId,'pause');
 const phase=r.phase.id; time+=999999; assert.equal(tickRoom(r,time),true);
 assert.equal(r.nightFlow.deadline,null); assert.equal(r.nightFlow.remainingMs??null,null);
 assert.equal(r.phase.paused,paused); assert.equal(r.phase.id,phase);
 const persisted=JSON.parse(JSON.stringify(r)); assert.equal(tickRoom(persisted,time+999999),false);
 if(paused) send(persisted,persisted.hostId,'resume');
 send(persisted,'actor1','nightAction',{ability:'skip'}); assert.equal(persisted.phase.nightStage,'closing');
 assert.equal(persisted.actions.wolves[id(r,0)].targetId,id(r,6));
 }
});

test('old disconnect pauses resume automatically while explicit manual pauses stay frozen', () => {
    for (const formerlyUnlimited of [false, true]) {
        const r = setup(undefined, { nightSeconds: 10 }); stepTo(r, 'wolves');
        if (formerlyUnlimited) r.nightFlow.deadline = null;
        send(r, 'actor0', 'pause'); r.phase.pauseReason = 'disconnected';
        const pausedId = r.phase.id;
        time += 120000;
        assert.equal(tickRoom(r, time), true);
        assert.equal(r.phase.paused, false);
        assert.notEqual(r.phase.id, pausedId);
        assert.equal(r.phase.pauseReason, undefined);
        assert.equal(r.nightFlow.deadline, null);
        send(r, 'actor0', 'pause');
        const snapshot = JSON.stringify(r);
        assert.equal(tickRoom(r, time + 120000), false);
        assert.equal(JSON.stringify(r), snapshot);
    }
    const r = setup(); send(r, 'actor0', 'pause'); r.phase.pauseReason = 'disconnected';
    send(r, 'actor0', 'pause');
    assert.equal(r.phase.pauseReason, undefined);
    assert.equal(tickRoom(r, time + 120000), false);
    assert.equal(r.phase.paused, true);
});

test('upgrading old day and reaction disconnect pauses keeps actions waiting', () => {
    const day = setup(); dawn(day); send(day, 'actor0', 'pause'); day.phase.pauseReason = 'disconnected';
    time += 120000;
    assert.equal(tickRoom(day, time), true);
    assert.equal(day.phase.paused, false);
    assert.equal(tickRoom(day, day.phase.deadline + 1), false);
    assert.equal(day.phase.kind, 'day');
    const r = setup(undefined, { voteSeconds: 10 }); nightAct(r, 0, { targetId: id(r, 5) }); dawn(r);
    send(r, 'actor0', 'pause'); r.phase.pauseReason = 'disconnected'; r.phase.remainingMs = null;
    time += 120000;
    assert.equal(tickRoom(r, time), true);
    assert.equal(r.phase.deadline, null);
    assert.equal(tickRoom(r, time + 10000), false);
    assert.equal(r.phase.kind, 'reaction');
});

test('host hard skips can reach dawn with all other players absent', () => {
    const r = setup(['werewolf', 'mechanicalWolf', 'cupid', 'wildChild', 'wolfHound', 'thief', 'seer', 'villager', 'villager'], { nightSeconds: 10 });
    for (const member of Object.values(r.members)) member.lastSeen = 0;
    let stages = 0;
    while (r.phase.kind === 'night') {
        assert.ok(++stages <= 60);
        send(r,r.hostId,'hardSkip');
        assert.equal(r.phase.paused, false);
    }
    assert.equal(r.phase.kind, 'day');
    assert.equal(r.seats[5].roleId, 'guard');
    assert.equal(r.seats[4].team, 'village');
    assert.ok(r.seats.every(s => s.alive));
});

test('replacement can submit long after the former deadline without expiry', () => {
    const r = setup(undefined, { nightSeconds: 10 }); stepTo(r, 'wolves');
    const deadline = r.nightFlow.deadline;
    nightAct(r, 0, { ability: 'skip' });
    send(r, 'returning', 'requestJoin', { name: 'Returning' });
    send(r, 'actor0', 'approveJoin', { requestId: r.requests.at(-1).id, replaceSeatId: id(r, 1) });
    send(r, 'actor0', 'updateSettings', { settings: { nightSeconds: 20 } });
    assert.equal(r.nightFlow.deadline, deadline);
    time += 999999;
    send(r, 'returning', 'nightAction', { targetId: id(r, 6) });
    assert.equal(r.phase.nightStage, 'closing');
    assert.throws(() => send(r, 'actor1', 'nightAction', { ability: 'skip' }), { code: 'NOT_SEATED' });
    stepTo(r, 'guard');
    assert.equal(r.nightFlow.deadline, null);
});
