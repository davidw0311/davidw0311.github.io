export const dealerUpcards = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"] as const;

export type DealerUpcard = (typeof dealerUpcards)[number];
export type StrategyCode = "H" | "S" | "D" | "Ds" | "P" | "R";
export type BlackjackAction = "hit" | "stand" | "double" | "split" | "surrender";
export type HandKind = "hard" | "soft" | "pair";
export type CardRank = DealerUpcard;

type StrategyRow = readonly StrategyCode[];

export const hardStrategy: Record<number, StrategyRow> = {
  5: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  6: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  7: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  8: ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  9: ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
  10: ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
  11: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "H"],
  12: ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"],
  13: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  14: ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  15: ["S", "S", "S", "S", "S", "H", "H", "H", "R", "H"],
  16: ["S", "S", "S", "S", "S", "H", "H", "R", "R", "R"],
  17: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  18: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  19: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  20: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  21: ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
};

export const softStrategy: Record<string, StrategyRow> = {
  "A,2": ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
  "A,3": ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
  "A,4": ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
  "A,5": ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
  "A,6": ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
  "A,7": ["Ds", "Ds", "Ds", "Ds", "Ds", "S", "S", "H", "H", "H"],
  "A,8": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  "A,9": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
};

export const pairStrategy: Record<string, StrategyRow> = {
  "2,2": ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
  "3,3": ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
  "4,4": ["H", "H", "H", "P", "P", "H", "H", "H", "H", "H"],
  "5,5": ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
  "6,6": ["P", "P", "P", "P", "P", "H", "H", "H", "H", "H"],
  "7,7": ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
  "8,8": ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
  "9,9": ["P", "P", "P", "P", "P", "S", "P", "P", "S", "S"],
  "10,10": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  "A,A": ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
};

export const actionLabels: Record<BlackjackAction, string> = {
  hit: "Hit",
  stand: "Stand",
  double: "Double",
  split: "Split",
  surrender: "Surrender",
};

export type ActionAvailability = {
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
};

export type TrainingScenario = {
  id: string;
  kind: HandKind;
  handLabel: string;
  total: number;
  playerRanks: readonly CardRank[];
  dealerUpcard: DealerUpcard;
  strategyCode: StrategyCode;
  availability: ActionAvailability;
  correctAction: BlackjackAction;
};

const hardHands: Record<number, readonly CardRank[]> = {
  5: ["2", "3"],
  6: ["2", "4"],
  7: ["3", "4"],
  8: ["3", "5"],
  9: ["4", "5"],
  10: ["4", "6"],
  11: ["5", "6"],
  12: ["5", "7"],
  13: ["6", "7"],
  14: ["6", "8"],
  15: ["7", "8"],
  16: ["7", "9"],
  17: ["7", "10"],
  18: ["8", "10"],
  19: ["9", "10"],
  20: ["4", "6", "10"],
  21: ["5", "6", "10"],
};

function rankValue(rank: CardRank) {
  if (rank === "A") return 11;
  return Number(rank);
}

export function resolveStrategyAction(
  code: StrategyCode,
  availability: ActionAvailability,
): BlackjackAction {
  if (code === "D") return availability.canDouble ? "double" : "hit";
  if (code === "Ds") return availability.canDouble ? "double" : "stand";
  if (code === "R") return availability.canSurrender ? "surrender" : "hit";
  if (code === "P") return availability.canSplit ? "split" : "hit";
  return code === "S" ? "stand" : "hit";
}

function scenarioFromRow(
  kind: HandKind,
  handLabel: string,
  playerRanks: readonly CardRank[],
  total: number,
  row: StrategyRow,
): TrainingScenario[] {
  const availability = {
    canDouble: playerRanks.length === 2,
    canSplit: kind === "pair",
    canSurrender: playerRanks.length === 2,
  };

  return dealerUpcards.map((dealerUpcard, index) => {
    const strategyCode = row[index];
    return {
      id: `${kind}-${handLabel.replaceAll(",", "-")}-vs-${dealerUpcard}`,
      kind,
      handLabel,
      total,
      playerRanks,
      dealerUpcard,
      strategyCode,
      availability,
      correctAction: resolveStrategyAction(strategyCode, availability),
    };
  });
}

export function buildTrainingScenarios(): TrainingScenario[] {
  const hard = Object.entries(hardStrategy).flatMap(([total, row]) => {
    const numericTotal = Number(total);
    return scenarioFromRow("hard", total, hardHands[numericTotal], numericTotal, row);
  });

  const soft = Object.entries(softStrategy).flatMap(([handLabel, row]) => {
    const secondRank = handLabel.split(",")[1] as CardRank;
    return scenarioFromRow(
      "soft",
      handLabel,
      ["A", secondRank],
      11 + rankValue(secondRank),
      row,
    );
  });

  const pairs = Object.entries(pairStrategy).flatMap(([handLabel, row]) => {
    const rank = handLabel.split(",")[0] as CardRank;
    const total = rank === "A" ? 12 : rankValue(rank) * 2;
    return scenarioFromRow("pair", handLabel, [rank, rank], total, row);
  });

  return [...hard, ...soft, ...pairs];
}

export const trainingScenarios = buildTrainingScenarios();

export function explainScenario(scenario: TrainingScenario): string {
  const dealer = scenario.dealerUpcard === "A" ? "Ace" : scenario.dealerUpcard;

  if (scenario.strategyCode === "R") {
    return `This hard ${scenario.total} is badly dominated by the dealer's ${dealer}. Late surrender gives up half the wager instead of playing a hand with a larger expected loss.`;
  }

  if (scenario.kind === "pair") {
    const rank = scenario.playerRanks[0];
    if (rank === "A") return "Aces are strongest when separated because each new hand starts with a flexible Ace. Always split them under these rules.";
    if (rank === "8") return "A hard 16 is one of blackjack's weakest hands. Splitting the eights creates two better starting hands.";
    if (rank === "10") return "A total of 20 is already extremely strong. Keep it together and stand.";
    if (rank === "5") return `Two fives are played as hard 10. ${scenario.correctAction === "double" ? `Double against the dealer's ${dealer}.` : `Hit against the dealer's ${dealer}.`}`;
    if (rank === "9") return scenario.correctAction === "split"
      ? `Split nines against the dealer's ${dealer} to create two strong starting hands.`
      : `Stand on 18 against the dealer's ${dealer}; splitting does not improve this matchup.`;
    return scenario.correctAction === "split"
      ? `The dealer's ${dealer} is weak enough that splitting this pair creates two hands with better potential.`
      : `Against the dealer's ${dealer}, keeping this pair together is less costly than splitting it.`;
  }

  if (scenario.kind === "soft") {
    if (scenario.total >= 19) return `Soft ${scenario.total} is already strong, so stand against the dealer's ${dealer}.`;
    if (scenario.total === 18) {
      if (scenario.correctAction === "double") return `Soft 18 can improve without much bust risk. Double against the dealer's weak ${dealer}.`;
      if (scenario.correctAction === "stand") return `Soft 18 is strong enough to stand against the dealer's ${dealer}.`;
      return `The dealer's ${dealer} is too strong for soft 18 to stand. Hit and use the Ace's flexibility.`;
    }
    if (scenario.correctAction === "double") return `This soft hand cannot bust with one card, and the dealer's ${dealer} is weak enough to make doubling profitable.`;
    return `This soft ${scenario.total} is too weak to stand. Hit while the Ace protects the hand from an immediate bust.`;
  }

  if (scenario.total >= 17) return `Hard ${scenario.total} is strong enough to stand against every dealer upcard in this chart.`;
  if (scenario.total <= 8) return `Hard ${scenario.total} cannot bust on the next card, so take a hit.`;
  if (scenario.correctAction === "double") return `Hard ${scenario.total} has strong one-card potential against the dealer's ${dealer}, making this a double.`;
  if (scenario.total === 12) {
    return scenario.correctAction === "stand"
      ? `Stand on hard 12 because the dealer's ${dealer} is in the 4-6 bust range.`
      : `Hit hard 12 because the dealer's ${dealer} is outside the 4-6 bust range.`;
  }
  if (scenario.total >= 13 && scenario.total <= 16) {
    return scenario.correctAction === "stand"
      ? `Stand and let the dealer's ${dealer} carry the higher bust risk.`
      : `The dealer's ${dealer} is too strong to wait on hard ${scenario.total}, so hit.`;
  }
  return `Hit hard ${scenario.total} against the dealer's ${dealer}; this matchup is not strong enough to stand or double.`;
}

export function strategyCodeMeaning(code: StrategyCode): string {
  if (code === "D") return "Double; otherwise hit";
  if (code === "Ds") return "Double; otherwise stand";
  if (code === "R") return "Surrender; otherwise hit";
  if (code === "P") return "Split";
  return code === "S" ? "Stand" : "Hit";
}
