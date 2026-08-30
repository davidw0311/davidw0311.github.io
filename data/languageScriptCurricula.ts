import type {
  ContentItem,
  CurriculumSectionId,
  LanguageId,
  LearningUnit,
} from "./languageLearning.ts";

const curriculumLanguageIds = ["en", "zh", "zht", "yue", "ja", "ko", "ms", "fr", "es", "ta"] as const satisfies readonly LanguageId[];

type CurriculumPrompt = {
  id: string;
  text: string;
  romanization: string;
  meaning: string;
};

type CurriculumLesson = {
  id: string;
  slug: string;
  title: string;
  sectionId: CurriculumSectionId;
  practiceLanguageId: Extract<LanguageId, "ja" | "ko">;
  estimatedMinutes?: number;
  prompts: readonly CurriculumPrompt[];
};

const prompt = (
  id: string,
  text: string,
  romanization: string,
  meaning: string,
): CurriculumPrompt => ({ id, text, romanization, meaning });

function curriculumUnit(
  lesson: CurriculumLesson,
  item: CurriculumPrompt,
): LearningUnit {
  const localizations = Object.fromEntries(curriculumLanguageIds.map((languageId) => {
    const isPracticeLanguage = languageId === lesson.practiceLanguageId;
    const text = isPracticeLanguage ? item.text : item.meaning;
    const romanization = isPracticeLanguage ? item.romanization : item.meaning;
    return [languageId, {
      text,
      natural: item.meaning,
      literal: item.meaning,
      romanization,
      segments: [{
        id: `${lesson.id}-${item.id}-${languageId}`,
        text,
        translation: item.meaning,
      }],
    }];
  })) as LearningUnit["localizations"];

  return {
    id: `${lesson.id}-${item.id}`,
    localizations,
  };
}

function curriculumContent(lesson: CurriculumLesson): ContentItem {
  return {
    id: lesson.id,
    slug: lesson.slug,
    type: "script_drill",
    tier: 0,
    sectionId: lesson.sectionId,
    practiceLanguageIds: [lesson.practiceLanguageId],
    audioSource: "browser",
    title: lesson.title,
    description: "Practice one character set and a few short words.",
    estimatedMinutes: lesson.estimatedMinutes ?? 3,
    units: lesson.prompts.map((item) => curriculumUnit(lesson, item)),
  };
}

export const modernHiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
export const modernKatakana = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
export const modernHangulConsonants = "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉ";
export const modernHangulVowels = "ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔㅚㅟㅢㅒㅖㅘㅙㅝㅞ";

type KanaReading = readonly [slug: string, reading: string];
type JapaneseWord = readonly [slug: string, text: string, reading: string, meaning: string];

const basicKanaReadings: readonly KanaReading[] = [
  ["a", "a"], ["i", "i"], ["u", "u"], ["e", "e"], ["o", "o"],
  ["ka", "ka"], ["ki", "ki"], ["ku", "ku"], ["ke", "ke"], ["ko", "ko"],
  ["sa", "sa"], ["shi", "shi"], ["su", "su"], ["se", "se"], ["so", "so"],
  ["ta", "ta"], ["chi", "chi"], ["tsu", "tsu"], ["te", "te"], ["to", "to"],
  ["na", "na"], ["ni", "ni"], ["nu", "nu"], ["ne", "ne"], ["no", "no"],
  ["ha", "ha"], ["hi", "hi"], ["fu", "fu"], ["he", "he"], ["ho", "ho"],
  ["ma", "ma"], ["mi", "mi"], ["mu", "mu"], ["me", "me"], ["mo", "mo"],
  ["ya", "ya"], ["yu", "yu"], ["yo", "yo"],
  ["ra", "ra"], ["ri", "ri"], ["ru", "ru"], ["re", "re"], ["ro", "ro"],
  ["wa", "wa"], ["wo", "o (wo)"], ["n", "n"],
];

const variantKanaReadings: readonly KanaReading[] = [
  ["ga", "ga"], ["gi", "gi"], ["gu", "gu"], ["ge", "ge"], ["go", "go"],
  ["za", "za"], ["ji", "ji"], ["zu", "zu"], ["ze", "ze"], ["zo", "zo"],
  ["da", "da"], ["dji", "ji (di)"], ["dzu", "zu (du)"], ["de", "de"], ["do", "do"],
  ["ba", "ba"], ["bi", "bi"], ["bu", "bu"], ["be", "be"], ["bo", "bo"],
  ["pa", "pa"], ["pi", "pi"], ["pu", "pu"], ["pe", "pe"], ["po", "po"],
];

const smallHiraganaReadings: readonly KanaReading[] = [
  ["small-a", "small a"], ["small-i", "small i"], ["small-u", "small u"],
  ["small-e", "small e"], ["small-o", "small o"], ["small-tsu", "small tsu"],
  ["small-ya", "small ya"], ["small-yu", "small yu"], ["small-yo", "small yo"],
  ["small-wa", "small wa"],
];

const smallKatakanaReadings: readonly KanaReading[] = [
  ...smallHiraganaReadings,
  ["small-ka", "small ka"], ["small-ke", "small ke"],
  ["vu", "vu"], ["long-vowel", "long vowel mark"],
];

export const hiraganaCurriculumCharacters = `${modernHiragana}がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉっゃゅょゎ`;
export const katakanaCurriculumCharacters = `${modernKatakana}ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポァィゥェォッャュョヮヵヶヴー`;

const hiraganaWords: readonly JapaneseWord[] = [
  ["sea", "うみ", "umi", "sea"], ["house", "いえ", "ie", "house"],
  ["cat", "ねこ", "neko", "cat"], ["dog", "いぬ", "inu", "dog"],
  ["sushi", "すし", "sushi", "sushi"], ["sky", "そら", "sora", "sky"],
  ["bird", "とり", "tori", "bird"], ["flower", "はな", "hana", "flower"],
  ["boat", "ふね", "fune", "boat"], ["mountain", "やま", "yama", "mountain"],
  ["dream", "ゆめ", "yume", "dream"], ["night", "よる", "yoru", "night"],
  ["ears", "みみ", "mimi", "ears"], ["beans", "まめ", "mame", "beans"],
  ["book", "ほん", "hon", "book"], ["water", "みず", "mizu", "water"],
  ["bread", "ぱん", "pan", "bread"], ["key", "かぎ", "kagi", "key"],
  ["shoes", "くつ", "kutsu", "shoes"], ["morning", "あさ", "asa", "morning"],
];

const katakanaWords: readonly JapaneseWord[] = [
  ["bread", "パン", "pan", "bread"], ["bus", "バス", "basu", "bus"],
  ["pen", "ペン", "pen", "pen"], ["door", "ドア", "doa", "door"],
  ["camera", "カメラ", "kamera", "camera"], ["television", "テレビ", "terebi", "television"],
  ["radio", "ラジオ", "rajio", "radio"], ["hotel", "ホテル", "hoteru", "hotel"],
  ["tomato", "トマト", "tomato", "tomato"], ["piano", "ピアノ", "piano", "piano"],
  ["memo", "メモ", "memo", "memo"], ["zero", "ゼロ", "zero", "zero"],
  ["cocoa", "ココア", "kokoa", "cocoa"], ["cake", "ケーキ", "keeki", "cake"],
  ["soup", "スープ", "suupu", "soup"], ["shirt", "シャツ", "shatsu", "shirt"],
  ["chocolate", "チョコ", "choko", "chocolate"], ["news", "ニュース", "nyuusu", "news"],
  ["notebook", "ノート", "nooto", "notebook"], ["taxi", "タクシー", "takushii", "taxi"],
];

function kanaCharacterLessons(
  script: "hiragana" | "katakana",
  characters: string,
  readings: readonly KanaReading[],
  sectionId: CurriculumSectionId,
): CurriculumLesson[] {
  const scriptName = script === "hiragana" ? "Hiragana" : "Katakana";
  return [...characters].map((character, index) => {
    const [slug, reading] = readings[index];
    return {
      id: `ja-${script}-${slug}-v2`,
      slug: `ja-${script}-${slug}`,
      title: character,
      sectionId,
      practiceLanguageId: "ja",
      estimatedMinutes: 1,
      prompts: [prompt("character", character, reading, `${scriptName} ${reading}`)],
    };
  });
}

function japaneseWordLessons(
  script: "hiragana" | "katakana",
  words: readonly JapaneseWord[],
  sectionId: CurriculumSectionId,
): CurriculumLesson[] {
  return words.map(([slug, text, reading, meaning]) => ({
    id: `ja-${script}-word-${slug}-v2`,
    slug: `ja-${script}-word-${slug}`,
    title: text,
    sectionId,
    practiceLanguageId: "ja",
    estimatedMinutes: 1,
    prompts: [prompt("word", text, reading, meaning)],
  }));
}

const japaneseLessons: readonly CurriculumLesson[] = [
  ...kanaCharacterLessons("hiragana", modernHiragana, basicKanaReadings, "ja-hiragana"),
  ...kanaCharacterLessons(
    "hiragana",
    hiraganaCurriculumCharacters.slice([...modernHiragana].length),
    [...variantKanaReadings, ...smallHiraganaReadings],
    "ja-hiragana-variants",
  ),
  ...japaneseWordLessons("hiragana", hiraganaWords, "ja-hiragana-words"),
  ...kanaCharacterLessons("katakana", modernKatakana, basicKanaReadings, "ja-katakana"),
  ...kanaCharacterLessons(
    "katakana",
    katakanaCurriculumCharacters.slice([...modernKatakana].length),
    [...variantKanaReadings, ...smallKatakanaReadings],
    "ja-katakana-variants",
  ),
  ...japaneseWordLessons("katakana", katakanaWords, "ja-katakana-words"),
];

const koreanLessons: readonly CurriculumLesson[] = [
  {
    id: "ko-jamo-consonants-1-v1", slug: "ko-jamo-consonants-1", title: "ㄱ・ㄴ・ㄷ・ㄹ・ㅁ", sectionId: "ko-jamo", practiceLanguageId: "ko",
    prompts: [
      prompt("characters", "ㄱ・ㄴ・ㄷ・ㄹ・ㅁ", "g k, n, d t, r l, m", "basic consonants g, n, d, r, m"),
      prompt("ga", "가", "ga", "ga syllable"),
      prompt("na", "나", "na", "I or me"),
      prompt("maeum", "마음", "maeum", "heart or mind"),
    ],
  },
  {
    id: "ko-jamo-consonants-2-v1", slug: "ko-jamo-consonants-2", title: "ㅂ・ㅅ・ㅇ・ㅈ・ㅊ", sectionId: "ko-jamo", practiceLanguageId: "ko",
    prompts: [
      prompt("characters", "ㅂ・ㅅ・ㅇ・ㅈ・ㅊ", "b p, s, silent ng, j, ch", "basic consonants b, s, ng, j, ch"),
      prompt("person", "사람", "saram", "person"),
      prompt("house", "집", "jip", "house"),
      prompt("morning", "아침", "achim", "morning"),
    ],
  },
  {
    id: "ko-jamo-aspirated-v1", slug: "ko-jamo-aspirated", title: "ㅋ・ㅌ・ㅍ・ㅎ", sectionId: "ko-jamo", practiceLanguageId: "ko",
    prompts: [
      prompt("characters", "ㅋ・ㅌ・ㅍ・ㅎ", "k, t, p, h", "aspirated consonants k, t, p, h"),
      prompt("nose", "코", "ko", "nose"),
      prompt("chin", "턱", "teok", "chin"),
      prompt("sky", "하늘", "haneul", "sky"),
    ],
  },
  {
    id: "ko-jamo-tense-v1", slug: "ko-jamo-tense", title: "ㄲ・ㄸ・ㅃ・ㅆ・ㅉ", sectionId: "ko-jamo", practiceLanguageId: "ko",
    prompts: [
      prompt("characters", "ㄲ・ㄸ・ㅃ・ㅆ・ㅉ", "kk, tt, pp, ss, jj", "tense consonants kk, tt, pp, ss, jj"),
      prompt("flower", "꽃", "kkot", "flower"),
      prompt("daughter", "딸", "ttal", "daughter"),
      prompt("salty", "짜다", "jjada", "salty"),
    ],
  },
  {
    id: "ko-jamo-vowels-1-v1", slug: "ko-jamo-vowels-1", title: "ㅏ・ㅑ・ㅓ・ㅕ・ㅗ", sectionId: "ko-jamo", practiceLanguageId: "ko",
    prompts: [
      prompt("characters", "ㅏ・ㅑ・ㅓ・ㅕ・ㅗ", "a, ya, eo, yeo, o", "vowels a, ya, eo, yeo, o"),
      prompt("child", "아이", "ai", "child"),
      prompt("where", "어디", "eodi", "where"),
      prompt("cucumber", "오이", "oi", "cucumber"),
    ],
  },
  {
    id: "ko-jamo-vowels-2-v1", slug: "ko-jamo-vowels-2", title: "ㅛ・ㅜ・ㅠ・ㅡ・ㅣ", sectionId: "ko-jamo", practiceLanguageId: "ko",
    prompts: [
      prompt("characters", "ㅛ・ㅜ・ㅠ・ㅡ・ㅣ", "yo, u, yu, eu, i", "vowels yo, u, yu, eu, i"),
      prompt("milk", "우유", "uyu", "milk"),
      prompt("reason", "이유", "iyu", "reason"),
      prompt("we", "우리", "uri", "we or our"),
    ],
  },
  {
    id: "ko-jamo-vowels-3-v1", slug: "ko-jamo-vowels-3", title: "ㅐ・ㅔ・ㅚ・ㅟ・ㅢ", sectionId: "ko-jamo", practiceLanguageId: "ko",
    prompts: [
      prompt("characters", "ㅐ・ㅔ・ㅚ・ㅟ・ㅢ", "ae, e, oe, wi, ui", "vowels ae, e, oe, wi, ui"),
      prompt("dog", "개", "gae", "dog"),
      prompt("above", "위", "wi", "above"),
      prompt("chair", "의자", "uija", "chair"),
    ],
  },
  {
    id: "ko-jamo-vowels-4-v1", slug: "ko-jamo-vowels-4", title: "ㅒ・ㅖ・ㅘ・ㅙ・ㅝ・ㅞ", sectionId: "ko-jamo", practiceLanguageId: "ko",
    prompts: [
      prompt("characters", "ㅒ・ㅖ・ㅘ・ㅙ・ㅝ・ㅞ", "yae, ye, wa, wae, wo, we", "compound vowels yae, ye, wa, wae, wo, we"),
      prompt("conversation", "대화", "daehwa", "conversation"),
      prompt("why", "왜", "wae", "why"),
      prompt("garden", "정원", "jeongwon", "garden"),
    ],
  },
  {
    id: "ko-blocks-open-v1", slug: "ko-blocks-open", title: "가・나・다・라・마", sectionId: "ko-blocks", practiceLanguageId: "ko",
    prompts: [
      prompt("blocks", "가・나・다・라・마", "ga na da ra ma", "open syllable blocks"),
      prompt("tree", "나무", "namu", "tree"),
      prompt("sea", "바다", "bada", "sea"),
      prompt("head", "머리", "meori", "head"),
    ],
  },
  {
    id: "ko-blocks-more-v1", slug: "ko-blocks-more", title: "바・사・아・자・차", sectionId: "ko-blocks", practiceLanguageId: "ko",
    prompts: [
      prompt("blocks", "바・사・아・자・차", "ba sa a ja cha", "more open syllable blocks"),
      prompt("apple", "사과", "sagwa", "apple"),
      prompt("baby", "아기", "agi", "baby"),
      prompt("car", "자동차", "jadongcha", "car"),
    ],
  },
  {
    id: "ko-blocks-final-1-v1", slug: "ko-blocks-final-1", title: "각・난・달・밤・공", sectionId: "ko-blocks", practiceLanguageId: "ko",
    prompts: [
      prompt("blocks", "각・난・달・밤・공", "gak nan dal bam gong", "syllables with final consonants"),
      prompt("moon", "달", "dal", "moon"),
      prompt("night", "밤", "bam", "night"),
      prompt("park", "공원", "gongwon", "park"),
    ],
  },
  {
    id: "ko-blocks-final-2-v1", slug: "ko-blocks-final-2", title: "국・눈・옷・집・꽃", sectionId: "ko-blocks", practiceLanguageId: "ko",
    prompts: [
      prompt("blocks", "국・눈・옷・집・꽃", "guk nun ot jip kkot", "common final consonant patterns"),
      prompt("eyes", "눈", "nun", "eyes or snow"),
      prompt("clothes", "옷", "ot", "clothes"),
      prompt("house", "집", "jip", "house"),
    ],
  },
  {
    id: "ko-blocks-clusters-v1", slug: "ko-blocks-clusters", title: "읽・없・앉・닭・삶", sectionId: "ko-blocks", practiceLanguageId: "ko",
    prompts: [
      prompt("blocks", "읽・없・앉・닭・삶", "ik eop an dak sam", "syllables with final consonant clusters"),
      prompt("read", "읽다", "ikda", "to read"),
      prompt("not-have", "없다", "eopda", "to not have"),
      prompt("sit", "앉다", "anda", "to sit"),
    ],
  },
  {
    id: "ko-words-people-v1", slug: "ko-words-people", title: "나・너・우리・사람", sectionId: "ko-words", practiceLanguageId: "ko",
    prompts: [
      prompt("me", "나", "na", "I or me"),
      prompt("you", "너", "neo", "you"),
      prompt("we", "우리", "uri", "we or our"),
      prompt("person", "사람", "saram", "person"),
    ],
  },
  {
    id: "ko-words-places-v1", slug: "ko-words-places", title: "집・학교・가게・공원", sectionId: "ko-words", practiceLanguageId: "ko",
    prompts: [
      prompt("home", "집", "jip", "home"),
      prompt("school", "학교", "hakgyo", "school"),
      prompt("shop", "가게", "gage", "shop"),
      prompt("park", "공원", "gongwon", "park"),
    ],
  },
  {
    id: "ko-words-food-v1", slug: "ko-words-food", title: "밥・물・우유・사과", sectionId: "ko-words", practiceLanguageId: "ko",
    prompts: [
      prompt("rice", "밥", "bap", "rice or meal"),
      prompt("water", "물", "mul", "water"),
      prompt("milk", "우유", "uyu", "milk"),
      prompt("apple", "사과", "sagwa", "apple"),
    ],
  },
  {
    id: "ko-words-greetings-v1", slug: "ko-words-greetings", title: "안녕・고마워・네・아니요", sectionId: "ko-words", practiceLanguageId: "ko",
    prompts: [
      prompt("hello", "안녕", "annyeong", "hello"),
      prompt("thanks", "고마워", "gomawo", "thank you"),
      prompt("yes", "네", "ne", "yes"),
      prompt("no", "아니요", "aniyo", "no"),
    ],
  },
  {
    id: "ko-words-time-v1", slug: "ko-words-time", title: "오늘・내일・지금・아침", sectionId: "ko-words", practiceLanguageId: "ko",
    prompts: [
      prompt("today", "오늘", "oneul", "today"),
      prompt("tomorrow", "내일", "naeil", "tomorrow"),
      prompt("now", "지금", "jigeum", "now"),
      prompt("morning", "아침", "achim", "morning"),
    ],
  },
];

export const scriptCurriculumItems: ContentItem[] = [
  ...japaneseLessons.map(curriculumContent),
  ...koreanLessons.map(curriculumContent),
];
