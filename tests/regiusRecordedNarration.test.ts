import assert from "node:assert/strict";
import test from "node:test";
import { RecordedNarrator, type MediaTransport, type RecordedState, type RegiusRecording } from "../lib/regiusRecordedNarration.ts";
import { regiusStories } from "../data/codexRegius.ts";
import { storyNarration } from "../lib/regiusNarration.ts";
import { getRegiusRecording } from "../data/codexRegiusRecordings.ts";
import { statSync } from "node:fs";

function fixture(recording: RegiusRecording) {
 const states: RecordedState[] = [], played: string[] = [];
 const pending: {resolve: () => void; reject: () => void}[] = [];
 const options = {rate: 1, includeNorse: true};
 const audio: MediaTransport = {src:"",currentTime:0,playbackRate:1,onended:null,onerror:null,onplaying:null,onwaiting:null,
  play() { played.push(this.src); return new Promise<void>((resolve,reject) => pending.push({resolve,reject})); },
  pause() {},load() {this.currentTime=0;},removeAttribute() {this.src="";}
 };
 const reader = new RecordedNarrator(audio,recording,()=>options,state=>states.push(state));
 return {reader,audio,options,states,played,pending};
}
const recording: RegiusRecording = {voice:"test",label:"test",textHash:"",clips:[
 {section:0,part:0,lang:"en",src:"/0.mp3",duration:10},
 {section:1,part:0,lang:"non",src:"/1.mp3",duration:10},
 {section:1,part:1,lang:"en",src:"/2.mp3",duration:10},
 {section:2,part:0,lang:"en",src:"/3.mp3",duration:10},
]};
test("every starting section reads to the end, with optional Norse", () => {
 for (const start of [0,1,2]) for (const includeNorse of [true,false]) {
  const f=fixture(recording); f.options.includeNorse=includeNorse; f.reader.start([],start);
  while(f.audio.onended) f.audio.onended(new Event("ended"));
  assert.deepEqual(f.played,recording.clips.filter(c=>c.section>=start&&(includeNorse||c.lang==="en")).map(c=>c.src));
  assert.equal(f.states.at(-1)?.status,"finished");
 }
});
test("pause retains exact position; stale promises and callbacks cannot interrupt resume or jumps", async () => {
 const f=fixture(recording); f.reader.start([],0); const staleEnd=f.audio.onended;
 f.audio.currentTime=4.25; f.reader.pause(); f.reader.resume();
 assert.equal(f.audio.currentTime,4.25);
 f.pending[0].reject(); await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.states.at(-1)?.status,"loading");
 f.pending[1].resolve(); await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.states.at(-1)?.status,"playing");
 f.reader.start([],2); staleEnd?.(new Event("ended")); assert.equal(f.audio.src,"/3.mp3");
 f.reader.setRate(.85); assert.equal(f.audio.playbackRate,.85);
 const oldEnd=f.audio.onended; f.reader.stop(); oldEnd?.(new Event("ended"));
 assert.equal(f.states.at(-1)?.status,"idle"); assert.equal(f.audio.src,"");
});
test("network errors, rejected play and disposal cannot advance the queue", async () => {
 const f=fixture(recording); f.reader.start([],0); const end=f.audio.onended;
 f.pending[0].reject(); await new Promise(resolve=>setImmediate(resolve)); end?.(new Event("ended"));
 assert.equal(f.states.at(-1)?.status,"error"); assert.equal(f.played.length,1);
 f.reader.start([],1); const end2=f.audio.onended; f.audio.onerror?.(new Event("error")); end2?.(new Event("ended"));
 assert.equal(f.states.at(-1)?.status,"error"); assert.equal(f.played.length,2);
 f.reader.start([],2); const end3=f.audio.onended; f.reader.dispose(); end3?.(new Event("ended"));
 assert.equal(f.played.length,3); assert.equal(f.audio.src,"");
});
test("only the first three stories have complete recordings matching current displayed text", () => {
 for(const [index,story] of regiusStories.entries()) {
  const sections=storyNarration(story), recorded=getRegiusRecording(story.slug,sections);
  if(index>=3) {assert.equal(recorded,null,story.slug);continue;}
  assert.ok(recorded,story.slug);
  assert.deepEqual(recorded.clips.map(c=>[c.section,c.part,c.lang]),sections.flatMap((s,i)=>s.parts.map((p,j)=>[i,j,p.lang])));
  for(const clip of recorded.clips) {assert.ok(clip.duration>0);assert.ok(statSync(`public${clip.src}`).size>1000);}
  assert.equal(getRegiusRecording(story.slug,[]),null,"Changed text must invalidate recordings");
 }
});
