import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import registry from "../data/regiusVoiceRegistry.json" with { type: "json" };
import { regiusStories } from "../data/codexRegius.ts";
import { getRegiusRecording, recordingCastMatches, type RegiusCastRegistry } from "../data/codexRegiusRecordings.ts";
import { storyNarration } from "../lib/regiusNarration.ts";
import { displayTurn } from "../data/regiusDrama.ts";

test("character identities resolve to immutable checked-in voice references", () => {
 const ids = new Set(Object.keys(registry.characters));
 for (const character of Object.values(registry.characters)) {
  const voice = registry.voices[character.voiceId as keyof typeof registry.voices];
  assert.ok(voice.referenceText.trim());
  assert.equal(createHash("sha256").update(readFileSync(`public${voice.reference}`)).digest("hex"),voice.sha256);
 }
 assert.ok(registry.characters.odin.aliases.includes("Gagnráðr"));
 for (const story of regiusStories) {
  if(story.number>3) { assert.equal(story.drama,undefined); continue; }
  assert.ok(story.drama);
  assert.ok(ids.has(story.drama.quoteCharacter));
  story.drama.sections.forEach((section,i)=>{
   assert.equal(section.id,`paragraph-${i}`);
   assert.equal(story.paragraphs[i],section.turns.map(displayTurn).join(" "));
   for (const turn of section.turns) {assert.ok(ids.has(turn.character));assert.ok(turn.text.trim());}
  });
 }
});

test("English recordings follow every turn with the same character voice across stories", () => {
 const observed = new Map<string, Set<string>>();
 for(const story of regiusStories.slice(0,3)) {
  const sections=storyNarration(story),recording=getRegiusRecording(story.slug,sections);
  assert.ok(recording,story.slug);
  assert.ok(recordingCastMatches(recording,registry));
  for (const clip of recording.clips.filter(c=>c.lang==="en")) {
   assert.equal(clip.character,sections[clip.section].parts[clip.part].character);
   assert.ok(clip.referenceHash);assert.ok(clip.voiceId);
   const set=observed.get(clip.character!)??new Set<string>();set.add(clip.voiceId!);observed.set(clip.character!,set);
  }
 }
 for(const [character, voices] of observed) assert.equal(voices.size,1,character);
 assert.deepEqual([...observed.get("odin")!],[registry.characters.odin.voiceId]);
});

test("recasting Odin invalidates his recordings in all three stories but another role does not", () => {
 const recast: RegiusCastRegistry=structuredClone(registry);
 recast.characters.odin.voiceId="odin-v2";
 recast.voices["odin-v2"]={sha256:"new reference"};
 for(const story of regiusStories.slice(0,3)) {
  const recording=getRegiusRecording(story.slug,storyNarration(story))!;
  assert.equal(recordingCastMatches(recording,recast),false,story.slug);
 }
 const frigg: RegiusCastRegistry=structuredClone(registry);
 frigg.characters.frigg.voiceId="frigg-v2";frigg.voices["frigg-v2"]={sha256:"new reference"};
 for(const story of regiusStories.slice(0,3)) {
  const recording=getRegiusRecording(story.slug,storyNarration(story))!;
  assert.equal(recordingCastMatches(recording,frigg),story.slug!=="vafthrudnismal");
 }
});
