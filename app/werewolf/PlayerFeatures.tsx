"use client";

import { Moon } from "@phosphor-icons/react";
import type { GameView, Language } from "@/lib/werewolfClient";
import catalogue from "@/public/assets/werewolf/roles.json";
import { classicTableSeats } from "@/lib/nightfallPresentation";
import { PlayerTable, TableHourglass } from "@/app/nightfall/ui/PlayerTable";
import styles from "./werewolf.module.css";
export { Portrait, ProfilePicker } from "@/app/nightfall/ui/ProfilePhoto";

export function WolfHead({ size = 24 }: { size?: number }) {
  return <span role="img" aria-label="Wolf / 狼" className={styles.wolfHead} style={{ width: size, height: size }} />;
}
export function CircleSeats({ view, lang, now, onProfile }: { view: GameView; lang: Language; now: number; onProfile: () => void }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const timer = view.status === "finished" ? null : view.speakingTimer;
  const remaining = timer ? Math.min(timer.seconds, Math.max(0, Math.ceil((timer.endsAt ? timer.endsAt-now-(view.clockOffset||0) : timer.remainingMs||0)/1000))) : 0;
  return <PlayerTable lang={lang} seats={classicTableSeats(view,lang,id=>catalogue.roles.find(role=>role.id===id)?.name[lang]||id)} onProfile={onProfile} center={timer ? <TableHourglass remaining={remaining} duration={timer.seconds} paused={view.phase.paused} lang={lang}/> : <><Moon size={36}/><strong>NIGHTFALL</strong><span>{t(`${view.seats.length} players`, `${view.seats.length} 位玩家`)}</span></>}/>;
}
