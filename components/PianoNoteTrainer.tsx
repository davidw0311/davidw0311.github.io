"use client";

import {
  ArrowClockwise,
  ArrowRight,
  CheckCircle,
  SpeakerHigh,
  SpeakerSlash,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import {
  createPianoQuestion,
  formatNotation,
  formatPianoKey,
  pitchNames,
  type ClefFilter,
  type PianoExerciseMode,
  type PianoNote,
} from "@/data/pianoNotes";
import { usePianoAudio } from "@/hooks/usePianoAudio";
import { MusicStaff } from "./piano/MusicStaff";
import { PianoKeyboard } from "./piano/PianoKeyboard";
import styles from "./PianoNoteTrainer.module.css";

type Score = {
  answered: number;
  correct: number;
  streak: number;
};

const exerciseLabels: Record<PianoExerciseMode, string> = {
  "key-name": "Key to note",
  "staff-name": "Staff to note",
  "staff-key": "Staff to key",
};

const exercisePrompts: Record<PianoExerciseMode, string> = {
  "key-name": "Which note is highlighted?",
  "staff-name": "Which note is on the staff?",
  "staff-key": "Play this note on the keyboard.",
};

const clefLabels: Record<ClefFilter, string> = {
  mixed: "Mixed",
  treble: "Treble",
  bass: "Bass",
};

export function PianoNoteTrainer() {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<PianoExerciseMode>("key-name");
  const [clefFilter, setClefFilter] = useState<ClefFilter>("mixed");
  const [question, setQuestion] = useState(() => createPianoQuestion("key-name", "mixed", undefined, () => 0));
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ answered: 0, correct: 0, streak: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playNote: playTone, stopNote } = usePianoAudio(soundEnabled);

  const answered = selectedAnswer !== null;
  const expectedAnswer = mode === "staff-key" ? question.note.id : question.note.name;
  const isCorrect = selectedAnswer === expectedAnswer;
  const accuracy = score.answered === 0 ? 0 : Math.round((score.correct / score.answered) * 100);
  const displayedAnswer = mode === "staff-name" && question.notation
    ? `${formatNotation(question.notation, true)} (${formatPianoKey(question.note, true)})`
    : formatPianoKey(question.note, true);
  const feedback = useMemo(() => {
    if (!answered) return "";
    if (isCorrect) return `${displayedAnswer}. Nicely read.`;
    return `The answer is ${displayedAnswer}.`;
  }, [answered, displayedAnswer, isCorrect]);

  const recordAnswer = (answer: string, playedNote: PianoNote) => {
    if (answered) return;
    const correct = answer === expectedAnswer;
    setSelectedAnswer(answer);
    setScore((current) => ({
      answered: current.answered + 1,
      correct: current.correct + (correct ? 1 : 0),
      streak: correct ? current.streak + 1 : 0,
    }));
    playTone(playedNote);
  };

  const nextQuestion = (nextMode = mode, nextClef = clefFilter) => {
    setQuestion(createPianoQuestion(nextMode, nextClef, question.id));
    setSelectedAnswer(null);
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
    setSelectedAnswer(null);
    setQuestion(createPianoQuestion(mode, clefFilter, question.id));
  };

  const toggleSound = () => {
    if (soundEnabled) stopNote();
    setSoundEnabled((enabled) => !enabled);
  };

  return (
    <section className={styles.trainer} aria-label="Piano note reading trainer">
      <header className={styles.trainerHeader}>
        <div className={styles.modeControls} aria-label="Choose an exercise">
          {(Object.keys(exerciseLabels) as PianoExerciseMode[]).map((option) => (
            <button
              type="button"
              key={option}
              className={mode === option ? styles.activeControl : ""}
              aria-pressed={mode === option}
              onClick={() => changeMode(option)}
            >
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
          <button
            type="button"
            className={styles.iconButton}
            aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
            aria-pressed={soundEnabled}
            onClick={toggleSound}
          >
            {soundEnabled ? <SpeakerHigh size={18} weight="fill" /> : <SpeakerSlash size={18} />}
          </button>
          <button type="button" className={styles.iconButton} aria-label="Reset score" onClick={resetScore}>
            <ArrowClockwise size={18} weight="bold" />
          </button>
        </div>
      </header>

      <div className={styles.practiceTopline}>
        <div>
          <span>{exerciseLabels[mode]}</span>
          <h2>{exercisePrompts[mode]}</h2>
        </div>
        {mode !== "key-name" ? (
          <div className={styles.clefControls} aria-label="Choose a clef">
            {(Object.keys(clefLabels) as ClefFilter[]).map((clef) => (
              <button
                type="button"
                key={clef}
                className={clefFilter === clef ? styles.activeClef : ""}
                aria-pressed={clefFilter === clef}
                onClick={() => changeClef(clef)}
              >
                {clefLabels[clef]}
              </button>
            ))}
          </div>
        ) : <span className={styles.rangeLabel}>C3-C6 · naturals + accidentals</span>}
      </div>

      <div className={styles.practiceArea}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${mode}-${question.id}`}
            className={styles.promptArea}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -7 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            {mode !== "key-name" && question.clef && question.notation
              ? <MusicStaff notation={question.notation} clef={question.clef} />
              : null}
            {mode === "key-name" ? (
              <PianoKeyboard
                target={question.note}
                selectedId={null}
                answered={answered}
                interactive
                showPrompt
                onChoose={playTone}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className={styles.answerArea}>
          {mode !== "staff-key" ? (
            <div className={styles.noteChoices} aria-label="Choose a note name">
              {pitchNames.map((name) => {
                const isTarget = name === question.note.name;
                const isSelected = name === selectedAnswer;
                const stateClass = answered && isTarget
                  ? styles.correctChoice
                  : answered && isSelected
                    ? styles.wrongChoice
                    : "";
                return (
                  <button
                    type="button"
                    key={name}
                    className={stateClass}
                    disabled={answered}
                    aria-label={`Choose ${name.replace("/", " or ")}`}
                    onClick={() => recordAnswer(name, question.note)}
                  >
                    {name.replace("/", " / ")}
                  </button>
                );
              })}
            </div>
          ) : (
            <PianoKeyboard
              target={question.note}
              selectedId={selectedAnswer}
              answered={answered}
              interactive
              showPrompt={false}
              onChoose={(note) => answered ? playTone(note) : recordAnswer(note.id, note)}
            />
          )}

          <div className={styles.feedbackRow}>
            <div className={`${styles.feedback} ${answered ? (isCorrect ? styles.correctFeedback : styles.wrongFeedback) : ""}`} aria-live="polite">
              {answered ? (
                <>
                  {isCorrect ? <CheckCircle size={21} weight="fill" /> : <XCircle size={21} weight="fill" />}
                  <span>{feedback}</span>
                </>
              ) : <span>Choose an answer.</span>}
            </div>
            <button type="button" className={styles.nextButton} disabled={!answered} onClick={() => nextQuestion()}>
              Next <ArrowRight size={17} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
