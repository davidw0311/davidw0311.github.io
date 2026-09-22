import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { WerewolfAudio, type WerewolfAudioStatus, type WerewolfAudioPhase } from "../lib/werewolfAudio.ts";

const pathFor = (cue: string, language = "en") => `/assets/werewolf/audio/${language}/${cue}.mp3`;
const musicPath = "/assets/werewolf/audio/night-ambience.wav";
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const staged = (id: string, stage: "opening" | "acting" | "closing", cues: string[], role = "wolves"): WerewolfAudioPhase => ({ id, kind: "night", step: role, nightStage: stage, nightCues: cues });
const failure = (name: string) => Object.assign(new Error(name), { name });

function fixture(t: TestContext) {
  const originalAudio = Object.getOwnPropertyDescriptor(globalThis, "Audio");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const statuses: { status: WerewolfAudioStatus; message?: string }[] = [];
  const acknowledgments: string[] = [];
  const elements: FakeMedia[] = [];
  const records: { media: FakeMedia; url: string; started: boolean; stopped: boolean; ended: boolean; end: (() => void) | null }[] = [];
  const deferred = new Set<string>();
  const pending = new Map<string, (() => void)[]>();
  let nextFailure: string | null = null;
  let gesture = false;
  const audioSession = { type: "auto" };

  class FakeMedia {
    private source = "";
    private serial = 0;
    preload = ""; muted = false; volume = 1; loop = false; paused = true; ended = false;
    currentTime = 0; duration = 3; authorized = false; loadCalls = 0;
    onplaying: (() => void) | null = null; onended: (() => void) | null = null;
    onpause: (() => void) | null = null; onerror: (() => void) | null = null;
    onstalled: (() => void) | null = null; onwaiting: (() => void) | null = null;
    ontimeupdate: (() => void) | null = null;
    constructor() { elements.push(this); }
    get src() { return this.source; }
    set src(value: string) { this.source = value; this.serial++; this.ended = false; this.currentTime = 0; }
    get currentSrc() { return this.source; }
    setAttribute() {}
    removeAttribute(name: string) { if (name === "src") this.src = ""; }
    load() { this.loadCalls++; }
    pause() {
      this.paused = true;
      const record = records.findLast(record => record.media === this);
      if (record && !record.ended) record.stopped = true;
      this.onpause?.();
    }
    play() {
      const record = { media: this, url: this.src, started: false, stopped: false, ended: false, end: this.onended };
      records.push(record);
      if (!this.authorized && !gesture) return Promise.reject(failure("NotAllowedError"));
      if (gesture && !this.muted) this.authorized = true;
      const error = nextFailure; nextFailure = null;
      if (error) return Promise.reject(failure(error));
      this.paused = false;
      const serial = this.serial;
      const begin = () => {
        if (serial !== this.serial || record.stopped) throw failure("AbortError");
        record.started = true; this.paused = false; this.ended = false; this.onplaying?.();
      };
      if (deferred.has(this.src)) return new Promise<void>((resolve, reject) => {
        const callbacks = pending.get(this.src) || [];
        callbacks.push(() => { try { begin(); resolve(); } catch (caught) { reject(caught); } });
        pending.set(this.src, callbacks);
      });
      return Promise.resolve().then(begin);
    }
    finish() {
      const record = records.findLast(record => record.media === this)!;
      record.ended = true; this.ended = true; this.paused = true; this.currentTime = this.duration;
      this.onpause?.(); this.onended?.();
    }
    interrupt() { this.paused = true; this.onpause?.(); }
  }
  Object.defineProperty(globalThis, "Audio", { configurable: true, value: FakeMedia });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { audioSession } });
  const audio = new WerewolfAudio((status, message) => statuses.push({ status, message }), id => acknowledgments.push(id));
  const options = { active: true, voice: true, music: false, language: "en" as "en" | "zh" };
  const tap = <T,>(callback: () => T) => { gesture = true; try { return callback(); } finally { gesture = false; } };
  t.after(() => {
    audio.dispose();
    if (originalAudio) Object.defineProperty(globalThis, "Audio", originalAudio); else Reflect.deleteProperty(globalThis, "Audio");
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator); else Reflect.deleteProperty(globalThis, "navigator");
  });
  return {
    audio, options, statuses, acknowledgments, elements, records, deferred, audioSession, tap,
    unlock: () => tap(() => audio.unlock()),
    release(url: string) { const callbacks = pending.get(url); assert.ok(callbacks?.length, `No pending play for ${url}`); pending.delete(url); callbacks.forEach(callback => callback()); },
    failNext(name = "NotSupportedError") { nextFailure = name; },
    played: () => records.filter(record => record.started && record.url.endsWith(".mp3")).map(record => record.url),
    latest: () => records.findLast(record => record.url.endsWith(".mp3"))!,
    voice: () => elements[0], music: () => elements[1],
    finish: async () => { elements[0].finish(); await flush(); },
  };
}

test("Safari-style per-element permission is obtained synchronously for both persistent media elements", async t => {
  const f = fixture(t);
  f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["night", "wolves"]));
  f.audio.replay(); await flush();
  assert.equal(f.elements.length, 0);
  const unlocking = f.unlock();
  assert.equal(f.records.length, 2, "Both play() calls must happen inside the same gesture, before any await");
  assert.ok(f.records.every(record => record.url.startsWith("data:audio/wav;base64,")));
  assert.ok(f.elements.every(media => media.authorized && !media.muted));
  assert.equal(f.audioSession.type, "playback");
  await unlocking; await flush();
  assert.deepEqual(f.played(), [pathFor("night")]);
  await f.finish();
  assert.deepEqual(f.played(), [pathFor("night"), pathFor("wolves")]);
  assert.equal(f.elements.length, 2, "Queue changes reuse the authorized elements");
  await f.finish(); assert.deepEqual(f.acknowledgments, ["open"]);
});

test("playback called outside a gesture is reported locked and can be recovered by a tap", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["seer"], "seer"));
  await f.audio.unlock(); await flush();
  assert.equal(f.statuses.at(-1)?.status, "locked");
  assert.deepEqual(f.played(), []); assert.deepEqual(f.acknowledgments, []);
  await f.unlock(); await flush();
  assert.equal(f.latest().url, pathFor("seer"));
  await f.finish(); assert.deepEqual(f.acknowledgments, ["open"]);
});

test("identical polling never restarts narration or acknowledges before real ended events", async t => {
  const f = fixture(t), phase = staged("open", "opening", ["night", "wolves"]);
  f.audio.configure(f.options); f.audio.updatePhase(phase); await f.unlock(); await flush();
  for (let index = 0; index < 30; index++) { f.audio.configure({ ...f.options }); f.audio.updatePhase({ ...phase, nightCues: ["night", "wolves"] }); }
  await flush(); assert.deepEqual(f.played(), [pathFor("night")]);
  assert.deepEqual(f.acknowledgments, []);
  await f.finish(); assert.deepEqual(f.acknowledgments, []);
  await f.finish(); assert.deepEqual(f.acknowledgments, [phase.id]);
  f.audio.updatePhase({ ...phase }); await flush(); assert.equal(f.played().length, 2);
});

test("staged opening, acting, and closing use exact cues with ambience only during acting", async t => {
  const f = fixture(t); f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["night", "wolves"]));
  await f.unlock(); await flush();
  assert.ok(!f.records.some(record => record.url === musicPath));
  await f.finish(); await f.finish(); assert.deepEqual(f.acknowledgments, ["open"]);
  f.audio.updatePhase(staged("act", "acting", [])); await flush();
  assert.ok(f.music().loop && !f.music().paused); assert.equal(f.music().src, musicPath);
  for (let index = 0; index < 20; index++) f.audio.updatePhase(staged("act", "acting", []));
  f.audio.replay(); await flush();
  assert.equal(f.records.filter(record => record.url === musicPath).length, 1);
  assert.equal(f.played().length, 2);
  f.audio.updatePhase(staged("close", "closing", ["role-sleep"])); await flush();
  assert.ok(f.music().paused); assert.equal(f.latest().url, pathFor("role-sleep"));
  await f.finish(); assert.deepEqual(f.acknowledgments, ["open", "close"]);
  f.audio.updatePhase(staged("seer", "opening", ["seer"], "seer")); await flush();
  assert.deepEqual(f.played(), [pathFor("night"), pathFor("wolves"), pathFor("role-sleep"), pathFor("seer")]);
});

test("advancing a phase invalidates pending playback and stale ended events", async t => {
  const f = fixture(t); f.deferred.add(pathFor("night"));
  f.audio.configure(f.options); f.audio.updatePhase(staged("old", "opening", ["night", "wolves"]));
  await f.unlock(); await flush();
  const staleEnd = f.latest().end;
  f.audio.updatePhase({ id: "new", kind: "voting", step: "sheriff" }); await flush();
  assert.deepEqual(f.played(), [pathFor("sheriff-voting")]);
  f.release(pathFor("night")); staleEnd?.(); await flush();
  assert.deepEqual(f.played(), [pathFor("sheriff-voting")]); assert.deepEqual(f.acknowledgments, []);
});

test("a queued ended event cannot finish a new clip which has not actually ended", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("first", "opening", ["wolves"]));
  await f.unlock(); await flush();
  f.audio.updatePhase(staged("second", "closing", ["role-sleep"])); await flush();
  f.voice().onended?.(); await flush();
  assert.deepEqual(f.acknowledgments, []);
  await f.finish(); assert.deepEqual(f.acknowledgments, ["second"]);
});

test("muting and losing device activity cancel staged cues without acknowledging", async t => {
  const f = fixture(t); const phase = staged("open", "opening", ["wolves"]);
  f.audio.configure(f.options); f.audio.updatePhase(phase); await f.unlock(); await flush();
  const staleEnd = f.latest().end;
  f.audio.configure({ ...f.options, voice: false }); staleEnd?.(); await flush();
  assert.ok(f.voice().paused); assert.deepEqual(f.acknowledgments, []);
  f.audio.configure(f.options); await flush();
  f.audio.configure({ ...f.options, active: false }); await flush();
  assert.ok(f.voice().paused); assert.deepEqual(f.acknowledgments, []);
  f.audio.configure(f.options); await flush(); await f.finish();
  assert.deepEqual(f.acknowledgments, [phase.id]);
});

test("pause/resume completes an interrupted stage and replay or language changes never duplicate its ACK", async t => {
  const f = fixture(t), phase = staged("open", "opening", ["cupid"], "cupid");
  f.audio.configure(f.options); f.audio.updatePhase(phase); await f.unlock(); await flush();
  f.audio.updatePhase({ ...phase, paused: true }); await flush();
  assert.equal(f.latest().url, pathFor("paused")); await f.finish(); assert.deepEqual(f.acknowledgments, []);
  f.audio.updatePhase({ ...phase, paused: false }); await flush(); await f.finish();
  f.audio.replay(); await flush(); await f.finish();
  f.audio.configure({ ...f.options, language: "zh" }); await flush();
  assert.equal(f.latest().url, pathFor("cupid", "zh")); await f.finish();
  assert.deepEqual(f.acknowledgments, [phase.id]);
});

test("system pause or Safari interruption reports locked rather than silently completing a night", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["wolfHound"], "wolfHound"));
  await f.unlock(); await flush(); const staleEnd = f.latest().end;
  f.voice().interrupt(); await flush();
  assert.equal(f.statuses.at(-1)?.status, "locked");
  staleEnd?.(); assert.deepEqual(f.acknowledgments, []);
  const count = f.played().length;
  for (let index = 0; index < 5; index++) f.audio.updatePhase(staged("open", "opening", ["wolfHound"], "wolfHound"));
  assert.equal(f.played().length, count);
  await f.unlock(); await flush(); await f.finish(); assert.deepEqual(f.acknowledgments, ["open"]);
});

test("network playback failure does not ACK and Replay retries the complete queue", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["night", "mechanicalWolf"], "mechanicalWolf"));
  await f.unlock(); await flush();
  f.failNext(); await f.finish();
  assert.equal(f.statuses.at(-1)?.status, "error"); assert.deepEqual(f.acknowledgments, []);
  f.audio.replay(); await flush(); assert.equal(f.latest().url, pathFor("night"));
  await f.finish(); assert.equal(f.latest().url, pathFor("mechanicalWolf"));
  await f.finish(); assert.deepEqual(f.acknowledgments, ["open"]);
});

test("unknown and empty staged queues cannot pretend narration succeeded", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("empty", "opening", []));
  await f.unlock(); await flush(); assert.equal(f.statuses.at(-1)?.status, "error");
  f.audio.updatePhase(staged("unknown", "closing", ["role-sleep", "unknown"])); await flush();
  assert.deepEqual(f.played(), []); assert.deepEqual(f.acknowledgments, []);
});

test("music works with voice off, loops with public acting state, and stops for pause, closing, or inactivity", async t => {
  const f = fixture(t); f.options.voice = false; f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["seer"], "seer"));
  await f.unlock(); await flush(); assert.deepEqual(f.played(), []);
  f.audio.updatePhase(staged("act", "acting", [], "seer")); await flush();
  assert.ok(f.music().loop && !f.music().paused);
  f.audio.updatePhase({ ...staged("act", "acting", []), paused: true }); assert.ok(f.music().paused);
  f.audio.updatePhase(staged("act", "acting", [], "seer")); await flush(); assert.ok(!f.music().paused);
  f.audio.configure({ ...f.options, active: false }); assert.ok(f.music().paused);
  f.audio.configure(f.options); await flush(); assert.ok(!f.music().paused);
  f.audio.updatePhase(staged("close", "closing", ["role-sleep"])); assert.ok(f.music().paused);
  assert.deepEqual(f.acknowledgments, []);
});

test("music interruption is surfaced and can recover with a new user gesture", async t => {
  const f = fixture(t); f.options.voice = false; f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase(staged("act", "acting", []));
  await f.unlock(); await flush(); f.music().interrupt();
  assert.equal(f.statuses.at(-1)?.status, "locked");
  await f.unlock(); await flush(); assert.ok(!f.music().paused);
});

test("legacy nights still close old roles and day, sheriff and result clips retain their order", async t => {
  const f = fixture(t); f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase({ id: "wolves", kind: "night", step: "wolves" });
  await f.unlock(); await flush(); await f.finish(); await f.finish();
  assert.ok(!f.music().paused);
  f.audio.updatePhase({ id: "seer", kind: "night", step: "seer" }); await flush();
  assert.ok(f.music().paused, "Pause ambience during speech even if iOS ignores element volume");
  assert.equal(f.latest().url, pathFor("role-sleep")); await f.finish(); assert.equal(f.latest().url, pathFor("seer"));
  f.audio.updatePhase({ id: "day", kind: "day", step: "discussion" }); await flush();
  assert.equal(f.latest().url, pathFor("dawn")); await f.finish(); assert.equal(f.latest().url, pathFor("discussion"));
  f.audio.updatePhase({ id: "sheriff", kind: "voting", step: "sheriff" }); await flush(); assert.equal(f.latest().url, pathFor("sheriff-voting"));
  f.audio.updatePhase({ id: "result", kind: "day", step: "afterVote" }); await flush(); assert.equal(f.latest().url, pathFor("vote-result"));
  assert.deepEqual(f.acknowledgments, []);
});

test("a real Brian sound test starts directly in the gesture and never acknowledges itself", async t => {
  const f = fixture(t); f.options.language = "zh";
  f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["wolves"]));
  const testing = f.tap(() => f.audio.testSound());
  assert.equal(f.latest().url, pathFor("night", "zh"), "The audible test play() occurs before an async boundary");
  await testing; await flush();
  assert.ok(f.latest().started); assert.deepEqual(f.acknowledgments, []);
  await f.finish(); assert.deepEqual(f.acknowledgments, []);
  assert.equal(f.latest().url, pathFor("wolves", "zh"), "The actual phase resumes after the test");
  await f.finish(); assert.deepEqual(f.acknowledgments, ["open"]);
});

test("sound test survives muted preferences and repeated polls, but a deliberate disable cancels it", async t => {
  const f = fixture(t); f.options.voice = false; f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase(staged("act", "acting", []));
  await f.tap(() => f.audio.testSound()); await flush();
  for (let index = 0; index < 20; index++) { f.audio.configure({ ...f.options }); f.audio.updatePhase(staged("act", "acting", [])); }
  assert.ok(!f.voice().paused); assert.ok(f.music().paused);
  await f.finish(); assert.ok(!f.music().paused, "Music-only mode resumes after the audible test");
  assert.deepEqual(f.acknowledgments, []);
  f.audio.configure({ ...f.options, voice: true });
  await f.tap(() => f.audio.testSound()); await flush();
  f.audio.configure({ ...f.options, voice: false }); assert.ok(f.voice().paused);
});

test("phase changes invalidate test completion so it cannot restart an old queue", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("old", "opening", ["wolves"]));
  await f.tap(() => f.audio.testSound()); await flush(); const staleEnd = f.latest().end;
  f.audio.updatePhase({ id: "new", kind: "voting", step: "exile" }); await flush();
  staleEnd?.(); await flush();
  assert.equal(f.latest().url, pathFor("voting"));
  assert.ok(!f.played().includes(pathFor("wolves"))); assert.deepEqual(f.acknowledgments, []);
});

test("slow priming accepts newer server phases without canceling the gesture permission grant", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("old", "opening", ["wolves"]));
  // Delay both silent play promises after they have been called in the gesture.
  const oldPlay = Object.getOwnPropertyDescriptor(globalThis, "Audio")!.value.prototype.play;
  let resolvePrime!: () => void;
  const gate = new Promise<void>(resolve => { resolvePrime = resolve; });
  Object.getOwnPropertyDescriptor(globalThis, "Audio")!.value.prototype.play = function(this: { src: string }) {
    const promise = oldPlay.call(this);
    return this.src.startsWith("data:") ? promise.then(() => gate) : promise;
  };
  const unlocking = f.unlock(); await flush();
  f.audio.updatePhase(staged("new", "opening", ["seer"], "seer"));
  resolvePrime(); await unlocking; await flush();
  assert.deepEqual(f.played(), [pathFor("seer")]);
  await f.finish(); assert.deepEqual(f.acknowledgments, ["new"]);
});

test("a hanging play promise times out with a visible locked state and no ACK", async t => {
  const f = fixture(t); t.mock.timers.enable({ apis: ["setTimeout"] });
  f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["wolves"]));
  f.deferred.add(pathFor("wolves"));
  await f.unlock(); await flush();
  t.mock.timers.tick(8001); await flush();
  assert.equal(f.statuses.at(-1)?.status, "locked"); assert.deepEqual(f.acknowledgments, []);
  f.release(pathFor("wolves")); await flush(); assert.deepEqual(f.acknowledgments, []);
});

test("prolonged buffering is reported instead of leaving an apparently playing queue forever", async t => {
  const f = fixture(t); t.mock.timers.enable({ apis: ["setTimeout"] });
  f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["wolves"]));
  await f.unlock(); await flush(); f.voice().onwaiting?.();
  for (let index = 0; index < 10; index++) f.voice().ontimeupdate?.();
  t.mock.timers.tick(10001); await flush();
  assert.equal(f.statuses.at(-1)?.status, "error"); assert.ok(f.voice().paused); assert.deepEqual(f.acknowledgments, []);
});

test("disposal stops both media elements, removes sources, restores audio session, and ignores stale callbacks", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["wildChild"], "wildChild"));
  await f.unlock(); await flush(); const staleEnd = f.latest().end;
  f.audio.dispose(); staleEnd?.(); await flush();
  assert.ok(f.elements.every(media => media.paused && !media.src && media.loadCalls));
  assert.equal(f.audioSession.type, "auto"); assert.deepEqual(f.acknowledgments, []);
  await f.tap(() => f.audio.testSound()); assert.equal(f.elements.length, 2);
});


test("switching language invalidates a pending old-language clip and only the new queue can acknowledge", async t => {
  const f = fixture(t); f.deferred.add(pathFor("wolves"));
  f.audio.configure(f.options); f.audio.updatePhase(staged("open", "opening", ["wolves"]));
  await f.unlock(); await flush();
  f.audio.configure({ ...f.options, language: "zh" }); await flush();
  assert.deepEqual(f.played(), [pathFor("wolves", "zh")]);
  f.release(pathFor("wolves")); await flush();
  assert.deepEqual(f.acknowledgments, []);
  await f.finish(); assert.deepEqual(f.acknowledgments, ["open"]);
});
