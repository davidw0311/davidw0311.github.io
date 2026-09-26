"use client";

import type { Command, GameView, Language } from "@/lib/oneNightClient";
import { BotControls as SharedBotControls } from "@/app/nightfall/ui/BotControls";
export { BotLabel as OneNightBotLabel } from "@/app/nightfall/ui/PlayerTable";
export { BotNotice as OneNightBotNotice } from "@/app/nightfall/ui/BotControls";

export function OneNightBotControls({ view, lang, disabled, send }: { view: GameView; lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean> }) {
  const narration = view.phase.kind === "announcement" || view.phase.nightStage === "opening" || view.phase.nightStage === "closing";
  return <SharedBotControls view={view} lang={lang} disabled={disabled} send={command=>send({...command,expectedPhaseId:view.phase.id})} rules={{min:3,max:16,defaultPlayers:6,centerCards:3,canStep:view.status === "playing" && (view.phase.kind === "ready" || view.phase.kind === "voting" || view.phase.kind === "night" && !narration),stepHint:view.phase.kind === "discussion" ? lang === "en" ? "The host opens voting after discussion. Bots do not skip this stage." : "讨论结束后，由房主开启投票。机器人不会跳过讨论阶段。" : undefined}}/>;
}
