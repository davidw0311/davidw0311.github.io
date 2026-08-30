"use client";

import {
  ArrowRight,
  CheckCircle,
  Microphone,
  WarningCircle,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import {
  languageIds,
  languages,
  type LanguageId,
} from "@/data/languageLearning";
import type { LanguageLearningUiCopy } from "@/data/languageLearningUi";
import styles from "../LanguageLearningLab.module.css";
import { languageMarks } from "./languageSelectionOptions";
import { LessonFlowProgress } from "./LessonFlowProgress";

type LearningLanguageSelectionProps = {
  practiceLanguageId: LanguageId;
  ui: LanguageLearningUiCopy;
  onSelect: (languageId: LanguageId) => void;
  onProceed: () => void;
};

export function LearningLanguageSelection({
  practiceLanguageId,
  ui,
  onSelect,
  onProceed,
}: LearningLanguageSelectionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      key="learning-language"
      className={`${styles.lessonSetup} ${styles.languageSelectionSetup}`}
      aria-labelledby="learning-language-title"
      initial={reduceMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
    >
      <div className={styles.setupScrollArea}>
        <div className={styles.setupIntro}>
          <div className={styles.setupIntroCopy}>
            <span>{ui.setupLesson}</span>
            <h1 id="learning-language-title">{ui.learningLanguage}</h1>
            <p>{ui.chooseLearningLanguage}</p>
          </div>
          <LessonFlowProgress activeStep="learning" ui={ui} />
        </div>

        <div className={styles.languageSelectionGrid}>
          <section className={styles.setupLanguageSection} aria-label={ui.learningLanguage}>
            <div className={styles.setupSectionHeading}>
              <span className={styles.setupSectionIcon}>
                <Microphone size={22} weight="fill" aria-hidden="true" />
              </span>
              <div>
                <h2>{ui.learningLanguage}</h2>
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
                    onClick={() => onSelect(languageId)}
                  >
                    <span className={styles.languageMark} aria-hidden="true">
                      {languageMarks[languageId]}
                    </span>
                    <span>
                      <strong>{languages[languageId].nameNative}</strong>
                      <small>{languages[languageId].nameEnglish}</small>
                    </span>
                    {selected ? <CheckCircle size={21} weight="fill" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div className={`${styles.setupActions} ${styles.setupActionsLearning}`}>
        <div aria-live="polite">
          {languages[practiceLanguageId].toneSensitive ? (
            <p className={styles.setupToneNotice}>
              <WarningCircle size={17} weight="fill" aria-hidden="true" />
              {ui.toneWarning}
            </p>
          ) : null}
        </div>
        <button type="button" className={styles.setupProceedButton} onClick={onProceed}>
          {ui.continue} <ArrowRight size={19} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </motion.section>
  );
}
