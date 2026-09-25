// Explicit endpoint; synthetic players only. Every room is disbanded in finally.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import backend from '../public/assets/one-night/backend.json' with { type: 'json' };
const endpoint = process.argv.find(arg => arg.startsWith('--url='))?.slice(6);
if (!endpoint || !/^https?:\/\//.test(endpoint)) throw new Error('Pass --url=<One Night API endpoint>.');
const url = new URL(endpoint);
const headers = { 'Content-Type': 'application/json', Origin: ['localhost', '127.0.0.1'].includes(url.hostname) ? 'http://localhost:3010' : 'https://davidw0311.github.io', ...(url.origin === new URL(backend.url).origin ? { apikey: backend.publishableKey, Authorization: `Bearer ${backend.publishableKey}` } : {}) };
const players = Array.from({length:12}, (_,index) => ({token:randomUUID(),name:`Round controls test ${index+1}`}));
const deck = ['werewolf','werewolf','dreamWolf','alphaWolf','mysticWolf','seer','robber','troublemaker','drunk','insomniac','hunter','tanner','villager','villager','villager'];
const summary = {ok:false,players:12,deals:0,requests:0,cleaned:false};
let code, view;
async function call(player, op, fields={}) {
  const body=JSON.stringify({token:player.token,op,code,requestId:randomUUID(),...fields});
  for(let attempt=0;attempt<2;attempt++) {
    try {
      summary.requests++;
      const response=await fetch(endpoint,{method:'POST',headers,body,signal:AbortSignal.timeout(16000)});
      const result=await response.json();
      if(!response.ok||result.error) { const error=new Error(`${op}: ${result.error||response.status}`); error.retryable=response.status>=500||result.error==='room-busy';throw error; }
      assert.ok(result.view);return result.view;
    } catch(error) {if(attempt||error.retryable===false||error.code==='ERR_ASSERTION')throw error;}
  }
}
const host=players[0];
const send=(player,type,fields={})=>call(player,'command',{command:{type,expectedPhaseId:view.phase.id,...fields}});
try {
  view=await call(host,'create',{name:host.name});code=view.code;
  // Serial joins avoid artificial lock contention; later confirmations are concurrent.
  for(const player of players.slice(1)) view=await call(player,'join',{name:player.name});
  view=await call(host,'sync');
  const seats=view.seats.map(seat=>seat.id), hostSeat=view.me.seatId;
  view=await send(host,'moveSeat',{seatId:hostSeat,number:12});assert.equal(view.seats[11].id,hostSeat);
  view=await send(host,'moveSeat',{seatId:hostSeat,number:1});assert.deepEqual(view.seats.map(seat=>seat.id),seats);
  view=await send(host,'configure',{roleDeck:deck});
  for(let attempt=0;attempt<8;attempt++) {
    view=await send(host,'start');summary.deals++;
    const ready=await Promise.all(players.map(player=>send(player,'ready')));
    players.forEach((player,index)=>{player.role=ready[index].me.originalRoleId;player.seatId=ready[index].me.seatId;});
    if(players.some(player=>player.role==='dreamWolf'))break;
    view=await send(host,'restartRound');
  }
  assert.ok(players.some(player=>player.role==='dreamWolf'),'Dream Wolf must be dealt within 8 attempts');
  view=await send(host,'startNight');assert.equal(view.phase.step,'werewolf');
  view=await send(host,'narrationDone');assert.equal(view.phase.nightStage,'acting');
  const wolves=players.filter(player=>['werewolf','dreamWolf','alphaWolf','mysticWolf'].includes(player.role));
  assert.ok(wolves.length>=2);
  // Normal wolves finish first, so Dream Wolf's own confirmation must close the call.
  wolves.sort((a,b)=>Number(a.role==='dreamWolf')-Number(b.role==='dreamWolf'));
  for(const player of wolves) {
    const personal=await call(player,'sync'), action=personal.me.action;
    assert.ok(action);assert.equal(action.roleId,player.role==='dreamWolf'?'dreamWolf':'werewolf');
    if(player.role==='dreamWolf') {assert.deepEqual(action.targets,[]);assert.deepEqual(personal.me.knowledge,[]);assert.equal(personal.phase.nightStage,'acting');}
    view=await send(player,'act',{actionId:action.id,targets:[]});
    assert.equal(view.phase.nightStage,player.role==='dreamWolf'?'closing':'acting');
  }
  for(const role of ['alphaWolf','mysticWolf']) {
    view=await send(host,'narrationDone');assert.equal(view.phase.step,role);assert.equal(view.phase.nightStage,'opening');
    view=await send(host,'narrationDone');
    const player=players.find(player=>player.role===role);
    if(player) {
      const personal=await call(player,'sync');assert.equal(personal.me.action.roleId,role);
      const other=await call(players.find(p=>p.role==='dreamWolf'),'sync');assert.equal(other.me.action,null);
      view=await send(player,'act',{actionId:personal.me.action.id,targets:personal.me.action.targets.slice(0,personal.me.action.min).map(target=>target.id)});
    } else view=await send(host,'hardSkip');
    assert.equal(view.phase.nightStage,'closing');
  }
  const oldGame=view.gameId;
  const packet={requestId:randomUUID(),command:{type:'restartRound',expectedPhaseId:view.phase.id}};
  const reset=await call(host,'command',packet);const repeated=await call(host,'command',packet);
  assert.equal(reset.revision,repeated.revision);view=repeated;
  assert.equal(view.status,'lobby');assert.equal(view.gameId,null);assert.deepEqual(view.roleDeck,deck);assert.deepEqual(view.seats.map(seat=>seat.id),seats);
  for(const player of players) {
    const own=await call(player,'sync');assert.equal(own.me.ready,false);assert.equal(own.me.originalRoleId,null);assert.equal(own.me.action,null);assert.deepEqual(own.me.knowledge,[]);assert.equal(own.result,null);
  }
  view=await send(host,'start');assert.notEqual(view.gameId,oldGame);assert.ok(view.seats.every(seat=>!seat.ready));assert.equal(view.phase.kind,'ready');
  summary.ok=true;
} finally {
  if(code) { const closed=await call(host,'command',{command:{type:'disbandRoom'}});assert.equal(closed.status,'disbanded');summary.cleaned=true; }
}
console.log(JSON.stringify(summary));
