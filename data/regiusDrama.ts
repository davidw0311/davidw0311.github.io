import voluspa from "./regius-drama/voluspa.json" with { type: "json" };
import havamal from "./regius-drama/havamal.json" with { type: "json" };
import vafthrudnismal from "./regius-drama/vafthrudnismal.json" with { type: "json" };

export type DramaTurn = { character: string; text: string };
export type RegiusDrama = { version: number; note: string; quoteCharacter: string; sections: { id: string; turns: DramaTurn[] }[] };
export const regiusDramas: Record<string, RegiusDrama> = { voluspa, havamal, vafthrudnismal };
export function displayTurn(turn: DramaTurn) { return turn.character === "narrator" ? turn.text : `“${turn.text}”`; }
