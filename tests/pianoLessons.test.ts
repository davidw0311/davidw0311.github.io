import assert from "node:assert/strict";
import test from "node:test";
import {
  createLessonOneDeck,
  createPianoLessonDeck,
  formatLessonTime,
  formatRecognitionTime,
  getPianoLesson,
  lessonAccuracy,
  lessonOneCardCount,
  lessonOneNoteNames,
  pianoLessons,
  rankLessonNotePerformance,
} from "../data/pianoLessons.ts";
import { blackKeys, pianoNotes, pitchNames } from "../data/pianoNotes.ts";

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

test("lesson reports rank every included note by mistakes and then recognition time", () => {
  const report = rankLessonNotePerformance(["C", "D", "E", "F", "C", "D"], {
    C: { attempts: 2, mistakes: 2, totalRecognitionMs: 4_000 },
    D: { attempts: 2, mistakes: 2, totalRecognitionMs: 6_000 },
    E: { attempts: 1, mistakes: 1, totalRecognitionMs: 10_000 },
  });

  assert.deepEqual(report, [
    { noteName: "D", attempts: 2, mistakes: 2, averageRecognitionMs: 3_000 },
    { noteName: "C", attempts: 2, mistakes: 2, averageRecognitionMs: 2_000 },
    { noteName: "E", attempts: 1, mistakes: 1, averageRecognitionMs: 10_000 },
    { noteName: "F", attempts: 0, mistakes: 0, averageRecognitionMs: 0 },
  ]);
  assert.equal(formatRecognitionTime(3_000), "3.00s");
  assert.equal(formatRecognitionTime(12_340), "12.3s");
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

test("every lesson presents the same complete set of answer labels", () => {
  for (const lesson of pianoLessons) {
    assert.deepEqual(lesson.answerChoices, pitchNames);
    assert.equal(lesson.desktopChoiceColumns, 6);
    assert.equal(lesson.mobileChoiceColumns, 4);
  }
});
