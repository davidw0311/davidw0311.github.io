import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { classicVictory, oneNightVictory, victoryHeading } from "../lib/nightfallVictory.ts";
import type { GameView as Classic } from "../lib/werewolfClient.ts";
import type { GameView as OneNight } from "../lib/oneNightClient.ts";
import manifest from "../public/assets/nightfall/audio/manifest.json" with {type:"json"};
import texts from "../public/assets/nightfall/audio/text.json" with {type:"json"};
import teams from "../public/assets/nightfall/victory-teams.json" with {type:"json"};

test('classic summary uses explicit personal winners and includes eliminated teammates',()=>{
 const view={status:"finished",seats:[{id:"a",team:"wolf",alive:false},{id:"b",team:"village",alive:true},{id:"c",team:"wolf",alive:true}],winner:{team:"wolf",seatIds:["a","c"]}} as unknown as Classic;
 assert.deepEqual(classicVictory(view),{teamIds:["wolf"],winnerIds:["a","c"],draw:false});
 view.winner={team:"lovers",seatIds:["a","b"]};assert.deepEqual(classicVictory(view)?.winnerIds,["a","b"]);
 view.winner={team:"draw",seatIds:[]};assert.equal(victoryHeading(classicVictory(view)!,"zh"),"本局平局");
 view.status="playing";assert.equal(classicVictory(view),null);
});
test('One Night summary uses final winners, not original cards or every member of a winning team',()=>{
 const view={status:"finished",seats:[{id:"a"},{id:"b"},{id:"c"}],result:{winners:["c","a"],players:[{seatId:"a",team:"village",originalRoleId:"werewolf"},{seatId:"b",team:"village"},{seatId:"c",team:"tanner"}]}} as unknown as OneNight;
 assert.deepEqual(oneNightVictory(view),{teamIds:["village","tanner"],winnerIds:["a","c"],draw:false});
 view.result!.winners=[];assert.equal(victoryHeading(oneNightVictory(view)!,"en"),"No winners this round");
 view.status="playing";assert.equal(oneNightVictory(view),null);
});
test('all victory teams and seats have bilingual local Kokoro recordings',()=>{
 const clips=manifest.clips as Record<string,{src:string;provider:string;voice:string;duration:number;text:string}>;
 for(const team of [...Object.keys(teams),'draw','none'])assert.ok(Object.hasOwn(texts,`victory-${team}`));
 for(let n=1;n<=24;n++)assert.ok(Object.hasOwn(texts,`winner-seat-${n}`));
 for(const [cue,translations] of Object.entries(texts)) for(const [index,language] of ['en','zh'].entries()) {
  const clip=clips[`${language}:${cue}`];assert.ok(clip,`${language}:${cue}`);assert.equal(clip.provider,'Kokoro');assert.equal(clip.voice,language==='en'?'am_michael':'zm_010');assert.equal(clip.text,translations[index]);assert.ok(clip.duration>0&&clip.duration<15);assert.ok(existsSync(new URL(`../public${clip.src}`,import.meta.url)));
 }
});
