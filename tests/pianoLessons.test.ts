import assert from "node:assert/strict";
import test from "node:test";
import {
  createLessonOneDeck,
  formatLessonTime,
  lessonAccuracy,
  lessonOneCardCount,
  lessonOneNoteNames,
} from "../data/pianoLessons.ts";

test("lesson one contains three shuffled cards for every natural note", () => {
  let seed = 17;
  const random = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed / 2_147_483_648;
  };
  const deck = createLessonOneDeck(random);

  assert.equal(deck.length, lessonOneCardCount);
  assert.equal(new Set(deck.map((card) => card.id)).size, lessonOneCardCount);
  for (const noteName of lessonOneNoteNames) {
    assert.equal(deck.filter((card) => card.note.name === noteName).length, 3);
  }
  assert.notDeepEqual(deck.map((card) => card.id), createLessonOneDeck(() => 0.999).map((card) => card.id));
});

test("lesson statistics format time and accuracy", () => {
  assert.equal(formatLessonTime(0), "0:00.0");
  assert.equal(formatLessonTime(65_499), "1:05.4");
  assert.equal(lessonAccuracy(17, 21), 81);
  assert.equal(lessonAccuracy(0, 0), 0);
});
