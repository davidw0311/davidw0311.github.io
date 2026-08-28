"use client";

import {
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  Brain,
  CardsThree,
  ChartBar,
  CheckCircle,
  Coins,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import {
  actionLabels,
  dealerUpcards,
  explainScenario,
  scenariosForSelection,
  strategyCodeMeaning,
  type BlackjackAction,
  type CardRank,
  type HandKind,
  type StrategyCode,
} from "@/data/blackjackStrategy";
import { masterySections } from "@/data/blackjackModes";
import {
  formatStrategyRowLabel,
  formatStrategyRowName,
  formatTrainingHandHeading,
  strategySelectionState,
  suitForTrainingCard,
  trainingActionIsAvailable,
  type TrainingFocus,
  type TrainingSuit,
} from "@/data/blackjackTraining";
import { useBlackjackTraining } from "@/hooks/useBlackjackTraining";
import { BlackjackSimulation } from "./BlackjackSimulation";
import styles from "./BlackjackTrainer.module.css";

const actions: BlackjackAction[] = ["hit", "stand", "double", "split", "surrender"];
const suitGlyphs: Record<TrainingSuit, string> = {
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

function PlayingCard({ rank, suit, label }: { rank: CardRank; suit: TrainingSuit; label: string }) {
  const isRed = suit === "diamonds" || suit === "hearts";
  const suitName = suit.slice(0, -1);
  return (
    <div
      className={`${styles.card} ${isRed ? styles.redCard : ""}`}
      aria-label={`${label}: ${rank} of ${suitName}s`}
    >
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
  const {
    accuracy,
    advanceMasterySection,
    answered,
    changeFocus,
    chooseAction,
    clearSelection,
    correct,
    currentMasterySection,
    dealNumber,
    dealPractice,
    focus,
    isCorrect,
    masteredScenarioIds,
    masteryAttempts,
    masterySectionComplete,
    masterySectionIndex,
    nextMasteryHand,
    scenario,
    screen,
    selectedAction,
    selectedScenarioIds,
    setScreen,
    setTableKind,
    startMastery,
    startPractice,
    startSelectedPractice,
    streak,
    tableKind,
    tableRows,
    toggleSelection,
  } = useBlackjackTraining();
  const explanation = useMemo(() => explainScenario(scenario), [scenario]);

  const renderMenu = () => (
    <motion.div
      className={styles.modeMenu}
      key="mode-menu"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.menuIntro}>
        <CardsThree size={36} weight="thin" aria-hidden="true" />
        <h2>Choose how you want to train</h2>
        <p>Build one part of the chart at a time, or test your decisions with money on the table.</p>
      </div>
      <div className={styles.modeGrid}>
        <motion.button
          type="button"
          className={`${styles.modeCard} ${styles.masteryModeCard}`}
          onClick={startMastery}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        >
          <span className={styles.modeIcon}>
            <Brain size={30} weight="duotone" />
          </span>
          <span className={styles.modeCardCopy}>
            <strong>Table Mastery</strong>
            <span>Clear seven focused sections. A section stays locked in until every matchup is correct.</span>
          </span>
          <span className={styles.modeMeta}>350 decisions</span>
          <ArrowRight className={styles.modeArrow} size={22} weight="bold" />
        </motion.button>
        <motion.button
          type="button"
          className={`${styles.modeCard} ${styles.simulationModeCard}`}
          onClick={() => setScreen("simulation")}
          whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        >
          <span className={styles.modeIcon}>
            <Coins size={30} weight="duotone" />
          </span>
          <span className={styles.modeCardCopy}>
            <strong>Bankroll Game</strong>
            <span>Match a real or digital table, then play every hit, double, split, dealer draw, and payout.</span>
          </span>
          <span className={styles.modeMeta}>Configurable rules</span>
          <ArrowRight className={styles.modeArrow} size={22} weight="bold" />
        </motion.button>
      </div>
      <div className={styles.menuUtilities}>
        <span>More ways to study</span>
        <div>
          <button type="button" onClick={startPractice}>
            <ArrowClockwise size={17} /> Free practice
          </button>
          <button type="button" onClick={() => setScreen("table")}>
            <ChartBar size={17} /> Strategy chart
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderTrainerHeader = () => (
    <>
      <div className={styles.trainerHeader}>
        <div className={styles.modeIdentity}>
          <button type="button" className={styles.backToModes} onClick={() => setScreen("menu")}>
            <ArrowLeft size={17} weight="bold" /> Modes
          </button>
          <div>
            <span>
              {screen === "mastery" ? "Table Mastery"
                : screen === "simulation" ? "Bankroll Game"
                  : screen === "table" ? "Strategy Chart"
                    : "Free Practice"}
            </span>
            <strong>
              {screen === "mastery" ? currentMasterySection.title
                : screen === "simulation" ? "Live training table"
                  : screen === "table" ? tableLabels[tableKind]
                    : focus === "custom" ? "Custom selection"
                      : focusLabels[focus]}
            </strong>
          </div>
        </div>
        {screen === "mastery" && (
          <dl className={styles.compactStats} aria-label="Section progress">
            <div><dt>Mastered</dt><dd>{masteredScenarioIds.size}/{currentMasterySection.scenarios.length}</dd></div>
            <div><dt>Attempts</dt><dd>{masteryAttempts}</dd></div>
          </dl>
        )}
        {screen === "practice" && (
          <dl className={styles.scoreboard} aria-label="Training statistics">
            <div><dt>Hands</dt><dd>{answered}</dd></div>
            <div><dt>Correct</dt><dd>{correct}</dd></div>
            <div><dt>Streak</dt><dd>{streak}</dd></div>
            <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
          </dl>
        )}
        {screen === "table" && (
          <div className={styles.selectionActions} aria-live="polite">
            <span><strong>{selectedScenarioIds.size}</strong> {selectedScenarioIds.size === 1 ? "hand" : "hands"} selected</span>
            <button
              type="button"
              className={styles.clearSelection}
              disabled={selectedScenarioIds.size === 0}
              onClick={clearSelection}
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
      {screen === "practice" && (
        <div className={styles.subControls}>
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
          {focus === "custom" && (
            <button type="button" className={styles.editSelection} onClick={() => setScreen("table")}>
              Edit selection
            </button>
          )}
        </div>
      )}
      {screen === "table" && (
        <div className={styles.subControls}>
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
        </div>
      )}
    </>
  );

  const renderFeedback = () => {
    if (!selectedAction) {
      return (
        <motion.div
          key="instructions"
          className={styles.instructions}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>
            Choose the best action for the cards shown.
          </p>
          <small>
            {screen === "mastery"
              ? currentMasterySection.description
              : "Unavailable actions are disabled for this hand."}
          </small>
        </motion.div>
      );
    }
    const isFinalMasterySection = masterySectionIndex === masterySections.length - 1;
    return (
      <motion.div
        key={`feedback-${scenario.id}-${dealNumber}`}
        className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}
        role="status"
        aria-live="polite"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className={styles.feedbackTitle}>
          {isCorrect
            ? <CheckCircle size={25} weight="fill" />
            : <XCircle size={25} weight="fill" />}
          <strong>{isCorrect ? "Correct strategy" : "Not quite"}</strong>
        </div>
        <p className={styles.correctPlay}>
          Correct play: <strong>{actionLabels[scenario.correctAction]}</strong>
        </p>
        <p>{explanation}</p>
        <small>Chart entry: {strategyCodeMeaning(scenario.strategyCode)}</small>
        {screen === "mastery" && (
          <div className={styles.resultBlock}>
            <span>
              {masterySectionComplete
                ? `${currentMasterySection.title} complete`
                : `${masteredScenarioIds.size} of ${currentMasterySection.scenarios.length} matchups mastered`}
            </span>
            <button
              type="button"
              className={styles.nextButton}
              onClick={masterySectionComplete ? advanceMasterySection : nextMasteryHand}
            >
              {masterySectionComplete
                ? isFinalMasterySection
                  ? "Finish mastery"
                  : `Continue to ${masterySections[masterySectionIndex + 1].shortTitle}`
                : "Next challenge"}
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        )}
        {screen === "practice" && (
          <button type="button" className={styles.nextButton} onClick={() => dealPractice()}>
            Next hand <ArrowClockwise size={18} weight="bold" />
          </button>
        )}
      </motion.div>
    );
  };

  const renderGame = () => (
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
              <PlayingCard
                rank={scenario.dealerUpcard}
                suit={suitForTrainingCard(scenario, 3, dealNumber)}
                label="Dealer upcard"
              />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className={styles.playerZone}>
          <div className={styles.handHeading}>
            <span>Your hand</span>
            <strong>{formatTrainingHandHeading(scenario)}</strong>
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
                  suit={suitForTrainingCard(scenario, index, dealNumber)}
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
              const available = trainingActionIsAvailable(action, scenario);
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
        <AnimatePresence mode="wait">{renderFeedback()}</AnimatePresence>
      </div>
    </div>
  );

  const renderStrategyTable = () => (
    <div className={styles.strategyWorkspace}>
      <div className={styles.strategyIntro}>
        <h2>Select what you want to practice</h2>
        <p>Select player rows, dealer columns, or individual cells. Every selection joins the same practice set.</p>
      </div>
      <div
        className={styles.tableScroll}
        tabIndex={0}
        aria-label={`${tableLabels[tableKind]} strategy table, horizontally scrollable`}
      >
        <table className={styles.strategyTable}>
          <caption className={styles.srOnly}>{tableLabels[tableKind]} basic strategy</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.cornerHeading}>Your hand</th>
              {dealerUpcards.map((upcard) => {
                const columnScenarios = scenariosForSelection({
                  kind: tableKind,
                  dealerUpcard: upcard,
                });
                const state = strategySelectionState(selectedScenarioIds, columnScenarios);
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
              const rowState = strategySelectionState(selectedScenarioIds, row);
              const rowName = formatStrategyRowName(rowScenario);
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
                      <span>
                        {rowScenario.kind === "hard"
                          ? "Hard"
                          : rowScenario.kind === "soft" ? "Soft" : "Pair"}
                      </span>
                      <strong>{formatStrategyRowLabel(rowScenario)}</strong>
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
  );

  return (
    <section className={styles.trainer} aria-label="Back to Blackjack trainer">
      <AnimatePresence mode="wait" initial={false}>
        {screen === "menu" ? renderMenu() : screen === "simulation" ? (
          <BlackjackSimulation onExit={() => setScreen("menu")} />
        ) : (
          <motion.div
            key={screen}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {renderTrainerHeader()}
            {screen === "table" ? renderStrategyTable() : renderGame()}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
