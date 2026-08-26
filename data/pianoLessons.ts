import {
  naturalNoteNames,
  whiteKeys,
  type NaturalNoteName,
  type PianoNote,
} from "./pianoNotes.ts";

export type PianoLessonCard = {
  id: string;
  note: PianoNote;
};

export const lessonOneNoteNames: NaturalNoteName[] = [...naturalNoteNames];
export const lessonOneCardCount = lessonOneNoteNames.length * 3;

const lessonOneCards: PianoLessonCard[] = lessonOneNoteNames.flatMap((name) => {
  const matchingKeys = whiteKeys.filter((note) => note.name === name);
  return Array.from({ length: 3 }, (_, repeatIndex) => ({
    id: `lesson-one-${name}-${repeatIndex + 1}`,
    note: matchingKeys[repeatIndex % matchingKeys.length],
  }));
});

export function createLessonOneDeck(random: () => number = Math.random) {
  const deck = [...lessonOneCards];

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomValue = Math.min(0.999999999, Math.max(0, random()));
    const swapIndex = Math.floor(randomValue * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

export function lessonAccuracy(correct: number, total: number) {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function formatLessonTime(elapsedMs: number) {
  const totalTenths = Math.max(0, Math.floor(elapsedMs / 100));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
}
