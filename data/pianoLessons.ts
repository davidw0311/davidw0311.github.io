import {
  blackKeys,
  naturalNoteNames,
  pianoNotes,
  pitchNames,
  whiteKeys,
  type PianoNote,
  type PitchName,
} from "./pianoNotes.ts";

export type PianoLessonId = 1 | 2 | 3;

export type PianoLessonCard = {
  id: string;
  note: PianoNote;
};

export type LessonNotePerformance = {
  attempts: number;
  mistakes: number;
  totalRecognitionMs: number;
};

export type LessonNotePerformanceMap = Partial<Record<PitchName, LessonNotePerformance>>;

export type PianoLessonDefinition = {
  id: PianoLessonId;
  title: string;
  description: string;
  libraryDescription: string;
  completionDescription: string;
  answerChoices: readonly PitchName[];
  cardCount: number;
  focusLabel: string;
  focusCount: number;
  desktopChoiceColumns: number;
  mobileChoiceColumns: number;
};

export const lessonOneNoteNames: PitchName[] = [...naturalNoteNames];
export const lessonOneCardCount = lessonOneNoteNames.length * 3;
export const lessonTwoNoteNames = pitchNames.filter((name) => blackKeys.some((note) => note.name === name));
export const lessonThreeNoteNames: PitchName[] = [...pitchNames];

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

const lessonCards: Record<PianoLessonId, PianoLessonCard[]> = {
  1: lessonOneCards,
  2: repeatNoteNames(2, lessonTwoNoteNames, blackKeys, 4),
  3: repeatNoteNames(3, lessonThreeNoteNames, pianoNotes, 3),
};

export const pianoLessons: readonly PianoLessonDefinition[] = [
  {
    id: 1,
    title: "White key names",
    description: "Identify C through B on the keyboard. Each note name appears three times in a shuffled 21-card deck.",
    libraryDescription: "21 shuffled cards. C through B appears three times.",
    completionDescription: "You finished every white-key card in Lesson 1.",
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
    answerChoices: pitchNames,
    cardCount: lessonCards[3].length,
    focusLabel: "Notes",
    focusCount: lessonThreeNoteNames.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
  },
];

export function getPianoLesson(lessonId: PianoLessonId) {
  const lesson = pianoLessons.find(({ id }) => id === lessonId);
  if (!lesson) throw new Error(`Unknown piano lesson: ${lessonId}`);
  return lesson;
}

export function createPianoLessonDeck(
  lessonId: PianoLessonId,
  random: () => number = Math.random,
) {
  const deck = [...lessonCards[lessonId]];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomValue = Math.min(0.999999999, Math.max(0, random()));
    const swapIndex = Math.floor(randomValue * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

export function createLessonOneDeck(random: () => number = Math.random) {
  return createPianoLessonDeck(1, random);
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
