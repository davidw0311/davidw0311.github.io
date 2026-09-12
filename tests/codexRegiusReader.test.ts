import assert from "node:assert/strict";
import test from "node:test";
import { regiusStories } from "../data/codexRegius.ts";
import { regiusGlossary } from "../data/codexRegiusGlossary.ts";
import { createGlossaryMatcher, glossaryForStory, usedGlossary } from "../data/codexRegiusTerms.ts";
import { getRegiusOriginal, type OriginalBlock } from "../data/codexRegiusOriginals.ts";

// Counts in the cited reading editions, including their explicit supplemental verses.
const stanzaCounts = [[66,66],[164,165],[55,55],[54,54],[42,43],[60,60],[39,40],[65,65],[32,33],[41,43],[35,34],[56,58],[43,43],[51,50],[0,0],[53,52],[26,26],[44,44],[37,37],[23,20],[27,25],[71,70],[15,14],[0,0],[44,45],[11,10],[34,32],[43,46],[105,99],[21,22],[31,31]];

test("every full text reaches the final stanza and retains all numbered verses", () => {
  regiusStories.forEach((story, index) => {
    const edition = getRegiusOriginal(story.slug);
    assert.ok(edition, story.slug);
    for (const [i, language] of (["norse", "english"] as const).entries()) {
      const blocks: OriginalBlock[] = edition[language];
      const numbers: number[] = blocks.filter(block => block.stanza).map(block => Number(block.stanza));
      const expected = stanzaCounts[index][i];
      assert.equal(numbers.length, expected, `${story.slug} ${language}`);
      assert.deepEqual([...numbers].sort((a,b) => a-b), Array.from({ length: expected }, (_, i) => i + 1), `${story.slug} ${language}`);
      assert.ok(blocks.every(block => block.text.trim()), story.slug);
      assert.ok(blocks.map(block => block.text).join(" ").length > 700, story.slug);
      assert.doesNotMatch(blocks.map(block => block.text).join(" "), /INTRODUCTORY NOTE|Comments and social||\[Prose\.|Источник|L\d+:/);
    }
    assert.match(edition.norseSource, /^https:\/\//);
    assert.match(edition.englishSource, /^https:\/\//);
  });
  assert.equal(getRegiusOriginal("../../package"), undefined);
  assert.match(getRegiusOriginal("sigrdrifumal")!.note, /stanza 31/);
  assert.match(getRegiusOriginal("brot-af-sigurdarkvidu")!.note, /four verses/);
});

test("name annotation preserves prose and respects word boundaries and longer names", () => {
  const matcher = createGlossaryMatcher(regiusGlossary);
  const text = "Odin’s Thor, Þórr, Thorin and Sigurðr’s sword; thorns, normal, vit and Not remain words.";
  const tokens = matcher(text);
  assert.equal(tokens.map(token => token.text).join(""), text);
  assert.deepEqual(tokens.filter(token => token.id).map(token => token.text), ["Odin", "Thor", "Þórr", "Thorin", "Sigurðr"]);
  assert.equal(new Set(regiusGlossary.map(entry => entry.id)).size, regiusGlossary.length);
  const used = usedGlossary(regiusGlossary, ["Odin and Thor"]);
  assert.deepEqual(used.map(entry => entry.name), ["Odin", "Thor"]);
});

test("the glossary distinguishes the people who share a name", () => {
  const helgi = glossaryForStory("helgakvida-hjorvardssonar");
  assert.match(helgi.find(entry => entry.name === "Atli")!.definition, /not the king of the Huns/);
  assert.match(helgi.find(entry => entry.name === "Helgi")!.definition, /son of Hjörvarðr/);
  assert.match(glossaryForStory("helgakvida-hundingsbana-i").find(entry => entry.name === "Högni")!.definition, /Sigrún’s father/);
  assert.match(glossaryForStory("hamdismal").find(entry => entry.name === "Erpr")!.definition, /Hamðir and Sörli/);
});
