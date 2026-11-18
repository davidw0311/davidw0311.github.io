import assert from "node:assert/strict";
import test from "node:test";
import { cocktails, cocktailPhoto, cocktailAlcoholType, findCocktails, swipeAction } from "../data/cocktails.ts";

test("search finds ingredients and spirits regardless of case or surrounding spaces", () => {
  assert.deepEqual(findCocktails("  CAMPARI  ", "menu").map(d => d.id), ["negroni"]);
  assert.equal(findCocktails("bourbon", "menu").length, 3);
  assert.equal(findCocktails("no-such-drink", "name").length, 0);
  const sorted = findCocktails("", "name").map(d => d.name);
  assert.deepEqual(sorted, [...sorted].sort((a,b) => a.localeCompare(b)));
  assert.equal(cocktails[0].id, "yuzu-whisky-sour");
});

test("alcohol sorting groups whisky styles and alphabetizes drinks within each type", () => {
  const result = findCocktails("", "spirit");
  const types = result.map(cocktailAlcoholType);
  assert.deepEqual(types, [...types].sort((a, b) => a.localeCompare(b)));
  for (const type of new Set(types)) {
    const names = result.filter(d => cocktailAlcoholType(d) === type).map(d => d.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  }
  assert.equal(cocktailAlcoholType({ spirit: "Bourbon" }), "Whisky");
  assert.equal(cocktailAlcoholType({ spirit: "Rye whisky" }), "Whisky");
  assert.equal(cocktailAlcoholType({ spirit: "Scotch" }), "Whisky");
  assert.equal(cocktailAlcoholType({ spirit: "Japanese whisky" }), "Whisky");
  assert.deepEqual(findCocktails("", "menu"), cocktails);
});

test("swipes use the dominant axis and ignore taps", () => {
  assert.equal(swipeAction(0, -80), "next");
  assert.equal(swipeAction(12, 80), "previous");
  assert.equal(swipeAction(-80, 10), "forward");
  assert.equal(swipeAction(80, -10), "back");
  assert.equal(swipeAction(20, 30), null);
});


test("classic recipes link to their own reference and use their own photographs", () => {
  const classics = cocktails.filter(d => d.source);
  assert.equal(classics.length, 12);
  assert.equal(new Set(cocktails.map(d => d.id)).size, cocktails.length);
  for (const drink of classics) {
    assert.equal(drink.source?.url, `https://iba-world.com/iba-cocktail/${drink.id}/`);
    assert.equal(cocktailPhoto(drink), `/assets/cocktails/${drink.id}.webp`);
  }
  assert.equal(cocktailPhoto(cocktails[0]), "/assets/cocktails/yuzu-whisky-sour.jpg");
  assert.equal(findCocktails("grapefruit", "name")[0].id, "paloma");
});
