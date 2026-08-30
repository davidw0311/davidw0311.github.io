"use client";

import { ArrowClockwise, ArrowRight, CheckCircle, SpeakerHigh, SpeakerSlash, XCircle } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import {
  chordMatchesNoteIds,
  createPianoChordQuestion,
  createPianoQuestion,
  formatNotation,
  formatPianoKey,
  pianoChords,
  pitchNames,
  type ClefFilter,
  type PianoChordQuality,
  type PianoExerciseMode,
  type PianoNote,
  type PianoNoteExerciseMode,
} from "@/data/pianoNotes";
import { usePianoAudio } from "@/hooks/usePianoAudio";
import { MusicStaff } from "./piano/MusicStaff";
import { PianoKeyboard } from "./piano/PianoKeyboard";
import styles from "./PianoNoteTrainer.module.css";

type Score = { answered: number; correct: number; streak: number };

const exerciseLabels: Record<PianoExerciseMode, string> = {
  "key-name": "Key → note",
  "staff-name": "Staff → note",
  "staff-key": "Staff → key",
  "chord-name": "Chord → name",
  "chord-key": "Name → chord",
};

const exercisePrompts: Record<PianoExerciseMode, string> = {
  "key-name": "Which note is highlighted?",
  "staff-name": "Which note is on the staff?",
  "staff-key": "Play this note on the keyboard.",
  "chord-name": "Which chord is highlighted?",
  "chord-key": "Build this chord on the keyboard.",
};

const clefLabels: Record<ClefFilter, string> = { mixed: "Mixed", treble: "Treble", bass: "Bass" };
const chordRoots = pianoChords.filter((chord) => chord.quality === "major");
const chordQualities: readonly PianoChordQuality[] = ["major", "minor"];

function isNoteMode(mode: PianoExerciseMode): mode is PianoNoteExerciseMode {
  return mode === "key-name" || mode === "staff-name" || mode === "staff-key";
}

function updateScore(score: Score, correct: boolean): Score {
  return {
    answered: score.answered + 1,
    correct: score.correct + (correct ? 1 : 0),
    streak: correct ? score.streak + 1 : 0,
  };
}

export function PianoNoteTrainer() {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<PianoExerciseMode>("key-name");
  const [clefFilter, setClefFilter] = useState<ClefFilter>("mixed");
  const [noteQuestion, setNoteQuestion] = useState(() => createPianoQuestion("key-name", "mixed", undefined, () => 0));
  const [chordQuestion, setChordQuestion] = useState(() => createPianoChordQuestion(undefined, () => 0));
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedChordRoot, setSelectedChordRoot] = useState<string | null>(null);
  const [selectedChordQuality, setSelectedChordQuality] = useState<PianoChordQuality | null>(null);
  const [selectedChordKeyIds, setSelectedChordKeyIds] = useState<string[]>([]);
  const [score, setScore] = useState<Score>({ answered: 0, correct: 0, streak: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playNote: playTone, playNotes: playChord, stopNote } = usePianoAudio(soundEnabled);

  const answered = selectedAnswer !== null;
  const noteExpectedAnswer = mode === "staff-key" ? noteQuestion.note.id : noteQuestion.note.name;
  const isCorrect = mode === "chord-key"
    ? answered && chordMatchesNoteIds(chordQuestion, selectedChordKeyIds)
    : mode === "chord-name"
      ? selectedAnswer === chordQuestion.id
      : selectedAnswer === noteExpectedAnswer;
  const accuracy = score.answered === 0 ? 0 : Math.round((score.correct / score.answered) * 100);
  const displayedAnswer = mode === "chord-name" || mode === "chord-key"
    ? chordQuestion.name.replace("/", " / ")
    : mode === "staff-name" && noteQuestion.notation
      ? `${formatNotation(noteQuestion.notation, true)} (${formatPianoKey(noteQuestion.note, true)})`
      : formatPianoKey(noteQuestion.note, true);
  const chordToneLabel = chordQuestion.notes.map((note) => formatPianoKey(note, true)).join(", ");
  const feedback = useMemo(() => {
    if (!answered) return "";
    if (isCorrect) return `${displayedAnswer}. Nicely recognized.`;
    if (mode === "chord-key") return `The answer is ${displayedAnswer}: ${chordToneLabel}.`;
    return `The answer is ${displayedAnswer}.`;
  }, [answered, chordToneLabel, displayedAnswer, isCorrect, mode]);

  const clearSelections = () => {
    setSelectedAnswer(null);
    setSelectedChordRoot(null);
    setSelectedChordQuality(null);
    setSelectedChordKeyIds([]);
  };

  const recordNoteAnswer = (answer: string, playedNote: PianoNote) => {
    if (answered) return;
    const correct = answer === noteExpectedAnswer;
    setSelectedAnswer(answer);
    setScore((current) => updateScore(current, correct));
    playTone(playedNote);
  };

  const submitChordName = () => {
    if (answered || !selectedChordRoot || !selectedChordQuality) return;
    const answer = `${selectedChordRoot}-${selectedChordQuality}`;
    setSelectedAnswer(answer);
    setScore((current) => updateScore(current, answer === chordQuestion.id));
    playChord(chordQuestion.notes);
  };

  const toggleChordKey = (note: PianoNote) => {
    playTone(note);
    if (answered) return;
    setSelectedChordKeyIds((current) => {
      if (current.includes(note.id)) return current.filter((id) => id !== note.id);
      if (current.length === chordQuestion.notes.length) return current;
      return [...current, note.id];
    });
  };

  const submitChordKeys = () => {
    if (answered || selectedChordKeyIds.length !== chordQuestion.notes.length) return;
    const correct = chordMatchesNoteIds(chordQuestion, selectedChordKeyIds);
    setSelectedAnswer("submitted");
    setScore((current) => updateScore(current, correct));
    playChord(chordQuestion.notes);
  };

  const nextQuestion = (nextMode = mode, nextClef = clefFilter) => {
    if (isNoteMode(nextMode)) {
      setNoteQuestion(createPianoQuestion(nextMode, nextClef, noteQuestion.id));
    } else {
      setChordQuestion(createPianoChordQuestion(chordQuestion.id));
    }
    clearSelections();
  };

  const changeMode = (nextMode: PianoExerciseMode) => {
    setMode(nextMode);
    nextQuestion(nextMode, clefFilter);
  };

  const changeClef = (nextClef: ClefFilter) => {
    setClefFilter(nextClef);
    nextQuestion(mode, nextClef);
  };

  const resetScore = () => {
    setScore({ answered: 0, correct: 0, streak: 0 });
    nextQuestion();
  };

  const toggleSound = () => {
    if (soundEnabled) stopNote();
    setSoundEnabled((enabled) => !enabled);
  };

  const promptId = isNoteMode(mode) ? noteQuestion.id : chordQuestion.id;
  const chordNameReady = selectedChordRoot !== null && selectedChordQuality !== null;
  const chordKeysReady = selectedChordKeyIds.length === chordQuestion.notes.length;

  return (
    <section className={styles.trainer} aria-label="Piano note and chord trainer">
      <header className={styles.trainerHeader}>
        <div className={styles.modeControls} aria-label="Choose an exercise">
          {(Object.keys(exerciseLabels) as PianoExerciseMode[]).map((option) => (
            <button type="button" key={option} className={mode === option ? styles.activeControl : ""} aria-pressed={mode === option} onClick={() => changeMode(option)}>
              {exerciseLabels[option]}
            </button>
          ))}
        </div>

        <div className={styles.headerActions}>
          <dl className={styles.scoreboard} aria-label="Practice statistics">
            <div><dt>Score</dt><dd>{score.correct}/{score.answered}</dd></div>
            <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
            <div><dt>Streak</dt><dd>{score.streak}</dd></div>
          </dl>
          <button type="button" className={styles.iconButton} aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"} aria-pressed={soundEnabled} onClick={toggleSound}>
            {soundEnabled ? <SpeakerHigh size={18} weight="fill" /> : <SpeakerSlash size={18} />}
          </button>
          <button type="button" className={styles.iconButton} aria-label="Reset score" onClick={resetScore}>
            <ArrowClockwise size={18} weight="bold" />
          </button>
        </div>
      </header>

      <div className={styles.practiceTopline}>
        <div><span>{exerciseLabels[mode]}</span><h2>{exercisePrompts[mode]}</h2></div>
        {mode === "staff-name" || mode === "staff-key" ? (
          <div className={styles.clefControls} aria-label="Choose a clef">
            {(Object.keys(clefLabels) as ClefFilter[]).map((clef) => (
              <button type="button" key={clef} className={clefFilter === clef ? styles.activeClef : ""} aria-pressed={clefFilter === clef} onClick={() => changeClef(clef)}>
                {clefLabels[clef]}
              </button>
            ))}
          </div>
        ) : <span className={styles.rangeLabel}>{mode === "key-name" ? "C3-C6 · naturals + accidentals" : "C4-C6 · major + minor triads"}</span>}
      </div>

      <div className={styles.practiceArea}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${mode}-${promptId}`} className={styles.promptArea} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -7 }} transition={{ duration: reduceMotion ? 0 : 0.2 }}>
            {(mode === "staff-name" || mode === "staff-key") && noteQuestion.clef && noteQuestion.notation ? <MusicStaff notation={noteQuestion.notation} clef={noteQuestion.clef} /> : null}
            {mode === "key-name" ? (
              <PianoKeyboard targetNotes={[noteQuestion.note]} selectedIds={[]} answered={answered} interactive showPrompt onChoose={playTone} />
            ) : null}
            {mode === "chord-name" ? (
              <PianoKeyboard targetNotes={chordQuestion.notes} selectedIds={[]} answered={answered} interactive showPrompt range="two-octave" onChoose={playTone} />
            ) : null}
            {mode === "chord-key" ? (
              <div className={styles.chordPromptCard}>
                <span>Build this triad</span>
                <strong>{chordQuestion.root.name.replace("/", " / ")}</strong>
                <em>{chordQuestion.quality}</em>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className={styles.answerArea}>
          {mode === "key-name" || mode === "staff-name" ? (
            <div className={styles.noteChoices} aria-label="Choose a note name">
              {pitchNames.map((name) => {
                const isTarget = name === noteQuestion.note.name;
                const isSelected = name === selectedAnswer;
                const stateClass = answered && isTarget ? styles.correctChoice : answered && isSelected ? styles.wrongChoice : "";
                return (
                  <button type="button" key={name} className={stateClass} disabled={answered} aria-label={`Choose ${name.replace("/", " or ")}`} onClick={() => recordNoteAnswer(name, noteQuestion.note)}>
                    {name.replace("/", " / ")}
                  </button>
                );
              })}
            </div>
          ) : null}

          {mode === "staff-key" ? (
            <PianoKeyboard targetNotes={[noteQuestion.note]} selectedIds={selectedAnswer ? [selectedAnswer] : []} answered={answered} interactive showPrompt={false} onChoose={(note) => answered ? playTone(note) : recordNoteAnswer(note.id, note)} />
          ) : null}

          {mode === "chord-name" ? (
            <div className={styles.chordNameAnswer}>
              <div className={styles.chordRootChoices} aria-label="Choose the chord root">
                {chordRoots.map((chord) => (
                  <button type="button" key={chord.root.id} className={selectedChordRoot === chord.root.id ? styles.selectedChoice : ""} disabled={answered} aria-pressed={selectedChordRoot === chord.root.id} onClick={() => setSelectedChordRoot(chord.root.id)}>
                    {chord.root.name.replace("/", " / ")}
                  </button>
                ))}
              </div>
              <div className={styles.chordQualityRow} aria-label="Choose major or minor">
                {chordQualities.map((quality) => (
                  <button type="button" key={quality} className={selectedChordQuality === quality ? styles.selectedChoice : ""} disabled={answered} aria-pressed={selectedChordQuality === quality} onClick={() => setSelectedChordQuality(quality)}>
                    {quality}
                  </button>
                ))}
                <button type="button" className={styles.checkChordButton} disabled={answered || !chordNameReady} onClick={submitChordName}>Check chord</button>
              </div>
            </div>
          ) : null}

          {mode === "chord-key" ? (
            <div className={styles.chordKeyAnswer}>
              <PianoKeyboard targetNotes={chordQuestion.notes} selectedIds={selectedChordKeyIds} answered={answered} interactive showPrompt={false} range="two-octave" onChoose={toggleChordKey} />
              <button type="button" className={styles.checkChordButton} disabled={answered || !chordKeysReady} onClick={submitChordKeys}>Check chord · {selectedChordKeyIds.length}/3 keys</button>
            </div>
          ) : null}

          <div className={styles.feedbackRow}>
            <div className={`${styles.feedback} ${answered ? (isCorrect ? styles.correctFeedback : styles.wrongFeedback) : ""}`} aria-live="polite">
              {answered ? (
                <>{isCorrect ? <CheckCircle size={21} weight="fill" /> : <XCircle size={21} weight="fill" />}<span>{feedback}</span></>
              ) : (
                <span>{mode === "chord-name" ? "Choose a root and quality, then check your answer." : mode === "chord-key" ? "Select three keys, then check your chord." : "Choose an answer."}</span>
              )}
            </div>
            <button type="button" className={styles.nextButton} disabled={!answered} onClick={() => nextQuestion()}>Next <ArrowRight size={17} weight="bold" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
