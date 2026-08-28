import {
  blackKeys,
  naturalNoteNames,
  pianoNotes,
  pitchNames,
  whiteKeys,
  type PianoExerciseMode,
  type PianoNote,
  type PitchName,
  type StaffClef,
  type StaffNotation,
} from "./pianoNotes.ts";

export const pianoLessonIds = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 16, 17,
] as const;

export type PianoLessonId = (typeof pianoLessonIds)[number];

export type PianoLessonCard = {
  id: string;
  note: PianoNote;
  clef?: StaffClef;
  notation?: StaffNotation;
};

export type LessonNotePerformance = {
  attempts: number;
  mistakes: number;
  totalRecognitionMs: number;
};

export type LessonNotePerformanceMap = Partial<Record<string, LessonNotePerformance>>;

export type PianoLessonDefinition = {
  id: PianoLessonId;
  title: string;
  description: string;
  libraryDescription: string;
  completionDescription: string;
  exerciseMode: PianoExerciseMode;
  prompt: string;
  answerChoices: readonly PitchName[];
  cardCount: number;
  focusLabel: string;
  focusCount: number;
  desktopChoiceColumns: number;
  mobileChoiceColumns: number;
};

export type PianoLessonGroupDefinition = {
  id: string;
  title: string;
  description: string;
  lessons: readonly PianoLessonDefinition[];
};

export const lessonOneNoteNames: PitchName[] = [...naturalNoteNames];
export const lessonOneCardCount = lessonOneNoteNames.length * 3;
export const lessonTwoNoteNames = pitchNames.filter((name) => blackKeys.some((note) => note.name === name));
export const lessonThreeNoteNames: PitchName[] = [...pitchNames];
export const lessonFourNoteIds = ["F4", "A4", "C5", "E5"] as const;
export const lessonSixNoteIds = ["C4", "D4", "E4", "F4"] as const;
export const lessonEightNoteIds = ["G4", "A4", "B4", "C5"] as const;
export const lessonTenNoteIds = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"] as const;
export const lessonTwelveNoteIds = ["C5", "D5", "E5", "F5"] as const;
export const lessonFourteenNoteIds = ["G5", "A5", "B5", "C6"] as const;
export const lessonSixteenNoteIds = [
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6",
] as const;

const lessonOneCards: PianoLessonCard[] = lessonOneNoteNames.flatMap((name) => {
  const matchingKeys = whiteKeys.filter((note) => note.name === name);
  return Array.from({ length: 3 }, (_, repeatIndex) => ({
    id: `lesson-1-${name}-${repeatIndex + 1}`,
    note: matchingKeys[repeatIndex % matchingKeys.length],
  }));
});

function repeatNoteNames(
  lessonId: PianoLessonId,
  noteNames: readonly PitchName[],
  availableKeys: readonly PianoNote[],
  repeatCount: number,
) {
  return noteNames.flatMap((name) => {
    const matchingKeys = availableKeys.filter((note) => note.name === name);
    if (matchingKeys.length === 0) throw new Error(`No piano keys available for ${name}`);

    return Array.from({ length: repeatCount }, (_, repeatIndex) => {
      const note = matchingKeys[repeatIndex % matchingKeys.length];
      return {
        id: `lesson-${lessonId}-${note.id}-${repeatIndex + 1}`,
        note,
      };
    });
  });
}

function createTrebleStaffCards(
  lessonId: PianoLessonId,
  noteIds: readonly string[],
  repeatCount = 3,
) {
  return noteIds.flatMap((noteId) => {
    const note = pianoNotes.find((candidate) => candidate.id === noteId);
    if (!note || note.isBlack) throw new Error(`No natural piano key available for ${noteId}`);

    return Array.from({ length: repeatCount }, (_, repeatIndex) => ({
      id: `lesson-${lessonId}-${note.id}-${repeatIndex + 1}`,
      note,
      clef: "treble" as const,
      notation: note.spellings[0],
    }));
  });
}

const lessonCards: Record<PianoLessonId, PianoLessonCard[]> = {
  1: lessonOneCards,
  2: repeatNoteNames(2, lessonTwoNoteNames, blackKeys, 4),
  3: repeatNoteNames(3, lessonThreeNoteNames, pianoNotes, 3),
  4: createTrebleStaffCards(4, lessonFourNoteIds),
  5: createTrebleStaffCards(5, lessonFourNoteIds),
  6: createTrebleStaffCards(6, lessonSixNoteIds),
  7: createTrebleStaffCards(7, lessonSixNoteIds),
  8: createTrebleStaffCards(8, lessonEightNoteIds),
  9: createTrebleStaffCards(9, lessonEightNoteIds),
  10: createTrebleStaffCards(10, lessonTenNoteIds),
  11: createTrebleStaffCards(11, lessonTenNoteIds),
  12: createTrebleStaffCards(12, lessonTwelveNoteIds),
  13: createTrebleStaffCards(13, lessonTwelveNoteIds),
  14: createTrebleStaffCards(14, lessonFourteenNoteIds),
  15: createTrebleStaffCards(15, lessonFourteenNoteIds),
  16: createTrebleStaffCards(16, lessonSixteenNoteIds),
  17: createTrebleStaffCards(17, lessonSixteenNoteIds),
};

export const pianoLessons: readonly PianoLessonDefinition[] = [
  {
    id: 1,
    title: "White key names",
    description: "Identify C through B on the keyboard. Each note name appears three times in a shuffled 21-card deck.",
    libraryDescription: "21 shuffled cards. C through B appears three times.",
    completionDescription: "You finished every white-key card in Lesson 1.",
    exerciseMode: "key-name",
    prompt: "Which note is highlighted?",
    answerChoices: pitchNames,
    cardCount: lessonCards[1].length,
    focusLabel: "Notes",
    focusCount: lessonOneNoteNames.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 2,
    title: "Black key names",
    description: "Identify the five black-key names. Each note name appears four times across the keyboard in a shuffled 20-card deck.",
    libraryDescription: "20 shuffled cards. Each black-key name appears four times.",
    completionDescription: "You finished every black-key card in Lesson 2.",
    exerciseMode: "key-name",
    prompt: "Which note is highlighted?",
    answerChoices: pitchNames,
    cardCount: lessonCards[2].length,
    focusLabel: "Notes",
    focusCount: lessonTwoNoteNames.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 3,
    title: "All key names",
    description: "Identify all 12 note names across the keyboard. Each note name appears once in each octave in a shuffled 36-card deck.",
    libraryDescription: "36 shuffled cards. Each note name appears three times.",
    completionDescription: "You finished every white-key and black-key card in Lesson 3.",
    exerciseMode: "key-name",
    prompt: "Which note is highlighted?",
    answerChoices: pitchNames,
    cardCount: lessonCards[3].length,
    focusLabel: "Notes",
    focusCount: lessonThreeNoteNames.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 4,
    title: "Treble spaces: F-A-C-E",
    description: "Read F4, A4, C5, and E5 in treble clef. Each note appears three times in a shuffled 12-card deck.",
    libraryDescription: "12 staff-to-note cards covering the F-A-C-E spaces.",
    completionDescription: "You read every F-A-C-E treble-clef card in Lesson 4.",
    exerciseMode: "staff-name",
    prompt: "Which note is on the staff?",
    answerChoices: pitchNames,
    cardCount: lessonCards[4].length,
    focusLabel: "Notes",
    focusCount: lessonFourNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 5,
    title: "Treble spaces to keys",
    description: "Read F4, A4, C5, and E5 in treble clef, then play the matching keyboard key. Each note appears three times.",
    libraryDescription: "12 staff-to-key cards covering the F-A-C-E spaces.",
    completionDescription: "You matched every F-A-C-E treble note to its piano key in Lesson 5.",
    exerciseMode: "staff-key",
    prompt: "Play this note on the keyboard.",
    answerChoices: pitchNames,
    cardCount: lessonCards[5].length,
    focusLabel: "Notes",
    focusCount: lessonFourNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 6,
    title: "Treble notes: C4-F4",
    description: "Read C4, D4, E4, and F4 in treble clef. Each note appears three times in a shuffled 12-card deck.",
    libraryDescription: "12 staff-to-note cards covering C4 through F4.",
    completionDescription: "You read every C4 through F4 treble-clef card in Lesson 6.",
    exerciseMode: "staff-name",
    prompt: "Which note is on the staff?",
    answerChoices: pitchNames,
    cardCount: lessonCards[6].length,
    focusLabel: "Notes",
    focusCount: lessonSixNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 7,
    title: "Treble notes to keys: C4-F4",
    description: "Read C4, D4, E4, and F4 in treble clef, then play the matching keyboard key. Each note appears three times.",
    libraryDescription: "12 staff-to-key cards covering C4 through F4.",
    completionDescription: "You matched every C4 through F4 treble note to its piano key in Lesson 7.",
    exerciseMode: "staff-key",
    prompt: "Play this note on the keyboard.",
    answerChoices: pitchNames,
    cardCount: lessonCards[7].length,
    focusLabel: "Notes",
    focusCount: lessonSixNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 8,
    title: "Treble notes: G4-C5",
    description: "Read G4, A4, B4, and C5 in treble clef. Each note appears three times in a shuffled 12-card deck.",
    libraryDescription: "12 staff-to-note cards covering G4 through C5.",
    completionDescription: "You read every G4 through C5 treble-clef card in Lesson 8.",
    exerciseMode: "staff-name",
    prompt: "Which note is on the staff?",
    answerChoices: pitchNames,
    cardCount: lessonCards[8].length,
    focusLabel: "Notes",
    focusCount: lessonEightNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 9,
    title: "Treble notes to keys: G4-C5",
    description: "Read G4, A4, B4, and C5 in treble clef, then play the matching keyboard key. Each note appears three times.",
    libraryDescription: "12 staff-to-key cards covering G4 through C5.",
    completionDescription: "You matched every G4 through C5 treble note to its piano key in Lesson 9.",
    exerciseMode: "staff-key",
    prompt: "Play this note on the keyboard.",
    answerChoices: pitchNames,
    cardCount: lessonCards[9].length,
    focusLabel: "Notes",
    focusCount: lessonEightNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 10,
    title: "Treble white notes: C4-C5",
    description: "Read every white-key note from C4 through C5 in treble clef. Each note appears three times in a shuffled 24-card deck.",
    libraryDescription: "24 staff-to-note cards covering every white key from C4 to C5.",
    completionDescription: "You read every white-key treble note from C4 through C5 in Lesson 10.",
    exerciseMode: "staff-name",
    prompt: "Which note is on the staff?",
    answerChoices: pitchNames,
    cardCount: lessonCards[10].length,
    focusLabel: "Notes",
    focusCount: lessonTenNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 11,
    title: "Treble white notes to keys",
    description: "Read every white-key note from C4 through C5 in treble clef, then play the matching keyboard key. Each note appears three times.",
    libraryDescription: "24 staff-to-key cards covering every white key from C4 to C5.",
    completionDescription: "You matched every C4 through C5 treble note to its piano key in Lesson 11.",
    exerciseMode: "staff-key",
    prompt: "Play this note on the keyboard.",
    answerChoices: pitchNames,
    cardCount: lessonCards[11].length,
    focusLabel: "Notes",
    focusCount: lessonTenNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 12,
    title: "Treble notes: C5-F5",
    description: "Read C5, D5, E5, and F5 in treble clef. Each note appears three times in a shuffled 12-card deck.",
    libraryDescription: "12 staff-to-note cards covering C5 through F5.",
    completionDescription: "You read every C5 through F5 treble-clef card in Lesson 12.",
    exerciseMode: "staff-name",
    prompt: "Which note is on the staff?",
    answerChoices: pitchNames,
    cardCount: lessonCards[12].length,
    focusLabel: "Notes",
    focusCount: lessonTwelveNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 13,
    title: "Treble notes to keys: C5-F5",
    description: "Read C5, D5, E5, and F5 in treble clef, then play the matching keyboard key. Each note appears three times.",
    libraryDescription: "12 staff-to-key cards covering C5 through F5.",
    completionDescription: "You matched every C5 through F5 treble note to its piano key in Lesson 13.",
    exerciseMode: "staff-key",
    prompt: "Play this note on the keyboard.",
    answerChoices: pitchNames,
    cardCount: lessonCards[13].length,
    focusLabel: "Notes",
    focusCount: lessonTwelveNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 14,
    title: "Treble notes: G5-C6",
    description: "Read G5, A5, B5, and C6 in treble clef. Each note appears three times in a shuffled 12-card deck.",
    libraryDescription: "12 staff-to-note cards covering G5 through C6.",
    completionDescription: "You read every G5 through C6 treble-clef card in Lesson 14.",
    exerciseMode: "staff-name",
    prompt: "Which note is on the staff?",
    answerChoices: pitchNames,
    cardCount: lessonCards[14].length,
    focusLabel: "Notes",
    focusCount: lessonFourteenNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 15,
    title: "Treble notes to keys: G5-C6",
    description: "Read G5, A5, B5, and C6 in treble clef, then play the matching keyboard key. Each note appears three times.",
    libraryDescription: "12 staff-to-key cards covering G5 through C6.",
    completionDescription: "You matched every G5 through C6 treble note to its piano key in Lesson 15.",
    exerciseMode: "staff-key",
    prompt: "Play this note on the keyboard.",
    answerChoices: pitchNames,
    cardCount: lessonCards[15].length,
    focusLabel: "Notes",
    focusCount: lessonFourteenNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 16,
    title: "Treble white notes to keys: C4-C6",
    description: "Read every white-key note from C4 through C6 in treble clef, then play the matching keyboard key. Each note appears three times.",
    libraryDescription: "45 staff-to-key cards covering every white key from C4 to C6.",
    completionDescription: "You matched every C4 through C6 treble note to its piano key in Lesson 16.",
    exerciseMode: "staff-key",
    prompt: "Play this note on the keyboard.",
    answerChoices: pitchNames,
    cardCount: lessonCards[16].length,
    focusLabel: "Notes",
    focusCount: lessonSixteenNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
  {
    id: 17,
    title: "Treble white notes: C4-C6",
    description: "Read every white-key note from C4 through C6 in treble clef. Each note appears three times in a shuffled 45-card deck.",
    libraryDescription: "45 staff-to-note cards covering every white key from C4 to C6.",
    completionDescription: "You read every white-key treble note from C4 through C6 in Lesson 17.",
    exerciseMode: "staff-name",
    prompt: "Which note is on the staff?",
    answerChoices: pitchNames,
    cardCount: lessonCards[17].length,
    focusLabel: "Notes",
    focusCount: lessonSixteenNoteIds.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
];

const pianoLessonsById = new Map(pianoLessons.map((lesson) => [lesson.id, lesson]));

if (
  pianoLessonsById.size !== pianoLessonIds.length
  || pianoLessonIds.some((lessonId) => !pianoLessonsById.has(lessonId))
) {
  throw new Error("Piano lesson definitions must include every lesson ID exactly once");
}

for (const lesson of pianoLessons) {
  if (lessonCards[lesson.id].length !== lesson.cardCount) {
    throw new Error(`Lesson ${lesson.id} card count does not match its definition`);
  }
}

export function getPianoLesson(lessonId: PianoLessonId) {
  const lesson = pianoLessonsById.get(lessonId);
  if (!lesson) throw new Error(`Unknown piano lesson: ${lessonId}`);
  return lesson;
}

const pianoLessonGroupSpecs = [
  {
    id: "keyboard-map",
    title: "Keyboard map",
    description: "Build quick recognition across white keys, black keys, and the full keyboard.",
    lessonIds: [1, 2, 3],
  },
  {
    id: "treble-foundations",
    title: "Treble foundations",
    description: "Connect the staff to note names and piano keys from C4 through C5.",
    lessonIds: [4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: "upper-treble",
    title: "Upper treble",
    description: "Extend staff reading through the upper register from C5 to C6.",
    lessonIds: [12, 13, 14, 15],
  },
  {
    id: "full-range",
    title: "Full range",
    description: "Bring the complete C4 to C6 white-key range together.",
    lessonIds: [16, 17],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  description: string;
  lessonIds: readonly PianoLessonId[];
}>;

const groupedLessonIds = pianoLessonGroupSpecs.flatMap((group) => group.lessonIds);
if (
  new Set(groupedLessonIds).size !== pianoLessonIds.length
  || pianoLessonIds.some((lessonId) => !groupedLessonIds.includes(lessonId))
) {
  throw new Error("Piano lesson groups must include every lesson exactly once");
}

export const pianoLessonGroups: readonly PianoLessonGroupDefinition[] = pianoLessonGroupSpecs.map((group) => ({
  id: group.id,
  title: group.title,
  description: group.description,
  lessons: group.lessonIds.map(getPianoLesson),
}));

// Lessons 1-3 retain their original explicit routes. Later lessons share the
// dynamic route, so both the canonical and legacy routes use this same list.
export const dynamicPianoLessonIds = pianoLessonIds.filter((lessonId) => lessonId >= 4);

export function createPianoLessonDeck(
  lessonId: PianoLessonId,
  random: () => number = Math.random,
) {
  const shuffledCards = [...lessonCards[lessonId]];

  for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
    const randomValue = Math.min(0.999999999, Math.max(0, random()));
    const swapIndex = Math.floor(randomValue * (index + 1));
    [shuffledCards[index], shuffledCards[swapIndex]] = [shuffledCards[swapIndex], shuffledCards[index]];
  }

  const cardGroups = new Map<string, PianoLessonCard[]>();
  for (const card of shuffledCards) {
    const questionKey = lessonPerformanceKey(lessonId, card);
    const group = cardGroups.get(questionKey) ?? [];
    group.push(card);
    cardGroups.set(questionKey, group);
  }

  const deck: PianoLessonCard[] = [];
  let previousQuestionKey: string | null = null;

  while (deck.length < shuffledCards.length) {
    const eligibleGroups = [...cardGroups.entries()].filter(([
      questionKey,
      cards,
    ]) => questionKey !== previousQuestionKey && cards.length > 0);

    if (eligibleGroups.length === 0) {
      throw new Error(`Unable to separate repeated notes in Lesson ${lessonId}`);
    }

    const largestGroupSize = Math.max(...eligibleGroups.map(([, cards]) => cards.length));
    const largestGroups = eligibleGroups.filter(([, cards]) => cards.length === largestGroupSize);
    const randomValue = Math.min(0.999999999, Math.max(0, random()));
    const groupIndex = Math.floor(randomValue * largestGroups.length);
    const [questionKey, cards] = largestGroups[groupIndex];
    const nextCard = cards.pop();

    if (!nextCard) throw new Error(`Missing lesson card for ${questionKey}`);
    deck.push(nextCard);
    previousQuestionKey = questionKey;
  }

  return deck;
}

export function createLessonOneDeck(random: () => number = Math.random) {
  return createPianoLessonDeck(1, random);
}

export function lessonPerformanceKey(lessonId: PianoLessonId, card: PianoLessonCard) {
  return getPianoLesson(lessonId).exerciseMode === "key-name" ? card.note.name : card.note.id;
}

export function rankPianoLessonPerformance(
  lessonId: PianoLessonId,
  performance: LessonNotePerformanceMap,
) {
  const orderedKeys = [...new Set(lessonCards[lessonId].map((card) => lessonPerformanceKey(lessonId, card)))];

  return orderedKeys
    .map((performanceKey, lessonOrder) => {
      const notePerformance = performance[performanceKey] ?? {
        attempts: 0,
        mistakes: 0,
        totalRecognitionMs: 0,
      };

      return {
        noteName: performanceKey,
        attempts: notePerformance.attempts,
        mistakes: notePerformance.mistakes,
        averageRecognitionMs: notePerformance.attempts === 0
          ? 0
          : Math.round(notePerformance.totalRecognitionMs / notePerformance.attempts),
        lessonOrder,
      };
    })
    .sort((left, right) => (
      right.mistakes - left.mistakes
      || right.averageRecognitionMs - left.averageRecognitionMs
      || left.lessonOrder - right.lessonOrder
    ))
    .map(({ noteName, attempts, mistakes, averageRecognitionMs }) => ({
      noteName,
      attempts,
      mistakes,
      averageRecognitionMs,
    }));
}

export function lessonAccuracy(correct: number, total: number) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function rankLessonNotePerformance(
  lessonNoteNames: readonly PitchName[],
  performance: LessonNotePerformanceMap,
) {
  const includedNoteNames = new Set(lessonNoteNames);

  return pitchNames
    .filter((noteName) => includedNoteNames.has(noteName))
    .map((noteName, chromaticIndex) => {
      const notePerformance = performance[noteName] ?? {
        attempts: 0,
        mistakes: 0,
        totalRecognitionMs: 0,
      };

      return {
        noteName,
        attempts: notePerformance.attempts,
        mistakes: notePerformance.mistakes,
        averageRecognitionMs: notePerformance.attempts === 0
          ? 0
          : Math.round(notePerformance.totalRecognitionMs / notePerformance.attempts),
        chromaticIndex,
      };
    })
    .sort((left, right) => (
      right.mistakes - left.mistakes
      || right.averageRecognitionMs - left.averageRecognitionMs
      || left.chromaticIndex - right.chromaticIndex
    ))
    .map(({ noteName, attempts, mistakes, averageRecognitionMs }) => ({
      noteName,
      attempts,
      mistakes,
      averageRecognitionMs,
    }));
}

export function formatRecognitionTime(elapsedMs: number) {
  const seconds = Math.max(0, elapsedMs) / 1000;
  return `${seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1)}s`;
}

export function formatLessonTime(elapsedMs: number) {
  const totalTenths = Math.max(0, Math.floor(elapsedMs / 100));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
}
