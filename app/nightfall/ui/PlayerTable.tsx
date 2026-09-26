"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { ArrowClockwise, Crown, Medal, Robot, Shield, TreasureChest } from "@phosphor-icons/react";
import type { Language, PlayerProfile } from "./RoomChrome";
import { Portrait } from "./ProfilePhoto";
import styles from "./shared.module.css";

export type TableSeat = PlayerProfile & { id: string; number: number; status: string; mine?: boolean; offline?: boolean; dead?: boolean; winner?: boolean; speaking?: boolean; pending?: boolean; host?: boolean; sheriff?: boolean; isBot?: boolean; shielded?: boolean; hasArtifact?: boolean; detail?: string; silenced?: boolean };

export function BotLabel({ lang, overlay = false }: { lang: Language; overlay?: boolean }) {
  const label = lang === "en" ? "Test bot" : "测试机器人";
  return <span className={overlay ? styles.botOverlay : styles.botLabel} title={label} role="img" aria-label={label}><Robot size={overlay ? 14 : 13} weight="fill" aria-hidden="true"/>{!overlay && <span aria-hidden="true">{lang === "en" ? "BOT" : "机器人"}</span>}</span>;
}

export function TableHourglass({ remaining, duration, paused, lang }: { remaining: number; duration: number; paused?: boolean; lang: Language }) {
  const clipId = useId().replace(/:/g, "");
  const fraction = Math.min(1, Math.max(0, remaining / Math.max(1, duration)));
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return <div className={styles.tableHourglass} role="timer" aria-label={t(`${remaining} seconds remaining`, `剩余${remaining}秒`)}><svg viewBox="0 0 70 96" aria-hidden="true"><defs><clipPath id={clipId}><path d="M12 8H58V18L38 46V50L58 78V88H12V78L32 50V46L12 18Z"/></clipPath></defs><g clipPath={`url(#${clipId})`}><rect x="12" y={46-38*fraction} width="46" height={38*fraction} fill="#d5b473"/><rect x="12" y={88-38*(1-fraction)} width="46" height={38*(1-fraction)} fill="#d5b473"/>{remaining>0 && !paused && <path d="M35 46V82" stroke="#d5b473" strokeWidth="2"/>}</g><path d="M12 8H58V18L38 46V50L58 78V88H12V78L32 50V46L12 18Z M8 6H62 M8 90H62" fill="none" stroke="#e8dfcd" strokeWidth="3"/></svg><strong>{remaining ? `${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}` : t("Time’s up", "时间到")}</strong>{paused && <span>{t("Paused", "已暂停")}</span>}</div>;
}

/** Renders public seat information only; game rules stay in the adapters. */
export function PlayerTable({ seats, lang, center, onProfile }: { seats: TableSeat[]; lang: Language; center: ReactNode; onProfile: () => void }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const large = seats.length > 6, rows = Math.ceil(seats.length / 2);
  return <div className={styles.tableScroll} aria-label={t("Players seated clockwise around the table", "玩家按顺时针入座")}><div className={`${styles.table} ${large ? styles.largeTable : ""}`} style={large ? { "--seat-rows": rows } as CSSProperties : undefined}>
    <div className={styles.tableCenter}>{center}{large && <span className={styles.clockwise}><ArrowClockwise size={15}/>{t("Clockwise", "顺时针")}</span>}</div>
    {seats.map((seat, index) => {
      const angle = index * 2 * Math.PI / Math.max(1, seats.length) - Math.PI / 2;
      const position = large ? { gridColumn: index < rows ? 3 : 1, gridRow: index < rows ? index + 1 : seats.length - index } : { left: `${50 + 37 * Math.cos(angle)}%`, top: `${50 + 37 * Math.sin(angle)}%` };
      return <div key={seat.id} style={position} className={[styles.seat,seat.mine && styles.mySeat,seat.dead && styles.deadSeat,seat.winner && styles.winnerSeat,seat.speaking && styles.speakingSeat,seat.offline && styles.offlineSeat,seat.pending && styles.pendingSeat].filter(Boolean).join(" ")}>
        <div className={styles.portraitWrap}><button className={styles.avatar} disabled={!seat.mine} onClick={seat.mine ? onProfile : undefined} aria-label={t(`Seat ${seat.number}: ${seat.name}${seat.isBot ? ", test bot" : ""}${seat.mine ? ", change profile photo" : ""}`, `${seat.number}号：${seat.name}${seat.isBot ? "，测试机器人" : ""}${seat.mine ? "，更换头像" : ""}`)}><Portrait seat={seat}/>{seat.dead && <span className={styles.deadCross} aria-hidden="true">×</span>}{seat.host && <Crown size={15} className={styles.hostCrown} weight="fill"/>}</button>{seat.isBot && <BotLabel lang={lang} overlay/>}<span className={styles.seatNumber}>{seat.number}</span>{seat.sheriff && <Medal className={styles.sheriffBadge} size={20} weight="fill" aria-label={t("Sheriff badge", "警徽")}/>}{(seat.shielded || seat.hasArtifact) && <div className={styles.tokens}>{seat.shielded && <Shield size={15} weight="fill" aria-label={t("Shielded card", "身份牌有护盾")}/>} {seat.hasArtifact && <TreasureChest size={15} aria-label={t("Has a private artifact", "持有秘密神器")}/>}</div>}</div>
        <div className={styles.seatInfo}><strong title={seat.name}>{seat.name}</strong><span>{seat.status}</span>{seat.silenced && <small>{t("Silenced", "禁言中")}</small>}{seat.detail && <small>{seat.detail}</small>}</div>
      </div>;
    })}
  </div></div>;
}
