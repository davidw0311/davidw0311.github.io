import {
  chineseCharacterStudies,
  isChineseCharacterLanguage,
} from "./chineseCharacterStudy.ts";
import type { LanguageId } from "./languageLearning.ts";

export type StudyTokenKind = "character" | "word";

export type LanguageStudyToken = {
  id: string;
  text: string;
  kind: StudyTokenKind;
  romanization?: string;
};

export type LanguageStudyChunk =
  | { type: "study"; token: LanguageStudyToken }
  | { type: "text"; text: string };

export function usesCharacterStudy(
  languageId: LanguageId,
): languageId is Extract<LanguageId, "zh" | "yue" | "ja"> {
  return languageId === "zh" || languageId === "yue" || languageId === "ja";
}

function characterStudyToken(
  character: string,
  languageId: Extract<LanguageId, "zh" | "yue" | "ja">,
): LanguageStudyToken | null {
  if (!/[\p{L}\p{N}]/u.test(character)) return null;
  const chineseStudy = isChineseCharacterLanguage(languageId)
    ? chineseCharacterStudies[languageId][character]
    : undefined;
  return {
    id: chineseStudy?.id ?? `character-${languageId}-${character}`,
    text: character,
    kind: "character",
    romanization: chineseStudy?.romanization,
  };
}

function wordStudyToken(word: string, languageId: LanguageId): LanguageStudyToken {
  const normalizedWord = word.normalize("NFC").toLocaleLowerCase();
  return {
    id: `word-${languageId}-${normalizedWord}`,
    text: word,
    kind: "word",
  };
}

export function tokenizeLanguageStudyText(
  text: string,
  languageId: LanguageId,
): LanguageStudyChunk[] {
  if (usesCharacterStudy(languageId)) {
    const chunks: LanguageStudyChunk[] = [];
    let plainText = "";
    const flushPlainText = () => {
      if (!plainText) return;
      chunks.push({ type: "text", text: plainText });
      plainText = "";
    };

    for (const character of text) {
      const token = characterStudyToken(character, languageId);
      if (!token) {
        plainText += character;
        continue;
      }
      flushPlainText();
      chunks.push({ type: "study", token });
    }
    flushPlainText();
    return chunks;
  }

  const chunks: LanguageStudyChunk[] = [];
  const wordPattern = /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu;
  let previousEnd = 0;
  for (const match of text.matchAll(wordPattern)) {
    const start = match.index;
    if (start > previousEnd) chunks.push({ type: "text", text: text.slice(previousEnd, start) });
    chunks.push({ type: "study", token: wordStudyToken(match[0], languageId) });
    previousEnd = start + match[0].length;
  }
  if (previousEnd < text.length) chunks.push({ type: "text", text: text.slice(previousEnd) });
  return chunks;
}
