const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../src/one-night/engine.js');
const audio=require('../../public/assets/one-night/audio/manifest.json');

function fixture(role) {
  const actors=['host','guest-a','guest-b','guest-c','guest-d'];
  const room=engine.createRoom({code:'PLAY',hostId:actors[0],hostName:'Host',now:1000});
  for(let i=1;i<actors.length;i++)engine.applyCommand(room,actors[i],{type:'requestJoin',name:`Player ${i+1}`},1000);
  let deck=[role];
  if(role==='mason')deck.push('mason');
  for(const id of ['werewolf','werewolf','seer','robber','troublemaker','villager','villager','villager','insomniac']) {
    if(deck.length===8)break;
    const max=engine.catalogue.find(r=>r.id===id).maxCount;
    if(deck.filter(r=>r===id).length<max)deck.push(id);
  }
  engine.applyCommand(room,'host',{type:'configure',roleDeck:deck},1000);
  engine.applyCommand(room,'host',{type:'start'},1000);
  const target=room.seats[0].id;
  const source=Object.keys(room.cards).find(id=>room.cards[id].roleId===role);
  [room.cards[target],room.cards[source]]=[room.cards[source],room.cards[target]];
  for(const seat of room.seats){seat.originalRoleId=room.cards[seat.id].roleId;seat.nightRoleId=seat.originalRoleId;seat.originalCardId=room.cards[seat.id].id;}
  for(const actor of actors)engine.applyCommand(room,actor,{type:'ready',expectedPhaseId:room.phase.id},1000);
  engine.applyCommand(room,'host',{type:'startNight',expectedPhaseId:room.phase.id},1000);
  return {room,actors};
}
for(const role of engine.catalogue) test(`the ${role.id} role completes a full round using only legal public action descriptors`,()=>{
  const {room,actors}=fixture(role.id);let now=2000,moves=0;
  while(room.phase.kind==='night'){
    assert.ok(moves++<200,`Night stalled at ${room.phase.step}`);
    for(const cue of room.phase.cueIds)assert.ok(audio.clips[`en:${cue}`] && audio.clips[`zh:${cue}`],`Missing narration ${cue}`);
    if(room.phase.nightStage!=='acting'){
      engine.applyCommand(room,'host',{type:'narrationDone',expectedPhaseId:room.phase.id},now++);continue;
    }
    const actions=actors.map(actor=>({actor,action:engine.publicView(room,actor,now).me.action})).filter(x=>x.action);
    if(!actions.length){assert.ok(room.phase.deadline,`No actor and no continuation at ${room.phase.step}`);now=room.phase.deadline+1;engine.tickRoom(room,now);continue;}
    for(const {actor} of actions){
      const action=engine.publicView(room,actor,now).me.action;if(!action)continue;
      const count=action.min || Math.min(action.max,action.targets.length,1);
      const targets=action.targets.slice(0,count).map(t=>t.id);
      const command={type:'act',expectedPhaseId:room.phase.id,actionId:action.id,targets,...(action.options?.length?{choice:action.options[0].id}:{})};
      if(targets.length<action.min && action.canSkip)command.skip=true;
      try{engine.applyCommand(room,actor,command,now++);}catch(e){e.message=`${role.id} at ${room.phase.step} (${action.roleId}): ${e.message}`;throw e;}
    }
  }
  assert.equal(room.phase.kind,'discussion');
  engine.applyCommand(room,'host',{type:'startVote',expectedPhaseId:room.phase.id},now++);
  for(const [index,actor]of actors.entries())engine.applyCommand(room,actor,{type:'vote',expectedPhaseId:room.phase.id,targetId:room.seats[(index+1)%actors.length].id},now++);
  engine.applyCommand(room,'host',{type:'finishVote',expectedPhaseId:room.phase.id},now++);
  assert.equal(room.status,'finished');assert.equal(room.result.players.length,actors.length);
  assert.ok(room.result.players.every(p=>typeof p.won==='boolean' && typeof p.died==='boolean'));
  engine.applyCommand(room,'host',{type:'rematch',expectedPhaseId:room.phase.id},now++);
  const reset=engine.publicView(room,'host',now);
  assert.equal(reset.status,'lobby');assert.equal(reset.me.roleId,null);assert.deepEqual(reset.me.knowledge,[]);assert.equal(reset.result,null);
});
