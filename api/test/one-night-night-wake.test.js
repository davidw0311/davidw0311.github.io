'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../src/one-night/engine');
const audio=require('../../public/assets/one-night/audio/text.json');
let now=1800000000000;
function game(roles,centers=['villager','drunk','tanner']) {
 const room=engine.createRoom({code:'TEST',hostId:'p0',hostName:'Host',now:++now});
 roles.slice(1).forEach((_,i)=>send(room,`p${i+1}`,'requestJoin',{name:`Player ${i+2}`}));
 send(room,'p0','configure',{roleDeck:[...roles,...centers]});send(room,'p0','start');
 room.seats.forEach((s,i)=>{s.originalRoleId=s.nightRoleId=roles[i];room.cards[s.id].roleId=roles[i];});
 centers.forEach((r,i)=>{room.cards[`center:${i}`].roleId=r;});
 room.seats.forEach(s=>send(room,s.actorId,'ready'));send(room,'p0','startNight');return room;
}
function send(r,a,type,fields={}){engine.applyCommand(r,a,{type,expectedPhaseId:r.phase.id,...fields},++now);}
function view(r,a='p0'){return engine.publicView(r,a,now);}
function turn(r,step){let n=0;while(r.phase.step!==step||r.phase.nightStage!=='acting'){assert.ok(n++<100);if(r.phase.nightStage==='opening'||r.phase.nightStage==='closing')send(r,'p0','narrationDone');else send(r,'p0','hardSkip');}}
function act(r,a,fields={}){send(r,a,'act',{actionId:view(r,a).me.action.id,targets:[],...fields});}

test('inspection result is read while awake; retries, disconnection and host skips cannot repeat a swap',()=>{
 const r=game(['robber','werewolf','seer']);turn(r,'robber');
 const before=structuredClone(r.cards),packet={type:'act',expectedPhaseId:r.phase.id,actionId:view(r).me.action.id,targets:['center:0']};
 engine.applyCommand(r,'p0',packet,++now);
 assert.equal(r.phase.nightStage,'acting');assert.equal(view(r).me.nightAwake,true);assert.equal(view(r).me.action.review,true);
 assert.ok(view(r).me.knowledge.some(n=>n.text.en.includes('Villager')));
 const after=JSON.stringify(r.cards);assert.notEqual(after,JSON.stringify(before));
 assert.throws(()=>engine.applyCommand(r,'p0',packet,++now),{code:'STALE_ACTION'});assert.equal(JSON.stringify(r.cards),after);
 assert.equal(engine.tickRoom(r,now+86400000),false);assert.equal(r.phase.nightStage,'acting');
 assert.equal(view(r,'p1').me.action,null);assert.equal(view(r,'p1').me.nightAwake,false);
 act(r,'p0');assert.equal(r.phase.nightStage,'closing');assert.equal(view(r).me.nightAwake,false);assert.equal(JSON.stringify(r.cards),after);
});

test('copied late abilities use their own spoken call and never wake the original holder',()=>{
 const r=game(['doppelganger','insomniac','werewolf']);turn(r,'doppelganger');act(r,'p0',{targets:[r.seats[1].id]});
 assert.equal(view(r).me.action.review,true);act(r,'p0');
 turn(r,'insomniac');assert.equal(view(r).me.action,null);assert.ok(view(r,'p1').me.action);
 send(r,'p0','hardSkip');send(r,'p0','narrationDone');
 assert.equal(r.phase.step,'doppel:insomniac');assert.deepEqual(r.phase.cueIds,['copied-insomniac']);
 assert.match(audio[r.phase.cueIds[0]][0],/Only the Doppelgänger/);send(r,'p0','narrationDone');
 assert.ok(view(r).me.action);assert.equal(view(r,'p1').me.action,null);
});

test('Fear holders review the mark before sleeping; other players receive no Empath response actions',()=>{
 const r=game(['empath','count','werewolf','villager']);turn(r,'markReview');
 // Count acted earlier; replay mark initialization deterministically for this seat.
 const feared=r.seats[3];feared.duskMark='fear';
 assert.match(audio['role-markReview'][0],/open your eyes/);
 assert.ok(view(r,'p3').me.action);act(r,'p3');
 turn(r,'empath');assert.ok(view(r).me.action);assert.equal(r.nightActors.length,1);
 for(const a of ['p1','p2','p3']){assert.equal(view(r,a).me.action,null);assert.equal(view(r,a).me.nightAwake,false);}
 assert.equal(view(r).me.knowledge.filter(x=>x.text.en.startsWith('Empath response')).length,3);
});

// Validate the entire starting-deck schedule, including absent and copied calls.
test('all role schedules have matching English and Chinese physical wake announcements',()=>{
 for(const role of engine.catalogue){
  const deck=[role.id,'doppelganger','werewolf','villager','villager','tanner'];
  if(role.id==='doppelganger')deck[1]='robber';
  if(role.id==='mason')deck[3]='mason';
  if(role.id==='villager')deck[4]='hunter';
  if(role.id==='tanner')deck[5]='hunter';
  const r=game(deck.slice(0,3),deck.slice(3));
  for(const step of r.schedule){
   const cue=step.step.startsWith('doppel:')?`copied-${step.roleId}`:`role-${step.roleId}`;
   assert.ok(audio[cue]?.every(Boolean),`${role.id}: ${cue}`);
   if(step.step.startsWith('doppel:'))assert.match(audio[cue][0],/original .* stays asleep/);
  }
 }
});

test('upgrading an already-open old Dream Wolf turn removes its obsolete phone acknowledgment',()=>{
 const r=game(['werewolf','dreamWolf','seer']);turn(r,'werewolf');
 r.nightActors.push(r.seats[1].id); // Persisted actor list from the older release.
 assert.equal(view(r,'p1').me.action,null);
 assert.equal(engine.tickRoom(r,++now),true);assert.deepEqual(r.nightActors,[r.seats[0].id]);
 act(r,'p0');assert.equal(r.phase.nightStage,'closing');
});

test('upgrading an old Empath turn supplies recorded answers without waking its old respondents',()=>{
 const r=game(['empath','werewolf','villager']);turn(r,'empath');
 r.nightActors=r.seats.map(s=>s.id);r.seats[0].knowledge=[];
 delete r.nightState[`empath:${r.seats[0].id}`].recordedAnswers;
 r.actions.empath={[r.seats[0].id]:true};
 assert.equal(engine.tickRoom(r,++now),true);assert.equal(r.nightActors.length,1);
 assert.equal(view(r).me.action.review,true);assert.equal(view(r).me.knowledge.length,2);
 act(r,'p0');assert.equal(r.phase.nightStage,'closing');
});
