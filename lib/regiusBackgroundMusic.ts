// A separate, quiet Web Audio gain works on phones where media.volume is fixed.
export const REGIUS_MUSIC = "/audio/codex-regius/music/northern-strings-v1.wav";
export const DEFAULT_MUSIC_VOLUME = .12;
export const musicVolume = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(.3, value)) : DEFAULT_MUSIC_VOLUME;

type Dependencies = {
  context: () => AudioContext;
  load: (context: AudioContext, signal: AbortSignal) => Promise<AudioBuffer>;
  unavailable: () => void;
};
export class BackgroundMusic {
  private dependencies: Dependencies;
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private loading = false;
  private disposed = false;
  private abort = new AbortController();
  private playing = false;
  private enabled = true;
  private volume = DEFAULT_MUSIC_VOLUME;
  private offset = 0;
  private started = 0;
  constructor(dependencies: Dependencies) { this.dependencies = dependencies; }
  // Called synchronously from a click; never autoplay music on page load.
  unlock() {
    if (this.disposed || !this.enabled || this.volume === 0) return;
    try {
      this.context ??= this.dependencies.context();
      const context = this.context;
      void context.resume().then(() => this.sync()).catch(() => this.fail());
      if (!this.buffer && !this.loading) {
        this.loading = true;
        void this.dependencies.load(context, this.abort.signal).then(buffer => {
          if (this.disposed) return;
          this.buffer = buffer; this.loading = false; this.sync();
        }).catch(() => { this.loading = false; this.fail(); });
      }
    } catch { this.fail(); }
  }
  setPlaying(playing: boolean) { this.playing = playing; this.sync(); }
  configure(enabled: boolean, volume: number) {
    this.enabled = enabled; this.volume = musicVolume(volume); this.sync();
    if (this.gain && this.context) {
      this.gain.gain.cancelScheduledValues(this.context.currentTime);
      this.gain.gain.setTargetAtTime(this.volume, this.context.currentTime, .12);
    }
  }
  private sync() {
    if (this.disposed) return;
    if (!this.playing || !this.enabled || this.volume === 0) { this.pause(); return; }
    const context = this.context;
    if (this.source || !context || !this.buffer || context.state !== "running") return;
    const source = context.createBufferSource(), gain = context.createGain();
    source.buffer = this.buffer; source.loop = true;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(this.volume, context.currentTime + .6);
    source.connect(gain); gain.connect(context.destination);
    source.onended = () => { source.disconnect(); gain.disconnect(); };
    source.start(0, this.offset % this.buffer.duration);
    this.source = source; this.gain = gain; this.started = context.currentTime;
  }
  private pause() {
    if (!this.source || !this.context || !this.buffer) return;
    this.offset = (this.offset + this.context.currentTime - this.started) % this.buffer.duration;
    this.gain!.gain.cancelScheduledValues(this.context.currentTime);
    this.gain!.gain.setTargetAtTime(0, this.context.currentTime, .015);
    this.source.stop(this.context.currentTime + .08);
    this.source = null; this.gain = null;
  }
  stop() { this.playing = false; this.pause(); this.offset = 0; }
  private fail() {
    if (this.disposed) return;
    this.stop(); this.dependencies.unavailable();
  }
  dispose() {
    this.stop(); this.disposed = true; this.abort.abort();
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
  }
}
