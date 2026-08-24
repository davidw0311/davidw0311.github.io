export const languageIds = ["en", "ja", "zh", "es"] as const;

export type LanguageId = (typeof languageIds)[number];
export type ContentType = "story" | "number_drill";
export type CompletionStatus = "not_started" | "passed" | "skipped";

export type LanguageConfig = {
  id: LanguageId;
  locale: string;
  nameEnglish: string;
  nameNative: string;
  script: string;
  supportsRomanization: boolean;
  toneSensitive: boolean;
};

export type PhraseSegment = {
  id: string;
  text: string;
  translation: string;
};

export type LocalizedUnit = {
  text: string;
  natural: string;
  literal?: string;
  romanization?: string;
  segments: PhraseSegment[];
};

export type LearningUnit = {
  id: string;
  number?: number;
  localizations: Record<LanguageId, LocalizedUnit>;
};

export type ContentItem = {
  id: string;
  slug: string;
  type: ContentType;
  tier: 0 | 1;
  title: string;
  description: string;
  estimatedMinutes: number;
  units: LearningUnit[];
};

export type LocalProgress = {
  xp: number;
  completed: Record<string, CompletionStatus>;
  savedPhraseIds: string[];
  practiceLanguageId: LanguageId;
  supportLanguageId: LanguageId;
  displayLanguageIds: LanguageId[];
  showRomanization: boolean;
};

export const languages: Record<LanguageId, LanguageConfig> = {
  en: {
    id: "en",
    locale: "en-US",
    nameEnglish: "English",
    nameNative: "English",
    script: "Latin",
    supportsRomanization: false,
    toneSensitive: false,
  },
  ja: {
    id: "ja",
    locale: "ja-JP",
    nameEnglish: "Japanese",
    nameNative: "日本語",
    script: "Japanese",
    supportsRomanization: true,
    toneSensitive: false,
  },
  zh: {
    id: "zh",
    locale: "zh-CN",
    nameEnglish: "Mandarin",
    nameNative: "普通话",
    script: "Simplified Chinese",
    supportsRomanization: true,
    toneSensitive: true,
  },
  es: {
    id: "es",
    locale: "es-ES",
    nameEnglish: "Spanish",
    nameNative: "Español",
    script: "Latin",
    supportsRomanization: false,
    toneSensitive: false,
  },
};

const unit = (
  id: string,
  localizations: LearningUnit["localizations"],
  number?: number,
): LearningUnit => ({ id, localizations, number });

export const contentItems: ContentItem[] = [
  {
    id: "story-market-morning-v1",
    slug: "market-morning",
    type: "story",
    tier: 1,
    title: "A morning at the market",
    description: "Three useful sentences for buying fruit and greeting a shopkeeper.",
    estimatedMinutes: 4,
    units: [
      unit("market-hello", {
        en: {
          text: "Good morning. The market is already busy.",
          natural: "Good morning. The market is already busy.",
          segments: [
            { id: "market-hello-en-1", text: "Good morning.", translation: "A morning greeting" },
            { id: "market-hello-en-2", text: "The market is already busy.", translation: "Many people are at the market now" },
          ],
        },
        ja: {
          text: "おはようございます。市場はもう賑やかです。",
          natural: "Good morning. The market is already busy.",
          literal: "Good morning. As for the market, it is already lively.",
          romanization: "Ohayou gozaimasu. Ichiba wa mou nigiyaka desu.",
          segments: [
            { id: "market-hello-ja-1", text: "おはようございます。", translation: "Good morning." },
            { id: "market-hello-ja-2", text: "市場は", translation: "As for the market" },
            { id: "market-hello-ja-3", text: "もう賑やかです。", translation: "it is already busy." },
          ],
        },
        zh: {
          text: "早上好。市场已经很热闹了。",
          natural: "Good morning. The market is already busy.",
          literal: "Morning good. The market already is very lively.",
          romanization: "Zǎoshang hǎo. Shìchǎng yǐjīng hěn rènào le.",
          segments: [
            { id: "market-hello-zh-1", text: "早上好。", translation: "Good morning." },
            { id: "market-hello-zh-2", text: "市场", translation: "market" },
            { id: "market-hello-zh-3", text: "已经很热闹了。", translation: "is already very busy." },
          ],
        },
        es: {
          text: "Buenos días. El mercado ya está animado.",
          natural: "Good morning. The market is already busy.",
          literal: "Good days. The market is already lively.",
          segments: [
            { id: "market-hello-es-1", text: "Buenos días.", translation: "Good morning." },
            { id: "market-hello-es-2", text: "El mercado", translation: "The market" },
            { id: "market-hello-es-3", text: "ya está animado.", translation: "is already lively." },
          ],
        },
      }),
      unit("market-apples", {
        en: {
          text: "I would like three red apples, please.",
          natural: "I would like three red apples, please.",
          segments: [
            { id: "market-apples-en-1", text: "I would like", translation: "A polite way to ask for something" },
            { id: "market-apples-en-2", text: "three red apples", translation: "The item and quantity" },
            { id: "market-apples-en-3", text: "please.", translation: "A polite ending" },
          ],
        },
        ja: {
          text: "赤いりんごを三つください。",
          natural: "Three red apples, please.",
          literal: "Red apples, three, please give me.",
          romanization: "Akai ringo o mittsu kudasai.",
          segments: [
            { id: "market-apples-ja-1", text: "赤いりんごを", translation: "red apples" },
            { id: "market-apples-ja-2", text: "三つ", translation: "three items" },
            { id: "market-apples-ja-3", text: "ください。", translation: "please give me." },
          ],
        },
        zh: {
          text: "请给我三个红苹果。",
          natural: "Three red apples, please.",
          literal: "Please give me three red apples.",
          romanization: "Qǐng gěi wǒ sān ge hóng píngguǒ.",
          segments: [
            { id: "market-apples-zh-1", text: "请给我", translation: "please give me" },
            { id: "market-apples-zh-2", text: "三个", translation: "three" },
            { id: "market-apples-zh-3", text: "红苹果。", translation: "red apples." },
          ],
        },
        es: {
          text: "Quisiera tres manzanas rojas, por favor.",
          natural: "I would like three red apples, please.",
          literal: "I would want three red apples, please.",
          segments: [
            { id: "market-apples-es-1", text: "Quisiera", translation: "I would like" },
            { id: "market-apples-es-2", text: "tres manzanas rojas", translation: "three red apples" },
            { id: "market-apples-es-3", text: "por favor.", translation: "please." },
          ],
        },
      }),
      unit("market-thanks", {
        en: {
          text: "Thank you. They look delicious.",
          natural: "Thank you. They look delicious.",
          segments: [
            { id: "market-thanks-en-1", text: "Thank you.", translation: "An expression of thanks" },
            { id: "market-thanks-en-2", text: "They look delicious.", translation: "They appear tasty" },
          ],
        },
        ja: {
          text: "ありがとうございます。おいしそうです。",
          natural: "Thank you. They look delicious.",
          literal: "Thank you. They seem delicious.",
          romanization: "Arigatou gozaimasu. Oishisou desu.",
          segments: [
            { id: "market-thanks-ja-1", text: "ありがとうございます。", translation: "Thank you." },
            { id: "market-thanks-ja-2", text: "おいしそうです。", translation: "They look delicious." },
          ],
        },
        zh: {
          text: "谢谢。看起来很好吃。",
          natural: "Thank you. They look delicious.",
          literal: "Thanks. They look very good to eat.",
          romanization: "Xièxie. Kàn qǐlái hěn hǎochī.",
          segments: [
            { id: "market-thanks-zh-1", text: "谢谢。", translation: "Thank you." },
            { id: "market-thanks-zh-2", text: "看起来很好吃。", translation: "They look delicious." },
          ],
        },
        es: {
          text: "Gracias. Parecen deliciosas.",
          natural: "Thank you. They look delicious.",
          literal: "Thanks. They seem delicious.",
          segments: [
            { id: "market-thanks-es-1", text: "Gracias.", translation: "Thank you." },
            { id: "market-thanks-es-2", text: "Parecen deliciosas.", translation: "They look delicious." },
          ],
        },
      }),
    ],
  },
  {
    id: "story-rainy-walk-v1",
    slug: "rainy-walk",
    type: "story",
    tier: 1,
    title: "A rainy walk home",
    description: "A short weather story with everyday movement and observation.",
    estimatedMinutes: 3,
    units: [
      unit("rain-start", {
        en: { text: "It started raining on my way home.", natural: "It started raining on my way home.", segments: [{ id: "rain-start-en-1", text: "It started raining", translation: "The rain began" }, { id: "rain-start-en-2", text: "on my way home.", translation: "while I was going home" }] },
        ja: { text: "帰り道に雨が降り始めました。", natural: "It started raining on my way home.", literal: "On the road home, rain began to fall.", romanization: "Kaerimichi ni ame ga furihajimemashita.", segments: [{ id: "rain-start-ja-1", text: "帰り道に", translation: "on the way home" }, { id: "rain-start-ja-2", text: "雨が", translation: "rain" }, { id: "rain-start-ja-3", text: "降り始めました。", translation: "started to fall." }] },
        zh: { text: "回家的路上下起了雨。", natural: "It started raining on my way home.", literal: "On the road going home, rain began.", romanization: "Huí jiā de lùshang xià qǐ le yǔ.", segments: [{ id: "rain-start-zh-1", text: "回家的路上", translation: "on the way home" }, { id: "rain-start-zh-2", text: "下起了雨。", translation: "it started raining." }] },
        es: { text: "Empezó a llover de camino a casa.", natural: "It started raining on my way home.", literal: "It began to rain on the way home.", segments: [{ id: "rain-start-es-1", text: "Empezó a llover", translation: "It started raining" }, { id: "rain-start-es-2", text: "de camino a casa.", translation: "on the way home." }] },
      }),
      unit("rain-umbrella", {
        en: { text: "I opened my small red umbrella.", natural: "I opened my small red umbrella.", segments: [{ id: "rain-umbrella-en-1", text: "I opened", translation: "I unfolded" }, { id: "rain-umbrella-en-2", text: "my small red umbrella.", translation: "the umbrella that belongs to me" }] },
        ja: { text: "小さな赤い傘を開きました。", natural: "I opened my small red umbrella.", literal: "A small red umbrella, I opened.", romanization: "Chiisana akai kasa o hirakimashita.", segments: [{ id: "rain-umbrella-ja-1", text: "小さな赤い傘を", translation: "a small red umbrella" }, { id: "rain-umbrella-ja-2", text: "開きました。", translation: "I opened." }] },
        zh: { text: "我打开了红色的小雨伞。", natural: "I opened my small red umbrella.", literal: "I opened the red small umbrella.", romanization: "Wǒ dǎkāi le hóngsè de xiǎo yǔsǎn.", segments: [{ id: "rain-umbrella-zh-1", text: "我打开了", translation: "I opened" }, { id: "rain-umbrella-zh-2", text: "红色的小雨伞。", translation: "the small red umbrella." }] },
        es: { text: "Abrí mi pequeño paraguas rojo.", natural: "I opened my small red umbrella.", literal: "I opened my little red umbrella.", segments: [{ id: "rain-umbrella-es-1", text: "Abrí", translation: "I opened" }, { id: "rain-umbrella-es-2", text: "mi pequeño paraguas rojo.", translation: "my small red umbrella." }] },
      }),
      unit("rain-puddles", {
        en: { text: "The street lights shone in every puddle.", natural: "The street lights shone in every puddle.", segments: [{ id: "rain-puddles-en-1", text: "The street lights", translation: "Lights along the road" }, { id: "rain-puddles-en-2", text: "shone in every puddle.", translation: "were reflected in all the puddles" }] },
        ja: { text: "街灯が水たまりに映っていました。", natural: "The street lights were reflected in the puddles.", literal: "Street lights were reflected in puddles.", romanization: "Gaitou ga mizutamari ni utsutte imashita.", segments: [{ id: "rain-puddles-ja-1", text: "街灯が", translation: "the street lights" }, { id: "rain-puddles-ja-2", text: "水たまりに", translation: "in the puddles" }, { id: "rain-puddles-ja-3", text: "映っていました。", translation: "were reflected." }] },
        zh: { text: "路灯映在每个水洼里。", natural: "The street lights were reflected in every puddle.", literal: "Road lights reflected inside every puddle.", romanization: "Lùdēng yìng zài měi ge shuǐwā lǐ.", segments: [{ id: "rain-puddles-zh-1", text: "路灯", translation: "street lights" }, { id: "rain-puddles-zh-2", text: "映在", translation: "were reflected in" }, { id: "rain-puddles-zh-3", text: "每个水洼里。", translation: "every puddle." }] },
        es: { text: "Las farolas brillaban en cada charco.", natural: "The street lights shone in every puddle.", literal: "The street lamps shone in each puddle.", segments: [{ id: "rain-puddles-es-1", text: "Las farolas", translation: "The street lights" }, { id: "rain-puddles-es-2", text: "brillaban", translation: "were shining" }, { id: "rain-puddles-es-3", text: "en cada charco.", translation: "in every puddle." }] },
      }),
    ],
  },
  {
    id: "numbers-one-to-five-v1",
    slug: "one-to-five",
    type: "number_drill",
    tier: 0,
    title: "Count from one to five",
    description: "Build a quick speaking rhythm with the first five numbers.",
    estimatedMinutes: 2,
    units: [
      [1, "one", "一", "ichi", "一", "yī", "uno"],
      [2, "two", "二", "ni", "二", "èr", "dos"],
      [3, "three", "三", "san", "三", "sān", "tres"],
      [4, "four", "四", "yon", "四", "sì", "cuatro"],
      [5, "five", "五", "go", "五", "wǔ", "cinco"],
    ].map(([number, english, japanese, japaneseReading, mandarin, pinyin, spanish]) => unit(
      `number-${number}`,
      {
        en: { text: String(english), natural: String(english), segments: [{ id: `number-${number}-en`, text: String(english), translation: String(number) }] },
        ja: { text: String(japanese), natural: String(english), literal: String(number), romanization: String(japaneseReading), segments: [{ id: `number-${number}-ja`, text: String(japanese), translation: String(english) }] },
        zh: { text: String(mandarin), natural: String(english), literal: String(number), romanization: String(pinyin), segments: [{ id: `number-${number}-zh`, text: String(mandarin), translation: String(english) }] },
        es: { text: String(spanish), natural: String(english), literal: String(number), segments: [{ id: `number-${number}-es`, text: String(spanish), translation: String(english) }] },
      },
      Number(number),
    )),
  },
];

export const defaultLocalProgress: LocalProgress = {
  xp: 0,
  completed: {},
  savedPhraseIds: [],
  practiceLanguageId: "ja",
  supportLanguageId: "en",
  displayLanguageIds: ["ja", "en"],
  showRomanization: true,
};

export function preferredSupportLanguage(
  practiceLanguageId: LanguageId,
  currentSupportLanguageId?: LanguageId,
): LanguageId {
  if (currentSupportLanguageId && currentSupportLanguageId !== practiceLanguageId) {
    return currentSupportLanguageId;
  }
  return practiceLanguageId === "en" ? "ja" : "en";
}

export function ensureLearningLanguages(
  displayLanguageIds: LanguageId[],
  practiceLanguageId: LanguageId,
  supportLanguageId: LanguageId,
) {
  return Array.from(new Set([practiceLanguageId, supportLanguageId, ...displayLanguageIds]));
}

export function normalizeSpeech(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}\s]/gu, "");
}

function levenshteinDistance(left: string, right: string) {
  const leftCharacters = Array.from(left);
  const rightCharacters = Array.from(right);
  const previous = rightCharacters.map((_, index) => index + 1);
  previous.unshift(0);

  for (let leftIndex = 1; leftIndex <= leftCharacters.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= rightCharacters.length; rightIndex += 1) {
      const substitutionCost = leftCharacters[leftIndex - 1] === rightCharacters[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[rightCharacters.length];
}

export function scoreTranscript(reference: string, transcript: string) {
  const normalizedReference = normalizeSpeech(reference);
  const normalizedTranscript = normalizeSpeech(transcript);
  const longest = Math.max(Array.from(normalizedReference).length, Array.from(normalizedTranscript).length);
  if (longest === 0) return 0;
  const distance = levenshteinDistance(normalizedReference, normalizedTranscript);
  return Math.max(0, Math.round((1 - distance / longest) * 100));
}

export function unitProgressKey(contentId: string, unitId: string, languageId: LanguageId) {
  return `${contentId}:${unitId}:${languageId}`;
}
