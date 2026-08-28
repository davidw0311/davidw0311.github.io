"use client";

import {
  ArrowLeft,
  BookmarkSimple,
  SpeakerHigh,
  Translate,
  X,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useState } from "react";
import {
  languages,
  type LanguageId,
  type LearningUnit,
  type LocalProgress,
  type PhraseSegment,
  type PronunciationMode,
} from "@/data/languageLearning";
import { formatUi, type LanguageLearningUiCopy } from "@/data/languageLearningUi";
import {
  getEnglishPronunciationGuide,
  getNativePronunciationGuide,
  nativePronunciationSystems,
  type NativePronunciationSystem,
} from "@/data/languagePronunciation";
import {
  tokenizeLanguageStudyText,
  type LanguageStudyToken,
} from "@/data/languageStudyTokens";
import { phraseAudioPath } from "@/lib/languageAudio";
import styles from "../LanguageLearningLab.module.css";

export type ActivePhrase = {
  languageId: LanguageId;
  phrase: PhraseSegment;
};

type PhraseStudyPanelProps = {
  activePhrase: ActivePhrase;
  contentSlug: string;
  currentUnit: LearningUnit;
  playingSampleId: string | null;
  progress: LocalProgress;
  readingFocusActive: boolean;
  reduceMotion: boolean;
  supportLanguageId: LanguageId;
  ui: LanguageLearningUiCopy;
  onClose: () => void;
  onPlaySample: (options: {
    sampleId: string;
    source: string;
    text: string;
    languageId: LanguageId;
  }) => void;
  onSetPronunciationMode: (languageId: LanguageId, mode: PronunciationMode) => void;
  onToggleSaved: (itemId: string) => void;
};

function nativePronunciationLabel(
  system: NativePronunciationSystem,
  ui: LanguageLearningUiCopy,
): string {
  if (system === "pinyin") return ui.pinyin;
  if (system === "jyutping") return ui.jyutping;
  if (system === "hiragana") return ui.hiragana;
  if (system === "romanization") return ui.romanizationLabel;
  return ui.transliteration;
}

export function PhraseStudyPanel({
  activePhrase,
  contentSlug,
  currentUnit,
  playingSampleId,
  progress,
  readingFocusActive,
  reduceMotion,
  supportLanguageId,
  ui,
  onClose,
  onPlaySample,
  onSetPronunciationMode,
  onToggleSaved,
}: PhraseStudyPanelProps) {
  const [activeStudyToken, setActiveStudyToken] = useState<LanguageStudyToken | null>(null);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const localization = currentUnit.localizations[activePhrase.languageId];
  const nativePronunciation = getNativePronunciationGuide(
    activePhrase.languageId,
    activePhrase.phrase,
    localization,
    activeStudyToken ?? undefined,
  );
  const englishPronunciation = getEnglishPronunciationGuide(
    activePhrase.languageId,
    activePhrase.phrase,
    localization,
    activeStudyToken ?? undefined,
  );
  const pronunciationMode = progress.pronunciationModes[activePhrase.languageId] ?? "off";
  const pronunciationSystem = nativePronunciationSystems[activePhrase.languageId];
  const pronunciationGuide = pronunciationMode === "native"
    ? nativePronunciation
    : pronunciationMode === "english" ? englishPronunciation : null;
  const phraseMeaning = activePhrase.languageId !== supportLanguageId && supportLanguageId !== "en"
    ? currentUnit.localizations[supportLanguageId].text
    : activePhrase.phrase.translation;
  const phraseMeaningLanguage = activePhrase.languageId !== supportLanguageId && supportLanguageId !== "en"
    ? languages[supportLanguageId].nameNative
    : languages.en.nameNative;
  const selectedItemId = activeStudyToken?.id ?? activePhrase.phrase.id;
  const itemIsSaved = progress.savedPhraseIds.includes(selectedItemId);

  return (
    <motion.aside
      className={styles.phrasePanel}
      aria-label={activeStudyToken
        ? activeStudyToken.kind === "character" ? ui.characterDetails : ui.wordDetails
        : ui.phraseDetails}
      aria-hidden={readingFocusActive}
      inert={readingFocusActive}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: readingFocusActive ? 0 : 1, y: 0, scale: readingFocusActive ? 0.99 : 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        className={styles.closePhraseButton}
        aria-label={activeStudyToken
          ? activeStudyToken.kind === "character" ? ui.closeCharacterDetails : ui.closeWordDetails
          : ui.closePhraseDetails}
        onClick={onClose}
      >
        <X size={16} weight="bold" aria-hidden="true" />
      </button>

      {activeStudyToken ? (
        <>
          <button
            type="button"
            className={styles.backToPhraseButton}
            aria-label={ui.backToPhrase}
            onClick={() => setActiveStudyToken(null)}
          >
            <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          </button>
          <div>
            <span>{formatUi(
              activeStudyToken.kind === "character" ? ui.characterIn : ui.wordIn,
              { language: languages[activePhrase.languageId].nameNative },
            )}</span>
            <strong
              className={activeStudyToken.kind === "character" ? styles.characterGlyph : styles.wordGlyph}
              lang={languages[activePhrase.languageId].locale}
            >
              {activeStudyToken.text}
            </strong>
          </div>
          <div className={styles.phraseActions}>
            <button
              type="button"
              aria-pressed={itemIsSaved}
              onClick={() => onToggleSaved(activeStudyToken.id)}
            >
              <BookmarkSimple size={18} weight={itemIsSaved ? "fill" : "regular"} />
              {itemIsSaved ? ui.saved : ui.save}
            </button>
          </div>
        </>
      ) : (
        <>
          <div>
            <span>{formatUi(ui.phraseIn, { language: languages[activePhrase.languageId].nameNative })}</span>
            <strong className={styles.phraseStudyText} lang={languages[activePhrase.languageId].locale}>
              {tokenizeLanguageStudyText(activePhrase.phrase.text, activePhrase.languageId).map((chunk, index) => (
                chunk.type === "study" ? (
                  <button
                    type="button"
                    key={`${chunk.token.id}-${index}`}
                    className={progress.savedPhraseIds.includes(chunk.token.id) ? styles.savedStudyToken : ""}
                    onClick={() => setActiveStudyToken(chunk.token)}
                  >
                    {chunk.token.text}
                  </button>
                ) : <span key={`text-${index}`}>{chunk.text}</span>
              ))}
            </strong>
          </div>
          <div className={styles.phraseActions}>
            <button
              type="button"
              aria-pressed={playingSampleId === `phrase:${activePhrase.phrase.id}`}
              onClick={() => onPlaySample({
                sampleId: `phrase:${activePhrase.phrase.id}`,
                source: phraseAudioPath(
                  contentSlug,
                  currentUnit.id,
                  activePhrase.languageId,
                  activePhrase.phrase.id,
                ),
                text: activePhrase.phrase.text,
                languageId: activePhrase.languageId,
              })}
            >
              <SpeakerHigh size={18} weight="fill" /> {ui.play}
            </button>
            <button
              type="button"
              aria-pressed={itemIsSaved}
              onClick={() => onToggleSaved(activePhrase.phrase.id)}
            >
              <BookmarkSimple size={18} weight={itemIsSaved ? "fill" : "regular"} />
              {itemIsSaved ? ui.saved : ui.save}
            </button>
            <button
              type="button"
              aria-expanded={translationRevealed}
              onClick={() => setTranslationRevealed((value) => !value)}
            >
              <Translate size={18} /> {translationRevealed ? ui.hideMeaning : ui.showMeaning}
            </button>
          </div>
          {translationRevealed ? (
            <p>
              <small>{formatUi(ui.meaningIn, { language: phraseMeaningLanguage })}</small>
              {phraseMeaning}
            </p>
          ) : null}
        </>
      )}

      {nativePronunciation || englishPronunciation ? (
        <div className={styles.pronunciationBlock}>
          <div className={styles.pronunciationOptions} role="group" aria-label={ui.pronunciationGuide}>
            <span>{ui.pronunciationGuide}</span>
            <button
              type="button"
              aria-pressed={pronunciationMode === "off"}
              onClick={() => onSetPronunciationMode(activePhrase.languageId, "off")}
            >
              {ui.pronunciationOff}
            </button>
            {nativePronunciation && pronunciationSystem ? (
              <button
                type="button"
                aria-pressed={pronunciationMode === "native"}
                onClick={() => onSetPronunciationMode(activePhrase.languageId, "native")}
              >
                {nativePronunciationLabel(pronunciationSystem, ui)}
              </button>
            ) : null}
            {englishPronunciation ? (
              <button
                type="button"
                aria-pressed={pronunciationMode === "english"}
                onClick={() => onSetPronunciationMode(activePhrase.languageId, "english")}
              >
                {ui.englishPhonetics}
              </button>
            ) : null}
          </div>
          {pronunciationGuide ? (
            <p className={styles.pronunciationReading}>
              <small>
                {pronunciationMode === "native" && pronunciationSystem
                  ? nativePronunciationLabel(pronunciationSystem, ui)
                  : ui.englishPhonetics}
                {activeStudyToken && pronunciationGuide.scope === "phrase" ? ` · ${ui.phraseGuide}` : ""}
              </small>
              {pronunciationGuide.text}
            </p>
          ) : null}
        </div>
      ) : null}
    </motion.aside>
  );
}
