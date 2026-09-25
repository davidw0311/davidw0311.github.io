"use client";

import { useState } from "react";
import { Play, Plus, Robot, Trash } from "@phosphor-icons/react";
import type { Command, GameView, Language } from "@/lib/oneNightClient";
import styles from "./bot-controls.module.css";

function botCount(view: GameView) {
  return view.bots?.count ?? view.seats.filter(seat => seat.isBot).length;
}

export function OneNightBotLabel({ lang, overlay = false }: { lang: Language; overlay?: boolean }) {
  const label = lang === "en" ? "Test bot" : "测试机器人";
  return <span className={overlay ? styles.avatarBadge : styles.label} title={label} role="img" aria-label={label}><Robot size={overlay ? 14 : 13} weight="fill" aria-hidden="true"/>{!overlay && <span aria-hidden="true">{lang === "en" ? "BOT" : "机器人"}</span>}</span>;
}

export function OneNightBotNotice({ view, lang }: { view: GameView; lang: Language }) {
  const count = botCount(view);
  if (!count) return null;
  const automatic = view.bots?.mode !== "manual";
  return <div className={styles.notice} role="status"><Robot size={18} aria-hidden="true"/><span>{lang === "en" ? `Test table · ${count} ${count === 1 ? "bot" : "bots"}` : `测试牌局 · ${count}个机器人`}</span><small>{automatic ? lang === "en" ? "Automatic" : "自动行动" : lang === "en" ? "Host steps bots" : "房主手动推进"}</small></div>;
}

export function OneNightBotControls({ view, lang, disabled, send }: { view: GameView; lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean> }) {
  const [fill, setFill] = useState("deck");
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const count = botCount(view);
  const lobby = view.status === "lobby";
  const mode = view.bots?.mode || "automatic";
  const savedPlayers = view.roleDeck.length - 3;
  const hasDeck = savedPlayers >= 3 && savedPlayers <= 16;
  const total = fill === "deck" ? hasDeck ? savedPlayers : 6 : Number(fill);
  const toAdd = Math.max(0, total - view.seats.length);
  const available = 16 - view.seats.length;
  const narration = view.phase.nightStage === "opening" || view.phase.nightStage === "closing";
  const canStep = view.status === "playing" && count > 0 && (view.phase.kind === "ready" || view.phase.kind === "voting" || view.phase.kind === "night" && !narration);
  const issue = (command: Command) => send({ ...command, expectedPhaseId: view.phase.id });
  if (!view.isHost) return null;
  return <details className={styles.panel}>
    <summary><Robot size={19} aria-hidden="true"/><span>{t("Test bots", "测试机器人")}</span><b>{count || "+"}</b></summary>
    <div className={styles.content}>
      <p>{t("Practice with bots that make legal choices. They do not reason or chat. You still play your own card and control the host’s steps.", "用机器人练习游戏流程。机器人只执行合法选择，不会推理或聊天。你仍需完成自己的行动，并使用房主控制推进阶段。")}</p>
      {lobby && <>
        <div className={styles.addRow}><button className={styles.button} disabled={disabled || available < 1} onClick={() => void issue({ type: "addBots", count: 1 })}><Plus size={16}/>{t("Add one bot", "添加一个机器人")}</button><span>{t(`${view.seats.length} / 16 seats`, `${view.seats.length} / 16 个座位`)}</span></div>
        <label className={styles.fillLabel}>{t("Fill the table to", "补齐到")}<select value={fill} onChange={event => setFill(event.target.value)} disabled={disabled}>
          <option value="deck">{hasDeck ? t(`Saved deck · ${savedPlayers} players`, `已保存牌组 · ${savedPlayers}人`) : t("6 players total", "总共6人")}</option>
          {Array.from({ length: 14 }, (_, index) => index + 3).map(size => <option key={size} value={size}>{t(`${size} players total`, `总共${size}人`)}</option>)}
        </select></label>
        <button className={`${styles.button} ${styles.primary}`} disabled={disabled || !toAdd || toAdd > available} onClick={() => void issue({ type: "addBots", count: toAdd })}>{toAdd ? t(`Add ${toAdd} ${toAdd === 1 ? "bot" : "bots"}`, `添加${toAdd}个机器人`) : t("Table already has enough seats", "当前座位已足够")}</button>
        <p className={styles.hint}>{t(`For ${total} players, save a deck of ${total + 3} cards: one each and three in the center.`, `${total}人需要保存${total + 3}张牌：每人一张，另加三张中央牌。`)}</p>
        {view.seats.some(seat => !seat.occupied) && <p className={styles.hint}>{t("Reserved seats still need players. Remove unused reservations in Manage players before dealing.", "预留座位仍需玩家入座；不用的预留座位请在玩家管理中移除后再发牌。")}</p>}
        {!!count && <button className={`${styles.button} ${styles.clear}`} disabled={disabled} onClick={() => void issue({ type: "removeBots" })}><Trash size={16}/>{t("Remove all bots", "移除全部机器人")}</button>}
      </>}
      <fieldset className={styles.mode}><legend>{t("How bots act", "机器人行动方式")}</legend><div>
        <button className={mode === "automatic" ? styles.selected : ""} aria-pressed={mode === "automatic"} disabled={disabled || view.status === "finished"} onClick={() => void issue({ type: "setBotMode", mode: "automatic" })}>{t("Automatic", "自动")}</button>
        <button className={mode === "manual" ? styles.selected : ""} aria-pressed={mode === "manual"} disabled={disabled || view.status === "finished"} onClick={() => void issue({ type: "setBotMode", mode: "manual" })}>{t("Manual", "手动")}</button>
      </div></fieldset>
      <p className={styles.hint}>{mode === "automatic" ? t("Bots ready up, act and vote automatically. You begin the night, open voting and reveal the result.", "机器人会自动准备、行动和投票。夜晚开始、开启投票及结果揭晓仍由你控制。") : t("Bots wait for the button below. Each press completes one bot decision, including readying its card.", "机器人等待下方按钮。每次点击只完成一个机器人的一项选择，包括查看身份后的准备。")}</p>
      {!lobby && view.status !== "finished" && <><button className={`${styles.button} ${styles.primary}`} disabled={disabled || !canStep} onClick={() => void issue({ type: "botStep" })}><Play size={16} weight="fill"/>{t("Run one bot action", "执行一次机器人行动")}</button><p className={styles.hint}>{narration ? t("Wait for the announcement to finish.", "请等待本次语音播报结束。") : view.phase.kind === "discussion" ? t("The host opens voting after discussion. Bots do not skip this stage.", "讨论结束后，由房主开启投票。机器人不会跳过讨论阶段。") : t("If no bot has a move, complete your action or use host controls. This never skips a human player.", "如果当前没有机器人可行动，请完成自己的行动或使用房主控制。此按钮不会跳过真人玩家。")}</p></>}
    </div>
  </details>;
}
