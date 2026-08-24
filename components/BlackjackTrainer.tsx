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
  dealerUpcards,
  explainScenario,
  scenariosForSelection,
  strategyCodeMeaning,
  trainingScenarios,
  type BlackjackAction,
  type CardRank,
  type HandKind,
  type StrategyCode,
  type TrainingScenario,
} from "@/data/blackjackStrategy";
import styles from "./BlackjackTrainer.module.css";

type TrainingFocus = "all" | HandKind | "custom";
type TrainerView = "practice" | "table";
type Suit = "clubs" | "diamonds" | "hearts" | "spades";

const actions: BlackjackAction[] = ["hit", "stand", "double", "split", "surrender"];
const suits: Suit[] = ["spades", "hearts", "clubs", "diamonds"];
const suitGlyphs: Record<Suit, string> = {
  clubs: "♣︎",
  diamonds: "♦︎",
  hearts: "♥︎",
  spades: "♠︎",
};
const focusLabels: Record<Exclude<TrainingFocus, "custom">, string> = {
  all: "All hands",
  hard: "Hard",
  soft: "Soft",
  pair: "Pairs",
};
const tableLabels: Record<HandKind, string> = {
  hard: "Hard totals",
  soft: "Soft totals",
  pair: "Pairs",
};
const strategyCodeLabels: Record<StrategyCode, string> = {
  H: "Hit",
  S: "Stand",
  D: "Double, otherwise hit",
  Ds: "Double, otherwise stand",
  P: "Split",
  R: "Surrender, otherwise hit",
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

function formatTableRowLabel(scenario: TrainingScenario) {
  if (scenario.kind === "hard") return String(scenario.total);
  return scenario.handLabel;
}

function formatTableRowName(scenario: TrainingScenario) {
  if (scenario.kind === "hard") return `Hard ${scenario.total}`;
  if (scenario.kind === "soft") return `Soft ${scenario.handLabel}`;
  return scenario.playerRanks[0] === "A" ? "Pair of Aces" : `Pair of ${scenario.playerRanks[0]}s`;
}

function selectionState(selectedIds: Set<string>, scenarios: TrainingScenario[]) {
  const selectedCount = scenarios.filter((scenario) => selectedIds.has(scenario.id)).length;
  if (selectedCount === 0) return "none";
  if (selectedCount === scenarios.length) return "all";
  return "some";
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
  const [view, setView] = useState<TrainerView>("practice");
  const [focus, setFocus] = useState<TrainingFocus>("all");
  const [tableKind, setTableKind] = useState<HandKind>("hard");
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<Set<string>>(() => new Set());
  const [activePracticeIds, setActivePracticeIds] = useState<Set<string> | null>(null);
  const [scenario, setScenario] = useState<TrainingScenario>(initialScenario);
  const [selectedAction, setSelectedAction] = useState<BlackjackAction | null>(null);
  const [dealNumber, setDealNumber] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);

  const isCorrect = selectedAction === scenario.correctAction;
  const accuracy = answered === 0 ? 0 : Math.round((correct / answered) * 100);
  const explanation = useMemo(() => explainScenario(scenario), [scenario]);
  const activePracticeScenarios = useMemo(() => {
    if (!activePracticeIds) return [];
    return trainingScenarios.filter((candidate) => activePracticeIds.has(candidate.id));
  }, [activePracticeIds]);
  const tableScenarios = useMemo(() => scenariosForSelection({ kind: tableKind }), [tableKind]);
  const tableRows = useMemo(() => {
    const rows = new Map<string, TrainingScenario[]>();
    for (const candidate of tableScenarios) {
      const row = rows.get(candidate.handLabel) ?? [];
      row.push(candidate);
      rows.set(candidate.handLabel, row);
    }
    return [...rows.values()];
  }, [tableScenarios]);

  const dealFrom = (candidates: TrainingScenario[]) => {
    if (candidates.length === 0) return;
    let index = randomScenarioIndex(candidates.length);
    if (candidates.length > 1 && candidates[index].id === scenario.id) {
      index = (index + 1) % candidates.length;
    }

    setScenario(candidates[index]);
    setSelectedAction(null);
    setDealNumber((value) => value + 1);
  };

  const deal = (nextFocus: TrainingFocus = focus) => {
    const candidates = nextFocus === "all"
      ? trainingScenarios
      : nextFocus === "custom"
        ? activePracticeScenarios
        : trainingScenarios.filter((candidate) => candidate.kind === nextFocus);
    dealFrom(candidates);
  };

  const changeFocus = (nextFocus: Exclude<TrainingFocus, "custom">) => {
    setActivePracticeIds(null);
    setFocus(nextFocus);
    deal(nextFocus);
  };

  const toggleSelection = (candidates: TrainingScenario[]) => {
    setSelectedScenarioIds((current) => {
      const next = new Set(current);
      const remove = candidates.every((candidate) => next.has(candidate.id));
      for (const candidate of candidates) {
        if (remove) next.delete(candidate.id);
        else next.add(candidate.id);
      }
      return next;
    });
  };

  const startSelectedPractice = () => {
    const candidates = trainingScenarios.filter((candidate) => selectedScenarioIds.has(candidate.id));
    if (candidates.length === 0) return;
    setActivePracticeIds(new Set(selectedScenarioIds));
    setFocus("custom");
    setView("practice");
    dealFrom(candidates);
  };

  const clearCustomPractice = () => {
    setSelectedScenarioIds(new Set());
    setActivePracticeIds(null);
    setFocus("all");
    dealFrom(trainingScenarios);
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
        <div className={styles.headerControls}>
          <div className={styles.viewControls} aria-label="Choose trainer view">
            <button
              type="button"
              className={view === "practice" ? styles.activeView : ""}
              aria-pressed={view === "practice"}
              onClick={() => setView("practice")}
            >
              Practice
            </button>
            <button
              type="button"
              className={view === "table" ? styles.activeView : ""}
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              Strategy tables
            </button>
          </div>

          {view === "practice" ? (
            <div className={styles.focusControls} aria-label="Choose a hand category">
              {(Object.keys(focusLabels) as Exclude<TrainingFocus, "custom">[]).map((option) => (
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
          ) : (
            <div className={styles.tableTabs} aria-label="Choose a strategy table">
              {(Object.keys(tableLabels) as HandKind[]).map((kind) => (
                <button
                  type="button"
                  key={kind}
                  className={tableKind === kind ? styles.activeTable : ""}
                  aria-pressed={tableKind === kind}
                  onClick={() => setTableKind(kind)}
                >
                  {tableLabels[kind]}
                </button>
              ))}
            </div>
          )}
        </div>

        {view === "practice" ? (
          <dl className={styles.scoreboard} aria-label="Training statistics">
            <div><dt>Hands</dt><dd>{answered}</dd></div>
            <div><dt>Correct</dt><dd>{correct}</dd></div>
            <div><dt>Streak</dt><dd>{streak}</dd></div>
            <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
          </dl>
        ) : (
          <div className={styles.selectionActions} aria-live="polite">
            <span><strong>{selectedScenarioIds.size}</strong> {selectedScenarioIds.size === 1 ? "hand" : "hands"} selected</span>
            <button
              type="button"
              className={styles.clearSelection}
              disabled={selectedScenarioIds.size === 0}
              onClick={clearCustomPractice}
            >
              Clear
            </button>
            <button
              type="button"
              className={styles.practiceSelection}
              disabled={selectedScenarioIds.size === 0}
              onClick={startSelectedPractice}
            >
              Practice selection
            </button>
          </div>
        )}
      </div>

      {view === "practice" ? (
        <>
          {focus === "custom" && (
            <div className={styles.customScope} role="status">
              <span><strong>Selected practice</strong> {activePracticeScenarios.length} {activePracticeScenarios.length === 1 ? "hand" : "hands"}</span>
              <div>
                <button type="button" onClick={() => setView("table")}>Edit selection</button>
                <button type="button" onClick={clearCustomPractice}>Use all hands</button>
              </div>
            </div>
          )}

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
        </>
      ) : (
        <div className={styles.strategyWorkspace}>
          <div className={styles.strategyIntro}>
            <h2>Select what you want to practice</h2>
            <p>Select multiple player rows, dealer columns, or individual cells. Every selection joins the same practice set.</p>
          </div>

          <div className={styles.tableScroll} tabIndex={0} aria-label={`${tableLabels[tableKind]} strategy table, horizontally scrollable`}>
            <table className={styles.strategyTable}>
              <caption className={styles.srOnly}>{tableLabels[tableKind]} basic strategy</caption>
              <thead>
                <tr>
                  <th scope="col" className={styles.cornerHeading}>Your hand</th>
                  {dealerUpcards.map((upcard) => {
                    const columnScenarios = scenariosForSelection({ kind: tableKind, dealerUpcard: upcard });
                    const state = selectionState(selectedScenarioIds, columnScenarios);
                    return (
                      <th scope="col" key={upcard}>
                        <button
                          type="button"
                          className={`${styles.columnSelector} ${state === "all" ? styles.tableSelectionActive : ""} ${state === "some" ? styles.tableSelectionPartial : ""}`}
                          aria-label={`Select dealer ${upcard} column in ${tableLabels[tableKind]}`}
                          aria-pressed={state === "some" ? "mixed" : state === "all"}
                          onClick={() => toggleSelection(columnScenarios)}
                        >
                          <span>Dealer</span>
                          <strong>{upcard}</strong>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => {
                  const rowScenario = row[0];
                  const rowState = selectionState(selectedScenarioIds, row);
                  const rowName = formatTableRowName(rowScenario);
                  return (
                    <tr key={rowScenario.handLabel}>
                      <th scope="row">
                        <button
                          type="button"
                          className={`${styles.rowSelector} ${rowState === "all" ? styles.tableSelectionActive : ""} ${rowState === "some" ? styles.tableSelectionPartial : ""}`}
                          aria-label={`Select ${rowName} row`}
                          aria-pressed={rowState === "some" ? "mixed" : rowState === "all"}
                          onClick={() => toggleSelection(row)}
                        >
                          <span>{rowScenario.kind === "hard" ? "Hard" : rowScenario.kind === "soft" ? "Soft" : "Pair"}</span>
                          <strong>{formatTableRowLabel(rowScenario)}</strong>
                        </button>
                      </th>
                      {row.map((cell) => {
                        const selected = selectedScenarioIds.has(cell.id);
                        return (
                          <td key={cell.id}>
                            <button
                              type="button"
                              className={`${styles.strategyCell} ${selected ? styles.tableSelectionActive : ""}`}
                              data-code={cell.strategyCode}
                              aria-label={`${rowName} against dealer ${cell.dealerUpcard}: ${strategyCodeLabels[cell.strategyCode]}`}
                              aria-pressed={selected}
                              title={strategyCodeLabels[cell.strategyCode]}
                              onClick={() => toggleSelection([cell])}
                            >
                              {cell.strategyCode}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.strategyLegend} aria-label="Strategy table legend">
            {(Object.keys(strategyCodeLabels) as StrategyCode[]).map((code) => (
              <div key={code}>
                <strong>{code}</strong>
                <span>{strategyCodeLabels[code]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
