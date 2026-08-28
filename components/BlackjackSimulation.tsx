"use client";

import {
  ArrowClockwise,
  ArrowLeft,
  CardsThree,
  CheckCircle,
  GearSix,
  ShieldCheck,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { actionLabels, type BlackjackAction } from "@/data/blackjackStrategy";
import {
  actionAvailability as availabilityFor,
  appendSimulationLog as appendLog,
  blackjackCardName as cardName,
  blackjackHandLabel as handLabel,
  blackjackSuitGlyphs as suitGlyphs,
  createSimulationSession as createSession,
  drawSimulationCard as drawOne,
  formatBlackjackMoney as formatMoney,
  moveToNextSimulationHand as moveToNextHand,
  settleSimulationRound as settleRound,
  validateSimulationRules,
  type DecisionFeedback,
  type PlayerHand,
  type SimulationSession,
} from "@/data/blackjackSession";
import {
  clampWager,
  createShuffledShoe,
  dealerShouldHit,
  defaultSimulationRules,
  evaluateHand,
  normalizeRank,
  recommendedPlay,
  shouldShuffleBeforeRound,
  simulationPresets,
  type BettingStyle,
  type DoubleRule,
  type HoleCardRule,
  type ShoeCard,
  type ShuffleMode,
  type SimulationRules,
  type SurrenderRule,
  type TenSplitRule,
} from "@/data/blackjackSimulation";
import styles from "./BlackjackSimulation.module.css";

type SimulatorView = "setup" | "table";

const actions: BlackjackAction[] = ["hit", "stand", "double", "split", "surrender"];

function PlayingCard({ card, label, concealed = false }: { card: ShoeCard; label: string; concealed?: boolean }) {
  const reduceMotion = useReducedMotion();
  if (concealed) {
    return (
      <div className={`${styles.card} ${styles.cardBack}`} aria-label={`${label}: concealed card`}>
        <CardsThree size={30} weight="thin" aria-hidden="true" />
      </div>
    );
  }
  const isRed = card.suit === "diamonds" || card.suit === "hearts";
  const suitName = card.suit.slice(0, -1);
  return (
    <motion.div
      className={`${styles.card} ${isRed ? styles.redCard : ""}`}
      aria-label={`${label}: ${card.rank} of ${suitName}s`}
      initial={reduceMotion ? false : { opacity: 0, y: -18, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className={styles.cardCorner} aria-hidden="true"><strong>{card.rank}</strong><i>{suitGlyphs[card.suit]}</i></span>
      <span className={styles.cardSuit} aria-hidden="true">{suitGlyphs[card.suit]}</span>
      <span className={`${styles.cardCorner} ${styles.cardCornerBottom}`} aria-hidden="true"><strong>{card.rank}</strong><i>{suitGlyphs[card.suit]}</i></span>
    </motion.div>
  );
}


export function BlackjackSimulation({ onExit }: { onExit: () => void }) {
  const reduceMotion = useReducedMotion();
  const simulatorRef = useRef<HTMLElement>(null);
  const initialView = useRef(true);
  const [view, setView] = useState<SimulatorView>("setup");
  const [rules, setRules] = useState<SimulationRules>(defaultSimulationRules);
  const [setupError, setSetupError] = useState("");
  const [session, setSession] = useState<SimulationSession | null>(null);

  useEffect(() => {
    if (initialView.current) {
      initialView.current = false;
      return;
    }
    const simulator = simulatorRef.current;
    if (!simulator) return;
    window.scrollTo({
      top: Math.max(0, window.scrollY + simulator.getBoundingClientRect().top - 8),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [reduceMotion, view]);

  const updateRule = <Key extends keyof SimulationRules>(key: Key, value: SimulationRules[Key]) => {
    setRules((current) => ({ ...current, [key]: value }));
    setSetupError("");
  };

  const startGame = () => {
    const error = validateSimulationRules(rules);
    if (error) {
      setSetupError(error);
      return;
    }
    setSession(createSession(rules));
    setView("table");
  };

  const dealRound = () => {
    setSession((current) => {
      if (!current || current.phase !== "betting") return current;
      const wager = clampWager(current.pendingWager, current.bankroll, current.rules);
      if (wager < current.rules.minimumBet || wager > current.bankroll) return current;

      let shoe = current.shoe;
      let shoeNumber = current.shoeNumber;
      let cardsDealt = current.cardsDealt;
      let log = current.log;
      if (current.roundNumber > 0 && shouldShuffleBeforeRound({ rules: current.rules, cardsRemaining: shoe.length, cardsDealt })) {
        shoe = createShuffledShoe(current.rules.deckCount);
        shoeNumber += 1;
        cardsDealt = 0;
        log = appendLog(log, current.rules.shuffleMode === "continuous" ? "Continuous shuffler returned the discards." : "The shoe was reshuffled.");
      }

      const playerFirst = drawOne(shoe, current.rules); shoe = playerFirst.shoe;
      const dealerUp = drawOne(shoe, current.rules); shoe = dealerUp.shoe;
      const playerSecond = drawOne(shoe, current.rules); shoe = playerSecond.shoe;
      const dealerCards = [dealerUp.card];
      if (current.rules.holeCardRule === "peek") {
        const dealerHole = drawOne(shoe, current.rules); shoe = dealerHole.shoe;
        dealerCards.push(dealerHole.card);
      }

      const cardsDrawn = current.rules.holeCardRule === "peek" ? 4 : 3;
      const hand: PlayerHand = {
        id: `round-${current.roundNumber + 1}-hand-1`,
        cards: [playerFirst.card, playerSecond.card],
        wager,
        status: evaluateHand([playerFirst.card, playerSecond.card]).blackjack ? "blackjack" : "playing",
        fromSplit: false,
        splitAces: false,
        doubled: false,
      };
      let next: SimulationSession = {
        ...current,
        shoe,
        shoeNumber,
        cardsDealt: cardsDealt + cardsDrawn,
        bankroll: current.bankroll - wager,
        roundStartingBankroll: current.bankroll,
        roundNumber: current.roundNumber + 1,
        roundNet: 0,
        phase: "player",
        hands: [hand],
        activeHandIndex: 0,
        dealerCards,
        dealerHoleRevealed: false,
        dealerNaturalCheckOnly: false,
        insuranceBet: 0,
        lastDecision: null,
        log: appendLog(log, `Round ${current.roundNumber + 1}: ${formatMoney(wager)} wagered. You receive ${cardName(playerFirst.card)} and ${cardName(playerSecond.card)}. Dealer shows ${cardName(dealerUp.card)}.`),
      };

      const dealerShowsAce = normalizeRank(dealerUp.card.rank) === "A";
      if (dealerShowsAce && current.rules.insurance) return { ...next, phase: "insurance" };

      if (current.rules.holeCardRule === "peek") {
        const dealerBlackjack = evaluateHand(dealerCards).blackjack;
        const dealerCanPeek = dealerShowsAce || normalizeRank(dealerUp.card.rank) === "10";
        if (dealerCanPeek && dealerBlackjack) return settleRound({ ...next, dealerHoleRevealed: true, log: appendLog(next.log, "Dealer reveals blackjack.") });
        if (hand.status === "blackjack") return settleRound({ ...next, dealerHoleRevealed: true, log: appendLog(next.log, "Your opening hand is blackjack.") });
      } else if (hand.status === "blackjack") {
        next = { ...next, phase: "dealer", dealerNaturalCheckOnly: true, log: appendLog(next.log, "Dealer draws a second card to check your blackjack.") };
      }
      return next;
    });
  };

  const chooseInsurance = (takeInsurance: boolean) => {
    setSession((current) => {
      if (!current || current.phase !== "insurance") return current;
      const insuranceBet = current.hands[0].wager / 2;
      if (takeInsurance && insuranceBet > current.bankroll) return current;
      const correct = !takeInsurance;
      let next: SimulationSession = {
        ...current,
        bankroll: takeInsurance ? current.bankroll - insuranceBet : current.bankroll,
        insuranceBet: takeInsurance ? insuranceBet : 0,
        decisions: current.decisions + 1,
        correctDecisions: current.correctDecisions + (correct ? 1 : 0),
        lastDecision: {
          chosen: takeInsurance ? "insurance" : "decline-insurance",
          recommended: "decline-insurance",
          correct,
          message: correct ? "Correct. Basic strategy declines insurance." : "Insurance is a separate wager with a high house edge.",
        },
        log: appendLog(current.log, takeInsurance ? `Insurance placed for ${formatMoney(insuranceBet)}.` : "Insurance declined."),
      };

      if (current.rules.holeCardRule === "peek") {
        const dealerBlackjack = evaluateHand(current.dealerCards).blackjack;
        if (dealerBlackjack) return settleRound({ ...next, dealerHoleRevealed: true, log: appendLog(next.log, "Dealer reveals blackjack.") });
        if (current.hands[0].status === "blackjack") return settleRound({ ...next, dealerHoleRevealed: true, log: appendLog(next.log, "Dealer has no blackjack. Your blackjack is paid.") });
        next = { ...next, phase: "player", log: appendLog(next.log, "Dealer does not have blackjack. Play continues.") };
      } else {
        next = current.hands[0].status === "blackjack"
          ? { ...next, phase: "dealer", dealerNaturalCheckOnly: true }
          : { ...next, phase: "player" };
      }
      return next;
    });
  };

  const playAction = (action: BlackjackAction) => {
    setSession((current) => {
      if (!current || current.phase !== "player") return current;
      const hand = current.hands[current.activeHandIndex];
      if (!hand || hand.status !== "playing") return current;
      const availability = availabilityFor(current, hand);
      if (action === "hit" && hand.splitAces && !current.rules.hitSplitAces) return current;
      if ((action === "double" && !availability.canDouble)
        || (action === "split" && !availability.canSplit)
        || (action === "surrender" && !availability.canSurrender)) return current;

      const dealerUpcard = current.dealerCards[0];
      const recommendation = recommendedPlay(hand.cards, dealerUpcard, availability);
      const correct = action === recommendation.action;
      const feedback: DecisionFeedback = {
        chosen: action,
        recommended: recommendation.action,
        correct,
        message: correct
          ? `Correct strategy: ${actionLabels[action]}.`
          : `Basic strategy recommends ${actionLabels[recommendation.action]}. Your ${actionLabels[action].toLowerCase()} still plays out.`,
      };
      let next: SimulationSession = {
        ...current,
        decisions: current.decisions + 1,
        correctDecisions: current.correctDecisions + (correct ? 1 : 0),
        lastDecision: feedback,
        log: appendLog(current.log, `Hand ${current.activeHandIndex + 1}: ${actionLabels[action]}. ${feedback.message}`),
      };
      let hands = current.hands.map((candidate) => ({ ...candidate, cards: [...candidate.cards] }));
      const active = hands[current.activeHandIndex];

      if (action === "hit") {
        const draw = drawOne(current.shoe, current.rules);
        active.cards.push(draw.card);
        const value = evaluateHand(active.cards);
        next = { ...next, shoe: draw.shoe, cardsDealt: current.cardsDealt + 1, log: appendLog(next.log, `You draw ${cardName(draw.card)}. Hand ${current.activeHandIndex + 1} is ${value.total}.`) };
        if (value.bust) {
          active.status = "bust";
          return moveToNextHand(next, hands, current.activeHandIndex);
        }
        if (value.total === 21) {
          active.status = "stood";
          return moveToNextHand(next, hands, current.activeHandIndex);
        }
        return { ...next, hands };
      }

      if (action === "stand") {
        active.status = "stood";
        return moveToNextHand(next, hands, current.activeHandIndex);
      }

      if (action === "double") {
        const draw = drawOne(current.shoe, current.rules);
        active.cards.push(draw.card);
        active.wager *= 2;
        active.doubled = true;
        active.status = evaluateHand(active.cards).bust ? "bust" : "stood";
        next = {
          ...next,
          bankroll: current.bankroll - (active.wager / 2),
          shoe: draw.shoe,
          cardsDealt: current.cardsDealt + 1,
          log: appendLog(next.log, `Double card: ${cardName(draw.card)}. Hand ${current.activeHandIndex + 1} finishes at ${evaluateHand(active.cards).total}.`),
        };
        return moveToNextHand(next, hands, current.activeHandIndex);
      }

      if (action === "surrender") {
        active.status = "surrender";
        active.resultLabel = "Half the wager returned";
        next = { ...next, bankroll: current.bankroll + active.wager / 2 };
        return moveToNextHand(next, hands, current.activeHandIndex);
      }

      const originalCardOne = active.cards[0];
      const originalCardTwo = active.cards[1];
      const firstDraw = drawOne(current.shoe, current.rules);
      const secondDraw = drawOne(firstDraw.shoe, current.rules);
      const splitAces = originalCardOne.rank === "A" && originalCardTwo.rank === "A";
      const firstCanResplitAces = splitAces
        && firstDraw.card.rank === "A"
        && current.rules.resplitAces
        && hands.length + 1 <= current.rules.maxSplitHands;
      const secondCanResplitAces = splitAces
        && secondDraw.card.rank === "A"
        && current.rules.resplitAces
        && hands.length + 1 <= current.rules.maxSplitHands;
      const firstHand: PlayerHand = {
        ...active,
        id: `${active.id}-a`,
        cards: [originalCardOne, firstDraw.card],
        status: splitAces && !current.rules.hitSplitAces && !firstCanResplitAces ? "stood" : "playing",
        fromSplit: true,
        splitAces,
      };
      const secondHand: PlayerHand = {
        ...active,
        id: `${active.id}-b`,
        cards: [originalCardTwo, secondDraw.card],
        status: splitAces && !current.rules.hitSplitAces && !secondCanResplitAces ? "stood" : "playing",
        fromSplit: true,
        splitAces,
      };
      hands = [...hands.slice(0, current.activeHandIndex), firstHand, secondHand, ...hands.slice(current.activeHandIndex + 1)];
      next = {
        ...next,
        bankroll: current.bankroll - active.wager,
        shoe: secondDraw.shoe,
        cardsDealt: current.cardsDealt + 2,
        hands,
        log: appendLog(next.log, `Pair split. New cards are ${cardName(firstDraw.card)} and ${cardName(secondDraw.card)}.`),
      };
      if (firstHand.status === "playing") return { ...next, activeHandIndex: current.activeHandIndex };
      if (secondHand.status === "playing") return { ...next, activeHandIndex: current.activeHandIndex + 1 };
      return moveToNextHand(next, hands, current.activeHandIndex + 1);
    });
  };

  useEffect(() => {
    if (!session || session.phase !== "dealer") return;
    const delay = reduceMotion ? 120 : 650;
    const timer = window.setTimeout(() => {
      setSession((current) => {
        if (!current || current.phase !== "dealer") return current;
        let next = current;
        if (current.rules.holeCardRule === "no-hole-card" && current.dealerCards.length === 1) {
          const draw = drawOne(current.shoe, current.rules);
          next = {
            ...current,
            shoe: draw.shoe,
            cardsDealt: current.cardsDealt + 1,
            dealerCards: [...current.dealerCards, draw.card],
            dealerHoleRevealed: true,
            log: appendLog(current.log, `Dealer draws the second card: ${cardName(draw.card)}.`),
          };
          if (evaluateHand(next.dealerCards).blackjack || next.dealerNaturalCheckOnly) return settleRound(next);
          return next;
        }
        if (!current.dealerHoleRevealed) {
          return {
            ...current,
            dealerHoleRevealed: true,
            log: appendLog(current.log, `Dealer reveals ${cardName(current.dealerCards[1])}.`),
          };
        }
        if (current.dealerNaturalCheckOnly) return settleRound(current);
        if (dealerShouldHit(current.dealerCards, current.rules.dealerHitsSoft17)) {
          const draw = drawOne(current.shoe, current.rules);
          const dealerCards = [...current.dealerCards, draw.card];
          const value = evaluateHand(dealerCards);
          return {
            ...current,
            shoe: draw.shoe,
            cardsDealt: current.cardsDealt + 1,
            dealerCards,
            log: appendLog(current.log, `Dealer hits and draws ${cardName(draw.card)}. Dealer total is ${value.total}${value.bust ? ", bust" : ""}.`),
          };
        }
        return settleRound({ ...current, log: appendLog(current.log, `Dealer stands on ${evaluateHand(current.dealerCards).total}.`) });
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, session]);

  const nextRound = () => {
    setSession((current) => {
      if (!current || current.phase !== "settled") return current;
      const pendingWager = clampWager(current.pendingWager, current.bankroll, current.rules);
      return {
        ...current,
        phase: "betting",
        pendingWager,
        hands: [],
        dealerCards: [],
        dealerHoleRevealed: false,
        dealerNaturalCheckOnly: false,
        insuranceBet: 0,
        roundNet: 0,
        lastDecision: null,
        log: appendLog(current.log, current.bankroll >= current.rules.minimumBet ? "Place the next wager." : "Bankroll is below the table minimum."),
      };
    });
  };

  const resetBankroll = () => {
    if (!session) return;
    setSession(createSession(session.rules));
  };

  const renderSetup = () => (
    <motion.div
      className={styles.setup}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header className={styles.setupHeader}>
        <button type="button" className={styles.backButton} onClick={onExit}><ArrowLeft size={17} weight="bold" /> Modes</button>
        <div><span>Bankroll Game</span><strong>Configure the table</strong></div>
      </header>
      <div className={styles.setupBody}>
        <div className={styles.setupIntro}>
          <GearSix size={34} weight="thin" aria-hidden="true" />
          <h2>Match the table you play</h2>
          <p>Start with a preset, then tune the shoe, dealer rules, player options, and betting limits.</p>
        </div>

        <div className={styles.presets} aria-label="Table presets">
          {simulationPresets.map((preset) => (
            <button type="button" key={preset.id} onClick={() => setRules({ ...defaultSimulationRules, ...preset.rules })}>
              <strong>{preset.name}</strong><span>{preset.description}</span>
            </button>
          ))}
        </div>

        <div className={styles.ruleGroups}>
          <fieldset>
            <legend>Shoe and shuffle</legend>
            <label>Decks<select value={rules.deckCount} onChange={(event) => updateRule("deckCount", Number(event.target.value) as SimulationRules["deckCount"])}>{[1, 2, 4, 6, 8].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Shuffle mechanism<select value={rules.shuffleMode} onChange={(event) => updateRule("shuffleMode", event.target.value as ShuffleMode)}><option value="cut-card">Cut card penetration</option><option value="every-round">Fresh shoe every round</option><option value="continuous">Continuous shuffler</option></select></label>
            <label>Cards dealt before shuffle<select value={rules.penetration} disabled={rules.shuffleMode !== "cut-card"} onChange={(event) => updateRule("penetration", Number(event.target.value) as SimulationRules["penetration"])}>{[50, 60, 65, 70, 75, 80].map((value) => <option key={value} value={value}>{value}%</option>)}</select></label>
          </fieldset>

          <fieldset>
            <legend>Dealer and payouts</legend>
            <label>Soft 17<select value={rules.dealerHitsSoft17 ? "hit" : "stand"} onChange={(event) => updateRule("dealerHitsSoft17", event.target.value === "hit")}><option value="stand">Dealer stands</option><option value="hit">Dealer hits</option></select></label>
            <label>Hole card<select value={rules.holeCardRule} onChange={(event) => updateRule("holeCardRule", event.target.value as HoleCardRule)}><option value="peek">US hole card and peek</option><option value="no-hole-card">European no-hole-card</option></select></label>
            <label>Blackjack payout<select value={rules.blackjackPayout} onChange={(event) => updateRule("blackjackPayout", Number(event.target.value) as SimulationRules["blackjackPayout"])}><option value={1.5}>3:2</option><option value={1.2}>6:5</option></select></label>
            <label className={styles.toggleLabel}><input type="checkbox" checked={rules.insurance} onChange={(event) => updateRule("insurance", event.target.checked)} /><span>Offer insurance against dealer Ace</span></label>
          </fieldset>

          <fieldset>
            <legend>Double, split, surrender</legend>
            <label>Double allowed<select value={rules.doubleRule} onChange={(event) => updateRule("doubleRule", event.target.value as DoubleRule)}><option value="any-two">Any first two cards</option><option value="nine-eleven">Totals 9-11</option><option value="ten-eleven">Totals 10-11</option></select></label>
            <label>Maximum split hands<select value={rules.maxSplitHands} onChange={(event) => updateRule("maxSplitHands", Number(event.target.value) as SimulationRules["maxSplitHands"])}>{[2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Ten-value split rule<select value={rules.tenSplitRule} onChange={(event) => updateRule("tenSplitRule", event.target.value as TenSplitRule)}><option value="same-rank">Exact rank only</option><option value="same-value">Any ten-value cards</option></select></label>
            <label>Surrender<select value={rules.surrender} onChange={(event) => updateRule("surrender", event.target.value as SurrenderRule)}><option value="late">Late surrender</option><option value="none">Not offered</option></select></label>
            <div className={styles.toggleStack}>
              <label className={styles.toggleLabel}><input type="checkbox" checked={rules.doubleAfterSplit} onChange={(event) => updateRule("doubleAfterSplit", event.target.checked)} /><span>Double after split</span></label>
              <label className={styles.toggleLabel}><input type="checkbox" checked={rules.resplitAces} onChange={(event) => updateRule("resplitAces", event.target.checked)} /><span>Resplit Aces</span></label>
              <label className={styles.toggleLabel}><input type="checkbox" checked={rules.hitSplitAces} onChange={(event) => updateRule("hitSplitAces", event.target.checked)} /><span>Hit split Aces</span></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Bankroll and betting</legend>
            <label>Starting bankroll<input type="number" min="1" step="25" value={rules.startingBankroll} onChange={(event) => updateRule("startingBankroll", Number(event.target.value))} /></label>
            <label>Betting style<select value={rules.bettingStyle} onChange={(event) => updateRule("bettingStyle", event.target.value as BettingStyle)}><option value="table-limits">Choose each wager</option><option value="flat-bet">Use one flat bet</option></select></label>
            <div className={styles.inlineFields}>
              <label>Minimum<input type="number" min="1" step="1" value={rules.minimumBet} onChange={(event) => updateRule("minimumBet", Number(event.target.value))} /></label>
              <label>Maximum<input type="number" min="1" step="5" value={rules.maximumBet} onChange={(event) => updateRule("maximumBet", Number(event.target.value))} /></label>
            </div>
            {rules.bettingStyle === "table-limits" ? (
              <label>Chip increment<input type="number" min="1" step="1" value={rules.chipSize} onChange={(event) => updateRule("chipSize", Number(event.target.value))} /></label>
            ) : (
              <label>Flat bet<input type="number" min="1" step="1" value={rules.flatBet} onChange={(event) => updateRule("flatBet", Number(event.target.value))} /></label>
            )}
          </fieldset>
        </div>

        {setupError && <p className={styles.setupError} role="alert">{setupError}</p>}
        <div className={styles.startRow}>
          <p><ShieldCheck size={19} weight="duotone" /> All configured rules are enforced during dealing and settlement.</p>
          <button type="button" className={styles.startButton} onClick={startGame}>Enter table <CardsThree size={20} weight="duotone" /></button>
        </div>
      </div>
    </motion.div>
  );

  const renderTable = () => {
    if (!session) return null;
    const activeHand = session.hands[session.activeHandIndex];
    const availability = activeHand && session.phase === "player" ? availabilityFor(session, activeHand) : null;
    const dealerValue = evaluateHand(session.dealerCards);
    const accuracy = session.decisions === 0 ? 0 : Math.round((session.correctDecisions / session.decisions) * 100);
    const atRisk = session.phase === "settled" || session.phase === "betting"
      ? 0
      : session.hands
        .filter((hand) => hand.status !== "bust" && hand.status !== "surrender")
        .reduce((sum, hand) => sum + hand.wager, 0) + session.insuranceBet;
    const wagerStep = session.rules.chipSize;

    return (
      <motion.div className={styles.tableView} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
        <header className={styles.tableHeader}>
          <div className={styles.tableIdentity}>
            <button type="button" className={styles.backButton} onClick={() => setView("setup")}><ArrowLeft size={17} weight="bold" /> Rules</button>
            <div><span>Bankroll Game</span><strong>Round {Math.max(1, session.roundNumber)} / Shoe {session.shoeNumber}</strong></div>
          </div>
          <dl className={styles.stats}>
            <div><dt>Bankroll</dt><dd>{formatMoney(session.bankroll)}</dd></div>
            <div><dt>At risk</dt><dd>{formatMoney(atRisk)}</dd></div>
            <div><dt>Strategy</dt><dd>{accuracy}%</dd></div>
            <div><dt>Shoe</dt><dd>{session.shoe.length} cards</dd></div>
          </dl>
        </header>

        <div className={styles.gameLayout}>
          <div className={styles.felt}>
            <section className={styles.dealerArea} aria-label="Dealer hand">
              <div className={styles.handMeta}>
                <span>Dealer</span>
                <strong>{session.dealerCards.length === 0 ? "Waiting" : session.dealerHoleRevealed ? `${dealerValue.soft ? "Soft " : ""}${dealerValue.total}` : `Shows ${session.dealerCards[0].rank}`}</strong>
              </div>
              <div className={styles.cards}>
                {session.dealerCards.map((card, index) => (
                  <PlayingCard key={`${session.roundNumber}-${card.id}-${index}`} card={card} label={`Dealer card ${index + 1}`} concealed={index === 1 && !session.dealerHoleRevealed} />
                ))}
                {session.dealerCards.length === 0 && <div className={styles.cardPlaceholder}>Dealer</div>}
              </div>
            </section>

            <section className={styles.playerArea} aria-label="Player hands">
              {session.hands.length === 0 ? (
                <div className={styles.emptyHand}><div className={styles.cardPlaceholder}>Your cards</div><p>Set your wager and deal the round.</p></div>
              ) : (
                <div className={styles.handRail}>
                  {session.hands.map((hand, handIndex) => (
                    <article key={hand.id} className={`${styles.playerHand} ${handIndex === session.activeHandIndex && session.phase === "player" ? styles.activeHand : ""} ${["win", "loss", "push", "surrender"].includes(hand.status) ? styles.settledHand : ""}`}>
                      <div className={styles.handMeta}>
                        <span>Hand {handIndex + 1} / {formatMoney(hand.wager)}</span>
                        <strong>{hand.resultLabel ?? handLabel(hand)}</strong>
                      </div>
                      <div className={styles.cards}>
                        {hand.cards.map((card, cardIndex) => <PlayingCard key={`${session.roundNumber}-${hand.id}-${card.id}-${cardIndex}`} card={card} label={`Hand ${handIndex + 1}, card ${cardIndex + 1}`} />)}
                      </div>
                      {hand.doubled && <small>Doubled</small>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className={styles.controls}>
            {session.phase === "betting" && (
              <div className={styles.phasePanel}>
                <span className={styles.phaseLabel}>Place wager</span>
                <h3>{formatMoney(session.pendingWager)}</h3>
                <p>{session.rules.bettingStyle === "flat-bet" ? "This table uses the configured flat bet." : `${formatMoney(session.rules.minimumBet)} minimum, ${formatMoney(session.rules.maximumBet)} maximum.`}</p>
                {session.rules.bettingStyle === "table-limits" && (
                  <div className={styles.wagerControls}>
                    <button type="button" aria-label={`Decrease wager by ${formatMoney(wagerStep)}`} onClick={() => setSession((current) => current ? { ...current, pendingWager: clampWager(current.pendingWager - wagerStep, current.bankroll, current.rules) } : current)}>-</button>
                    <input aria-label="Wager amount" type="number" min={session.rules.minimumBet} max={Math.min(session.rules.maximumBet, session.bankroll)} step={wagerStep} value={session.pendingWager} onChange={(event) => setSession((current) => current ? { ...current, pendingWager: clampWager(Number(event.target.value), current.bankroll, current.rules) } : current)} />
                    <button type="button" aria-label={`Increase wager by ${formatMoney(wagerStep)}`} onClick={() => setSession((current) => current ? { ...current, pendingWager: clampWager(current.pendingWager + wagerStep, current.bankroll, current.rules) } : current)}>+</button>
                  </div>
                )}
                {session.bankroll >= session.rules.minimumBet ? (
                  <button type="button" className={styles.primaryButton} onClick={dealRound}>Deal {formatMoney(session.pendingWager)} <CardsThree size={19} weight="duotone" /></button>
                ) : (
                  <button type="button" className={styles.primaryButton} onClick={resetBankroll}>Restart bankroll <ArrowClockwise size={18} weight="bold" /></button>
                )}
              </div>
            )}

            {session.phase === "insurance" && (
              <div className={styles.phasePanel}>
                <span className={styles.phaseLabel}>Dealer shows Ace</span>
                <h3>Insurance?</h3>
                <p>Insurance costs {formatMoney(session.hands[0].wager / 2)} and pays 2:1 if the dealer has blackjack.</p>
                <div className={styles.twoButtons}>
                  <button type="button" disabled={session.bankroll < session.hands[0].wager / 2} onClick={() => chooseInsurance(true)}>Take insurance</button>
                  <button type="button" className={styles.primaryButton} onClick={() => chooseInsurance(false)}>No insurance</button>
                </div>
              </div>
            )}

            {session.phase === "player" && activeHand && availability && (
              <div className={styles.phasePanel}>
                <span className={styles.phaseLabel}>Hand {session.activeHandIndex + 1} to act</span>
                <h3>{handLabel(activeHand)}</h3>
                <p>Choose an action. The cards and bankroll follow your play even when it differs from basic strategy.</p>
                <div className={styles.actionGrid}>
                  {actions.map((action) => {
                    const available = action === "hit"
                      ? !activeHand.splitAces || session.rules.hitSplitAces
                      : action === "double"
                        ? availability.canDouble
                        : action === "split"
                          ? availability.canSplit
                          : action === "surrender"
                            ? availability.canSurrender
                            : true;
                    return <button type="button" key={action} disabled={!available} onClick={() => playAction(action)}>{actionLabels[action]}</button>;
                  })}
                </div>
              </div>
            )}

            {session.phase === "dealer" && (
              <div className={styles.phasePanel} aria-live="polite">
                <span className={styles.phaseLabel}>Dealer turn</span>
                <h3>Playing out the hand</h3>
                <p>The hole card is revealed first. Dealer hits arrive one card at a time under the configured soft 17 rule.</p>
                <div className={styles.dealingIndicator}><span /> Dealer is dealing</div>
              </div>
            )}

            {session.phase === "settled" && (
              <div className={styles.phasePanel}>
                <span className={styles.phaseLabel}>Round settled</span>
                <h3 className={session.roundNet >= 0 ? styles.positive : styles.negative}>{session.roundNet > 0 ? "+" : ""}{formatMoney(session.roundNet)}</h3>
                <p>Every hand, double, split wager, surrender, insurance bet, and blackjack payout is included.</p>
                {session.bankroll >= session.rules.minimumBet ? (
                  <button type="button" className={styles.primaryButton} onClick={nextRound}>Next round <ArrowClockwise size={18} weight="bold" /></button>
                ) : (
                  <button type="button" className={styles.primaryButton} onClick={resetBankroll}>Restart bankroll <ArrowClockwise size={18} weight="bold" /></button>
                )}
              </div>
            )}

            <AnimatePresence mode="wait">
              {session.lastDecision && (
                <motion.div key={`${session.decisions}-${session.lastDecision.chosen}`} className={`${styles.coachNote} ${session.lastDecision.correct ? styles.coachCorrect : styles.coachWrong}`} role="status" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {session.lastDecision.correct ? <CheckCircle size={21} weight="fill" /> : <XCircle size={21} weight="fill" />}
                  <p>{session.lastDecision.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.eventLog}>
              <div><strong>Table log</strong><span aria-live="polite">{session.log.length} events</span></div>
              <ol>{[...session.log].reverse().slice(0, 6).map((entry, index) => <li key={`${session.roundNumber}-${session.log.length - index}`}>{entry}</li>)}</ol>
            </div>
          </aside>
        </div>
      </motion.div>
    );
  };

  return (
    <section ref={simulatorRef} className={styles.simulator} aria-label="Configurable blackjack game simulator">
      <AnimatePresence mode="wait" initial={false}>
        <div key={view}>{view === "setup" ? renderSetup() : renderTable()}</div>
      </AnimatePresence>
    </section>
  );
}
