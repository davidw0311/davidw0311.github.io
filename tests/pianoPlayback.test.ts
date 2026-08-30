import assert from "node:assert/strict";
import test from "node:test";
import { pianoNotes } from "../data/pianoNotes.ts";
import { chordArpeggioStepSeconds, createAscendingArpeggio } from "../lib/pianoPlayback.ts";

test("chord playback orders notes from lowest to highest at fixed intervals", () => {
  const c4 = pianoNotes.find((note) => note.id === "C4");
  const e4 = pianoNotes.find((note) => note.id === "E4");
  const g4 = pianoNotes.find((note) => note.id === "G4");
  assert.ok(c4 && e4 && g4);

  const arpeggio = createAscendingArpeggio([g4, c4, e4]);
  assert.deepEqual(arpeggio.map(({ note }) => note.id), ["C4", "E4", "G4"]);
  assert.deepEqual(
    arpeggio.map(({ startOffset }) => startOffset),
    [0, chordArpeggioStepSeconds, chordArpeggioStepSeconds * 2],
  );
});

test("arpeggio creation never mutates the chord's stored note order", () => {
  const notes = pianoNotes.filter((note) => ["D4", "F4", "A4"].includes(note.id)).reverse();
  const originalOrder = notes.map((note) => note.id);

  createAscendingArpeggio(notes);

  assert.deepEqual(notes.map((note) => note.id), originalOrder);
});
