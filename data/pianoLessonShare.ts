export type PianoLessonShareResult = {
  lessonId: number;
  lessonTitle: string;
  playerName: string;
  elapsedTime: string;
  correctCount: number;
  cardCount: number;
  accuracy: number;
};

export function pianoLessonShareFileName(lessonId: number) {
  return `piano-party-lesson-${lessonId}.png`;
}

export function pianoLessonShareText(result: PianoLessonShareResult) {
  const perfectMessage = result.correctCount === result.cardCount
    ? " A perfect run!"
    : "";

  return `I completed Piano Party Lesson ${result.lessonId} with ${result.accuracy}% accuracy in ${result.elapsedTime}.${perfectMessage}`;
}
