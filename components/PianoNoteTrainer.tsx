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
import { type CSSProperties, useMemo, useState } from "react";
import {
  accidentalSymbol,
  blackKeys,
  createPianoQuestion,
  formatNotation,
  formatPianoKey,
  ledgerStepsFor,
  pitchNames,
  spokenPitchName,
  staffStepFor,
  whiteKeys,
  type ClefFilter,
  type PianoExerciseMode,
  type PianoNote,
  type StaffClef,
  type StaffNotation,
} from "@/data/pianoNotes";
import { usePianoAudio } from "@/hooks/usePianoAudio";
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

function keyStateClass(note: PianoNote, target: PianoNote, selectedId: string | null, answered: boolean, showPrompt: boolean) {
  const isTarget = note.id === target.id;
  const isSelected = selectedId === note.id;
  return [
    showPrompt && isTarget ? styles.promptKey : "",
    answered && isTarget ? styles.correctKey : "",
    answered && isSelected && !isTarget ? styles.wrongKey : "",
  ].filter(Boolean).join(" ");
}

export function PianoKeyboard({
  target,
  selectedId,
  answered,
  interactive,
  showPrompt,
  onChoose,
}: {
  target: PianoNote;
  selectedId: string | null;
  answered: boolean;
  interactive: boolean;
  showPrompt: boolean;
  onChoose: (note: PianoNote, answeredAt: number) => void;
}) {
  return (
    <div className={styles.keyboardWrap}>
      <div
        className={`${styles.keyboard} ${showPrompt && !answered ? styles.concealKeyLabels : ""}`}
        role="group"
        aria-label="Piano keyboard from C3 to C6, including sharp and flat keys"
      >
        {keyboardRanges.map((range) => {
          return (
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
          );
        })}
      </div>
    </div>
  );
}

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
