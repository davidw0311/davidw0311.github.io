"use client";

import { useId } from "react";
import {
  formatChordSymbol,
  pianoChordQualityLabels,
  type PianoChord,
  type PianoChordQuality,
} from "@/data/pianoNotes";
import styles from "./ChordSelector.module.css";

type ChordSelectorProps = {
  chords: readonly PianoChord[];
  qualities: readonly PianoChordQuality[];
  selectedId: string | null;
  correctId?: string | null;
  wrongId?: string | null;
  disabled?: boolean;
  ariaLabel?: string;
  onChoose: (chord: PianoChord) => void;
};

function accessibleChordName(chord: PianoChord) {
  const root = chord.root.name.replace("/", " or ");
  return `${root} ${chord.quality}`;
}

export function ChordSelector({
  chords,
  qualities,
  selectedId,
  correctId = null,
  wrongId = null,
  disabled = false,
  ariaLabel = "Choose a chord",
  onChoose,
}: ChordSelectorProps) {
  const headingPrefix = useId();

  return (
    <div className={styles.groups} aria-label={ariaLabel}>
      {qualities.map((quality) => {
        const headingId = `${headingPrefix}-${quality}`;
        return (
          <section className={styles.group} key={quality} aria-labelledby={headingId}>
            <h3 id={headingId}>{pianoChordQualityLabels[quality]}</h3>
            <div className={styles.choices}>
              {chords.filter((chord) => chord.quality === quality).map((chord) => {
                const stateClass = chord.id === correctId
                  ? styles.correctChoice
                  : chord.id === wrongId
                    ? styles.wrongChoice
                    : "";
                return (
                  <button
                    type="button"
                    key={chord.id}
                    className={stateClass}
                    disabled={disabled}
                    aria-label={`Choose ${accessibleChordName(chord)} chord`}
                    aria-pressed={selectedId === chord.id}
                    onClick={() => onChoose(chord)}
                  >
                    {formatChordSymbol(chord, true)}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
