// Uses only the public game API; never reads database state or service credentials.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const config=JSON.parse(await readFile(new URL('../public/assets/one-night/backend.json',import.meta.url),'utf8'));
const endpoint=process.env.ONE_NIGHT_API_URL||config.url;
const key=config.publishableKey;
const players=Array.from({length:5},(_,i)=>({token:randomUUID(),name:`Release check ${i+1}`}));
let code,view,cleaned=false,retries=0;
async function call(player,input) {
  const body=JSON.stringify({token:player.token,requestId:randomUUID(),code,...input});
  // Retry the exact packet, as the browser does, so a lost response cannot
  // duplicate an action. Surface a sustained failure instead of hiding it.
  for(let attempt=0;attempt<2;attempt++) {
    try {
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',apikey:key,Authorization:`Bearer ${key}`},body,signal:AbortSignal.timeout(16000)});
      const result=await response.json();
      if(!response.ok||result.error){const error=new Error(result.message||result.error);error.code=result.error;error.retryable=response.status>=500||response.status===429||result.error==='room-busy';throw error;}
      return result;
    } catch(error) {
      if(attempt||error.retryable===false)throw error;
      retries++;await new Promise(resolve=>setTimeout(resolve,1200));
    }
  }
}
const sync=async(player=players[0])=>(await call(player,{op:'sync'})).view;
async function command(player,type,fields={}) {
  const current=await sync(player);
  return (await call(player,{op:'command',command:{type,expectedPhaseId:current.phase.id,...fields}})).view;
}
try {
  const created=await call(players[0],{op:'create',name:players[0].name});
  view=created.view;code=view.code;assert.match(code,/^[A-Z]{4}$/);
  await Promise.all(players.slice(1).map(player=>call(player,{op:'join',name:player.name})));
  view=await sync();assert.equal(view.seats.length,5);
  await command(players[0],'configure',{roleDeck:['werewolf','werewolf','seer','robber','troublemaker','insomniac','villager','tanner']});
  view=await command(players[0],'start');
  assert.equal(view.phase.kind,'ready');assert.ok(view.seats.every(s=>!s.roleId));
  await assert.rejects(command(players[0],'startNight'),{code:'NOT_READY'});
  // New-device replacement must preserve the dealt card and revoke the old token.
  const old=players[4],before=await sync(old),replacement={token:randomUUID(),name:old.name};
  const pending=await call(replacement,{op:'join',name:replacement.name});assert.equal(pending.view.me,null);
  view=await sync();
  await command(players[0],'approveJoin',{requestId:view.requests[0].id,replaceSeatId:before.me.seatId});
  const after=await sync(replacement);assert.equal(after.me.originalRoleId,before.me.originalRoleId);
  assert.equal(after.me.seatId,before.me.seatId);players[4]=replacement;
  const revoked=await sync(old).catch(()=>null);assert.ok(!revoked?.me);
  await Promise.all(players.map(player=>command(player,'ready')));
  await assert.rejects(command(players[0],'reorderSeats',{seatIds:view.seats.map(s=>s.id).reverse()}),{code:'WRONG_PHASE'});
  view=await command(players[0],'startNight');let steps=0,actions=0,skips=0;
  while(view.phase.kind==='night') {
    assert.ok(++steps<80,`Night stalled at ${view.phase.step}`);
    if(view.phase.nightStage!=='acting')view=await command(players[0],'narrationDone');
    else {
      const acting=(await Promise.all(players.map(async player=>({player,view:await sync(player)})))).filter(p=>p.view.me?.action);
      if(!acting.length){view=await command(players[0],'hardSkip');skips++;continue;}
      for(const {player} of acting){
        const current=await sync(player),action=current.me?.action;if(!action)continue;
        const count=action.min||Math.min(1,action.max,action.targets.length);
        const fields={actionId:action.id,targets:action.targets.slice(0,count).map(t=>t.id),...(action.options?.length?{choice:action.options[0].id}:{})};
        await command(player,'act',fields);actions++;
      }
      view=await sync();
    }
  }
  assert.equal(view.phase.kind,'discussion');
  view=await command(players[0],'startVote');
  await assert.rejects(command(players[0],'finishVote'),{code:'PENDING_VOTES'});
  const seats=view.seats;
  // Concurrent joins may settle in any seat order. Bind votes to each session's
  // actual seat instead of assuming that network completion preserves the list.
  for(const player of players) {
    const own=await sync(player),index=seats.findIndex(seat=>seat.id===own.me.seatId);
    assert.ok(index>=0);
    await command(player,'vote',{targetId:seats[(index+1)%seats.length].id});
  }
  view=await command(players[0],'finishVote');
  assert.equal(view.status,'finished');assert.equal(view.result.players.length,players.length);
  assert.equal(Object.keys(view.result.votes).length,players.length);
  view=await command(players[0],'rematch');assert.equal(view.status,'lobby');assert.equal(view.result,null);assert.equal(view.me.roleId,null);
  await command(players[0],'disbandRoom');cleaned=true;
  await assert.rejects(sync(players[1]),{code:'room-disbanded'});
  console.log(JSON.stringify({ok:true,endpoint,players:players.length,nightActions:actions,absentRolesSkipped:skips,retries,checks:['private deal','readiness gate','new-device replacement','old session revoked','seating locked','night sequence','all-voters gate','results','rematch','disband']},null,2));
} finally {
  if(code&&!cleaned)await command(players[0],'disbandRoom').catch(()=>{});
}
