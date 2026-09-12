import { readFileSync } from "node:fs";
import { join } from "node:path";
import { regiusStories } from "./codexRegius.ts";

export type OriginalBlock = { kind: "verse" | "prose" | "heading"; text: string; stanza?: string };
export type RegiusOriginal = {
  norse: OriginalBlock[]; english: OriginalBlock[];
  norseSource: string; englishSource: string; norseEdition: string; note: string;
};

export function getRegiusOriginal(slug: string): RegiusOriginal | undefined {
  if (!regiusStories.some(story => story.slug === slug)) return undefined;
  return JSON.parse(readFileSync(join(process.cwd(), "data", "codex-regius-originals", `${slug}.json`), "utf8")) as RegiusOriginal;
}
