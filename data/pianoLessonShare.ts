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
  performanceLabel?: "Note" | "Chord";
  noteResults: PianoLessonShareNoteResult[];
};

export function pianoLessonShareFileName(lessonId: number) {
  return `piano-party-lesson-${lessonId}.png`;
}

export function pianoLessonShareText(result: PianoLessonShareResult) {
  const mistakeCount = pianoLessonShareMistakeCount(result);
  const reportSubject = pianoLessonSharePerformanceLabel(result).toLowerCase();
  const perfectMessage = result.correctCount === result.cardCount
    ? " A perfect run!"
    : ` The ${reportSubject} report includes ${mistakeCount} ${mistakeCount === 1 ? "mistake" : "mistakes"}.`;

  return `I completed Piano Party Lesson ${result.lessonId} with ${result.accuracy}% accuracy in ${result.elapsedTime}.${perfectMessage}`;
}

export function pianoLessonShareMistakeCount(result: PianoLessonShareResult) {
  return result.noteResults.reduce((total, note) => total + note.mistakes, 0);
}

export function pianoLessonSharePerformanceLabel(result: PianoLessonShareResult) {
  return result.performanceLabel ?? "Note";
}
