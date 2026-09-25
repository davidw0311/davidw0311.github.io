import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { OneNightAudio, type OneNightAudioStatus, type OneNightAudioPhase } from "../lib/oneNightAudio.ts";

const pathFor = (cue: string, language = "en") => `/assets/one-night/audio/${language}/${cue}.mp3`;
const musicPath = "/assets/werewolf/audio/music/night-vigil.mp3";
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const staged = (id: string, stage: "opening" | "acting" | "closing", cues: string[], role = "wolves"): OneNightAudioPhase => ({ id, kind: "night", step: role, nightStage: stage, cueIds: cues });
const failure = (name: string) => Object.assign(new Error(name), { name });

function fixture(t: TestContext) {
  const originalAudio = Object.getOwnPropertyDescriptor(globalThis, "Audio");
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const statuses: { status: OneNightAudioStatus; message?: string }[] = [];
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
  const audio = new OneNightAudio((status, message) => statuses.push({ status, message }), id => acknowledgments.push(id));
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
    played: () => records.filter(record => record.started && record.url.endsWith(".mp3") && !record.url.includes("/music/")).map(record => record.url),
    latest: () => records.findLast(record => record.url.endsWith(".mp3") && !record.url.includes("/music/"))!,
    voice: () => elements[0], music: () => elements[1],
    finish: async () => { elements[0].finish(); await flush(); },
  };
}

test("One Night unlock primes both Safari media elements inside the tap and completes only the full cueIds queue", async t => {
  const f = fixture(t);
  f.audio.configure(f.options);
  f.audio.updatePhase(staged("opening-1", "opening", ["night", "role-werewolf"]));
  f.audio.replay(); await flush();
  assert.equal(f.elements.length, 0, "No unsolicited autoplay before a user gesture");
  const unlocking = f.unlock();
  assert.equal(f.records.length, 2, "Both persistent elements are authorized synchronously before an await");
  assert.ok(f.elements.every(media => media.authorized && !media.muted));
  assert.equal(f.audioSession.type, "playback");
  await unlocking; await flush();
  assert.deepEqual(f.played(), [pathFor("night")]);
  assert.deepEqual(f.acknowledgments, []);
  await f.finish();
  assert.deepEqual(f.played(), [pathFor("night"), pathFor("role-werewolf")]);
  assert.deepEqual(f.acknowledgments, [], "The entire opening must play before waking the role");
  await f.finish();
  assert.deepEqual(f.acknowledgments, ["opening-1"]);
  assert.equal(f.elements.length, 2);
});

test("One Night ambience stays continuous through opening, acting, closing and discussion and ducks only for speech", async t => {
  const f = fixture(t); f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase(staged("opening-2", "opening", ["role-seer"]));
  await f.unlock(); await flush();
  assert.equal(f.music().volume, .045);
  await f.finish();
  f.audio.updatePhase(staged("acting-2", "acting", [])); await flush();
  assert.equal(f.music().volume, .3);
  assert.ok(f.music().loop && !f.music().paused);
  for (let i = 0; i < 20; i++) f.audio.updatePhase(staged("acting-2", "acting", []));
  await flush();
  assert.deepEqual(f.played(), [pathFor("role-seer")], "Acting has no fallback narration or automatic completion");
  assert.deepEqual(f.acknowledgments, ["opening-2"]);
  f.audio.updatePhase(staged("closing-2", "closing", ["close"])); await flush();
  assert.equal(f.music().volume, .045); await f.finish();
  f.audio.updatePhase({ id: "discussion-2", kind: "discussion", cueIds: ["discussion"] }); await flush(); await f.finish();
  assert.equal(f.music().volume, .3);
  assert.equal(f.records.filter(record => record.url === musicPath).length, 1, "The same music stream continues across phases");
  assert.deepEqual(f.acknowledgments, ["opening-2", "closing-2"], "Public discussion narration must not advance night actions");
});

test("One Night advancing the server phase invalidates deferred playback and stale ended callbacks", async t => {
  const f = fixture(t); f.deferred.add(pathFor("role-robber"));
  f.audio.configure(f.options); f.audio.updatePhase(staged("old-phase", "opening", ["role-robber"]));
  await f.unlock(); await flush();
  const oldEnd = f.latest().end;
  f.audio.updatePhase({ id: "vote-now", kind: "voting", cueIds: ["voting"] }); await flush();
  f.release(pathFor("role-robber")); oldEnd?.(); await flush();
  assert.deepEqual(f.played(), [pathFor("voting")]);
  assert.deepEqual(f.acknowledgments, []);
  f.audio.updatePhase(staged("next-close", "closing", ["close"])); await flush();
  f.voice().onended?.(); await flush();
  assert.deepEqual(f.acknowledgments, [], "A queued ended event cannot complete a clip still playing");
  await f.finish(); assert.deepEqual(f.acknowledgments, ["next-close"]);
});

test("One Night repeated polling, replay and language switching do not duplicate a phase acknowledgement", async t => {
  const f = fixture(t), phase = staged("unique-phase", "opening", ["role-cupid"]);
  f.audio.configure(f.options); f.audio.updatePhase(phase); await f.unlock(); await flush();
  for (let i = 0; i < 15; i++) { f.audio.configure({ ...f.options }); f.audio.updatePhase({ ...phase, cueIds: ["role-cupid"] }); }
  await flush(); assert.deepEqual(f.played(), [pathFor("role-cupid")]);
  await f.finish(); assert.deepEqual(f.acknowledgments, [phase.id]);
  f.audio.replay(); await flush(); await f.finish();
  f.audio.configure({ ...f.options, language: "zh" }); await flush();
  assert.equal(f.latest().url, pathFor("role-cupid", "zh")); await f.finish();
  assert.deepEqual(f.acknowledgments, [phase.id]);
});

test("One Night missing recordings and interrupted playback cannot claim that narration completed", async t => {
  const f = fixture(t); f.audio.configure(f.options); f.audio.updatePhase(staged("missing-phase", "opening", ["unregistered-cue"]));
  await f.unlock(); await flush();
  assert.equal(f.statuses.at(-1)?.status, "error"); assert.deepEqual(f.played(), []);
  f.audio.updatePhase(staged("interrupted-phase", "opening", ["role-werewolf"])); await flush();
  const staleEnd = f.latest().end;
  f.voice().interrupt(); await flush();
  assert.equal(f.statuses.at(-1)?.status, "locked"); staleEnd?.();
  assert.deepEqual(f.acknowledgments, []);
  await f.unlock(); await flush(); await f.finish();
  assert.deepEqual(f.acknowledgments, ["interrupted-phase"]);
});

test("One Night disband deactivation silences speech and music without sending stale acknowledgements", async t => {
  const f = fixture(t); f.options.music = true;
  f.audio.configure(f.options); f.audio.updatePhase(staged("room-ending", "closing", ["close"]));
  await f.unlock(); await flush();
  const oldEnd = f.latest().end;
  f.audio.configure({ ...f.options, active: false });
  f.audio.updatePhase({ id: "disbanded", kind: "disbanded", cueIds: [] });
  oldEnd?.(); await flush();
  assert.ok(f.voice().paused && f.music().paused);
  assert.deepEqual(f.acknowledgments, []);
  const count = f.records.length;
  f.audio.replay(); await flush();
  assert.equal(f.records.length, count, "Leaving the room cannot restart an audio stream");
  f.audio.dispose();
  assert.equal(f.audioSession.type, "auto");
  assert.ok(f.elements.every(media => media.src === "" && media.loadCalls > 0));
});


test('Kokoro winners play team first, then each seat once, in both languages',async t=>{
 for(const language of ['en','zh'] as const) {
  const f=fixture(t);f.audio.configure({...f.options,language});
  const cues=['victory-village','winner-seat-2','winner-seat-12'];
  const phase={id:`result-${language}`,kind:'finished',cueIds:cues};
  f.audio.updatePhase(phase);await f.unlock();await flush();
  for(const cue of cues){assert.equal(f.latest().url,`/assets/nightfall/audio/${language}/${cue}.mp3`);await f.finish();}
  const plays=f.played().length;f.audio.updatePhase({...phase});await flush();assert.equal(f.played().length,plays);
  assert.deepEqual(f.acknowledgments,[]);
  f.audio.updatePhase({id:'restart',kind:'lobby',cueIds:[]});f.audio.replay();await flush();assert.equal(f.played().length,plays);
 }
});
