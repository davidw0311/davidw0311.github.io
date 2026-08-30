import type {
  LanguageId,
  LocalizedUnit,
  PhraseSegment,
} from "./languageLearning.ts";
import { tokenizeLanguageStudyText, type LanguageStudyToken } from "./languageStudyTokens.ts";

export type NativePronunciationSystem =
  | "pinyin"
  | "jyutping"
  | "hiragana"
  | "romanization"
  | "transliteration";

export type PronunciationGuide = {
  text: string;
  scope: "phrase" | "token";
};

export const nativePronunciationSystems: Partial<Record<LanguageId, NativePronunciationSystem>> = {
  zh: "pinyin",
  zht: "pinyin",
  yue: "jyutping",
  ja: "hiragana",
  ko: "romanization",
  ta: "transliteration",
};

const phraseRomanizations: Readonly<Record<string, string>> = {
  "market-hello-ja-1": "ohayou gozaimasu",
  "market-hello-ja-2": "ichiba wa",
  "market-hello-ja-3": "mou nigiyaka desu",
  "market-apples-ja-1": "akai ringo o",
  "market-apples-ja-2": "mittsu",
  "market-apples-ja-3": "kudasai",
  "market-thanks-ja-1": "arigatou gozaimasu",
  "market-thanks-ja-2": "oishisou desu",
  "rain-start-ja-1": "kaerimichi ni",
  "rain-start-ja-2": "ame ga",
  "rain-start-ja-3": "furihajimemashita",
  "rain-umbrella-ja-1": "chiisana akai kasa o",
  "rain-umbrella-ja-2": "hirakimashita",
  "rain-puddles-ja-1": "gaitou ga",
  "rain-puddles-ja-2": "mizutamari ni",
  "rain-puddles-ja-3": "utsutte imashita",
  "market-hello-ko-1": "joeun achimieyo",
  "market-hello-ko-2": "sijangeun",
  "market-hello-ko-3": "beolsseo bumbwyeoyo",
  "market-apples-ko-1": "ppalgan sagwa",
  "market-apples-ko-2": "se gae",
  "market-apples-ko-3": "juseyo",
  "market-thanks-ko-1": "gamsahamnida",
  "market-thanks-ko-2": "masisseo boyeoyo",
  "rain-start-ko-1": "jibe ganeun gire",
  "rain-start-ko-2": "biga ogi sijakaesseoyo",
  "rain-umbrella-ko-1": "jageun ppalgan usaneul",
  "rain-umbrella-ko-2": "pyeolchyeosseoyo",
  "rain-puddles-ko-1": "garodeungi",
  "rain-puddles-ko-2": "modeun murungdeongie",
  "rain-puddles-ko-3": "bichyeosseoyo",
  "market-hello-ta-1": "kālai vaṇakkam",
  "market-hello-ta-2": "cantai",
  "market-hello-ta-3": "ēṟkaṉavē paraparappāka irukkiṟatu",
  "market-apples-ta-1": "eṉakku",
  "market-apples-ta-2": "mūṉṟu civappu āppiḷkaḷ vēṇṭum",
  "market-apples-ta-3": "tayavuceytu",
  "market-thanks-ta-1": "naṉṟi",
  "market-thanks-ta-2": "avai cuvaiyākat terikiṉṟaṉa",
  "rain-start-ta-1": "vīṭṭiṟkuc cellum vaḻiyil",
  "rain-start-ta-2": "maḻai peyyat toṭaṅkiyatu",
  "rain-umbrella-ta-1": "eṉ ciṟiya civappu kuṭaiyait",
  "rain-umbrella-ta-2": "tiṟantēṉ",
  "rain-puddles-ta-1": "teruviḷakkukaḷ",
  "rain-puddles-ta-2": "ovvoru kuṭṭaiyilum",
  "rain-puddles-ta-3": "oḷirntaṉa",
};

const japaneseHiragana: Readonly<Record<string, string>> = {
  "market-hello-ja-1": "おはよう ございます",
  "market-hello-ja-2": "いちば は",
  "market-hello-ja-3": "もう にぎやか です",
  "market-apples-ja-1": "あかい りんご を",
  "market-apples-ja-2": "みっつ",
  "market-apples-ja-3": "ください",
  "market-thanks-ja-1": "ありがとうございます",
  "market-thanks-ja-2": "おいしそう です",
  "rain-start-ja-1": "かえりみち に",
  "rain-start-ja-2": "あめ が",
  "rain-start-ja-3": "ふりはじめました",
  "rain-umbrella-ja-1": "ちいさな あかい かさ を",
  "rain-umbrella-ja-2": "ひらきました",
  "rain-puddles-ja-1": "がいとう が",
  "rain-puddles-ja-2": "みずたまり に",
  "rain-puddles-ja-3": "うつって いました",
  "number-1-ja": "いち",
  "number-2-ja": "に",
  "number-3-ja": "さん",
  "number-4-ja": "よん",
  "number-5-ja": "ご",
  "number-6-ja": "ろく",
  "number-7-ja": "なな",
  "number-8-ja": "はち",
  "number-9-ja": "きゅう",
  "number-10-ja": "じゅう",
  "number-11-ja": "じゅういち",
  "number-12-ja": "じゅうに",
  "number-13-ja": "じゅうさん",
  "number-14-ja": "じゅうよん",
  "number-15-ja": "じゅうご",
  "number-16-ja": "じゅうろく",
  "number-17-ja": "じゅうなな",
  "number-18-ja": "じゅうはち",
  "number-19-ja": "じゅうきゅう",
  "number-20-ja": "にじゅう",
};

const englishWordRespellings: Readonly<Record<string, string>> = {
  already: "awl-red-ee",
  apples: "ap-uhlz",
  busy: "biz-ee",
  delicious: "duh-lish-us",
  eight: "ayt",
  eighteen: "ay-teen",
  eleven: "ih-lev-uhn",
  fifteen: "fif-teen",
  five: "faiv",
  four: "for",
  fourteen: "for-teen",
  good: "gud",
  market: "mar-kit",
  morning: "mor-ning",
  nine: "nain",
  nineteen: "nain-teen",
  one: "wun",
  please: "pleez",
  seven: "sev-uhn",
  seventeen: "sev-uhn-teen",
  six: "siks",
  sixteen: "siks-teen",
  thank: "thangk",
  thirteen: "thur-teen",
  three: "three",
  twelve: "twelv",
  twenty: "twen-tee",
  two: "too",
  umbrella: "um-brel-uh",
  you: "yoo",
};

const japaneseWordRespellings: Readonly<Record<string, string>> = {
  akai: "ah-kai",
  ame: "ah-meh",
  arigatou: "ah-ree-gah-toh",
  chiisana: "chee-sah-nah",
  desu: "deh-soo",
  ga: "gah",
  gaitou: "gai-toh",
  gozaimasu: "goh-zai-mah-soo",
  hirakimashita: "hee-rah-kee-mah-shee-tah",
  ichiba: "ee-chee-bah",
  imashita: "ee-mah-shee-tah",
  kaerimichi: "kah-eh-ree-mee-chee",
  kasa: "kah-sah",
  kudasai: "koo-dah-sai",
  mittsu: "meet-tsoo",
  mizutamari: "mee-zoo-tah-mah-ree",
  mou: "moh",
  ni: "nee",
  nigiyaka: "nee-gee-yah-kah",
  o: "oh",
  ohayou: "oh-hah-yoh",
  oishisou: "oh-ee-shee-soh",
  ringo: "reen-goh",
  utsutte: "oo-tsoot-teh",
  wa: "wah",
};

function cleanGuideText(text: string): string {
  return text
    .replace(/[.,!?;:。！？،؛]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/\p{M}+/gu, "").normalize("NFC");
}

function chinesePhraseReading(phrase: PhraseSegment, languageId: Extract<LanguageId, "zh" | "zht" | "yue">): string {
  return tokenizeLanguageStudyText(phrase.text, languageId)
    .flatMap((chunk) => chunk.type === "study" && chunk.token.romanization ? [chunk.token.romanization] : [])
    .join(" ");
}

function phraseRomanization(phrase: PhraseSegment, localization: LocalizedUnit): string | undefined {
  return phraseRomanizations[phrase.id]
    ?? (localization.segments.length === 1 ? localization.romanization : undefined);
}

function katakanaToHiragana(text: string): string {
  return [...text].map((character) => {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined || codePoint < 0x30a1 || codePoint > 0x30f6) return character;
    return String.fromCodePoint(codePoint - 0x60);
  }).join("");
}

function respellMandarinWord(word: string): string {
  return stripDiacritics(word.toLowerCase())
    .replace(/^zh/u, "j")
    .replace(/^q/u, "ch")
    .replace(/^x/u, "sh")
    .replace(/^c/u, "ts")
    .replace(/^z/u, "dz")
    .replace(/iang/gu, "yahng")
    .replace(/ang/gu, "ahng")
    .replace(/eng/gu, "ung")
    .replace(/ong/gu, "oong")
    .replace(/ao/gu, "ow")
    .replace(/ai/gu, "eye")
    .replace(/ei/gu, "ay")
    .replace(/ui/gu, "way")
    .replace(/uo/gu, "woh");
}

function respellCantoneseWord(word: string): string {
  return word.toLowerCase().replace(/[1-6]/gu, "")
    .replace(/^z/u, "dz")
    .replace(/^c/u, "ch")
    .replace(/^j/u, "y")
    .replace(/aa/gu, "ah")
    .replace(/oe/gu, "ur")
    .replace(/eo/gu, "uh")
    .replace(/ou/gu, "oh")
    .replace(/yu/gu, "oo");
}

function respellKoreanWord(word: string): string {
  return stripDiacritics(word.toLowerCase())
    .replace(/yeo/gu, "yuh")
    .replace(/eo/gu, "uh")
    .replace(/eu/gu, "oo")
    .replace(/ae/gu, "eh")
    .replace(/oe/gu, "weh")
    .replace(/ui/gu, "ee");
}

function respellSpanishWord(word: string): string {
  return word.toLowerCase()
    .replace(/ñ/gu, "ny")
    .replace(/ll/gu, "y")
    .replace(/qu/gu, "k")
    .replace(/j/gu, "h")
    .replace(/ge/gu, "he")
    .replace(/gi/gu, "hee")
    .replace(/ce/gu, "the")
    .replace(/ci/gu, "thee");
}

function respellFrenchWord(word: string): string {
  return stripDiacritics(word.toLowerCase())
    .replace(/eaux?$/u, "oh")
    .replace(/aux$/u, "oh")
    .replace(/oi/gu, "wah")
    .replace(/ou/gu, "oo")
    .replace(/on/gu, "ohn")
    .replace(/an|en/gu, "ahn")
    .replace(/ch/gu, "sh")
    .replace(/j/gu, "zh")
    .replace(/gn/gu, "ny")
    .replace(/er$/u, "ay")
    .replace(/[tdspx]$/u, "");
}

function respellMalayWord(word: string): string {
  return stripDiacritics(word.toLowerCase())
    .replace(/sy/gu, "sh")
    .replace(/c/gu, "ch")
    .replace(/j/gu, "j")
    .replace(/u/gu, "oo");
}

function respellWords(text: string, languageId: LanguageId): string {
  return cleanGuideText(text).split(" ").filter(Boolean).map((rawWord) => {
    const word = rawWord.toLowerCase();
    if (languageId === "en") return englishWordRespellings[word] ?? word;
    if (languageId === "zh" || languageId === "zht") return respellMandarinWord(word);
    if (languageId === "yue") return respellCantoneseWord(word);
    if (languageId === "ja") return japaneseWordRespellings[word] ?? stripDiacritics(word);
    if (languageId === "ko") return respellKoreanWord(word);
    if (languageId === "es") return respellSpanishWord(word);
    if (languageId === "fr") return respellFrenchWord(word);
    if (languageId === "ms") return respellMalayWord(word);
    return stripDiacritics(word.toLowerCase()).replace(/c/gu, "ch");
  }).join(" ");
}

export function getNativePronunciationGuide(
  languageId: LanguageId,
  phrase: PhraseSegment,
  localization: LocalizedUnit,
  token?: LanguageStudyToken,
): PronunciationGuide | null {
  if (!nativePronunciationSystems[languageId]) return null;
  if ((languageId === "zh" || languageId === "zht" || languageId === "yue") && token?.romanization) {
    return { text: token.romanization, scope: "token" };
  }
  if (languageId === "zh" || languageId === "zht" || languageId === "yue") {
    const text = chinesePhraseReading(phrase, languageId);
    const fallback = phraseRomanization(phrase, localization);
    return text || fallback ? { text: text || cleanGuideText(fallback ?? ""), scope: "phrase" } : null;
  }
  if (languageId === "ja") {
    const text = japaneseHiragana[phrase.id]
      ?? (localization.segments.length === 1 ? katakanaToHiragana(phrase.text) : undefined);
    return text ? { text, scope: "phrase" } : null;
  }
  const text = phraseRomanization(phrase, localization);
  return text ? { text: cleanGuideText(text), scope: "phrase" } : null;
}

export function getEnglishPronunciationGuide(
  languageId: LanguageId,
  phrase: PhraseSegment,
  localization: LocalizedUnit,
  token?: LanguageStudyToken,
): PronunciationGuide | null {
  let source: string | undefined;
  let scope: PronunciationGuide["scope"] = "phrase";
  if (token?.romanization) {
    source = token.romanization;
    scope = "token";
  } else if (token && ["en", "ms", "fr", "es"].includes(languageId)) {
    source = token.text;
    scope = "token";
  } else if (languageId === "zh" || languageId === "zht" || languageId === "yue") {
    source = chinesePhraseReading(phrase, languageId) || phraseRomanization(phrase, localization);
  } else if (["ja", "ko", "ta"].includes(languageId)) {
    source = phraseRomanization(phrase, localization);
  } else {
    source = phrase.text;
  }
  if (!source) return null;
  const text = respellWords(source, languageId);
  return text ? { text, scope } : null;
}
