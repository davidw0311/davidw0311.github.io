import assert from "node:assert/strict";
import test from "node:test";
import {
  createLessonOneDeck,
  createPianoLessonDeck,
  formatLessonTime,
  getPianoLesson,
  lessonAccuracy,
  lessonOneCardCount,
  lessonOneNoteNames,
  pianoLessons,
} from "../data/pianoLessons.ts";
import { blackKeys, pianoNotes } from "../data/pianoNotes.ts";

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

test("lesson two contains four cards for every black key", () => {
  const deck = createPianoLessonDeck(2, () => 0.42);

  assert.equal(deck.length, 40);
  assert.equal(getPianoLesson(2).cardCount, 40);
  assert.equal(new Set(deck.map((card) => card.id)).size, 40);
  assert.ok(deck.every((card) => card.note.isBlack));
  for (const note of blackKeys) {
    assert.equal(deck.filter((card) => card.note.id === note.id).length, 4);
  }
});

test("lesson three contains three cards for every piano key", () => {
  const deck = createPianoLessonDeck(3, () => 0.73);

  assert.equal(deck.length, 75);
  assert.equal(getPianoLesson(3).cardCount, 75);
  assert.equal(new Set(deck.map((card) => card.id)).size, 75);
  assert.ok(deck.some((card) => card.note.isBlack));
  assert.ok(deck.some((card) => !card.note.isBlack));
  for (const note of pianoNotes) {
    assert.equal(deck.filter((card) => card.note.id === note.id).length, 3);
  }
});

test("lesson definitions are numbered in order", () => {
  assert.deepEqual(pianoLessons.map((lesson) => lesson.id), [1, 2, 3]);
});
