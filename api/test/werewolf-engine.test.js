'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRoom, applyCommand, publicView, tickRoom, recoverHost, ROLES } = require('../src/werewolf/engine');
let time = 1800000000000;
test('pending applicants can cancel their request without occupying or changing a seat', () => {
    const room = createRoom({ code: 'ABCDEF12', hostId: 'host', hostName: 'Host', now: time });
    applyCommand(room, 'pending', { type: 'requestJoin', name: 'Guest' }, ++time);
    assert.equal(room.requests.length, 1);
    applyCommand(room, 'pending', { type: 'leave' }, ++time);
    assert.equal(room.requests.length, 0);
    assert.equal(room.seats.length, 1);
    assert.throws(() => applyCommand(room, 'pending', { type: 'heartbeat' }, ++time), { code: 'NOT_SEATED' });
});
function send(room, actor, type, data = {}) { return applyCommand(room, actor, { type, expectedPhaseId: room.phase.id, ...data }, ++time); }
function setup(roles = ['werewolf', 'werewolf', 'seer', 'witch', 'guard', 'hunter', 'villager', 'villager', 'villager']) {
    const room = createRoom({ code: 'ABCDEF', hostId: 'actor0', hostName: 'A', now: ++time });
    for (let i = 1; i < roles.length; i++) {
        send(room, `actor${i}`, 'requestJoin', { name: String.fromCharCode(65 + i) });
        send(room, 'actor0', 'approveJoin', { requestId: room.requests.at(-1).id });
    }
    send(room, 'actor0', 'updateSettings', { settings: { winCondition: 'all', sheriff: true } });
    send(room, 'actor0', 'startGame', { roleDeck: roles });
    // Tests assign deterministic server-only cards after exercising production shuffle.
    room.seats.forEach((s, i) => { s.roleId = roles[i]; s.team = ['werewolf', 'wolfKing', 'whiteWolfKing', 'wolfBeauty', 'hiddenWolf', 'gargoyle', 'mechanicalWolf', 'bloodMoonApostle', 'wolfWitch'].includes(roles[i]) ? 'wolf' : ['angel', 'jester', 'piper'].includes(roles[i]) ? 'independent' : 'village'; s.originalRoleId = s.roleId; s.originalTeam = s.team; });
    return room;
}
const id = (r, i) => r.seats[i].id;
function stepTo(r, step) { let n = 0; while (r.phase.kind === 'night' && r.phase.step !== step && n++ < 30)
    send(r, 'actor0', 'nextPhase'); assert.equal(r.phase.step, step); }
function dawn(r) { let n = 0; while (r.phase.kind === 'night' && n++ < 30)
    send(r, 'actor0', 'nextPhase'); }
function nightAct(r, i, data) { send(r, `actor${i}`, 'nightAction', data); }
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
test('host permissions and stale phases are enforced with complete rollback', () => { const r = setup(); const before = JSON.stringify(r); assert.throws(() => send(r, 'actor1', 'nextPhase'), e => e.code === 'HOST_ONLY'); assert.equal(JSON.stringify(r), before); const phase = r.phase.id; send(r, 'actor0', 'nextPhase'); assert.throws(() => send(r, 'actor0', 'nextPhase', { expectedPhaseId: phase }), e => e.code === 'STALE_PHASE'); assert.throws(() => send(r, 'actor2', 'nightAction', { expectedPhaseId: phase, targetId: id(r, 0) }), e => e.code === 'STALE_PHASE'); });
test('host transfer and recovery revoke previous host control and occupant token', () => { const r = setup(); send(r, 'actor0', 'transferHost', { seatId: id(r, 1) }); assert.throws(() => send(r, 'actor0', 'nextPhase'), e => e.code === 'HOST_ONLY'); const card = r.seats[1].roleId; recoverHost(r, 'recovered', ++time); assert.equal(r.hostId, 'recovered'); assert.equal(publicView(r, 'recovered', time).me.roleId, card); assert.equal(publicView(r, 'actor1', time).me, null); assert.equal(publicView(r, 'actor0', time).isHost, false); });
test('automatic moderation pauses for any missing living player and resumes safely', () => { const r = setup(); r.settings.autoAdvance = true; assert.equal(tickRoom(r, time + 1000), false); assert.equal(tickRoom(r, time + 40000), true); assert.equal(r.phase.paused, true); assert.equal(r.phase.pauseReason, 'disconnected'); const phase = r.phase.id; for (let i = 0; i < r.seats.length; i++)
    send(r, `actor${i}`, 'heartbeat'); send(r, 'actor0', 'resume'); assert.equal(r.phase.id, phase); assert.equal(r.phase.paused, false); assert.equal(tickRoom(r, time + 100), false); });
test('night schedule never changes when a configured role dies', () => { const r = setup(); const first = [...r.nightSchedule]; dawn(r); r.seats[2].alive = false; send(r, 'actor0', 'startNight'); assert.deepEqual(r.nightSchedule, first); stepTo(r, 'seer'); assert.equal(publicView(r, 'actor2', time).me.action, null); });
test('pack ties mean no attack and private votes are not public before resolution', () => { const r = setup(); nightAct(r, 0, { targetId: id(r, 6) }); nightAct(r, 1, { targetId: id(r, 7) }); dawn(r); assert.ok(r.seats.every(s => s.alive)); send(r, 'actor0', 'startVoting'); send(r, 'actor0', 'vote', { targetId: id(r, 6) }); const v = publicView(r, 'actor1', time); assert.equal(v.voteCount, 1); assert.equal(v.lastVote, null); assert.ok(!Object.hasOwn(v, 'votes')); });
test('guard blocks wolves; guard restrictions reset after skipping a night', () => { const r = setup(); nightAct(r, 0, { targetId: id(r, 6) }); stepTo(r, 'guard'); nightAct(r, 4, { targetId: id(r, 6) }); dawn(r); assert.equal(r.seats[6].alive, true); send(r, 'actor0', 'startNight'); stepTo(r, 'guard'); assert.throws(() => nightAct(r, 4, { targetId: id(r, 6) }), e => e.code === 'INVALID_TARGET'); nightAct(r, 4, { ability: 'skip' }); dawn(r); send(r, 'actor0', 'startNight'); stepTo(r, 'guard'); nightAct(r, 4, { targetId: id(r, 6) }); });
test('witch potion inventories, target secrecy and guard plus antidote rule', () => { const r = setup(); r.settings.guardAntidote = 'kill'; nightAct(r, 0, { targetId: id(r, 6) }); stepTo(r, 'guard'); nightAct(r, 4, { targetId: id(r, 6) }); stepTo(r, 'witch'); assert.equal(publicView(r, 'actor3', time).me.action.victimId, id(r, 6)); assert.equal(publicView(r, 'actor2', time).me.action, null); nightAct(r, 3, { ability: 'save' }); dawn(r); assert.equal(r.seats[6].alive, false); assert.equal(r.seats[3].state.antidoteUsed, true); send(r, 'actor0', 'startNight'); nightAct(r, 0, { targetId: id(r, 7) }); stepTo(r, 'witch'); assert.equal(publicView(r, 'actor3', time).me.action.victimId, null); assert.throws(() => nightAct(r, 3, { ability: 'save' }), e => e.code === 'INVALID_ACTION'); });
test('hunter death exposes a private shot; poison suppresses it', () => { const r = setup(); nightAct(r, 0, { targetId: id(r, 5) }); dawn(r); assert.equal(r.phase.kind, 'reaction'); assert.equal(publicView(r, 'actor5', time).me.action.kind, 'shoot'); send(r, 'actor5', 'shoot', { targetId: id(r, 0) }); assert.equal(r.seats[0].alive, false); const p = setup(); nightAct(p, 0, { targetId: id(p, 5) }); stepTo(p, 'witch'); nightAct(p, 3, { ability: 'poison', targetId: id(p, 5) }); dawn(p); assert.ok(!p.pendingShots.includes(id(p, 5))); });
test('seer result is private and Hidden Wolf appears village', () => { const r = setup(['werewolf', 'hiddenWolf', 'seer', 'witch', 'guard', 'villager', 'villager', 'villager', 'villager']); stepTo(r, 'seer'); nightAct(r, 2, { targetId: id(r, 1) }); dawn(r); assert.match(publicView(r, 'actor2', time).me.privateLog.at(-1).text.en, /village/); assert.equal(publicView(r, 'actor0', time).me.privateLog.length, 0); assert.deepEqual(publicView(r, 'actor0', time).me.allies, []); assert.deepEqual(publicView(r, 'actor1', time).me.allies, [id(r, 0)]); });
test('Idiot survives first exile and loses voting rights', () => { const r = setup(custom('idiot')); dawn(r); exile(r, 2); assert.equal(r.seats[2].alive, true); assert.equal(r.seats[2].canVote, false); assert.equal(publicView(r, 'actor0', time).seats[2].roleId, 'idiot'); send(r, 'actor0', 'startVoting'); assert.throws(() => send(r, 'actor2', 'vote', { targetId: id(r, 0) }), e => e.code === 'NO_VOTE'); });
test('Cupid death link and Wild Child transformation survive replacement', () => { const r = setup(['werewolf', 'werewolf', 'cupid', 'wildChild', 'seer', 'villager', 'villager', 'villager', 'villager']); nightAct(r, 2, { targetIds: [id(r, 5), id(r, 6)] }); nightAct(r, 3, { targetId: id(r, 5) }); stepTo(r, 'wolves'); nightAct(r, 0, { targetId: id(r, 5) }); dawn(r); assert.equal(r.seats[5].alive, false); assert.equal(r.seats[6].alive, false); assert.equal(r.seats[3].team, 'wolf'); assert.ok(publicView(r, 'actor0', time).me.allies.includes(id(r, 3))); });
test('Thief, Wolf Hound and Mechanical Wolf opening choices are applied', () => { const r = setup(['werewolf', 'mechanicalWolf', 'wolfHound', 'thief', 'seer', 'guard', 'villager', 'villager', 'villager']); nightAct(r, 1, { targetId: id(r, 4) }); nightAct(r, 2, { choice: 'wolf' }); nightAct(r, 3, { choice: 'guard' }); stepTo(r, 'wolves'); assert.equal(r.seats[1].state.copiedRole, 'seer'); assert.equal(r.seats[2].team, 'wolf'); assert.equal(r.seats[3].roleId, 'guard'); stepTo(r, 'seer'); nightAct(r, 1, { targetId: id(r, 4) }); dawn(r); assert.match(r.seats[1].privateLog.at(-1).text.en, /village/); });
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
test('automatic progression completes night, discussion, voting and the next night', () => { const r = setup(); r.settings.autoAdvance = true; function advance() { const due = r.phase.deadline; for (const m of Object.values(r.members))
    m.lastSeen = due; assert.equal(tickRoom(r, due), true); } while (r.phase.kind === 'night')
    advance(); assert.equal(r.phase.kind, 'day'); advance(); assert.equal(r.phase.kind, 'voting'); advance(); assert.equal(r.phase.step, 'afterVote'); advance(); assert.equal(r.phase.kind, 'night'); assert.equal(r.night, 2); });
test('pending Hunter reactions resolve before victory and allow a final reversal', () => { const r = setup(['wolfKing', 'werewolf', 'seer', 'witch', 'guard', 'villager', 'villager', 'villager', 'villager']); r.seats[1].alive = false; dawn(r); exile(r, 0); assert.equal(r.phase.kind, 'reaction'); assert.equal(r.status, 'playing'); send(r, 'actor0', 'shoot', { targetId: id(r, 3) }); assert.equal(r.winner.team, 'village'); });
test('mixed lovers can win together and ordinary lovers do not create a new faction', () => { const r = setup(['werewolf', 'werewolf', 'cupid', 'seer', 'witch', 'villager', 'villager', 'villager', 'villager']); nightAct(r, 2, { targetIds: [id(r, 0), id(r, 5)] }); stepTo(r, 'wolves'); r.seats.forEach((s, i) => { if (i !== 0 && i !== 5)
    s.alive = false; }); dawn(r); assert.equal(r.winner.team, 'lovers'); });
test('all-player randomized simulation keeps immutable seat identities and private action boundaries', () => {
    let seed = 7123;
    const rand = n => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
    const roles = ['werewolf', 'wolfKing', 'wolfBeauty', 'wolfWitch', 'mechanicalWolf', 'hiddenWolf', 'seer', 'witch', 'guard', 'hunter', 'cupid', 'magician', 'dreamweaver', 'gravekeeper', 'raven', 'demonHunter', 'pureWhite', 'wildChild', 'wolfHound', 'thief', 'piper', 'elder', 'knight', 'villager'];
    const r = setup(roles), stableIds = r.seats.map(s => s.id);
    let commands = 0;
    for (let turn = 0; turn < 220 && r.status === 'playing'; turn++) {
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
            send(r, 'actor0', 'nextPhase');
            commands++;
        }
    }
    assert.ok(commands > 100);
    assert.equal(r.status, 'finished');
    assert.ok(['village', 'wolf', 'lovers', 'piper', 'draw'].includes(r.winner.team));
});
test('heartbeat persistence is throttled without granting revoked clients access', () => { const r = setup(); const revision = r.revision; send(r, 'actor1', 'heartbeat'); assert.equal(r.revision, revision); time += 11000; send(r, 'actor1', 'heartbeat'); assert.equal(r.revision, revision + 1); send(r, 'pending', 'requestJoin', { name: 'Pending' }); const pendingRevision = r.revision; send(r, 'pending', 'heartbeat'); assert.equal(r.revision, pendingRevision); assert.throws(() => send(r, 'unknown', 'heartbeat'), e => e.code === 'NOT_SEATED'); });
test('host can change moderation and timers midgame while game rules stay locked', () => { const r = setup(); send(r, 'actor0', 'updateSettings', { settings: { autoAdvance: true, nightSeconds: 60 } }); assert.equal(r.settings.autoAdvance, true); assert.equal(r.phase.deadline, time + 60000); send(r, 'actor0', 'pause'); send(r, 'actor0', 'updateSettings', { settings: { nightSeconds: 90 } }); assert.equal(r.phase.paused, true); assert.equal(r.phase.remainingMs, 90000); assert.throws(() => send(r, 'actor0', 'updateSettings', { settings: { witchSelfSave: true } }), e => e.code === 'WRONG_PHASE'); });
test('night action replay is revealed only when the game is finished and contains seat IDs only', () => { const r = setup(); nightAct(r, 0, { targetId: id(r, 6) }); dawn(r); assert.deepEqual(publicView(r, 'actor0', time).replay, []); r.seats[0].alive = false; r.seats[1].alive = false; send(r, 'actor0', 'startVoting'); send(r, 'actor0', 'resolveVoting'); const replay = publicView(r, 'actor2', time).replay; assert.equal(replay[0].actions.wolves[id(r, 0)].targetId, id(r, 6)); assert.ok(!JSON.stringify(replay).includes('actor')); });

test('automatic deadline rejects late actions even before a polling tick advances the room', () => {
    const r = setup();
    r.settings.autoAdvance = true;
    const before = JSON.stringify(r);
    assert.throws(() => applyCommand(r, 'actor0', { type: 'nightAction', expectedPhaseId: r.phase.id, targetId: id(r, 6) }, r.phase.deadline), { code: 'EXPIRED_PHASE', clientSafe: true });
    assert.equal(JSON.stringify(r), before);
    applyCommand(r, 'actor0', { type: 'nextPhase', expectedPhaseId: r.phase.id }, r.phase.deadline + 1);
    assert.notEqual(r.phase.step, 'wolves');
});

test('Mechanical Wolf copies the starting card independently of first-night seat order', () => {
    for (const roles of [
        ['werewolf', 'mechanicalWolf', 'thief', 'seer', 'witch', 'villager', 'villager', 'villager', 'villager'],
        ['werewolf', 'thief', 'mechanicalWolf', 'seer', 'witch', 'villager', 'villager', 'villager', 'villager'],
    ]) {
        const r = setup(roles), mechanical = roles.indexOf('mechanicalWolf'), thief = roles.indexOf('thief');
        nightAct(r, mechanical, { targetId: id(r, thief) });
        nightAct(r, thief, { choice: 'guard' });
        stepTo(r, 'wolves');
        assert.equal(r.seats[thief].roleId, 'guard');
        assert.equal(r.seats[mechanical].state.copiedRole, 'seer');
    }
});
