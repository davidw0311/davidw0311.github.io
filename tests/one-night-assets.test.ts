import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const json=(path:string)=>JSON.parse(readFileSync(resolve(path),'utf8'));
const catalogue=[...json('api/src/one-night/core-roles.json'),...json('api/src/one-night/expansion-roles.json')];
const texts=json('public/assets/one-night/audio/text.json');
const manifest=json('public/assets/one-night/audio/manifest.json');

test('every One Night role has a unique ID, bounded card count, and both languages',()=>{
  assert.equal(new Set(catalogue.map(r=>r.id)).size,catalogue.length);
  for(const role of catalogue){
    assert.ok(role.name.en && role.name.zh && role.description.en && role.description.zh,role.id);
    assert.ok(Number.isInteger(role.maxCount) && role.maxCount>=1 && role.maxCount<=3,role.id);
    assert.ok(role.order===null || Number.isFinite(role.order),role.id);
  }
  assert.deepEqual([...new Set(catalogue.map(r=>r.expansion))].sort(),['alien','base','bonus','daybreak','superVillains','vampire']);
});
test('all scheduled roles and common stages have real bilingual male Kokoro recordings',()=>{
  const cues=['night','close','ready','discussion','voting','results','role-markReview','role-lovers',...catalogue.filter(r=>r.order!==null).map(r=>`role-${r.id}`)];
  for(const cue of cues){
    assert.ok(texts[cue],cue);
    for(const [i,lang] of ['en','zh'].entries()){
      const clip=manifest.clips[`${lang}:${cue}`];
      assert.ok(clip,`${lang}:${cue}`);
      assert.equal(clip.provider,'Kokoro');
      assert.equal(clip.voice,lang==='en'?'am_michael':'zm_010');
      assert.equal(clip.text,texts[cue][i]);
      assert.ok(clip.duration>0 && clip.duration<45);
      assert.ok(clip.src.startsWith('/assets/one-night/audio/'));
      const path=resolve('public',clip.src.slice(1));
      assert.ok(existsSync(path),path);assert.ok(readFileSync(path).length>1000,path);
    }
  }
});
test('public listening page contains every generated clip and game return link',()=>{
  const html=readFileSync('public/assets/one-night/audio/index.html','utf8');
  assert.ok(html.includes('href="/nightfall/one-night/"'));
  for(const key of Object.keys(manifest.clips)){const [lang,cue]=key.split(':');assert.ok(html.includes(`src="${lang}/${cue}.mp3"`),key);}
});
