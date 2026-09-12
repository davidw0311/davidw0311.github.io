import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { regiusStories } from "../data/codexRegius.ts";

test("the complete booklet is ordered with unique, linkable story slugs", () => {
  assert.equal(regiusStories.length, 31);
  assert.equal(new Set(regiusStories.map(story => story.slug)).size, 31);
  assert.equal(regiusStories[0].title, "Völuspá");
  assert.equal(regiusStories.at(-1)?.title, "Hamðismál");
  regiusStories.forEach((story, index) => {
    assert.match(story.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(story.number, index + 1);
    assert.equal(story.sourcePage, index + 3);
    assert.equal(story.paragraphs.length, 2);
    assert.ok(story.paragraphs.every(paragraph => paragraph.length > 100));
  });
  assert.equal(regiusStories.filter(story => story.group === "gods").length, 11);
  assert.equal(regiusStories.filter(story => story.kind === "Heroic prose link").length, 2);
});

test("booklet illustrations, excerpts and original PDF are available", () => {
  const illustrated = regiusStories.filter(story => story.image);
  assert.equal(illustrated.length, 10);
  assert.equal(new Set(illustrated.map(story => story.image)).size, 9);
  illustrated.forEach(story => {
    assert.ok(existsSync(`public${story.image}`), story.image ?? story.slug);
    assert.ok(story.imageAlt);
  });
  assert.equal(regiusStories.filter(story => story.excerpt).length, 2);
  assert.ok(readFileSync("public/assets/codex-regius/codex-regius-short-stories.pdf").subarray(0, 5).equals(Buffer.from("%PDF-")));
});
