"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle,
  Microphone,
  NumberCircleOne,
  SpinnerGap,
  Translate,
  WarningCircle,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import {
  languageIds,
  languages,
  type ContentItem,
  type LanguageId,
} from "@/data/languageLearning";
import { formatUi, type LanguageLearningUiCopy } from "@/data/languageLearningUi";
import styles from "../LanguageLearningLab.module.css";

const languageMarks: Record<LanguageId, string> = {
  en: "EN",
  zh: "中",
  zht: "繁",
  yue: "粵",
  ja: "あ",
  ko: "한",
  ms: "MS",
  fr: "FR",
  es: "ES",
  ta: "அ",
};

type LessonLanguageSetupProps = {
  content: ContentItem;
  contentText: { title: string; description: string };
  practiceLanguageId: LanguageId;
  supportLanguageIds: LanguageId[];
  lessonStarting: boolean;
  lessonEntryError: string;
  ui: LanguageLearningUiCopy;
  onSelectPracticeLanguage: (languageId: LanguageId) => void;
  onToggleDisplayLanguage: (languageId: LanguageId) => void;
  onProceed: () => void;
  onBack: () => void;
};

export function LessonLanguageSetup({
  content,
  contentText,
  practiceLanguageId,
  supportLanguageIds,
  lessonStarting,
  lessonEntryError,
  ui,
  onSelectPracticeLanguage,
  onToggleDisplayLanguage,
  onProceed,
  onBack,
}: LessonLanguageSetupProps) {
  const reduceMotion = useReducedMotion();
  const LessonIcon = content.type === "story" ? BookOpenText : NumberCircleOne;

  return (
    <motion.section
      key="setup"
      className={styles.lessonSetup}
      aria-labelledby="lesson-setup-title"
      initial={reduceMotion ? false : { opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: 10 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
    >
      <div className={styles.setupScrollArea}>
        <div className={styles.setupIntro}>
          <button type="button" className={styles.setupBackButton} onClick={onBack}>
            <ArrowLeft size={18} weight="bold" aria-hidden="true" />
            <span>{ui.lessons}</span>
          </button>
          <div>
            <span>{ui.setupLesson}</span>
            <h1 id="lesson-setup-title">{ui.setupLessonHelp}</h1>
          </div>
        </div>

        <div className={styles.setupGrid}>
          <article className={styles.setupLessonSummary}>
            <span className={styles.setupLessonIcon} aria-hidden="true">
              <LessonIcon size={38} weight="fill" />
            </span>
            <div>
              <small>{content.type === "story" ? ui.story : ui.counting}</small>
              <h2>{contentText.title}</h2>
              <p>{contentText.description}</p>
            </div>
            <div className={styles.setupLessonMeta}>
              <span>{formatUi(ui.minutes, { count: content.estimatedMinutes })}</span>
              <span>{formatUi(ui.promptsCount, { count: content.units.length })}</span>
            </div>
          </article>

          <div className={styles.setupLanguagePanel}>
            <section className={styles.setupLanguageSection} aria-labelledby="learning-language-title">
              <div className={styles.setupSectionHeading}>
                <span className={styles.setupSectionIcon}><Microphone size={22} weight="fill" aria-hidden="true" /></span>
                <div>
                  <h2 id="learning-language-title">{ui.learningLanguage}</h2>
                  <p>{ui.chooseLearningLanguage}</p>
                </div>
              </div>
              <div className={styles.languageTileGrid}>
                {languageIds.map((languageId) => {
                  const selected = practiceLanguageId === languageId;
                  return (
                    <button
                      type="button"
                      key={languageId}
                      className={styles.languageTile}
                      aria-pressed={selected}
                      onClick={() => onSelectPracticeLanguage(languageId)}
                    >
                      <span className={styles.languageMark} aria-hidden="true">{languageMarks[languageId]}</span>
                      <span>
                        <strong>{languages[languageId].nameNative}</strong>
                        <small>{languages[languageId].nameEnglish}</small>
                      </span>
                      {selected ? <CheckCircle size={21} weight="fill" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
              {languages[practiceLanguageId].toneSensitive ? (
                <p className={styles.setupNotice}><WarningCircle size={16} weight="fill" aria-hidden="true" /> {ui.toneWarning}</p>
              ) : null}
            </section>

            <section className={styles.setupLanguageSection} aria-labelledby="display-languages-title">
              <div className={styles.setupSectionHeading}>
                <span className={styles.setupSectionIcon}><Translate size={22} weight="bold" aria-hidden="true" /></span>
                <div>
                  <h2 id="display-languages-title">{ui.displayedLanguages}</h2>
                  <p>{ui.chooseDisplayedLanguages}</p>
                </div>
              </div>
              <div className={styles.displayLanguageTiles}>
                {languageIds.filter((languageId) => languageId !== practiceLanguageId).map((languageId) => {
                  const selected = supportLanguageIds.includes(languageId);
                  return (
                    <button
                      type="button"
                      key={languageId}
                      aria-pressed={selected}
                      onClick={() => onToggleDisplayLanguage(languageId)}
                    >
                      <span aria-hidden="true">{languageMarks[languageId]}</span>
                      <strong>{languages[languageId].nameNative}</strong>
                      {selected ? <CheckCircle size={18} weight="fill" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className={styles.setupActions}>
        <div aria-live="polite">
          {lessonEntryError ? <p role="alert"><WarningCircle size={17} weight="fill" aria-hidden="true" /> {lessonEntryError}</p> : null}
        </div>
        <button type="button" className={styles.setupSecondaryButton} onClick={onBack} disabled={lessonStarting}>
          {ui.lessons}
        </button>
        <button type="button" className={styles.setupProceedButton} onClick={onProceed} disabled={lessonStarting}>
          {lessonStarting
            ? <><SpinnerGap className={styles.spinner} size={20} weight="bold" aria-hidden="true" /> {ui.allowMicrophone}</>
            : <>{ui.proceed} <ArrowRight size={19} weight="bold" aria-hidden="true" /></>}
        </button>
      </div>
    </motion.section>
  );
}
