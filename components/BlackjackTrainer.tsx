"use client";

import {
  ArrowClockwise,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import {
  actionLabels,
  explainScenario,
  strategyCodeMeaning,
  trainingScenarios,
  type BlackjackAction,
  type CardRank,
  type HandKind,
  type TrainingScenario,
} from "@/data/blackjackStrategy";
import styles from "./BlackjackTrainer.module.css";

type TrainingFocus = "all" | HandKind;
type Suit = "clubs" | "diamonds" | "hearts" | "spades";

const actions: BlackjackAction[] = ["hit", "stand", "double", "split", "surrender"];
const suits: Suit[] = ["spades", "hearts", "clubs", "diamonds"];
const suitGlyphs: Record<Suit, string> = {
  clubs: "♣︎",
  diamonds: "♦︎",
  hearts: "♥︎",
  spades: "♠︎",
};
const focusLabels: Record<TrainingFocus, string> = {
  all: "All hands",
  hard: "Hard",
  soft: "Soft",
  pair: "Pairs",
};

const initialScenario = trainingScenarios.find((scenario) => scenario.id === "hard-16-vs-10") ?? trainingScenarios[0];

function hashText(value: string) {
  return Array.from(value).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function suitFor(scenario: TrainingScenario, cardIndex: number, dealNumber: number) {
  return suits[(hashText(scenario.id) + cardIndex + dealNumber) % suits.length];
}

function actionIsAvailable(action: BlackjackAction, scenario: TrainingScenario) {
  if (action === "double") return scenario.availability.canDouble;
  if (action === "split") return scenario.availability.canSplit;
  if (action === "surrender") return scenario.availability.canSurrender;
  return true;
}

function randomScenarioIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function formatHandHeading(scenario: TrainingScenario) {
  if (scenario.kind !== "pair") {
    return `${scenario.kind[0].toUpperCase()}${scenario.kind.slice(1)} ${scenario.total}`;
  }

  const rank = scenario.playerRanks[0];
  return rank === "A" ? "Pair of Aces" : `Pair of ${rank}s`;
}

function PlayingCard({ rank, suit, label }: { rank: CardRank; suit: Suit; label: string }) {
  const isRed = suit === "diamonds" || suit === "hearts";
  const suitName = suit.slice(0, -1);

  return (
    <div className={`${styles.card} ${isRed ? styles.redCard : ""}`} aria-label={`${label}: ${rank} of ${suitName}s`}>
      <span className={styles.cardCorner} aria-hidden="true">
        <strong>{rank}</strong>
        <i>{suitGlyphs[suit]}</i>
      </span>
      <span className={styles.cardSuit} aria-hidden="true">{suitGlyphs[suit]}</span>
      <span className={`${styles.cardCorner} ${styles.cardCornerBottom}`} aria-hidden="true">
        <strong>{rank}</strong>
        <i>{suitGlyphs[suit]}</i>
      </span>
    </div>
  );
}

export function BlackjackTrainer() {
  const reduceMotion = useReducedMotion();
  const [focus, setFocus] = useState<TrainingFocus>("all");
  const [scenario, setScenario] = useState<TrainingScenario>(initialScenario);
  const [selectedAction, setSelectedAction] = useState<BlackjackAction | null>(null);
  const [dealNumber, setDealNumber] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);

  const isCorrect = selectedAction === scenario.correctAction;
  const accuracy = answered === 0 ? 0 : Math.round((correct / answered) * 100);
  const explanation = useMemo(() => explainScenario(scenario), [scenario]);

  const deal = (nextFocus: TrainingFocus = focus) => {
    const candidates = nextFocus === "all"
      ? trainingScenarios
      : trainingScenarios.filter((candidate) => candidate.kind === nextFocus);
    let index = randomScenarioIndex(candidates.length);
    if (candidates.length > 1 && candidates[index].id === scenario.id) {
      index = (index + 1) % candidates.length;
    }

    setScenario(candidates[index]);
    setSelectedAction(null);
    setDealNumber((value) => value + 1);
  };

  const changeFocus = (nextFocus: TrainingFocus) => {
    setFocus(nextFocus);
    deal(nextFocus);
  };

  const chooseAction = (action: BlackjackAction) => {
    if (selectedAction || !actionIsAvailable(action, scenario)) return;
    const answerIsCorrect = action === scenario.correctAction;
    setSelectedAction(action);
    setAnswered((value) => value + 1);
    if (answerIsCorrect) {
      setCorrect((value) => value + 1);
      setStreak((value) => value + 1);
    } else {
      setStreak(0);
    }
  };

  return (
    <section className={styles.trainer} aria-label="Blackjack basic strategy trainer">
      <div className={styles.trainerHeader}>
        <div className={styles.focusControls} aria-label="Choose a hand category">
          {(Object.keys(focusLabels) as TrainingFocus[]).map((option) => (
            <button
              type="button"
              key={option}
              className={focus === option ? styles.activeFocus : ""}
              aria-pressed={focus === option}
              onClick={() => changeFocus(option)}
            >
              {focusLabels[option]}
            </button>
          ))}
        </div>

        <dl className={styles.scoreboard} aria-label="Training statistics">
          <div><dt>Hands</dt><dd>{answered}</dd></div>
          <div><dt>Correct</dt><dd>{correct}</dd></div>
          <div><dt>Streak</dt><dd>{streak}</dd></div>
          <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
        </dl>
      </div>

      <div className={styles.gameGrid}>
        <div className={styles.tableSurface}>
          <div className={styles.tableRule} aria-hidden="true" />
          <div className={styles.dealerZone}>
            <div className={styles.handHeading}>
              <span>Dealer shows</span>
              <strong>{scenario.dealerUpcard}</strong>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className={styles.dealerCards}
                key={`dealer-${scenario.id}-${dealNumber}`}
                initial={reduceMotion ? false : { opacity: 0, y: -18, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                <PlayingCard rank={scenario.dealerUpcard} suit={suitFor(scenario, 3, dealNumber)} label="Dealer upcard" />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.playerZone}>
            <div className={styles.handHeading}>
              <span>Your hand</span>
              <strong>{formatHandHeading(scenario)}</strong>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className={styles.playerCards}
                key={`player-${scenario.id}-${dealNumber}`}
                initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
              >
                {scenario.playerRanks.map((rank, index) => (
                  <PlayingCard
                    key={`${scenario.id}-${index}`}
                    rank={rank}
                    suit={suitFor(scenario, index, dealNumber)}
                    label={`Player card ${index + 1}`}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className={styles.controlPanel}>
          <div>
            <p className={styles.prompt}>What is the basic strategy play?</p>
            <div className={styles.actionGrid}>
              {actions.map((action) => {
                const available = actionIsAvailable(action, scenario);
                const selected = selectedAction === action;
                const answer = selectedAction && scenario.correctAction === action;
                const stateClass = selected && !isCorrect
                  ? styles.wrongAction
                  : answer
                    ? styles.correctAction
                    : "";

                return (
                  <motion.button
                    type="button"
                    key={action}
                    className={stateClass}
                    disabled={!available || selectedAction !== null}
                    aria-label={available ? actionLabels[action] : `${actionLabels[action]} unavailable for this hand`}
                    onClick={() => chooseAction(action)}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  >
                    {actionLabels[action]}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedAction ? (
              <motion.div
                key={`feedback-${scenario.id}`}
                className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}
                role="status"
                aria-live="polite"
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.28 }}
              >
                <div className={styles.feedbackTitle}>
                  {isCorrect ? <CheckCircle size={25} weight="fill" /> : <XCircle size={25} weight="fill" />}
                  <strong>{isCorrect ? "Correct" : "Not quite"}</strong>
                </div>
                <p className={styles.correctPlay}>Correct play: <strong>{actionLabels[scenario.correctAction]}</strong></p>
                <p>{explanation}</p>
                <small>Chart entry: {strategyCodeMeaning(scenario.strategyCode)}</small>
                <button type="button" className={styles.nextButton} onClick={() => deal()}>
                  Next hand <ArrowClockwise size={18} weight="bold" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="instructions" className={styles.instructions} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
                <p>Choose the best action for the cards shown.</p>
                <small>Unavailable actions are disabled. Strategy assumes an initial two-card decision unless the hand shows three cards.</small>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
