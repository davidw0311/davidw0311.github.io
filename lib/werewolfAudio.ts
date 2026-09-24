export type WerewolfAudioStatus = "locked" | "ready" | "playing" | "error";
export type WerewolfAudioPhase = {
  id: string;
  kind: string;
  step?: string | null;
  paused?: boolean;
  nightStage?: "opening" | "acting" | "closing";
  nightCues?: string[];
  publicCues?: string[];
};
type Phase = WerewolfAudioPhase;
type Options = { voice: boolean; music: boolean; track?: string; language: "en" | "zh"; active: boolean };
type AudioSession = { type: string };
const CUES = new Set(["night", "dawn", "discussion", "voting", "vote-result", "game-over", "paused", "reaction", "opening", "wolves", "silencer", "silenced-today", "nobody-silenced", "guard", "magician", "dreamweaver", "seer", "pureWhite", "wolfWitch", "gargoyle", "witch", "wolfBeauty", "raven", "gravekeeper", "demonHunter", "piper", "bloodMoonApostle", "role-sleep", "sheriff-voting", "cupid", "wildChild", "wolfHound", "thief", "mechanicalWolf"]);
for (let number = 1; number <= 24; number++) { CUES.add(`seat-${number}`); CUES.add(`last-words-${number}`); }
for (const cue of ["day-deaths", "night-deaths", "peaceful-night", "sheriff-elected", "sheriff-none", "sheriff-nomination", "sheriff-discussion", "sheriff-speeches-start", "clockwise", "discussion-start", "sheriff-direction", "exiled", "badge-passed", "badge-destroyed"]) CUES.add(cue);
const TRACKS = new Set(["night-vigil", "dark-walk", "dark-fog", "long-note-one", "lightless-dawn"]);

// A short, valid, unmuted PCM audio track for granting each persistent media
// element playback permission in the initiating gesture. No network is needed.
function silentWav() {
  const bytes = new Uint8Array(44 + 1280);
  const data = new DataView(bytes.buffer);
  const ascii = (offset: number, value: string) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
  ascii(0, "RIFF"); data.setUint32(4, bytes.length - 8, true); ascii(8, "WAVEfmt ");
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, 1, true);
  data.setUint32(24, 8000, true); data.setUint32(28, 16000, true); data.setUint16(32, 2, true); data.setUint16(34, 16, true);
  ascii(36, "data"); data.setUint32(40, 1280, true);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

/** Public cues only. The caller decides whose device may acknowledge a night. */
export class WerewolfAudio {
  private options: Options = { voice: false, music: false, language: "en", active: false };
  private phase: Phase | null = null;
  private phaseKey = "";
  private cues: string[] = [];
  // Safari grants media playback per element. Reuse these for every recording;
  // do not fetch/decode files or construct a new element between queued clips.
  private narration: HTMLAudioElement | null = null;
  private music: HTMLAudioElement | null = null;
  private narrationReady = false;
  private musicReady = false;
  private musicContext: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private priming = false;
  private musicPriming = false;
  private primeGeneration = 0;
  private generation = 0;
  private clip = 0;
  private musicGeneration = 0;
  private narrating = false;
  private testing = false;
  private musicPlaying = false;
  private disposed = false;
  private acknowledgedPhases = new Set<string>();
  private stallTimer: ReturnType<typeof setTimeout> | null = null;
  private musicStallTimer: ReturnType<typeof setTimeout> | null = null;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private audioSession: AudioSession | null = null;
  private previousSessionType: string | null = null;
  private report: (status: WerewolfAudioStatus, message?: string) => void;
  private onNightNarrationDone?: (phaseId: string) => void;

  constructor(report: (status: WerewolfAudioStatus, message?: string) => void, onNightNarrationDone?: (phaseId: string) => void) {
    this.report = report;
    this.onNightNarrationDone = onNightNarrationDone;
  }

  private ensureMedia() {
    if (this.narration && this.music) return;
    this.narration = new Audio();
    this.music = new Audio();
    for (const media of [this.narration, this.music]) {
      media.preload = "auto";
      media.setAttribute("playsinline", "");
      media.muted = false;
    }
    // Route only ambience through a gain node: iPhone ignores media.volume.
    // Brian stays on the persistent HTML media playback route.
    if (typeof AudioContext !== "undefined") {
      try {
        const context = new AudioContext();
        const gain = context.createGain();
        context.createMediaElementSource(this.music).connect(gain);
        gain.connect(context.destination); gain.gain.value = .3;
        this.musicContext = context; this.musicGain = gain;
      } catch { /* Media volume remains a fallback on older browsers. */ }
    }
    // HTML media already defaults to the playback session category. Explicitly
    // request it where supported, including iOS with the silent switch enabled.
    try {
      const session = typeof navigator !== "undefined" ? (navigator as Navigator & { audioSession?: AudioSession }).audioSession : undefined;
      if (session) { this.audioSession = session; this.previousSessionType = session.type; session.type = "playback"; }
    } catch { /* The media-element playback route remains available. */ }
  }

  /** Call directly in a tap/click. BOTH play() calls occur before the first await. */
  async unlock(): Promise<void> {
    if (this.disposed) return;
    try { this.ensureMedia(); } catch { this.report("error", this.message("Audio playback is unavailable in this browser.", "此浏览器无法播放音频。")); return; }
    if (this.narrationReady && this.musicReady && !this.priming) {
      void this.musicContext?.resume(); this.syncMusic(); this.report("ready"); return;
    }
    this.priming = false; this.musicPriming = false;
    this.stopNarration(); this.stopMusic();
    const attempt = ++this.primeGeneration;
    this.priming = true; this.musicPriming = true;
    this.narrationReady = false; this.musicReady = false;
    const silence = silentWav();
    this.prepare(this.narration!, silence, false);
    this.prepare(this.music!, silence, false);
    // These calls must stay synchronous with the user gesture. Awaiting a
    // resume(), fetch(), loadeddata, or the first play() would lose activation.
    const gainReady = this.musicContext?.resume();
    const musicPlay = Promise.all([this.play(this.music!), gainReady]);
    const narrationPlay = this.play(this.narration!); // Give speech the last media-focus request.
    const results = await Promise.allSettled([narrationPlay, musicPlay]);
    if (this.disposed || attempt !== this.primeGeneration) return;
    this.priming = false; this.musicPriming = false;
    this.clearHandlers(this.narration!); this.narration!.pause();
    this.clearHandlers(this.music!); this.music!.pause();
    this.narrationReady = results[0].status === "fulfilled";
    this.musicReady = results[1].status === "fulfilled";
    const neededFailure = this.options.voice && !this.narrationReady || this.options.music && !this.musicReady;
    if (neededFailure || !this.narrationReady && !this.musicReady) {
      this.report("locked", this.message("Tap Enable sound or Test sound again. Your phone may have interrupted playback.", "请再次点击开启声音或测试声音，手机可能中断了播放。"));
    } else this.report("ready");
    this.replay();
    this.syncMusic();
  }

  /** Audible Brian test, called directly in a gesture. The test never ACKs a phase. */
  async testSound(): Promise<void> {
    if (this.disposed) return;
    try { this.ensureMedia(); } catch { this.report("error", this.message("Audio playback is unavailable in this browser.", "此浏览器无法播放音频。")); return; }
    ++this.primeGeneration;
    this.priming = false; this.musicPriming = false;
    this.stopNarration(); this.stopMusic();
    const attempt = this.primeGeneration;
    this.musicPriming = true;
    this.prepare(this.music!, silentWav(), false);
    const gainReady = this.musicContext?.resume();
    const primeMusic = Promise.all([this.play(this.music!), gainReady]); // Same gesture as the real voice test below.
    this.testing = true;
    this.narrating = true;
    const generation = this.generation;
    const phaseKey = this.phaseKey;
    const spokenTest = this.playClip("night", generation, () => {
      this.testing = false; this.narrating = false;
      this.report("ready");
      // Resume the interrupted real queue, which alone may acknowledge its
      // phase. A phase change or disposal invalidates this completion handler.
      if (!this.disposed && generation === this.generation && phaseKey === this.phaseKey) this.replay();
      this.syncMusic();
    }, true);
    void primeMusic.then(() => {
      if (this.disposed || attempt !== this.primeGeneration) return;
      this.musicReady = true; this.musicPriming = false;
      this.clearHandlers(this.music!); this.music!.pause();
      this.syncMusic();
    }).catch(() => {
      if (this.disposed || attempt !== this.primeGeneration) return;
      this.musicReady = false; this.musicPriming = false;
      if (this.options.music) this.report("locked", this.message("Night music needs another tap to enable playback.", "请再次点击以开启夜间音乐。"));
    });
    await spokenTest;
  }

  configure(options: Options) {
    const previous = this.options;
    this.options = options;
    if (previous.track !== options.track) this.stopMusic();
    if ((!this.testing && (!options.active || !options.voice)) || previous.active && !options.active || previous.voice && !options.voice) this.stopNarration();
    this.syncMusic();
    if (options.active && options.voice && (!previous.voice || !previous.active || previous.language !== options.language)) this.replay();
  }

  updatePhase(phase: Phase) {
    const key = JSON.stringify([phase.id, phase.kind, phase.step ?? "", Boolean(phase.paused), phase.nightStage ?? "", phase.nightCues ?? [], phase.publicCues ?? []]);
    const previous = this.phase;
    this.phase = phase;
    if (key === this.phaseKey) { this.syncMusic(); return; }
    this.phaseKey = key;
    if (phase.paused) this.cues = ["paused"];
    else if (phase.kind === "announcement") this.cues = [...(phase.publicCues || [])];
    else if (phase.kind === "sheriff") this.cues = phase.publicCues ? [...phase.publicCues] : [phase.step === "nomination" ? "sheriff-nomination" : "sheriff-discussion"];
    else if (phase.kind === "night" && phase.nightStage) this.cues = phase.nightStage === "acting" ? [] : [...(phase.nightCues ?? [])];
    else if (phase.kind === "night") this.cues = [...(previous?.kind !== "night" ? ["night"] : previous.paused ? [] : ["role-sleep"]), phase.step || "night"];
    else if (phase.kind === "day") this.cues = phase.publicCues ? [...phase.publicCues] : phase.step === "afterVote" ? ["vote-result"] : previous?.kind === "night" ? ["dawn", "discussion"] : ["discussion"];
    else if (phase.kind === "voting") this.cues = [phase.step === "sheriff" ? "sheriff-voting" : "voting"];
    else if (phase.kind === "reaction") this.cues = [...(previous?.kind === "night" ? ["dawn"] : []), "reaction"];
    else this.cues = phase.kind === "finished" ? phase.publicCues?.length ? [...phase.publicCues] : ["game-over"] : [];
    this.stopNarration();
    this.replay();
    this.syncMusic();
  }

  replay() {
    if (this.disposed || this.priming || !this.narrationReady || !this.options.active || !this.options.voice || !this.phase) return;
    this.stopNarration();
    const generation = this.generation;
    const phase = this.phase;
    const staged = !phase.paused && (phase.kind === "announcement" || phase.kind === "night" && (phase.nightStage === "opening" || phase.nightStage === "closing"));
    if (staged && (!this.cues.length || this.cues.some(cue => !CUES.has(cue)))) {
      this.report("error", this.message("This night announcement is unavailable. The host can retry or continue.", "此夜间提示暂时不可用，房主可重试或继续。"));
      return;
    }
    const cues = this.cues.filter(cue => CUES.has(cue));
    const next = (index: number) => {
      if (this.disposed || generation !== this.generation || !this.options.active || !this.options.voice) return;
      if (index === cues.length) {
        this.narrating = false;
        this.report("ready");
        this.syncMusic();
        if (staged && cues.length && generation === this.generation && !this.disposed && this.options.active && this.options.voice
          && this.phase?.id === phase.id && !this.phase.paused && this.phase.nightStage === phase.nightStage && !this.acknowledgedPhases.has(phase.id)) {
          this.acknowledgedPhases.add(phase.id);
          this.onNightNarrationDone?.(phase.id);
        }
        return;
      }
      this.narrating = true;
      this.syncMusic();
      void this.playClip(cues[index], generation, () => next(index + 1));
    };
    next(0);
  }

  /** A speaking-time bell; it never completes an action or narration phase. */
  ringTimer(): boolean {
    if (this.disposed || !this.narrationReady || !this.options.active) return false;
    this.stopNarration();
    this.testing = true; this.narrating = true; this.syncMusic();
    const generation = this.generation;
    void this.playClip("timer-bell", generation, () => {
      this.testing = false; this.narrating = false; this.syncMusic(); this.report("ready");
    }, true);
    return true;
  }

  private playClip(cue: string, generation: number, ended: () => void, test = false): Promise<void> {
    const media = this.narration!;
    const clip = ++this.clip;
    let started = false;
    let lastTime = 0;
    const current = () => !this.disposed && generation === this.generation && clip === this.clip && (test ? this.testing : this.options.active && this.options.voice);
    this.prepare(media, cue === "timer-bell" ? "/assets/werewolf/audio/timer-bell.wav" : `/assets/werewolf/audio/${this.options.language}/${cue}.mp3`, false);
    const fail = (locked: boolean) => {
      if (!current()) return;
      if (locked) this.narrationReady = false;
      this.stopNarration();
      this.report(locked ? "locked" : "error", locked
        ? this.message("Playback was interrupted. Tap Enable sound or Replay to continue.", "播放已中断，请点击开启声音或重播继续。")
        : this.message("Brian's recording could not play. Check the connection and tap Replay.", "Brian 的语音未能播放，请检查网络后点击重播。"));
    };
    media.onplaying = () => { if (current()) { started = true; lastTime = media.currentTime; this.narrationReady = true; this.clearStall(); this.report("playing"); } };
    media.ontimeupdate = () => { if (current() && !media.paused && media.currentTime > lastTime) { lastTime = media.currentTime; this.clearStall(); } };
    media.onended = () => {
      // A queued event from the previous src must not complete the new clip.
      if (!current() || !started || !media.ended) return;
      this.clearStall(); this.clearHandlers(media); ended();
    };
    media.onpause = () => { if (current() && media.paused && !media.ended) fail(true); };
    media.onerror = () => fail(false);
    const stalled = () => {
      if (!current() || this.stallTimer) return;
      this.stallTimer = setTimeout(() => { this.stallTimer = null; fail(false); }, 10000);
    };
    media.onstalled = stalled; media.onwaiting = stalled;
    return this.play(media).then(() => {
      if (!current()) return;
      if (media.paused && !media.ended) { fail(true); return; }
      started = true; this.narrationReady = true; this.clearStall(); this.report("playing");
    }).catch(error => {
      if (current()) fail(error instanceof Error && ["NotAllowedError", "AbortError", "TimeoutError"].includes(error.name));
    });
  }

  private prepare(media: HTMLAudioElement, src: string, loop: boolean) {
    this.clearHandlers(media);
    media.pause(); media.loop = loop; media.muted = false;
    media.src = src;
    // GainNode handles ambience ducking on iPhone; media volume is the fallback.
    try { media.volume = loop && !this.musicGain ? .3 : 1; } catch { /* Hardware volume only. */ }
  }

  private play(media: HTMLAudioElement): Promise<void> {
    let playing: Promise<void>;
    try { playing = Promise.resolve(media.play()); } catch (error) { return Promise.reject(error); }
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        const error = new Error("Media playback did not start"); error.name = "TimeoutError";
        reject(error);
      }, 8000);
      this.timers.add(timer);
      playing.then(() => { clearTimeout(timer); this.timers.delete(timer); resolve(); }, error => { clearTimeout(timer); this.timers.delete(timer); reject(error); });
    });
  }

  private clearHandlers(media: HTMLAudioElement) {
    media.onended = null; media.onplaying = null; media.onpause = null; media.onerror = null;
    media.onstalled = null; media.onwaiting = null; media.ontimeupdate = null;
  }
  private clearStall() { if (this.stallTimer) clearTimeout(this.stallTimer); this.stallTimer = null; }
  private stopNarration() {
    ++this.generation; ++this.clip;
    this.narrating = false; this.testing = false; this.clearStall();
    if (this.narration && !this.priming) { this.clearHandlers(this.narration); this.narration.pause(); }
  }
  private shouldPlayMusic() {
    return !this.disposed && !this.priming && !this.musicPriming && this.musicReady && this.options.active && this.options.music
      && !!this.phase && this.phase.kind !== "disbanded";
  }
  private stopMusic() {
    ++this.musicGeneration; this.musicPlaying = false;
    if (this.musicStallTimer) clearTimeout(this.musicStallTimer);
    this.musicStallTimer = null;
    if (this.music && !this.musicPriming) { this.clearHandlers(this.music); this.music.pause(); }
  }
  private syncMusic() {
    if (!this.shouldPlayMusic()) { if (this.musicPlaying) this.stopMusic(); return; }
    const volume = this.narrating || this.testing ? .045 : .3;
    if (this.musicGain && this.musicContext) {
      this.musicGain.gain.cancelScheduledValues(this.musicContext.currentTime);
      this.musicGain.gain.setTargetAtTime(volume, this.musicContext.currentTime, .18);
    } else if (this.music) { try { this.music.volume = volume; } catch { /* no-op */ } }
    if (this.musicPlaying || !this.music) return;
    const media = this.music;
    const generation = ++this.musicGeneration;
    this.musicPlaying = true;
    this.prepare(media, `/assets/werewolf/audio/music/${TRACKS.has(this.options.track || "") ? this.options.track : "night-vigil"}.mp3`, true);
    if (!this.musicGain) media.volume = volume;
    const current = () => !this.disposed && generation === this.musicGeneration && this.shouldPlayMusic();
    const fail = (locked: boolean) => {
      if (!current()) return;
      this.musicReady = false; this.stopMusic();
      this.report(locked ? "locked" : "error", this.message("Night music stopped. Tap Enable sound to try again.", "夜间音乐已停止，请点击开启声音重试。"));
    };
    media.onplaying = () => { if (current()) { if (this.musicStallTimer) clearTimeout(this.musicStallTimer); this.musicStallTimer = null; this.report("playing"); } };
    media.onpause = () => { if (current() && media.paused && !media.ended) fail(true); };
    media.onerror = () => fail(false);
    const stalled = () => { if (current() && !this.musicStallTimer) this.musicStallTimer = setTimeout(() => { this.musicStallTimer = null; fail(false); }, 10000); };
    media.onstalled = stalled; media.onwaiting = stalled;
    void this.play(media).then(() => { if (current()) { if (media.paused) fail(true); else this.report("playing"); } }).catch(error => {
      if (current()) fail(error instanceof Error && ["NotAllowedError", "AbortError", "TimeoutError"].includes(error.name));
    });
  }
  private message(en: string, zh: string) { return this.options.language === "zh" ? zh : en; }

  dispose() {
    this.disposed = true; ++this.primeGeneration;
    this.priming = false; this.musicPriming = false;
    this.stopNarration(); this.stopMusic();
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    for (const media of [this.narration, this.music]) { if (media) { this.clearHandlers(media); media.pause(); media.removeAttribute("src"); media.load(); } }
    if (this.audioSession && this.audioSession.type === "playback" && this.previousSessionType) {
      try { this.audioSession.type = this.previousSessionType; } catch { /* no-op */ }
    }
    void this.musicContext?.close(); this.musicContext = null; this.musicGain = null;
    this.narration = null; this.music = null;
  }
}
