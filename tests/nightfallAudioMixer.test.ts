import test from "node:test";
import assert from "node:assert/strict";
import { NightfallAudioMixer, audioLevels } from "../lib/nightfallAudioMixer.ts";

test("volume preferences clamp boosts, preserve mute, and handle old or damaged storage",()=>{
 assert.deepEqual(audioLevels(),{voiceVolume:1,musicVolume:.3});
 assert.deepEqual(audioLevels({voiceVolume:0,musicVolume:2}),{voiceVolume:0,musicVolume:2});
 assert.deepEqual(audioLevels({voiceVolume:NaN,musicVolume:Infinity}),{voiceVolume:1,musicVolume:.3});
 assert.deepEqual(audioLevels({voiceVolume:-2,musicVolume:999}),{voiceVolume:0,musicVolume:2});
});
test("without Web Audio, independent levels still work and HTML volume never exceeds one",()=>{
 const voice={volume:1} as HTMLAudioElement,music={volume:1} as HTMLAudioElement;
 const mixer=new NightfallAudioMixer(voice,music);
 mixer.apply({voiceVolume:2,musicVolume:2},false);assert.equal(voice.volume,1);assert.equal(music.volume,1);
 mixer.apply({voiceVolume:.4,musicVolume:1.5},true);assert.equal(voice.volume,.4);assert.equal(music.volume,1.5*.15);
 mixer.apply({voiceVolume:0,musicVolume:.7},true);assert.equal(voice.volume,0);assert.equal(music.volume,.7);
 mixer.dispose();
});
