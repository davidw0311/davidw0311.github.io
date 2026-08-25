export type NoteName = "A" | "B" | "C" | "D" | "E" | "F" | "G";
export type StaffClef = "treble" | "bass";
export type ClefFilter = "mixed" | StaffClef;
export type PianoExerciseMode = "key-name" | "staff-name" | "staff-key";

export type PianoNote = {
  id: string;
  name: NoteName;
  octave: number;
  midi: number;
};

export type PianoQuestion = {
  id: string;
  note: PianoNote;
  clef?: StaffClef;
};

export const noteNames: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"];

const naturalSemitones: Record<NoteName, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export const pianoNotes: PianoNote[] = [3, 4]
  .flatMap((octave) => noteNames.map((name) => ({
    id: `${name}${octave}`,
    name,
    octave,
    midi: 12 * (octave + 1) + naturalSemitones[name],
  })))
  .concat({ id: "C5", name: "C", octave: 5, midi: 72 });

export const blackKeys = pianoNotes
  .slice(0, -1)
  .flatMap((note, index) => {
    if (note.name === "E" || note.name === "B") return [];
    return [{ id: `${note.id}-sharp`, afterWhiteIndex: index }];
  });

const clefRanges: Record<StaffClef, Set<string>> = {
  bass: new Set(["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"]),
  treble: new Set(["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]),
};

function diatonicIndex(note: Pick<PianoNote, "name" | "octave">) {
  return note.octave * 7 + noteNames.indexOf(note.name);
}

const bottomLineNotes: Record<StaffClef, Pick<PianoNote, "name" | "octave">> = {
  treble: { name: "E", octave: 4 },
  bass: { name: "G", octave: 2 },
};

export function staffStepFor(note: PianoNote, clef: StaffClef) {
  return diatonicIndex(note) - diatonicIndex(bottomLineNotes[clef]);
}

export function ledgerStepsFor(note: PianoNote, clef: StaffClef) {
  const step = staffStepFor(note, clef);
  const ledgerSteps: number[] = [];

  if (step <= -2) {
    for (let ledger = -2; ledger >= step; ledger -= 2) ledgerSteps.push(ledger);
  }

  if (step >= 10) {
    for (let ledger = 10; ledger <= step; ledger += 2) ledgerSteps.push(ledger);
  }

  return ledgerSteps;
}

export function questionPool(mode: PianoExerciseMode, clefFilter: ClefFilter): PianoQuestion[] {
  if (mode === "key-name") {
    return pianoNotes.map((note) => ({ id: note.id, note }));
  }

  const clefs: StaffClef[] = clefFilter === "mixed" ? ["treble", "bass"] : [clefFilter];
  return clefs.flatMap((clef) => pianoNotes
    .filter((note) => clefRanges[clef].has(note.id))
    .map((note) => ({ id: `${clef}-${note.id}`, note, clef })));
}

export function createPianoQuestion(
  mode: PianoExerciseMode,
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

export function noteFrequency(midi: number) {
  return 440 * (2 ** ((midi - 69) / 12));
}
