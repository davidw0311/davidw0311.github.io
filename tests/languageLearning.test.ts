import assert from "node:assert/strict";
import { statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  contentItems,
  contentItemsForPracticeLanguage,
  ensureLearningLanguages,
  isContentAvailableForLanguage,
  languageIds,
  languages,
  normalizeSpeech,
  preferredSupportLanguage,
  scoreTranscript,
  speechLanguageId,
  speechLocale,
  unitProgressKey,
} from "../data/languageLearning.ts";
import {
  modernHangulConsonants,
  modernHangulVowels,
  modernHiragana,
  modernKatakana,
} from "../data/languageScriptCurricula.ts";
import { phraseAudioPath, sentenceAudioPath } from "../lib/languageAudio.ts";
import { formatUi, languageLearningUi } from "../data/languageLearningUi.ts";
import {
  chineseCharacterStudies,
  tokenizeChineseCharacters,
  type ChineseCharacterLanguageId,
} from "../data/chineseCharacterStudy.ts";
import {
  tokenizeLanguageStudyText,
  usesCharacterStudy,
} from "../data/languageStudyTokens.ts";
import {
  getEnglishPronunciationGuide,
  getNativePronunciationGuide,
  nativePronunciationSystems,
} from "../data/languagePronunciation.ts";

test("ships two short stories and a counting drill", () => {
  assert.equal(contentItems.filter((item) => item.type === "story").length, 2);
  assert.equal(contentItems.filter((item) => item.type === "number_drill").length, 1);
  assert.deepEqual(
    contentItems.find((item) => item.type === "number_drill")?.units.map((unit) => unit.number),
    Array.from({ length: 20 }, (_, index) => index + 1),
  );
});

test("shares lessons by default and supports language-specific catalogs", () => {
  const sharedItems = contentItems.filter((item) => item.practiceLanguageIds === undefined);
  for (const languageId of languageIds.filter((id) => id !== "ja" && id !== "ko")) {
    assert.deepEqual(contentItemsForPracticeLanguage(languageId), sharedItems);
  }

  assert.ok(contentItemsForPracticeLanguage("ja").length > sharedItems.length);
  assert.ok(contentItemsForPracticeLanguage("ko").length > sharedItems.length);
  assert.equal(
    contentItemsForPracticeLanguage("ja").some((item) => item.practiceLanguageIds?.includes("ko")),
    false,
  );
  assert.equal(
    contentItemsForPracticeLanguage("ko").some((item) => item.practiceLanguageIds?.includes("ja")),
    false,
  );

  const japaneseOnlyLesson = {
    ...contentItems[0],
    id: "japanese-only-sample",
    practiceLanguageIds: ["ja"] as const,
  };
  assert.equal(isContentAvailableForLanguage(japaneseOnlyLesson, "ja"), true);
  assert.equal(isContentAvailableForLanguage(japaneseOnlyLesson, "en"), false);
});

test("breaks the complete Japanese and Korean scripts into manageable lessons", () => {
  const japaneseItems = contentItems.filter((item) => item.practiceLanguageIds?.includes("ja"));
  const koreanItems = contentItems.filter((item) => item.practiceLanguageIds?.includes("ko"));
  assert.equal(japaneseItems.length, 25);
  assert.equal(koreanItems.length, 18);

  for (const item of [...japaneseItems, ...koreanItems]) {
    assert.equal(item.type, "script_drill");
    assert.equal(item.audioSource, "browser");
    assert.equal(item.units.length, 4, item.id);
    assert.ok(item.sectionId, item.id);
  }

  const japaneseText = japaneseItems.flatMap((item) => item.units.map((unit) => unit.localizations.ja.text)).join("");
  const koreanText = koreanItems.flatMap((item) => item.units.map((unit) => unit.localizations.ko.text)).join("");
  for (const character of modernHiragana + modernKatakana) assert.ok(japaneseText.includes(character), character);
  for (const character of modernHangulConsonants + modernHangulVowels) assert.ok(koreanText.includes(character), character);
  for (const word of ["すし", "ねこ", "コーヒー", "ヴァイオリン"]) assert.ok(japaneseText.includes(word), word);
  for (const word of ["안녕", "사람", "학교", "사과"]) assert.ok(koreanText.includes(word), word);

  assert.deepEqual([...new Set(japaneseItems.map((item) => item.sectionId))], ["ja-hiragana", "ja-katakana", "ja-sounds"]);
  assert.deepEqual([...new Set(koreanItems.map((item) => item.sectionId))], ["ko-jamo", "ko-blocks", "ko-words"]);
});

test("includes every language and Mandarin script option in the v1 scope", () => {
  assert.deepEqual(languageIds, ["en", "zh", "zht", "yue", "ja", "ko", "ms", "fr", "es", "ta"]);
});

test("localizes the interface and lesson catalog in every v1 language", () => {
  const sharedItems = contentItems.filter((item) => item.practiceLanguageIds === undefined);
  for (const languageId of languageIds) {
    const ui = languageLearningUi[languageId];
    assert.ok(ui.chooseLesson.length > 0, languageId);
    assert.equal(Object.keys(ui.content).length, sharedItems.length, languageId);
    for (const item of sharedItems) {
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

test("makes every Chinese character individually studyable", () => {
  for (const languageId of ["zh", "zht", "yue"] satisfies ChineseCharacterLanguageId[]) {
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
  assert.equal(chineseCharacterStudies.zht.場.romanization, "chǎng");
  assert.equal(chineseCharacterStudies.zht.雨.romanization, "yǔ");
  assert.equal(chineseCharacterStudies.yue.早.romanization, "zou2");
  assert.equal(chineseCharacterStudies.yue.雨.romanization, "jyu5");
  for (const study of Object.values(chineseCharacterStudies.yue)) {
    assert.match(study.romanization, /^[a-z]+[1-6]$/);
  }
});

test("breaks phrases into characters or words without changing their text", () => {
  for (const content of contentItems) {
    for (const unit of content.units) {
      for (const languageId of languageIds) {
        for (const phrase of unit.localizations[languageId].segments) {
          const chunks = tokenizeLanguageStudyText(phrase.text, languageId);
          assert.equal(
            chunks.map((chunk) => chunk.type === "study" ? chunk.token.text : chunk.text).join(""),
            phrase.text,
            `${phrase.id}:study-text`,
          );
          const studyTokens = chunks.filter((chunk) => chunk.type === "study").map((chunk) => chunk.token);
          assert.ok(studyTokens.length > 0, `${phrase.id}:study-tokens`);
          for (const token of studyTokens) {
            assert.equal(token.kind, usesCharacterStudy(languageId) ? "character" : "word", token.id);
            if (token.kind === "character") assert.equal([...token.text].length, 1, token.id);
            else assert.match(token.text, /^[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*$/u, token.id);
          }
        }
      }
    }
  }
});

test("uses character study for Chinese, Japanese, and Korean", () => {
  assert.deepEqual(
    tokenizeLanguageStudyText("한글", "ko")
      .filter((chunk) => chunk.type === "study")
      .map((chunk) => chunk.token.text),
    ["한", "글"],
  );
  assert.deepEqual(
    tokenizeLanguageStudyText("市場は", "ja")
      .filter((chunk) => chunk.type === "study")
      .map((chunk) => chunk.token.text),
    ["市", "場", "は"],
  );
  assert.deepEqual(
    tokenizeLanguageStudyText("Good morning.", "en")
      .filter((chunk) => chunk.type === "study")
      .map((chunk) => chunk.token.text),
    ["Good", "morning"],
  );
  assert.deepEqual(
    tokenizeLanguageStudyText("Buenos días.", "es")
      .filter((chunk) => chunk.type === "study")
      .map((chunk) => chunk.token.text),
    ["Buenos", "días"],
  );
});

test("provides persistent pronunciation choices for every v1 phrase", () => {
  for (const content of contentItems) {
    for (const unit of content.units) {
      for (const languageId of languageIds) {
        const localization = unit.localizations[languageId];
        for (const phrase of localization.segments) {
          const englishGuide = getEnglishPronunciationGuide(languageId, phrase, localization);
          assert.ok(englishGuide?.text.length, `${phrase.id}:english-phonetics`);
          if (nativePronunciationSystems[languageId]) {
            const nativeGuide = getNativePronunciationGuide(languageId, phrase, localization);
            assert.ok(nativeGuide?.text.length, `${phrase.id}:native-pronunciation`);
          }
        }
      }
    }
  }
});

test("offers Pinyin, Jyutping, Hiragana, and English-friendly readings", () => {
  const marketHello = contentItems[0].units[0];
  assert.equal(
    getNativePronunciationGuide("zh", marketHello.localizations.zh.segments[0], marketHello.localizations.zh)?.text,
    "zǎo shàng hǎo",
  );
  assert.equal(
    getNativePronunciationGuide("zht", marketHello.localizations.zht.segments[0], marketHello.localizations.zht)?.text,
    "zǎo shàng hǎo",
  );
  assert.equal(
    getNativePronunciationGuide("yue", marketHello.localizations.yue.segments[0], marketHello.localizations.yue)?.text,
    "zou2 san4",
  );
  assert.equal(
    getNativePronunciationGuide("ja", marketHello.localizations.ja.segments[0], marketHello.localizations.ja)?.text,
    "おはよう ございます",
  );
  assert.equal(
    getEnglishPronunciationGuide("ja", marketHello.localizations.ja.segments[0], marketHello.localizations.ja)?.text,
    "oh-hah-yoh goh-zai-mah-soo",
  );
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
  assert.equal(
    sentenceAudioPath("market-morning", "market-hello", "zht"),
    sentenceAudioPath("market-morning", "market-hello", "zh"),
  );
  assert.equal(
    phraseAudioPath("market-morning", "market-hello", "zht", "market-hello-zht-2"),
    phraseAudioPath("market-morning", "market-hello", "zh", "market-hello-zh-2"),
  );
  assert.equal(speechLanguageId("zht"), "zh");
  assert.equal(speechLocale("zht"), "zh-CN");
});

test("keeps Traditional Mandarin speech aligned with Simplified Mandarin", () => {
  for (const content of contentItems) {
    for (const unit of content.units) {
      assert.equal(unit.localizations.zht.romanization, unit.localizations.zh.romanization, unit.id);
      assert.equal(unit.localizations.zht.segments.length, unit.localizations.zh.segments.length, unit.id);
    }
  }
  assert.notEqual(contentItems[0].units[0].localizations.zht.text, contentItems[0].units[0].localizations.zh.text);
});

test("includes Azure neural audio for every sentence speed and phrase", () => {
  const audioPaths: string[] = [];
  for (const content of contentItems.filter((item) => item.audioSource !== "browser")) {
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
  const uniqueAudioPaths = [...new Set(audioPaths)];
  assert.equal(uniqueAudioPaths.length, 782);
  for (const audioPath of uniqueAudioPaths) {
    assert.ok(statSync(path.join(process.cwd(), "public", audioPath)).size > 500, audioPath);
  }
});

test("keeps visible sample copy free of decorative long dashes", () => {
  assert.doesNotMatch(JSON.stringify(contentItems), /[—–]/);
  assert.doesNotMatch(JSON.stringify(languageLearningUi), /[—–]/);
});
