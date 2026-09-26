"use client";

import { useState } from "react";
import { Play, Plus, Robot, Trash } from "@phosphor-icons/react";
import type { Language } from "./RoomChrome";
type Command = { type: string; [key: string]: unknown };
type GameView = { bots?: { count: number; mode: "automatic" | "manual" }; seats: {isBot?: boolean; occupied: boolean}[]; isHost: boolean; roleDeck: string[]; status: string; phase: { kind: string; nightStage?: string; paused?: boolean } };
type BotRules = { min: number; max: number; defaultPlayers: number; centerCards: number; canStep: boolean; stepHint?: string };
import styles from "./bot-controls.module.css";

function botCount(view: GameView) {
  return view.bots?.count ?? view.seats.filter(seat => seat.isBot).length;
}

export { BotLabel } from "@/app/nightfall/ui/PlayerTable";

export function BotNotice({ view, lang }: { view: GameView; lang: Language }) {
  const count = botCount(view);
  if (!count) return null;
  const automatic = view.bots?.mode !== "manual";
  return <div className={styles.notice} role="status"><Robot size={18} aria-hidden="true"/><span>{lang === "en" ? `Test table · ${count} ${count === 1 ? "bot" : "bots"}` : `测试牌局 · ${count}个机器人`}</span><small>{automatic ? lang === "en" ? "Automatic" : "自动行动" : lang === "en" ? "Host steps bots" : "房主手动推进"}</small></div>;
}

export function BotControls({ view, lang, disabled, send, rules }: { view: GameView; lang: Language; disabled: boolean; rules: BotRules; send: (command: Command) => Promise<boolean> }) {
  const [fill, setFill] = useState("deck");
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const count = botCount(view);
  const lobby = view.status === "lobby";
  const mode = view.bots?.mode || "automatic";
  const savedPlayers = view.roleDeck.length - rules.centerCards;
  const hasDeck = savedPlayers >= rules.min && savedPlayers <= rules.max;
  const deckSize = hasDeck ? savedPlayers : rules.defaultPlayers;
  const total = fill === "deck" ? deckSize : Number(fill);
  const toAdd = Math.max(0, total - view.seats.length);
  const available = rules.max - view.seats.length;
  const narration = view.phase.kind === "announcement" || view.phase.nightStage === "opening" || view.phase.nightStage === "closing";
  const canStep = rules.canStep && count > 0;
  if (!view.isHost) return null;
  return <details className={styles.panel}>
    <summary><Robot size={19} aria-hidden="true"/><span>{t("Test bots", "测试机器人")}</span><b>{count || "+"}</b></summary>
    <div className={styles.content}>
      <p>{t("Practice the game with bots that make legal moves. They do not reason or chat. You still play your own role and control the host’s steps.", "用机器人练习游戏流程。机器人只执行合法操作，不会推理或聊天。你仍需完成自己的行动，并使用房主控制推进阶段。")}</p>
      {lobby && <>
        <div className={styles.addRow}><button className={styles.button} disabled={disabled || available < 1} onClick={() => void send({ type: "addBots", count: 1 })}><Plus size={16}/>{t("Add one bot", "添加一个机器人")}</button><span>{t(`${view.seats.length} / ${rules.max} seats`, `${view.seats.length} / ${rules.max} 个座位`)}</span></div>
        <label className={styles.fillLabel}>{t("Fill the table to", "补齐到")}<select value={fill} onChange={event => setFill(event.target.value)} disabled={disabled}>
          <option value="deck">{hasDeck ? t(`Saved deck · ${deckSize} players`, `已保存牌组 · ${deckSize}人`) : t(`${rules.defaultPlayers} players total`, `总共${rules.defaultPlayers}人`)}</option>
          {Array.from({ length: rules.max - rules.min + 1 }, (_, index) => index + rules.min).map(size => <option key={size} value={size}>{t(`${size} players total`, `总共${size}人`)}</option>)}
        </select></label>
        <button className={`${styles.button} ${styles.primary}`} disabled={disabled || !toAdd || toAdd > available} onClick={() => void send({ type: "addBots", count: toAdd })}>{toAdd ? t(`Add ${toAdd} ${toAdd === 1 ? "bot" : "bots"}`, `添加${toAdd}个机器人`) : t("Table already has enough seats", "当前座位已足够")}</button>
        {!!view.roleDeck.length && total + rules.centerCards !== view.roleDeck.length && <p className={styles.hint}>{t("Choose a matching deck before dealing.", "发牌前，请选择人数匹配的牌组。")}</p>}
        {!!rules.centerCards && <p className={styles.hint}>{t(`For ${total} players, save ${total+rules.centerCards} cards: one each and ${rules.centerCards} in the center.`, `${total}人需保存${total+rules.centerCards}张牌：每人一张，另加${rules.centerCards}张中央牌。`)}</p>}
        {view.seats.some(seat => !seat.occupied) && <p className={styles.hint}>{t("Reserved seats still need players. Remove unused reservations in Manage players before dealing.", "预留座位仍需玩家入座；不用的预留座位请在玩家管理中移除后再发牌。")}</p>}
        {!!count && <button className={`${styles.button} ${styles.clear}`} disabled={disabled} onClick={() => void send({ type: "removeBots" })}><Trash size={16}/>{t("Remove all bots", "移除全部机器人")}</button>}
      </>}
      <fieldset className={styles.mode}><legend>{t("How bots act", "机器人行动方式")}</legend><div>
        <button className={mode === "automatic" ? styles.selected : ""} aria-pressed={mode === "automatic"} disabled={disabled || view.status === "finished"} onClick={() => void send({ type: "setBotMode", mode: "automatic" })}>{t("Automatic", "自动")}</button>
        <button className={mode === "manual" ? styles.selected : ""} aria-pressed={mode === "manual"} disabled={disabled || view.status === "finished"} onClick={() => void send({ type: "setBotMode", mode: "manual" })}>{t("Manual", "手动")}</button>
      </div></fieldset>
      <p className={styles.hint}>{mode === "automatic" ? t("Bots take turns automatically. Human actions and the host’s next-stage controls still wait for you.", "机器人会自动依次行动；真人行动及房主的阶段推进仍需你操作。") : t("Use the button below for one bot’s next decision, including readying its card.", "点击下方按钮，让一个机器人完成下一项选择，包括查看身份后的准备。")}</p>
      {!lobby && view.status !== "finished" && <><button className={`${styles.button} ${styles.primary}`} disabled={disabled || !canStep} onClick={() => void send({ type: "botStep" })}><Play size={16} weight="fill"/>{t("Run one bot action", "执行一次机器人行动")}</button>{rules.stepHint ? <p className={styles.hint}>{rules.stepHint}</p> : view.phase.paused ? <p className={styles.hint}>{t("Resume the game to let bots act.", "请先继续游戏，再让机器人行动。")}</p> : narration ? <p className={styles.hint}>{t("Wait for the announcement to finish.", "请等待本次语音播报结束。")}</p> : <p className={styles.hint}>{t("If no bot has a move, complete your action or use the host controls. This never skips a human player.", "如果当前没有机器人可行动，请完成自己的行动或使用房主控制。此按钮不会跳过真人玩家。")}</p>}</>}
    </div>
  </details>;
}
