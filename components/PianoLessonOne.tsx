"use client";

import {
  ArrowRight,
  CheckCircle,
  Clock,
  Trophy,
  User,
  XCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import {
  createPianoLessonDeck,
  formatLessonTime,
  formatRecognitionTime,
  getPianoLesson,
  lessonAccuracy,
  rankLessonNotePerformance,
  type LessonNotePerformanceMap,
  type PianoLessonCard,
  type PianoLessonId,
} from "@/data/pianoLessons";
import { pianoAudioPath, type PitchName } from "@/data/pianoNotes";
import { PianoKeyboard } from "./PianoNoteTrainer";
import styles from "./PianoLessonOne.module.css";

type LessonStage = "ready" | "playing" | "complete";

type PianoLessonProps = {
  lessonId: PianoLessonId;
};

function answerChoiceLabel(name: PitchName) {
  return name.replace("/", " / ");
}

function AnswerChoice({ name }: { name: PitchName }) {
  return answerChoiceLabel(name);
}

export function PianoLesson({ lessonId }: PianoLessonProps) {
  const lesson = getPianoLesson(lessonId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cardStartedAtRef = useRef<number | null>(null);
  const [stage, setStage] = useState<LessonStage>("ready");
  const [name, setName] = useState("");
  const [playerName, setPlayerName] = useState("Pianist");
  const [deck, setDeck] = useState<PianoLessonCard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<PitchName | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [notePerformance, setNotePerformance] = useState<LessonNotePerformanceMap>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const currentCard = deck[cardIndex];
  const answered = selectedAnswer !== null;
  const answerIsCorrect = answered && selectedAnswer === currentCard?.note.name;
  const accuracy = lessonAccuracy(correctCount, deck.length);
  const noteReport = rankLessonNotePerformance(
    deck.map((card) => card.note.name),
    notePerformance,
  );

  useEffect(() => {
    if (stage !== "playing" || startedAt === null) return;
    const timer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    return () => window.clearInterval(timer);
  }, [stage, startedAt]);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const playNote = (card: PianoLessonCard) => {
    audioRef.current?.pause();
    const audio = new Audio(pianoAudioPath(card.note));
    audio.preload = "auto";
    audio.volume = 0.9;
    audio.addEventListener("ended", () => {
      if (audioRef.current === audio) audioRef.current = null;
    }, { once: true });
    audioRef.current = audio;
    void audio.play().catch(() => undefined);
  };

  const beginLesson = (nextPlayerName: string, firstCardStartedAt: number) => {
    const now = Date.now();
    setPlayerName(nextPlayerName);
    setDeck(createPianoLessonDeck(lessonId));
    setCardIndex(0);
    setSelectedAnswer(null);
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

  const handleAnswer = (answer: PitchName, answeredAt: number) => {
    if (!currentCard || answered) return;
    const recognitionMs = Math.max(0, answeredAt - (cardStartedAtRef.current ?? answeredAt));
    const isCorrect = answer === currentCard.note.name;
    setSelectedAnswer(answer);
    setNotePerformance((current) => {
      const previous = current[currentCard.note.name] ?? {
        attempts: 0,
        mistakes: 0,
        totalRecognitionMs: 0,
      };
      return {
        ...current,
        [currentCard.note.name]: {
          attempts: previous.attempts + 1,
          mistakes: previous.mistakes + (isCorrect ? 0 : 1),
          totalRecognitionMs: previous.totalRecognitionMs + recognitionMs,
        },
      };
    });
    if (isCorrect) {
      setCorrectCount((current) => current + 1);
    }
    playNote(currentCard);
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
      <section className={styles.lessonShell} aria-labelledby="lesson-complete-title">
        <div className={styles.completeCard}>
          <div className={styles.trophy} aria-hidden="true"><Trophy size={42} weight="thin" /></div>
          <span>Lesson complete</span>
          <h1 id="lesson-complete-title">Congratulations, {playerName}!</h1>
          <p>{lesson.completionDescription}</p>
          <dl className={styles.results} aria-label="Lesson results">
            <div><dt>Time</dt><dd>{formatLessonTime(elapsedMs)}</dd></div>
            <div><dt>Score</dt><dd>{correctCount}/{lesson.cardCount}</dd></div>
            <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
          </dl>
          <section className={styles.noteReport} aria-labelledby="lesson-note-report-title">
            <header className={styles.noteReportHeader}>
              <h2 id="lesson-note-report-title">Note report</h2>
              <p>Ranked by mistakes, then average recognition time.</p>
            </header>
            <div
              className={styles.noteReportTable}
              tabIndex={0}
              aria-label="Ranked statistics for every note in this lesson"
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Note</th>
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
            <Link href="/projects/piano-party/lessons/">All lessons</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!currentCard) return null;

  return (
    <section className={styles.lessonShell} aria-label={`Lesson ${lesson.id} in progress`}>
      <div className={styles.quiz}>
        <header className={styles.quizHeader}>
          <div>
            <span>Lesson {lesson.id}</span>
            <h1>Which note is highlighted?</h1>
          </div>
          <dl className={styles.liveStats} aria-label="Current lesson statistics">
            <div><dt>Card</dt><dd>{cardIndex + 1}/{deck.length}</dd></div>
            <div><dt><Clock size={13} aria-hidden="true" /> Time</dt><dd>{formatLessonTime(elapsedMs)}</dd></div>
            <div><dt>Score</dt><dd>{correctCount}/{cardIndex + (answered ? 1 : 0)}</dd></div>
          </dl>
        </header>

        <div className={styles.quizBody}>
          <div className={styles.keyboardPrompt}>
            <PianoKeyboard
              target={currentCard.note}
              selectedId={null}
              answered={answered}
              interactive={false}
              showPrompt
              onChoose={() => undefined}
            />
          </div>

          <div className={styles.answerPanel}>
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

            <div className={styles.lessonFeedback} aria-live="polite">
              <span className={answerIsCorrect ? styles.goodFeedback : answered ? styles.badFeedback : ""}>
                {answerIsCorrect ? <CheckCircle size={19} weight="fill" /> : answered ? <XCircle size={19} weight="fill" /> : null}
                {answerIsCorrect ? "Correct." : answered ? `That key is ${currentCard.note.name}.` : "Choose the highlighted key's note name."}
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
