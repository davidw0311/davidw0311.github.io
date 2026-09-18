import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { RegiusRecording } from "../lib/regiusRecordedNarration.ts";
import type { NarrationSection } from "../lib/regiusNarration.ts";

export function getRegiusRecording(slug: string, sections: NarrationSection[]): RegiusRecording | null {
  if (!/^[a-z-]+$/.test(slug)) return null;
  try {
    const recording = JSON.parse(readFileSync(join(process.cwd(), "data/codex-regius-audio", `${slug}.json`), "utf8")) as RegiusRecording;
    // Never play an out-of-date recording after the displayed story changes.
    return recording.textHash === createHash("sha256").update(JSON.stringify(sections)).digest("hex") ? recording : null;
  } catch { return null; }
}
