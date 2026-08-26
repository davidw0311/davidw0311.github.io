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
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  accidentalSymbol,
  blackKeys,
  createPianoQuestion,
  formatNotation,
  formatPianoKey,
  ledgerStepsFor,
  noteFrequency,
  pianoAudioPath,
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
import styles from "./PianoNoteTrainer.module.css";

type Score = {
  answered: number;
  correct: number;
  streak: number;
};

type SafariAudioWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

async function resumeAudioContext(context: AudioContext) {
  if (context.state === "running") return true;

  const resumed = context.resume().then(
    () => context.state === "running",
    () => false,
  );

  return Promise.race([
    resumed,
    new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(context.state === "running"), 350);
    }),
  ]);
}

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
  },
  {
    id: "upper",
    whiteNotes: whiteKeys.filter((note) => note.octave === 4 || note.id === "C5"),
    blackNotes: blackKeys.filter((note) => note.octave === 4),
    whiteOffset: 7,
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
  onChoose: (note: PianoNote) => void;
}) {
  return (
    <div className={styles.keyboardWrap}>
      <div
        className={`${styles.keyboard} ${showPrompt && !answered ? styles.concealKeyLabels : ""}`}
        role="group"
        aria-label="Piano keyboard from C3 to C5, including sharp and flat keys"
      >
        {keyboardRanges.map((range) => (
          <div className={styles.keyboardRange} key={range.id}>
            <div className={styles.whiteKeys} style={{ "--white-count": range.whiteNotes.length } as CSSProperties}>
              {range.whiteNotes.map((note) => (
                <button
                  type="button"
                  key={note.id}
                  className={`${styles.whiteKey} ${keyStateClass(note, target, selectedId, answered, showPrompt)}`}
                  disabled={!interactive}
                  tabIndex={interactive ? 0 : -1}
                  aria-label={spokenPitchName(note)}
                  aria-pressed={interactive ? selectedId === note.id : undefined}
                  onClick={() => onChoose(note)}
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
                return (
                  <button
                    type="button"
                    key={note.id}
                    className={`${styles.blackKey} ${keyStateClass(note, target, selectedId, answered, showPrompt)}`}
                    style={{ left: `${((relativeIndex + 1) / range.whiteNotes.length) * 100}%` }}
                    disabled={!interactive}
                    tabIndex={interactive ? 0 : -1}
                    aria-label={spokenPitchName(note)}
                    aria-pressed={interactive ? selectedId === note.id : undefined}
                    onClick={() => onChoose(note)}
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

function MusicStaff({ notation, clef }: { notation: StaffNotation; clef: StaffClef }) {
  const step = staffStepFor(notation, clef);
  const ledgerSteps = ledgerStepsFor(notation, clef);
  const style = { "--note-step": step } as CSSProperties;
  const accidental = accidentalSymbol(notation.accidental);

  return (
    <div className={styles.staffCard} role="img" aria-label={`${formatNotation(notation, true)} written in ${clef} clef`}>
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  const displayedAnswer = mode === "staff-name" && question.notation
    ? `${formatNotation(question.notation, true)} (${formatPianoKey(question.note, true)})`
    : formatPianoKey(question.note, true);
  const feedback = useMemo(() => {
    if (!answered) return "";
    if (isCorrect) return `${displayedAnswer}. Nicely read.`;
    return `The answer is ${displayedAnswer}.`;
  }, [answered, displayedAnswer, isCorrect]);

  useEffect(() => {
    const discardAudioContext = () => {
      const context = audioContextRef.current;
      audioContextRef.current = null;

      if (context && context.state !== "closed") {
        void context.close().catch(() => undefined);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") discardAudioContext();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", discardAudioContext);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", discardAudioContext);
      audioRef.current?.pause();
      audioRef.current = null;
      discardAudioContext();
    };
  }, []);

  const createAudioContext = () => {
    const browserWindow = window as SafariAudioWindow;
    const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    const context = new AudioContextConstructor();
    audioContextRef.current = context;
    return context;
  };

  const getPlayableAudioContext = async () => {
    let context = audioContextRef.current;

    if (!context || context.state === "closed") context = createAudioContext();
    if (!context) return null;

    if (await resumeAudioContext(context)) return context;

    if (audioContextRef.current === context) audioContextRef.current = null;
    void context.close().catch(() => undefined);
    context = createAudioContext();

    if (!context || !(await resumeAudioContext(context))) return null;
    return context;
  };

  const playSynthesizedTone = async (note: PianoNote) => {
    const context = await getPlayableAudioContext();
    if (!context) return;

    const now = context.currentTime + 0.01;
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

  const playTone = (note: PianoNote) => {
    if (!soundEnabled) return;

    audioRef.current?.pause();
    const audio = new Audio(pianoAudioPath(note));
    let fallbackStarted = false;
    const clearAudio = () => {
      if (audioRef.current === audio) audioRef.current = null;
    };
    const fallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      clearAudio();
      void playSynthesizedTone(note);
    };

    audio.preload = "auto";
    audio.volume = 0.9;
    audio.addEventListener("ended", clearAudio, { once: true });
    audio.addEventListener("error", fallback, { once: true });
    audioRef.current = audio;

    // Keep play() in the original tap event. Mobile Safari permits media
    // playback here even when its Web Audio context remains suspended.
    void audio.play().catch(fallback);
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

  const toggleSound = () => {
    if (soundEnabled) {
      audioRef.current?.pause();
      audioRef.current = null;
    }
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
        ) : <span className={styles.rangeLabel}>C3-C5 · naturals + accidentals</span>}
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
                const [primary, alternate] = name.split("/");
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
                    <span>{primary}</span>
                    {alternate ? <small>{alternate}</small> : null}
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
