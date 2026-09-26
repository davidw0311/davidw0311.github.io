import test from "node:test";
import assert from "node:assert/strict";
import { classicTableSeats, oneNightTableSeats, pendingDecisions } from "../lib/nightfallPresentation.ts";
import type { GameView as Classic } from "../lib/werewolfClient.ts";
import type { GameView as OneNight } from "../lib/oneNightClient.ts";

const classic = () => ({ status:"playing", day:1, phase:{kind:"voting",step:"sheriff"}, me:{seatId:"a"}, election:{voterIds:["b","c"]}, pendingVoterIds:["c"], seats:[
 {id:"a",name:"Host",connected:true,occupied:true,alive:true,canVote:true,isHost:true,isSheriff:true},
 {id:"b",name:"Bot",connected:false,occupied:true,alive:true,canVote:true,isBot:true},
 {id:"c",name:"Returning",connected:false,occupied:true,alive:true,canVote:true},
 {id:"d",name:"Eliminated",connected:true,occupied:true,alive:false,canVote:false}
 ]}) as unknown as Classic;

test("shared stage counts only eligible sheriff voters, including former candidates in a runoff", () => {
 const view=classic();
 assert.deepEqual(pendingDecisions(view),{kind:"voting",total:2,waiting:[{id:"c",number:3,name:"Returning",connected:false,isBot:undefined}]});
 view.election!.voterIds=["a","b","c"];view.pendingVoterIds=["a","c"];
 assert.equal(pendingDecisions(view)?.total,3);
 assert.deepEqual(pendingDecisions(view)?.waiting.map(p=>p.number),[1,3]);
 view.phase.step="exile";assert.equal(pendingDecisions(view)?.total,3);
 view.phase.kind="night";assert.equal(pendingDecisions(view),undefined);
});
test("classic table preserves deaths, sheriff, silence, host, speaking and public roles", () => {
 const view=classic();view.seats[2].silenced=true;view.seats[3].roleId="hunter";view.speakerSeatId="a";
 const seats=classicTableSeats(view,"en",id=>id.toUpperCase());
 assert.equal(seats[0].host,true);assert.equal(seats[0].sheriff,true);assert.equal(seats[0].speaking,true);assert.equal(seats[0].mine,true);
 assert.equal(seats[1].offline,false);assert.equal(seats[1].isBot,true);
 assert.equal(seats[2].status,"To vote");assert.equal(seats[2].silenced,true);assert.equal(seats[2].offline,true);
 assert.equal(seats[3].dead,true);assert.equal(seats[3].status,"Eliminated");assert.equal(seats[3].detail,"HUNTER");
 view.status="finished";view.winner={team:"village",seatIds:["a","d"]};
 const finished=classicTableSeats(view,"zh",id=>id);assert.equal(finished[3].winner,true);assert.equal(finished[3].dead,false);assert.equal(finished[3].status,"获胜");
});
test("One Night renderer exposes only public markers and uses personal winners, not starting cards", () => {
 const view={status:"playing",phase:{kind:"night"},me:{seatId:"a"},hostSeatId:"a",seats:[
 {id:"a",name:"Photo",number:1,photo:"data:image/jpeg;base64,fixture",connected:true,occupied:true,roleId:"robber",originalRoleId:"werewolf",shielded:true,hasArtifact:true},
 {id:"b",name:"Public",number:2,connected:true,occupied:true,revealedRoleId:"seer"}
 ]} as unknown as OneNight;
 const seats=oneNightTableSeats(view,"en",id=>id.toUpperCase());
 assert.equal(seats[0].photo,view.seats[0].photo);assert.equal(seats[0].shielded,true);assert.equal(seats[0].hasArtifact,true);assert.equal(seats[0].status,"You");assert.equal(seats[0].detail,undefined);
 assert.equal(seats[1].status,"SEER");assert.ok(!("originalRoleId" in seats[0]));assert.ok(!("roleId" in seats[0]));
 view.status="finished";view.result={winners:["b"]} as OneNight["result"];
 assert.deepEqual(oneNightTableSeats(view,"zh",id=>id).map(s=>[s.winner,s.status]),[[false,"未获胜"],[true,"获胜"]]);
});
test("readiness and One Night votes retain seat numbers after insertion and show offline waiters", () => {
 const view={status:"playing",phase:{kind:"ready"},seats:[{id:"b",number:1,name:"Bot",ready:true,occupied:true,isBot:true,connected:false},{id:"a",number:2,name:"A",ready:false,occupied:true,connected:false}]} as unknown as OneNight;
 assert.equal(pendingDecisions(view)?.total,2);assert.deepEqual(pendingDecisions(view)?.waiting.map(s=>s.number),[2]);
 view.phase.kind="voting";view.pendingVoterIds=["a"];assert.deepEqual(pendingDecisions(view)?.waiting.map(s=>s.id),["a"]);
 view.pendingVoterIds=[];assert.deepEqual(pendingDecisions(view)?.waiting,[]);
});
