// Explicit game and endpoint; only synthetic players, public API and public keys.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const game=process.argv.find(arg=>arg.startsWith('--game='))?.slice(7);
const endpoint=process.argv.find(arg=>arg.startsWith('--url='))?.slice(6);
if(!['werewolf','one-night'].includes(game)||!endpoint)throw new Error('Pass --game=werewolf|one-night --url=<API>.');
const backend=JSON.parse(await readFile(new URL(`../public/assets/${game}/backend.json`,import.meta.url),'utf8'));
const classic=game==='werewolf',players=Array.from({length:6},()=>randomUUID());
const url=new URL(endpoint),headers={'Content-Type':'application/json',Origin:url.hostname==='localhost'||url.hostname==='127.0.0.1'?'http://localhost:3010':'https://davidw0311.github.io',...(url.origin===new URL(backend.url).origin?{apikey:backend.publishableKey,Authorization:`Bearer ${backend.publishableKey}`}:{})};
let code,view,requests=0,cleaned=false;
async function call(token,op,fields={}){requests++;const response=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({token,op,code,requestId:randomUUID(),...fields}),signal:AbortSignal.timeout(16000)});const reply=await response.json();assert.equal(response.status,200,`${op}: ${reply.error||response.status}`);assert.ok(reply.view);return reply.view;}
async function command(type,fields={},token=players[0]){view=await call(token,'command',{command:{type,expectedPhaseId:view.phase.id,...fields}});return view;}
try{
 view=await call(players[0],'create',{name:'Victory verification host'});code=view.code;
 for(let i=1;i<players.length;i++)view=await call(players[i],'join',{name:`Victory verification ${i+1}`});
 if(classic){await command('updateSettings',{settings:{sheriff:false}});await command('startGame',{roleDeck:['werewolf','villager','villager','villager','villager','villager']});}
 else {await command('configure',{roleDeck:['werewolf','werewolf','seer','robber','troublemaker','drunk','villager','villager','villager']});await command('start');}
 const privateViews=await Promise.all(players.map(token=>call(token,'sync')));
 assert.ok(privateViews.every(v=>!v.winner&&!v.result));
 const wolf=privateViews.find(v=>v.me.roleId==='werewolf')?.me.seatId;
 for(const token of players)await command('ready',{},token);
 await command('startNight');
 let steps=0;while(['night','announcement'].includes(view.phase.kind)&&steps++<65)await command('hardSkip');
 assert.ok(['day','discussion'].includes(view.phase.kind));await command(classic?'startVoting':'startVote');
 for(let i=0;i<players.length;i++){
  const own=privateViews[i].me.seatId;
  const targetId=wolf?(own===wolf?view.seats.find(seat=>seat.id!==own).id:wolf):view.seats[(i+1)%players.length].id;
  await command('vote',{targetId},players[i]);
 }
 await command(classic?'resolveVoting':'finishVote');assert.equal(view.status,'finished');
 const winnerIds=classic?view.winner.seatIds:view.result.winners;
 assert.ok(winnerIds.length);const teams=classic?[view.winner.team]:[...new Set(view.result.players.filter(p=>p.won).map(p=>p.team))];
 const expected=[...teams.map(team=>`victory-${team}`),...view.seats.flatMap((seat,index)=>winnerIds.includes(seat.id)?[`winner-seat-${index+1}`]:[])];
 const cues=classic?view.phase.publicCues:view.phase.cueIds;assert.deepEqual(cues.slice(0,expected.length),expected);
 const reconnected=await call(players[2],'sync');assert.deepEqual(classic?reconnected.winner.seatIds:reconnected.result.winners,winnerIds);
 console.log(JSON.stringify({game,winningTeams:teams,winningSeats:view.seats.flatMap((seat,index)=>winnerIds.includes(seat.id)?[index+1]:[]),announcementOrder:'teams then players'}));
}finally{if(code){view=await command(classic?'disbandRoom':'disband');assert.equal(view.status,'disbanded');cleaned=true;}}
console.log(JSON.stringify({ok:true,game,requests,cleaned}));
