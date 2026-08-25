import assert from "node:assert/strict";
import test from "node:test";
import {
  createPianoQuestion,
  ledgerStepsFor,
  noteFrequency,
  pianoNotes,
  questionPool,
  staffStepFor,
} from "../data/pianoNotes.ts";

test("the keyboard spans two octaves plus the final C", () => {
  assert.equal(pianoNotes.length, 15);
  assert.equal(pianoNotes[0].id, "C3");
  assert.equal(pianoNotes.at(-1)?.id, "C5");
});

test("staff positions use the clef bottom lines as zero", () => {
  const e4 = pianoNotes.find((note) => note.id === "E4");
  const c3 = pianoNotes.find((note) => note.id === "C3");
  assert.ok(e4);
  assert.ok(c3);
  assert.equal(staffStepFor(e4, "treble"), 0);
  assert.equal(staffStepFor(c3, "bass"), 3);
});

test("middle C receives the expected ledger line in either clef", () => {
  const c4 = pianoNotes.find((note) => note.id === "C4");
  assert.ok(c4);
  assert.deepEqual(ledgerStepsFor(c4, "treble"), [-2]);
  assert.deepEqual(ledgerStepsFor(c4, "bass"), [10]);
});

test("staff exercises respect the selected clef", () => {
  const treblePool = questionPool("staff-name", "treble");
  assert.equal(treblePool.length, 8);
  assert.ok(treblePool.every((question) => question.clef === "treble"));
  assert.deepEqual(treblePool.map((question) => question.note.id), ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]);
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
