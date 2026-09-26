import catalogue from "../public/assets/nightfall/narrators/catalogue.json" with { type: "json" };
import victoryText from "../public/assets/nightfall/audio/text.json" with { type: "json" };

export type NightfallGame = "werewolf" | "one-night";
export type ChineseNarrator = "brian" | "kokoro" | "m10" | "m07" | "m04" | "f13" | "f12" | "f18";
export const CHINESE_NARRATORS = [
  {id:"brian", name:{en:"Brian · Original",zh:"Brian · 经典旁白"}},
  {id:"kokoro", name:{en:"Kokoro · Steady Voice",zh:"Kokoro · 沉稳男声"}},
  ...catalogue.narrators,
] as const;

export function chineseNarrator(value: unknown, game: NightfallGame): ChineseNarrator {
  const fallback = game === "werewolf" ? "brian" : "kokoro";
  if (value === "brian" && game === "one-night") return fallback;
  return CHINESE_NARRATORS.some(item => item.id === value) ? value as ChineseNarrator : fallback;
}

/** Resolve at the start of each clip: switching voices never interrupts a cue. */
export function narrationSource(game: NightfallGame, cue: string, language: "en" | "zh", selected?: ChineseNarrator): string {
  if (cue === "timer-bell") return "/assets/werewolf/audio/timer-bell.wav";
  const narrator = chineseNarrator(selected, game);
  if (language === "zh" && narrator !== "brian") {
    const id = (catalogue.games[game] as Record<string,string>)[cue];
    if (id) {
      const existing = narrator === "kokoro" && (catalogue.kokoro as Record<string,string>)[id];
      return existing || `/assets/nightfall/narrators/${narrator}/${id}.mp3`;
    }
  }
  return `/assets/${Object.hasOwn(victoryText,cue) ? "nightfall" : game}/audio/${language}/${cue}.mp3`;
}
