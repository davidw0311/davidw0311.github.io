// Explicit endpoint, synthetic players, cleanup in finally.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import backend from '../public/assets/werewolf/backend.json' with {type:'json'};
const endpoint=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6);
if(!endpoint||!/^https?:\/\//.test(endpoint))throw new Error('Pass --url=<Werewolf API endpoint>.');
const url=new URL(endpoint), tokens=Array.from({length:6},()=>randomUUID());
const headers={'Content-Type':'application/json',Origin:['localhost','127.0.0.1'].includes(url.hostname)?'http://localhost:3010':'https://davidw0311.github.io',...(url.origin===new URL(backend.url).origin?{apikey:backend.publishableKey,Authorization:`Bearer ${backend.publishableKey}`}:{})};
let code,view,requests=0,cleaned=false;
async function call(token,op,fields={}) {
 const body=JSON.stringify({token,op,code,requestId:randomUUID(),...fields});
 for(let attempt=0;attempt<2;attempt++)try{
  requests++;const response=await fetch(endpoint,{method:'POST',headers,body,signal:AbortSignal.timeout(16000)});const reply=await response.json();
  if(!response.ok||reply.error){const error=new Error(`${op}: ${reply.error||response.status}`);error.retryable=response.status>=500||reply.error==='room-busy';throw error;}
  assert.ok(reply.view);return reply;
 }catch(error){if(attempt||error.retryable===false||error.code==='ERR_ASSERTION')throw error;}
}
const send=async(token,type,fields={})=>(await call(token,'command',{command:{type,expectedPhaseId:view.phase.id,...fields}})).view;
try{
 const created=await call(tokens[0],'create',{name:'Restart verification host'});view=created.view;code=view.code;
 for(let index=1;index<tokens.length;index++)view=(await call(tokens[index],'join',{name:`Restart verification ${index}`})).view;
 const seats=view.seats.map(seat=>seat.id);
 view=await send(tokens[0],'startGame');const oldGame=view.gameId;
 await Promise.all(tokens.map(token=>send(token,'ready')));
 view=await send(tokens[0],'startNight');view=await send(tokens[0],'pause');assert.equal(view.phase.paused,true);
 const packet={requestId:randomUUID(),command:{type:'restartRound',expectedPhaseId:view.phase.id}};
 const reset=await call(tokens[0],'command',packet);const retry=await call(tokens[0],'command',packet);view=retry.view;
 assert.equal(reset.view.revision,retry.view.revision);assert.equal(reset.recoveryKey,created.recoveryKey);assert.equal(view.status,'lobby');assert.equal(view.gameId,null);assert.equal(view.phase.paused,false);assert.deepEqual(view.seats.map(seat=>seat.id),seats);
 for(const token of tokens){const own=(await call(token,'sync')).view;assert.equal(own.me.ready,false);assert.equal(own.me.roleId,null);assert.equal(own.me.action,null);assert.deepEqual(own.me.privateLog,[]);assert.deepEqual(own.me.history,[]);assert.deepEqual(own.messages,[]);assert.equal(own.election,null);assert.equal(own.lastNight,null);assert.equal(own.lastVote,null);assert.ok(own.seats.every(seat=>seat.alive&&!seat.isSheriff&&!seat.roleId));}
 view=await send(tokens[0],'moveSeat',{seatId:seats[0],number:6});assert.deepEqual(view.seats.map(seat=>seat.id),[...seats.slice(1),seats[0]]);
 view=await send(tokens[0],'startGame');assert.notEqual(view.gameId,oldGame);assert.equal(view.phase.kind,'ready');assert.ok(view.seats.every(seat=>!seat.ready));
 const freshGame=view.gameId;view=(await call(tokens[0],'command',packet)).view;assert.equal(view.gameId,freshGame);assert.equal(view.phase.kind,'ready');
}finally{if(code){const closed=await call(tokens[0],'command',{command:{type:'disbandRoom'}});assert.equal(closed.view.status,'disbanded');cleaned=true;}}
console.log(JSON.stringify({ok:true,players:tokens.length,requests,cleaned}));
