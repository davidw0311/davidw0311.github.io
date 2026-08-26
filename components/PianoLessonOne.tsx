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
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  createLessonOneDeck,
  formatLessonTime,
  lessonAccuracy,
  lessonOneCardCount,
  lessonOneNoteNames,
  type PianoLessonCard,
} from "@/data/pianoLessons";
import { pianoAudioPath, type NaturalNoteName } from "@/data/pianoNotes";
import { PianoKeyboard } from "./PianoNoteTrainer";
import styles from "./PianoLessonOne.module.css";

type LessonStage = "ready" | "playing" | "complete";

export function PianoLessonOne() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stage, setStage] = useState<LessonStage>("ready");
  const [name, setName] = useState("");
  const [playerName, setPlayerName] = useState("Pianist");
  const [deck, setDeck] = useState<PianoLessonCard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<NaturalNoteName | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const currentCard = deck[cardIndex];
  const answered = selectedAnswer !== null;
  const answerIsCorrect = answered && selectedAnswer === currentCard?.note.name;
  const accuracy = lessonAccuracy(correctCount, deck.length);

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

  const beginLesson = (nextPlayerName: string) => {
    setPlayerName(nextPlayerName);
    setDeck(createLessonOneDeck());
    setCardIndex(0);
    setSelectedAnswer(null);
    setCorrectCount(0);
    setElapsedMs(0);
    setStartedAt(Date.now());
    setStage("playing");
  };

  const handleStart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    beginLesson(name.trim() || "Pianist");
  };

  const chooseAnswer = (answer: NaturalNoteName) => {
    if (!currentCard || answered) return;
    setSelectedAnswer(answer);
    if (answer === currentCard.note.name) setCorrectCount((current) => current + 1);
    playNote(currentCard);
  };

  const advance = () => {
    if (!answered || startedAt === null) return;
    if (cardIndex === deck.length - 1) {
      setElapsedMs(Date.now() - startedAt);
      setStage("complete");
      return;
    }
    setCardIndex((current) => current + 1);
    setSelectedAnswer(null);
  };

  if (stage === "ready") {
    return (
      <section className={styles.lessonShell} aria-labelledby="lesson-one-title">
        <div className={styles.startCard}>
          <div className={styles.startCopy}>
            <span>Lesson 1</span>
            <h1 id="lesson-one-title">White key names.</h1>
            <p>Identify C through B on the keyboard. Each note appears three times in a shuffled 21-card deck.</p>
            <dl className={styles.lessonFacts} aria-label="Lesson details">
              <div><dt>Cards</dt><dd>21</dd></div>
              <div><dt>Notes</dt><dd>7</dd></div>
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
          <p>You finished every white-key card in Lesson 1.</p>
          <dl className={styles.results} aria-label="Lesson results">
            <div><dt>Time</dt><dd>{formatLessonTime(elapsedMs)}</dd></div>
            <div><dt>Score</dt><dd>{correctCount}/{lessonOneCardCount}</dd></div>
            <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
          </dl>
          <div className={styles.completeActions}>
            <button type="button" onClick={() => beginLesson(playerName)}>Try again</button>
            <Link href="/projects/piano-note-lab/lessons/">All lessons</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!currentCard) return null;

  return (
    <section className={styles.lessonShell} aria-label="Lesson 1 in progress">
      <div className={styles.quiz}>
        <header className={styles.quizHeader}>
          <div>
            <span>Lesson 1</span>
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
            <div className={styles.lessonChoices} aria-label="Choose a white key note name">
              {lessonOneNoteNames.map((noteName) => {
                const correct = answered && noteName === currentCard.note.name;
                const wrong = answered && noteName === selectedAnswer && !correct;
                return (
                  <button
                    type="button"
                    key={noteName}
                    className={correct ? styles.correct : wrong ? styles.wrong : ""}
                    disabled={answered}
                    onClick={() => chooseAnswer(noteName)}
                  >
                    {noteName}
                  </button>
                );
              })}
            </div>

            <div className={styles.lessonFeedback} aria-live="polite">
              <span className={answerIsCorrect ? styles.goodFeedback : answered ? styles.badFeedback : ""}>
                {answerIsCorrect ? <CheckCircle size={19} weight="fill" /> : answered ? <XCircle size={19} weight="fill" /> : null}
                {answerIsCorrect ? "Correct." : answered ? `That key is ${currentCard.note.name}.` : "Choose the highlighted key's note name."}
              </span>
              <button type="button" disabled={!answered} onClick={advance}>
                {cardIndex === deck.length - 1 ? "Finish" : "Next"} <ArrowRight size={17} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
