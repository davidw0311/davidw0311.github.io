import assert from "node:assert/strict";
import { statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  contentItems,
  ensureLearningLanguages,
  languageIds,
  languages,
  normalizeSpeech,
  preferredSupportLanguage,
  scoreTranscript,
  unitProgressKey,
} from "../data/languageLearning.ts";
import { phraseAudioPath, sentenceAudioPath } from "../lib/languageAudio.ts";
import { formatUi, languageLearningUi } from "../data/languageLearningUi.ts";
import {
  chineseCharacterStudies,
  tokenizeChineseCharacters,
  type ChineseCharacterLanguageId,
} from "../data/chineseCharacterStudy.ts";

test("ships two short stories and a counting drill", () => {
  assert.equal(contentItems.filter((item) => item.type === "story").length, 2);
  assert.equal(contentItems.filter((item) => item.type === "number_drill").length, 1);
  assert.deepEqual(
    contentItems.find((item) => item.type === "number_drill")?.units.map((unit) => unit.number),
    Array.from({ length: 20 }, (_, index) => index + 1),
  );
});

test("includes every language in the v1 scope", () => {
  assert.deepEqual(languageIds, ["en", "zh", "yue", "ja", "ko", "ms", "fr", "es", "ta"]);
});

test("localizes the interface and lesson catalog in every v1 language", () => {
  for (const languageId of languageIds) {
    const ui = languageLearningUi[languageId];
    assert.ok(ui.chooseLesson.length > 0, languageId);
    assert.equal(Object.keys(ui.content).length, contentItems.length, languageId);
    for (const item of contentItems) {
      assert.ok(ui.content[item.id]?.title.length > 0, `${languageId}:${item.id}:title`);
      assert.ok(ui.content[item.id]?.description.length > 0, `${languageId}:${item.id}:description`);
    }
    assert.equal(formatUi(ui.promptProgress, { count: 2, total: 3 }).includes("{count}"), false);
  }
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
        assert.equal(
          normalizeSpeech(localization.segments.map((segment) => segment.text).join(" ")),
          normalizeSpeech(localization.text),
          `${unit.id}:${languageId}:segments`,
        );
        if (languages[languageId].supportsRomanization) {
          assert.ok(localization.romanization?.length, `${unit.id}:${languageId}:romanization`);
        }
        for (const phrase of localization.segments) {
          assert.equal(phraseIds.has(phrase.id), false, phrase.id);
          phraseIds.add(phrase.id);
        }
      }
    }
  }
});

test("makes every Mandarin and Cantonese character individually studyable", () => {
  for (const languageId of ["zh", "yue"] satisfies ChineseCharacterLanguageId[]) {
    const seenIds = new Map<string, string>();
    for (const content of contentItems) {
      for (const unit of content.units) {
        const text = unit.localizations[languageId].text;
        const tokens = tokenizeChineseCharacters(text, languageId);
        assert.equal(
          tokens.map((token) => token.type === "character" ? token.study.character : token.text).join(""),
          text,
          `${unit.id}:${languageId}:character-text`,
        );
        assert.equal(
          tokens.some((token) => token.type === "text" && /[㐀-鿿]/u.test(token.text)),
          false,
          `${unit.id}:${languageId}:missing-reading`,
        );
        for (const token of tokens) {
          if (token.type !== "character") continue;
          assert.ok(token.study.romanization.length > 0, token.study.id);
          assert.equal(chineseCharacterStudies[languageId][token.study.character], token.study);
          const existingCharacter = seenIds.get(token.study.id);
          assert.ok(!existingCharacter || existingCharacter === token.study.character, token.study.id);
          seenIds.set(token.study.id, token.study.character);
        }
      }
    }
    assert.equal(seenIds.size, Object.keys(chineseCharacterStudies[languageId]).length, languageId);
  }
});

test("uses Pinyin for Mandarin and Jyutping tone numbers for Cantonese", () => {
  assert.equal(chineseCharacterStudies.zh.早.romanization, "zǎo");
  assert.equal(chineseCharacterStudies.zh.雨.romanization, "yǔ");
  assert.equal(chineseCharacterStudies.yue.早.romanization, "zou2");
  assert.equal(chineseCharacterStudies.yue.雨.romanization, "jyu5");
  for (const study of Object.values(chineseCharacterStudies.yue)) {
    assert.match(study.romanization, /^[a-z]+[1-6]$/);
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

test("supports English practice with a different help language", () => {
  assert.equal(preferredSupportLanguage("en", "en"), "ja");
  assert.equal(preferredSupportLanguage("en", "es"), "es");
  assert.equal(preferredSupportLanguage("ja", "ja"), "en");
  assert.deepEqual(ensureLearningLanguages(["zh"], "en", "es"), ["es", "zh", "en"]);
  assert.deepEqual(ensureLearningLanguages(["ja", "en", "zh"], "ja", "en"), ["en", "zh", "ja"]);
});

test("uses stable paths for Azure neural lesson audio", () => {
  assert.equal(
    sentenceAudioPath("market-morning", "market-hello", "en", "slow"),
    "/audio/language-lab/v1/market-morning/market-hello/en/sentence-slow.mp3",
  );
  assert.equal(
    phraseAudioPath("market-morning", "market-hello", "ja", "market-hello-ja-1"),
    "/audio/language-lab/v1/market-morning/market-hello/ja/phrases/market-hello-ja-1.mp3",
  );
});

test("includes Azure neural audio for every sentence speed and phrase", () => {
  const audioPaths: string[] = [];
  for (const content of contentItems) {
    for (const unit of content.units) {
      for (const languageId of languageIds) {
        audioPaths.push(sentenceAudioPath(content.slug, unit.id, languageId));
        audioPaths.push(sentenceAudioPath(content.slug, unit.id, languageId, "slow"));
        for (const phrase of unit.localizations[languageId].segments) {
          audioPaths.push(phraseAudioPath(content.slug, unit.id, languageId, phrase.id));
        }
      }
    }
  }
  assert.equal(audioPaths.length, 782);
  for (const audioPath of audioPaths) {
    assert.ok(statSync(path.join(process.cwd(), "public", audioPath)).size > 500, audioPath);
  }
});

test("keeps visible sample copy free of decorative long dashes", () => {
  assert.doesNotMatch(JSON.stringify(contentItems), /[—–]/);
  assert.doesNotMatch(JSON.stringify(languageLearningUi), /[—–]/);
});
