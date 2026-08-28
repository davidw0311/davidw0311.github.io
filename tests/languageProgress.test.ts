import assert from "node:assert/strict";
import test from "node:test";
import { defaultLocalProgress } from "../data/languageLearning.ts";
import {
  addSupportLanguage,
  parseLanguageProgress,
  removeSupportLanguage,
  reorderSupportLanguages,
  selectPracticeLanguage,
  setPronunciationPreference,
  toggleSavedStudyItem,
} from "../data/languageProgress.ts";

test("language progress safely migrates incomplete and malformed local data", () => {
  assert.deepEqual(parseLanguageProgress("not-json"), defaultLocalProgress);

  const parsed = parseLanguageProgress(JSON.stringify({
    xp: -20,
    completed: { valid: "passed", invalid: "complete" },
    savedPhraseIds: ["phrase-1", "phrase-1", 4],
    practiceLanguageId: "ja",
    supportLanguageId: "ja",
    displayLanguageIds: ["en", "en", "bogus", "ja"],
    showRomanization: "yes",
    pronunciationModes: { ja: "native", en: "bogus" },
  }));

  assert.equal(parsed.xp, 0);
  assert.deepEqual(parsed.completed, { valid: "passed" });
  assert.deepEqual(parsed.savedPhraseIds, ["phrase-1"]);
  assert.equal(parsed.supportLanguageId, "en");
  assert.deepEqual(parsed.displayLanguageIds, ["en", "ja"]);
  assert.equal(parsed.showRomanization, true);
  assert.deepEqual(parsed.pronunciationModes, { ja: "native" });
});

test("language progress operations preserve the learning language at the bottom", () => {
  const englishPractice = selectPracticeLanguage(defaultLocalProgress, "en");
  assert.equal(englishPractice.practiceLanguageId, "en");
  assert.equal(englishPractice.displayLanguageIds.at(-1), "en");
  assert.notEqual(englishPractice.supportLanguageId, "en");

  const withFrench = addSupportLanguage(englishPractice, "fr");
  const reordered = reorderSupportLanguages(withFrench, ["fr", "ja"]);
  assert.deepEqual(reordered.displayLanguageIds, ["fr", "ja", "en"]);
  assert.equal(reordered.supportLanguageId, "fr");

  const removed = removeSupportLanguage(reordered, "fr");
  assert.deepEqual(removed.displayLanguageIds, ["ja", "en"]);
  assert.equal(removed.supportLanguageId, "ja");
});

test("saved items and pronunciation preferences update immutably", () => {
  const saved = toggleSavedStudyItem(defaultLocalProgress, "sample-phrase");
  assert.deepEqual(saved.savedPhraseIds, ["sample-phrase"]);
  assert.deepEqual(defaultLocalProgress.savedPhraseIds, []);
  assert.deepEqual(toggleSavedStudyItem(saved, "sample-phrase").savedPhraseIds, []);

  const withPronunciation = setPronunciationPreference(saved, "ja", "native");
  assert.equal(withPronunciation.pronunciationModes.ja, "native");
  assert.equal(saved.pronunciationModes.ja, undefined);
});
