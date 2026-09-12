"use client";

import { useState, type ReactNode } from "react";
import styles from "./regius.module.css";

export function SourceReader({ norse, english }: { norse: ReactNode; english: ReactNode }) {
  const [mode, setMode] = useState("norse");
  return <>
    <div className={styles.sourceModes} role="group" aria-label="Text edition">
      {[["norse", "Old Norse"], ["english", "English"], ["both", "Both texts"]].map(([value, label]) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}
    </div>
    <p className={styles.comparisonHint}>{mode === "both" ? "Each column follows its own edition’s order. On a phone, English follows the complete Norse text." : "Tap an underlined name for an explanation. Switch editions above at any time."}</p>
    <div className={styles.sourceColumns} data-mode={mode}>{norse}{english}</div>
  </>;
}
