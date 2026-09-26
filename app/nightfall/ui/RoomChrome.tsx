"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Check, Copy, GearSix, LockKey, QrCode, SignOut, SpeakerHigh, SpeakerSlash, Users, WifiHigh, WifiSlash, X } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { Portrait } from "./ProfilePhoto";
import styles from "./shared.module.css";

export type Language = "en" | "zh";
export type PlayerProfile = { name: string; photo?: string | null };
export type WaitingPlayer = { id: string; number: number; name: string; connected: boolean; isBot?: boolean };

export function Modal({ title, children, onClose, dismissOutside = true, className = "" }: { title: string; children: ReactNode; onClose: () => void; dismissOutside?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={`${styles.modal} ${className}`} aria-labelledby={titleId} onCancel={onClose} onClick={event => {
    if (!dismissOutside || event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
  }}><header className={styles.modalHeading}><h2 id={titleId}>{title}</h2><button className={styles.iconButton} onClick={onClose} aria-label="Close / 关闭"><X size={22}/></button></header>{children}</dialog>;
}

export function PlayerIdentity({ player, number, lang, status, eliminated, onProfile, onCard }: { player: PlayerProfile; number: number; lang: Language; status: string; eliminated?: boolean; onProfile: () => void; onCard?: () => void }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return <div className={`${styles.playerIdentity} ${eliminated ? styles.eliminatedIdentity : ""}`}>
    <button className={styles.selfPortrait} onClick={onProfile} aria-label={t("Change your profile photo", "更换你的头像")}><Portrait seat={player}/></button>
    <div className={styles.selfName}><span>{t(`YOU · SEAT ${number}`, `你 · ${number}号`)}</span><strong title={player.name}>{player.name}</strong><small>{status}</small></div>
    {onCard && <button className={styles.identityShortcut} onClick={onCard}><LockKey size={19}/>{t("My card", "身份牌")}</button>}
  </div>;
}

/** The game adapter supplies eligible voters and public status only. */
export function StageBanner({ label, title, lang, decisions, children }: { label: string; title: string; lang: Language; decisions?: { kind: "ready" | "voting"; total: number; waiting: WaitingPlayer[]; complete?: string }; children?: ReactNode }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const ready = decisions?.kind === "ready";
  return <section className={styles.stageBanner}>
    <div className={styles.stageLine} role="status" aria-live="polite"><span>{label}</span><h1>{title}</h1>{decisions && <span className={styles.stageCount}>{Math.max(0, decisions.total - decisions.waiting.length)} / {decisions.total}<small>{ready ? t("ready", "已准备") : t("voted", "已投票")}</small></span>}</div>
    {decisions && (decisions.waiting.length ? <details className={styles.pendingDisclosure}><summary><span>{ready ? t("Waiting for", "等待准备") : t("Still to vote", "等待投票")}</span><span className={styles.pendingSeatNumbers}>{decisions.waiting.map(seat => <b key={seat.id} title={seat.name}>{seat.number}</b>)}</span></summary><ul>{decisions.waiting.map(seat => <li key={seat.id}><b>{seat.number}</b><span>{seat.name}</span>{!seat.connected && !seat.isBot && <small>{t("offline", "离线")}</small>}</li>)}</ul></details> : <p className={styles.allDecisionsDone} role="status">{decisions.complete || (ready ? t("Everyone is ready · the host can begin", "全员已准备，房主可以开始") : t("Everyone has voted", "全员已投票"))}</p>)}
    {children && <div className={styles.stageDetails}>{children}</div>}
  </section>;
}

export function RoomToolbar({ code, lang, connected, copied, onCode, onInvite, onLeave, onSettings, onPeople, onAudio, audioEnabled }: { code: string; lang: Language; connected: boolean; copied?: boolean; onCode: () => void; onInvite: () => void; onLeave: () => void; onSettings?: () => void; onPeople?: () => void; onAudio?: () => void; audioEnabled?: boolean }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return <div className={styles.roomBar}><button className={styles.roomCode} onClick={onCode} title={t("Room code", "房间码")}><span>{t("PRIVATE TABLE", "私人牌局")}</span><strong>{code}{copied ? <Check size={18}/> : <Copy size={18}/>}</strong></button><div className={styles.roomTools}>
    <span className={`${styles.connection} ${connected ? styles.connected : ""}`}>{connected ? <WifiHigh size={15}/> : <WifiSlash size={15}/>}<span>{connected ? t("Connected", "已连接") : t("Reconnecting", "重连中")}</span></span>
    <button className={styles.secondaryButton} onClick={onInvite}><QrCode size={18}/>{t("Invite / QR code", "邀请 / 二维码")}</button>
    {onAudio && <button className={styles.iconButton} onClick={onAudio} aria-label={t("Narration and music", "语音与音乐")}>{audioEnabled ? <SpeakerHigh size={22}/> : <SpeakerSlash size={22}/>}</button>}
    {onPeople && <button className={styles.iconButton} onClick={onPeople} aria-label={t("Manage players", "管理玩家")}><Users size={22}/></button>}
    {onSettings && <button className={styles.iconButton} onClick={onSettings} aria-label={t("Room settings", "房间设置")}><GearSix size={22}/></button>}
    <button className={styles.iconButton} onClick={onLeave} aria-label={t("Leave room", "离开房间")}><SignOut size={22}/></button>
  </div></div>;
}

export function InvitePanel({ code, url, lang, lobby, copied, copyFailed, onCopy }: { code: string; url: string; lang: Language; lobby: boolean; copied: boolean; copyFailed?: boolean; onCopy: () => void }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return <div className={styles.invitePanel}><p>{t("Scan with your phone’s camera, open the link, and enter your name.", "用手机相机扫码，打开链接并输入你的名字。")}</p><div className={styles.qrFrame}><QRCodeSVG value={url} size={256} level="M" marginSize={4} bgColor="#ffffff" fgColor="#000000" title={t(`Scan to join room ${code}`, `扫码加入房间 ${code}`)} role="img"/></div><strong className={styles.inviteCode}>{code}</strong><p>{lobby ? t("Join and leave freely before the game starts. No host approval needed.", "游戏开始前可自由加入和离开，无需房主批准。") : t("The game has started. The host will approve your request and assign an existing seat.", "游戏已开始。房主批准申请后会安排你接替已有座位。")}</p><button className={styles.primaryButton} onClick={onCopy}>{copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? t("Link copied", "链接已复制") : t("Copy invite link", "复制邀请链接")}</button><label>{t("Or share this link", "也可分享链接")}<input readOnly value={url} onFocus={event => event.target.select()}/></label>{copyFailed && <p role="status">{t("Copy unavailable. Select the link above to copy it manually.", "无法自动复制，请选中上方链接手动复制。")}</p>}</div>;
}
