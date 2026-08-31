import assert from "node:assert/strict";
import test from "node:test";
import {
  allMajorLessonChords,
  allMinorLessonChords,
  createLessonOneDeck,
  createPianoLessonDeck,
  dynamicPianoLessonIds,
  formatLessonTime,
  formatRecognitionTime,
  getPianoLesson,
  getNextPianoLessonId,
  lessonAccuracy,
  lessonEightNoteIds,
  lessonFourteenNoteIds,
  lessonFourNoteIds,
  lessonCardExerciseMode,
  lessonPerformanceKey,
  lessonOneCardCount,
  lessonOneNoteNames,
  lessonSixNoteIds,
  lessonSixteenNoteIds,
  lessonTenNoteIds,
  lessonTwelveNoteIds,
  lessonThreeNoteNames,
  lessonTwoNoteNames,
  majorChordLessonGroups,
  majorKeySignatureLessons,
  minorChordLessonGroups,
  pianoLessonGroups,
  pianoLessonIds,
  pianoLessons,
  rankPianoLessonPerformance,
  rankLessonNotePerformance,
  type PianoLessonId,
} from "../data/pianoLessons.ts";
import { formatNotation, pitchNames } from "../data/pianoNotes.ts";
import {
  pianoLessonShareFileName,
  pianoLessonShareMistakeCount,
  pianoLessonShareText,
} from "../data/pianoLessonShare.ts";
import { pianoLessonShareImageSize } from "../lib/pianoLessonShareImage.ts";

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

test("lesson result shares use clear progress copy and image names", () => {
  const result = {
    lessonId: 4,
    lessonTitle: "Treble FACE notes",
    playerName: "Avery",
    elapsedTime: "0:42.3",
    correctCount: 12,
    cardCount: 12,
    accuracy: 100,
    noteResults: [
      { noteName: "F4", mistakes: 0, averageRecognitionTime: "1.20s", attempts: 3 },
      { noteName: "A4", mistakes: 0, averageRecognitionTime: "0.82s", attempts: 3 },
    ],
  };

  assert.equal(pianoLessonShareFileName(result.lessonId), "piano-party-lesson-4.png");
  assert.equal(
    pianoLessonShareText(result),
    "I completed Piano Party Lesson 4 with 100% accuracy in 0:42.3. A perfect run!",
  );
  const resultWithMistakes = {
    ...result,
    correctCount: 10,
    accuracy: 83,
    noteResults: [
      { noteName: "C4", mistakes: 2, averageRecognitionTime: "3.40s", attempts: 3 },
      { noteName: "D4", mistakes: 1, averageRecognitionTime: "2.10s", attempts: 3 },
    ],
  };
  assert.equal(pianoLessonShareMistakeCount(resultWithMistakes), 3);
  assert.equal(
    pianoLessonShareText(resultWithMistakes),
    "I completed Piano Party Lesson 4 with 83% accuracy in 0:42.3. The note report includes 3 mistakes.",
  );

  assert.equal(
    pianoLessonShareText({
      ...resultWithMistakes,
      lessonId: 38,
      lessonTitle: "All major chords",
      performanceLabel: "Chord",
    }),
    "I completed Piano Party Lesson 38 with 83% accuracy in 0:42.3. The chord report includes 3 mistakes.",
  );
});

test("lesson share images reserve enough height for every note row", () => {
  assert.deepEqual(pianoLessonShareImageSize(7), { height: 1_404, keyboardY: 1_214 });
  assert.deepEqual(pianoLessonShareImageSize(21), { height: 2_132, keyboardY: 1_942 });
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
  assert.deepEqual(
    pianoLessons.map((lesson) => lesson.id),
    pianoLessonIds,
  );
});

test("completed lessons link to the next lesson until the current curriculum ends", () => {
  for (let index = 0; index < pianoLessonIds.length - 1; index += 1) {
    assert.equal(getNextPianoLessonId(pianoLessonIds[index]), pianoLessonIds[index + 1]);
  }

  assert.equal(getNextPianoLessonId(pianoLessonIds.at(-1)!), null);
});

test("lesson library groups and dynamic routes cover the catalog without drift", () => {
  const groupedIds = pianoLessonGroups.flatMap((group) => group.lessons.map((lesson) => lesson.id));

  assert.deepEqual(groupedIds, pianoLessonIds);
  assert.equal(new Set(groupedIds).size, pianoLessonIds.length);
  assert.deepEqual(dynamicPianoLessonIds, pianoLessonIds.filter((lessonId) => lessonId >= 4));

  for (const lesson of pianoLessons) {
    assert.equal(createPianoLessonDeck(lesson.id, () => 0.41).length, lesson.cardCount);
    assert.equal(getPianoLesson(lesson.id), lesson);
  }
});

test("every lesson presents the same complete set of answer labels", () => {
  for (const lesson of pianoLessons) {
    assert.deepEqual(lesson.answerChoices, pitchNames);
    assert.equal(lesson.desktopChoiceColumns, 6);
    assert.equal(lesson.mobileChoiceColumns, 4);
  }
});

test("key signature lessons alternate sharps and flats from one through seven accidentals", () => {
  assert.equal(majorKeySignatureLessons.length, 14);

  for (let index = 0; index < 7; index += 1) {
    const sharpLesson = majorKeySignatureLessons[index * 2];
    const flatLesson = majorKeySignatureLessons[index * 2 + 1];

    assert.equal(sharpLesson.lessonId, 18 + index * 2);
    assert.equal(sharpLesson.keySignature.accidental, "sharp");
    assert.equal(sharpLesson.keySignature.count, index + 1);
    assert.equal(sharpLesson.keySignature.alteredNotes.length, index + 1);
    assert.equal(flatLesson.lessonId, 19 + index * 2);
    assert.equal(flatLesson.keySignature.accidental, "flat");
    assert.equal(flatLesson.keySignature.count, index + 1);
    assert.equal(flatLesson.keySignature.alteredNotes.length, index + 1);
  }
});

test("lesson 31 remains the final key-signature lesson before chord lessons begin", () => {
  const lessonThirtyOne = getPianoLesson(31);
  const lessonThirtyTwo = getPianoLesson(32);

  assert.equal(lessonThirtyOne.exerciseMode, "staff-key");
  assert.equal(lessonThirtyOne.keySignature?.name, "C♭ major");
  assert.equal(lessonThirtyOne.chords, undefined);
  assert.equal(lessonThirtyTwo.exerciseMode, "chord-name");
  assert.ok(lessonThirtyTwo.chords);
});

test("key signature lessons cover C3-C6 and double every affected written note", () => {
  for (const { lessonId, keySignature } of majorKeySignatureLessons) {
    const lesson = getPianoLesson(lessonId);
    const deck = createPianoLessonDeck(lessonId, () => 0.47);
    const cardsByNotation = new Map<string, typeof deck>();

    assert.equal(lesson.exerciseMode, "staff-key");
    assert.deepEqual(lesson.keySignature, keySignature);
    assert.equal(deck.length, lesson.cardCount);
    assert.ok(deck.every((card) => card.note.midi >= 48 && card.note.midi <= 84));
    assert.ok(deck.every((card) => card.clef === (card.notation!.octave < 4 ? "bass" : "treble")));

    for (const card of deck) {
      assert.ok(card.notation);
      const notationKey = formatNotation(card.notation, true);
      const matchingCards = cardsByNotation.get(notationKey) ?? [];
      matchingCards.push(card);
      cardsByNotation.set(notationKey, matchingCards);

      const isAffected = keySignature.alteredNotes.includes(card.notation.name);
      assert.equal(card.notation.accidental, isAffected ? keySignature.accidental : null);
    }

    for (const cards of cardsByNotation.values()) {
      assert.equal(cards.length, cards[0].notation?.accidental ? 6 : 3);
    }

    assert.ok([...cardsByNotation.keys()].some((notation) => notation.startsWith("C") && notation.endsWith("3"))
      || (keySignature.accidental === "flat" && keySignature.alteredNotes.includes("C")));
    assert.ok(Math.max(...deck.map((card) => card.note.midi)) >= 83);
  }
});

test("focused chord lessons repeat each chord three times in the requested direction", () => {
  const focusedLessons = [
    { ids: [32, 34, 36], groups: majorChordLessonGroups, mode: "chord-name", quality: "major" },
    { ids: [33, 35, 37], groups: majorChordLessonGroups, mode: "chord-key", quality: "major" },
    { ids: [39, 41, 43], groups: minorChordLessonGroups, mode: "chord-name", quality: "minor" },
    { ids: [40, 42, 44], groups: minorChordLessonGroups, mode: "chord-key", quality: "minor" },
  ] as const;

  for (const lessonSet of focusedLessons) {
    lessonSet.ids.forEach((lessonId, groupIndex) => {
      const typedLessonId = lessonId as PianoLessonId;
      const deck = createPianoLessonDeck(typedLessonId, () => 0.43);
      const expectedIds = lessonSet.groups[groupIndex].chordIds;

      assert.equal(deck.length, 12);
      assert.equal(getPianoLesson(typedLessonId).cardCount, 12);
      assert.deepEqual(
        [...new Set(deck.map((card) => card.chord?.id))].sort(),
        [...expectedIds].sort(),
      );
      assert.ok(deck.every((card) => card.chord?.quality === lessonSet.quality));
      assert.ok(deck.every((card) => lessonCardExerciseMode(typedLessonId, card) === lessonSet.mode));

      for (const chordId of expectedIds) {
        assert.equal(deck.filter((card) => card.chord?.id === chordId).length, 3);
      }
    });
  }
});

test("every chord recognition lesson offers all 12 chord names of its quality", () => {
  const recognitionLessons = [32, 34, 36, 39, 41, 43] as const;

  for (const lessonId of recognitionLessons) {
    const lesson = getPianoLesson(lessonId);
    const quality = lessonId < 39 ? "major" : "minor";

    assert.equal(lesson.exerciseMode, "chord-name");
    assert.equal(lesson.answerChords?.length, 12);
    assert.equal(new Set(lesson.answerChords?.map((chord) => chord.id)).size, 12);
    assert.ok(lesson.answerChords?.every((chord) => chord.quality === quality));
    assert.ok(lesson.chords?.every((chord) => lesson.answerChords?.some((answer) => answer.id === chord.id)));
  }
});

test("major and minor reviews cover all 12 chords once in each direction", () => {
  const reviewLessons = [
    { lessonId: 38, chords: allMajorLessonChords, quality: "major" },
    { lessonId: 45, chords: allMinorLessonChords, quality: "minor" },
  ] as const;

  for (const { lessonId, chords, quality } of reviewLessons) {
    const deck = createPianoLessonDeck(lessonId, () => 0.61);
    assert.equal(deck.length, 24);
    assert.equal(chords.length, 12);
    assert.ok(deck.every((card) => card.chord?.quality === quality));

    for (const chord of chords) {
      const matchingCards = deck.filter((card) => card.chord?.id === chord.id);
      assert.equal(matchingCards.length, 2);
      assert.deepEqual(
        matchingCards.map((card) => lessonCardExerciseMode(lessonId, card)).sort(),
        ["chord-key", "chord-name"],
      );
    }
  }
});

test("chord lesson reports aggregate both directions under the chord symbol", () => {
  const deck = createPianoLessonDeck(38, () => 0.22);
  const firstChord = deck[0].chord;
  assert.ok(firstChord);
  const matchingCards = deck.filter((card) => card.chord?.id === firstChord.id);

  assert.equal(matchingCards.length, 2);
  assert.deepEqual(
    new Set(matchingCards.map((card) => lessonPerformanceKey(38, card))),
    new Set([firstChord.name]),
  );
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

test("redoing every lesson creates a fresh visible note order", () => {
  const seededRandom = (initialSeed: number) => {
    let seed = initialSeed;
    return () => {
      seed = (seed * 1_664_525 + 1_013_904_223) % 4_294_967_296;
      return seed / 4_294_967_296;
    };
  };

  for (const lesson of pianoLessons) {
    const firstRun = createPianoLessonDeck(lesson.id, seededRandom(101))
      .map((card) => lessonPerformanceKey(lesson.id, card));
    const redo = createPianoLessonDeck(lesson.id, seededRandom(202))
      .map((card) => lessonPerformanceKey(lesson.id, card));

    assert.notDeepEqual(
      redo,
      firstRun,
      `Lesson ${lesson.id} reused the same visible note order`,
    );
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
    { lessonId: 12, noteIds: lessonTwelveNoteIds, exerciseMode: "staff-name" },
    { lessonId: 13, noteIds: lessonTwelveNoteIds, exerciseMode: "staff-key" },
    { lessonId: 14, noteIds: lessonFourteenNoteIds, exerciseMode: "staff-name" },
    { lessonId: 15, noteIds: lessonFourteenNoteIds, exerciseMode: "staff-key" },
    { lessonId: 16, noteIds: lessonSixteenNoteIds, exerciseMode: "staff-key" },
    { lessonId: 17, noteIds: lessonSixteenNoteIds, exerciseMode: "staff-name" },
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
