export type PianoLessonShareNoteResult = {
  noteName: string;
  mistakes: number;
  averageRecognitionTime: string;
  attempts: number;
};

export type PianoLessonShareResult = {
  lessonId: number;
  lessonTitle: string;
  playerName: string;
  elapsedTime: string;
  correctCount: number;
  cardCount: number;
  accuracy: number;
  noteResults: PianoLessonShareNoteResult[];
};

export function pianoLessonShareFileName(lessonId: number) {
  return `piano-party-lesson-${lessonId}.png`;
}

export function pianoLessonShareText(result: PianoLessonShareResult) {
  const mistakeCount = pianoLessonShareMistakeCount(result);
  const perfectMessage = result.correctCount === result.cardCount
    ? " A perfect run!"
    : ` The note report includes ${mistakeCount} ${mistakeCount === 1 ? "mistake" : "mistakes"}.`;

  return `I completed Piano Party Lesson ${result.lessonId} with ${result.accuracy}% accuracy in ${result.elapsedTime}.${perfectMessage}`;
}

export function pianoLessonShareMistakeCount(result: PianoLessonShareResult) {
  return result.noteResults.reduce((total, note) => total + note.mistakes, 0);
}
