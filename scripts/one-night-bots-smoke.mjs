// Explicit endpoint required. Creates and disbands one disposable test room.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import backend from '../public/assets/one-night/backend.json' with {type:'json'};

const endpoint=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6);
if(!endpoint || !/^https?:\/\//.test(endpoint)) throw new Error('Pass --url=<One Night API endpoint>.');
const humans=[randomUUID(),randomUUID()],host=humans[0];
let code,view,requests=0;
const headers={'Content-Type':'application/json',Origin:['localhost','127.0.0.1'].includes(new URL(endpoint).hostname)?'http://localhost:3010':'https://davidw0311.github.io',
  ...(new URL(endpoint).origin===new URL(backend.url).origin ? {apikey:backend.publishableKey,Authorization:`Bearer ${backend.publishableKey}`} : {})};
async function call(token,op,fields={},expectedError) {
  const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({token,op,code,requestId:randomUUID(),...fields}),signal:AbortSignal.timeout(45000)});
  const body=await response.json(); requests++;
  if(expectedError) {assert.equal(body.error,expectedError);return body;}
  assert.equal(response.status,200,`${op}: ${body.error||response.status}`);
  assert.ok(body.view);return body;
}
async function command(type,data={},token=host,expectedError) {
  const reply=await call(token,'command',{command:{type,expectedPhaseId:view.phase.id,...data}},expectedError);
  if(!expectedError)view=reply.view;
  return reply;
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sync=async()=>{view=(await call(host,'sync')).view;};
const readyBots=()=>view.seats.filter(seat=>seat.isBot&&seat.ready).length;
try {
  view=(await call(host,'create',{name:'One Night bot verification'})).view;code=view.code;
  await call(humans[1],'join',{name:'Human guest'});await sync();
  await command('setBotMode',{mode:'manual'});await command('addBots',{count:10});
  assert.equal(view.seats.length,12);assert.equal(view.bots.count,10);
  assert.ok(view.seats.filter(seat=>seat.isBot).every(seat=>seat.connected&&seat.occupied&&!seat.isHost));
  await command('addBots',{count:1},humans[1],'HOST_ONLY');
  await command('removeBots');assert.equal(view.seats.length,2);
  await command('addBots',{count:10});await command('start');
  assert.equal(view.phase.kind,'ready');assert.equal(readyBots(),0);
  const packet={requestId:randomUUID(),command:{type:'botStep',expectedPhaseId:view.phase.id}};
  view=(await call(host,'command',packet)).view;assert.equal(readyBots(),1);
  view=(await call(host,'command',packet)).view;assert.equal(readyBots(),1,'Retry must not make another bot act');
  await command('botStep',{},humans[1],'HOST_ONLY');
  await wait(1700);await sync();assert.equal(readyBots(),1,'Manual mode must wait');
  await command('setBotMode',{mode:'automatic'});
  const readyDeadline=Date.now()+90000;
  while(readyBots()<10&&Date.now()<readyDeadline){await wait(1600);await sync();}
  assert.equal(readyBots(),10);assert.ok(view.seats.filter(seat=>!seat.isBot).every(seat=>!seat.ready));
  await command('startNight',{},host,'NOT_READY');
  for(const token of humans)await command('ready',{},token);
  await sync();await command('startNight');
  const visited=new Set(),nightDeadline=Date.now()+240000;
  while(view.phase.kind==='night'&&Date.now()<nightDeadline) {
    visited.add(view.phase.step);
    assert.ok(view.seats.every(seat=>!Object.hasOwn(seat,'roleId')),'Bot cards must remain private');
    if(view.phase.nightStage!=='acting'){await command('narrationDone');continue;}
    for(const token of humans) {
      const personal=(await call(token,'sync')).view,action=personal.me?.action;
      if(personal.phase.id!==view.phase.id){await sync();break;}
      if(!action)continue;
      const fields=action.canSkip&&action.targets.length<action.min?{skip:true}:{targets:action.targets.slice(0,action.min||Math.min(1,action.max,action.targets.length)).map(target=>target.id),...(action.options?.length?{choice:action.options[0].id}:{})};
      await call(token,'command',{command:{type:'act',expectedPhaseId:personal.phase.id,actionId:action.id,...fields}});
    }
    await wait(1600);await sync();
  }
  assert.equal(view.phase.kind,'discussion','Bots must finish the entire night');
  await command('setBotMode',{mode:'manual'});
  const bot=view.seats.find(seat=>seat.isBot),replacement=randomUUID();
  const joined=await call(replacement,'join',{name:'Human taking over bot'});assert.equal(joined.view.me,null);
  await sync();const pending=view.requests.find(request=>request.name==='Human taking over bot');
  await command('approveJoin',{requestId:pending.id,replaceSeatId:bot.id});
  const restored=(await call(replacement,'sync')).view;
  assert.equal(restored.me.seatId,bot.id);assert.ok(restored.me.originalRoleId);
  assert.equal(restored.seats.find(seat=>seat.id===bot.id).isBot,false);assert.equal(view.bots.count,9);humans.push(replacement);
  await command('setBotMode',{mode:'automatic'});await command('startVote');
  await command('finishVote',{},host,'PENDING_VOTES');
  const voteDeadline=Date.now()+90000;
  while(view.pendingVoterIds.some(id=>view.seats.find(seat=>seat.id===id)?.isBot)&&Date.now()<voteDeadline){await wait(1600);await sync();}
  assert.equal(view.pendingVoterIds.length,3,'Bots must not cast human ballots');
  for(const token of humans) {
    const personal=(await call(token,'sync')).view;
    await command('vote',{targetId:personal.seats.find(seat=>seat.id!==personal.me.seatId).id},token);
  }
  await sync();await command('finishVote');
  assert.equal(view.status,'finished');assert.equal(view.result.players.length,12);assert.equal(Object.keys(view.result.votes).length,12);
  await command('rematch');assert.equal(view.status,'lobby');assert.equal(view.bots.count,9);assert.equal(view.me.originalRoleId,null);
  assert.ok(view.seats.every(seat=>!seat.ready));await command('removeBots');assert.equal(view.seats.length,3);
  console.log(JSON.stringify({ok:true,players:12,bots:10,nightSteps:[...visited],manualRetry:true,humanDecisionsPreserved:true,humanReplacedBot:true,fullRound:true,rematch:true,requests}));
} finally {
  if(code)await call(host,'command',{command:{type:'disbandRoom'}});
}
