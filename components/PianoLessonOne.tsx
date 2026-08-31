"use client";

import {
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkle,
  Trophy,
  User,
  XCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createPianoLessonDeck,
  formatLessonTime,
  formatRecognitionTime,
  getPianoLesson,
  lessonCardExerciseMode,
  lessonAccuracy,
  lessonPerformanceKey,
  rankPianoLessonPerformance,
  type LessonNotePerformanceMap,
  type PianoLessonCard,
  type PianoLessonId,
} from "@/data/pianoLessons";
import {
  chordMatchesNoteIds,
  chordResultNotes,
  formatChordSymbol,
  formatPianoKey,
  type PianoChord,
  type PianoNote,
  type PitchName,
} from "@/data/pianoNotes";
import { usePianoAudio } from "@/hooks/usePianoAudio";
import { PianoLessonShareButton } from "./PianoLessonShareButton";
import { ChordSelector } from "./piano/ChordSelector";
import { MusicStaff } from "./piano/MusicStaff";
import { PianoKeyboard } from "./piano/PianoKeyboard";
import styles from "./PianoLessonOne.module.css";

type LessonStage = "ready" | "playing" | "complete";

type PianoLessonProps = {
  lessonId: PianoLessonId;
};

function answerChoiceLabel(name: string) {
  return name.replace("/", " / ");
}

function AnswerChoice({ name }: { name: PitchName }) {
  return answerChoiceLabel(name);
}

const confettiColors = ["#79e4c5", "#edf8f5", "#ffcf70", "#ff9d97"];

function PerfectLessonCelebration() {
  return (
    <div className={styles.celebration} aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => (
        <i
          key={index}
          className={styles.confetti}
          style={{
            "--confetti-left": `${4 + ((index * 37) % 92)}%`,
            "--confetti-delay": `${(index % 7) * 70}ms`,
            "--confetti-drift": `${((index * 29) % 180) - 90}px`,
            "--confetti-spin": `${420 + (index % 5) * 90}deg`,
            "--confetti-color": confettiColors[index % confettiColors.length],
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

export function PianoLesson({ lessonId }: PianoLessonProps) {
  const lesson = getPianoLesson(lessonId);
  const { playNote, playNotes } = usePianoAudio();
  const cardStartedAtRef = useRef<number | null>(null);
  const [stage, setStage] = useState<LessonStage>("ready");
  const [name, setName] = useState("");
  const [playerName, setPlayerName] = useState("Pianist");
  const [deck, setDeck] = useState<PianoLessonCard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [selectedChordKeyIds, setSelectedChordKeyIds] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [notePerformance, setNotePerformance] = useState<LessonNotePerformanceMap>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const currentCard = deck[cardIndex];
  const currentMode = currentCard ? lessonCardExerciseMode(lessonId, currentCard) : null;
  const currentChord = currentCard?.chord;
  const answered = answerCorrect !== null;
  const expectedAnswer = currentCard
    ? currentMode === "chord-name"
      ? currentChord?.id ?? null
      : currentMode === "staff-key"
        ? currentCard.note.id
        : currentCard.note.name
    : null;
  const answerIsCorrect = answerCorrect === true;
  const isChordLesson = lesson.chords !== undefined;
  const reportLabel: "Chord" | "Note" = isChordLesson ? "Chord" : "Note";
  const accuracy = lessonAccuracy(correctCount, deck.length);
  const noteReport = useMemo(
    () => rankPianoLessonPerformance(lessonId, notePerformance),
    [lessonId, notePerformance],
  );
  const perfectLesson = deck.length > 0 && correctCount === deck.length;
  const shareResult = useMemo(() => ({
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    playerName,
    elapsedTime: formatLessonTime(elapsedMs),
    correctCount,
    cardCount: lesson.cardCount,
    accuracy,
    performanceLabel: reportLabel,
    noteResults: noteReport.map((row) => ({
      noteName: row.noteName,
      mistakes: row.mistakes,
      averageRecognitionTime: formatRecognitionTime(row.averageRecognitionMs),
      attempts: row.attempts,
    })),
  }), [accuracy, correctCount, elapsedMs, lesson, noteReport, playerName, reportLabel]);

  useEffect(() => {
    if (stage !== "playing" || startedAt === null) return;
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    return () => window.clearInterval(timer);
  }, [stage, startedAt]);

  const beginLesson = (nextPlayerName: string, firstCardStartedAt: number) => {
    const now = Date.now();
    setPlayerName(nextPlayerName);
    setDeck(createPianoLessonDeck(lessonId));
    setCardIndex(0);
    setSelectedAnswer(null);
    setAnswerCorrect(null);
    setSelectedChordKeyIds([]);
    setCorrectCount(0);
    setNotePerformance({});
    setElapsedMs(0);
    setStartedAt(now);
    cardStartedAtRef.current = firstCardStartedAt;
    setStage("playing");
  };

  const handleStart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    beginLesson(name.trim() || "Pianist", event.timeStamp);
  };

  const recordAnswer = (answer: string, answeredAt: number, isCorrect: boolean) => {
    if (!currentCard || answered) return;
    const recognitionMs = Math.max(0, answeredAt - (cardStartedAtRef.current ?? answeredAt));
    const performanceKey = lessonPerformanceKey(lessonId, currentCard);
    setSelectedAnswer(answer);
    setAnswerCorrect(isCorrect);
    setNotePerformance((current) => {
      const previous = current[performanceKey] ?? {
        attempts: 0,
        mistakes: 0,
        totalRecognitionMs: 0,
      };
      return {
        ...current,
        [performanceKey]: {
          attempts: previous.attempts + 1,
          mistakes: previous.mistakes + (isCorrect ? 0 : 1),
          totalRecognitionMs: previous.totalRecognitionMs + recognitionMs,
        },
      };
    });
    if (isCorrect) {
      setCorrectCount((current) => current + 1);
    }
  };

  const handleAnswer = (answer: string, answeredAt: number, playedNote?: PianoNote) => {
    if (!currentCard || answered) return;
    recordAnswer(answer, answeredAt, answer === expectedAnswer);
    playNote(playedNote ?? currentCard.note);
  };

  const handleChordNameAnswer = (chord: PianoChord, answeredAt: number) => {
    if (!currentChord || answered) return;
    recordAnswer(chord.id, answeredAt, chord.id === currentChord.id);
    playNotes(currentChord.notes);
  };

  const toggleChordKey = (note: PianoNote) => {
    playNote(note);
    if (!currentChord || answered) return;
    setSelectedChordKeyIds((current) => {
      if (current.includes(note.id)) return current.filter((noteId) => noteId !== note.id);
      if (current.length === currentChord.notes.length) return current;
      return [...current, note.id];
    });
  };

  const submitChordKeys = (answeredAt: number) => {
    if (!currentChord || answered || selectedChordKeyIds.length !== currentChord.notes.length) return;
    const isCorrect = chordMatchesNoteIds(currentChord, selectedChordKeyIds);
    recordAnswer("submitted", answeredAt, isCorrect);
    playNotes(currentChord.notes);
  };

  const advance = (nextCardStartedAt: number) => {
    if (!answered || startedAt === null) return;
    if (cardIndex === deck.length - 1) {
      setElapsedMs(Date.now() - startedAt);
      setStage("complete");
      return;
    }
    cardStartedAtRef.current = nextCardStartedAt;
    setCardIndex((current) => current + 1);
    setSelectedAnswer(null);
    setAnswerCorrect(null);
    setSelectedChordKeyIds([]);
  };

  if (stage === "ready") {
    return (
      <section className={styles.lessonShell} aria-labelledby={`lesson-${lesson.id}-title`}>
        <div className={styles.startCard}>
          <div className={styles.startCopy}>
            <span>Lesson {lesson.id}</span>
            <h1 id={`lesson-${lesson.id}-title`}>{lesson.title}.</h1>
            <p>{lesson.description}</p>
            <dl className={styles.lessonFacts} aria-label="Lesson details">
              <div><dt>Cards</dt><dd>{lesson.cardCount}</dd></div>
              <div><dt>{lesson.focusLabel}</dt><dd>{lesson.focusCount}</dd></div>
              <div><dt>Format</dt><dd>Timed</dd></div>
            </dl>
          </div>

          <form className={styles.startForm} onSubmit={handleStart}>
            <div className={styles.nameIcon} aria-hidden="true"><User size={28} weight="thin" /></div>
            <label htmlFor="lesson-player-name">Your name</label>
            <input
              id="lesson-player-name"
              name="playerName"
              type="text"
              value={name}
              maxLength={32}
              autoComplete="name"
              placeholder="Optional"
              onChange={(event) => setName(event.target.value)}
            />
            <p>Leave this blank to play as Pianist.</p>
            <button type="submit">Start lesson <ArrowRight size={18} weight="bold" /></button>
          </form>
        </div>
      </section>
    );
  }

  if (stage === "complete") {
    return (
      <section
        className={`${styles.lessonShell} ${styles.completeShell}`}
        aria-labelledby="lesson-complete-title"
      >
        <div className={`${styles.completeCard} ${perfectLesson ? styles.perfectCompleteCard : ""}`}>
          {perfectLesson ? <PerfectLessonCelebration /> : null}
          <div className={styles.trophy} aria-hidden="true"><Trophy size={42} weight="thin" /></div>
          <div className={styles.completionLabel}>
            <strong>Lesson {lesson.id}</strong>
            <span>Complete</span>
          </div>
          <h1 id="lesson-complete-title">Congratulations, {playerName}!</h1>
          <p>{lesson.completionDescription}</p>
          {perfectLesson ? (
            <p className={styles.perfectMessage}>
              <Sparkle size={17} weight="fill" aria-hidden="true" /> Perfect run. Every {reportLabel.toLowerCase()} was correct.
            </p>
          ) : null}
          <dl className={styles.results} aria-label="Lesson results">
            <div><dt>Time</dt><dd>{formatLessonTime(elapsedMs)}</dd></div>
            <div><dt>Score</dt><dd>{correctCount}/{lesson.cardCount}</dd></div>
            <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
          </dl>
          <section className={styles.noteReport} aria-labelledby="lesson-note-report-title">
            <header className={styles.noteReportHeader}>
              <h2 id="lesson-note-report-title">{reportLabel} report</h2>
              <p>Ranked by mistakes, then average recognition time.</p>
            </header>
            <div
              className={styles.noteReportTable}
              tabIndex={0}
              aria-label={`Ranked statistics for every ${reportLabel.toLowerCase()} in this lesson`}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">{reportLabel}</th>
                    <th scope="col">Mistakes</th>
                    <th scope="col">Avg. time</th>
                    <th scope="col">Cards</th>
                  </tr>
                </thead>
                <tbody>
                  {noteReport.map((row, index) => (
                    <tr key={row.noteName}>
                      <td>{index + 1}</td>
                      <th scope="row">{answerChoiceLabel(row.noteName)}</th>
                      <td>{row.mistakes}</td>
                      <td>{formatRecognitionTime(row.averageRecognitionMs)}</td>
                      <td>{row.attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className={styles.completeActions}>
            <button type="button" onClick={(event) => beginLesson(playerName, event.timeStamp)}>Try again</button>
            <PianoLessonShareButton result={shareResult} />
            <Link href="/projects/piano-party/lessons/">All lessons</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!currentCard) return null;

  const activeMode = lessonCardExerciseMode(lessonId, currentCard);
  const activeChord = currentCard.chord;
  const chordKeysReady = activeChord && selectedChordKeyIds.length === activeChord.notes.length;
  const quizPrompt = activeMode === "chord-key"
    ? "Build this chord on the keyboard."
    : activeMode === "chord-name"
      ? "Which chord is highlighted?"
      : lesson.prompt;
  const quizBodyClass = activeMode === "staff-name" || activeMode === "staff-key"
    ? styles.staffQuizBody
    : activeMode === "chord-name" || activeMode === "chord-key"
      ? styles.chordQuizBody
      : "";
  const idleFeedback = activeMode === "chord-name"
    ? "Choose the highlighted chord's name."
    : activeMode === "chord-key"
      ? "Select three chord tones in any octave, then check your chord."
      : activeMode === "key-name"
        ? "Choose the highlighted key's note name."
        : activeMode === "staff-name"
          ? "Choose the staff note's name."
          : "Choose the matching piano key.";
  const wrongFeedback = activeChord
    ? activeMode === "chord-key"
      ? `${formatChordSymbol(activeChord, true)} uses ${activeChord.notes.map((note) => formatPianoKey(note)).join(", ")}.`
      : `That chord is ${formatChordSymbol(activeChord, true)}.`
    : activeMode === "key-name"
      ? `That key is ${currentCard.note.name}.`
      : `That note is ${formatPianoKey(currentCard.note, true)}.`;

  return (
    <section className={styles.lessonShell} aria-label={`Lesson ${lesson.id} in progress`}>
      <div className={styles.quiz}>
        <header className={styles.quizHeader}>
          <div>
            <span>Lesson {lesson.id}</span>
            <h1>{quizPrompt}</h1>
          </div>
          <dl className={styles.liveStats} aria-label="Current lesson statistics">
            <div><dt>Card</dt><dd>{cardIndex + 1}/{deck.length}</dd></div>
            <div><dt><Clock size={13} aria-hidden="true" /> Time</dt><dd>{formatLessonTime(elapsedMs)}</dd></div>
            <div><dt>Score</dt><dd>{correctCount}/{cardIndex + (answered ? 1 : 0)}</dd></div>
          </dl>
        </header>

        <div className={`${styles.quizBody} ${quizBodyClass}`}>
          <div className={styles.keyboardPrompt}>
            {activeMode === "key-name" ? (
              <PianoKeyboard
                targetNotes={[currentCard.note]}
                selectedIds={[]}
                answered={answered}
                interactive={false}
                showPrompt
                onChoose={() => undefined}
              />
            ) : activeMode === "chord-name" && activeChord ? (
              <PianoKeyboard
                targetNotes={activeChord.notes}
                selectedIds={[]}
                answered={answered}
                interactive={false}
                showPrompt
                range="chord"
                onChoose={() => undefined}
              />
            ) : activeMode === "chord-key" && activeChord ? (
              <div className={styles.chordPromptCard}>
                <span>Build this triad</span>
                <strong>{formatChordSymbol(activeChord, true)}</strong>
              </div>
            ) : currentCard.notation && currentCard.clef ? (
              <MusicStaff notation={currentCard.notation} clef={currentCard.clef} />
            ) : null}
          </div>

          <div className={styles.answerPanel}>
            {activeMode === "staff-key" ? (
              <PianoKeyboard
                targetNotes={[currentCard.note]}
                selectedIds={selectedAnswer ? [selectedAnswer] : []}
                answered={answered}
                interactive
                showPrompt={false}
                onChoose={(note, answeredAt) => answered
                  ? playNote(note)
                  : handleAnswer(note.id, answeredAt, note)}
              />
            ) : activeMode === "chord-key" && activeChord ? (
              <div className={styles.chordKeyAnswer}>
                <PianoKeyboard
                  targetNotes={answered
                    ? chordResultNotes(activeChord, selectedChordKeyIds, answerIsCorrect)
                    : []}
                  selectedIds={selectedChordKeyIds}
                  answered={answered}
                  interactive
                  showPrompt={false}
                  range="chord"
                  onChoose={toggleChordKey}
                />
                <button
                  type="button"
                  className={styles.checkChordButton}
                  disabled={answered || !chordKeysReady}
                  onClick={(event) => submitChordKeys(event.timeStamp)}
                >
                  Check chord · {selectedChordKeyIds.length}/3 keys
                </button>
              </div>
            ) : activeMode === "chord-name" && activeChord && lesson.answerChords ? (
              <div className={styles.chordNameAnswer}>
                <ChordSelector
                  chords={lesson.answerChords}
                  qualities={[activeChord.quality]}
                  selectedId={selectedAnswer}
                  correctId={answered ? activeChord.id : null}
                  wrongId={answered && !answerIsCorrect ? selectedAnswer : null}
                  disabled={answered}
                  columnCount={lesson.answerChords.length}
                  ariaLabel="Choose the highlighted chord's name"
                  onChoose={handleChordNameAnswer}
                />
              </div>
            ) : (
              <div
                className={styles.lessonChoices}
                aria-label="Choose a piano key note name"
                style={{
                  "--lesson-choice-columns": lesson.desktopChoiceColumns,
                  "--lesson-mobile-choice-columns": lesson.mobileChoiceColumns,
                } as CSSProperties}
              >
                {lesson.answerChoices.map((noteName) => {
                  const correct = answered && noteName === currentCard.note.name;
                  const wrong = answered && noteName === selectedAnswer && !correct;
                  return (
                    <button
                      type="button"
                      key={noteName}
                      className={correct ? styles.correct : wrong ? styles.wrong : ""}
                      disabled={answered}
                      onClick={(event) => handleAnswer(noteName, event.timeStamp)}
                      aria-label={noteName.replace("/", " or ")}
                    >
                      <AnswerChoice name={noteName} />
                    </button>
                  );
                })}
              </div>
            )}

            <div className={styles.lessonFeedback} aria-live="polite">
              <span className={answerIsCorrect ? styles.goodFeedback : answered ? styles.badFeedback : ""}>
                {answerIsCorrect ? <CheckCircle size={19} weight="fill" /> : answered ? <XCircle size={19} weight="fill" /> : null}
                {answerIsCorrect
                  ? "Correct."
                  : answered
                    ? wrongFeedback
                    : idleFeedback}
              </span>
              <button
                type="button"
                disabled={!answered}
                onClick={(event) => advance(event.timeStamp)}
              >
                {cardIndex === deck.length - 1 ? "Finish" : "Next"} <ArrowRight size={17} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
