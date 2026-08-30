"use client";

import { SpeakerHigh } from "@phosphor-icons/react";
import { useState } from "react";
import {
  formatChordSymbol,
  formatPianoKey,
  pianoChordCatalog,
  pianoChordQualities,
  type PianoChord,
} from "@/data/pianoNotes";
import { usePianoAudio } from "@/hooks/usePianoAudio";
import { ChordSelector } from "./piano/ChordSelector";
import { PianoKeyboard } from "./piano/PianoKeyboard";
import styles from "./PianoChordChart.module.css";

export function PianoChordChart() {
  const [selectedChord, setSelectedChord] = useState<PianoChord>(pianoChordCatalog[0]);
  const { playNote, playNotes } = usePianoAudio();

  const chooseChord = (chord: PianoChord) => {
    setSelectedChord(chord);
    playNotes(chord.notes);
  };

  return (
    <section className={styles.chart} aria-label="Interactive piano chord chart">
      <header className={styles.chartHeader} aria-live="polite">
        <div className={styles.selectedChord}>
          <span>Selected chord</span>
          <strong>{formatChordSymbol(selectedChord, true)}</strong>
        </div>
        <div className={styles.chordNotes}>
          <span>Chord tones</span>
          <strong>{selectedChord.notes.map((note) => formatPianoKey(note, true)).join(", ")}</strong>
        </div>
        <button type="button" className={styles.playButton} onClick={() => playNotes(selectedChord.notes)}>
          <SpeakerHigh size={18} weight="fill" /> <span>Play chord</span>
        </button>
      </header>

      <div className={styles.keyboardPanel}>
        <PianoKeyboard
          targetNotes={selectedChord.notes}
          selectedIds={[]}
          answered
          interactive
          showPrompt
          range="chord"
          onChoose={playNote}
        />
      </div>

      <div className={styles.selectorPanel}>
        <div className={styles.selectorHeading}>
          <span>Chord library</span>
          <p>Select any triad to see and hear it on the keyboard.</p>
        </div>
        <ChordSelector
          chords={pianoChordCatalog}
          qualities={pianoChordQualities}
          selectedId={selectedChord.id}
          ariaLabel="Choose a major, minor, or diminished chord"
          onChoose={chooseChord}
        />
      </div>
    </section>
  );
}
