'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {createRoom, applyCommand, publicView, tickRoom} = require('../src/werewolf/engine');
let now = 1900000000000;
const send = (r, actor, type, data={}) => applyCommand(r, actor, {type, expectedPhaseId:r.phase.id, ...data}, ++now);
const host = (r,type,data) => send(r,r.hostId,type,data);
const id = (r,n) => r.seats[n].id;
function setup(role='werewolf', sheriff=false) {
 const r=createRoom({code:'MOON',hostId:'p0',hostName:'Wolf',now:++now});
 for(let i=1;i<8;i++) send(r,`p${i}`,'requestJoin',{name:`Player ${i+1}`});
 host(r,'updateSettings',{settings:{sheriff,winCondition:'all'}});
 const roles=[role,'werewolf','seer','witch','hunter','guard','villager','villager'];
 host(r,'startGame',{roleDeck:roles});
 for(const seat of r.seats) send(r,seat.actorId,'ready');
 host(r,'startNight');
 r.seats.forEach((s,i)=>Object.assign(s,{roleId:roles[i],originalRoleId:roles[i],team:i<2?'wolf':'village',originalTeam:i<2?'wolf':'village',state:{}}));
 if(!sheriff) {r.phase={id:'discussion',kind:'day',step:'discussion',paused:false,deadline:null};r.day=1;r.lastNight={night:1,numbers:[],eliminatedSeatIds:[]};}
 return r;
}
function finishSpeech(r) {host(r,'nightNarrationDone');assert.equal(r.phase.step,'explosion');assert.equal(r.phase.kind,'day');}
for(const stage of ['discussion','exile','sheriff-vote','nomination','speeches','reaction']) test(`self-destruct cancels ${stage} and cannot advance without explicit host confirmation`,()=>{
 const r=setup();
 if(stage==='exile'||stage==='sheriff-vote') Object.assign(r.phase,{kind:'voting',step:stage==='exile'?'exile':'sheriff'});
 if(stage==='nomination'||stage==='speeches') Object.assign(r.phase,{kind:'sheriff',step:stage});
 if(stage==='reaction') {Object.assign(r.phase,{kind:'reaction',step:'shoot'});r.pendingShots=[id(r,4)];}
 if(stage.includes('sheriff')||['nomination','speeches'].includes(stage)) {r.election={round:1,candidateIds:[id(r,2)],withdrawnIds:[],declarations:{[id(r,2)]:true},participantIds:r.seats.map(s=>s.id),voterIds:[id(r,0)]};r.sheriffElectionDone=false;}
 r.votes={[id(r,2)]:id(r,3)};r.runoffIds=[id(r,3),id(r,4)];r.speakerSeatId=id(r,2);r.speakingTimer={endsAt:now+10000};
 const oldPhase=r.phase.id;
 assert.equal(publicView(r,'p0',now).me.canExplode,true);
 send(r,'p0','wolfExplode');
 assert.equal(r.phase.kind,'announcement');assert.equal(r.phase.step,'explosion');assert.equal(r.seats[0].alive,false);
 assert.deepEqual(r.votes,{});assert.equal(r.election,null);assert.equal(r.runoffIds,null);assert.deepEqual(r.pendingShots,[]);assert.equal(r.speakingTimer,null);
 assert.deepEqual(r.phase.publicCues,['seat-1','wolf-exploded','explosion-confirm-night']);
 for(const actor of ['p0','p2']) {assert.equal(publicView(r,actor,now).me.action,null);assert.equal(publicView(r,actor,now).me.canExplode,false);}
 assert.throws(()=>send(r,'p2','vote',{targetId:id(r,3),expectedPhaseId:oldPhase}),{code:'DAY_CANCELLED'});
 finishSpeech(r);
 for(const type of ['startNight','nextPhase','startVoting','setSpeechTimer','shoot','passBadge']) assert.throws(()=>host(r,type),{code:'DAY_CANCELLED'});
 assert.throws(()=>host(r,'hardSkip'),{code:'HOST_CONFIRMATION_REQUIRED'});
 assert.throws(()=>send(r,'p2','confirmExplosionNight'),{code:'HOST_ONLY'});
 tickRoom(r,now+86400000);assert.equal(r.phase.step,'explosion');assert.equal(r.night,1);
 // State survives storage/reconnection, and only the current host can continue.
 const restored=JSON.parse(JSON.stringify(r));host(restored,'confirmExplosionNight');assert.equal(restored.phase.kind,'night');assert.equal(restored.night,2);assert.equal(restored.explosion,null);
 assert.throws(()=>host(restored,'confirmExplosionNight'),{code:'WRONG_PHASE'});
});
for(const role of ['wolfKing','whiteWolfKing']) for(const take of [false,true]) test(`${role} self-destruct: optional target=${take}, no second shot`,()=>{
 const r=setup(role);send(r,'p0','wolfExplode',take?{targetId:id(r,4)}:{});
 assert.equal(r.seats[4].alive,!take);assert.equal(r.seats[0].state.shotUsed,true);assert.deepEqual(r.pendingShots,[]);
 assert.equal(r.phase.publicCues.includes('explosion-deaths'),take);
 if(take) assert.ok(r.phase.publicCues.includes('seat-5'));
 assert.throws(()=>send(r,'p0','shoot',{targetId:id(r,3)}),{code:'DAY_CANCELLED'});
 finishSpeech(r);host(r,'confirmExplosionNight');assert.equal(r.night,2);
});
test('invalid target, ordinary wolf target, stale request, pause and night cannot explode',()=>{
 const r=setup('wolfKing');const original=JSON.stringify(r.seats);
 assert.throws(()=>send(r,'p0','wolfExplode',{targetId:id(r,0)}),{code:'INVALID_TARGET'});assert.equal(JSON.stringify(r.seats),original);
 assert.throws(()=>send(r,'p0','wolfExplode',{expectedPhaseId:'old'}),{code:'STALE_PHASE'});
 host(r,'pause');assert.throws(()=>send(r,'p0','wolfExplode'),{code:'PAUSED'});host(r,'resume');
 assert.throws(()=>send(r,'p1','wolfExplode',{targetId:id(r,2)}),{code:'INVALID_TARGET'});
 r.phase.kind='night';assert.equal(publicView(r,'p0',now).me.canExplode,false);assert.throws(()=>send(r,'p0','wolfExplode'),{code:'WRONG_PHASE'});
});
test('election interruption settles the previous night once, cancels elections and skips last words/reactions',()=>{
 const r=setup('wolfKing',true);r.actions.wolves={[id(r,1)]:{targetId:id(r,4)}};
 for(let n=0;r.phase.kind==='night'&&n<100;n++)host(r,'hardSkip');
 assert.equal(r.phase.kind,'sheriff');assert.equal(r.lastNight,null);
 send(r,'p0','wolfExplode',{targetId:id(r,2)});
 assert.equal(r.seats[2].alive,false);assert.equal(r.seats[4].alive,false);assert.equal(r.sheriffElectionDone,true);assert.equal(r.election,null);
 assert.equal(r.replay.filter(x=>x.type==='night'&&x.night===1).length,1);
 assert.ok(r.phase.publicCues.includes('night-deaths'));assert.ok(!r.phase.publicCues.some(c=>c.startsWith('last-words-')));assert.deepEqual(r.pendingShots,[]);
 finishSpeech(r);host(r,'confirmExplosionNight');assert.equal(r.night,2);
});
test('a dead sheriff loses the badge, while a living elected sheriff keeps it',()=>{
 for(const sheriff of [0,2]) {const r=setup();r.sheriffSeatId=id(r,sheriff);r.sheriffElectionDone=true;send(r,'p0','wolfExplode');assert.equal(r.sheriffSeatId,sheriff===0?null:id(r,2));assert.equal(r.phase.publicCues.includes('badge-destroyed'),sheriff===0);}
});
test('last wolf explosion announces the event before ending the game, without starting a night',()=>{
 const r=setup();r.seats[1].alive=false;send(r,'p0','wolfExplode');assert.equal(r.phase.step,'explosion');host(r,'nightNarrationDone');assert.equal(r.status,'finished');assert.equal(r.winner.team,'village');assert.equal(r.night,1);
});
