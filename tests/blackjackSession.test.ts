import assert from "node:assert/strict";
import test from "node:test";
import {
  actionAvailability,
  appendSimulationLog,
  createSimulationSession,
  settleSimulationRound,
  validateSimulationRules,
  type PlayerHand,
} from "../data/blackjackSession.ts";
import {
  defaultSimulationRules,
  type ShoeCard,
} from "../data/blackjackSimulation.ts";

const card = (id: string, rank: ShoeCard["rank"], suit: ShoeCard["suit"]): ShoeCard => ({ id, rank, suit });

test("validates blackjack table rules before creating a session", () => {
  assert.equal(validateSimulationRules(defaultSimulationRules), "");
  assert.match(
    validateSimulationRules({ ...defaultSimulationRules, maximumBet: 5, minimumBet: 10 }),
    /maximum bet/i,
  );
  assert.match(
    validateSimulationRules({ ...defaultSimulationRules, startingBankroll: 5, minimumBet: 10 }),
    /starting bankroll/i,
  );

  const session = createSimulationSession(defaultSimulationRules);
  assert.equal(session.phase, "betting");
  assert.equal(session.bankroll, defaultSimulationRules.startingBankroll);
  assert.equal(session.shoe.length, defaultSimulationRules.deckCount * 52);
});

test("settles blackjack sessions independently from the React view", () => {
  const base = createSimulationSession(defaultSimulationRules);
  const playerHand: PlayerHand = {
    id: "hand-1",
    cards: [card("p1", "10", "spades"), card("p2", "K", "hearts")],
    wager: 25,
    status: "stood",
    fromSplit: false,
    splitAces: false,
    doubled: false,
  };
  const settled = settleSimulationRound({
    ...base,
    bankroll: 975,
    roundStartingBankroll: 1_000,
    phase: "dealer",
    hands: [playerHand],
    dealerCards: [card("d1", "10", "clubs"), card("d2", "7", "diamonds")],
  });

  assert.equal(settled.phase, "settled");
  assert.equal(settled.bankroll, 1_025);
  assert.equal(settled.roundNet, 25);
  assert.equal(settled.hands[0].status, "win");
});

test("session helpers cap logs and calculate available actions", () => {
  const log = Array.from({ length: 12 }, (_, index) => `event-${index}`);
  assert.deepEqual(appendSimulationLog(log, "latest"), [...log.slice(1), "latest"]);

  const session = createSimulationSession(defaultSimulationRules);
  const pair: PlayerHand = {
    id: "pair",
    cards: [card("a", "8", "spades"), card("b", "8", "hearts")],
    wager: 25,
    status: "playing",
    fromSplit: false,
    splitAces: false,
    doubled: false,
  };
  assert.deepEqual(actionAvailability({ ...session, hands: [pair] }, pair), {
    canDouble: true,
    canSplit: true,
    canSurrender: true,
  });
});
