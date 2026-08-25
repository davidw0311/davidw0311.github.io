import {
  trainingScenarios,
  type BlackjackAction,
  type TrainingScenario,
} from "./blackjackStrategy.ts";

export type MasterySection = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  scenarios: readonly TrainingScenario[];
};

const sectionDefinitions = [
  {
    id: "hard-foundations",
    title: "Hard foundations",
    shortTitle: "Hard 5-8",
    description: "Build the automatic hits that anchor the bottom of the hard-total table.",
    includes: (scenario: TrainingScenario) => scenario.kind === "hard" && scenario.total <= 8,
  },
  {
    id: "hard-doubles",
    title: "Hard doubles",
    shortTitle: "Hard 9-11",
    description: "Learn exactly when strong one-card totals earn a larger wager.",
    includes: (scenario: TrainingScenario) => scenario.kind === "hard" && scenario.total >= 9 && scenario.total <= 11,
  },
  {
    id: "hard-pressure",
    title: "Hard pressure hands",
    shortTitle: "Hard 12-16",
    description: "Master the hit, stand, and surrender boundaries where most mistakes happen.",
    includes: (scenario: TrainingScenario) => scenario.kind === "hard" && scenario.total >= 12 && scenario.total <= 16,
  },
  {
    id: "hard-stands",
    title: "Hard standing totals",
    shortTitle: "Hard 17-21",
    description: "Finish the hard-total table with the hands that are already strong enough.",
    includes: (scenario: TrainingScenario) => scenario.kind === "hard" && scenario.total >= 17,
  },
  {
    id: "soft-builders",
    title: "Soft building hands",
    shortTitle: "Soft A,2-A,6",
    description: "Use the Ace's flexibility to find the right hits and doubles.",
    includes: (scenario: TrainingScenario) => scenario.kind === "soft" && scenario.total <= 17,
  },
  {
    id: "soft-finishers",
    title: "Soft finishing hands",
    shortTitle: "Soft A,7-A,9",
    description: "Practice the subtle hit, stand, and double changes at the top of the soft table.",
    includes: (scenario: TrainingScenario) => scenario.kind === "soft" && scenario.total >= 18,
  },
  {
    id: "pairs",
    title: "Pair decisions",
    shortTitle: "All pairs",
    description: "Complete the chart by learning every split boundary.",
    includes: (scenario: TrainingScenario) => scenario.kind === "pair",
  },
] as const;

export const masterySections: readonly MasterySection[] = sectionDefinitions.map((section) => ({
  id: section.id,
  title: section.title,
  shortTitle: section.shortTitle,
  description: section.description,
  scenarios: trainingScenarios.filter(section.includes),
}));

export function unmasteredScenarios(
  section: MasterySection,
  masteredScenarioIds: ReadonlySet<string>,
): TrainingScenario[] {
  return section.scenarios.filter((scenario) => !masteredScenarioIds.has(scenario.id));
}

export type SimulationOutcome = "win" | "loss" | "push" | "surrender";

export type SimulationSettlement = {
  outcome: SimulationOutcome;
  label: string;
  delta: number;
  amountAtRisk: number;
};

export function actionStakeMultiplier(action: BlackjackAction): number {
  return action === "double" || action === "split" ? 2 : 1;
}

export function settleSimulationHand({
  wager,
  selectedAction,
  correctAction,
  roll,
}: {
  wager: number;
  selectedAction: BlackjackAction;
  correctAction: BlackjackAction;
  roll: number;
}): SimulationSettlement {
  if (selectedAction === "surrender") {
    return {
      outcome: "surrender",
      label: "Hand surrendered",
      delta: -(wager / 2),
      amountAtRisk: wager / 2,
    };
  }

  const amountAtRisk = wager * actionStakeMultiplier(selectedAction);
  const usedBasicStrategy = selectedAction === correctAction;
  const winThreshold = usedBasicStrategy ? 0.43 : 0.35;
  const pushThreshold = winThreshold + (usedBasicStrategy ? 0.09 : 0.08);

  if (roll < winThreshold) {
    return { outcome: "win", label: "Hand won", delta: amountAtRisk, amountAtRisk };
  }

  if (roll < pushThreshold) {
    return { outcome: "push", label: "Push", delta: 0, amountAtRisk };
  }

  return { outcome: "loss", label: "Hand lost", delta: -amountAtRisk, amountAtRisk };
}
