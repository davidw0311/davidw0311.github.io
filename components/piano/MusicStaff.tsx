"use client";

import type { CSSProperties } from "react";
import {
  accidentalSymbol,
  formatNotation,
  keySignatureStaffSteps,
  ledgerStepsFor,
  staffStepFor,
  type StaffClef,
  type StaffNotation,
  type PianoKeySignature,
} from "@/data/pianoNotes";
import styles from "../PianoNoteTrainer.module.css";

type MusicStaffProps = {
  notation: StaffNotation;
  clef: StaffClef;
  keySignature?: PianoKeySignature;
};

function KeySignatureGlyph({ accidental }: { accidental: PianoKeySignature["accidental"] }) {
  if (accidental === "sharp") {
    return (
      <svg className={styles.keySignatureGlyph} viewBox="0 0 24 36" focusable="false">
        <path d="M8.1 1.5 6.7 34.5M17.4.8 16 33.8" strokeWidth="2.35" />
        <path d="m2 13.8 20-3.5M1.5 25.8l20-3.5" strokeWidth="3.25" />
      </svg>
    );
  }

  return (
    <svg className={styles.keySignatureGlyph} viewBox="0 0 20 42" focusable="false">
      <path d="M6.5 1.5v37.2M6.5 20.2c7.8-4.8 12.2-1.6 11.1 4.9-1 5.8-6.4 10.8-11.1 13.6" strokeWidth="2.55" />
    </svg>
  );
}

export function MusicStaff({ notation, clef, keySignature }: MusicStaffProps) {
  const step = staffStepFor(notation, clef);
  const ledgerSteps = ledgerStepsFor(notation, clef);
  const style = { "--note-step": step } as CSSProperties;
  const accidental = keySignature ? "" : accidentalSymbol(notation.accidental);
  const signatureSteps = keySignature ? keySignatureStaffSteps(keySignature, clef) : [];

  return (
    <div
      className={styles.staffCard}
      role="img"
      aria-label={`${formatNotation(notation, true)} written in ${clef} clef${keySignature ? ` in ${keySignature.name}` : ""}`}
    >
      <div className={styles.staffHeader}>
        <span className={styles.clefName}>
          {clef === "treble" ? "Treble clef" : "Bass clef"}
          {keySignature ? ` · ${keySignature.name}` : ""}
        </span>
        <span className={styles.staffRange}>{clef === "treble" ? "C4-C6 range" : "C3-C4 range"}</span>
      </div>
      <div className={styles.staff} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((line) => <span key={line} className={styles.staffLine} />)}
        <span className={styles.staffStartBar} />
        <span className={styles.staffEndBar} />
        <span className={`${styles.clef} ${clef === "bass" ? styles.bassClef : styles.trebleClef}`}>
          {clef === "treble" ? "𝄞" : "𝄢"}
        </span>
        {signatureSteps.map((signatureStep, index) => (
          <span
            className={`${styles.keySignatureAccidental} ${keySignature?.accidental === "flat" ? styles.keySignatureFlat : styles.keySignatureSharp}`}
            key={`${keySignature?.accidental}-${index}`}
            style={{
              "--signature-index": index,
              "--signature-step": signatureStep,
            } as CSSProperties}
          >
            {keySignature ? <KeySignatureGlyph accidental={keySignature.accidental} /> : null}
          </span>
        ))}
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
