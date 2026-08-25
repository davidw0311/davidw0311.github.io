export const languageIds = ["en", "zh", "zht", "yue", "ja", "ko", "ms", "fr", "es", "ta"] as const;

export type LanguageId = (typeof languageIds)[number];
export type ContentType = "story" | "number_drill";
export type CompletionStatus = "not_started" | "passed" | "skipped";
export type PronunciationMode = "off" | "native" | "english";

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
  systemLanguageId: LanguageId;
  practiceLanguageId: LanguageId;
  supportLanguageId: LanguageId;
  displayLanguageIds: LanguageId[];
  showRomanization: boolean;
  pronunciationModes: Partial<Record<LanguageId, PronunciationMode>>;
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
    nameEnglish: "Mandarin (Simplified)",
    nameNative: "普通话（简体）",
    script: "Simplified Chinese",
    supportsRomanization: true,
    toneSensitive: true,
  },
  zht: {
    id: "zht",
    locale: "zh-TW",
    nameEnglish: "Mandarin (Traditional)",
    nameNative: "普通話（繁體）",
    script: "Traditional Chinese",
    supportsRomanization: true,
    toneSensitive: true,
  },
  yue: {
    id: "yue",
    locale: "zh-HK",
    nameEnglish: "Cantonese",
    nameNative: "廣東話",
    script: "Traditional Chinese",
    supportsRomanization: true,
    toneSensitive: true,
  },
  ko: {
    id: "ko",
    locale: "ko-KR",
    nameEnglish: "Korean",
    nameNative: "한국어",
    script: "Hangul",
    supportsRomanization: true,
    toneSensitive: false,
  },
  ms: {
    id: "ms",
    locale: "ms-MY",
    nameEnglish: "Malay",
    nameNative: "Bahasa Melayu",
    script: "Latin",
    supportsRomanization: false,
    toneSensitive: false,
  },
  fr: {
    id: "fr",
    locale: "fr-FR",
    nameEnglish: "French",
    nameNative: "Français",
    script: "Latin",
    supportsRomanization: false,
    toneSensitive: false,
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
  ta: {
    id: "ta",
    locale: "ta-IN",
    nameEnglish: "Tamil",
    nameNative: "தமிழ்",
    script: "Tamil",
    supportsRomanization: true,
    toneSensitive: false,
  },
};

export function speechLanguageId(languageId: LanguageId): LanguageId {
  return languageId === "zht" ? "zh" : languageId;
}

export function speechLocale(languageId: LanguageId): string {
  return languages[speechLanguageId(languageId)].locale;
}

const unit = (
  id: string,
  localizations: LearningUnit["localizations"],
  number?: number,
): LearningUnit => ({ id, localizations, number });

type NumberWord = { text: string; romanization?: string };
type CountingLanguageId = Exclude<LanguageId, "zht">;

const countingSamples: Array<{ number: number; words: Record<CountingLanguageId, NumberWord> }> = [
  { number: 1, words: { en: { text: "one" }, zh: { text: "一", romanization: "yī" }, yue: { text: "一", romanization: "jat1" }, ja: { text: "一", romanization: "ichi" }, ko: { text: "일", romanization: "il" }, ms: { text: "satu" }, fr: { text: "un" }, es: { text: "uno" }, ta: { text: "ஒன்று", romanization: "oṉṟu" } } },
  { number: 2, words: { en: { text: "two" }, zh: { text: "二", romanization: "èr" }, yue: { text: "二", romanization: "ji6" }, ja: { text: "二", romanization: "ni" }, ko: { text: "이", romanization: "i" }, ms: { text: "dua" }, fr: { text: "deux" }, es: { text: "dos" }, ta: { text: "இரண்டு", romanization: "iraṇṭu" } } },
  { number: 3, words: { en: { text: "three" }, zh: { text: "三", romanization: "sān" }, yue: { text: "三", romanization: "saam1" }, ja: { text: "三", romanization: "san" }, ko: { text: "삼", romanization: "sam" }, ms: { text: "tiga" }, fr: { text: "trois" }, es: { text: "tres" }, ta: { text: "மூன்று", romanization: "mūṉṟu" } } },
  { number: 4, words: { en: { text: "four" }, zh: { text: "四", romanization: "sì" }, yue: { text: "四", romanization: "sei3" }, ja: { text: "四", romanization: "yon" }, ko: { text: "사", romanization: "sa" }, ms: { text: "empat" }, fr: { text: "quatre" }, es: { text: "cuatro" }, ta: { text: "நான்கு", romanization: "nāṉku" } } },
  { number: 5, words: { en: { text: "five" }, zh: { text: "五", romanization: "wǔ" }, yue: { text: "五", romanization: "ng5" }, ja: { text: "五", romanization: "go" }, ko: { text: "오", romanization: "o" }, ms: { text: "lima" }, fr: { text: "cinq" }, es: { text: "cinco" }, ta: { text: "ஐந்து", romanization: "aintu" } } },
  { number: 6, words: { en: { text: "six" }, zh: { text: "六", romanization: "liù" }, yue: { text: "六", romanization: "luk6" }, ja: { text: "六", romanization: "roku" }, ko: { text: "육", romanization: "yuk" }, ms: { text: "enam" }, fr: { text: "six" }, es: { text: "seis" }, ta: { text: "ஆறு", romanization: "āṟu" } } },
  { number: 7, words: { en: { text: "seven" }, zh: { text: "七", romanization: "qī" }, yue: { text: "七", romanization: "cat1" }, ja: { text: "七", romanization: "nana" }, ko: { text: "칠", romanization: "chil" }, ms: { text: "tujuh" }, fr: { text: "sept" }, es: { text: "siete" }, ta: { text: "ஏழு", romanization: "ēḻu" } } },
  { number: 8, words: { en: { text: "eight" }, zh: { text: "八", romanization: "bā" }, yue: { text: "八", romanization: "baat3" }, ja: { text: "八", romanization: "hachi" }, ko: { text: "팔", romanization: "pal" }, ms: { text: "lapan" }, fr: { text: "huit" }, es: { text: "ocho" }, ta: { text: "எட்டு", romanization: "eṭṭu" } } },
  { number: 9, words: { en: { text: "nine" }, zh: { text: "九", romanization: "jiǔ" }, yue: { text: "九", romanization: "gau2" }, ja: { text: "九", romanization: "kyuu" }, ko: { text: "구", romanization: "gu" }, ms: { text: "sembilan" }, fr: { text: "neuf" }, es: { text: "nueve" }, ta: { text: "ஒன்பது", romanization: "oṉpatu" } } },
  { number: 10, words: { en: { text: "ten" }, zh: { text: "十", romanization: "shí" }, yue: { text: "十", romanization: "sap6" }, ja: { text: "十", romanization: "juu" }, ko: { text: "십", romanization: "sip" }, ms: { text: "sepuluh" }, fr: { text: "dix" }, es: { text: "diez" }, ta: { text: "பத்து", romanization: "pattu" } } },
  { number: 11, words: { en: { text: "eleven" }, zh: { text: "十一", romanization: "shí yī" }, yue: { text: "十一", romanization: "sap6 jat1" }, ja: { text: "十一", romanization: "juuichi" }, ko: { text: "십일", romanization: "sibil" }, ms: { text: "sebelas" }, fr: { text: "onze" }, es: { text: "once" }, ta: { text: "பதினொன்று", romanization: "patiṉoṉṟu" } } },
  { number: 12, words: { en: { text: "twelve" }, zh: { text: "十二", romanization: "shí èr" }, yue: { text: "十二", romanization: "sap6 ji6" }, ja: { text: "十二", romanization: "juuni" }, ko: { text: "십이", romanization: "sibi" }, ms: { text: "dua belas" }, fr: { text: "douze" }, es: { text: "doce" }, ta: { text: "பன்னிரண்டு", romanization: "paṉṉiraṇṭu" } } },
  { number: 13, words: { en: { text: "thirteen" }, zh: { text: "十三", romanization: "shí sān" }, yue: { text: "十三", romanization: "sap6 saam1" }, ja: { text: "十三", romanization: "juusan" }, ko: { text: "십삼", romanization: "sipsam" }, ms: { text: "tiga belas" }, fr: { text: "treize" }, es: { text: "trece" }, ta: { text: "பதின்மூன்று", romanization: "patiṉmūṉṟu" } } },
  { number: 14, words: { en: { text: "fourteen" }, zh: { text: "十四", romanization: "shí sì" }, yue: { text: "十四", romanization: "sap6 sei3" }, ja: { text: "十四", romanization: "juuyon" }, ko: { text: "십사", romanization: "sipsa" }, ms: { text: "empat belas" }, fr: { text: "quatorze" }, es: { text: "catorce" }, ta: { text: "பதினான்கு", romanization: "patiṉāṉku" } } },
  { number: 15, words: { en: { text: "fifteen" }, zh: { text: "十五", romanization: "shí wǔ" }, yue: { text: "十五", romanization: "sap6 ng5" }, ja: { text: "十五", romanization: "juugo" }, ko: { text: "십오", romanization: "sibo" }, ms: { text: "lima belas" }, fr: { text: "quinze" }, es: { text: "quince" }, ta: { text: "பதினைந்து", romanization: "patiṉaintu" } } },
  { number: 16, words: { en: { text: "sixteen" }, zh: { text: "十六", romanization: "shí liù" }, yue: { text: "十六", romanization: "sap6 luk6" }, ja: { text: "十六", romanization: "juuroku" }, ko: { text: "십육", romanization: "simnyuk" }, ms: { text: "enam belas" }, fr: { text: "seize" }, es: { text: "dieciséis" }, ta: { text: "பதினாறு", romanization: "patiṉāṟu" } } },
  { number: 17, words: { en: { text: "seventeen" }, zh: { text: "十七", romanization: "shí qī" }, yue: { text: "十七", romanization: "sap6 cat1" }, ja: { text: "十七", romanization: "juunana" }, ko: { text: "십칠", romanization: "sipchil" }, ms: { text: "tujuh belas" }, fr: { text: "dix-sept" }, es: { text: "diecisiete" }, ta: { text: "பதினேழு", romanization: "patiṉēḻu" } } },
  { number: 18, words: { en: { text: "eighteen" }, zh: { text: "十八", romanization: "shí bā" }, yue: { text: "十八", romanization: "sap6 baat3" }, ja: { text: "十八", romanization: "juuhachi" }, ko: { text: "십팔", romanization: "sippal" }, ms: { text: "lapan belas" }, fr: { text: "dix-huit" }, es: { text: "dieciocho" }, ta: { text: "பதினெட்டு", romanization: "patiṉeṭṭu" } } },
  { number: 19, words: { en: { text: "nineteen" }, zh: { text: "十九", romanization: "shí jiǔ" }, yue: { text: "十九", romanization: "sap6 gau2" }, ja: { text: "十九", romanization: "juukyuu" }, ko: { text: "십구", romanization: "sipgu" }, ms: { text: "sembilan belas" }, fr: { text: "dix-neuf" }, es: { text: "diecinueve" }, ta: { text: "பத்தொன்பது", romanization: "pattoṉpatu" } } },
  { number: 20, words: { en: { text: "twenty" }, zh: { text: "二十", romanization: "èr shí" }, yue: { text: "二十", romanization: "ji6 sap6" }, ja: { text: "二十", romanization: "nijuu" }, ko: { text: "이십", romanization: "isip" }, ms: { text: "dua puluh" }, fr: { text: "vingt" }, es: { text: "veinte" }, ta: { text: "இருபது", romanization: "irupatu" } } },
];

function countingUnit({ number, words }: (typeof countingSamples)[number]): LearningUnit {
  const english = words.en.text;
  const localizations = Object.fromEntries(languageIds.map((languageId) => {
    const word = words[languageId === "zht" ? "zh" : languageId];
    return [languageId, {
      text: word.text,
      natural: english,
      literal: String(number),
      romanization: word.romanization,
      segments: [{ id: `number-${number}-${languageId}`, text: word.text, translation: english }],
    }];
  })) as LearningUnit["localizations"];

  return unit(`number-${number}`, localizations, number);
}

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
        zht: {
          text: "早上好。市場已經很熱鬧了。",
          natural: "Good morning. The market is already busy.",
          literal: "Morning good. The market already is very lively.",
          romanization: "Zǎoshang hǎo. Shìchǎng yǐjīng hěn rènào le.",
          segments: [
            { id: "market-hello-zht-1", text: "早上好。", translation: "Good morning." },
            { id: "market-hello-zht-2", text: "市場", translation: "market" },
            { id: "market-hello-zht-3", text: "已經很熱鬧了。", translation: "is already very busy." },
          ],
        },
        yue: {
          text: "早晨。街市已經好熱鬧。",
          natural: "Good morning. The market is already busy.",
          literal: "Morning. The market is already very lively.",
          romanization: "Zou2 san4. Gaai1 si5 ji5 ging1 hou2 jit6 naau6.",
          segments: [
            { id: "market-hello-yue-1", text: "早晨。", translation: "Good morning." },
            { id: "market-hello-yue-2", text: "街市", translation: "The market" },
            { id: "market-hello-yue-3", text: "已經好熱鬧。", translation: "is already very busy." },
          ],
        },
        ko: {
          text: "좋은 아침이에요. 시장은 벌써 붐벼요.",
          natural: "Good morning. The market is already busy.",
          literal: "It is a good morning. The market is already crowded.",
          romanization: "Joeun achimieyo. Sijangeun beolsseo bumbwyeoyo.",
          segments: [
            { id: "market-hello-ko-1", text: "좋은 아침이에요.", translation: "Good morning." },
            { id: "market-hello-ko-2", text: "시장은", translation: "The market" },
            { id: "market-hello-ko-3", text: "벌써 붐벼요.", translation: "is already busy." },
          ],
        },
        ms: {
          text: "Selamat pagi. Pasar sudah sibuk.",
          natural: "Good morning. The market is already busy.",
          literal: "Good morning. The market is already busy.",
          segments: [
            { id: "market-hello-ms-1", text: "Selamat pagi.", translation: "Good morning." },
            { id: "market-hello-ms-2", text: "Pasar", translation: "The market" },
            { id: "market-hello-ms-3", text: "sudah sibuk.", translation: "is already busy." },
          ],
        },
        fr: {
          text: "Bonjour. Le marché est déjà animé.",
          natural: "Good morning. The market is already busy.",
          literal: "Hello. The market is already lively.",
          segments: [
            { id: "market-hello-fr-1", text: "Bonjour.", translation: "Good morning." },
            { id: "market-hello-fr-2", text: "Le marché", translation: "The market" },
            { id: "market-hello-fr-3", text: "est déjà animé.", translation: "is already lively." },
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
        ta: {
          text: "காலை வணக்கம். சந்தை ஏற்கனவே பரபரப்பாக இருக்கிறது.",
          natural: "Good morning. The market is already busy.",
          literal: "Morning greetings. The market is already bustling.",
          romanization: "Kālai vaṇakkam. Cantai ēṟkaṉavē paraparappāka irukkiṟatu.",
          segments: [
            { id: "market-hello-ta-1", text: "காலை வணக்கம்.", translation: "Good morning." },
            { id: "market-hello-ta-2", text: "சந்தை", translation: "The market" },
            { id: "market-hello-ta-3", text: "ஏற்கனவே பரபரப்பாக இருக்கிறது.", translation: "is already busy." },
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
        zht: {
          text: "請給我三個紅蘋果。",
          natural: "Three red apples, please.",
          literal: "Please give me three red apples.",
          romanization: "Qǐng gěi wǒ sān ge hóng píngguǒ.",
          segments: [
            { id: "market-apples-zht-1", text: "請給我", translation: "please give me" },
            { id: "market-apples-zht-2", text: "三個", translation: "three" },
            { id: "market-apples-zht-3", text: "紅蘋果。", translation: "red apples." },
          ],
        },
        yue: {
          text: "我想要三個紅蘋果，唔該。",
          natural: "I would like three red apples, please.",
          literal: "I want three red apples, please.",
          romanization: "Ngo5 soeng2 jiu3 saam1 go3 hung4 ping4 gwo2, m4 goi1.",
          segments: [
            { id: "market-apples-yue-1", text: "我想要", translation: "I would like" },
            { id: "market-apples-yue-2", text: "三個紅蘋果", translation: "three red apples" },
            { id: "market-apples-yue-3", text: "唔該。", translation: "please." },
          ],
        },
        ko: {
          text: "빨간 사과 세 개 주세요.",
          natural: "Three red apples, please.",
          literal: "Please give me three red apples.",
          romanization: "Ppalgan sagwa se gae juseyo.",
          segments: [
            { id: "market-apples-ko-1", text: "빨간 사과", translation: "red apples" },
            { id: "market-apples-ko-2", text: "세 개", translation: "three items" },
            { id: "market-apples-ko-3", text: "주세요.", translation: "please give me." },
          ],
        },
        ms: {
          text: "Saya ingin tiga biji epal merah, tolong.",
          natural: "I would like three red apples, please.",
          literal: "I want three red apples, please.",
          segments: [
            { id: "market-apples-ms-1", text: "Saya ingin", translation: "I would like" },
            { id: "market-apples-ms-2", text: "tiga biji epal merah", translation: "three red apples" },
            { id: "market-apples-ms-3", text: "tolong.", translation: "please." },
          ],
        },
        fr: {
          text: "Je voudrais trois pommes rouges, s'il vous plaît.",
          natural: "I would like three red apples, please.",
          literal: "I would like three red apples, please.",
          segments: [
            { id: "market-apples-fr-1", text: "Je voudrais", translation: "I would like" },
            { id: "market-apples-fr-2", text: "trois pommes rouges", translation: "three red apples" },
            { id: "market-apples-fr-3", text: "s'il vous plaît.", translation: "please." },
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
        ta: {
          text: "எனக்கு மூன்று சிவப்பு ஆப்பிள்கள் வேண்டும், தயவுசெய்து.",
          natural: "I would like three red apples, please.",
          literal: "For me, three red apples are wanted, please.",
          romanization: "Eṉakku mūṉṟu civappu āppiḷkaḷ vēṇṭum, tayavuceytu.",
          segments: [
            { id: "market-apples-ta-1", text: "எனக்கு", translation: "For me" },
            { id: "market-apples-ta-2", text: "மூன்று சிவப்பு ஆப்பிள்கள் வேண்டும்,", translation: "I would like three red apples" },
            { id: "market-apples-ta-3", text: "தயவுசெய்து.", translation: "please." },
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
        zht: {
          text: "謝謝。看起來很好吃。",
          natural: "Thank you. They look delicious.",
          literal: "Thanks. They look very good to eat.",
          romanization: "Xièxie. Kàn qǐlái hěn hǎochī.",
          segments: [
            { id: "market-thanks-zht-1", text: "謝謝。", translation: "Thank you." },
            { id: "market-thanks-zht-2", text: "看起來很好吃。", translation: "They look delicious." },
          ],
        },
        yue: {
          text: "多謝。睇落好好食。",
          natural: "Thank you. They look delicious.",
          literal: "Many thanks. Looking at them, they seem very tasty.",
          romanization: "Do1 ze6. Tai2 lok6 hou2 hou2 sik6.",
          segments: [
            { id: "market-thanks-yue-1", text: "多謝。", translation: "Thank you." },
            { id: "market-thanks-yue-2", text: "睇落好好食。", translation: "They look delicious." },
          ],
        },
        ko: {
          text: "감사합니다. 맛있어 보여요.",
          natural: "Thank you. They look delicious.",
          literal: "Thank you. They look tasty.",
          romanization: "Gamsahamnida. Masisseo boyeoyo.",
          segments: [
            { id: "market-thanks-ko-1", text: "감사합니다.", translation: "Thank you." },
            { id: "market-thanks-ko-2", text: "맛있어 보여요.", translation: "They look delicious." },
          ],
        },
        ms: {
          text: "Terima kasih. Nampak sedap.",
          natural: "Thank you. They look delicious.",
          literal: "Thank you. They look tasty.",
          segments: [
            { id: "market-thanks-ms-1", text: "Terima kasih.", translation: "Thank you." },
            { id: "market-thanks-ms-2", text: "Nampak sedap.", translation: "They look delicious." },
          ],
        },
        fr: {
          text: "Merci. Elles ont l'air délicieuses.",
          natural: "Thank you. They look delicious.",
          literal: "Thank you. They have the appearance of being delicious.",
          segments: [
            { id: "market-thanks-fr-1", text: "Merci.", translation: "Thank you." },
            { id: "market-thanks-fr-2", text: "Elles ont l'air délicieuses.", translation: "They look delicious." },
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
        ta: {
          text: "நன்றி. அவை சுவையாகத் தெரிகின்றன.",
          natural: "Thank you. They look delicious.",
          literal: "Thank you. They appear tasty.",
          romanization: "Naṉṟi. Avai cuvaiyākat terikiṉṟaṉa.",
          segments: [
            { id: "market-thanks-ta-1", text: "நன்றி.", translation: "Thank you." },
            { id: "market-thanks-ta-2", text: "அவை சுவையாகத் தெரிகின்றன.", translation: "They look delicious." },
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
        zht: { text: "回家的路上下起了雨。", natural: "It started raining on my way home.", literal: "On the road going home, rain began.", romanization: "Huí jiā de lùshang xià qǐ le yǔ.", segments: [{ id: "rain-start-zht-1", text: "回家的路上", translation: "on the way home" }, { id: "rain-start-zht-2", text: "下起了雨。", translation: "it started raining." }] },
        yue: { text: "返屋企途中開始落雨。", natural: "It started raining on my way home.", literal: "While returning home, rain began to fall.", romanization: "Faan1 uk1 kei2 tou4 zung1 hoi1 ci2 lok6 jyu5.", segments: [{ id: "rain-start-yue-1", text: "返屋企途中", translation: "on the way home" }, { id: "rain-start-yue-2", text: "開始落雨。", translation: "it started raining." }] },
        ko: { text: "집에 가는 길에 비가 오기 시작했어요.", natural: "It started raining on my way home.", literal: "On the road going home, rain started coming.", romanization: "Jibe ganeun gire biga ogi sijakaesseoyo.", segments: [{ id: "rain-start-ko-1", text: "집에 가는 길에", translation: "on the way home" }, { id: "rain-start-ko-2", text: "비가 오기 시작했어요.", translation: "it started raining." }] },
        ms: { text: "Hujan mula turun semasa saya dalam perjalanan pulang.", natural: "It started raining on my way home.", literal: "Rain began falling while I was on the journey home.", segments: [{ id: "rain-start-ms-1", text: "Hujan mula turun", translation: "It started raining" }, { id: "rain-start-ms-2", text: "semasa saya dalam perjalanan pulang.", translation: "while I was on my way home." }] },
        fr: { text: "Il a commencé à pleuvoir sur le chemin du retour.", natural: "It started raining on my way home.", literal: "It began to rain on the way back.", segments: [{ id: "rain-start-fr-1", text: "Il a commencé à pleuvoir", translation: "It started raining" }, { id: "rain-start-fr-2", text: "sur le chemin du retour.", translation: "on the way home." }] },
        es: { text: "Empezó a llover de camino a casa.", natural: "It started raining on my way home.", literal: "It began to rain on the way home.", segments: [{ id: "rain-start-es-1", text: "Empezó a llover", translation: "It started raining" }, { id: "rain-start-es-2", text: "de camino a casa.", translation: "on the way home." }] },
        ta: { text: "வீட்டிற்குச் செல்லும் வழியில் மழை பெய்யத் தொடங்கியது.", natural: "It started raining on my way home.", literal: "On the way going home, rain started to fall.", romanization: "Vīṭṭiṟkuc cellum vaḻiyil maḻai peyyat toṭaṅkiyatu.", segments: [{ id: "rain-start-ta-1", text: "வீட்டிற்குச் செல்லும் வழியில்", translation: "on the way home" }, { id: "rain-start-ta-2", text: "மழை பெய்யத் தொடங்கியது.", translation: "it started raining." }] },
      }),
      unit("rain-umbrella", {
        en: { text: "I opened my small red umbrella.", natural: "I opened my small red umbrella.", segments: [{ id: "rain-umbrella-en-1", text: "I opened", translation: "I unfolded" }, { id: "rain-umbrella-en-2", text: "my small red umbrella.", translation: "the umbrella that belongs to me" }] },
        ja: { text: "小さな赤い傘を開きました。", natural: "I opened my small red umbrella.", literal: "A small red umbrella, I opened.", romanization: "Chiisana akai kasa o hirakimashita.", segments: [{ id: "rain-umbrella-ja-1", text: "小さな赤い傘を", translation: "a small red umbrella" }, { id: "rain-umbrella-ja-2", text: "開きました。", translation: "I opened." }] },
        zh: { text: "我打开了红色的小雨伞。", natural: "I opened my small red umbrella.", literal: "I opened the red small umbrella.", romanization: "Wǒ dǎkāi le hóngsè de xiǎo yǔsǎn.", segments: [{ id: "rain-umbrella-zh-1", text: "我打开了", translation: "I opened" }, { id: "rain-umbrella-zh-2", text: "红色的小雨伞。", translation: "the small red umbrella." }] },
        zht: { text: "我打開了紅色的小雨傘。", natural: "I opened my small red umbrella.", literal: "I opened the red small umbrella.", romanization: "Wǒ dǎkāi le hóngsè de xiǎo yǔsǎn.", segments: [{ id: "rain-umbrella-zht-1", text: "我打開了", translation: "I opened" }, { id: "rain-umbrella-zht-2", text: "紅色的小雨傘。", translation: "the small red umbrella." }] },
        yue: { text: "我打開咗把紅色嘅小雨傘。", natural: "I opened my small red umbrella.", literal: "I opened the small red umbrella.", romanization: "Ngo5 daa2 hoi1 zo2 baa2 hung4 sik1 ge3 siu2 jyu5 saan3.", segments: [{ id: "rain-umbrella-yue-1", text: "我打開咗", translation: "I opened" }, { id: "rain-umbrella-yue-2", text: "把紅色嘅小雨傘。", translation: "the small red umbrella." }] },
        ko: { text: "작은 빨간 우산을 펼쳤어요.", natural: "I opened my small red umbrella.", literal: "I unfolded the small red umbrella.", romanization: "Jageun ppalgan usaneul pyeolchyeosseoyo.", segments: [{ id: "rain-umbrella-ko-1", text: "작은 빨간 우산을", translation: "my small red umbrella" }, { id: "rain-umbrella-ko-2", text: "펼쳤어요.", translation: "I opened." }] },
        ms: { text: "Saya membuka payung merah kecil saya.", natural: "I opened my small red umbrella.", literal: "I opened my red small umbrella.", segments: [{ id: "rain-umbrella-ms-1", text: "Saya membuka", translation: "I opened" }, { id: "rain-umbrella-ms-2", text: "payung merah kecil saya.", translation: "my small red umbrella." }] },
        fr: { text: "J'ai ouvert mon petit parapluie rouge.", natural: "I opened my small red umbrella.", literal: "I opened my little red umbrella.", segments: [{ id: "rain-umbrella-fr-1", text: "J'ai ouvert", translation: "I opened" }, { id: "rain-umbrella-fr-2", text: "mon petit parapluie rouge.", translation: "my small red umbrella." }] },
        es: { text: "Abrí mi pequeño paraguas rojo.", natural: "I opened my small red umbrella.", literal: "I opened my little red umbrella.", segments: [{ id: "rain-umbrella-es-1", text: "Abrí", translation: "I opened" }, { id: "rain-umbrella-es-2", text: "mi pequeño paraguas rojo.", translation: "my small red umbrella." }] },
        ta: { text: "என் சிறிய சிவப்பு குடையைத் திறந்தேன்.", natural: "I opened my small red umbrella.", literal: "I opened my small red umbrella.", romanization: "Eṉ ciṟiya civappu kuṭaiyait tiṟantēṉ.", segments: [{ id: "rain-umbrella-ta-1", text: "என் சிறிய சிவப்பு குடையைத்", translation: "my small red umbrella" }, { id: "rain-umbrella-ta-2", text: "திறந்தேன்.", translation: "I opened." }] },
      }),
      unit("rain-puddles", {
        en: { text: "The street lights shone in every puddle.", natural: "The street lights shone in every puddle.", segments: [{ id: "rain-puddles-en-1", text: "The street lights", translation: "Lights along the road" }, { id: "rain-puddles-en-2", text: "shone in every puddle.", translation: "were reflected in all the puddles" }] },
        ja: { text: "街灯が水たまりに映っていました。", natural: "The street lights were reflected in the puddles.", literal: "Street lights were reflected in puddles.", romanization: "Gaitou ga mizutamari ni utsutte imashita.", segments: [{ id: "rain-puddles-ja-1", text: "街灯が", translation: "the street lights" }, { id: "rain-puddles-ja-2", text: "水たまりに", translation: "in the puddles" }, { id: "rain-puddles-ja-3", text: "映っていました。", translation: "were reflected." }] },
        zh: { text: "路灯映在每个水洼里。", natural: "The street lights were reflected in every puddle.", literal: "Road lights reflected inside every puddle.", romanization: "Lùdēng yìng zài měi ge shuǐwā lǐ.", segments: [{ id: "rain-puddles-zh-1", text: "路灯", translation: "street lights" }, { id: "rain-puddles-zh-2", text: "映在", translation: "were reflected in" }, { id: "rain-puddles-zh-3", text: "每个水洼里。", translation: "every puddle." }] },
        zht: { text: "路燈映在每個水窪裡。", natural: "The street lights were reflected in every puddle.", literal: "Road lights reflected inside every puddle.", romanization: "Lùdēng yìng zài měi ge shuǐwā lǐ.", segments: [{ id: "rain-puddles-zht-1", text: "路燈", translation: "street lights" }, { id: "rain-puddles-zht-2", text: "映在", translation: "were reflected in" }, { id: "rain-puddles-zht-3", text: "每個水窪裡。", translation: "every puddle." }] },
        yue: { text: "街燈映照喺每個水氹入面。", natural: "The street lights shone in every puddle.", literal: "Street lights reflected inside every puddle.", romanization: "Gaai1 dang1 jing2 ziu3 hai2 mui5 go3 seoi2 tam5 jap6 min6.", segments: [{ id: "rain-puddles-yue-1", text: "街燈", translation: "street lights" }, { id: "rain-puddles-yue-2", text: "映照喺", translation: "were reflected in" }, { id: "rain-puddles-yue-3", text: "每個水氹入面。", translation: "every puddle." }] },
        ko: { text: "가로등이 모든 물웅덩이에 비쳤어요.", natural: "The street lights shone in every puddle.", literal: "The street lights were reflected in every puddle.", romanization: "Garodeungi modeun murungdeongie bichyeosseoyo.", segments: [{ id: "rain-puddles-ko-1", text: "가로등이", translation: "the street lights" }, { id: "rain-puddles-ko-2", text: "모든 물웅덩이에", translation: "in every puddle" }, { id: "rain-puddles-ko-3", text: "비쳤어요.", translation: "were reflected." }] },
        ms: { text: "Lampu jalan bersinar di setiap lopak.", natural: "The street lights shone in every puddle.", literal: "Street lights shone in every puddle.", segments: [{ id: "rain-puddles-ms-1", text: "Lampu jalan", translation: "The street lights" }, { id: "rain-puddles-ms-2", text: "bersinar", translation: "shone" }, { id: "rain-puddles-ms-3", text: "di setiap lopak.", translation: "in every puddle." }] },
        fr: { text: "Les lampadaires brillaient dans chaque flaque.", natural: "The street lights shone in every puddle.", literal: "The street lamps shone in each puddle.", segments: [{ id: "rain-puddles-fr-1", text: "Les lampadaires", translation: "The street lights" }, { id: "rain-puddles-fr-2", text: "brillaient", translation: "were shining" }, { id: "rain-puddles-fr-3", text: "dans chaque flaque.", translation: "in every puddle." }] },
        es: { text: "Las farolas brillaban en cada charco.", natural: "The street lights shone in every puddle.", literal: "The street lamps shone in each puddle.", segments: [{ id: "rain-puddles-es-1", text: "Las farolas", translation: "The street lights" }, { id: "rain-puddles-es-2", text: "brillaban", translation: "were shining" }, { id: "rain-puddles-es-3", text: "en cada charco.", translation: "in every puddle." }] },
        ta: { text: "தெருவிளக்குகள் ஒவ்வொரு குட்டையிலும் ஒளிர்ந்தன.", natural: "The street lights shone in every puddle.", literal: "Street lights shone in each puddle.", romanization: "Teruviḷakkukaḷ ovvoru kuṭṭaiyilum oḷirntaṉa.", segments: [{ id: "rain-puddles-ta-1", text: "தெருவிளக்குகள்", translation: "The street lights" }, { id: "rain-puddles-ta-2", text: "ஒவ்வொரு குட்டையிலும்", translation: "in every puddle" }, { id: "rain-puddles-ta-3", text: "ஒளிர்ந்தன.", translation: "shone." }] },
      }),
    ],
  },
  {
    id: "numbers-one-to-five-v1",
    slug: "one-to-five",
    type: "number_drill",
    tier: 0,
    title: "Count from one to twenty",
    description: "Build a quick speaking rhythm with the first twenty numbers.",
    estimatedMinutes: 6,
    units: countingSamples.map(countingUnit),
  },
];

export const defaultLocalProgress: LocalProgress = {
  xp: 0,
  completed: {},
  savedPhraseIds: [],
  systemLanguageId: "en",
  practiceLanguageId: "ja",
  supportLanguageId: "en",
  displayLanguageIds: ["en", "ja"],
  showRomanization: true,
  pronunciationModes: {},
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
  const supportingLanguages = Array.from(new Set([
    supportLanguageId,
    ...displayLanguageIds.filter((languageId) => languageId !== practiceLanguageId),
  ]));
  return [...supportingLanguages, practiceLanguageId];
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
