"use client";

import type { Command, GameView, Language } from "@/lib/werewolfClient";
import catalogue from "@/public/assets/werewolf/roles.json";
import styles from "./werewolf.module.css";

export function stageText(view: GameView, lang: Language) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const phase = view.phase;
  if (phase.paused) return t("Game paused", "游戏已暂停");
  if (phase.kind === "night") {
    const roleId = phase.nightRole || (phase.step === "wolves" ? "werewolf" : phase.step);
    const role = catalogue.roles.find(role => role.id === roleId)?.name[lang] || t("First-night roles", "首夜角色");
    if (phase.nightStage === "closing") return t(`${role}: close your eyes`, `${role}：请闭眼`);
    if (phase.nightStage === "opening") return t(`${role}: open your eyes`, `${role}：请睁眼`);
    if (phase.step === "wolves") return t("Waiting for wolves to decide a kill", "等待狼人决定击杀目标");
    if (phase.step === "seer") return t("Waiting for the Seer to check a player", "等待预言家查验玩家");
    if (phase.step === "witch") return t("Waiting for the Witch’s potion decision", "等待女巫决定是否用药");
    return t(`Waiting for ${role} to act`, `等待${role}行动`);
  }
  if (phase.kind === "sheriff") return phase.step === "nomination" ? t("Sheriff: choose whether to run", "警长竞选：选择是否上警") : t(`Sheriff speeches · seat ${view.seats.findIndex(seat => seat.id === view.speakerSeatId) + 1}`, `警上发言 · ${view.seats.findIndex(seat => seat.id === view.speakerSeatId) + 1}号发言`);
  if (phase.kind === "announcement") return phase.step === "sheriffResult" ? t("Announcing the Sheriff result", "公布警长竞选结果") : t("Announcing last night’s result", "公布昨夜结果");
  if (phase.kind === "voting") return phase.step === "sheriff" ? t("Sheriff: waiting for non-candidates to vote", "警长竞选：等待警下玩家投票") : view.voteRound === 2 ? t("Exile runoff: vote for a tied player", "放逐复投：仅对平票玩家投票") : t("Daytime exile voting", "白天放逐投票");
  if (phase.kind === "ready") return t("Read your card and ready up", "查看身份并准备");
  if (phase.kind === "reaction") return t("Waiting for a final ability", "等待出局技能结算");
  if (phase.kind === "day") return phase.step === "afterVote" ? t("Vote complete · final words", "放逐结束 · 遗言阶段") : t("Village discussion", "白天讨论");
  return view.status === "finished" ? t("Game over", "游戏结束") : t("Lobby · waiting for players", "大厅 · 等待玩家加入");
}

export function StageBanner({ view, lang }: { view: GameView; lang: Language }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return <div className={styles.stageBanner} role="status" aria-live="polite"><span>{view.phase.kind === "night" ? t(`Night ${view.phase.number}`, `第${view.phase.number}夜`) : view.day ? t(`Day ${view.day}`, `第${view.day}天`) : t("Your table", "当前牌局")}</span><strong>{stageText(view, lang)}</strong></div>;
}

export function ElectionPanel({ view, lang, disabled, send }: { view: GameView; lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean> }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const election = view.election;
  const me = view.me;
  if (!election || !me || !(view.phase.kind === "sheriff" || view.phase.kind === "voting" && view.phase.step === "sheriff")) return null;
  const names = (ids: string[]) => ids.map(id => `${view.seats.findIndex(seat => seat.id === id) + 1} · ${view.seats.find(seat => seat.id === id)?.name}`).join(", ");
  const candidate = election.candidateIds.includes(me.seatId);
  const awaiting = view.phase.step === "nomination" && !election.declaredIds.includes(me.seatId);
  return <section className={styles.electionPanel}><h2>{t("Sheriff election", "警长竞选")}</h2><p>{t("Last night’s results are hidden until the election ends. Candidates, including anyone who withdraws, cannot vote.", "竞选结束后公布昨夜结果。上警玩家（包括退水者）不能投票。")}</p>
    <p><strong>{t("Candidates: ", "候选人：")}</strong>{names(election.candidateIds) || t("None yet", "暂无")}</p>
    {awaiting && <div className={styles.choiceRow}><button className={styles.primaryButton} disabled={disabled} onClick={() => void send({type:"sheriffInterest",run:true})}>{t("Run for Sheriff", "上警")}</button><button className={styles.secondaryButton} disabled={disabled} onClick={() => void send({type:"sheriffInterest",run:false})}>{t("Stay off the ballot", "不上警")}</button></div>}
    {view.phase.kind === "sheriff" && view.phase.step === "speeches" && <p>{t("Speaking now: ", "当前发言：")}{names(view.speakerSeatId ? [view.speakerSeatId] : [])}</p>}
    {view.phase.kind === "sheriff" && view.phase.step === "speeches" && view.speakerSeatId === me.seatId && <button className={styles.primaryButton} disabled={disabled} onClick={() => void send({type:"sheriffSpeechDone"})}>{t("I’ve finished speaking", "我已发言完毕")}</button>}
    {candidate && <button className={styles.secondaryButton} disabled={disabled} onClick={() => void send({type:"sheriffWithdraw"})}>{t("Withdraw candidacy", "退水")}</button>}
    {!!election.withdrawnIds.length && <p>{t("Withdrawn: ", "已退水：")}{names(election.withdrawnIds)}</p>}
  </section>;
}

export function VoteReview({ view, lang }: { view: GameView; lang: Language }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const vote = view.lastVote;
  const name = (id: string) => { const index = view.seats.findIndex(seat => seat.id === id); return index < 0 ? t("Former seat", "原座位") : `${index + 1} · ${view.seats[index].name}`; };
  if (!vote) return <p>{t("No vote has finished yet.", "尚未完成投票。")}</p>;
  return <div className={styles.historyList}><p>{vote.kind === "sheriff" ? t("Last Sheriff ballot", "上次警长投票") : t("Last exile ballot", "上次放逐投票")}</p><h3>{t("Totals", "票数")}</h3>{Object.entries(vote.tally).map(([id, count]) => <p key={id}>{name(id)}: <strong>{count}</strong></p>)}<h3>{t("Individual votes", "每人投票")}</h3>{Object.entries(vote.votes).map(([id, target]) => <p key={id}>{name(id)} → {target ? name(target) : t("Abstained", "弃票")}</p>)}</div>;
}
