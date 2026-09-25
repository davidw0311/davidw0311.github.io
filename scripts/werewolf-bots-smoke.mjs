// Explicit endpoint required. Creates and disbands one disposable test room.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import backend from '../public/assets/werewolf/backend.json' with {type:'json'};

const endpoint=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6);
if(!endpoint || !/^https?:\/\//.test(endpoint)) throw new Error('Pass --url=<Werewolf API endpoint>.');
const host=randomUUID(), guest=randomUUID();
let code, view, requests=0;
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
  view=(await call(host,'create',{name:'Bot verification host'})).view; code=view.code;
  await call(guest,'join',{name:'Bot verification guest'});
  await sync();
  await command('setBotMode',{mode:'manual'});
  await command('addBots',{count:10});
  assert.equal(view.seats.length,12);assert.equal(view.bots.count,10);
  assert.ok(view.seats.filter(seat=>seat.isBot).every(seat=>seat.connected&&seat.occupied&&!seat.isHost));
  await command('setBotMode',{mode:'automatic'},guest,'HOST_ONLY');
  await command('removeBots');assert.equal(view.seats.length,2);
  await command('addBots',{count:10});
  await command('startGame');assert.equal(view.phase.kind,'ready');assert.equal(readyBots(),0);
  const packet={requestId:randomUUID(),command:{type:'botStep',expectedPhaseId:view.phase.id}};
  view=(await call(host,'command',packet)).view;assert.equal(readyBots(),1);
  view=(await call(host,'command',packet)).view;assert.equal(readyBots(),1,'A retried step must not act twice');
  await command('botStep',{},guest,'HOST_ONLY');
  await command('pause');await command('setBotMode',{mode:'automatic'});
  const pausedReady=readyBots();await wait(1700);await sync();
  assert.equal(readyBots(),pausedReady,'Paused bots must not act');
  await command('botStep',{},host,'PAUSED');
  await command('resume');
  const readyDeadline=Date.now()+60000;
  while(readyBots()<10 && Date.now()<readyDeadline){await wait(1600);await sync();}
  assert.equal(readyBots(),10);assert.equal(view.phase.kind,'ready');
  assert.ok(view.seats.filter(seat=>!seat.isBot).every(seat=>!seat.ready),'Bots must not ready human seats');
  await command('startNight',{},host,'NOT_READY');
  await command('ready');await command('ready',{},guest);await sync();await command('startNight');
  const visited=new Set(),nightDeadline=Date.now()+120000;
  while(view.phase.kind==='night' && Date.now()<nightDeadline) {
    visited.add(view.phase.step);
    assert.ok(view.seats.every(seat=>!Object.hasOwn(seat,'roleId')),'Bot roles must remain private');
    if(['opening','closing'].includes(view.phase.nightStage)) {await command('nightNarrationDone');continue;}
    for(const token of [host,guest]) {
      const personal=(await call(token,'sync')).view;
      const action=personal.me?.action;
      if(personal.phase.id!==view.phase.id) {await sync();break;}
      if(!action||action.alreadySubmitted)continue;
      assert.ok(action.canSkip,'The default board supports explicit skipped human night actions');
      await call(token,'command',{command:{type:'nightAction',expectedPhaseId:personal.phase.id,ability:'skip'}});
    }
    await wait(1600);await sync();
  }
  assert.notEqual(view.phase.kind,'night','Bots stalled during the first night');
  assert.ok(visited.has('wolves')&&visited.has('seer')&&visited.has('witch')&&visited.has('guard'));
  await command('setBotMode',{mode:'manual'});
  const replace=view.seats.find(seat=>seat.isBot), replacement=randomUUID();
  const joined=await call(replacement,'join',{name:'Human replacing bot'});
  assert.equal(joined.view.me,null);await sync();
  const pending=view.requests.find(request=>request.name==='Human replacing bot');
  await command('approveJoin',{requestId:pending.id,replaceSeatId:replace.id});
  const restored=(await call(replacement,'sync')).view;
  assert.equal(restored.me.seatId,replace.id);assert.ok(restored.me.roleId);
  assert.equal(restored.seats.find(seat=>seat.id===replace.id).isBot,false);
  assert.equal(view.bots.count,9);
  console.log(JSON.stringify({ok:true,players:12,bots:10,nightSteps:[...visited],manualRetry:true,pause:true,humanReadinessPreserved:true,humanReplacedBot:true,requests}));
} finally {
  if(code)await call(host,'command',{command:{type:'disbandRoom'}});
}
