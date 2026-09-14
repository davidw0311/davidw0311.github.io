import assert from "node:assert/strict";
import test from "node:test";
import { regiusStories } from "../data/codexRegius.ts";
import { StoryNarrator, narrationQueue, splitSpeech, storyNarration, type NarrationOptions, type NarrationState, type SpeechHandle } from "../lib/regiusNarration.ts";

function fixture() {
  const spoken: SpeechHandle[] = [];
  const states: NarrationState[] = [];
  let cancelled = 0;
  const options: NarrationOptions = { rate: .9, pitch: .8, voice: "", includeNorse: true };
  const reader = new StoryNarrator({
    create: text => ({ text, lang: "", rate: 1, pitch: 1, voice: null, onend: null, onboundary: null, onerror: null }),
    speak: utterance => { spoken.push(utterance); },
    cancel: () => { cancelled++; }, resume: () => {}, voices: () => [],
  }, () => options, state => states.push(state));
  return { reader, spoken, states, options, cancellations: () => cancelled };
}

test("every story reads its exact prose and paired quotations in page order from every starting section", () => {
  for (const story of regiusStories) {
    const sections = storyNarration(story);
    const expected: string[] = [];
    story.paragraphs.forEach((paragraph, i) => {
      expected.push(paragraph);
      for (const quote of story.quotes.filter(quote => quote.after === i + 1)) expected.push(quote.norse, quote.english);
    });
    assert.equal(sections.flatMap(section => section.parts.map(part => part.text)).join(""), expected.join(""), story.slug);
    sections.forEach((_, start) => {
      const queue = narrationQueue(sections, start);
      assert.equal(queue.map(chunk => chunk.text).join(""), sections.slice(start).flatMap(section => section.parts.map(part => part.text)).join(""), `${story.slug} section ${start}`);
      assert.ok(queue.every(chunk => chunk.text.length <= 220));
    });
    const english = narrationQueue(sections, 0, false);
    assert.ok(english.every(chunk => chunk.lang === "en"));
    assert.equal(english.map(chunk => chunk.text).join(""), sections.flatMap(section => section.parts.filter(part => part.lang === "en").map(part => part.text)).join(""));
  }
  const unicode = "🪓".repeat(250) + " Þórr’s words.\n  Another sentence!";
  assert.equal(splitSpeech(unicode).join(""), unicode);
  assert.ok(splitSpeech(unicode).every(chunk => !/[\uD800-\uDBFF]$/u.test(chunk)));
});

test("playback reaches the final word without jumping or repeating sections", () => {
  const { reader, spoken, states } = fixture();
  const sections = storyNarration(regiusStories[0]);
  const start = sections.findIndex(section => section.parts[0].text.startsWith("Above these beginnings"));
  reader.start(sections, start);
  let completed = 0;
  while (states.at(-1)?.status === "playing") { spoken.at(-1)!.onend?.({}); assert.ok(++completed < 500); }
  assert.equal(spoken.map(utterance => utterance.text).join(""), narrationQueue(sections, start).map(chunk => chunk.text).join(""));
  assert.equal(states.at(-1)?.status, "finished");
});

test("jump, pause, stop and navigation invalidate delayed speech callbacks", () => {
  const { reader, spoken, states, cancellations } = fixture();
  const sections = storyNarration(regiusStories[0]);
  reader.start(sections, 0);
  const old = spoken.at(-1)!;
  reader.start(sections, 4);
  const current = spoken.at(-1)!;
  old.onend?.({}); old.onerror?.({ error: "interrupted" });
  assert.equal(spoken.at(-1), current);
  assert.equal(states.at(-1)?.section, 4);
  current.onboundary?.({ charIndex: 12 });
  reader.pause(); current.onend?.({});
  assert.equal(states.at(-1)?.status, "paused");
  reader.resume();
  assert.equal(spoken.at(-1)?.text, current.text.slice(12));
  const resumed = spoken.at(-1)!;
  reader.stop(); resumed.onend?.({});
  assert.equal(states.at(-1)?.status, "idle");
  reader.start(sections, 3);
  const beforeDispose = spoken.length;
  const disposed = spoken.at(-1)!;
  reader.dispose(); disposed.onend?.({});
  assert.equal(spoken.length, beforeDispose);
  assert.ok(cancellations() >= 5);
});

test("errors stop the queue and voice settings apply to subsequent phrases", () => {
  const { reader, spoken, states, options } = fixture();
  reader.start(storyNarration(regiusStories[0]), 0);
  options.rate = .8; options.pitch = .6;
  const previous = spoken.at(-1)!;
  previous.onend?.({});
  const count = spoken.length;
  previous.onend?.({}); previous.onerror?.({ error: "interrupted" });
  assert.equal(spoken.length, count);
  assert.equal(spoken.at(-1)?.rate, .8);
  assert.equal(spoken.at(-1)?.pitch, .6);
  const failed = spoken.at(-1)!;
  failed.onerror?.({ error: "not-allowed" }); failed.onend?.({});
  assert.equal(states.at(-1)?.status, "error");
  assert.match(states.at(-1)?.error ?? "", /blocked audio/);
  assert.equal(spoken.at(-1), failed);
});
