const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const {createRequire}=require('node:module');
function seededEngine(seed) {
 let state=seed>>>0,serial=0;
 const random=max=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return Math.floor(state/0x100000000*max);};
 const file=require.resolve('../src/werewolf/engine');
 const realRequire=createRequire(file),engineModule={exports:{}};
 const localRequire=name=>name==='node:crypto'?{randomUUID:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`,randomInt:(min,max)=>max===undefined?random(min):min+random(max-min)}:realRequire(name);
 new Function('require','module',fs.readFileSync(file,'utf8'))(localRequire,engineModule);
 return engineModule.exports;
}
const catalogue=require('../src/werewolf/roles.json');
const large=['werewolf','wolfKing','wolfBeauty','wolfWitch','mechanicalWolf','bloodMoonApostle','seer','witch','guard','hunter','cupid','magician','dreamweaver','gravekeeper','raven','demonHunter','pureWhite','wildChild','wolfHound','thief','piper','elder','knight','villager'];
const boards=['12','14','16','12-gargoyle-grave','12-pure-white'].map(id=>catalogue.presets.find(p=>p.id===id)).concat({id:'24-night-powers',roles:large});
test('production bots finish six seeded 12–24-player games with explicit human decisions and host phase control', t=>{
for(const [boardIndex,board] of boards.entries()) {
 const e=seededEngine(6101+boardIndex);
 let now=1800000000000;
 const r=e.createRoom({code:'SIM',hostId:'human',hostName:'Human',now});
 const send=(actor,type,data={})=>e.applyCommand(r,actor,{type,expectedPhaseId:r.phase.id,...data},++now);
 const host=(type,data)=>send(r.hostId,type,data);
 const view=actor=>e.publicView(r,actor,now);
 host('addBots',{count:board.roles.length-1}); host('setBotMode',{mode:'manual'});
 host('updateSettings',{settings:{sheriff:true,winCondition:'all',witchSelfSave:[false,true,'firstNight'][boardIndex%3],guardAntidote:boardIndex%2?'kill':'save'}});
 host('startGame',{roleDeck:board.roles});
 // Keep the one real participant a villager; every special card is exercised by production bots.
 const human=r.seats[0],villager=r.seats.find(s=>s.roleId==='villager');
 if(villager!==human) for(const key of ['roleId','originalRoleId','team','originalTeam']) [human[key],villager[key]]=[villager[key],human[key]];
 let commands=0,shots=0,runoffs=0,idle=0;
 const acted=new Set();
 for(let turn=0;turn<1800&&r.status==='playing';turn++) {
  const v=view('human'),me=v.me;
  if(r.phase.kind==='ready'&&!me.ready) host('ready');
  if(r.phase.kind==='sheriff'&&r.phase.step==='nomination'&&!v.election.declaredIds.includes(human.id)) host('sheriffInterest',{run:false});
  if(me.action&&!me.action.alreadySubmitted) {assert.equal(me.action.kind,'vote'); host('vote',{targetId:me.action.targets.find(id=>id!==human.id)||me.action.targets[0]||null});}
  if(me.canPassBadge)host('passBadge',{targetId:v.seats.find(s=>s.alive)?.id||null});
  if(r.status!=='playing')break;
  let stepped=false;
  try { const phase=r.phase;host('botStep');stepped=true;commands++; if(phase.kind==='reaction')shots++; if(phase.kind==='night'&&phase.nightStage==='acting')acted.add(phase.step);if(phase.kind==='voting'&&phase.step==='sheriff'&&r.election.round===2)runoffs++; }
  catch(error){if(error.code!=='BOT_IDLE')throw new Error(`${board.id} turn${turn} ${JSON.stringify(r.phase)}: ${error.code}: ${error.message}`);}
  if(r.status!=='playing')break;
  const phase=r.phase;
  if(phase.kind==='ready'&&r.seats.every(s=>s.ready)){host('startNight');stepped=true;}
  else if(phase.kind==='night'&&phase.nightStage!=='acting'){host('nightNarrationDone');stepped=true;}
  else if(phase.kind==='night'&&r.nightFlow.eligibleSeatIds.length===0){now=r.nightFlow.deadline;e.tickRoom(r,now);stepped=true;}
  else if(phase.kind==='announcement'){host('nightNarrationDone');stepped=true;}
  else if(phase.kind==='sheriff'){
   if(phase.step==='nomination'&&view('human').election.nominationsComplete){host('advanceElection');stepped=true;}
   else if(phase.step==='speeches'&&r.election.candidateIds.every(id=>r.election.finishedIds.includes(id))){host('advanceElection');stepped=true;}
  }else if(phase.kind==='voting'&&phase.step!=='sheriff'&&!view('human').pendingVoterIds.length){host('resolveVoting');stepped=true;}
  else if(phase.kind==='day'&&phase.step!=='badge'){host(phase.step==='afterVote'?'startNight':'startVoting');stepped=true;}
  idle=stepped?0:idle+1;
  assert.ok(idle<4,`${board.id} stalled ${JSON.stringify(r.phase)} pending=${JSON.stringify(view('human').pendingVoterIds)}`);
 }
 assert.equal(r.status,'finished',`${board.id} exceeded bound`);
 t.diagnostic(JSON.stringify({board:board.id,players:r.seats.length,winner:r.winner.team,nights:r.night,botCommands:commands,shots,runoffs,actions:[...acted]}));
}
});
