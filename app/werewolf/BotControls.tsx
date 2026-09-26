"use client";

import type { Command, GameView, Language } from "@/lib/werewolfClient";
import { BotControls as SharedBotControls } from "@/app/nightfall/ui/BotControls";
export { BotLabel as BotLabel } from "@/app/nightfall/ui/PlayerTable";
export { BotNotice as BotNotice } from "@/app/nightfall/ui/BotControls";

export function BotControls({ view, lang, disabled, send }: { view: GameView; lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean> }) {
  const narration = view.phase.kind === "announcement" || view.phase.nightStage === "opening" || view.phase.nightStage === "closing";
  return <SharedBotControls view={view} lang={lang} disabled={disabled} send={send} rules={{min:6,max:24,defaultPlayers:12,centerCards:0,canStep:view.status === "playing" && !view.phase.paused && !narration}}/>;
}
