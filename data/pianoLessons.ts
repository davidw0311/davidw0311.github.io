import {
  accidentalSymbol,
  blackKeys,
  formatNotation,
  naturalNoteNames,
  pianoChords,
  pianoNotes,
  pitchNames,
  whiteKeys,
  type PianoChord,
  type PianoChordExerciseMode,
  type PianoExerciseMode,
  type PianoNote,
  type PianoKeySignature,
  type PitchName,
  type NaturalNoteName,
  type StaffClef,
  type StaffNotation,
} from "./pianoNotes.ts";

export const pianoLessonIds = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 16, 17,
  18, 19, 20, 21, 22, 23, 24, 25, 26,
  27, 28, 29, 30, 31, 32, 33, 34, 35,
  36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
] as const;

export type PianoLessonId = (typeof pianoLessonIds)[number];

export type PianoLessonCard = {
  id: string;
  note: PianoNote;
  chord?: PianoChord;
  exerciseMode?: PianoChordExerciseMode;
  clef?: StaffClef;
  notation?: StaffNotation;
};

export type PianoLessonExerciseMode = PianoExerciseMode | "chord-mixed";

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
  exerciseMode: PianoLessonExerciseMode;
  prompt: string;
  answerChoices: readonly PitchName[];
  cardCount: number;
  focusLabel: string;
  focusCount: number;
  desktopChoiceColumns: number;
  mobileChoiceColumns: number;
  chords?: readonly PianoChord[];
  answerChords?: readonly PianoChord[];
  keySignature?: PianoKeySignature;
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

const sharpOrder: readonly NaturalNoteName[] = ["F", "C", "G", "D", "A", "E", "B"];
const flatOrder: readonly NaturalNoteName[] = ["B", "E", "A", "D", "G", "C", "F"];
const sharpMajorKeys = ["G major", "D major", "A major", "E major", "B major", "F♯ major", "C♯ major"] as const;
const flatMajorKeys = ["F major", "B♭ major", "E♭ major", "A♭ major", "D♭ major", "G♭ major", "C♭ major"] as const;

export const majorKeySignatureLessons = Array.from({ length: 7 }, (_, index) => {
  const accidentalCount = index + 1;
  return [
    {
      lessonId: (18 + index * 2) as PianoLessonId,
      keySignature: {
        name: sharpMajorKeys[index],
        accidental: "sharp" as const,
        count: accidentalCount,
        alteredNotes: sharpOrder.slice(0, accidentalCount),
      },
    },
    {
      lessonId: (19 + index * 2) as PianoLessonId,
      keySignature: {
        name: flatMajorKeys[index],
        accidental: "flat" as const,
        count: accidentalCount,
        alteredNotes: flatOrder.slice(0, accidentalCount),
      },
    },
  ];
}).flat();

export const majorChordLessonGroups = [
  { label: "C → F → G → D", chordIds: ["C4-major", "F4-major", "G4-major", "D4-major"] },
  { label: "A → E → B♭ → E♭", chordIds: ["A4-major", "E4-major", "A#4-major", "D#4-major"] },
  { label: "B → D♭ → A♭ → G♭", chordIds: ["B4-major", "C#4-major", "G#4-major", "F#4-major"] },
] as const;

export const minorChordLessonGroups = [
  { label: "Am → Dm → Em → Cm", chordIds: ["A4-minor", "D4-minor", "E4-minor", "C4-minor"] },
  { label: "Gm → Fm → Bm → F♯m", chordIds: ["G4-minor", "F4-minor", "B4-minor", "F#4-minor"] },
  { label: "C♯m → G♯m → B♭m → E♭m", chordIds: ["C#4-minor", "G#4-minor", "A#4-minor", "D#4-minor"] },
] as const;

function chordsById(chordIds: readonly string[]) {
  return chordIds.map((chordId) => {
    const chord = pianoChords.find((candidate) => candidate.id === chordId);
    if (!chord) throw new Error(`No piano chord available for ${chordId}`);
    return chord;
  });
}

export const allMajorLessonChords = chordsById(majorChordLessonGroups.flatMap((group) => group.chordIds));
export const allMinorLessonChords = chordsById(minorChordLessonGroups.flatMap((group) => group.chordIds));

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

const naturalSemitoneByName: Record<NaturalNoteName, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function createKeySignatureCards(
  lessonId: PianoLessonId,
  keySignature: PianoKeySignature,
) {
  const writtenNotes = [3, 4, 5, 6].flatMap((octave) => (
    naturalNoteNames
      .filter((name) => octave < 6 || name === "C")
      .map((name): StaffNotation => ({
        name,
        octave,
        accidental: keySignature.alteredNotes.includes(name) ? keySignature.accidental : null,
      }))
  ));

  return writtenNotes.flatMap((notation) => {
    const accidentalOffset = notation.accidental === "sharp" ? 1 : notation.accidental === "flat" ? -1 : 0;
    const midi = 12 * (notation.octave + 1) + naturalSemitoneByName[notation.name] + accidentalOffset;
    const note = pianoNotes.find((candidate) => candidate.midi === midi);

    // C3-C6 describes the physical keyboard range. Edge spellings such as
    // C-flat 3 and C-sharp 6 sit just outside it and are intentionally omitted.
    if (!note) return [];

    const repeatCount = notation.accidental ? 6 : 3;
    return Array.from({ length: repeatCount }, (_, repeatIndex) => ({
      id: `lesson-${lessonId}-${formatNotation(notation, true)}-${repeatIndex + 1}`,
      note,
      clef: notation.octave < 4 ? "bass" as const : "treble" as const,
      notation,
    }));
  });
}

function createChordCards(
  lessonId: PianoLessonId,
  chords: readonly PianoChord[],
  exerciseMode: PianoChordExerciseMode,
  repeatCount = 3,
) {
  return chords.flatMap((chord) => (
    Array.from({ length: repeatCount }, (_, repeatIndex) => ({
      id: `lesson-${lessonId}-${chord.id}-${exerciseMode}-${repeatIndex + 1}`,
      note: chord.root,
      chord,
      exerciseMode,
    }))
  ));
}

const majorChordGroups = majorChordLessonGroups.map((group) => chordsById(group.chordIds));
const minorChordGroups = minorChordLessonGroups.map((group) => chordsById(group.chordIds));

const lessonCards = Object.fromEntries([
  [1, lessonOneCards],
  [2, repeatNoteNames(2, lessonTwoNoteNames, blackKeys, 4)],
  [3, repeatNoteNames(3, lessonThreeNoteNames, pianoNotes, 3)],
  [4, createTrebleStaffCards(4, lessonFourNoteIds)],
  [5, createTrebleStaffCards(5, lessonFourNoteIds)],
  [6, createTrebleStaffCards(6, lessonSixNoteIds)],
  [7, createTrebleStaffCards(7, lessonSixNoteIds)],
  [8, createTrebleStaffCards(8, lessonEightNoteIds)],
  [9, createTrebleStaffCards(9, lessonEightNoteIds)],
  [10, createTrebleStaffCards(10, lessonTenNoteIds)],
  [11, createTrebleStaffCards(11, lessonTenNoteIds)],
  [12, createTrebleStaffCards(12, lessonTwelveNoteIds)],
  [13, createTrebleStaffCards(13, lessonTwelveNoteIds)],
  [14, createTrebleStaffCards(14, lessonFourteenNoteIds)],
  [15, createTrebleStaffCards(15, lessonFourteenNoteIds)],
  [16, createTrebleStaffCards(16, lessonSixteenNoteIds)],
  [17, createTrebleStaffCards(17, lessonSixteenNoteIds)],
  ...majorKeySignatureLessons.map(({ lessonId, keySignature }) => (
    [lessonId, createKeySignatureCards(lessonId, keySignature)] as const
  )),
  [32, createChordCards(32, majorChordGroups[0], "chord-name")],
  [33, createChordCards(33, majorChordGroups[0], "chord-key")],
  [34, createChordCards(34, majorChordGroups[1], "chord-name")],
  [35, createChordCards(35, majorChordGroups[1], "chord-key")],
  [36, createChordCards(36, majorChordGroups[2], "chord-name")],
  [37, createChordCards(37, majorChordGroups[2], "chord-key")],
  [38, [
    ...createChordCards(38, allMajorLessonChords, "chord-key", 1),
    ...createChordCards(38, allMajorLessonChords, "chord-name", 1),
  ]],
  [39, createChordCards(39, minorChordGroups[0], "chord-name")],
  [40, createChordCards(40, minorChordGroups[0], "chord-key")],
  [41, createChordCards(41, minorChordGroups[1], "chord-name")],
  [42, createChordCards(42, minorChordGroups[1], "chord-key")],
  [43, createChordCards(43, minorChordGroups[2], "chord-name")],
  [44, createChordCards(44, minorChordGroups[2], "chord-key")],
  [45, [
    ...createChordCards(45, allMinorLessonChords, "chord-key", 1),
    ...createChordCards(45, allMinorLessonChords, "chord-name", 1),
  ]],
]) as Record<PianoLessonId, PianoLessonCard[]>;

function createChordLessonDefinition(
  id: PianoLessonId,
  title: string,
  libraryDescription: string,
  exerciseMode: PianoLessonExerciseMode,
  chords: readonly PianoChord[],
): PianoLessonDefinition {
  const qualityName = chords[0]?.quality ?? "chord";
  const answerChords = pianoChords.filter((chord) => chord.quality === qualityName);
  const direction = exerciseMode === "chord-key"
    ? "Read each chord name, then build it on the keyboard."
    : exerciseMode === "chord-name"
      ? "Read the highlighted piano keys, then choose the chord name."
      : "Alternate between building chords and recognizing highlighted chord shapes.";

  return {
    id,
    title,
    description: `${direction} This timed lesson covers ${chords.length} ${qualityName} chords in a shuffled ${lessonCards[id].length}-card deck.`,
    libraryDescription,
    completionDescription: `You completed every ${qualityName}-chord card in Lesson ${id}.`,
    exerciseMode,
    prompt: exerciseMode === "chord-key"
      ? "Build this chord on the keyboard."
      : exerciseMode === "chord-name"
        ? "Which chord is highlighted?"
        : "Build or recognize this chord.",
    answerChoices: pitchNames,
    cardCount: lessonCards[id].length,
    focusLabel: "Chords",
    focusCount: chords.length,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
    chords,
    answerChords,
  };
}

function keySignatureLessonDefinition(
  lessonId: PianoLessonId,
  keySignature: PianoKeySignature,
): PianoLessonDefinition {
  const accidentalName = keySignature.accidental === "sharp" ? "sharp" : "flat";
  const pluralAccidentalName = `${accidentalName}${keySignature.count === 1 ? "" : "s"}`;
  const emphasizedNotes = keySignature.alteredNotes
    .map((name) => `${name}${accidentalSymbol(keySignature.accidental)}`)
    .join(", ");
  const uniqueWrittenNotes = new Set(
    lessonCards[lessonId].map((card) => card.notation && formatNotation(card.notation, true)),
  ).size;

  return {
    id: lessonId,
    title: `${keySignature.count} ${pluralAccidentalName}: ${keySignature.name}`,
    description: `Read and play ${keySignature.name} across the C3-C6 keyboard range. ${emphasizedNotes} ${keySignature.alteredNotes.length === 1 ? "appears" : "appear"} six times per written pitch; every other note appears three times.`,
    libraryDescription: `${lessonCards[lessonId].length} staff-to-key cards across C3-C6, emphasizing ${emphasizedNotes}.`,
    completionDescription: `You read and played the complete ${keySignature.name} key signature across the C3-C6 range in Lesson ${lessonId}.`,
    exerciseMode: "staff-key",
    prompt: `Play the note in ${keySignature.name}.`,
    answerChoices: pitchNames,
    cardCount: lessonCards[lessonId].length,
    focusLabel: "Written notes",
    focusCount: uniqueWrittenNotes,
    desktopChoiceColumns: 6,
    mobileChoiceColumns: 4,
    keySignature,
  };
}

const keySignatureLessonDefinitions = majorKeySignatureLessons.map(({ lessonId, keySignature }) => (
  keySignatureLessonDefinition(lessonId, keySignature)
));

const chordLessonDefinitions: readonly PianoLessonDefinition[] = [
  createChordLessonDefinition(32, "Recognize major chords: C-F-G-D", "12 chord-to-name cards for C, F, G, and D major.", "chord-name", majorChordGroups[0]),
  createChordLessonDefinition(33, "Build major chords: C-F-G-D", "12 name-to-chord cards for C, F, G, and D major.", "chord-key", majorChordGroups[0]),
  createChordLessonDefinition(34, "Recognize major chords: A-E-B♭-E♭", "12 chord-to-name cards for A, E, B♭, and E♭ major.", "chord-name", majorChordGroups[1]),
  createChordLessonDefinition(35, "Build major chords: A-E-B♭-E♭", "12 name-to-chord cards for A, E, B♭, and E♭ major.", "chord-key", majorChordGroups[1]),
  createChordLessonDefinition(36, "Recognize major chords: B-D♭-A♭-G♭", "12 chord-to-name cards for B, D♭, A♭, and G♭ major.", "chord-name", majorChordGroups[2]),
  createChordLessonDefinition(37, "Build major chords: B-D♭-A♭-G♭", "12 name-to-chord cards for B, D♭, A♭, and G♭ major.", "chord-key", majorChordGroups[2]),
  createChordLessonDefinition(38, "All major chords", "24 mixed cards covering every major chord in both directions.", "chord-mixed", allMajorLessonChords),
  createChordLessonDefinition(39, "Recognize minor chords: Am-Dm-Em-Cm", "12 chord-to-name cards for Am, Dm, Em, and Cm.", "chord-name", minorChordGroups[0]),
  createChordLessonDefinition(40, "Build minor chords: Am-Dm-Em-Cm", "12 name-to-chord cards for Am, Dm, Em, and Cm.", "chord-key", minorChordGroups[0]),
  createChordLessonDefinition(41, "Recognize minor chords: Gm-Fm-Bm-F♯m", "12 chord-to-name cards for Gm, Fm, Bm, and F♯m.", "chord-name", minorChordGroups[1]),
  createChordLessonDefinition(42, "Build minor chords: Gm-Fm-Bm-F♯m", "12 name-to-chord cards for Gm, Fm, Bm, and F♯m.", "chord-key", minorChordGroups[1]),
  createChordLessonDefinition(43, "Recognize minor chords: C♯m-G♯m-B♭m-E♭m", "12 chord-to-name cards for C♯m, G♯m, B♭m, and E♭m.", "chord-name", minorChordGroups[2]),
  createChordLessonDefinition(44, "Build minor chords: C♯m-G♯m-B♭m-E♭m", "12 name-to-chord cards for C♯m, G♯m, B♭m, and E♭m.", "chord-key", minorChordGroups[2]),
  createChordLessonDefinition(45, "All minor chords", "24 mixed cards covering every minor chord in both directions.", "chord-mixed", allMinorLessonChords),
];

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
  ...keySignatureLessonDefinitions,
  ...chordLessonDefinitions,
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

  if (lesson.chords && lessonCards[lesson.id].some((card) => (
    !card.chord || !card.exerciseMode || !lesson.chords?.some((chord) => chord.id === card.chord?.id)
  ))) {
    throw new Error(`Lesson ${lesson.id} contains an invalid chord card`);
  }

  if (lesson.chords && (
    !lesson.answerChords
    || lesson.chords.some((chord) => !lesson.answerChords?.some((answer) => answer.id === chord.id))
  )) {
    throw new Error(`Lesson ${lesson.id} is missing chord answer choices`);
  }
}

export function getPianoLesson(lessonId: PianoLessonId) {
  const lesson = pianoLessonsById.get(lessonId);
  if (!lesson) throw new Error(`Unknown piano lesson: ${lessonId}`);
  return lesson;
}

export function getNextPianoLessonId(lessonId: PianoLessonId): PianoLessonId | null {
  const lessonIndex = pianoLessonIds.indexOf(lessonId);
  return pianoLessonIds[lessonIndex + 1] ?? null;
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
  {
    id: "key-signatures",
    title: "Major key signatures",
    description: "Learn every sharp and flat major key signature across the full C3-C6 keyboard range.",
    lessonIds: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
  },
  {
    id: "major-chords",
    title: "Major chords",
    description: "Build and recognize the complete set of 12 major triads.",
    lessonIds: [32, 33, 34, 35, 36, 37, 38],
  },
  {
    id: "minor-chords",
    title: "Minor chords",
    description: "Build and recognize the complete set of 12 minor triads.",
    lessonIds: [39, 40, 41, 42, 43, 44, 45],
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

export function lessonCardExerciseMode(lessonId: PianoLessonId, card: PianoLessonCard): PianoExerciseMode {
  const lessonMode = getPianoLesson(lessonId).exerciseMode;
  if (lessonMode === "chord-mixed") {
    if (!card.exerciseMode) throw new Error(`Lesson ${lessonId} chord card is missing its exercise mode`);
    return card.exerciseMode;
  }
  return lessonMode;
}

export function lessonPerformanceKey(lessonId: PianoLessonId, card: PianoLessonCard) {
  if (card.chord) return card.chord.name;
  if (getPianoLesson(lessonId).keySignature && card.notation) return formatNotation(card.notation, true);
  return lessonCardExerciseMode(lessonId, card) === "key-name" ? card.note.name : card.note.id;
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
