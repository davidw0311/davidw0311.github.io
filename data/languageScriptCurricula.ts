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
    estimatedMinutes: 3,
    units: lesson.prompts.map((item) => curriculumUnit(lesson, item)),
  };
}

export const modernHiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
export const modernKatakana = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
export const modernHangulConsonants = "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㄲㄸㅃㅆㅉ";
export const modernHangulVowels = "ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣㅐㅔㅚㅟㅢㅒㅖㅘㅙㅝㅞ";

const japaneseLessons: readonly CurriculumLesson[] = [
  {
    id: "ja-hiragana-vowels-v1", slug: "ja-hiragana-vowels", title: "あ・い・う・え・お", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "あ・い・う・え・お", "a i u e o", "a, i, u, e, o"),
      prompt("love", "あい", "ai", "love"),
      prompt("house", "いえ", "ie", "house"),
      prompt("above", "うえ", "ue", "above"),
    ],
  },
  {
    id: "ja-hiragana-k-v1", slug: "ja-hiragana-k", title: "か・き・く・け・こ", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "か・き・く・け・こ", "ka ki ku ke ko", "ka, ki, ku, ke, ko"),
      prompt("face", "かお", "kao", "face"),
      prompt("listen", "きく", "kiku", "to listen"),
      prompt("voice", "こえ", "koe", "voice"),
    ],
  },
  {
    id: "ja-hiragana-s-v1", slug: "ja-hiragana-s", title: "さ・し・す・せ・そ", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "さ・し・す・せ・そ", "sa shi su se so", "sa, shi, su, se, so"),
      prompt("sushi", "すし", "sushi", "sushi"),
      prompt("morning", "あさ", "asa", "morning"),
      prompt("there", "そこ", "soko", "there"),
    ],
  },
  {
    id: "ja-hiragana-t-v1", slug: "ja-hiragana-t", title: "た・ち・つ・て・と", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "た・ち・つ・て・と", "ta chi tsu te to", "ta, chi, tsu, te, to"),
      prompt("song", "うた", "uta", "song"),
      prompt("shoes", "くつ", "kutsu", "shoes"),
      prompt("sound", "おと", "oto", "sound"),
    ],
  },
  {
    id: "ja-hiragana-n-v1", slug: "ja-hiragana-n", title: "な・に・ぬ・ね・の", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "な・に・ぬ・ね・の", "na ni nu ne no", "na, ni, nu, ne, no"),
      prompt("dog", "いぬ", "inu", "dog"),
      prompt("cat", "ねこ", "neko", "cat"),
      prompt("summer", "なつ", "natsu", "summer"),
    ],
  },
  {
    id: "ja-hiragana-h-v1", slug: "ja-hiragana-h", title: "は・ひ・ふ・へ・ほ", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "は・ひ・ふ・へ・ほ", "ha hi fu he ho", "ha, hi, fu, he, ho"),
      prompt("flower", "はな", "hana", "flower"),
      prompt("person", "ひと", "hito", "person"),
      prompt("boat", "ふね", "fune", "boat"),
    ],
  },
  {
    id: "ja-hiragana-m-v1", slug: "ja-hiragana-m", title: "ま・み・む・め・も", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ま・み・む・め・も", "ma mi mu me mo", "ma, mi, mu, me, mo"),
      prompt("sea", "うみ", "umi", "sea"),
      prompt("ears", "みみ", "mimi", "ears"),
      prompt("beans", "まめ", "mame", "beans"),
    ],
  },
  {
    id: "ja-hiragana-y-v1", slug: "ja-hiragana-y", title: "や・ゆ・よ", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "や・ゆ・よ", "ya yu yo", "ya, yu, yo"),
      prompt("mountain", "やま", "yama", "mountain"),
      prompt("dream", "ゆめ", "yume", "dream"),
      prompt("night", "よる", "yoru", "night"),
    ],
  },
  {
    id: "ja-hiragana-r-v1", slug: "ja-hiragana-r", title: "ら・り・る・れ・ろ", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ら・り・る・れ・ろ", "ra ri ru re ro", "ra, ri, ru, re, ro"),
      prompt("sky", "そら", "sora", "sky"),
      prompt("bird", "とり", "tori", "bird"),
      prompt("spring", "はる", "haru", "spring"),
    ],
  },
  {
    id: "ja-hiragana-w-n-v1", slug: "ja-hiragana-w-n", title: "わ・を・ん", sectionId: "ja-hiragana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "わ・を・ん", "wa o n", "wa, object marker o, n"),
      prompt("crocodile", "わに", "wani", "crocodile"),
      prompt("book", "ほん", "hon", "book"),
      prompt("circle", "えん", "en", "circle"),
    ],
  },
  {
    id: "ja-katakana-vowels-v1", slug: "ja-katakana-vowels", title: "ア・イ・ウ・エ・オ", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ア・イ・ウ・エ・オ", "a i u e o", "a, i, u, e, o"),
      prompt("idea", "アイデア", "aidea", "idea"),
      prompt("air", "エア", "ea", "air"),
      prompt("oil", "オイル", "oiru", "oil"),
    ],
  },
  {
    id: "ja-katakana-k-v1", slug: "ja-katakana-k", title: "カ・キ・ク・ケ・コ", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "カ・キ・ク・ケ・コ", "ka ki ku ke ko", "ka, ki, ku, ke, ko"),
      prompt("cake", "ケーキ", "keeki", "cake"),
      prompt("cocoa", "ココア", "kokoa", "cocoa"),
      prompt("cookie", "クッキー", "kukkii", "cookie"),
    ],
  },
  {
    id: "ja-katakana-s-v1", slug: "ja-katakana-s", title: "サ・シ・ス・セ・ソ", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "サ・シ・ス・セ・ソ", "sa shi su se so", "sa, shi, su, se, so"),
      prompt("salad", "サラダ", "sarada", "salad"),
      prompt("soup", "スープ", "suupu", "soup"),
      prompt("set", "セット", "setto", "set"),
    ],
  },
  {
    id: "ja-katakana-t-v1", slug: "ja-katakana-t", title: "タ・チ・ツ・テ・ト", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "タ・チ・ツ・テ・ト", "ta chi tsu te to", "ta, chi, tsu, te, to"),
      prompt("taxi", "タクシー", "takushii", "taxi"),
      prompt("test", "テスト", "tesuto", "test"),
      prompt("toast", "トースト", "toosuto", "toast"),
    ],
  },
  {
    id: "ja-katakana-n-v1", slug: "ja-katakana-n", title: "ナ・ニ・ヌ・ネ・ノ", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ナ・ニ・ヌ・ネ・ノ", "na ni nu ne no", "na, ni, nu, ne, no"),
      prompt("knife", "ナイフ", "naifu", "knife"),
      prompt("tennis", "テニス", "tenisu", "tennis"),
      prompt("notebook", "ノート", "nooto", "notebook"),
    ],
  },
  {
    id: "ja-katakana-h-v1", slug: "ja-katakana-h", title: "ハ・ヒ・フ・ヘ・ホ", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ハ・ヒ・フ・ヘ・ホ", "ha hi fu he ho", "ha, hi, fu, he, ho"),
      prompt("coffee", "コーヒー", "koohii", "coffee"),
      prompt("hotel", "ホテル", "hoteru", "hotel"),
      prompt("fork", "フォーク", "fooku", "fork"),
    ],
  },
  {
    id: "ja-katakana-m-v1", slug: "ja-katakana-m", title: "マ・ミ・ム・メ・モ", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "マ・ミ・ム・メ・モ", "ma mi mu me mo", "ma, mi, mu, me, mo"),
      prompt("memo", "メモ", "memo", "memo"),
      prompt("camera", "カメラ", "kamera", "camera"),
      prompt("game", "ゲーム", "geemu", "game"),
    ],
  },
  {
    id: "ja-katakana-y-v1", slug: "ja-katakana-y", title: "ヤ・ユ・ヨ", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ヤ・ユ・ヨ", "ya yu yo", "ya, yu, yo"),
      prompt("yoga", "ヨガ", "yoga", "yoga"),
      prompt("youth", "ユース", "yuusu", "youth"),
      prompt("tire", "タイヤ", "taiya", "tire"),
    ],
  },
  {
    id: "ja-katakana-r-v1", slug: "ja-katakana-r", title: "ラ・リ・ル・レ・ロ", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ラ・リ・ル・レ・ロ", "ra ri ru re ro", "ra, ri, ru, re, ro"),
      prompt("radio", "ラジオ", "rajio", "radio"),
      prompt("lemon", "レモン", "remon", "lemon"),
      prompt("roll", "ロール", "rooru", "roll"),
    ],
  },
  {
    id: "ja-katakana-w-n-v1", slug: "ja-katakana-w-n", title: "ワ・ヲ・ン", sectionId: "ja-katakana", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ワ・ヲ・ン", "wa o n", "wa, object marker o, n"),
      prompt("wine", "ワイン", "wain", "wine"),
      prompt("one", "ワン", "wan", "one"),
      prompt("online", "オンライン", "onrain", "online"),
    ],
  },
  {
    id: "ja-sounds-hiragana-voiced-v1", slug: "ja-hiragana-voiced", title: "が・ざ・だ・ば・ぱ", sectionId: "ja-sounds", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "がぎぐげご・ざじずぜぞ・だぢづでど・ばびぶべぼ・ぱぴぷぺぽ", "ga gi gu ge go, za ji zu ze zo, da ji zu de do, ba bi bu be bo, pa pi pu pe po", "voiced and semi-voiced Hiragana"),
      prompt("key", "かぎ", "kagi", "key"),
      prompt("water", "みず", "mizu", "water"),
      prompt("bread", "ぱん", "pan", "bread"),
    ],
  },
  {
    id: "ja-sounds-hiragana-combinations-v1", slug: "ja-hiragana-combinations", title: "きゃ・しゅ・ちょ", sectionId: "ja-sounds", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "きゃきゅきょ・しゃしゅしょ・ちゃちゅちょ・にゃにゅにょ・ひゃひゅひょ・みゃみゅみょ・りゃりゅりょ・ぎゃぎゅぎょ・じゃじゅじょ・びゃびゅびょ・ぴゃぴゅぴょ", "kya kyu kyo, sha shu sho, cha chu cho, nya nyu nyo, hya hyu hyo, mya myu myo, rya ryu ryo, gya gyu gyo, ja ju jo, bya byu byo, pya pyu pyo", "contracted Hiragana sounds"),
      prompt("guest", "きゃく", "kyaku", "guest"),
      prompt("hobby", "しゅみ", "shumi", "hobby"),
      prompt("travel", "りょこう", "ryokou", "travel"),
    ],
  },
  {
    id: "ja-sounds-katakana-voiced-v1", slug: "ja-katakana-voiced", title: "ガ・ザ・ダ・バ・パ", sectionId: "ja-sounds", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ガギグゲゴ・ザジズゼゾ・ダヂヅデド・バビブベボ・パピプペポ", "ga gi gu ge go, za ji zu ze zo, da ji zu de do, ba bi bu be bo, pa pi pu pe po", "voiced and semi-voiced Katakana"),
      prompt("glass", "ガラス", "garasu", "glass"),
      prompt("zero", "ゼロ", "zero", "zero"),
      prompt("panda", "パンダ", "panda", "panda"),
    ],
  },
  {
    id: "ja-sounds-katakana-combinations-v1", slug: "ja-katakana-combinations", title: "キャ・シュ・チョ", sectionId: "ja-sounds", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "キャキュキョ・シャシュショ・チャチュチョ・ニャニュニョ・ヒャヒュヒョ・ミャミュミョ・リャリュリョ・ギャギュギョ・ジャジュジョ・ビャビュビョ・ピャピュピョ", "kya kyu kyo, sha shu sho, cha chu cho, nya nyu nyo, hya hyu hyo, mya myu myo, rya ryu ryo, gya gyu gyo, ja ju jo, bya byu byo, pya pyu pyo", "contracted Katakana sounds"),
      prompt("shirt", "シャツ", "shatsu", "shirt"),
      prompt("chocolate", "チョコ", "choko", "chocolate"),
      prompt("news", "ニュース", "nyuusu", "news"),
    ],
  },
  {
    id: "ja-sounds-small-kana-v1", slug: "ja-small-kana", title: "っ・ッ・ー・ヴ", sectionId: "ja-sounds", practiceLanguageId: "ja",
    prompts: [
      prompt("characters", "ぁぃぅぇぉっゃゅょゎ・ァィゥェォッャュョヮヵヶヴー", "small vowels, small tsu, small ya yu yo, small wa, vu, long vowel mark", "small Kana and long sounds"),
      prompt("bed", "ベッド", "beddo", "bed"),
      prompt("file", "ファイル", "fairu", "file"),
      prompt("violin", "ヴァイオリン", "vaiorin", "violin"),
    ],
  },
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
