import assert from "node:assert/strict";
import {readFileSync, statSync} from "node:fs";
import {createHash} from "node:crypto";
import test from "node:test";
import catalogue from "../public/assets/nightfall/narrators/catalogue.json" with {type:"json"};
import {chineseNarrator, narrationSource, type ChineseNarrator, type NightfallGame} from "../lib/nightfallNarrators.ts";

test("saved narrator values are validated and each game preserves its existing default", () => {
  assert.equal(chineseNarrator(undefined,"werewolf"),"brian");
  assert.equal(chineseNarrator(undefined,"one-night"),"kokoro");
  assert.equal(chineseNarrator("../../secret","werewolf"),"brian");
  assert.equal(chineseNarrator("brian","one-night"),"kokoro", "One Night never had a Brian library");
  for (const voice of catalogue.narrators) for (const game of ["werewolf","one-night"] as const) assert.equal(chineseNarrator(voice.id,game),voice.id);
});

test("every Chinese cue, including all victory cues, resolves to a complete named voice recording", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/assets/nightfall/narrators/manifest.json",import.meta.url),"utf8"));
  const victory = JSON.parse(readFileSync(new URL("../public/assets/nightfall/audio/manifest.json",import.meta.url),"utf8"));
  for (const game of ["werewolf","one-night"] as const) {
    const original = JSON.parse(readFileSync(new URL(`../public/assets/${game}/audio/manifest.json`,import.meta.url),"utf8"));
    for (const [key,clip] of Object.entries({...original.clips,...victory.clips}) as [string,{text:string}][]) {
      if (!key.startsWith("zh:")) continue;
      const cue=key.slice(3), id=createHash("sha256").update(clip.text).digest("hex").slice(0,16);
      assert.equal((catalogue.games[game] as Record<string,string>)[cue],id,`${game}:${cue} script must stay current`);
      for (const voice of [...catalogue.narrators.map(v=>v.id),"kokoro"]) {
        const src=narrationSource(game,cue,"zh",voice as ChineseNarrator);
        assert.ok(statSync(new URL(`../public${src}`,import.meta.url)).size>1000,src);
        if (voice!=="kokoro") {
          const entry=manifest.clips[`${voice}:${id}`];
          assert.equal(entry.text,clip.text); assert.equal(entry.src,src);
          assert.ok(entry.duration>.25 && entry.duration<42,src);
        }
      }
    }
  }
});

test("Chinese voice selection cannot change English, timer sounds, or legacy Brian recordings", () => {
  for (const voice of ["brian","kokoro",...catalogue.narrators.map(v=>v.id)] as ChineseNarrator[]) {
    for (const game of ["werewolf","one-night"] as NightfallGame[]) {
      assert.equal(narrationSource(game,"night","en",voice),`/assets/${game}/audio/en/night.mp3`);
      assert.equal(narrationSource(game,"victory-wolf","en",voice),"/assets/nightfall/audio/en/victory-wolf.mp3");
      assert.equal(narrationSource(game,"timer-bell","zh",voice),"/assets/werewolf/audio/timer-bell.wav");
    }
  }
  assert.equal(narrationSource("werewolf","night","zh","brian"),"/assets/werewolf/audio/zh/night.mp3");
  assert.equal(narrationSource("werewolf","victory-wolf","zh","brian"),"/assets/nightfall/audio/zh/victory-wolf.mp3");
});
