import assert from "node:assert/strict";
import test from "node:test";
import { trainingScenarios } from "../data/blackjackStrategy.ts";
import {
  formatStrategyRowName,
  formatTrainingHandHeading,
  nextTrainingScenario,
  strategySelectionState,
  suitForTrainingCard,
  trainingActionIsAvailable,
} from "../data/blackjackTraining.ts";

test("training deals avoid repeating the current scenario when alternatives exist", () => {
  const candidates = trainingScenarios.slice(0, 3);
  const current = candidates[0];

  assert.equal(nextTrainingScenario(candidates, current.id, 0)?.id, candidates[1].id);
  assert.equal(nextTrainingScenario([], current.id, 0), null);
  assert.equal(nextTrainingScenario([current], current.id, 0)?.id, current.id);
});

test("training helpers keep selection and card presentation deterministic", () => {
  const scenarios = trainingScenarios.slice(0, 2);
  assert.equal(strategySelectionState(new Set(), scenarios), "none");
  assert.equal(strategySelectionState(new Set([scenarios[0].id]), scenarios), "some");
  assert.equal(strategySelectionState(new Set(scenarios.map(({ id }) => id)), scenarios), "all");
  assert.equal(
    suitForTrainingCard(scenarios[0], 1, 2),
    suitForTrainingCard(scenarios[0], 1, 2),
  );
});

test("training labels and available actions follow scenario rules", () => {
  const pair = trainingScenarios.find((scenario) => scenario.kind === "pair");
  const hard = trainingScenarios.find((scenario) => scenario.kind === "hard");
  assert.ok(pair);
  assert.ok(hard);
  assert.match(formatTrainingHandHeading(pair), /^Pair of /);
  assert.match(formatStrategyRowName(hard), /^Hard /);
  assert.equal(trainingActionIsAvailable("hit", hard), true);
  assert.equal(trainingActionIsAvailable("stand", hard), true);
  assert.equal(trainingActionIsAvailable("double", hard), hard.availability.canDouble);
});
