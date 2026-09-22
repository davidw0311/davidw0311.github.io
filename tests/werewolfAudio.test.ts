import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { WerewolfAudio, type WerewolfAudioStatus } from "../lib/werewolfAudio.ts";

const pathFor = (cue: string, language = "en") => `/assets/werewolf/audio/${language}/${cue}.mp3`;
const musicPath = "/assets/werewolf/audio/night-ambience.wav";
const flush = () => new Promise<void>(resolve => setImmediate(resolve));

function fixture(t: TestContext) {
  const originalContext = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  const originalFetch = globalThis.fetch;
  const requested: string[] = [], deferred = new Set<string>();
  const pending = new Map<string, () => void>();
  const statuses: { status: WerewolfAudioStatus; message?: string }[] = [];
  const sources: FakeSource[] = [];
  const contexts: FakeContext[] = [];
  let failNext = false;
  class FakeSource {
    buffer: AudioBuffer | null = null;
    loop = false;
    onended: (() => void) | null = null;
    started = false;
    stopped = false;
    ended = false;
    disconnects = 0;
    connect() {}
    disconnect() { this.disconnects++; }
    start() { this.started = true; }
    stop() { this.stopped = true; }
    finish() { this.ended = true; this.onended?.(); }
    get url() { return (this.buffer as unknown as { url: string } | null)?.url; }
  }
  class FakeContext {
    state = "suspended";
    currentTime = 0;
    destination = {};
    constructor() { contexts.push(this); }
    async resume() { this.state = "running"; }
    async close() { this.state = "closed"; }
    async decodeAudioData(data: ArrayBuffer) { return { url: new TextDecoder().decode(data) } as unknown as AudioBuffer; }
    createBufferSource() { const source = new FakeSource(); sources.push(source); return source; }
    createGain() {
      return {
        gain: { cancelScheduledValues() {}, setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {} },
        connect() {}, disconnect() {},
      };
    }
  }
  Object.defineProperty(globalThis, "AudioContext", { configurable: true, writable: true, value: FakeContext });
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);
    const okay = !failNext;
    failNext = false;
    const response = { ok: okay, arrayBuffer: async () => new TextEncoder().encode(url).buffer } as Response;
    if (deferred.has(url)) return new Promise<Response>(resolve => pending.set(url, () => resolve(response)));
    return Promise.resolve(response);
  }) as typeof fetch;
  const audio = new WerewolfAudio((status, message) => statuses.push({ status, message }));
  const options = { active: true, voice: true, music: false, language: "en" as "en" | "zh" };
  t.after(() => {
    audio.dispose();
    globalThis.fetch = originalFetch;
    if (originalContext) Object.defineProperty(globalThis, "AudioContext", originalContext);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  });
  return {
    audio, options, requested, sources, contexts, statuses, deferred,
    release(url: string) { assert.ok(pending.has(url), `No pending download for ${url}`); pending.get(url)!(); pending.delete(url); },
    failDownload() { failNext = true; },
    played: () => sources.filter(source => source.started && !source.loop).map(source => source.url),
    latestVoice: () => sources.filter(source => !source.loop).at(-1)!,
  };
}

test("moderator sound stays locked until a gesture, then starts night before the first role", async t => {
  const f = fixture(t);
  f.audio.configure(f.options);
  f.audio.updatePhase({ id: "night-1", kind: "night", step: "wolves" });
  f.audio.replay();
  await flush();
  assert.equal(f.contexts.length, 0);
  assert.equal(f.requested.length, 0);
  await f.audio.unlock(); await flush();
  assert.deepEqual(f.played(), [pathFor("night")]);
  assert.ok(!f.requested.includes(pathFor("wolves")), "A role must wait for the night announcement to finish");
  f.latestVoice().finish(); await flush();
  assert.deepEqual(f.played(), [pathFor("night"), pathFor("wolves")]);
});

test("identical phase polling never restarts narration", async t => {
  const f = fixture(t), phase = { id: "voting-1", kind: "voting", step: "exile" };
  f.audio.configure(f.options); f.audio.updatePhase(phase);
  await f.audio.unlock(); await flush();
  for (let i = 0; i < 20; i++) f.audio.updatePhase({ ...phase });
  await flush();
  assert.deepEqual(f.played(), [pathFor("voting")]);
  assert.equal(f.latestVoice().stopped, false);
  f.latestVoice().finish();
  f.audio.updatePhase({ ...phase }); await flush();
  assert.equal(f.sources.length, 1);
});

test("night steps close the previous role before opening the next and cannot overlap", async t => {
  const f = fixture(t);
  f.audio.configure(f.options); f.audio.updatePhase({ id: "wolves", kind: "night", step: "wolves" });
  await f.audio.unlock(); await flush();
  f.latestVoice().finish(); await flush();
  const oldWolf = f.latestVoice(), staleCompletion = oldWolf.onended;
  f.audio.updatePhase({ id: "seer", kind: "night", step: "seer" }); await flush();
  assert.equal(oldWolf.stopped, true);
  assert.equal(f.latestVoice().url, pathFor("role-sleep"));
  assert.ok(!f.requested.includes(pathFor("seer")));
  staleCompletion?.(); await flush();
  assert.equal(f.latestVoice().url, pathFor("role-sleep"));
  f.latestVoice().finish(); await flush();
  assert.equal(f.latestVoice().url, pathFor("seer"));
  assert.equal(f.sources.filter(s => s.started && !s.stopped && !s.ended).length, 1);
});

test("phase changes prevent stale downloads from playing or advancing a new queue", async t => {
  const f = fixture(t);
  f.deferred.add(pathFor("night"));
  f.audio.configure(f.options); f.audio.updatePhase({ id: "old", kind: "night", step: "wolves" });
  await f.audio.unlock(); await flush();
  assert.deepEqual(f.played(), []);
  f.audio.updatePhase({ id: "new", kind: "voting", step: "sheriff" }); await flush();
  assert.deepEqual(f.played(), [pathFor("sheriff-voting")]);
  f.release(pathFor("night")); await flush();
  assert.deepEqual(f.played(), [pathFor("sheriff-voting")]);
  assert.ok(!f.requested.includes(pathFor("wolves")));
});

test("losing host activity stops narration and ambience, including late requests", async t => {
  const f = fixture(t);
  f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase({ id: "n", kind: "night", step: "wolves" });
  await f.audio.unlock(); await flush();
  assert.equal(f.sources.filter(s => s.started).length, 2);
  const staleEnd = f.latestVoice().onended;
  f.audio.configure({ ...f.options, active: false });
  assert.ok(f.sources.every(s => s.stopped));
  staleEnd?.(); await flush();
  assert.ok(!f.requested.includes(pathFor("wolves")));
  f.audio.replay(); await flush();
  assert.equal(f.sources.length, 2);
});

test("Chinese cues use Chinese recordings and sheriff/results use their dedicated clips", async t => {
  const f = fixture(t); f.options.language = "zh";
  f.audio.configure(f.options); f.audio.updatePhase({ id: "s", kind: "voting", step: "sheriff" });
  await f.audio.unlock(); await flush();
  assert.equal(f.latestVoice().url, pathFor("sheriff-voting", "zh"));
  f.audio.updatePhase({ id: "d", kind: "day", step: "afterVote" }); await flush();
  assert.equal(f.latestVoice().url, pathFor("vote-result", "zh"));
  assert.ok(f.requested.every(url => url.includes("/zh/")));
});

test("night ambience loops only at night, stops on pause/day, and works without voice", async t => {
  const f = fixture(t); f.options.voice = false; f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase({ id: "d", kind: "day", step: "discussion" });
  await f.audio.unlock(); await flush();
  assert.equal(f.requested.length, 0);
  f.audio.updatePhase({ id: "n", kind: "night", step: "wolves" }); await flush();
  const firstMusic = f.sources.at(-1)!;
  assert.equal(firstMusic.url, musicPath); assert.equal(firstMusic.loop, true);
  f.audio.updatePhase({ id: "n", kind: "night", step: "wolves", paused: true });
  assert.equal(firstMusic.stopped, true);
  f.audio.updatePhase({ id: "n", kind: "night", step: "wolves", paused: false }); await flush();
  const resumedMusic = f.sources.at(-1)!;
  assert.notEqual(firstMusic, resumedMusic); assert.equal(resumedMusic.loop, true);
  f.audio.updatePhase({ id: "day2", kind: "day", step: "discussion" });
  assert.equal(resumedMusic.stopped, true);
  assert.deepEqual(f.played(), []);
  assert.equal(f.requested.filter(url => url === musicPath).length, 1, "Decoded ambience should be reused");
});

test("language switching invalidates old speech and uses the new recording", async t => {
  const f = fixture(t); f.deferred.add(pathFor("voting"));
  f.audio.configure(f.options); f.audio.updatePhase({ id: "v", kind: "voting", step: "exile" });
  await f.audio.unlock(); await flush();
  f.audio.configure({ ...f.options, language: "zh" }); await flush();
  assert.deepEqual(f.played(), [pathFor("voting", "zh")]);
  f.release(pathFor("voting")); await flush();
  assert.deepEqual(f.played(), [pathFor("voting", "zh")]);
});

test("failed recordings can be retried and disposal prevents late playback", async t => {
  const f = fixture(t);
  f.failDownload(); f.audio.configure(f.options); f.audio.updatePhase({ id: "v", kind: "voting", step: "exile" });
  await f.audio.unlock(); await flush();
  assert.equal(f.statuses.at(-1)?.status, "error");
  f.audio.replay(); await flush();
  assert.equal(f.latestVoice().url, pathFor("voting"));
  assert.equal(f.requested.filter(url => url === pathFor("voting")).length, 2);
  f.deferred.add(pathFor("game-over"));
  f.audio.updatePhase({ id: "end", kind: "finished" }); await flush();
  const count = f.sources.length;
  f.audio.dispose();
  f.release(pathFor("game-over")); await flush();
  assert.equal(f.contexts[0].state, "closed");
  assert.equal(f.sources.length, count);
});
