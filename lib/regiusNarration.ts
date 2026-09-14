export type NarrationSection = { id: string; label: string; parts: { text: string; lang: "en" | "non" }[] };
export type NarrationChunk = { section: number; text: string; lang: "en" | "non" };
export type NarrationState = { status: "idle" | "playing" | "paused" | "finished" | "error"; section: number; error?: string };
export type NarrationOptions = { rate: number; pitch: number; voice: string; includeNorse: boolean };

export function storyNarration(story: { paragraphs: string[]; quotes: { after: number; norse: string; english: string; stanza: string }[] }): NarrationSection[] {
  return story.paragraphs.flatMap((text, index) => [
    { id: `paragraph-${index}`, label: text.split(/(?<=[.!?])\s/u)[0], parts: [{ text, lang: "en" as const }] },
    ...story.quotes.filter(quote => quote.after === index + 1).map(quote => ({ id: `quote-${index}-${quote.stanza}`, label: `Quotation ${quote.stanza}`, parts: [{ text: quote.norse, lang: "non" as const }, { text: quote.english, lang: "en" as const }] })),
  ]);
}

// Preserve every character while keeping utterances short enough for mobile engines.
export function splitSpeech(text: string, limit = 220): string[] {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    const head = rest.slice(0, limit);
    const sentences = [...head.matchAll(/[.!?;][”’"']?\s+/gu)];
    const last = sentences.at(-1);
    let end = last ? last.index + last[0].length : head.lastIndexOf(" ") + 1;
    if (end <= 0) end = limit;
    // Do not split a UTF-16 surrogate pair.
    if (/[\uD800-\uDBFF]/u.test(rest[end - 1])) end--;
    chunks.push(rest.slice(0, end));
    rest = rest.slice(end);
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export function narrationQueue(sections: NarrationSection[], start: number, includeNorse = true): NarrationChunk[] {
  return sections.flatMap((section, index) => index < start ? [] : section.parts.flatMap(part =>
    !includeNorse && part.lang === "non" ? [] : splitSpeech(part.text).map(text => ({ section: index, text, lang: part.lang }))));
}

export type SpeechHandle = {
  text: string; lang: string; rate: number; pitch: number; voice: SpeechSynthesisVoice | null;
  onend: ((event: unknown) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onboundary: ((event: { charIndex: number }) => void) | null;
};
export type SpeechDriver = {
  create: (text: string) => SpeechHandle;
  speak: (utterance: SpeechHandle) => void;
  cancel: () => void;
  resume: () => void;
  voices: () => SpeechSynthesisVoice[];
};

export class StoryNarrator {
  private queue: NarrationChunk[] = [];
  private cursor = 0;
  private offset = 0;
  private boundary = 0;
  private generation = 0;
  // Retain the utterance while speaking; some browser engines otherwise collect it.
  private utterance: SpeechHandle | null = null;
  private state: NarrationState = { status: "idle", section: -1 };
  private driver: SpeechDriver;
  private options: () => NarrationOptions;
  private report: (state: NarrationState) => void;
  constructor(driver: SpeechDriver, options: () => NarrationOptions, report: (state: NarrationState) => void) {
    this.driver = driver; this.options = options; this.report = report;
  }
  private update(state: NarrationState) { this.state = state; this.report(state); }
  private cancel() { this.generation++; this.driver.cancel(); this.utterance = null; }
  start(sections: NarrationSection[], index: number) {
    this.cancel();
    this.queue = narrationQueue(sections, index, this.options().includeNorse);
    this.cursor = 0; this.offset = 0; this.boundary = 0;
    this.play();
  }
  private play() {
    const generation = ++this.generation;
    const chunk = this.queue[this.cursor];
    if (!chunk) { this.update({ status: "finished", section: -1 }); return; }
    const options = this.options();
    const voices = this.driver.voices();
    const selected = voices.find(voice => voice.voiceURI === options.voice);
    const english = selected ?? voices.find(voice => /^en\b/i.test(voice.lang) && voice.default) ?? voices.find(voice => /^en\b/i.test(voice.lang));
    const voice = chunk.lang === "non" ? voices.find(voice => /^is\b/i.test(voice.lang)) ?? english : english;
    const utterance = this.driver.create(chunk.text.slice(this.offset));
    this.utterance = utterance;
    utterance.lang = voice?.lang ?? "en-US";
    utterance.voice = voice ?? null;
    utterance.rate = options.rate; utterance.pitch = options.pitch;
    const base = this.offset;
    this.boundary = base;
    utterance.onboundary = event => {
      if (generation === this.generation && event.charIndex >= 0 && event.charIndex < utterance.text.length) this.boundary = base + event.charIndex;
    };
    utterance.onend = () => {
      if (generation !== this.generation || this.state.status !== "playing") return;
      this.cursor++; this.offset = 0; this.boundary = 0; this.play();
    };
    utterance.onerror = event => {
      if (generation !== this.generation) return;
      this.cancel();
      this.update({ status: "error", section: chunk.section, error: event.error === "not-allowed" ? "Your browser blocked audio. Tap Read from here to try again." : "Reading stopped. Choose another voice or tap Read from here to retry." });
    };
    this.update({ status: "playing", section: chunk.section });
    try { this.driver.resume(); this.driver.speak(utterance); }
    catch { this.cancel(); this.update({ status: "error", section: chunk.section, error: "Audio could not start. Choose another voice and try again." }); }
  }
  pause() {
    if (this.state.status !== "playing") return;
    this.offset = this.boundary;
    this.cancel();
    this.update({ status: "paused", section: this.state.section });
  }
  resume() { if (this.state.status === "paused") this.play(); }
  stop() { this.cancel(); this.queue = []; this.update({ status: "idle", section: -1 }); }
  dispose() { this.cancel(); this.queue = []; }
}
