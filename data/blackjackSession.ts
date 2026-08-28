import type { ActionAvailability, BlackjackAction } from "./blackjackStrategy.ts";
import {
  canSplitCards,
  clampWager,
  createShuffledShoe,
  doubleAllowedForTotal,
  evaluateHand,
  type ShoeCard,
  type ShoeSuit,
  type SimulationRules,
} from "./blackjackSimulation.ts";

export type GamePhase = "betting" | "insurance" | "player" | "dealer" | "settled";
export type HandStatus = "playing" | "stood" | "bust" | "surrender" | "blackjack" | "win" | "loss" | "push";

export type PlayerHand = {
  id: string;
  cards: ShoeCard[];
  wager: number;
  status: HandStatus;
  fromSplit: boolean;
  splitAces: boolean;
  doubled: boolean;
  resultLabel?: string;
};

export type DecisionFeedback = {
  chosen: BlackjackAction | "insurance" | "decline-insurance";
  recommended: BlackjackAction | "decline-insurance";
  correct: boolean;
  message: string;
};

export type SimulationSession = {
  rules: SimulationRules;
  shoe: ShoeCard[];
  shoeNumber: number;
  cardsDealt: number;
  bankroll: number;
  pendingWager: number;
  roundNumber: number;
  roundStartingBankroll: number;
  roundNet: number;
  phase: GamePhase;
  hands: PlayerHand[];
  activeHandIndex: number;
  dealerCards: ShoeCard[];
  dealerHoleRevealed: boolean;
  dealerNaturalCheckOnly: boolean;
  insuranceBet: number;
  decisions: number;
  correctDecisions: number;
  lastDecision: DecisionFeedback | null;
  log: string[];
};

export const blackjackSuitGlyphs: Record<ShoeSuit, string> = {
  clubs: "♣︎",
  diamonds: "♦︎",
  hearts: "♥︎",
  spades: "♠︎",
};

export function formatBlackjackMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function blackjackCardName(card: ShoeCard) {
  return `${card.rank}${blackjackSuitGlyphs[card.suit]}`;
}

export function blackjackHandLabel(hand: PlayerHand) {
  const value = evaluateHand(hand.cards);
  if (hand.status === "blackjack") return "Blackjack";
  if (value.bust) return `Bust ${value.total}`;
  return `${value.soft ? "Soft " : ""}${value.total}`;
}

export function validateSimulationRules(rules: SimulationRules) {
  if (rules.minimumBet <= 0) return "The minimum bet must be greater than zero.";
  if (rules.maximumBet < rules.minimumBet) return "The maximum bet must be at least the minimum bet.";
  if (rules.startingBankroll < rules.minimumBet) return "The starting bankroll must cover at least one minimum bet.";
  if (rules.chipSize <= 0) return "The chip size must be greater than zero.";
  if (rules.flatBet < rules.minimumBet || rules.flatBet > rules.maximumBet) {
    return "The flat bet must stay inside the table limits.";
  }
  return "";
}

export function drawSimulationCard(shoe: ShoeCard[], rules: SimulationRules) {
  const source = shoe.length > 0 ? [...shoe] : createShuffledShoe(rules.deckCount);
  const card = source.shift();
  if (!card) throw new Error("Unable to draw from the blackjack shoe.");
  return { card, shoe: source };
}

export function appendSimulationLog(log: readonly string[], message: string) {
  return [...log, message].slice(-12);
}

export function settleSimulationRound(session: SimulationSession): SimulationSession {
  const dealerValue = evaluateHand(session.dealerCards);
  const dealerBlackjack = dealerValue.blackjack;
  let bankroll = session.bankroll;

  if (session.insuranceBet > 0 && dealerBlackjack) bankroll += session.insuranceBet * 3;

  const hands = session.hands.map((hand) => {
    const value = evaluateHand(hand.cards);
    if (hand.status === "surrender") return hand;
    if (hand.status === "bust") return { ...hand, status: "loss" as const, resultLabel: "Bust" };
    if (hand.status === "blackjack") {
      if (dealerBlackjack) {
        bankroll += hand.wager;
        return { ...hand, status: "push" as const, resultLabel: "Blackjack push" };
      }
      bankroll += hand.wager * (1 + session.rules.blackjackPayout);
      return {
        ...hand,
        status: "win" as const,
        resultLabel: `Blackjack pays ${session.rules.blackjackPayout === 1.5 ? "3:2" : "6:5"}`,
      };
    }
    if (dealerBlackjack) return { ...hand, status: "loss" as const, resultLabel: "Dealer blackjack" };
    if (dealerValue.bust || value.total > dealerValue.total) {
      bankroll += hand.wager * 2;
      return {
        ...hand,
        status: "win" as const,
        resultLabel: dealerValue.bust ? "Dealer bust" : "Higher total",
      };
    }
    if (value.total === dealerValue.total) {
      bankroll += hand.wager;
      return { ...hand, status: "push" as const, resultLabel: "Push" };
    }
    return { ...hand, status: "loss" as const, resultLabel: "Dealer wins" };
  });

  const roundNet = bankroll - session.roundStartingBankroll;
  const resultMessage = roundNet > 0
    ? `Round complete. You won ${formatBlackjackMoney(roundNet)}.`
    : roundNet < 0
      ? `Round complete. You lost ${formatBlackjackMoney(Math.abs(roundNet))}.`
      : "Round complete. Your bankroll is unchanged.";

  return {
    ...session,
    bankroll,
    hands,
    phase: "settled",
    dealerHoleRevealed: true,
    roundNet,
    log: appendSimulationLog(session.log, resultMessage),
  };
}

export function moveToNextSimulationHand(
  session: SimulationSession,
  hands: PlayerHand[],
  completedIndex: number,
): SimulationSession {
  const nextIndex = hands.findIndex((hand, index) => index > completedIndex && hand.status === "playing");
  if (nextIndex >= 0) return { ...session, hands, activeHandIndex: nextIndex };

  const hasComparableHand = hands.some((hand) => hand.status === "stood" || hand.status === "blackjack");
  return {
    ...session,
    hands,
    phase: "dealer",
    dealerNaturalCheckOnly: !hasComparableHand,
    log: appendSimulationLog(
      session.log,
      hasComparableHand ? "Dealer begins the draw." : "Dealer turn begins.",
    ),
  };
}

export function createSimulationSession(rules: SimulationRules): SimulationSession {
  const firstWager = clampWager(
    rules.bettingStyle === "flat-bet" ? rules.flatBet : Math.max(rules.minimumBet, 25),
    rules.startingBankroll,
    rules,
  );
  return {
    rules,
    shoe: createShuffledShoe(rules.deckCount),
    shoeNumber: 1,
    cardsDealt: 0,
    bankroll: rules.startingBankroll,
    pendingWager: firstWager,
    roundNumber: 0,
    roundStartingBankroll: rules.startingBankroll,
    roundNet: 0,
    phase: "betting",
    hands: [],
    activeHandIndex: 0,
    dealerCards: [],
    dealerHoleRevealed: false,
    dealerNaturalCheckOnly: false,
    insuranceBet: 0,
    decisions: 0,
    correctDecisions: 0,
    lastDecision: null,
    log: ["Shoe shuffled. Place a wager to begin."],
  };
}

export function actionAvailability(
  session: SimulationSession,
  hand: PlayerHand,
): ActionAvailability {
  const value = evaluateHand(hand.cards);
  const canAfford = session.bankroll >= hand.wager;
  const isSplitAce = hand.cards[0]?.rank === "A";
  return {
    canDouble: hand.cards.length === 2
      && canAfford
      && doubleAllowedForTotal(value.total, session.rules.doubleRule)
      && (!hand.fromSplit || session.rules.doubleAfterSplit)
      && (!hand.splitAces || session.rules.hitSplitAces),
    canSplit: canAfford
      && canSplitCards(hand.cards, session.rules.tenSplitRule)
      && session.hands.length < session.rules.maxSplitHands
      && (!hand.fromSplit || !isSplitAce || session.rules.resplitAces),
    canSurrender: session.rules.surrender === "late" && hand.cards.length === 2 && !hand.fromSplit,
  };
}
