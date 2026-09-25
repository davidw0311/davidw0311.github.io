import teamLabels from "../public/assets/nightfall/victory-teams.json" with { type: "json" };
import type { GameView as ClassicView } from "./werewolfClient";
import type { GameView as OneNightView } from "./oneNightClient";
export type Victory = { teamIds: string[]; winnerIds: string[]; draw: boolean };
export function classicVictory(view: ClassicView): Victory | null {
  if (view.status !== "finished" || !view.winner) return null;
  const team = typeof view.winner === "string" ? view.winner : view.winner.team;
  const ids = typeof view.winner === "object" ? view.winner.seatIds : undefined;
  return { teamIds: team && team !== "draw" ? [team] : [], winnerIds: view.seats.filter(seat => ids ? ids.includes(seat.id) : seat.team === team && team !== "draw").map(seat => seat.id), draw: team === "draw" };
}
export function oneNightVictory(view: OneNightView): Victory | null {
  if (view.status !== "finished" || !view.result) return null;
  const winners = view.seats.filter(seat => view.result!.winners.includes(seat.id)).map(seat => seat.id);
  return { teamIds: [...new Set(view.result.players.filter(player => winners.includes(player.seatId)).map(player => player.team))], winnerIds: winners, draw: false };
}
export function victoryTeamName(team: string, lang: "en" | "zh") {
  return (teamLabels as Record<string, { en: string; zh: string }>)[team]?.[lang] || team;
}
export function victoryHeading(result: Victory, lang: "en" | "zh") {
  if (result.draw) return lang === "en" ? "Draw" : "本局平局";
  if (!result.winnerIds.length) return lang === "en" ? "No winners this round" : "本局无人获胜";
  const teams = result.teamIds.map(team => victoryTeamName(team, lang)).join(lang === "en" ? " + " : "、");
  return lang === "en" ? `${teams} win${result.teamIds.length === 1 && !["wolf", "vampire", "alien", "villain", "lovers"].includes(result.teamIds[0]) ? "s" : ""}` : `${teams}获胜`;
}

export function personalVictory(result: Victory, seatId: string | undefined, lang: "en" | "zh") {
  if (result.draw) return lang === "en" ? "Draw" : "平局";
  if (!result.winnerIds.length) return lang === "en" ? "No winners this round" : "本局无人获胜";
  return seatId && result.winnerIds.includes(seatId) ? lang === "en" ? "You won!" : "你获胜了！" : lang === "en" ? "You lost this round" : "本局你未获胜";
}
