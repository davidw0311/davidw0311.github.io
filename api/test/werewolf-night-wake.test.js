'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const e=require('../src/werewolf/engine');
let now=1800000000000;
function send(r,a,type,data={}){e.applyCommand(r,a,{type,expectedPhaseId:r.phase.id,...data},++now);}
function view(r,a){return e.publicView(r,a,now);}
function game(roles){const r=e.createRoom({code:'TEST',hostId:'p0',hostName:'Host',now:++now});roles.slice(1).forEach((_,i)=>send(r,`p${i+1}`,'requestJoin',{name:`Player ${i+2}`}));send(r,'p0','startGame',{roleDeck:roles});r.seats.forEach((s,i)=>{s.roleId=s.originalRoleId=roles[i];s.team=['werewolf','mechanicalWolf','wolfWitch','gargoyle'].includes(roles[i])?'wolf':'village';});r.seats.forEach(s=>send(r,s.actorId,'ready'));send(r,'p0','startNight');return r;}
function turn(r,step,copy=false){let n=0;while(r.phase.step!==step||r.phase.nightStage!=='acting'||Boolean(r.phase.nightCopy)!==copy){assert.ok(n++<120);send(r,'p0',r.phase.nightStage==='acting'?'hardSkip':'nightNarrationDone');}}

test('Seer stays awake to read a private binary result before the closing cue, including after disconnect',()=>{
 const r=game(['werewolf','seer','guard','witch','villager','villager']);turn(r,'seer');const target=r.seats[0].id;
 send(r,'p1','nightAction',{targetId:target});assert.equal(r.phase.nightStage,'acting');assert.equal(view(r,'p1').me.action.review,true);
 assert.equal(view(r,'p1').me.inspection.alignment,'wolf');assert.equal(view(r,'p0').me.inspection,null);
 assert.equal(view(r,'p0').me.nightAwake,false);assert.equal(view(r,'p1').me.nightAwake,true);
 const id=r.phase.id;e.tickRoom(r,now+86400000);assert.equal(r.phase.id,id);
 send(r,'p1','nightAction',{confirmResult:true});assert.equal(r.phase.nightStage,'closing');assert.equal(view(r,'p1').me.nightAwake,false);
});

test('exact-role inspectors and Gravekeeper receive results during their own wake window',()=>{
 for(const role of ['pureWhite','gargoyle','wolfWitch','gravekeeper']){
  const r=game(['werewolf',role,'guard','witch','villager','villager']);turn(r,role);
  send(r,'p1','nightAction',role==='gravekeeper'?{}:{targetId:r.seats[2].id});
  assert.equal(r.phase.nightStage,'acting');assert.equal(view(r,'p1').me.action.review,true);
  assert.match(view(r,'p1').me.privateLog.at(-1).text.en,role==='gravekeeper'?/No player was exiled/:/Guard/);
  const count=r.seats[1].privateLog.length;assert.throws(()=>send(r,'p1','nightAction'),{code:'INVALID_ACTION'});assert.equal(r.phase.nightStage,'acting');send(r,'p1','nightAction',{confirmResult:true});assert.equal(r.seats[1].privateLog.length,count);assert.equal(r.phase.nightStage,'closing');
 }
});

test('Mechanical Wolf copied ability has an independent call so looking around cannot expose the real Seer',()=>{
 const r=game(['werewolf','mechanicalWolf','seer','witch','guard','villager']);turn(r,'opening');
 send(r,'p1','nightAction',{targetId:r.seats[2].id});assert.equal(view(r,'p1').me.action.review,true);assert.match(view(r,'p1').me.privateLog.at(-1).text.en,/Seer/);send(r,'p1','nightAction',{confirmResult:true});
 turn(r,'seer');assert.ok(view(r,'p2').me.action);assert.equal(view(r,'p1').me.action,null);
 send(r,'p0','hardSkip');send(r,'p0','nightNarrationDone');assert.equal(r.phase.nightCopy,true);assert.deepEqual(r.phase.nightCues,['mechanical-seer']);
 send(r,'p0','nightNarrationDone');assert.ok(view(r,'p1').me.action);assert.equal(view(r,'p2').me.action,null);
});
