import assert from "node:assert/strict";
import test from "node:test";
import {
  createLessonOneDeck,
  createPianoLessonDeck,
  formatLessonTime,
  formatRecognitionTime,
  getPianoLesson,
  lessonAccuracy,
  lessonEightNoteIds,
  lessonFourNoteIds,
  lessonPerformanceKey,
  lessonOneCardCount,
  lessonOneNoteNames,
  lessonSixNoteIds,
  lessonTenNoteIds,
  lessonThreeNoteNames,
  lessonTwoNoteNames,
  pianoLessons,
  rankPianoLessonPerformance,
  rankLessonNotePerformance,
  type PianoLessonId,
} from "../data/pianoLessons.ts";
import { pitchNames } from "../data/pianoNotes.ts";

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

test("lesson two contains four cards for every black-key note name", () => {
  const deck = createPianoLessonDeck(2, () => 0.42);

  assert.equal(deck.length, 20);
  assert.equal(getPianoLesson(2).cardCount, 20);
  assert.equal(getPianoLesson(2).focusCount, 5);
  assert.equal(new Set(deck.map((card) => card.id)).size, 20);
  assert.ok(deck.every((card) => card.note.isBlack));
  for (const noteName of lessonTwoNoteNames) {
    const matchingCards = deck.filter((card) => card.note.name === noteName);
    assert.equal(matchingCards.length, 4);
    assert.equal(new Set(matchingCards.map((card) => card.note.octave)).size, 3);
  }
});

test("lesson three contains three octave-spanning cards for every note name", () => {
  const deck = createPianoLessonDeck(3, () => 0.73);

  assert.equal(deck.length, 36);
  assert.equal(getPianoLesson(3).cardCount, 36);
  assert.equal(getPianoLesson(3).focusCount, 12);
  assert.equal(new Set(deck.map((card) => card.id)).size, 36);
  assert.ok(deck.some((card) => card.note.isBlack));
  assert.ok(deck.some((card) => !card.note.isBlack));
  for (const noteName of lessonThreeNoteNames) {
    const matchingCards = deck.filter((card) => card.note.name === noteName);
    assert.equal(matchingCards.length, 3);
    assert.deepEqual([...new Set(matchingCards.map((card) => card.note.octave))].sort(), [3, 4, 5]);
  }
});

test("lesson definitions are numbered in order", () => {
  assert.deepEqual(pianoLessons.map((lesson) => lesson.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});

test("every lesson presents the same complete set of answer labels", () => {
  for (const lesson of pianoLessons) {
    assert.deepEqual(lesson.answerChoices, pitchNames);
    assert.equal(lesson.desktopChoiceColumns, 6);
    assert.equal(lesson.mobileChoiceColumns, 4);
  }
});

test("shuffled lessons never repeat an equivalent question twice in a row", () => {
  for (const lesson of pianoLessons) {
    for (let initialSeed = 1; initialSeed <= 50; initialSeed += 1) {
      let seed = initialSeed;
      const random = () => {
        seed = (seed * 1_664_525 + 1_013_904_223) % 4_294_967_296;
        return seed / 4_294_967_296;
      };
      const deck = createPianoLessonDeck(lesson.id, random);

      for (let index = 1; index < deck.length; index += 1) {
        assert.notEqual(
          lessonPerformanceKey(lesson.id, deck[index]),
          lessonPerformanceKey(lesson.id, deck[index - 1]),
          `Lesson ${lesson.id} repeated a question at cards ${index} and ${index + 1}`,
        );
      }
    }
  }
});

test("staff lessons contain three treble-clef cards for every exact target note", () => {
  const staffLessonCases: Array<{
    lessonId: PianoLessonId;
    noteIds: readonly string[];
    exerciseMode: "staff-name" | "staff-key";
  }> = [
    { lessonId: 4, noteIds: lessonFourNoteIds, exerciseMode: "staff-name" },
    { lessonId: 5, noteIds: lessonFourNoteIds, exerciseMode: "staff-key" },
    { lessonId: 6, noteIds: lessonSixNoteIds, exerciseMode: "staff-name" },
    { lessonId: 7, noteIds: lessonSixNoteIds, exerciseMode: "staff-key" },
    { lessonId: 8, noteIds: lessonEightNoteIds, exerciseMode: "staff-name" },
    { lessonId: 9, noteIds: lessonEightNoteIds, exerciseMode: "staff-key" },
    { lessonId: 10, noteIds: lessonTenNoteIds, exerciseMode: "staff-name" },
    { lessonId: 11, noteIds: lessonTenNoteIds, exerciseMode: "staff-key" },
  ];

  for (const { lessonId, noteIds, exerciseMode } of staffLessonCases) {
    const deck = createPianoLessonDeck(lessonId, () => 0.57);
    assert.equal(deck.length, noteIds.length * 3);
    assert.equal(getPianoLesson(lessonId).cardCount, noteIds.length * 3);
    assert.equal(getPianoLesson(lessonId).exerciseMode, exerciseMode);
    assert.equal(new Set(deck.map((card) => card.id)).size, deck.length);
    assert.ok(deck.every((card) => card.clef === "treble"));
    assert.ok(deck.every((card) => card.notation?.accidental === null));
    assert.deepEqual([...new Set(deck.map((card) => card.note.id))].sort(), [...noteIds].sort());

    for (const noteId of noteIds) {
      assert.equal(deck.filter((card) => card.note.id === noteId).length, 3);
    }
  }
});

test("staff lesson reports keep octave-specific note labels", () => {
  const report = rankPianoLessonPerformance(6, {
    C4: { attempts: 3, mistakes: 1, totalRecognitionMs: 3_000 },
    D4: { attempts: 3, mistakes: 2, totalRecognitionMs: 4_500 },
    E4: { attempts: 3, mistakes: 2, totalRecognitionMs: 7_500 },
    F4: { attempts: 3, mistakes: 0, totalRecognitionMs: 12_000 },
  });

  assert.deepEqual(report.map(({ noteName }) => noteName), ["E4", "D4", "C4", "F4"]);
});
