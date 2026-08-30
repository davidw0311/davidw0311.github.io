"use client";

import type { CSSProperties } from "react";
import {
  blackKeys,
  chordKeyboardNotes,
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

const chordKeyboardRange = {
  id: "chord",
  whiteNotes: chordKeyboardNotes.filter((note) => !note.isBlack),
  blackNotes: chordKeyboardNotes.filter((note) => note.isBlack),
  whiteOffset: 7,
  portraitLeadingWhiteKeys: 0,
  portraitWhiteCount: 12,
};

function keyStateClass(
  note: PianoNote,
  targetNotes: readonly PianoNote[],
  selectedIds: readonly string[],
  answered: boolean,
  showPrompt: boolean,
) {
  const isTarget = targetNotes.some((target) => note.id === target.id);
  const isSelected = selectedIds.includes(note.id);
  return [
    showPrompt && isTarget ? styles.promptKey : "",
    !answered && isSelected ? styles.selectedKey : "",
    answered && isTarget ? styles.correctKey : "",
    answered && isSelected && !isTarget ? styles.wrongKey : "",
  ].filter(Boolean).join(" ");
}

type PianoKeyboardProps = {
  targetNotes: readonly PianoNote[];
  selectedIds: readonly string[];
  answered: boolean;
  interactive: boolean;
  showPrompt: boolean;
  range?: "full" | "chord";
  onChoose: (note: PianoNote, answeredAt: number) => void;
};

export function PianoKeyboard({
  targetNotes,
  selectedIds,
  answered,
  interactive,
  showPrompt,
  range = "full",
  onChoose,
}: PianoKeyboardProps) {
  const visibleRanges = range === "chord"
    ? [chordKeyboardRange]
    : keyboardRanges;

  return (
    <div className={styles.keyboardWrap}>
      <div
        className={`${styles.keyboard} ${range === "chord" ? styles.chordKeyboard : ""} ${showPrompt && !answered ? styles.concealKeyLabels : ""}`}
        role="group"
        aria-label={`Piano keyboard from ${range === "chord" ? "C4 to G5" : "C3 to C6"}, including sharp and flat keys`}
      >
        {visibleRanges.map((keyboardRange) => (
          <div className={styles.keyboardRange} key={keyboardRange.id}>
            <div
              className={styles.whiteKeys}
              style={{
                "--desktop-white-count": keyboardRange.whiteNotes.length,
                "--portrait-white-count": keyboardRange.portraitWhiteCount,
                "--portrait-white-start": keyboardRange.portraitLeadingWhiteKeys + 1,
              } as CSSProperties}
            >
              {keyboardRange.whiteNotes.map((note) => {
                const isTarget = targetNotes.some((target) => target.id === note.id);
                const isSelected = selectedIds.includes(note.id);
                return (
                  <button
                    type="button"
                    key={note.id}
                    className={`${styles.whiteKey} ${keyStateClass(note, targetNotes, selectedIds, answered, showPrompt)}`}
                    disabled={!interactive}
                    tabIndex={interactive ? 0 : -1}
                    aria-label={spokenPitchName(note)}
                    aria-pressed={interactive ? isSelected : undefined}
                    onClick={(event) => onChoose(note, event.timeStamp)}
                  >
                    <span className={(isSelected || (answered && isTarget)) ? styles.visibleKeyLabel : ""}>
                      {note.name}<small>{note.octave}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={styles.blackKeys}>
              {keyboardRange.blackNotes.map((note) => {
                const isSelected = selectedIds.includes(note.id);
                const relativeIndex = (note.afterWhiteIndex ?? keyboardRange.whiteOffset) - keyboardRange.whiteOffset;
                const desktopLeft = ((relativeIndex + 1) / keyboardRange.whiteNotes.length) * 100;
                const portraitLeft = (
                  (relativeIndex + keyboardRange.portraitLeadingWhiteKeys + 1) / keyboardRange.portraitWhiteCount
                ) * 100;
                return (
                  <button
                    type="button"
                    key={note.id}
                    className={`${styles.blackKey} ${keyStateClass(note, targetNotes, selectedIds, answered, showPrompt)}`}
                    style={{
                      "--desktop-left": `${desktopLeft}%`,
                      "--portrait-left": `${portraitLeft}%`,
                      "--black-key-width": `${(0.6 / keyboardRange.whiteNotes.length) * 100}%`,
                    } as CSSProperties}
                    disabled={!interactive}
                    tabIndex={interactive ? 0 : -1}
                    aria-label={spokenPitchName(note)}
                    aria-pressed={interactive ? isSelected : undefined}
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
