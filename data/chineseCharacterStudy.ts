import type { LanguageId } from "./languageLearning";

export type ChineseCharacterLanguageId = Extract<LanguageId, "zh" | "zht" | "yue">;

export type ChineseCharacterStudy = {
  id: string;
  character: string;
  romanization: string;
};

export type ChineseCharacterToken =
  | { type: "character"; study: ChineseCharacterStudy }
  | { type: "text"; text: string };

const readings = {
  zh: {
    早: "zǎo", 上: "shàng", 好: "hǎo", 市: "shì", 场: "chǎng", 已: "yǐ", 经: "jīng",
    很: "hěn", 热: "rè", 闹: "nào", 了: "le", 请: "qǐng", 给: "gěi", 我: "wǒ",
    三: "sān", 个: "gè", 红: "hóng", 苹: "píng", 果: "guǒ", 谢: "xiè", 看: "kàn",
    起: "qǐ", 来: "lái", 吃: "chī", 回: "huí", 家: "jiā", 的: "de", 路: "lù",
    下: "xià", 雨: "yǔ", 打: "dǎ", 开: "kāi", 色: "sè", 小: "xiǎo", 伞: "sǎn",
    灯: "dēng", 映: "yìng", 在: "zài", 每: "měi", 水: "shuǐ", 洼: "wā", 里: "lǐ",
    一: "yī", 二: "èr", 四: "sì", 五: "wǔ", 六: "liù", 七: "qī", 八: "bā",
    九: "jiǔ", 十: "shí", 海: "hǎi", 房: "fáng", 子: "zi", 猫: "māo", 狗: "gǒu",
    寿: "shòu", 司: "sī", 天: "tiān", 空: "kōng", 鸟: "niǎo", 花: "huā", 船: "chuán",
    山: "shān", 梦: "mèng", 夜: "yè", 晚: "wǎn", 耳: "ěr", 朵: "duo", 豆: "dòu",
    书: "shū", 面: "miàn", 包: "bāo", 钥: "yào", 匙: "shi", 鞋: "xié", 公: "gōng",
    交: "jiāo", 车: "chē", 笔: "bǐ", 门: "mén", 相: "xiàng", 机: "jī", 电: "diàn",
    视: "shì", 收: "shōu", 音: "yīn", 酒: "jiǔ", 店: "diàn", 西: "xī", 柿: "shì",
    钢: "gāng", 琴: "qín", 备: "bèi", 忘: "wàng", 录: "lù", 零: "líng", 可: "kě",
    蛋: "dàn", 糕: "gāo", 汤: "tāng", 衬: "chèn", 衫: "shān", 巧: "qiǎo",
    克: "kè", 力: "lì", 新: "xīn", 闻: "wén", 记: "jì", 本: "běn", 出: "chū", 租: "zū",
  },
  zht: {
    早: "zǎo", 上: "shàng", 好: "hǎo", 市: "shì", 場: "chǎng", 已: "yǐ", 經: "jīng",
    很: "hěn", 熱: "rè", 鬧: "nào", 了: "le", 請: "qǐng", 給: "gěi", 我: "wǒ",
    三: "sān", 個: "gè", 紅: "hóng", 蘋: "píng", 果: "guǒ", 謝: "xiè", 看: "kàn",
    起: "qǐ", 來: "lái", 吃: "chī", 回: "huí", 家: "jiā", 的: "de", 路: "lù",
    下: "xià", 雨: "yǔ", 打: "dǎ", 開: "kāi", 色: "sè", 小: "xiǎo", 傘: "sǎn",
    燈: "dēng", 映: "yìng", 在: "zài", 每: "měi", 水: "shuǐ", 窪: "wā", 裡: "lǐ",
    一: "yī", 二: "èr", 四: "sì", 五: "wǔ", 六: "liù", 七: "qī", 八: "bā",
    九: "jiǔ", 十: "shí", 海: "hǎi", 房: "fáng", 子: "zi", 貓: "māo", 狗: "gǒu",
    壽: "shòu", 司: "sī", 天: "tiān", 空: "kōng", 鳥: "niǎo", 花: "huā", 船: "chuán",
    山: "shān", 夢: "mèng", 夜: "yè", 晚: "wǎn", 耳: "ěr", 朵: "duo", 豆: "dòu",
    書: "shū", 麵: "miàn", 包: "bāo", 鑰: "yào", 匙: "shi", 鞋: "xié", 公: "gōng",
    交: "jiāo", 車: "chē", 筆: "bǐ", 門: "mén", 相: "xiàng", 機: "jī", 電: "diàn",
    視: "shì", 收: "shōu", 音: "yīn", 酒: "jiǔ", 店: "diàn", 西: "xī", 柿: "shì",
    鋼: "gāng", 琴: "qín", 備: "bèi", 忘: "wàng", 錄: "lù", 零: "líng", 可: "kě",
    蛋: "dàn", 糕: "gāo", 湯: "tāng", 襯: "chèn", 衫: "shān", 巧: "qiǎo",
    克: "kè", 力: "lì", 新: "xīn", 聞: "wén", 記: "jì", 本: "běn", 出: "chū", 租: "zū",
  },
  yue: {
    早: "zou2", 晨: "san4", 街: "gaai1", 市: "si5", 已: "ji5", 經: "ging1", 好: "hou2",
    熱: "jit6", 鬧: "naau6", 我: "ngo5", 想: "soeng2", 要: "jiu3", 三: "saam1", 個: "go3",
    紅: "hung4", 蘋: "ping4", 果: "gwo2", 唔: "m4", 該: "goi1", 多: "do1", 謝: "ze6",
    睇: "tai2", 落: "lok6", 食: "sik6", 返: "faan1", 屋: "uk1", 企: "kei2", 途: "tou4",
    中: "zung1", 開: "hoi1", 始: "ci2", 雨: "jyu5", 打: "daa2", 咗: "zo2", 把: "baa2",
    色: "sik1", 嘅: "ge3", 小: "siu2", 傘: "saan3", 燈: "dang1", 映: "jing2", 照: "ziu3",
    喺: "hai2", 每: "mui5", 水: "seoi2", 氹: "tam5", 入: "jap6", 面: "min6", 一: "jat1",
    二: "ji6", 四: "sei3", 五: "ng5", 六: "luk6", 七: "cat1", 八: "baat3", 九: "gau2",
    十: "sap6", 海: "hoi2", 貓: "maau1", 狗: "gau2", 壽: "sau6", 司: "si1",
    天: "tin1", 空: "hung1", 鳥: "niu5", 花: "faa1", 船: "syun4", 山: "saan1",
    夢: "mung6", 夜: "je6", 晚: "maan5", 耳: "ji5", 朵: "do2", 豆: "dau6",
    書: "syu1", 麵: "min6", 包: "baau1", 鎖: "so2", 匙: "si4", 鞋: "haai4",
    朝: "ziu1", 巴: "baa1", 士: "si2", 筆: "bat1", 門: "mun4", 相: "soeng2",
    機: "gei1", 電: "din6", 視: "si6", 收: "sau1", 音: "jam1", 酒: "zau2",
    店: "dim3", 番: "faan1", 茄: "ke2", 鋼: "gong3", 琴: "kam4", 備: "bei6",
    忘: "mong4", 錄: "luk6", 零: "ling4", 可: "ho2", 蛋: "daan6", 糕: "gou1",
    湯: "tong1", 恤: "seot1", 衫: "saam1", 朱: "zyu1", 古: "gu1", 力: "lik6",
    新: "san1", 聞: "man4", 記: "gei3", 簿: "bou2", 的: "dik1",
  },
} as const satisfies Record<ChineseCharacterLanguageId, Record<string, string>>;

export const chineseCharacterStudies: Record<
  ChineseCharacterLanguageId,
  Readonly<Record<string, ChineseCharacterStudy>>
> = Object.fromEntries(
  Object.entries(readings).map(([languageId, languageReadings]) => [
    languageId,
    Object.fromEntries(
      Object.entries(languageReadings).map(([character, romanization]) => [
        character,
        { id: `character-${languageId}-${character}`, character, romanization },
      ]),
    ),
  ]),
) as Record<ChineseCharacterLanguageId, Readonly<Record<string, ChineseCharacterStudy>>>;

export function isChineseCharacterLanguage(
  languageId: LanguageId,
): languageId is ChineseCharacterLanguageId {
  return languageId === "zh" || languageId === "zht" || languageId === "yue";
}

export function tokenizeChineseCharacters(
  text: string,
  languageId: ChineseCharacterLanguageId,
): ChineseCharacterToken[] {
  const tokens: ChineseCharacterToken[] = [];
  let plainText = "";

  const flushPlainText = () => {
    if (!plainText) return;
    tokens.push({ type: "text", text: plainText });
    plainText = "";
  };

  for (const character of text) {
    const study = chineseCharacterStudies[languageId][character];
    if (!study) {
      plainText += character;
      continue;
    }
    flushPlainText();
    tokens.push({ type: "character", study });
  }
  flushPlainText();
  return tokens;
}
