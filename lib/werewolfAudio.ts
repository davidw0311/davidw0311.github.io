export type WerewolfAudioStatus = "locked" | "ready" | "playing" | "error";
type Phase = { id: string; kind: string; step?: string | null; paused?: boolean };
type Options = { voice: boolean; music: boolean; language: "en" | "zh"; active: boolean };
const CUES = new Set(["night", "dawn", "discussion", "voting", "vote-result", "game-over", "paused", "reaction", "opening", "wolves", "guard", "magician", "dreamweaver", "seer", "pureWhite", "wolfWitch", "gargoyle", "witch", "wolfBeauty", "raven", "gravekeeper", "demonHunter", "piper", "bloodMoonApostle", "role-sleep", "sheriff-voting"]);

/** A single opt-in host device plays the public moderator cues. Never reads private game state. */
export class WerewolfAudio {
  private context: AudioContext | null = null;
  private options: Options = { voice: false, music: false, language: "en", active: false };
  private phase: Phase | null = null;
  private phaseKey = "";
  private cues: string[] = [];
  private cache = new Map<string, Promise<AudioBuffer>>();
  private narration: AudioBufferSourceNode | null = null;
  private music: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private musicLoading = false;
  private generation = 0;
  private disposed = false;
  private unlocked = false;
  private abort = new AbortController();
  private report: (status: WerewolfAudioStatus, message?: string) => void;
  constructor(report: (status: WerewolfAudioStatus, message?: string) => void) { this.report = report; }

  /** Must be called directly from a click/tap, before any awaited operation. */
  async unlock() {
    if (this.disposed) return;
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      if (this.context.state !== "running") throw new Error("Audio is suspended");
      this.unlocked = true;
      this.report("ready");
      this.syncMusic();
      this.replay();
    } catch { this.unlocked = false; this.report("locked", this.message("Tap the audio control again to allow playback.", "请再次点击音频按钮，允许播放声音。")); }
  }

  configure(options: Options) {
    const previous = this.options;
    this.options = options;
    if (!options.active || !options.voice) this.stopNarration();
    this.syncMusic();
    if (options.active && options.voice && (!previous.voice || !previous.active || previous.language !== options.language)) this.replay();
  }

  updatePhase(phase: Phase) {
    const key = `${phase.id}:${phase.kind}:${phase.step ?? ""}:${Boolean(phase.paused)}`;
    const previous = this.phase;
    this.phase = phase;
    this.syncMusic();
    if (key === this.phaseKey) return;
    this.phaseKey = key;
    if (phase.paused) this.cues = ["paused"];
    else if (phase.kind === "night") this.cues = [
      ...(previous?.kind !== "night" ? ["night"] : previous.paused ? [] : ["role-sleep"]),
      phase.step || "night",
    ];
    else if (phase.kind === "day") this.cues = phase.step === "afterVote" ? ["vote-result"] : previous?.kind === "night" ? ["dawn", "discussion"] : ["discussion"];
    else if (phase.kind === "voting") this.cues = [phase.step === "sheriff" ? "sheriff-voting" : "voting"];
    else if (phase.kind === "reaction") this.cues = [...(previous?.kind === "night" ? ["dawn"] : []), "reaction"];
    else this.cues = phase.kind === "finished" ? ["game-over"] : [];
    this.stopNarration();
    this.replay();
  }

  replay() {
    if (this.disposed || !this.options.active || !this.options.voice || !this.phase || !this.unlocked) return;
    this.stopNarration();
    const generation = this.generation;
    const language = this.options.language;
    const cues = this.cues.filter(cue => CUES.has(cue));
    const playNext = (index: number) => {
      if (this.disposed || generation !== this.generation || !this.options.active || !this.options.voice) return;
      if (index >= cues.length) { this.narration = null; this.setMusicGain(.16); this.report("ready"); return; }
      void this.load(`/assets/werewolf/audio/${language}/${cues[index]}.mp3`).then(buffer => {
        if (this.disposed || generation !== this.generation || !this.options.active || !this.options.voice) return;
        const context = this.context!;
        if (context.state !== "running") { this.report("locked", this.message("Tap the audio control to resume sound.", "请点击音频按钮恢复声音。")); return; }
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        this.narration = source;
        this.setMusicGain(.035);
        source.onended = () => {
          source.disconnect();
          if (generation !== this.generation || this.disposed) return;
          this.narration = null;
          playNext(index + 1);
        };
        source.start();
        this.report("playing");
      }).catch(() => {
        if (generation === this.generation && !this.disposed) {
          this.setMusicGain(.16);
          this.report("error", this.message("Brian's recording could not load. Check your connection and replay.", "Brian 的语音未能加载。请检查网络后重播。"));
        }
      });
    };
    playNext(0);
  }

  private message(en: string, zh: string) { return this.options.language === "zh" ? zh : en; }
  private load(src: string) {
    let promise = this.cache.get(src);
    if (!promise) {
      promise = fetch(src, { signal: this.abort.signal }).then(response => {
        if (!response.ok) throw new Error("Audio unavailable");
        return response.arrayBuffer();
      }).then(data => this.context!.decodeAudioData(data)).catch(error => { this.cache.delete(src); throw error; });
      this.cache.set(src, promise);
    }
    return promise;
  }
  private stopNarration() {
    this.generation++;
    if (this.narration) { this.narration.onended = null; this.narration.stop(); this.narration.disconnect(); this.narration = null; }
    this.setMusicGain(.16);
  }
  private setMusicGain(volume: number) {
    if (!this.context || !this.musicGain) return;
    this.musicGain.gain.cancelScheduledValues(this.context.currentTime);
    this.musicGain.gain.setTargetAtTime(volume, this.context.currentTime, .25);
  }
  private shouldPlayMusic() { return this.unlocked && this.options.active && this.options.music && this.phase?.kind === "night" && !this.phase.paused && !this.disposed; }
  private syncMusic() {
    if (!this.shouldPlayMusic()) {
      if (this.music && this.context) {
        const source = this.music, gain = this.musicGain!;
        gain.gain.cancelScheduledValues(this.context.currentTime);
        gain.gain.setTargetAtTime(0, this.context.currentTime, .15);
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        source.stop(this.context.currentTime + .7);
        this.music = null; this.musicGain = null;
      }
      return;
    }
    if (this.music || this.musicLoading || this.context?.state !== "running") return;
    this.musicLoading = true;
    void this.load("/assets/werewolf/audio/night-ambience.wav").then(buffer => {
      this.musicLoading = false;
      if (!this.shouldPlayMusic() || !this.context || this.music) return;
      const source = this.context.createBufferSource(), gain = this.context.createGain();
      source.buffer = buffer; source.loop = true;
      gain.gain.setValueAtTime(0, this.context.currentTime);
      gain.gain.linearRampToValueAtTime(this.narration ? .035 : .16, this.context.currentTime + 1.2);
      source.connect(gain); gain.connect(this.context.destination);
      source.start(); this.music = source; this.musicGain = gain;
    }).catch(() => { this.musicLoading = false; if (!this.disposed) this.report("error", this.message("Night music could not load. Turn music off and on to retry.", "夜间音乐未能加载。请关闭音乐后重新开启。")); });
  }
  dispose() {
    this.disposed = true; this.stopNarration(); this.syncMusic(); this.abort.abort();
    if (this.context) void this.context.close().catch(() => {});
    this.context = null; this.cache.clear();
  }
}
