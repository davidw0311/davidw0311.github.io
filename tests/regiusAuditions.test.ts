import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {regiusStories} from '../data/codexRegius.ts';
import {AuditionPlayer,type AuditionMedia,type AuditionStatus} from '../lib/regiusAuditionPlayer.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const pending:{resolve:()=>void;reject:()=>void}[]=[];
 const media=():AuditionMedia=>({src:'',currentTime:0,onended:null,onerror:null,play(){return new Promise<void>((resolve,reject)=>pending.push({resolve,reject}));},pause(){},load(){this.currentTime=0;},removeAttribute(){this.src='';}});
 const voice=media(),music=media(),states:AuditionStatus[]=[],prepared:boolean[]=[];
 const player=new AuditionPlayer(voice,music,async yes=>{prepared.push(yes);},status=>states.push(status));
 return {player,voice,music,states,pending,prepared};
}
test('ten distinct complete voices use exactly the current first paragraph; ten attributed music excerpts exist',()=>{
 const voices=JSON.parse(readFileSync('data/regiusAuditionVoices.json','utf8'));
 const music=JSON.parse(readFileSync('data/regiusAuditionMusic.json','utf8'));
 assert.equal(voices.paragraph,regiusStories[0].paragraphs[0]);
 assert.equal(voices.textHash,createHash('sha256').update(voices.paragraph).digest('hex'));
 assert.equal(voices.voices.length,10);assert.equal(new Set(voices.voices.map((v:{voice:string})=>v.voice)).size,10);
 assert.equal(music.length,10);assert.equal(new Set(music.map((m:{src:string})=>m.src)).size,10);
 for(const sample of [...voices.voices,...music]){assert.ok(sample.duration>20);assert.ok(statSync(`public${sample.src}`).size>1000);}
 for(const track of music){assert.equal(track.duration,60);assert.match(track.url,/^https:\/\/creatorchords.com\/music\//);assert.equal(track.sourceSha256.length,64);}
});
test('a new preview replaces both tracks; late callbacks cannot interrupt it',async()=>{
 const f=fixture();f.player.start('/voice1','/music1');const end=f.voice.onended;
 f.player.start('/voice2');f.pending[0].reject();f.pending[1].resolve();end?.(new Event("ended"));await tick();
 assert.equal(f.voice.src,'/voice2');assert.equal(f.music.src,'');assert.equal(f.states.at(-1),'loading');
 f.pending[2].resolve();await tick();assert.equal(f.states.at(-1),'playing');
});
test('pause/resume keeps both positions and ignores an earlier rejected play promise',async()=>{
 const f=fixture();f.player.start('/voice','/music');f.voice.currentTime=5;f.music.currentTime=5;
 f.player.pause();f.player.resume();f.pending[0].reject();f.pending[1].resolve();await tick();
 assert.equal(f.states.at(-1),'loading');assert.equal(f.voice.currentTime,5);assert.equal(f.music.currentTime,5);
 f.pending[2].resolve();f.pending[3].resolve();await tick();assert.equal(f.states.at(-1),'playing');
 f.voice.onended?.(new Event("ended"));assert.equal(f.music.src,'');assert.equal(f.states.at(-1),'finished');
});
test('music-only completes, stop and disposal cancel delayed playback, and errors stop both tracks',async()=>{
 const f=fixture();f.player.start(undefined,'/music');assert.equal(f.voice.src,'');assert.equal(f.prepared.at(-1),true);
 f.music.onended?.(new Event("ended"));assert.equal(f.states.at(-1),'finished');
 f.player.start('/voice','/music');const end=f.voice.onended;f.player.stop();end?.(new Event("ended"));
 f.pending.forEach(p=>p.resolve());await tick();assert.equal(f.states.at(-1),'idle');assert.equal(f.voice.src,'');
 f.player.start('/voice','/music');f.music.onerror?.(new Event("error"));assert.equal(f.states.at(-1),'error');assert.equal(f.voice.src,'');
 f.player.start('/voice');f.player.dispose();f.pending.at(-1)!.resolve();await tick();assert.equal(f.voice.src,'');
});
