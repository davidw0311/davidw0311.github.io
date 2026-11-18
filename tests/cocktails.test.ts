import assert from "node:assert/strict";
import test from "node:test";
import { cocktails, mamaDiamSource, cocktailPhoto, cocktailAlcoholType, cocktailBar, cocktailHash, parseCocktailHash, findCocktails, swipeAction } from "../data/cocktails.ts";

test("search finds ingredients and spirits regardless of case or surrounding spaces", () => {
  assert.deepEqual(findCocktails("  CAMPARI  ", "menu").map(d => d.id), ["negroni", "peranakan-negroni"]);
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
  const classics = cocktails.filter(d => d.source?.name === "IBA");
  assert.equal(classics.length, 12);
  assert.equal(new Set(cocktails.map(d => d.id)).size, cocktails.length);
  for (const drink of classics) {
    assert.equal(drink.source?.url, `https://iba-world.com/iba-cocktail/${drink.id}/`);
    assert.equal(cocktailPhoto(drink), `/assets/cocktails/${drink.id}.webp`);
  }
  assert.equal(cocktailPhoto(cocktails[0]), "/assets/cocktails/yuzu-whisky-sour.jpg");
  assert.equal(findCocktails("grapefruit", "name")[0].id, "paloma");
});


test("Mama Diam signatures retain menu attribution and use their own illustrations", () => {
  const drinks = cocktails.filter(d => d.source?.name === "Mama Diam");
  assert.equal(drinks.length, 12);
  for (const drink of drinks) {
    assert.equal(drink.source?.url, mamaDiamSource);
    assert.equal(drink.source?.adaptation, true);
    assert.equal(cocktailPhoto(drink), `/assets/cocktails/${drink.id}.png`);
  }
  assert.equal(findCocktails("kaya")[0].id, "peranakan-negroni");
});

test("every cocktail and recipe page round-trips through a shareable URL hash", () => {
  for (let index = 0; index < cocktails.length; index++) {
    for (let panel = 0; panel < 3; panel++) {
      assert.deepEqual(parseCocktailHash(cocktailHash(index, panel)), { index, panel });
    }
  }
  const mojito = cocktails.findIndex(d => d.id === "mojito");
  assert.equal(cocktailHash(mojito, 0), "#mojito");
  assert.equal(cocktailHash(mojito, 1), "#mojito/ingredients");
  assert.equal(cocktailHash(mojito, 2), "#mojito/method");
});

test("empty and invalid shared links fall back safely", () => {
  for (const hash of ["", "#unknown", "#unknown/ingredients", "#%invalid"]) {
    assert.deepEqual(parseCocktailHash(hash), { index: 0, panel: 0 });
  }
  const mojito = cocktails.findIndex(d => d.id === "mojito");
  assert.deepEqual(parseCocktailHash("#mojito/unknown"), { index: mojito, panel: 0 });
});


test("bar sorting groups sources and alphabetizes cocktails within each group", () => {
  const sorted = findCocktails("", "bar");
  const groups = sorted.map(cocktailBar);
  assert.deepEqual([...new Set(groups)], ["Classics (IBA)", "Jigger & Pony", "Mama Diam"]);
  assert.deepEqual(groups, [...groups].sort((a, b) => a.localeCompare(b)));
  for (const bar of new Set(groups)) {
    const names = sorted.filter(d => cocktailBar(d) === bar).map(d => d.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  }
  assert.equal(findCocktails("mama diam", "bar").length, 12);
  assert.equal(findCocktails("jigger & pony", "bar").length, 21);
  assert.equal(findCocktails("classics (iba)", "bar").length, 12);
});
