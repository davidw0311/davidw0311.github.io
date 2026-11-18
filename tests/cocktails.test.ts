import assert from "node:assert/strict";
import test from "node:test";
import { cocktails, findCocktails, swipeAction } from "../data/cocktails.ts";

test("search finds ingredients and spirits regardless of case or surrounding spaces", () => {
  assert.deepEqual(findCocktails("  CAMPARI  ", false).map(d => d.id), ["negroni"]);
  assert.equal(findCocktails("bourbon", false).length, 2);
  assert.equal(findCocktails("no-such-drink", true).length, 0);
  const sorted = findCocktails("", true).map(d => d.name);
  assert.deepEqual(sorted, [...sorted].sort((a,b) => a.localeCompare(b)));
  assert.equal(cocktails[0].id, "yuzu-whisky-sour");
});

test("swipes use the dominant axis and ignore taps", () => {
  assert.equal(swipeAction(0, -80), "next");
  assert.equal(swipeAction(12, 80), "previous");
  assert.equal(swipeAction(-80, 10), "forward");
  assert.equal(swipeAction(80, -10), "back");
  assert.equal(swipeAction(20, 30), null);
});
