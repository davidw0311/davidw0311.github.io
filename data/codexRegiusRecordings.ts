import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { RegiusRecording } from "../lib/regiusRecordedNarration.ts";
import type { NarrationSection } from "../lib/regiusNarration.ts";

export type RegiusCastRegistry = {
  characters: Record<string, { voiceId: string }>;
  voices: Record<string, { sha256: string }>;
};
export function recordingCastMatches(recording: RegiusRecording, registry: RegiusCastRegistry): boolean {
  if (recording.format !== "drama") return true;
  return recording.clips.filter(clip => clip.lang === "en").every(clip => {
    const character = registry.characters[clip.character ?? ""];
    return Boolean(character && clip.voiceId === character.voiceId && clip.referenceHash === registry.voices[character.voiceId]?.sha256);
  });
}

export function getRegiusRecording(slug: string, sections: NarrationSection[]): RegiusRecording | null {
  if (!/^[a-z-]+$/.test(slug)) return null;
  try {
    const recording = JSON.parse(readFileSync(join(process.cwd(), sections.some(section => section.parts.some(part => part.character)) ? "data/codex-regius-drama-audio" : "data/codex-regius-audio", `${slug}.json`), "utf8")) as RegiusRecording;
    if (recording.format === "drama") {
      const registry = JSON.parse(readFileSync(join(process.cwd(), "data/regiusVoiceRegistry.json"), "utf8"));
      if (!recordingCastMatches(recording, registry)) return null;
    }
    // Never play an out-of-date recording after the displayed story changes.
    return recording.textHash === createHash("sha256").update(JSON.stringify(sections)).digest("hex") ? recording : null;
  } catch { return null; }
}
