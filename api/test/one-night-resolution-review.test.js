const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../src/one-night/engine.js');

function ballot(roles,targets,marks={},artifacts={}) {
  const room=engine.createRoom({code:'TEST',hostId:'host',hostName:'Host',now:1000});
  const actors=['host',...roles.slice(1).map((_,i)=>`player-${i}`)];
  for(const [i,actor] of actors.entries()) if(i)engine.applyCommand(room,actor,{type:'requestJoin',name:`Player ${i+1}`},1000);
  room.status='playing';room.phase={id:'review-ballot',kind:'voting',step:'voting',cueIds:[],deadline:null};
  room.expansion={};
  const ids=room.seats.map(s=>s.id);
  room.seats.forEach((s,i)=>{s.number=i+1;s.originalRoleId=roles[i];s.nightRoleId=roles[i];room.cards[s.id]={id:`card-${i}`,roleId:roles[i]};room.marks[s.id]=marks[i]||'clarity';if(artifacts[i])room.artifacts[s.id]=artifacts[i];});
  for(const [i,target] of targets.entries())engine.applyCommand(room,actors[i],{type:'vote',targetId:ids[target],expectedPhaseId:room.phase.id},1000);
  engine.applyCommand(room,'host',{type:'finishVote',expectedPhaseId:room.phase.id},1000);
  return {room,ids,result:room.result};
}
test('final vampire mark removes a physical Werewolf from actual wolf victory checks',()=>{
  const {ids,result}=ballot(['werewolf','minion','villager'],[1,2,1],{0:'vampire'});
  assert.deepEqual(result.deaths,[ids[1]]);
  assert.ok(!result.winners.includes(ids[1]),'No actual wolf remains, so a Minion cannot win by dying alone.');
  assert.ok(result.winners.includes(ids[0]));
});
test('Tanner and villagers can co-win when tied wolf and Tanner both die',()=>{
  const {ids,result}=ballot(['werewolf','tanner','villager','seer'],[1,0,0,1]);
  assert.deepEqual(new Set(result.deaths),new Set([ids[0],ids[1]]));
  assert.deepEqual(new Set(result.winners),new Set([ids[1],ids[2],ids[3]]));
});
test('Bodyguard protects a leader and is not itself a counted vote',()=>{
  const {ids,result}=ballot(['bodyguard','werewolf','villager','seer','robber'],[1,2,1,1,2]);
  assert.equal(result.counts[ids[1]],2);
  assert.deepEqual(result.deaths,[ids[2]]);
});
test('a role-changing artifact overrides the Vampire mark for final team and powers',()=>{
  const {ids,result}=ballot(['hunter','werewolf','villager'],[1,0,0],{0:'vampire'},{0:'brand'});
  const player=result.players.find(p=>p.seatId===ids[0]);
  assert.equal(player.roleId,'villager');assert.equal(player.team,'village');
  assert.deepEqual(result.deaths,[ids[0]],'The original Hunter no longer has its death power.');
});
test('voting for a Disease-marked player defeats that voter even if their team wins',()=>{
  const {ids,result}=ballot(['werewolf','villager','seer'],[1,0,0],{0:'disease'});
  assert.deepEqual(result.deaths,[ids[0]]);
  assert.ok(!result.winners.includes(ids[1]));assert.ok(!result.winners.includes(ids[2]));
});
test('Love death follows the final marks and can kill a protected player',()=>{
  const {ids,result}=ballot(['hunter','bodyguard','werewolf','villager'],[2,3,0,0],{0:'love',3:'love'});
  assert.ok(result.deaths.includes(ids[0]));assert.ok(result.deaths.includes(ids[2]));assert.ok(result.deaths.includes(ids[3]));
});
