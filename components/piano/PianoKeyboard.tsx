"use client";

import type { CSSProperties } from "react";
import {
  blackKeys,
  formatPianoKey,
  spokenPitchName,
  whiteKeys,
  type PianoNote,
} from "@/data/pianoNotes";
import styles from "../PianoNoteTrainer.module.css";

const keyboardRanges = [
  {
    id: "lower",
    whiteNotes: whiteKeys.filter((note) => note.octave === 3),
    blackNotes: blackKeys.filter((note) => note.octave === 3),
    whiteOffset: 0,
    portraitLeadingWhiteKeys: 0,
    portraitWhiteCount: 8,
  },
  {
    id: "middle",
    whiteNotes: whiteKeys.filter((note) => note.octave === 4),
    blackNotes: blackKeys.filter((note) => note.octave === 4),
    whiteOffset: 7,
    portraitLeadingWhiteKeys: 0,
    portraitWhiteCount: 8,
  },
  {
    id: "upper",
    whiteNotes: whiteKeys.filter((note) => note.octave === 5 || note.id === "C6"),
    blackNotes: blackKeys.filter((note) => note.octave === 5),
    whiteOffset: 14,
    portraitLeadingWhiteKeys: 0,
    portraitWhiteCount: 8,
  },
];

function keyStateClass(
  note: PianoNote,
  target: PianoNote,
  selectedId: string | null,
  answered: boolean,
  showPrompt: boolean,
) {
  const isTarget = note.id === target.id;
  const isSelected = selectedId === note.id;
  return [
    showPrompt && isTarget ? styles.promptKey : "",
    answered && isTarget ? styles.correctKey : "",
    answered && isSelected && !isTarget ? styles.wrongKey : "",
  ].filter(Boolean).join(" ");
}

type PianoKeyboardProps = {
  target: PianoNote;
  selectedId: string | null;
  answered: boolean;
  interactive: boolean;
  showPrompt: boolean;
  onChoose: (note: PianoNote, answeredAt: number) => void;
};

export function PianoKeyboard({
  target,
  selectedId,
  answered,
  interactive,
  showPrompt,
  onChoose,
}: PianoKeyboardProps) {
  return (
    <div className={styles.keyboardWrap}>
      <div
        className={`${styles.keyboard} ${showPrompt && !answered ? styles.concealKeyLabels : ""}`}
        role="group"
        aria-label="Piano keyboard from C3 to C6, including sharp and flat keys"
      >
        {keyboardRanges.map((range) => (
          <div className={styles.keyboardRange} key={range.id}>
            <div
              className={styles.whiteKeys}
              style={{
                "--desktop-white-count": range.whiteNotes.length,
                "--portrait-white-count": range.portraitWhiteCount,
                "--portrait-white-start": range.portraitLeadingWhiteKeys + 1,
              } as CSSProperties}
            >
              {range.whiteNotes.map((note) => (
                <button
                  type="button"
                  key={note.id}
                  className={`${styles.whiteKey} ${keyStateClass(note, target, selectedId, answered, showPrompt)}`}
                  disabled={!interactive}
                  tabIndex={interactive ? 0 : -1}
                  aria-label={spokenPitchName(note)}
                  aria-pressed={interactive ? selectedId === note.id : undefined}
                  onClick={(event) => onChoose(note, event.timeStamp)}
                >
                  <span className={answered && (note.id === target.id || note.id === selectedId) ? styles.visibleKeyLabel : ""}>
                    {note.name}<small>{note.octave}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className={styles.blackKeys}>
              {range.blackNotes.map((note) => {
                const relativeIndex = (note.afterWhiteIndex ?? range.whiteOffset) - range.whiteOffset;
                const desktopLeft = ((relativeIndex + 1) / range.whiteNotes.length) * 100;
                const portraitLeft = (
                  (relativeIndex + range.portraitLeadingWhiteKeys + 1) / range.portraitWhiteCount
                ) * 100;
                return (
                  <button
                    type="button"
                    key={note.id}
                    className={`${styles.blackKey} ${keyStateClass(note, target, selectedId, answered, showPrompt)}`}
                    style={{
                      "--desktop-left": `${desktopLeft}%`,
                      "--portrait-left": `${portraitLeft}%`,
                    } as CSSProperties}
                    disabled={!interactive}
                    tabIndex={interactive ? 0 : -1}
                    aria-label={spokenPitchName(note)}
                    aria-pressed={interactive ? selectedId === note.id : undefined}
                    onClick={(event) => onChoose(note, event.timeStamp)}
                  >
                    <span>{formatPianoKey(note)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
