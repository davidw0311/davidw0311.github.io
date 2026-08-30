import {
  trainingScenarios,
  type BlackjackAction,
  type HandKind,
  type TrainingScenario,
} from "./blackjackStrategy.ts";

export type TrainingFocus = "all" | HandKind | "custom";
export type TrainerScreen = "menu" | "lessons" | "mastery" | "simulation" | "practice" | "table";
export type TrainingSuit = "clubs" | "diamonds" | "hearts" | "spades";

const suits: readonly TrainingSuit[] = ["spades", "hearts", "clubs", "diamonds"];

export const initialTrainingScenario = trainingScenarios.find(
  (candidate) => candidate.id === "hard-16-vs-10",
) ?? trainingScenarios[0];

function hashText(value: string) {
  return Array.from(value).reduce(
    (hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0,
    7,
  );
}

export function suitForTrainingCard(
  scenario: TrainingScenario,
  cardIndex: number,
  dealNumber: number,
) {
  return suits[(hashText(scenario.id) + cardIndex + dealNumber) % suits.length];
}

export function trainingActionIsAvailable(
  action: BlackjackAction,
  scenario: TrainingScenario,
) {
  if (action === "double") return scenario.availability.canDouble;
  if (action === "split") return scenario.availability.canSplit;
  if (action === "surrender") return scenario.availability.canSurrender;
  return true;
}

export function nextTrainingScenario(
  candidates: readonly TrainingScenario[],
  currentScenarioId: string,
  randomValue = Math.random(),
) {
  if (candidates.length === 0) return null;
  let index = Math.min(candidates.length - 1, Math.floor(randomValue * candidates.length));
  if (candidates.length > 1 && candidates[index].id === currentScenarioId) {
    index = (index + 1) % candidates.length;
  }
  return candidates[index];
}

export function formatTrainingHandHeading(scenario: TrainingScenario) {
  if (scenario.kind !== "pair") {
    return `${scenario.kind[0].toUpperCase()}${scenario.kind.slice(1)} ${scenario.total}`;
  }
  return scenario.playerRanks[0] === "A" ? "Pair of Aces" : `Pair of ${scenario.playerRanks[0]}s`;
}

export function formatStrategyRowLabel(scenario: TrainingScenario) {
  return scenario.kind === "hard" ? String(scenario.total) : scenario.handLabel;
}

export function formatStrategyRowName(scenario: TrainingScenario) {
  if (scenario.kind === "hard") return `Hard ${scenario.total}`;
  if (scenario.kind === "soft") return `Soft ${scenario.handLabel}`;
  return scenario.playerRanks[0] === "A" ? "Pair of Aces" : `Pair of ${scenario.playerRanks[0]}s`;
}

export function strategySelectionState(
  selectedIds: ReadonlySet<string>,
  scenarios: readonly TrainingScenario[],
) {
  const count = scenarios.filter((scenario) => selectedIds.has(scenario.id)).length;
  if (count === 0) return "none" as const;
  if (count === scenarios.length) return "all" as const;
  return "some" as const;
}
