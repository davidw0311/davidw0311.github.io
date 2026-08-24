import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTrainingScenarios,
  explainScenario,
  hardStrategy,
  pairStrategy,
  resolveStrategyAction,
  softStrategy,
  trainingScenarios,
} from "../data/blackjackStrategy.ts";

const workbookHardRows: Record<number, string> = {
  5: "H,H,H,H,H,H,H,H,H,H",
  6: "H,H,H,H,H,H,H,H,H,H",
  7: "H,H,H,H,H,H,H,H,H,H",
  8: "H,H,H,H,H,H,H,H,H,H",
  9: "H,D,D,D,D,H,H,H,H,H",
  10: "D,D,D,D,D,D,D,D,H,H",
  11: "D,D,D,D,D,D,D,D,D,H",
  12: "H,H,S,S,S,H,H,H,H,H",
  13: "S,S,S,S,S,H,H,H,H,H",
  14: "S,S,S,S,S,H,H,H,H,H",
  15: "S,S,S,S,S,H,H,H,R,H",
  16: "S,S,S,S,S,H,H,R,R,R",
  17: "S,S,S,S,S,S,S,S,S,S",
  18: "S,S,S,S,S,S,S,S,S,S",
  19: "S,S,S,S,S,S,S,S,S,S",
  20: "S,S,S,S,S,S,S,S,S,S",
  21: "S,S,S,S,S,S,S,S,S,S",
};

const workbookSoftRows: Record<string, string> = {
  "A,2": "H,H,H,D,D,H,H,H,H,H",
  "A,3": "H,H,H,D,D,H,H,H,H,H",
  "A,4": "H,H,D,D,D,H,H,H,H,H",
  "A,5": "H,H,D,D,D,H,H,H,H,H",
  "A,6": "H,D,D,D,D,H,H,H,H,H",
  "A,7": "Ds,Ds,Ds,Ds,Ds,S,S,H,H,H",
  "A,8": "S,S,S,S,S,S,S,S,S,S",
  "A,9": "S,S,S,S,S,S,S,S,S,S",
};

const workbookPairRows: Record<string, string> = {
  "2,2": "P,P,P,P,P,P,H,H,H,H",
  "3,3": "P,P,P,P,P,P,H,H,H,H",
  "4,4": "H,H,H,P,P,H,H,H,H,H",
  "5,5": "D,D,D,D,D,D,D,D,H,H",
  "6,6": "P,P,P,P,P,H,H,H,H,H",
  "7,7": "P,P,P,P,P,P,H,H,H,H",
  "8,8": "P,P,P,P,P,P,P,P,P,P",
  "9,9": "P,P,P,P,P,S,P,P,S,S",
  "10,10": "S,S,S,S,S,S,S,S,S,S",
  "A,A": "P,P,P,P,P,P,P,P,P,P",
};

function serializeRows(rows: Record<string | number, readonly string[]>) {
  return Object.fromEntries(Object.entries(rows).map(([key, row]) => [key, row.join(",")]));
}

test("encodes every strategy row from the attached workbook", () => {
  assert.deepEqual(serializeRows(hardStrategy), workbookHardRows);
  assert.deepEqual(serializeRows(softStrategy), workbookSoftRows);
  assert.deepEqual(serializeRows(pairStrategy), workbookPairRows);
});

test("builds all 350 workbook decisions", () => {
  assert.equal(buildTrainingScenarios().length, 350);
  assert.equal(new Set(trainingScenarios.map((scenario) => scenario.id)).size, 350);
});

test("resolves conditional strategy codes when actions are unavailable", () => {
  const initial = { canDouble: true, canSplit: true, canSurrender: true };
  const afterHit = { canDouble: false, canSplit: false, canSurrender: false };

  assert.equal(resolveStrategyAction("D", initial), "double");
  assert.equal(resolveStrategyAction("D", afterHit), "hit");
  assert.equal(resolveStrategyAction("Ds", initial), "double");
  assert.equal(resolveStrategyAction("Ds", afterHit), "stand");
  assert.equal(resolveStrategyAction("R", initial), "surrender");
  assert.equal(resolveStrategyAction("R", afterHit), "hit");
  assert.equal(resolveStrategyAction("P", initial), "split");
  assert.equal(resolveStrategyAction("P", afterHit), "hit");
});

test("matches important decision boundaries", () => {
  const actionFor = (id: string) => trainingScenarios.find((scenario) => scenario.id === id)?.correctAction;

  assert.equal(actionFor("hard-12-vs-3"), "hit");
  assert.equal(actionFor("hard-12-vs-4"), "stand");
  assert.equal(actionFor("hard-15-vs-10"), "surrender");
  assert.equal(actionFor("hard-16-vs-A"), "surrender");
  assert.equal(actionFor("soft-A-7-vs-6"), "double");
  assert.equal(actionFor("soft-A-7-vs-7"), "stand");
  assert.equal(actionFor("soft-A-7-vs-9"), "hit");
  assert.equal(actionFor("pair-8-8-vs-A"), "split");
  assert.equal(actionFor("pair-9-9-vs-7"), "stand");
  assert.equal(actionFor("pair-10-10-vs-6"), "stand");
});

test("provides a plain-language explanation for every decision", () => {
  for (const scenario of trainingScenarios) {
    const explanation = explainScenario(scenario);
    assert.ok(explanation.length >= 45, scenario.id);
    assert.doesNotMatch(explanation, /[—–]/, scenario.id);
  }
});
