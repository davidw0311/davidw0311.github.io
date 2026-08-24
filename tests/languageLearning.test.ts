import assert from "node:assert/strict";
import test from "node:test";
import {
  contentItems,
  languageIds,
  normalizeSpeech,
  scoreTranscript,
  unitProgressKey,
} from "../data/languageLearning.ts";

test("ships two short stories and a counting drill", () => {
  assert.equal(contentItems.filter((item) => item.type === "story").length, 2);
  assert.equal(contentItems.filter((item) => item.type === "number_drill").length, 1);
  assert.deepEqual(
    contentItems.find((item) => item.type === "number_drill")?.units.map((unit) => unit.number),
    [1, 2, 3, 4, 5],
  );
});

test("keeps every sample multilingual and explicitly segmented", () => {
  const phraseIds = new Set<string>();
  for (const content of contentItems) {
    assert.ok(content.units.length > 0, content.id);
    for (const unit of content.units) {
      for (const languageId of languageIds) {
        const localization = unit.localizations[languageId];
        assert.ok(localization.text.length > 0, `${unit.id}:${languageId}`);
        assert.ok(localization.segments.length > 0, `${unit.id}:${languageId}`);
        for (const phrase of localization.segments) {
          assert.equal(phraseIds.has(phrase.id), false, phrase.id);
          phraseIds.add(phrase.id);
        }
      }
    }
  }
});

test("normalizes punctuation and scores close transcripts", () => {
  assert.equal(normalizeSpeech(" Buenos días! "), "buenosdías");
  assert.ok(scoreTranscript("Buenos días.", "buenos dias") >= 90);
  assert.ok(scoreTranscript("赤いりんごを三つください。", "赤いりんごを三つください") >= 95);
  assert.ok(scoreTranscript("Thank you. They look delicious.", "Thank you they look delightful") < 90);
});

test("separates local progress by content, unit, and language", () => {
  assert.equal(unitProgressKey("story-a", "unit-1", "ja"), "story-a:unit-1:ja");
  assert.notEqual(unitProgressKey("story-a", "unit-1", "ja"), unitProgressKey("story-a", "unit-1", "zh"));
});

test("keeps visible sample copy free of decorative long dashes", () => {
  assert.doesNotMatch(JSON.stringify(contentItems), /[—–]/);
});
