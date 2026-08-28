"use client";

import {
  DotsSixVertical,
  SpeakerHigh,
  Trash,
} from "@phosphor-icons/react";
import {
  motion,
  Reorder,
  useDragControls,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  languages,
  type LanguageId,
  type LocalizedUnit,
  type PhraseSegment,
} from "@/data/languageLearning";
import { formatUi, type LanguageLearningUiCopy } from "@/data/languageLearningUi";
import styles from "../LanguageLearningLab.module.css";

type SupportLanguageCardProps = {
  languageId: LanguageId;
  localization: LocalizedUnit;
  activePhraseId?: string;
  playing: boolean;
  showRomanization: boolean;
  canMove: boolean;
  reduceMotion: boolean;
  ui: LanguageLearningUiCopy;
  onPlay: () => void;
  onOpenPhrase: (phrase: PhraseSegment) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
};

export function SupportLanguageCard({
  languageId,
  localization,
  activePhraseId,
  playing,
  showRomanization,
  canMove,
  reduceMotion,
  ui,
  onPlay,
  onOpenPhrase,
  onRemove,
  onMove,
}: SupportLanguageCardProps) {
  const reorderControls = useDragControls();
  const swipeControls = useDragControls();
  const x = useMotionValue(0);
  const removeOpacity = useTransform(x, [-82, -28, 0], [1, 0.35, 0]);

  return (
    <Reorder.Item
      as="div"
      value={languageId}
      className={styles.supportLanguageItem}
      dragListener={false}
      dragControls={reorderControls}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 38 }}
    >
      <motion.div className={styles.removeLanguageBackground} style={{ opacity: removeOpacity }} aria-hidden="true">
        <Trash size={17} weight="fill" />
        <span>{ui.remove}</span>
      </motion.div>
      <motion.article
        className={styles.supportLanguageCard}
        lang={languages[languageId].locale}
        style={{ x }}
        drag="x"
        dragListener={false}
        dragControls={swipeControls}
        dragConstraints={{ left: -84, right: 0 }}
        dragElastic={0.06}
        dragSnapToOrigin
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-no-swipe]")) return;
          swipeControls.start(event);
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -58 || info.velocity.x < -520) onRemove();
        }}
      >
        <header>
          <div>
            <span>{languages[languageId].nameNative}</span>
            <small>{languages[languageId].locale}</small>
          </div>
        </header>
        <p className={styles.sentence}>
          {localization.segments.map((phrase) => (
            <button
              type="button"
              key={phrase.id}
              className={activePhraseId === phrase.id ? styles.activePhrase : ""}
              data-no-swipe
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onOpenPhrase(phrase)}
            >
              {phrase.text}
            </button>
          ))}
        </p>
        {showRomanization && localization.romanization
          ? <p className={styles.romanization}>{localization.romanization}</p>
          : null}
        <button
          type="button"
          className={styles.supportAudioButton}
          data-no-swipe
          aria-label={formatUi(ui.playSentence, { language: languages[languageId].nameNative })}
          aria-pressed={playing}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onPlay}
        >
          <SpeakerHigh size={17} weight="fill" />
        </button>
        <button
          type="button"
          className={styles.dragHandle}
          data-no-swipe
          aria-label={formatUi(ui.reorderLanguage, { language: languages[languageId].nameNative })}
          aria-describedby="support-language-help"
          onPointerDown={(event) => {
            event.stopPropagation();
            if (canMove) reorderControls.start(event);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onMove(-1);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              onMove(1);
            } else if (event.key === "Delete" || event.key === "Backspace") {
              event.preventDefault();
              onRemove();
            }
          }}
        >
          <DotsSixVertical size={19} weight="bold" />
        </button>
      </motion.article>
    </Reorder.Item>
  );
}
