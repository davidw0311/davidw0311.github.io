import type { GameView as ClassicView } from "./werewolfClient";
import type { GameView as OneNightView } from "./oneNightClient";
import type { TableSeat } from "../app/nightfall/ui/PlayerTable";
import type { Language, WaitingPlayer } from "../app/nightfall/ui/RoomChrome";
import { classicVictory } from "./nightfallVictory.ts";

export function classicTableSeats(view: ClassicView, lang: Language, roleLabel: (id: string) => string): TableSeat[] {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const victory = classicVictory(view);
  return view.seats.map((seat, index) => {
    const mine = seat.id === view.me?.seatId, dead = !seat.alive && view.status !== "lobby";
    const voting = view.phase.kind === "voting" && (view.phase.step === "sheriff" ? view.election?.voterIds.includes(seat.id) : seat.canVote && seat.alive);
    const won = !!victory?.winnerIds.includes(seat.id);
    const status = view.status === "finished" ? victory?.draw ? t("Draw", "平局") : won ? t("Winner", "获胜") : t("Lost", "未获胜") : dead ? t("Eliminated", "已出局") : view.phase.kind === "ready" ? seat.ready ? t("Ready", "已准备") : t("Not ready", "未准备") : voting ? view.pendingVoterIds?.includes(seat.id) ? t("To vote", "未投票") : t("Voted", "已投票") : seat.id === view.speakerSeatId ? t("Speaking", "发言中") : seat.silenced ? t("Silenced", "禁言中") : seat.isSheriff ? t("Sheriff", "警长") : mine ? t("You", "你") : !seat.occupied ? t("Reserved", "预留") : seat.isBot ? t("Bot", "机器人") : !seat.connected ? t("Offline", "离线") : "";
    return { id:seat.id, number:index+1, name:seat.name, photo:seat.photo, status, mine, dead:dead && view.status!=="finished", winner:won, speaking:seat.id===view.speakerSeatId, offline:!seat.connected&&!seat.isBot, pending:!!voting&&!!view.pendingVoterIds?.includes(seat.id), host:seat.isHost, sheriff:seat.isSheriff, isBot:seat.isBot, silenced:!!seat.silenced&&(dead||!!voting||seat.id===view.speakerSeatId), detail:seat.roleId ? roleLabel(seat.roleId) : undefined };
  });
}

export function oneNightTableSeats(view: OneNightView, lang: Language, roleLabel: (id: string) => string): TableSeat[] {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return view.seats.map(seat => {
    const mine=seat.id===view.me?.seatId, pending=view.phase.kind==="ready"?!seat.ready:view.phase.kind==="voting"?!!view.pendingVoterIds?.includes(seat.id):false;
    const won=view.status==="finished" && !!view.result?.winners.includes(seat.id);
    const status=view.status==="finished" ? won?t("Winner","获胜"):t("Lost","未获胜") : seat.revealedRoleId?roleLabel(seat.revealedRoleId):view.phase.kind==="ready"?seat.ready?t("Ready","已准备"):t("Not ready","未准备"):view.phase.kind==="voting"?pending?t("To vote","未投票"):t("Voted","已投票"):!seat.occupied?t("Reserved","预留"):seat.isBot?t("Bot","机器人"):!seat.connected?t("Offline","离线"):mine?t("You","你"):"";
    return {id:seat.id,number:seat.number,name:seat.name,photo:seat.photo,status,mine,pending,winner:won,offline:!seat.connected&&!seat.isBot,host:!!(seat.host||seat.isHost||seat.id===view.hostSeatId),isBot:seat.isBot,shielded:seat.shielded,hasArtifact:seat.hasArtifact};
  });
}

export function pendingDecisions(view: ClassicView | OneNightView): { kind: "ready" | "voting"; total: number; waiting: WaitingPlayer[] } | undefined {
  const kind=view.phase.kind;
  if(kind!=="ready"&&kind!=="voting") return undefined;
  const waiting: WaitingPlayer[]=view.seats.flatMap((seat,index)=>(kind==="ready"?!seat.ready||!seat.occupied:view.pendingVoterIds?.includes(seat.id)) ? [{id:seat.id,number:"number" in seat ? seat.number : index+1,name:seat.name,connected:seat.connected,isBot:seat.isBot}] : []);
  const classic = "day" in view;
  const total=kind==="ready" || !classic ? view.seats.length : view.phase.step==="sheriff" ? view.election?.voterIds.length||0 : view.seats.filter(seat=>seat.alive&&seat.canVote).length;
  return {kind,total,waiting};
}
