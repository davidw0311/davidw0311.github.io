import assert from "node:assert/strict";
import test from "node:test";
import { narrationAudioSession } from "../lib/regiusAudioSession.ts";

test("narration requests playback across phrases and restores the previous category", () => {
  const session = { type: "auto" };
  const audio = narrationAudioSession(() => session);
  audio.acquire(); assert.equal(session.type, "playback");
  audio.acquire(); audio.release(); assert.equal(session.type, "auto");
  audio.release(); assert.equal(session.type, "auto");
  session.type = "ambient";
  audio.acquire(); audio.release(); assert.equal(session.type, "ambient");
});

test("missing or restricted audio-session APIs do not break reading", () => {
  for (const getter of [() => undefined, () => { throw new Error("unavailable"); }, () => Object.freeze({ type: "auto" })]) {
    const audio = narrationAudioSession(getter);
    assert.doesNotThrow(() => { audio.acquire(); audio.release(); });
  }
});

test("cleanup preserves an audio category claimed by another feature", () => {
  const session = { type: "auto" };
  const audio = narrationAudioSession(() => session);
  audio.acquire(); session.type = "play-and-record"; audio.release();
  assert.equal(session.type, "play-and-record");
});
