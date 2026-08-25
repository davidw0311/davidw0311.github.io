import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { noteFrequency, pianoNotes } from "../data/pianoNotes.ts";

const sampleRate = 24_000;
const durationSeconds = 1.35;
const sampleCount = Math.floor(sampleRate * durationSeconds);
const outputDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/audio/piano-party",
);

function envelope(time) {
  const attack = Math.min(1, time / 0.008);
  const decay = Math.exp(-3.4 * time);
  const release = Math.min(1, (durationSeconds - time) / 0.08);
  return attack * decay * Math.max(0, release);
}

function pianoSample(frequency, time) {
  const partials = [
    { ratio: 1, level: 0.72 },
    { ratio: 2.003, level: 0.22 },
    { ratio: 3.008, level: 0.1 },
    { ratio: 4.015, level: 0.045 },
  ];
  const strike = Math.exp(-42 * time) * Math.sin(2 * Math.PI * frequency * 7.1 * time) * 0.09;
  const tone = partials.reduce(
    (sum, partial) => sum + Math.sin(2 * Math.PI * frequency * partial.ratio * time) * partial.level,
    0,
  );
  return Math.tanh((tone * envelope(time) + strike) * 1.15) * 0.82;
}

function createWav(frequency) {
  const bytesPerSample = 2;
  const dataLength = sampleCount * bytesPerSample;
  const wav = Buffer.alloc(44 + dataLength);

  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataLength, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * bytesPerSample, 28);
  wav.writeUInt16LE(bytesPerSample, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const value = pianoSample(frequency, index / sampleRate);
    wav.writeInt16LE(Math.round(value * 32_767), 44 + index * bytesPerSample);
  }

  return wav;
}

await mkdir(outputDirectory, { recursive: true });
for (const note of pianoNotes) {
  await writeFile(path.join(outputDirectory, `${note.midi}.wav`), createWav(noteFrequency(note.midi)));
}

process.stdout.write(`Generated ${pianoNotes.length} Piano Party note files.\n`);
