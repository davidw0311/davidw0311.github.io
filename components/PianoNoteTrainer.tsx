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
import { type CSSProperties, useMemo, useRef, useState } from "react";
import {
  blackKeys,
  createPianoQuestion,
  ledgerStepsFor,
  noteFrequency,
  noteNames,
  pianoNotes,
  staffStepFor,
  type ClefFilter,
  type PianoExerciseMode,
  type PianoNote,
  type StaffClef,
} from "@/data/pianoNotes";
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
  "key-name": "Which note name is highlighted?",
  "staff-name": "Which note is written on the staff?",
  "staff-key": "Play this written note on the keyboard.",
};

const clefLabels: Record<ClefFilter, string> = {
  mixed: "Mixed clefs",
  treble: "Treble",
  bass: "Bass",
};

function PianoKeyboard({
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
  onChoose: (note: PianoNote) => void;
}) {
  return (
    <div className={styles.keyboardWrap}>
      <div className={styles.keyboard} role={interactive ? "group" : "img"} aria-label="Piano keyboard from C3 to C5">
        <div className={styles.whiteKeys}>
          {pianoNotes.map((note) => {
            const isTarget = note.id === target.id;
            const isSelected = selectedId === note.id;
            const keyState = [
              showPrompt && isTarget ? styles.promptKey : "",
              answered && isTarget ? styles.correctKey : "",
              answered && isSelected && !isTarget ? styles.wrongKey : "",
            ].filter(Boolean).join(" ");

            return (
              <button
                type="button"
                key={note.id}
                className={`${styles.whiteKey} ${keyState}`}
                disabled={!interactive || answered}
                aria-label={`${note.name} ${note.octave}`}
                aria-pressed={interactive ? isSelected : undefined}
                onClick={() => onChoose(note)}
              >
                <span className={answered && (isTarget || isSelected) ? styles.visibleKeyLabel : ""}>
                  {note.name}<small>{note.octave}</small>
                </span>
              </button>
            );
          })}
        </div>
        <div className={styles.blackKeys} aria-hidden="true">
          {blackKeys.map((key) => (
            <span
              key={key.id}
              className={styles.blackKey}
              style={{ left: `${((key.afterWhiteIndex + 1) / pianoNotes.length) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MusicStaff({ note, clef }: { note: PianoNote; clef: StaffClef }) {
  const step = staffStepFor(note, clef);
  const ledgerSteps = ledgerStepsFor(note, clef);
  const style = { "--note-step": step } as CSSProperties;

  return (
    <div className={styles.staffCard} role="img" aria-label={`${note.name} ${note.octave} written in ${clef} clef`}>
      <span className={styles.clefName}>{clef === "treble" ? "Treble clef" : "Bass clef"}</span>
      <div className={styles.staff} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((line) => <span key={line} className={styles.staffLine} />)}
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const [mode, setMode] = useState<PianoExerciseMode>("key-name");
  const [clefFilter, setClefFilter] = useState<ClefFilter>("mixed");
  const [question, setQuestion] = useState(() => createPianoQuestion("key-name", "mixed", undefined, () => 0));
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ answered: 0, correct: 0, streak: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const answered = selectedAnswer !== null;
  const expectedAnswer = mode === "staff-key" ? question.note.id : question.note.name;
  const isCorrect = selectedAnswer === expectedAnswer;
  const accuracy = score.answered === 0 ? 0 : Math.round((score.correct / score.answered) * 100);
  const feedback = useMemo(() => {
    if (!answered) return "";
    if (isCorrect) return `${question.note.name}${question.note.octave}. Nicely read.`;
    return `That is ${selectedAnswer}. The answer is ${question.note.name}${question.note.octave}.`;
  }, [answered, isCorrect, question.note, selectedAnswer]);

  const playTone = (note: PianoNote) => {
    if (!soundEnabled) return;

    const AudioContextConstructor = window.AudioContext;
    const context = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = context;
    const now = context.currentTime;
    const frequency = noteFrequency(note.midi);
    const output = context.createGain();
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.22, now + 0.018);
    output.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    output.connect(context.destination);

    [
      { type: "triangle" as OscillatorType, ratio: 1, level: 0.8 },
      { type: "sine" as OscillatorType, ratio: 2, level: 0.16 },
      { type: "sine" as OscillatorType, ratio: 3, level: 0.08 },
    ].forEach(({ type, ratio, level }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency * ratio, now);
      gain.gain.setValueAtTime(level, now);
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(now);
      oscillator.stop(now + 1.2);
    });
  };

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
            onClick={() => setSoundEnabled((enabled) => !enabled)}
          >
            {soundEnabled ? <SpeakerHigh size={19} weight="fill" /> : <SpeakerSlash size={19} />}
          </button>
          <button type="button" className={styles.iconButton} aria-label="Reset score" onClick={resetScore}>
            <ArrowClockwise size={19} weight="bold" />
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
        ) : <span className={styles.rangeLabel}>Natural notes, C3 to C5</span>}
      </div>

      <div className={styles.practiceArea}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${mode}-${question.id}`}
            className={styles.promptArea}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            {mode !== "key-name" && question.clef ? <MusicStaff note={question.note} clef={question.clef} /> : null}
            {mode === "key-name" ? (
              <PianoKeyboard
                target={question.note}
                selectedId={null}
                answered={answered}
                interactive={false}
                showPrompt
                onChoose={() => undefined}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className={styles.answerArea}>
          {mode !== "staff-key" ? (
            <div className={styles.noteChoices} aria-label="Choose a note name">
              {noteNames.map((name) => {
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
                    aria-label={`Choose note ${name}`}
                    onClick={() => recordAnswer(name, question.note)}
                  >
                    {name}
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
              onChoose={(note) => recordAnswer(note.id, note)}
            />
          )}

          <div className={styles.feedbackRow}>
            <div className={`${styles.feedback} ${answered ? (isCorrect ? styles.correctFeedback : styles.wrongFeedback) : ""}`} aria-live="polite">
              {answered ? (
                <>
                  {isCorrect ? <CheckCircle size={23} weight="fill" /> : <XCircle size={23} weight="fill" />}
                  <span>{feedback}</span>
                </>
              ) : <span>Choose an answer when you are ready.</span>}
            </div>
            <button type="button" className={styles.nextButton} disabled={!answered} onClick={() => nextQuestion()}>
              Next note <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
