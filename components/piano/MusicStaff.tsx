"use client";

import type { CSSProperties } from "react";
import {
  accidentalSymbol,
  formatNotation,
  ledgerStepsFor,
  staffStepFor,
  type StaffClef,
  type StaffNotation,
} from "@/data/pianoNotes";
import styles from "../PianoNoteTrainer.module.css";

export function MusicStaff({ notation, clef }: { notation: StaffNotation; clef: StaffClef }) {
  const step = staffStepFor(notation, clef);
  const ledgerSteps = ledgerStepsFor(notation, clef);
  const style = { "--note-step": step } as CSSProperties;
  const accidental = accidentalSymbol(notation.accidental);

  return (
    <div className={styles.staffCard} role="img" aria-label={`${formatNotation(notation, true)} written in ${clef} clef`}>
      <div className={styles.staffHeader}>
        <span className={styles.clefName}>{clef === "treble" ? "Treble clef" : "Bass clef"}</span>
        <span className={styles.staffRange}>{clef === "treble" ? "C4-C6 range" : "C3-C4 range"}</span>
      </div>
      <div className={styles.staff} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((line) => <span key={line} className={styles.staffLine} />)}
        <span className={styles.staffStartBar} />
        <span className={styles.staffEndBar} />
        <span className={`${styles.clef} ${clef === "bass" ? styles.bassClef : ""}`}>
          {clef === "treble" ? "𝄞" : "𝄢"}
        </span>
        {ledgerSteps.map((ledgerStep) => (
          <span
            key={ledgerStep}
            className={styles.ledgerLine}
            style={{ "--ledger-step": ledgerStep } as CSSProperties}
          />
        ))}
        {accidental ? <span className={styles.accidental} style={style}>{accidental}</span> : null}
        <span className={`${styles.note} ${step >= 4 ? styles.stemDown : ""}`} style={style}>
          <i />
          <b />
        </span>
      </div>
    </div>
  );
}
