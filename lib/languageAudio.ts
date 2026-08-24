import type { LanguageId } from "@/data/languageLearning";

export type SentenceAudioSpeed = "normal" | "slow";

const audioRoot = "/audio/language-lab/v1";

export function sentenceAudioPath(
  contentSlug: string,
  unitId: string,
  languageId: LanguageId,
  speed: SentenceAudioSpeed = "normal",
) {
  return `${audioRoot}/${contentSlug}/${unitId}/${languageId}/sentence-${speed}.mp3`;
}

export function phraseAudioPath(
  contentSlug: string,
  unitId: string,
  languageId: LanguageId,
  phraseId: string,
) {
  return `${audioRoot}/${contentSlug}/${unitId}/${languageId}/phrases/${phraseId}.mp3`;
}
