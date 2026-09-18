import type { NarrationSection, NarrationState } from "./regiusNarration.ts";

export type RecordedClip = { section: number; part: number; lang: "en" | "non"; src: string; duration: number };
export type RegiusRecording = { voice: string; label: string; textHash: string; clips: RecordedClip[] };
export type RecordedState = Omit<NarrationState, "status"> & { status: NarrationState["status"] | "loading" };
export type MediaTransport = {
  src: string; currentTime: number; playbackRate: number;
  play(): Promise<void>; pause(): void; load(): void; removeAttribute(name: string): void;
  onended: ((event: Event) => void) | null; onerror: ((event: Event) => void) | null;
  onplaying: ((event: Event) => void) | null; onwaiting: ((event: Event) => void) | null;
};

export class RecordedNarrator {
  private audio: MediaTransport;
  private recording: RegiusRecording;
  private options: () => { rate: number; includeNorse: boolean };
  private report: (state: RecordedState) => void;
  private prefetch: (src: string) => void;
  private queue: RecordedClip[] = [];
  private cursor = 0;
  private generation = 0;
  private playAttempt = 0;
  private status: RecordedState["status"] = "idle";
  constructor(audio: MediaTransport, recording: RegiusRecording, options: () => { rate: number; includeNorse: boolean }, report: (state: RecordedState) => void, prefetch: (src: string) => void = () => {}) {
    this.audio = audio; this.recording = recording; this.options = options; this.report = report; this.prefetch = prefetch;
  }
  private update(status: RecordedState["status"], error?: string) {
    this.status = status;
    this.report({ status, section: ["idle", "finished"].includes(status) ? -1 : this.queue[this.cursor]?.section ?? -1, ...(error ? { error } : {}) });
  }
  private resetAudio() {
    this.generation++; this.playAttempt++;
    this.audio.onended = null; this.audio.onerror = null; this.audio.onplaying = null; this.audio.onwaiting = null;
    this.audio.pause(); this.audio.removeAttribute("src"); this.audio.load();
  }
  start(_sections: NarrationSection[], index: number) {
    this.resetAudio();
    this.queue = this.recording.clips.filter(clip => clip.section >= index && (this.options().includeNorse || clip.lang === "en"));
    this.cursor = 0; this.playClip();
  }
  private playClip() {
    const token = ++this.generation;
    const clip = this.queue[this.cursor];
    if (!clip) { this.resetAudio(); this.update("finished"); return; }
    this.audio.onended = () => { if (token === this.generation && this.status !== "paused") { this.cursor++; this.playClip(); } };
    this.audio.onerror = () => { if (token === this.generation) { this.resetAudio(); this.update("error", "The recording could not load. Try again, or choose Device voice in settings."); } };
    this.audio.onplaying = () => { if (token === this.generation && this.status !== "paused") this.update("playing"); };
    this.audio.onwaiting = () => { if (token === this.generation && this.status === "playing") this.update("loading"); };
    this.audio.src = clip.src; this.audio.load(); this.setRate(this.options().rate);
    this.play(token);
    const next = this.queue[this.cursor + 1];
    if (next) this.prefetch(next.src);
  }
  private play(token: number) {
    const attempt = ++this.playAttempt;
    this.update("loading");
    try {
      void this.audio.play().then(() => {
        if (token === this.generation && attempt === this.playAttempt && this.status === "loading") this.update("playing");
      }).catch(() => {
        if (token !== this.generation || attempt !== this.playAttempt || this.status === "paused") return;
        this.resetAudio();
        this.update("error", "Playback was interrupted. Tap Read from here to retry, or choose Device voice in settings.");
      });
    } catch { if (token === this.generation) { this.resetAudio(); this.update("error", "Audio could not start. Tap Read from here to retry."); } }
  }
  setRate(rate: number) { this.audio.playbackRate = rate; }
  pause() { if (["playing", "loading"].includes(this.status)) { this.playAttempt++; this.update("paused"); this.audio.pause(); } }
  resume() { if (this.status === "paused") this.play(this.generation); }
  stop() { this.resetAudio(); this.queue = []; this.update("idle"); }
  dispose() { this.resetAudio(); this.queue = []; }
}
