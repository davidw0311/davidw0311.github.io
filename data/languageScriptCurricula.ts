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
  translations?: Partial<Record<LanguageId, CurriculumTranslation>>;
};

type CurriculumTranslation = {
  text: string;
  romanization?: string;
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
  translations?: CurriculumPrompt["translations"],
): CurriculumPrompt => ({ id, text, romanization, meaning, translations });

function curriculumUnit(
  lesson: CurriculumLesson,
  item: CurriculumPrompt,
): LearningUnit {
  const localizations = Object.fromEntries(curriculumLanguageIds.map((languageId) => {
    const isPracticeLanguage = languageId === lesson.practiceLanguageId;
    const translation = item.translations?.[languageId];
    const text = isPracticeLanguage ? item.text : translation?.text ?? item.meaning;
    const romanization = isPracticeLanguage ? item.romanization : translation?.romanization ?? text;
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
    description: "Practice a focused set of characters or short words.",
    estimatedMinutes: lesson.estimatedMinutes ?? 3,
    units: lesson.prompts.map((item) => curriculumUnit(lesson, item)),
  };
}

export const modernHiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
export const modernKatakana = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
export const modernHangulConsonants = "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉ";
export const modernHangulVowels = "ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔㅚㅟㅢㅒㅖㅘㅙㅝㅞ";

type KanaReading = readonly [slug: string, reading: string];
type JapaneseWord = readonly [slug: JapaneseWordMeaning, text: string, reading: string];

type JapaneseWordSupportLanguage = Exclude<LanguageId, "ja">;
type JapaneseWordTranslations = Record<JapaneseWordSupportLanguage, CurriculumTranslation>;

function wordTranslations(
  en: string,
  zh: readonly [text: string, romanization: string],
  zht: readonly [text: string, romanization: string],
  yue: readonly [text: string, romanization: string],
  ko: readonly [text: string, romanization: string],
  ms: string,
  fr: string,
  es: string,
  ta: readonly [text: string, romanization: string],
): JapaneseWordTranslations {
  return {
    en: { text: en },
    zh: { text: zh[0], romanization: zh[1] },
    zht: { text: zht[0], romanization: zht[1] },
    yue: { text: yue[0], romanization: yue[1] },
    ko: { text: ko[0], romanization: ko[1] },
    ms: { text: ms },
    fr: { text: fr },
    es: { text: es },
    ta: { text: ta[0], romanization: ta[1] },
  };
}

const japaneseWordTranslations = {
  sea: wordTranslations("sea", ["海", "hǎi"], ["海", "hǎi"], ["海", "hoi2"], ["바다", "bada"], "laut", "mer", "mar", ["கடல்", "kaṭal"]),
  house: wordTranslations("house", ["房子", "fángzi"], ["房子", "fángzi"], ["屋", "nguk1"], ["집", "jip"], "rumah", "maison", "casa", ["வீடு", "vīṭu"]),
  cat: wordTranslations("cat", ["猫", "māo"], ["貓", "māo"], ["貓", "maau1"], ["고양이", "goyangi"], "kucing", "chat", "gato", ["பூனை", "pūṉai"]),
  dog: wordTranslations("dog", ["狗", "gǒu"], ["狗", "gǒu"], ["狗", "gau2"], ["개", "gae"], "anjing", "chien", "perro", ["நாய்", "nāy"]),
  sushi: wordTranslations("sushi", ["寿司", "shòusī"], ["壽司", "shòusī"], ["壽司", "sau6 si1"], ["스시", "seusi"], "sushi", "sushi", "sushi", ["சுஷி", "sushi"]),
  sky: wordTranslations("sky", ["天空", "tiānkōng"], ["天空", "tiānkōng"], ["天空", "tin1 hung1"], ["하늘", "haneul"], "langit", "ciel", "cielo", ["வானம்", "vāṉam"]),
  bird: wordTranslations("bird", ["鸟", "niǎo"], ["鳥", "niǎo"], ["鳥", "niu5"], ["새", "sae"], "burung", "oiseau", "pájaro", ["பறவை", "paṟavai"]),
  flower: wordTranslations("flower", ["花", "huā"], ["花", "huā"], ["花", "faa1"], ["꽃", "kkot"], "bunga", "fleur", "flor", ["மலர்", "malar"]),
  boat: wordTranslations("boat", ["船", "chuán"], ["船", "chuán"], ["船", "syun4"], ["배", "bae"], "bot", "bateau", "barco", ["படகு", "paṭaku"]),
  mountain: wordTranslations("mountain", ["山", "shān"], ["山", "shān"], ["山", "saan1"], ["산", "san"], "gunung", "montagne", "montaña", ["மலை", "malai"]),
  dream: wordTranslations("dream", ["梦", "mèng"], ["夢", "mèng"], ["夢", "mung6"], ["꿈", "kkum"], "mimpi", "rêve", "sueño", ["கனவு", "kaṉavu"]),
  night: wordTranslations("night", ["夜晚", "yèwǎn"], ["夜晚", "yèwǎn"], ["夜晚", "je6 maan5"], ["밤", "bam"], "malam", "nuit", "noche", ["இரவு", "iravu"]),
  ears: wordTranslations("ears", ["耳朵", "ěrduo"], ["耳朵", "ěrduo"], ["耳朵", "ji5 do2"], ["귀", "gwi"], "telinga", "oreilles", "orejas", ["காதுகள்", "kātukaḷ"]),
  beans: wordTranslations("beans", ["豆子", "dòuzi"], ["豆子", "dòuzi"], ["豆", "dau6"], ["콩", "kong"], "kacang", "haricots", "frijoles", ["பீன்ஸ்", "pīṉs"]),
  book: wordTranslations("book", ["书", "shū"], ["書", "shū"], ["書", "syu1"], ["책", "chaek"], "buku", "livre", "libro", ["புத்தகம்", "puttakam"]),
  water: wordTranslations("water", ["水", "shuǐ"], ["水", "shuǐ"], ["水", "seoi2"], ["물", "mul"], "air", "eau", "agua", ["தண்ணீர்", "taṇṇīr"]),
  bread: wordTranslations("bread", ["面包", "miànbāo"], ["麵包", "miànbāo"], ["麵包", "min6 baau1"], ["빵", "ppang"], "roti", "pain", "pan", ["ரொட்டி", "roṭṭi"]),
  key: wordTranslations("key", ["钥匙", "yàoshi"], ["鑰匙", "yàoshi"], ["鎖匙", "so2 si4"], ["열쇠", "yeolsoe"], "kunci", "clé", "llave", ["சாவி", "cāvi"]),
  shoes: wordTranslations("shoes", ["鞋子", "xiézi"], ["鞋子", "xiézi"], ["鞋", "haai4"], ["신발", "sinbal"], "kasut", "chaussures", "zapatos", ["காலணிகள்", "kālaṇikaḷ"]),
  morning: wordTranslations("morning", ["早上", "zǎoshang"], ["早上", "zǎoshang"], ["朝早", "ziu1 zou2"], ["아침", "achim"], "pagi", "matin", "mañana", ["காலை", "kālai"]),
  bus: wordTranslations("bus", ["公交车", "gōngjiāochē"], ["公交車", "gōngjiāochē"], ["巴士", "baa1 si2"], ["버스", "beoseu"], "bas", "bus", "autobús", ["பேருந்து", "pēruntu"]),
  pen: wordTranslations("pen", ["笔", "bǐ"], ["筆", "bǐ"], ["筆", "bat1"], ["펜", "pen"], "pen", "stylo", "bolígrafo", ["பேனா", "pēṉā"]),
  door: wordTranslations("door", ["门", "mén"], ["門", "mén"], ["門", "mun4"], ["문", "mun"], "pintu", "porte", "puerta", ["கதவு", "katavu"]),
  camera: wordTranslations("camera", ["相机", "xiàngjī"], ["相機", "xiàngjī"], ["相機", "soeng2 gei1"], ["카메라", "kamera"], "kamera", "appareil photo", "cámara", ["கேமரா", "kēmarā"]),
  television: wordTranslations("television", ["电视", "diànshì"], ["電視", "diànshì"], ["電視", "din6 si6"], ["텔레비전", "tellebijeon"], "televisyen", "télévision", "televisión", ["தொலைக்காட்சி", "tolaikkāṭci"]),
  radio: wordTranslations("radio", ["收音机", "shōuyīnjī"], ["收音機", "shōuyīnjī"], ["收音機", "sau1 jam1 gei1"], ["라디오", "radio"], "radio", "radio", "radio", ["வானொலி", "vāṉoli"]),
  hotel: wordTranslations("hotel", ["酒店", "jiǔdiàn"], ["酒店", "jiǔdiàn"], ["酒店", "zau2 dim3"], ["호텔", "hotel"], "hotel", "hôtel", "hotel", ["விடுதி", "viṭuti"]),
  tomato: wordTranslations("tomato", ["西红柿", "xīhóngshì"], ["西紅柿", "xīhóngshì"], ["番茄", "faan1 ke2"], ["토마토", "tomato"], "tomato", "tomate", "tomate", ["தக்காளி", "takkāḷi"]),
  piano: wordTranslations("piano", ["钢琴", "gāngqín"], ["鋼琴", "gāngqín"], ["鋼琴", "gong3 kam4"], ["피아노", "piano"], "piano", "piano", "piano", ["பியானோ", "piyāṉō"]),
  memo: wordTranslations("memo", ["备忘录", "bèiwànglù"], ["備忘錄", "bèiwànglù"], ["備忘錄", "bei6 mong4 luk6"], ["메모", "memo"], "memo", "mémo", "nota", ["குறிப்பேடு", "kuṟippēṭu"]),
  zero: wordTranslations("zero", ["零", "líng"], ["零", "líng"], ["零", "ling4"], ["영", "yeong"], "sifar", "zéro", "cero", ["பூஜ்ஜியம்", "pūjjiyam"]),
  cocoa: wordTranslations("cocoa", ["可可", "kěkě"], ["可可", "kěkě"], ["可可", "ho2 ho2"], ["코코아", "kokoa"], "koko", "cacao", "cacao", ["கோகோ", "kōkō"]),
  cake: wordTranslations("cake", ["蛋糕", "dàngāo"], ["蛋糕", "dàngāo"], ["蛋糕", "daan6 gou1"], ["케이크", "keikeu"], "kek", "gâteau", "pastel", ["கேக்", "kēk"]),
  soup: wordTranslations("soup", ["汤", "tāng"], ["湯", "tāng"], ["湯", "tong1"], ["수프", "seupeu"], "sup", "soupe", "sopa", ["சூப்", "cūp"]),
  shirt: wordTranslations("shirt", ["衬衫", "chènshān"], ["襯衫", "chènshān"], ["恤衫", "seot1 saam1"], ["셔츠", "syeocheu"], "kemeja", "chemise", "camisa", ["சட்டை", "caṭṭai"]),
  chocolate: wordTranslations("chocolate", ["巧克力", "qiǎokèlì"], ["巧克力", "qiǎokèlì"], ["朱古力", "zyu1 gu1 lik6"], ["초콜릿", "chokollit"], "coklat", "chocolat", "chocolate", ["சாக்லேட்", "cākḷēṭ"]),
  news: wordTranslations("news", ["新闻", "xīnwén"], ["新聞", "xīnwén"], ["新聞", "san1 man4"], ["뉴스", "nyuseu"], "berita", "actualités", "noticias", ["செய்திகள்", "ceytikaḷ"]),
  notebook: wordTranslations("notebook", ["笔记本", "bǐjìběn"], ["筆記本", "bǐjìběn"], ["筆記簿", "bat1 gei3 bou2"], ["공책", "gongchaek"], "buku nota", "cahier", "cuaderno", ["குறிப்பேடு", "kuṟippēṭu"]),
  taxi: wordTranslations("taxi", ["出租车", "chūzūchē"], ["出租車", "chūzūchē"], ["的士", "dik1 si2"], ["택시", "taeksi"], "teksi", "taxi", "taxi", ["டாக்ஸி", "ṭāksi"]),
} as const;

type JapaneseWordMeaning = keyof typeof japaneseWordTranslations;

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
  ["sea", "うみ", "umi"], ["house", "いえ", "ie"],
  ["cat", "ねこ", "neko"], ["dog", "いぬ", "inu"],
  ["sushi", "すし", "sushi"], ["sky", "そら", "sora"],
  ["bird", "とり", "tori"], ["flower", "はな", "hana"],
  ["boat", "ふね", "fune"], ["mountain", "やま", "yama"],
  ["dream", "ゆめ", "yume"], ["night", "よる", "yoru"],
  ["ears", "みみ", "mimi"], ["beans", "まめ", "mame"],
  ["book", "ほん", "hon"], ["water", "みず", "mizu"],
  ["bread", "ぱん", "pan"], ["key", "かぎ", "kagi"],
  ["shoes", "くつ", "kutsu"], ["morning", "あさ", "asa"],
];

const katakanaWords: readonly JapaneseWord[] = [
  ["bread", "パン", "pan"], ["bus", "バス", "basu"],
  ["pen", "ペン", "pen"], ["door", "ドア", "doa"],
  ["camera", "カメラ", "kamera"], ["television", "テレビ", "terebi"],
  ["radio", "ラジオ", "rajio"], ["hotel", "ホテル", "hoteru"],
  ["tomato", "トマト", "tomato"], ["piano", "ピアノ", "piano"],
  ["memo", "メモ", "memo"], ["zero", "ゼロ", "zero"],
  ["cocoa", "ココア", "kokoa"], ["cake", "ケーキ", "keeki"],
  ["soup", "スープ", "suupu"], ["shirt", "シャツ", "shatsu"],
  ["chocolate", "チョコ", "choko"], ["news", "ニュース", "nyuusu"],
  ["notebook", "ノート", "nooto"], ["taxi", "タクシー", "takushii"],
];

function kanaCharacterLesson(
  script: "hiragana" | "katakana",
  slug: string,
  title: string,
  characters: string,
  readings: readonly KanaReading[],
  sectionId: CurriculumSectionId,
): CurriculumLesson {
  const scriptName = script === "hiragana" ? "Hiragana" : "Katakana";
  const prompts = [...characters].map((character, index) => {
    const [slug, reading] = readings[index];
    return prompt(slug, character, reading, `${scriptName} ${reading}`);
  });

  return {
    id: `ja-${script}-${slug}-v3`,
    slug: `ja-${script}-${slug}`,
    title,
    sectionId,
    practiceLanguageId: "ja",
    estimatedMinutes: Math.ceil(prompts.length / 4),
    prompts,
  };
}

function japaneseWordLesson(
  script: "hiragana" | "katakana",
  words: readonly JapaneseWord[],
  sectionId: CurriculumSectionId,
): CurriculumLesson {
  const firstWord = words[0]!;
  const lastWord = words.at(-1)!;
  return {
    id: `ja-${script}-short-words-v3`,
    slug: `ja-${script}-short-words`,
    title: `${firstWord[1]} - ${lastWord[1]}`,
    sectionId,
    practiceLanguageId: "ja",
    estimatedMinutes: Math.ceil(words.length / 4),
    prompts: words.map(([slug, text, reading]) => {
      const translations = japaneseWordTranslations[slug];
      return prompt(slug, text, reading, translations.en.text, translations);
    }),
  };
}

const basicHiragana = [...modernHiragana];
const variantHiragana = [...hiraganaCurriculumCharacters.slice(basicHiragana.length)];
const basicKatakana = [...modernKatakana];
const variantKatakana = [...katakanaCurriculumCharacters.slice(basicKatakana.length)];

const japaneseLessons: readonly CurriculumLesson[] = [
  kanaCharacterLesson("hiragana", "a-so", "あ - そ", basicHiragana.slice(0, 15).join(""), basicKanaReadings.slice(0, 15), "ja-hiragana"),
  kanaCharacterLesson("hiragana", "ta-ho", "た - ほ", basicHiragana.slice(15, 30).join(""), basicKanaReadings.slice(15, 30), "ja-hiragana"),
  kanaCharacterLesson("hiragana", "ma-n", "ま - ん", basicHiragana.slice(30).join(""), basicKanaReadings.slice(30), "ja-hiragana"),
  kanaCharacterLesson(
    "hiragana",
    "ga-do",
    "が - ど",
    variantHiragana.slice(0, 15).join(""),
    variantKanaReadings.slice(0, 15),
    "ja-hiragana-variants",
  ),
  kanaCharacterLesson(
    "hiragana",
    "ba-small-wa",
    "ば - ゎ",
    variantHiragana.slice(15).join(""),
    [...variantKanaReadings.slice(15), ...smallHiraganaReadings],
    "ja-hiragana-variants",
  ),
  japaneseWordLesson("hiragana", hiraganaWords, "ja-hiragana-words"),
  kanaCharacterLesson("katakana", "a-so", "ア - ソ", basicKatakana.slice(0, 15).join(""), basicKanaReadings.slice(0, 15), "ja-katakana"),
  kanaCharacterLesson("katakana", "ta-ho", "タ - ホ", basicKatakana.slice(15, 30).join(""), basicKanaReadings.slice(15, 30), "ja-katakana"),
  kanaCharacterLesson("katakana", "ma-n", "マ - ン", basicKatakana.slice(30).join(""), basicKanaReadings.slice(30), "ja-katakana"),
  kanaCharacterLesson(
    "katakana",
    "ga-bo",
    "ガ - ボ",
    variantKatakana.slice(0, 20).join(""),
    variantKanaReadings.slice(0, 20),
    "ja-katakana-variants",
  ),
  kanaCharacterLesson(
    "katakana",
    "pa-long-vowel",
    "パ - ー",
    variantKatakana.slice(20).join(""),
    [...variantKanaReadings.slice(20), ...smallKatakanaReadings],
    "ja-katakana-variants",
  ),
  japaneseWordLesson("katakana", katakanaWords, "ja-katakana-words"),
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
