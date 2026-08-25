import { speechLanguageId, type LanguageId } from "../data/languageLearning.ts";

export type SentenceAudioSpeed = "normal" | "slow";

const audioRoot = "/audio/language-lab/v1";

export function sentenceAudioPath(
  contentSlug: string,
  unitId: string,
  languageId: LanguageId,
  speed: SentenceAudioSpeed = "normal",
) {
  return `${audioRoot}/${contentSlug}/${unitId}/${speechLanguageId(languageId)}/sentence-${speed}.mp3`;
}

export function phraseAudioPath(
  contentSlug: string,
  unitId: string,
  languageId: LanguageId,
  phraseId: string,
) {
  const audioLanguageId = speechLanguageId(languageId);
  const audioPhraseId = languageId === "zht" ? phraseId.replace(/-zht(?=-|$)/u, "-zh") : phraseId;
  return `${audioRoot}/${contentSlug}/${unitId}/${audioLanguageId}/phrases/${audioPhraseId}.mp3`;
}
