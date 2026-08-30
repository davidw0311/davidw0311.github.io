export type NaturalNoteName = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type Accidental = "sharp" | "flat" | null;
export type StaffClef = "treble" | "bass";
export type ClefFilter = "mixed" | StaffClef;
export type PianoNoteExerciseMode = "key-name" | "staff-name" | "staff-key";
export type PianoChordExerciseMode = "chord-name" | "chord-key";
export type PianoExerciseMode = PianoNoteExerciseMode | PianoChordExerciseMode;
export type PianoChordQuality = "major" | "minor";

type PitchDefinition = {
  key: string;
  name: string;
  semitone: number;
  spellings: ReadonlyArray<{ name: NaturalNoteName; accidental: Accidental }>;
};

const pitchClassDefinitions = [
  { key: "C", name: "C", semitone: 0, spellings: [{ name: "C", accidental: null }] },
  { key: "C#", name: "C♯/D♭", semitone: 1, spellings: [{ name: "C", accidental: "sharp" }, { name: "D", accidental: "flat" }] },
  { key: "D", name: "D", semitone: 2, spellings: [{ name: "D", accidental: null }] },
  { key: "D#", name: "D♯/E♭", semitone: 3, spellings: [{ name: "D", accidental: "sharp" }, { name: "E", accidental: "flat" }] },
  { key: "E", name: "E", semitone: 4, spellings: [{ name: "E", accidental: null }] },
  { key: "F", name: "F", semitone: 5, spellings: [{ name: "F", accidental: null }] },
  { key: "F#", name: "F♯/G♭", semitone: 6, spellings: [{ name: "F", accidental: "sharp" }, { name: "G", accidental: "flat" }] },
  { key: "G", name: "G", semitone: 7, spellings: [{ name: "G", accidental: null }] },
  { key: "G#", name: "G♯/A♭", semitone: 8, spellings: [{ name: "G", accidental: "sharp" }, { name: "A", accidental: "flat" }] },
  { key: "A", name: "A", semitone: 9, spellings: [{ name: "A", accidental: null }] },
  { key: "A#", name: "A♯/B♭", semitone: 10, spellings: [{ name: "A", accidental: "sharp" }, { name: "B", accidental: "flat" }] },
  { key: "B", name: "B", semitone: 11, spellings: [{ name: "B", accidental: null }] },
] as const satisfies ReadonlyArray<PitchDefinition>;

export type PitchName = (typeof pitchClassDefinitions)[number]["name"];

export type StaffNotation = {
  name: NaturalNoteName;
  octave: number;
  accidental: Accidental;
};

export type PianoNote = {
  id: string;
  name: PitchName;
  octave: number;
  midi: number;
  isBlack: boolean;
  afterWhiteIndex: number | null;
  spellings: StaffNotation[];
};

export type PianoQuestion = {
  id: string;
  note: PianoNote;
  clef?: StaffClef;
  notation?: StaffNotation;
};

export type PianoChord = {
  id: string;
  name: string;
  quality: PianoChordQuality;
  root: PianoNote;
  notes: readonly PianoNote[];
};

export const pitchNames = pitchClassDefinitions.map((pitch) => pitch.name);
export const naturalNoteNames: NaturalNoteName[] = ["C", "D", "E", "F", "G", "A", "B"];

let whiteKeyIndex = -1;

export const pianoNotes: PianoNote[] = [3, 4, 5]
  .flatMap((octave) => pitchClassDefinitions.map((pitch) => {
    const isBlack = pitch.spellings.length > 1;
    if (!isBlack) whiteKeyIndex += 1;

    return {
      id: `${pitch.key}${octave}`,
      name: pitch.name,
      octave,
      midi: 12 * (octave + 1) + pitch.semitone,
      isBlack,
      afterWhiteIndex: isBlack ? whiteKeyIndex : null,
      spellings: pitch.spellings.map((spelling) => ({ ...spelling, octave })),
    };
  }))
  .concat({
    id: "C6",
    name: "C",
    octave: 6,
    midi: 84,
    isBlack: false,
    afterWhiteIndex: null,
    spellings: [{ name: "C", octave: 6, accidental: null }],
  });

export const whiteKeys = pianoNotes.filter((note) => !note.isBlack);
export const blackKeys = pianoNotes.filter((note) => note.isBlack);

const chordIntervals: Record<PianoChordQuality, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
};

const chordRoots = pianoNotes.filter((note) => note.octave === 4);

export const pianoChords: readonly PianoChord[] = chordRoots.flatMap((root) => (
  (Object.keys(chordIntervals) as PianoChordQuality[]).map((quality) => {
    const notes = chordIntervals[quality].map((interval) => {
      const note = pianoNotes.find((candidate) => candidate.midi === root.midi + interval);
      if (!note) throw new Error(`Missing ${quality} chord tone for ${root.id}`);
      return note;
    });

    return {
      id: `${root.id}-${quality}`,
      name: `${root.name} ${quality}`,
      quality,
      root,
      notes,
    };
  })
));

function diatonicIndex(note: Pick<StaffNotation, "name" | "octave">) {
  return note.octave * 7 + naturalNoteNames.indexOf(note.name);
}

const bottomLineNotes: Record<StaffClef, Pick<StaffNotation, "name" | "octave">> = {
  treble: { name: "E", octave: 4 },
  bass: { name: "G", octave: 2 },
};

export function staffStepFor(notation: StaffNotation, clef: StaffClef) {
  return diatonicIndex(notation) - diatonicIndex(bottomLineNotes[clef]);
}

export function ledgerStepsFor(notation: StaffNotation, clef: StaffClef) {
  const step = staffStepFor(notation, clef);
  const ledgerSteps: number[] = [];

  if (step <= -2) {
    for (let ledger = -2; ledger >= step; ledger -= 2) ledgerSteps.push(ledger);
  }

  if (step >= 10) {
    for (let ledger = 10; ledger <= step; ledger += 2) ledgerSteps.push(ledger);
  }

  return ledgerSteps;
}

export function accidentalSymbol(accidental: Accidental) {
  if (accidental === "sharp") return "♯";
  if (accidental === "flat") return "♭";
  return "";
}

export function formatNotation(notation: StaffNotation, includeOctave = false) {
  return `${notation.name}${accidentalSymbol(notation.accidental)}${includeOctave ? notation.octave : ""}`;
}

export function formatPianoKey(note: PianoNote, includeOctave = false) {
  if (!includeOctave || !note.isBlack) return `${note.name}${includeOctave ? note.octave : ""}`;
  return note.spellings.map((spelling) => formatNotation(spelling, true)).join(" / ");
}

export function spokenPitchName(note: PianoNote) {
  if (!note.isBlack) return `${note.name} ${note.octave}`;
  const [sharp, flat] = note.spellings;
  return `${sharp.name} sharp ${note.octave}, or ${flat.name} flat ${flat.octave}`;
}

function staffQuestionPool(clef: StaffClef) {
  const [minimumMidi, maximumMidi] = clef === "treble" ? [60, 84] : [48, 60];

  return pianoNotes
    .filter((note) => note.midi >= minimumMidi && note.midi <= maximumMidi)
    .flatMap((note) => note.spellings.map((notation) => ({
      id: `${clef}-${note.id}-${notation.name}-${notation.accidental ?? "natural"}`,
      note,
      clef,
      notation,
    })));
}

export function questionPool(mode: PianoNoteExerciseMode, clefFilter: ClefFilter): PianoQuestion[] {
  if (mode === "key-name") {
    return pianoNotes.map((note) => ({ id: note.id, note }));
  }

  const clefs: StaffClef[] = clefFilter === "mixed" ? ["treble", "bass"] : [clefFilter];
  return clefs.flatMap(staffQuestionPool);
}

export function createPianoQuestion(
  mode: PianoNoteExerciseMode,
  clefFilter: ClefFilter,
  previousId?: string,
  random: () => number = Math.random,
) {
  const pool = questionPool(mode, clefFilter);
  let index = Math.min(pool.length - 1, Math.floor(random() * pool.length));

  if (pool.length > 1 && pool[index].id === previousId) {
    index = (index + 1) % pool.length;
  }

  return pool[index];
}

export function createPianoChordQuestion(
  previousId?: string,
  random: () => number = Math.random,
) {
  let index = Math.min(pianoChords.length - 1, Math.floor(random() * pianoChords.length));

  if (pianoChords.length > 1 && pianoChords[index].id === previousId) {
    index = (index + 1) % pianoChords.length;
  }

  return pianoChords[index];
}

export function chordMatchesNoteIds(chord: PianoChord, noteIds: readonly string[]) {
  if (noteIds.length !== chord.notes.length) return false;
  const selectedIds = new Set(noteIds);
  return chord.notes.every((note) => selectedIds.has(note.id));
}

export function noteFrequency(midi: number) {
  return 440 * (2 ** ((midi - 69) / 12));
}

export function pianoAudioPath(note: Pick<PianoNote, "midi">) {
  return `/audio/piano-party/${note.midi}.wav`;
}
