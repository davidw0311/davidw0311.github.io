'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRoom, applyCommand, publicView } = require('../src/one-night/engine');
let clock = 100000;
function game(roles, centers = ['werewolf', 'villager', 'tanner']) {
    const room = createRoom({ code: 'MOON', hostId: 'a0', hostName: 'Host', now: clock });
    for (let i = 1; i < roles.length; i++) applyCommand(room, `a${i}`, { type: 'requestJoin', name: `Player ${i + 1}` }, clock);
    room.seats.forEach((seat, i) => { seat.number = i + 1; seat.originalRoleId = roles[i]; seat.nightRoleId = roles[i]; room.cards[seat.id] = { id: `card${i}`, roleId: roles[i] }; room.marks[seat.id] = 'clarity'; });
    centers.forEach((roleId, i) => { room.cards[`center:${i}`] = { id: `center${i}`, roleId }; });
    room.status = 'playing'; room.roleDeck = [...roles, ...centers]; room.schedule = []; room.nightIndex = 0; return room;
}
function at(room, role, actorIndexes) { room.phase = { id: `phase-${++clock}`, kind: 'night', step: role, roleId: role, nightStage: 'acting', cueIds: [], deadline: null }; room.nightActors = actorIndexes.map(i => room.seats[i].id); room.schedule = [{ roleId: role, step: role, order: 1 }]; room.nightIndex = 0; }
function act(room, i, targets = [], extra = {}) { const action = publicView(room, `a${i}`, clock).me.action; assert.ok(action, `action exists for ${room.phase.step} seat ${i}`); applyCommand(room, `a${i}`, { type: 'act', expectedPhaseId: room.phase.id, actionId: action.id, targets: targets.map(t => typeof t === 'number' ? room.seats[t].id : t), ...extra }, ++clock); const review = publicView(room, `a${i}`, clock).me.action; if (review?.review) applyCommand(room, `a${i}`, {type:'act',expectedPhaseId:room.phase.id,actionId:review.id,targets:[]},++clock); }
const sid = (room, i) => room.seats[i].id;
test('Revealer can choose wolves but only its own seat learns their identities',()=>{
 for(const role of ['werewolf','alphaWolf','mysticWolf','dreamWolf','tanner']){
  const r=game(['revealer',role,'villager']);at(r,'revealer',[0]);
  const action=publicView(r,'a0',clock).me.action;
  assert.ok(action.targets.some(t=>t.id===sid(r,1)));assert.ok(action.targets.some(t=>t.id===sid(r,0)));
  act(r,0,[1]);assert.ok(r.seats[0].knowledge.some(k=>k.text.en.includes('Only you')));
  assert.ok(!r.revealed.includes(sid(r,1)));
  for(const actor of ['a1','a2']) {const v=publicView(r,actor,clock);assert.equal(v.seats[1].revealedRoleId,undefined);assert.equal(v.result,null);assert.ok(!JSON.stringify(v.me.knowledge).includes('Only you'));}
 }
});
test('Revealer targets do not reveal alignments; only Sentinel shields remove a target',()=>{
 const r=game(['revealer','werewolf','seer']);at(r,'revealer',[0]);r.shields=[sid(r,2)];
 const before=publicView(r,'a0',clock).me.action.targets;r.cards[sid(r,1)].roleId='villager';assert.deepEqual(publicView(r,'a0',clock).me.action.targets,before);
 assert.ok(!before.some(t=>t.id===sid(r,2)));assert.throws(()=>act(r,0,[2]));
 act(r,0,[1]);assert.equal(publicView(r,'a2',clock).seats[1].revealedRoleId,'villager');assert.equal(r.nightRecap[0].changes.find(c=>c.id===sid(r,1)).after.revealed,true);
});
test('Alpha cannot create an extra wolf when all wolf cards are dealt to players',()=>{
 const r=game(['alphaWolf','werewolf','villager'],['seer','robber','drunk']);at(r,'alphaWolf',[0]);
 const before=structuredClone(r.cards);const a=publicView(r,'a0',clock).me.action;assert.deepEqual(a.targets,[]);assert.equal(a.min,0);
 assert.throws(()=>act(r,0,[2]));act(r,0);assert.deepEqual(r.cards,before);assert.equal(Object.keys(r.cards).length,6);assert.equal(r.cards['center:3'],undefined);
 assert.ok(r.nightRecap[0].clues.some(c=>c.en.includes('No conversion')));
});
test('Alpha swaps one existing center wolf without changing the card count or creating another wolf',()=>{
 const r=game(['alphaWolf','villager','seer'],['werewolf','robber','drunk']);at(r,'alphaWolf',[0]);const cardIds=Object.values(r.cards).map(c=>c.id).sort();act(r,0,[1]);
 assert.equal(r.cards[sid(r,1)].roleId,'werewolf');assert.equal(r.cards['center:0'].roleId,'villager');assert.deepEqual(Object.values(r.cards).map(c=>c.id).sort(),cardIds);assert.equal(publicView(r,'a0',clock).centerCount,3);
 r.actions={};at(r,'alphaWolf',[0]);assert.deepEqual(publicView(r,'a0',clock).me.action.targets,[]);
});
