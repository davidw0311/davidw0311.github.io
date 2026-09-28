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
    room.initialCards=Object.fromEntries(Object.entries(room.cards).map(([id,c])=>[id,c.roleId])); room.status = 'playing'; room.roleDeck = [...roles, ...centers]; room.schedule = []; room.nightIndex = 0; return room;
}
function at(room, role, actorIndexes) { room.phase = { id: `phase-${++clock}`, kind: 'night', step: role, roleId: role, nightStage: 'acting', cueIds: [], deadline: null }; room.nightActors = actorIndexes.map(i => room.seats[i].id); room.schedule = [{ roleId: role, step: role, order: 1 }]; room.nightIndex = 0; }
function act(room, i, targets = [], extra = {}) { const action = publicView(room, `a${i}`, clock).me.action; assert.ok(action, `action exists for ${room.phase.step} seat ${i}`); applyCommand(room, `a${i}`, { type: 'act', expectedPhaseId: room.phase.id, actionId: action.id, targets: targets.map(t => typeof t === 'number' ? room.seats[t].id : t), ...extra }, ++clock); const review = publicView(room, `a${i}`, clock).me.action; if (review?.review) applyCommand(room, `a${i}`, {type:'act',expectedPhaseId:room.phase.id,actionId:review.id,targets:[]},++clock); }
function vote(room, choices) { room.phase = { id: `vote-${++clock}`, kind: 'voting', step: 'voting', cueIds: [] }; choices.forEach((target, i) => applyCommand(room, `a${i}`, { type: 'vote', targetId: room.seats[target].id, expectedPhaseId: room.phase.id }, ++clock)); applyCommand(room, 'a0', { type: 'finishVote', expectedPhaseId: room.phase.id }, ++clock); return room.result; }
const sid = (room, i) => room.seats[i].id;
test('initial deal includes every center card and stays private until finished',()=>{
 const r=createRoom({code:'MOON',hostId:'a0',hostName:'Host',now:clock});
 for(let i=1;i<3;i++)applyCommand(r,`a${i}`,{type:'requestJoin',name:`P${i}`},clock);
 applyCommand(r,'a0',{type:'configure',roleDeck:['alphaWolf','werewolf','seer','robber','troublemaker','villager']},clock);
 applyCommand(r,'a0',{type:'start'},clock);
 assert.equal(Object.keys(r.initialCards).length,6);assert.equal(r.initialCards['center:3'],undefined);
 const initial=structuredClone(r.initialCards);
 for(const actor of ['a0','a1']){const v=publicView(r,actor,clock);assert.equal(v.result,null);assert.equal(v.initialCards,undefined);assert.equal(v.nightRecap,undefined);assert.ok(v.centerCards.every(c=>!c.roleId));}
 const result=vote(r,[1,0,0]);assert.deepEqual(result.initialCards,initial);
 applyCommand(r,'a0',{type:'rematch'},clock);assert.equal(r.initialCards,null);assert.deepEqual(r.nightRecap,[]);assert.equal(r.result,null);
});
test('ordered recap preserves center swaps, original deal and final cards without duplicate review entries',()=>{
 const r=game(['robber','troublemaker','werewolf']);const initial=structuredClone(r.initialCards);
 at(r,'robber',[0]);act(r,0,['center:0']);
 assert.equal(r.nightRecap.length,1);assert.deepEqual(r.nightRecap[0].operations.map(o=>o.type),['move','view']);
 assert.deepEqual(r.nightRecap[0].operations[0].targets,[sid(r,0),'center:0']);
 assert.equal(r.nightRecap[0].changes.find(c=>c.id==='center:0').after.roleId,'robber');
 at(r,'troublemaker',[1]);act(r,1,[0,'center:1']);
 assert.equal(r.nightRecap.length,2);assert.deepEqual(r.initialCards,initial);
 assert.equal(publicView(r,'a0',clock).result,null);
 const restored=JSON.parse(JSON.stringify(r));const result=vote(restored,[1,0,0]);
 assert.equal(result.recap.length,2);assert.equal(result.players[0].roleId,'villager');assert.equal(result.players[0].originalRoleId,'robber');
 assert.equal(result.initialCards['center:1'],'villager');assert.equal(result.center.find(c=>c.id==='center:1').roleId,'werewolf');
});
test('recap captures mark changes, rotation direction and deliberate and host skips',()=>{
 const r=game(['gremlin','villageIdiot','robber','villager']);r.marks[sid(r,0)]='love';
 at(r,'gremlin',[0]);act(r,0,[],{choice:'marks'});assert.equal(r.nightRecap?.length||0,0);
 act(r,0,[0,1]);assert.equal(r.nightRecap[0].changes.find(c=>c.id===sid(r,1)).after.mark,'love');
 at(r,'villageIdiot',[1]);act(r,1,[],{choice:'clockwise'});assert.equal(r.nightRecap[1].operations[0].direction,'clockwise');
 at(r,'robber',[2]);act(r,2,[],{skip:true});assert.equal(r.nightRecap[2].skipped,true);
 r.actions={};at(r,'robber',[2]);applyCommand(r,'a0',{type:'hardSkip',expectedPhaseId:r.phase.id},clock);assert.equal(r.nightRecap[3].hostSkipped,true);
});
