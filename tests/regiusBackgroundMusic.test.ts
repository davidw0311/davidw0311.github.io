import assert from "node:assert/strict";
import test from "node:test";
import { BackgroundMusic, DEFAULT_MUSIC_VOLUME, musicVolume } from "../lib/regiusBackgroundMusic.ts";

function fixture() {
 const starts: number[] = [], stops: number[] = [], levels: number[] = [];
 let loadCount = 0, resumes = 0, closed = false, failures = 0;
 let resolve!: (buffer: AudioBuffer) => void, reject!: () => void;
 const pending = new Promise<AudioBuffer>((yes,no) => {resolve=yes;reject=no;});
 const context = {
  currentTime: 0, state: "running", destination: {},
  resume: async () => {resumes++;}, close: async () => {closed=true;},
  createBufferSource: () => ({connect() {},disconnect() {},start(_when:number,offset:number) {starts.push(offset);},stop() {stops.push(context.currentTime);}}),
  createGain: () => ({connect() {},disconnect() {},gain:{cancelScheduledValues() {},setValueAtTime(v:number) {levels.push(v);},setTargetAtTime(v:number) {levels.push(v);},linearRampToValueAtTime(v:number) {levels.push(v);}}}),
 };
 const music = new BackgroundMusic({context:()=>context as unknown as AudioContext,load:()=>{loadCount++;return pending;},unavailable:()=>{failures++;}});
 return {music,context,starts,stops,levels,resolve:()=>resolve({duration:64} as AudioBuffer),reject,counts:()=>({loadCount,resumes,closed,failures})};
}
const tick = () => new Promise(resolve=>setImmediate(resolve));

test("music loads only after interaction and never starts after a pending load is paused", async () => {
 const f=fixture(); f.music.setPlaying(true);
 assert.equal(f.counts().loadCount,0); assert.deepEqual(f.starts,[]);
 f.music.unlock(); f.music.setPlaying(false); f.resolve(); await tick();
 assert.deepEqual(f.starts,[]);
 f.music.unlock(); f.music.setPlaying(true); await tick();
 assert.deepEqual(f.starts,[0]); assert.equal(f.counts().loadCount,1);
 assert.ok(f.levels.includes(DEFAULT_MUSIC_VOLUME));
});
test("pause resumes music position, mute silences it, and stop resets the loop", async () => {
 const f=fixture(); f.music.unlock(); f.music.setPlaying(true); f.resolve(); await tick();
 f.context.currentTime=12; f.music.setPlaying(false); assert.equal(f.stops.length,1);
 f.context.currentTime=18; f.music.setPlaying(true); assert.deepEqual(f.starts,[0,12]);
 f.music.configure(false,.2); assert.equal(f.stops.length,2);
 f.music.configure(true,.2); assert.deepEqual(f.starts,[0,12,12]);
 f.music.configure(true,0); assert.equal(f.stops.length,3);
 f.music.stop(); f.music.configure(true,.12); f.music.setPlaying(true);
 assert.equal(f.starts.at(-1),0);
});
test("late downloads cannot play after navigation; failures are contained and retryable", async () => {
 const f=fixture(); f.music.unlock(); f.music.setPlaying(true); f.music.dispose(); f.resolve(); await tick();
 assert.deepEqual(f.starts,[]); assert.equal(f.counts().closed,true); assert.equal(f.counts().failures,0);
 const bad=fixture(); bad.music.unlock(); bad.music.setPlaying(true); bad.reject(); await tick();
 assert.equal(bad.counts().failures,1); assert.deepEqual(bad.starts,[]);
 bad.music.unlock(); await tick(); assert.equal(bad.counts().loadCount,2);
});
test("music gain stays quiet even with malformed saved settings", () => {
 assert.equal(musicVolume(1),.3); assert.equal(musicVolume(-1),0);
 assert.equal(musicVolume(NaN),DEFAULT_MUSIC_VOLUME);
 assert.equal(musicVolume(Infinity),DEFAULT_MUSIC_VOLUME);
});

test("repeated passages and jumps keep one continuous source until an explicit pause or stop", async () => {
 const f=fixture(); f.music.unlock(); f.music.setPlaying(true); f.resolve(); await tick();
 for (const time of [5,23,58,73,190]) {
  f.context.currentTime=time;
  f.music.unlock(); // A Read from here gesture must not rewind the score.
  f.music.setPlaying(true); // Next clip, translation, or silent breathing space.
  await tick();
 }
 assert.deepEqual(f.starts,[0]); assert.deepEqual(f.stops,[]);
 f.music.setPlaying(false);
 assert.equal(f.stops.length,1);
 f.context.currentTime=200; f.music.setPlaying(true);
 assert.deepEqual(f.starts,[0,190%64]);
 f.music.stop(); f.music.setPlaying(true);
 assert.equal(f.starts.at(-1),0);
});

test("track changes discard stale loads, keep playback state, and never fetch while paused", async () => {
 const f=fixture(), requests:{src?:string;signal:AbortSignal;resolve:(buffer:AudioBuffer)=>void;reject:()=>void}[]=[];
 let failures=0;
 const music=new BackgroundMusic({context:()=>f.context as unknown as AudioContext,load:(_context,signal,src)=>new Promise<AudioBuffer>((resolve,reject)=>requests.push({src,signal,resolve,reject})),unavailable:()=>failures++});
 music.setTrack('/vopna');assert.equal(requests.length,0);
 music.unlock();music.setPlaying(true);assert.equal(requests[0].src,'/vopna');
 music.setTrack('/gjallar');assert.equal(requests[0].signal.aborted,true);
 requests[0].reject();requests[1].resolve({duration:80} as AudioBuffer);await tick();
 assert.equal(failures,0);assert.deepEqual(f.starts,[0]);
 music.setTrack('/gjallar');assert.equal(requests.length,2);assert.equal(f.stops.length,0);
 f.context.currentTime=7;music.setTrack('/blood-eagle');assert.equal(f.stops.length,1);
 music.setPlaying(false);requests[2].resolve({duration:100} as AudioBuffer);await tick();
 assert.equal(f.starts.length,1,'A paused reading cannot be restarted by a download');
 music.setTrack('/vetur');assert.equal(requests.length,3,'Changing a paused selection is lazy');
 music.unlock();music.setPlaying(true);requests[3].resolve({duration:100} as AudioBuffer);await tick();
 assert.deepEqual(f.starts,[0,0]);
 music.setTrack('/northern');music.dispose();requests[4].resolve({duration:100} as AudioBuffer);await tick();
 assert.equal(f.starts.length,2);assert.equal(failures,0);
});
