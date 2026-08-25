import {
  dealerUpcards,
  hardStrategy,
  pairStrategy,
  resolveStrategyAction,
  softStrategy,
  type ActionAvailability,
  type BlackjackAction,
  type CardRank,
  type DealerUpcard,
  type StrategyCode,
} from "./blackjackStrategy.ts";

export const shoeRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"] as const;
export const shoeSuits = ["spades", "hearts", "clubs", "diamonds"] as const;

export type ShoeRank = (typeof shoeRanks)[number];
export type ShoeSuit = (typeof shoeSuits)[number];

export type ShoeCard = {
  id: string;
  rank: ShoeRank;
  suit: ShoeSuit;
};

export type ShuffleMode = "cut-card" | "every-round" | "continuous";
export type HoleCardRule = "peek" | "no-hole-card";
export type DoubleRule = "any-two" | "nine-eleven" | "ten-eleven";
export type SurrenderRule = "none" | "late";
export type BettingStyle = "table-limits" | "flat-bet";
export type TenSplitRule = "same-rank" | "same-value";

export type SimulationRules = {
  deckCount: 1 | 2 | 4 | 6 | 8;
  shuffleMode: ShuffleMode;
  penetration: 50 | 60 | 65 | 70 | 75 | 80;
  dealerHitsSoft17: boolean;
  holeCardRule: HoleCardRule;
  blackjackPayout: 1.5 | 1.2;
  doubleRule: DoubleRule;
  doubleAfterSplit: boolean;
  maxSplitHands: 2 | 3 | 4;
  resplitAces: boolean;
  hitSplitAces: boolean;
  tenSplitRule: TenSplitRule;
  surrender: SurrenderRule;
  insurance: boolean;
  startingBankroll: number;
  bettingStyle: BettingStyle;
  minimumBet: number;
  maximumBet: number;
  chipSize: number;
  flatBet: number;
};

export const defaultSimulationRules: SimulationRules = {
  deckCount: 6,
  shuffleMode: "cut-card",
  penetration: 75,
  dealerHitsSoft17: false,
  holeCardRule: "peek",
  blackjackPayout: 1.5,
  doubleRule: "any-two",
  doubleAfterSplit: true,
  maxSplitHands: 4,
  resplitAces: false,
  hitSplitAces: false,
  tenSplitRule: "same-rank",
  surrender: "late",
  insurance: true,
  startingBankroll: 500,
  bettingStyle: "table-limits",
  minimumBet: 5,
  maximumBet: 250,
  chipSize: 5,
  flatBet: 25,
};

export type SimulationPreset = {
  id: "vegas-s17" | "vegas-h17" | "single-deck" | "digital-rng";
  name: string;
  description: string;
  rules: Partial<SimulationRules>;
};

export const simulationPresets: readonly SimulationPreset[] = [
  {
    id: "vegas-s17",
    name: "Vegas S17 shoe",
    description: "Six decks, dealer stands on soft 17, 3:2 blackjack, late surrender, cut card at 75%.",
    rules: defaultSimulationRules,
  },
  {
    id: "vegas-h17",
    name: "Vegas H17 shoe",
    description: "Six decks, dealer hits soft 17, 3:2 blackjack, no surrender, cut card at 75%.",
    rules: {
      ...defaultSimulationRules,
      dealerHitsSoft17: true,
      surrender: "none",
    },
  },
  {
    id: "single-deck",
    name: "Single-deck table",
    description: "One deck, dealer hits soft 17, 3:2 blackjack, double only on 10 or 11.",
    rules: {
      ...defaultSimulationRules,
      deckCount: 1,
      penetration: 65,
      dealerHitsSoft17: true,
      doubleRule: "ten-eleven",
      doubleAfterSplit: false,
      surrender: "none",
      maxSplitHands: 3,
    },
  },
  {
    id: "digital-rng",
    name: "Digital RNG",
    description: "Eight decks reshuffled after every round, dealer hits soft 17, 6:5 blackjack.",
    rules: {
      ...defaultSimulationRules,
      deckCount: 8,
      shuffleMode: "every-round",
      dealerHitsSoft17: true,
      blackjackPayout: 1.2,
      surrender: "none",
    },
  },
] as const;

export type HandValue = {
  total: number;
  soft: boolean;
  blackjack: boolean;
  bust: boolean;
};

export type RecommendedPlay = {
  action: BlackjackAction;
  code: StrategyCode;
};

export function normalizeRank(rank: ShoeRank): CardRank {
  return rank === "J" || rank === "Q" || rank === "K" ? "10" : rank;
}

export function cardPointValue(rank: ShoeRank): number {
  const normalized = normalizeRank(rank);
  if (normalized === "A") return 11;
  return Number(normalized);
}

export function evaluateHand(cards: readonly ShoeCard[]): HandValue {
  let total = cards.reduce((sum, card) => sum + cardPointValue(card.rank), 0);
  let acesAtEleven = cards.filter((card) => card.rank === "A").length;

  while (total > 21 && acesAtEleven > 0) {
    total -= 10;
    acesAtEleven -= 1;
  }

  return {
    total,
    soft: acesAtEleven > 0,
    blackjack: cards.length === 2 && total === 21,
    bust: total > 21,
  };
}

export function canSplitCards(cards: readonly ShoeCard[], tenSplitRule: TenSplitRule): boolean {
  if (cards.length !== 2) return false;
  if (cards[0].rank === cards[1].rank) return true;
  return tenSplitRule === "same-value"
    && normalizeRank(cards[0].rank) === "10"
    && normalizeRank(cards[1].rank) === "10";
}

export function doubleAllowedForTotal(total: number, rule: DoubleRule): boolean {
  if (rule === "any-two") return true;
  if (rule === "nine-eleven") return total >= 9 && total <= 11;
  return total >= 10 && total <= 11;
}

function strategyCodeForHand(cards: readonly ShoeCard[], dealerUpcard: ShoeCard): StrategyCode {
  const dealerIndex = dealerUpcards.indexOf(normalizeRank(dealerUpcard.rank) as DealerUpcard);
  const value = evaluateHand(cards);

  if (cards.length === 2 && normalizeRank(cards[0].rank) === normalizeRank(cards[1].rank)) {
    const rank = normalizeRank(cards[0].rank);
    const pairRow = pairStrategy[`${rank},${rank}`];
    if (pairRow) return pairRow[dealerIndex];
  }

  if (value.soft && value.total >= 13 && value.total <= 20) {
    const otherValue = value.total - 11;
    const softRow = softStrategy[`A,${otherValue}`];
    if (softRow) return softRow[dealerIndex];
  }

  if (value.total <= 8) return "H";
  if (value.total >= 17) return "S";
  return hardStrategy[value.total]?.[dealerIndex] ?? "H";
}

export function recommendedPlay(
  cards: readonly ShoeCard[],
  dealerUpcard: ShoeCard,
  availability: ActionAvailability,
): RecommendedPlay {
  const initialCode = strategyCodeForHand(cards, dealerUpcard);
  let action = resolveStrategyAction(initialCode, availability);

  if (initialCode === "P" && !availability.canSplit) {
    const noPairCode = (() => {
      const value = evaluateHand(cards);
      const dealerIndex = dealerUpcards.indexOf(normalizeRank(dealerUpcard.rank) as DealerUpcard);
      if (value.soft) {
        const softRow = softStrategy[`A,${value.total - 11}`];
        if (softRow) return softRow[dealerIndex];
        if (value.total <= 17) return "H";
      }
      if (value.total <= 8) return "H";
      if (value.total >= 17) return "S";
      return hardStrategy[value.total]?.[dealerIndex] ?? "H";
    })();
    action = resolveStrategyAction(noPairCode, availability);
    return { action, code: noPairCode };
  }

  return { action, code: initialCode };
}

export function dealerShouldHit(cards: readonly ShoeCard[], dealerHitsSoft17: boolean): boolean {
  const value = evaluateHand(cards);
  if (value.bust) return false;
  if (value.total < 17) return true;
  return value.total === 17 && value.soft && dealerHitsSoft17;
}

export function createShuffledShoe(
  deckCount: SimulationRules["deckCount"],
  random: () => number = Math.random,
): ShoeCard[] {
  const cards: ShoeCard[] = [];
  for (let deck = 0; deck < deckCount; deck += 1) {
    for (const suit of shoeSuits) {
      for (const rank of shoeRanks) {
        cards.push({ id: `${deck}-${suit}-${rank}`, rank, suit });
      }
    }
  }

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
  }
  return cards;
}

export function shouldShuffleBeforeRound({
  rules,
  cardsRemaining,
  cardsDealt,
}: {
  rules: SimulationRules;
  cardsRemaining: number;
  cardsDealt: number;
}): boolean {
  if (rules.shuffleMode === "every-round" || rules.shuffleMode === "continuous") return true;
  const totalCards = rules.deckCount * 52;
  return cardsRemaining < 24 || cardsDealt / totalCards >= rules.penetration / 100;
}

export function clampWager(wager: number, bankroll: number, rules: SimulationRules): number {
  const upperBound = Math.min(rules.maximumBet, bankroll);
  if (upperBound <= 0) return 0;
  if (rules.bettingStyle === "flat-bet") return Math.min(rules.flatBet, upperBound);
  const rounded = Math.floor(wager / rules.chipSize) * rules.chipSize;
  return Math.max(Math.min(rules.minimumBet, upperBound), Math.min(rounded, upperBound));
}
