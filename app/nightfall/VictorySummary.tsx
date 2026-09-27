"use client";
import { useEffect, useRef } from "react";
import { Trophy, SpeakerHigh } from "@phosphor-icons/react";
import { victoryHeading, victoryTeamName, personalVictory, type Victory } from "@/lib/nightfallVictory";
import { Portrait } from "./ui/ProfilePhoto";
import styles from "./victory.module.css";
type Player = { id: string; number: number; name: string; photo?: string | null; role?: string; team?: string };
export function VictorySummary({ result, players, mySeatId, lang, reason, onReplay, voteOutcome }: { result: Victory; players: Player[]; mySeatId?: string; lang: "en" | "zh"; reason?: string; onReplay: () => void; voteOutcome?: { eliminatedIds: string[]; counts: Record<string, number> } }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "start", behavior: "instant" })); return () => cancelAnimationFrame(frame); }, []);
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const won = mySeatId && result.winnerIds.includes(mySeatId);
  const winners = players.filter(player => result.winnerIds.includes(player.id));
  const eliminated = voteOutcome ? players.filter(player => voteOutcome.eliminatedIds.includes(player.id)) : [];
  return <section ref={panel} className={styles.summary} aria-label={t("Round results", "本局结果")}>
    <div className={styles.heading} role="status"><Trophy size={36} weight="duotone" aria-hidden="true"/><div><span className={styles.eyebrow}>{t("ROUND COMPLETE", "本局结束")}</span><h2>{victoryHeading(result, lang)}</h2></div></div>
    {mySeatId && <p className={`${styles.personal} ${won ? styles.won : ""}`}>{personalVictory(result, mySeatId, lang)}</p>}
    {voteOutcome && <section className={styles.voteOutcome} aria-label={t("Vote result", "投票结果")}>
      <h3>{t("Vote result", "投票结果")}</h3>
      {eliminated.length ? <><p className={styles.outcomeLabel}>{t("Eliminated", "出局玩家")}</p><ul className={styles.players}>{eliminated.map(player => <li key={player.id}><b className={styles.number}>{player.number}</b><span className={styles.photo} aria-hidden="true"><Portrait seat={player}/></span><div><strong>{player.name}{player.id === mySeatId && <span className={styles.you}>{t("You", "你")}</span>}</strong><small>{player.role} · {t(`${voteOutcome.counts[player.id] || 0} votes received`, `获得${voteOutcome.counts[player.id] || 0}票`)}</small></div></li>)}</ul><p className={styles.outcomeNote}>{t("Final eliminations after votes, protection and role abilities resolve.", "以上为投票、保护和角色技能结算后的最终出局名单。")}</p></> : <p className={styles.outcomeLabel}>{t("Nobody was eliminated.", "本轮无人出局。")}</p>}
    </section>}
    <button className={styles.replay} onClick={onReplay}><SpeakerHigh size={19}/>{t("Announce winners", "播报获胜结果")}</button>
    {!!winners.length && <><h3>{t("Winning players", "获胜玩家")} <span>({winners.length})</span></h3><ul className={styles.players}>{winners.map(player => <li key={player.id}><b className={styles.number}>{player.number}</b><span className={styles.photo} aria-hidden="true"><Portrait seat={player}/></span><div><strong>{player.name}{player.id === mySeatId && <span className={styles.you}>{t("You", "你")}</span>}</strong><small>{[player.role, player.team ? victoryTeamName(player.team, lang) : ""].filter(Boolean).join(" · ")}</small></div><Trophy size={18} aria-hidden="true"/></li>)}</ul></>}
    {reason && <p className={styles.reason}>{reason}</p>}
  </section>;
}
