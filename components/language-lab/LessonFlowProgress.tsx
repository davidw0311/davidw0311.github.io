import {
  ArrowRight,
  BookOpenText,
  Microphone,
  Translate,
} from "@phosphor-icons/react";
import type { LanguageLearningUiCopy } from "@/data/languageLearningUi";
import styles from "../LanguageLearningLab.module.css";

export type LessonFlowStep = "learning" | "lessons" | "display";

type LessonFlowProgressProps = {
  activeStep: LessonFlowStep;
  ui: LanguageLearningUiCopy;
};

export function LessonFlowProgress({ activeStep, ui }: LessonFlowProgressProps) {
  return (
    <div className={styles.setupProgress} aria-label={ui.setupLesson}>
      <span
        data-active={activeStep === "learning"}
        aria-current={activeStep === "learning" ? "step" : undefined}
      >
        <Microphone size={17} weight="fill" aria-hidden="true" />
        <strong>{ui.learningLanguage}</strong>
      </span>
      <ArrowRight size={15} weight="bold" aria-hidden="true" />
      <span
        data-active={activeStep === "lessons"}
        aria-current={activeStep === "lessons" ? "step" : undefined}
      >
        <BookOpenText size={17} weight="fill" aria-hidden="true" />
        <strong>{ui.lessons}</strong>
      </span>
      <ArrowRight size={15} weight="bold" aria-hidden="true" />
      <span
        data-active={activeStep === "display"}
        aria-current={activeStep === "display" ? "step" : undefined}
      >
        <Translate size={17} weight="bold" aria-hidden="true" />
        <strong>{ui.displayedLanguages}</strong>
      </span>
    </div>
  );
}
