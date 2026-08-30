"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle,
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
import { languageMarks } from "./languageSelectionOptions";
import { LessonFlowProgress } from "./LessonFlowProgress";

type LessonLanguageSetupProps = {
  content: ContentItem;
  contentText: { title: string; description: string };
  practiceLanguageId: LanguageId;
  supportLanguageIds: LanguageId[];
  lessonStarting: boolean;
  lessonEntryError: string;
  ui: LanguageLearningUiCopy;
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
  onToggleDisplayLanguage,
  onProceed,
  onBack,
}: LessonLanguageSetupProps) {
  const reduceMotion = useReducedMotion();
  const LessonIcon = content.type === "story" ? BookOpenText : NumberCircleOne;

  return (
    <motion.section
      key="display-languages"
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
          <div className={styles.setupIntroCopy}>
            <span>{ui.setupLesson}</span>
            <h1 id="lesson-setup-title">{ui.displayedLanguages}</h1>
            <p>{ui.chooseDisplayedLanguages}</p>
          </div>
          <LessonFlowProgress activeStep="display" ui={ui} />
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
              <span>{languages[practiceLanguageId].nameNative}</span>
            </div>
          </article>

          <div className={styles.setupLanguagePanel}>
            <section
              className={styles.setupLanguageSection}
              aria-labelledby="display-languages-title"
            >
              <div className={styles.setupSectionHeading}>
                <span className={styles.setupSectionIcon}>
                  <Translate size={22} weight="bold" aria-hidden="true" />
                </span>
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
                      <span className={styles.displayLanguageName}>
                        <strong>{languages[languageId].nameNative}</strong>
                        <small>{languages[languageId].nameEnglish}</small>
                      </span>
                      {selected ? <CheckCircle size={18} weight="fill" aria-hidden="true" /> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className={`${styles.setupActions} ${styles.setupActionsLearning}`}>
        <div aria-live="polite">
          {lessonEntryError ? (
            <p role="alert">
              <WarningCircle size={17} weight="fill" aria-hidden="true" />
              {lessonEntryError}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.setupProceedButton}
          onClick={onProceed}
          disabled={lessonStarting}
        >
          {lessonStarting ? (
            <>
              <SpinnerGap className={styles.spinner} size={20} weight="bold" aria-hidden="true" />
              {ui.allowMicrophone}
            </>
          ) : (
            <>
              {ui.proceed} <ArrowRight size={19} weight="bold" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </motion.section>
  );
}
