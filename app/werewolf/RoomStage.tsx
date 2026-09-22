"use client";

import { useId, useState } from "react";
import { Portrait } from "./PlayerFeatures";
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
  if (phase.kind === "sheriff") return phase.step === "nomination" ? t("Sheriff: choose whether to run", "警长竞选：选择是否上警") : t(view.speakerSeatId ? `Sheriff speeches · seat ${view.seats.findIndex(seat => seat.id === view.speakerSeatId) + 1}` : "Sheriff speeches complete", view.speakerSeatId ? `警上发言 · ${view.seats.findIndex(seat => seat.id === view.speakerSeatId) + 1}号发言` : "警上发言完毕");
  if (phase.kind === "announcement") return phase.step === "dayDeaths" ? t("Announcing eliminated players", "公布出局玩家") : phase.step === "sheriffResult" ? t("Announcing the Sheriff result", "公布警长竞选结果") : t("Announcing last night’s result", "公布昨夜结果");
  if (phase.kind === "voting") return phase.step === "sheriff" ? t("Sheriff: waiting for non-candidates to vote", "警长竞选：等待警下玩家投票") : view.voteRound === 2 ? t("Exile runoff: vote for a tied player", "放逐复投：仅对平票玩家投票") : t("Daytime exile voting", "白天放逐投票");
  if (phase.kind === "ready") return t("Read your card and ready up", "查看身份并准备");
  if (phase.kind === "reaction") return t("Waiting for a final ability", "等待出局技能结算");
  if (phase.kind === "day") return phase.step === "afterVote" ? t("Vote complete · final words", "放逐结束 · 遗言阶段") : t("Village discussion", "白天讨论");
  return view.status === "finished" ? t("Game over", "游戏结束") : t("Lobby · waiting for players", "大厅 · 等待玩家加入");
}

export function StageBanner({ view, lang }: { view: GameView; lang: Language }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const ownIndex = view.seats.findIndex(seat => seat.id === view.me?.seatId);
  const ownSeat = view.seats[ownIndex];
  const dead = ownSeat && !ownSeat.alive && view.status !== "lobby";
  const result = view.phase.kind !== "night" && view.phase.kind !== "ready" && view.phase.kind !== "sheriff" ? view.lastNight : null;
  return <div className={styles.stageBanner}>
    {ownSeat && <div className={`${styles.playerIdentity} ${dead ? styles.youEliminated : ""}`}><div className={styles.selfPortrait}><Portrait seat={ownSeat} /></div><div><span>{t(`YOU · SEAT ${ownIndex + 1}`, `你 · ${ownIndex + 1}号`)}</span><strong>{ownSeat.name}</strong></div><b>{dead ? t("ELIMINATED", "已出局") : view.status === "lobby" ? t("In lobby", "已入座") : t("ALIVE", "存活")}</b></div>}
    <div className={styles.stageLine} role="status" aria-live="polite"><span>{view.phase.kind === "night" ? t(`Night ${view.phase.number}`, `第${view.phase.number}夜`) : view.day ? t(`Day ${view.day}`, `第${view.day}天`) : t("Your table", "当前牌局")}</span><strong>{stageText(view, lang)}</strong></div>
    {view.phase.kind === "voting" && <p className={styles.pendingVotes} role="status">{view.pendingVoterIds?.length ? t("Still to vote: ", "等待投票：") + view.pendingVoterIds.map(id => `${view.seats.findIndex(seat => seat.id === id)+1} · ${view.seats.find(seat => seat.id === id)?.name}`).join(", ") : t("Everyone has voted", "所有人已投票")}</p>}
    {result && <div className={styles.daybreakSummary} role="status"><strong>{t(`Night ${result.night} result: `, `第${result.night}夜结果：`)}</strong>{result.numbers.length ? t(`Eliminated — ${result.numbers.map((number,index) => `${number} · ${view.seats.find(seat => seat.id === result.eliminatedSeatIds[index])?.name || ""}`).join(", ")}`, `出局 — ${result.numbers.map((number,index) => `${number}号 ${view.seats.find(seat => seat.id === result.eliminatedSeatIds[index])?.name || ""}`).join("、")}`) : t("Nobody died", "平安夜，无人出局")}</div>}
  </div>;
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
    {candidate && view.phase.kind === "sheriff" && <button className={styles.secondaryButton} disabled={disabled} onClick={() => void send({type:"sheriffWithdraw"})}>{t("Withdraw candidacy", "退水")}</button>}
    {view.phase.kind === "sheriff" && election.withdrawnIds.includes(me.seatId) && <button className={styles.secondaryButton} disabled={disabled} onClick={() => void send({type:"sheriffRejoin"})}>{t("Rejoin the election", "重新上警")}</button>}
    {view.isHost && view.phase.kind === "sheriff" && <button className={styles.primaryButton} disabled={disabled || view.phase.step === "nomination" && election.declaredIds.length < view.seats.filter(seat=>seat.alive).length} onClick={() => void send({type:"advanceElection"})}>{view.phase.step === "nomination" ? t("Next: candidate speeches", "下一步：警上发言") : t("Next: open Sheriff voting", "下一步：警长投票")}</button>}
    {!!election.withdrawnIds.length && <p>{t("Withdrawn: ", "已退水：")}{names(election.withdrawnIds)}</p>}
  </section>;
}

export function VoteReview({ view, lang }: { view: GameView; lang: Language }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const markerId = useId().replace(/:/g, "");
  const vote = view.lastVote;
  const name = (id: string) => { const index = view.seats.findIndex(seat => seat.id === id); return index < 0 ? t("Former seat", "原座位") : `${index + 1} · ${view.seats[index].name}`; };
  if (!vote) return <p>{t("No vote has finished yet.", "尚未完成投票。")}</p>;
  const point = (id: string) => { const angle = view.seats.findIndex(seat => seat.id === id) * Math.PI * 2 / view.seats.length - Math.PI / 2; return {x:200+157*Math.cos(angle), y:200+157*Math.sin(angle)}; };
  return <div className={styles.historyList}><p>{vote.kind === "sheriff" ? t("Last Sheriff ballot", "上次警长投票") : t("Last exile ballot", "上次放逐投票")}</p>
    <svg className={styles.voteDiagram} viewBox="0 0 400 400" role="img" aria-label={t("Arrows show each player's vote", "箭头显示每位玩家的投票")}><defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
      {Object.entries(vote.votes).filter(([,target]) => target).map(([id,target]) => { const a=point(id), b=point(target!); const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1; const ux=(200-a.x)/157, uy=(200-a.y)/157; const path = id===target ? `M ${a.x-uy*17+ux*8} ${a.y+ux*17+uy*8} C ${a.x-uy*50+ux*65} ${a.y+ux*50+uy*65} ${a.x+uy*50+ux*65} ${a.y-ux*50+uy*65} ${a.x+uy*17+ux*8} ${a.y-ux*17+uy*8}` : `M ${a.x+dx/d*21} ${a.y+dy/d*21} Q ${200-dy*.08} ${200+dx*.08} ${b.x-dx/d*23} ${b.y-dy/d*23}`; return <path key={id} d={path} fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".7" markerEnd={`url(#${markerId})`}><title>{name(id)} → {name(target!)}</title></path>; })}
      {view.seats.map((seat,index) => { const p=point(seat.id); return <g key={seat.id}><circle cx={p.x} cy={p.y} r="20" fill="#1e2431" stroke="#ac9ac9"/><text x={p.x} y={p.y+6} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">{index+1}</text><title>{name(seat.id)}</title></g>; })}
    </svg><h3>{t("Totals", "票数")}</h3>{Object.entries(vote.tally).map(([id,count]) => <p key={id}>{name(id)}: <strong>{count}</strong></p>)}<p>{t("Abstained: ", "弃票：")}{Object.entries(vote.votes).filter(([,target])=>target===null).map(([id])=>name(id)).join(", ") || "—"}</p><details><summary>{t("Individual votes", "每人投票")}</summary>{Object.entries(vote.votes).map(([id,target])=><p key={id}>{name(id)} → {target ? name(target) : t("Abstained", "弃票")}</p>)}</details></div>;

}

export function SpeakingTimer({view, lang, disabled, soundReady, onEnable, send}: {view:GameView; lang:Language; disabled:boolean; soundReady:boolean; onEnable:()=>void; send:(command:Command)=>Promise<boolean>}) {
  const [seconds,setSeconds]=useState("60");
  const t=(en:string,zh:string)=>lang==="en"?en:zh;
  const active=view.phase.kind==="day" || view.phase.kind==="sheriff" && view.phase.step==="speeches";
  if(!active || !view.isHost && (!view.speakingTimer || soundReady)) return null;
  const timer=view.speakingTimer;

  return <section className={styles.speakingTimer}>

    {view.isHost && <details><summary>{timer ? t("Adjust speaking timer", "调整发言计时") : t("Set speaking timer", "设置发言计时")}</summary><label>{t("Seconds (5–900)", "秒数（5–900）")}<input type="number" inputMode="numeric" min={5} max={900} value={seconds} onChange={event=>setSeconds(event.target.value)} /></label><div className={styles.choiceRow}><button className={styles.primaryButton} disabled={disabled || !Number.isInteger(Number(seconds)) || Number(seconds)<5 || Number(seconds)>900} onClick={()=>void send({type:"setSpeechTimer",seconds:Number(seconds)})}>{timer ? t("Apply & restart", "应用并重新计时") : t("Start timer", "开始计时")}</button>{timer && <button className={styles.secondaryButton} disabled={disabled} onClick={()=>void send({type:"cancelSpeechTimer"})}>{t("Cancel timer", "取消计时")}</button>}</div><p>{t("The bell rings once. The game will not advance automatically.", "结束时响铃一次，不会自动推进游戏。")}</p></details>}
    {timer && !soundReady && <button className={styles.secondaryButton} onClick={onEnable}>{t("Enable timer sound on this device", "开启本机计时提示音")}</button>}
  </section>;
}
