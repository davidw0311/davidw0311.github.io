import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import {
  blackKeys,
  chordMatchesNoteIds,
  createPianoChordQuestion,
  createPianoQuestion,
  formatChordSymbol,
  formatNotation,
  ledgerStepsFor,
  noteFrequency,
  pianoAudioPath,
  pianoChords,
  pianoNotes,
  questionPool,
  staffStepFor,
  whiteKeys,
} from "../data/pianoNotes.ts";

test("the keyboard spans three chromatic octaves plus the final C", () => {
  assert.equal(pianoNotes.length, 37);
  assert.equal(whiteKeys.length, 22);
  assert.equal(blackKeys.length, 15);
  assert.equal(pianoNotes[0].id, "C3");
  assert.equal(pianoNotes.at(-1)?.id, "C6");
});

test("black keys expose both sharp and flat spellings", () => {
  const cSharp3 = pianoNotes.find((note) => note.id === "C#3");
  assert.ok(cSharp3);
  assert.equal(cSharp3.name, "C♯/D♭");
  assert.deepEqual(cSharp3.spellings.map((notation) => formatNotation(notation, true)), ["C♯3", "D♭3"]);
});

test("staff positions follow the written spelling", () => {
  assert.equal(staffStepFor({ name: "E", octave: 4, accidental: null }, "treble"), 0);
  assert.equal(staffStepFor({ name: "C", octave: 3, accidental: null }, "bass"), 3);
  assert.equal(staffStepFor({ name: "D", octave: 4, accidental: "flat" }, "treble"), -1);
});

test("middle C receives the expected ledger line in either clef", () => {
  const middleC = { name: "C" as const, octave: 4, accidental: null };
  assert.deepEqual(ledgerStepsFor(middleC, "treble"), [-2]);
  assert.deepEqual(ledgerStepsFor(middleC, "bass"), [10]);
});

test("staff exercises include natural, sharp, and flat notation", () => {
  const treblePool = questionPool("staff-name", "treble");
  assert.equal(treblePool.length, 35);
  assert.ok(treblePool.every((question) => question.clef === "treble"));
  assert.ok(treblePool.some((question) => question.note.id === "C6"));
  assert.ok(treblePool.some((question) => question.notation?.accidental === "sharp"));
  assert.ok(treblePool.some((question) => question.notation?.accidental === "flat"));
});

test("question generation avoids an immediate repeat", () => {
  const first = createPianoQuestion("key-name", "mixed", undefined, () => 0);
  const second = createPianoQuestion("key-name", "mixed", first.id, () => 0);
  assert.notEqual(first.id, second.id);
});

test("the chord library contains every chromatic major and minor triad", () => {
  assert.equal(pianoChords.length, 24);
  assert.equal(new Set(pianoChords.map((chord) => chord.root.id)).size, 12);
  assert.deepEqual(new Set(pianoChords.map((chord) => chord.quality)), new Set(["major", "minor"]));
  assert.ok(pianoChords.every((chord) => chord.notes.every((note) => note.midi >= 60 && note.midi <= 84)));

  assert.deepEqual(pianoChords.find((chord) => chord.id === "C4-major")?.notes.map((note) => note.id), ["C4", "E4", "G4"]);
  assert.deepEqual(pianoChords.find((chord) => chord.id === "C4-minor")?.notes.map((note) => note.id), ["C4", "D#4", "G4"]);
  assert.deepEqual(pianoChords.find((chord) => chord.id === "B4-major")?.notes.map((note) => note.id), ["B4", "D#5", "F#5"]);
  assert.equal(pianoChords.find((chord) => chord.id === "D4-major")?.name, "D");
  assert.equal(pianoChords.find((chord) => chord.id === "D4-minor")?.name, "Dm");
  const cSharpMinor = pianoChords.find((chord) => chord.id === "C#4-minor");
  assert.ok(cSharpMinor);
  assert.equal(formatChordSymbol(cSharpMinor, true), "C♯m / D♭m");
});

test("chord answers match the three pitch classes in any octave or inversion", () => {
  const chord = pianoChords.find((candidate) => candidate.id === "C4-major");
  assert.ok(chord);
  assert.equal(chordMatchesNoteIds(chord, ["G4", "C4", "E4"]), true);
  assert.equal(chordMatchesNoteIds(chord, ["E5", "C5", "G5"]), true);
  assert.equal(chordMatchesNoteIds(chord, ["G4", "E5", "C5"]), true);
  assert.equal(chordMatchesNoteIds(chord, ["C4", "E4"]), false);
  assert.equal(chordMatchesNoteIds(chord, ["C4", "E4", "F4"]), false);
  assert.equal(chordMatchesNoteIds(chord, ["C4", "E4", "G4", "C5"]), false);
  assert.equal(chordMatchesNoteIds(chord, ["C4", "C5", "E5"]), false);
});

test("chord question generation avoids an immediate repeat", () => {
  const first = createPianoChordQuestion(undefined, () => 0);
  const second = createPianoChordQuestion(first.id, () => 0);
  assert.notEqual(first.id, second.id);
});

test("A4 remains concert pitch", () => {
  const a4 = pianoNotes.find((note) => note.id === "A4");
  assert.ok(a4);
  assert.equal(noteFrequency(a4.midi), 440);
});

test("every piano key has a local media file for mobile playback", async () => {
  for (const note of pianoNotes) {
    assert.equal(pianoAudioPath(note), `/audio/piano-party/${note.midi}.wav`);
    const audio = await stat(`public${pianoAudioPath(note)}`);
    assert.ok(audio.size > 10_000, `${note.id} audio should contain a playable tone`);
  }
});
