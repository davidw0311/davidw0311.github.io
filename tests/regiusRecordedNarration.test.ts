import assert from "node:assert/strict";
import test from "node:test";
import { recordedQueue, RecordedNarrator, type MediaTransport, type RecordedState, type RegiusRecording } from "../lib/regiusRecordedNarration.ts";
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

test("only Völuspá uses the continuous licensed score and a distinct seeress for both quotation languages", () => {
 for (const [index,story] of regiusStories.slice(0,3).entries()) {
  const sections=storyNarration(story), recording=getRegiusRecording(story.slug,sections)!;
  if(index>0) {
   assert.equal(recording.music,undefined);
   assert.ok(recording.clips.every(clip=>!clip.speaker && clip.src.includes('/v1/')));
   continue;
  }
  assert.equal(recording.music?.continuous,true);
  assert.ok(statSync(`public${recording.music!.src}`).size>1000);
  assert.deepEqual(recording.music?.tracks.map(track=>track.title),['Mjolnir','Vopna']);
  let quotes=0;
  for(const clip of recording.clips) {
   const isQuote=sections[clip.section].id.startsWith('quote-');
   assert.equal(clip.speaker,isQuote?'Seeress':'Narrator');
   if(isQuote) { quotes++; assert.notEqual(clip.voice,recording.voice); assert.match(clip.src,/\/v2\//); }
   else { assert.equal(clip.voice,recording.voice); assert.match(clip.src,/\/v1\//); }
  }
  assert.equal(quotes,6);
 }
});


test("all three stories keep every spoken clip in order, with rests after complete passages", () => {
 for (const story of regiusStories.slice(0,3)) {
  const sections=storyNarration(story), recording=getRegiusRecording(story.slug,sections)!;
  for (const includeNorse of [true,false]) {
   const queue=recordedQueue(recording,sections,0,includeNorse,true);
   assert.equal(queue[0].phase,"opening"); assert.equal(queue[0].duration,5);
   assert.deepEqual(queue.filter(c=>!c.phase),recording.clips.filter(c=>includeNorse||c.lang==="en"));
   assert.ok(queue.filter(c=>c.phase==="breath").length>=4);
   queue.forEach((clip,i)=>{
    if(clip.phase!=="breath")return;
    assert.equal(clip.duration,2);
    assert.equal(queue[i-1].lang,"en","Never split a Norse quote from its English rendering");
    assert.notEqual(queue[i-1].section,queue[i+1].section);
   });
   for (let index=0;index<sections.length;index++) {
    const jump=recordedQueue(recording,sections,index,includeNorse,false);
    assert.equal(jump[0].phase,undefined,"Read from here starts with speech");
    assert.deepEqual(jump.filter(c=>!c.phase),recording.clips.filter(c=>c.section>=index&&(includeNorse||c.lang==="en")));
   }
  }
 }
});
test("opening is pausable, skippable and stays five seconds at every narration speed", () => {
 const f=fixture(recording); f.options.rate=1.5;
 f.reader.start([],0,true);
 assert.match(f.audio.src,/opening-5s/); assert.equal(f.states.at(-1)?.phase,"opening");
 assert.equal(f.audio.playbackRate,1);
 const openingEnd=f.audio.onended;
 f.audio.currentTime=2; f.reader.pause(); f.reader.resume();
 assert.equal(f.audio.currentTime,2);
 f.reader.skipOpening(); assert.equal(f.audio.src,"/0.mp3"); assert.equal(f.audio.playbackRate,1.5);
 openingEnd?.(new Event("ended")); assert.equal(f.audio.src,"/0.mp3");
 assert.equal(f.states.at(-1)?.phase,undefined);
});
test("stop and jump cancel an opening or breathing space without delayed speech", () => {
 const story=regiusStories[0],sections=storyNarration(story),recording=getRegiusRecording(story.slug,sections)!;
 const f=fixture(recording); f.reader.start(sections,0,true);
 const openingEnd=f.audio.onended; f.reader.stop(); openingEnd?.(new Event("ended"));
 assert.equal(f.states.at(-1)?.status,"idle");
 f.reader.start(sections,0);
 let steps=0;
 while(f.states.at(-1)?.phase!=="breath") { f.audio.onended?.(new Event("ended"));assert.ok(++steps<10); }
 const breathEnd=f.audio.onended;
 f.reader.setRate(.6); assert.equal(f.audio.playbackRate,1);
 f.reader.start(sections,8); breathEnd?.(new Event("ended"));
 assert.equal(f.states.at(-1)?.section,8);assert.equal(f.states.at(-1)?.phase,undefined);
 assert.equal(f.audio.playbackRate,f.options.rate);
});
