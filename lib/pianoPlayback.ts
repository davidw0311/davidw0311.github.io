import type { PianoNote } from "@/data/pianoNotes";

export const chordArpeggioStepSeconds = 0.13;

export type PianoArpeggioEvent = {
  note: PianoNote;
  startOffset: number;
};

export function createAscendingArpeggio(
  notes: readonly PianoNote[],
  stepSeconds = chordArpeggioStepSeconds,
): PianoArpeggioEvent[] {
  return [...notes]
    .sort((left, right) => left.midi - right.midi)
    .map((note, index) => ({ note, startOffset: index * stepSeconds }));
}
