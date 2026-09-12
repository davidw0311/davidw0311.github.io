import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { regiusStories, regiusWordsPerMinute } from "../data/codexRegius.ts";

test("the complete booklet is ordered with unique, linkable story slugs", () => {
  assert.equal(regiusStories.length, 31);
  assert.equal(new Set(regiusStories.map(story => story.slug)).size, 31);
  assert.equal(regiusStories[0].title, "Völuspá");
  assert.equal(regiusStories.at(-1)?.title, "Hamðismál");
  regiusStories.forEach((story, index) => {
    assert.match(story.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(story.number, index + 1);
    assert.equal(story.sourcePage, index + 3);
    assert.ok(story.paragraphs.length >= 4);
    assert.ok(story.paragraphs.every(paragraph => paragraph.trim().length > 0));
  });
  assert.equal(regiusStories.filter(story => story.group === "gods").length, 11);
  assert.equal(regiusStories.filter(story => story.kind === "Heroic prose link").length, 2);
});

test("every expanded story has paired quotations, valid placement and traceable sources", () => {
  regiusStories.forEach(story => {
    assert.ok(story.wordCount >= (story.kind === "Heroic prose link" ? 250 : 400), story.slug);
    assert.ok(story.quotes.length >= (story.kind === "Heroic prose link" ? 1 : 2), story.slug);
    story.quotes.forEach(quote => {
      assert.ok(Number.isInteger(quote.after) && quote.after > 0 && quote.after <= story.paragraphs.length, story.slug);
      assert.ok(quote.norse.trim() && quote.english.trim() && quote.stanza.trim(), story.slug);
      assert.notEqual(quote.norse, quote.english);
    });
    assert.equal(new Set(story.quotes.map(quote => quote.after)).size, story.quotes.length, story.slug);
    assert.ok(story.note.length > 50, story.slug);
    assert.equal(new URL(story.norseSource).protocol, "https:");
    assert.match(story.translationSource, /^https:\/\/sacred-texts\.com\/neu\/poe\/poe\d{2}\.htm$/);
    const words = [...story.paragraphs, ...story.quotes.map(quote => quote.english)].join(" ").trim().split(/\s+/u).length;
    assert.equal(story.wordCount, words);
    assert.equal(story.minutes, Math.ceil(words / regiusWordsPerMinute));
  });
});

test("booklet illustrations and original PDF remain available", () => {
  const illustrated = regiusStories.filter(story => story.image);
  assert.equal(illustrated.length, 10);
  assert.equal(new Set(illustrated.map(story => story.image)).size, 9);
  illustrated.forEach(story => {
    assert.ok(existsSync(`public${story.image}`), story.image ?? story.slug);
    assert.ok(story.imageAlt);
  });
  assert.ok(readFileSync("public/assets/codex-regius/codex-regius-short-stories.pdf").subarray(0, 5).equals(Buffer.from("%PDF-")));
});
