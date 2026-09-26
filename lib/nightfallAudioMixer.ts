export type AudioLevels = { voiceVolume: number; musicVolume: number };
export const DEFAULT_AUDIO_LEVELS: AudioLevels = { voiceVolume: 1, musicVolume: .3 };
export const MAX_AUDIO_VOLUME = 2;
export function audioLevels(value?: Partial<AudioLevels> | null): AudioLevels {
  const clamp = (level: unknown, fallback: number) => typeof level === "number" && Number.isFinite(level) ? Math.max(0, Math.min(MAX_AUDIO_VOLUME, level)) : fallback;
  return { voiceVolume: clamp(value?.voiceVolume, 1), musicVolume: clamp(value?.musicVolume, .3) };
}

/** Both games keep their authorized media elements; this graph only mixes output. */
export class NightfallAudioMixer {
  private context: AudioContext | null = null;
  private gains: GainNode[] = [];
  private sources: MediaElementAudioSourceNode[] = [];
  private limiter: DynamicsCompressorNode | null = null;
  private voice: HTMLAudioElement;
  private music: HTMLAudioElement;
  constructor(voice: HTMLAudioElement, music: HTMLAudioElement) {
    this.voice = voice; this.music = music;
    if (typeof AudioContext === "undefined") return;
    try {
      const context = this.context = new AudioContext();
      // Catch peaks from boosted speech/music before they reach the speakers.
      const limiter = this.limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -1; limiter.knee.value = 0; limiter.ratio.value = 20;
      limiter.attack.value = .003; limiter.release.value = .12;
      limiter.connect(context.destination);
      for (const [index, media] of [voice, music].entries()) {
        const gain = context.createGain();
        gain.gain.value = index === 0 ? 1 : .3;
        gain.connect(limiter);
        const source = context.createMediaElementSource(media);
        this.sources.push(source);
        // Keep a route to the destination even if a browser refuses gain routing.
        try { source.connect(gain); } catch { source.connect(context.destination); throw new Error("Audio gain routing unavailable"); }
        this.gains.push(gain);
      }
    } catch {
      // If no element was rerouted, direct HTML playback remains available.
      if (!this.sources.length) { void this.context?.close().catch(() => {}); this.context = null; }
    }
  }
  resume() { return this.context?.resume() ?? Promise.resolve(); }
  apply(levels: Partial<AudioLevels>, speaking: boolean) {
    const { voiceVolume, musicVolume } = audioLevels(levels);
    const values = [voiceVolume, musicVolume * (speaking && voiceVolume > 0 ? .15 : 1)];
    [this.voice, this.music].forEach((media, index) => {
      const gain = this.gains[index];
      if (gain && this.context) {
        media.volume = 1;
        gain.gain.cancelScheduledValues(this.context.currentTime);
        gain.gain.setTargetAtTime(values[index], this.context.currentTime, index === 0 ? .04 : .18);
      } else {
        // Older browsers still get independent attenuation, without boost.
        try { media.volume = Math.min(1, values[index]); } catch { /* Device volume remains available. */ }
      }
    });
  }
  dispose() {
    this.sources.forEach(source => source.disconnect());
    this.gains.forEach(gain => gain.disconnect());
    this.limiter?.disconnect();
    void this.context?.close().catch(() => {});
    this.context = null; this.gains = []; this.sources = []; this.limiter = null;
  }
}
