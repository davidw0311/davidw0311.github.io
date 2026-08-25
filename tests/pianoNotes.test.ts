import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import {
  blackKeys,
  createPianoQuestion,
  formatNotation,
  ledgerStepsFor,
  noteFrequency,
  pianoAudioPath,
  pianoNotes,
  questionPool,
  staffStepFor,
  whiteKeys,
} from "../data/pianoNotes.ts";

test("the keyboard spans two chromatic octaves plus the final C", () => {
  assert.equal(pianoNotes.length, 25);
  assert.equal(whiteKeys.length, 15);
  assert.equal(blackKeys.length, 10);
  assert.equal(pianoNotes[0].id, "C3");
  assert.equal(pianoNotes.at(-1)?.id, "C5");
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
  assert.equal(treblePool.length, 18);
  assert.ok(treblePool.every((question) => question.clef === "treble"));
  assert.ok(treblePool.some((question) => question.notation?.accidental === "sharp"));
  assert.ok(treblePool.some((question) => question.notation?.accidental === "flat"));
});

test("question generation avoids an immediate repeat", () => {
  const first = createPianoQuestion("key-name", "mixed", undefined, () => 0);
  const second = createPianoQuestion("key-name", "mixed", first.id, () => 0);
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
