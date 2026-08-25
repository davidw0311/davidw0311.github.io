import assert from "node:assert/strict";
import test from "node:test";
import {
  canSplitCards,
  clampWager,
  createShuffledShoe,
  dealerShouldHit,
  defaultSimulationRules,
  doubleAllowedForTotal,
  evaluateHand,
  recommendedPlay,
  shouldShuffleBeforeRound,
  type ShoeCard,
} from "../data/blackjackSimulation.ts";

function card(rank: ShoeCard["rank"], id: string): ShoeCard {
  return { id, rank, suit: "spades" };
}

const allActions = { canDouble: true, canSplit: true, canSurrender: true };

test("builds a complete shuffled shoe for every configured deck", () => {
  const shoe = createShuffledShoe(6, () => 0.42);
  assert.equal(shoe.length, 312);
  assert.equal(new Set(shoe.map((entry) => entry.id)).size, 312);
  assert.equal(shoe.filter((entry) => entry.rank === "A").length, 24);
  assert.equal(shoe.filter((entry) => entry.rank === "K").length, 24);
});

test("evaluates hard totals, soft totals, blackjack, and multi-Ace hands", () => {
  assert.deepEqual(evaluateHand([card("A", "a"), card("K", "k")]), {
    total: 21,
    soft: true,
    blackjack: true,
    bust: false,
  });
  assert.deepEqual(evaluateHand([card("A", "a1"), card("A", "a2"), card("9", "9")]), {
    total: 21,
    soft: true,
    blackjack: false,
    bust: false,
  });
  assert.equal(evaluateHand([card("K", "k"), card("8", "8"), card("6", "6")]).bust, true);
});

test("enforces dealer soft 17 rules", () => {
  const soft17 = [card("A", "a"), card("6", "6")];
  const hard17 = [card("10", "10"), card("7", "7")];
  assert.equal(dealerShouldHit(soft17, false), false);
  assert.equal(dealerShouldHit(soft17, true), true);
  assert.equal(dealerShouldHit(hard17, true), false);
  assert.equal(dealerShouldHit([card("10", "10"), card("6", "6")], false), true);
});

test("supports exact-rank and same-value ten splitting", () => {
  const mixedTens = [card("K", "k"), card("Q", "q")];
  assert.equal(canSplitCards(mixedTens, "same-rank"), false);
  assert.equal(canSplitCards(mixedTens, "same-value"), true);
  assert.equal(canSplitCards([card("8", "8a"), card("8", "8b")], "same-rank"), true);
});

test("enforces configured doubling totals", () => {
  assert.equal(doubleAllowedForTotal(8, "any-two"), true);
  assert.equal(doubleAllowedForTotal(9, "nine-eleven"), true);
  assert.equal(doubleAllowedForTotal(9, "ten-eleven"), false);
  assert.equal(doubleAllowedForTotal(11, "ten-eleven"), true);
});

test("recommends strategy from the live cards and current action availability", () => {
  assert.equal(recommendedPlay([card("8", "8a"), card("8", "8b")], card("10", "dealer"), allActions).action, "split");
  assert.equal(recommendedPlay([card("A", "a"), card("7", "7")], card("9", "dealer"), allActions).action, "hit");
  assert.equal(recommendedPlay([card("10", "10"), card("6", "6")], card("10", "dealer"), allActions).action, "surrender");
  assert.equal(
    recommendedPlay(
      [card("8", "8a"), card("8", "8b")],
      card("6", "dealer"),
      { canDouble: false, canSplit: false, canSurrender: false },
    ).action,
    "stand",
  );
  assert.equal(
    recommendedPlay(
      [card("A", "a1"), card("A", "a2")],
      card("6", "dealer"),
      { canDouble: false, canSplit: false, canSurrender: false },
    ).action,
    "hit",
  );
});

test("reshuffles according to cut card and automatic mechanisms", () => {
  assert.equal(shouldShuffleBeforeRound({ rules: defaultSimulationRules, cardsRemaining: 100, cardsDealt: 212 }), false);
  assert.equal(shouldShuffleBeforeRound({ rules: defaultSimulationRules, cardsRemaining: 70, cardsDealt: 242 }), true);
  assert.equal(shouldShuffleBeforeRound({ rules: { ...defaultSimulationRules, shuffleMode: "every-round" }, cardsRemaining: 300, cardsDealt: 12 }), true);
  assert.equal(shouldShuffleBeforeRound({ rules: { ...defaultSimulationRules, shuffleMode: "continuous" }, cardsRemaining: 300, cardsDealt: 12 }), true);
});

test("clamps wagers to bankroll, limits, chips, and flat-bet rules", () => {
  assert.equal(clampWager(27, 500, defaultSimulationRules), 25);
  assert.equal(clampWager(400, 500, defaultSimulationRules), 250);
  assert.equal(clampWager(25, 3, defaultSimulationRules), 3);
  assert.equal(clampWager(100, 500, { ...defaultSimulationRules, bettingStyle: "flat-bet", flatBet: 35 }), 35);
});
