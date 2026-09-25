"use client";
import { useEffect, useRef } from "react";
import { Trophy, SpeakerHigh } from "@phosphor-icons/react";
import { victoryHeading, victoryTeamName, personalVictory, type Victory } from "@/lib/nightfallVictory";
import avatars from "@/public/assets/werewolf/avatars.json";
import styles from "./victory.module.css";
type Player = { id: string; number: number; name: string; photo?: string | null; role?: string; team?: string };
export function VictorySummary({ result, players, mySeatId, lang, reason, onReplay }: { result: Victory; players: Player[]; mySeatId?: string; lang: "en" | "zh"; reason?: string; onReplay: () => void }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "start", behavior: "instant" })); return () => cancelAnimationFrame(frame); }, []);
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const won = mySeatId && result.winnerIds.includes(mySeatId);
  const winners = players.filter(player => result.winnerIds.includes(player.id));
  return <section ref={panel} className={styles.summary} aria-label={t("Round results", "本局结果")}>
    <div className={styles.heading} role="status"><Trophy size={36} weight="duotone" aria-hidden="true"/><div><span className={styles.eyebrow}>{t("ROUND COMPLETE", "本局结束")}</span><h2>{victoryHeading(result, lang)}</h2></div></div>
    {mySeatId && <p className={`${styles.personal} ${won ? styles.won : ""}`}>{personalVictory(result, mySeatId, lang)}</p>}
    <button className={styles.replay} onClick={onReplay}><SpeakerHigh size={19}/>{t("Announce winners", "播报获胜结果")}</button>
    {!!winners.length && <><h3>{t("Winning players", "获胜玩家")} <span>({winners.length})</span></h3><ul className={styles.players}>{winners.map(player => <li key={player.id}><b className={styles.number}>{player.number}</b><span className={styles.photo} aria-hidden="true" style={player.photo?.startsWith("data:image/jpeg;base64,") ? {backgroundImage:`url("${player.photo}")`} : undefined}>{player.photo?.startsWith("data:image/jpeg;base64,") ? null : avatars.find(avatar => avatar.id === player.photo)?.glyph || Array.from(player.name)[0]}</span><div><strong>{player.name}{player.id === mySeatId && <span className={styles.you}>{t("You", "你")}</span>}</strong><small>{[player.role, player.team ? victoryTeamName(player.team, lang) : ""].filter(Boolean).join(" · ")}</small></div><Trophy size={18} aria-hidden="true"/></li>)}</ul></>}
    {reason && <p className={styles.reason}>{reason}</p>}
  </section>;
}
