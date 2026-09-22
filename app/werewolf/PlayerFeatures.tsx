"use client";

import { useState, type CSSProperties } from "react";
import { Crown, Moon, Medal } from "@phosphor-icons/react";
import type { Command, GameView, Language, Seat } from "@/lib/werewolfClient";
import avatars from "@/public/assets/werewolf/avatars.json";
import catalogue from "@/public/assets/werewolf/roles.json";
import styles from "./werewolf.module.css";

export function WolfHead({ size = 24 }: { size?: number }) {
  return <span role="img" aria-label="Wolf / 狼" className={styles.wolfHead} style={{ width: size, height: size }} />;
}
export function Portrait({ seat }: { seat: Pick<Seat, "name" | "photo"> }) {
  if (seat.photo?.startsWith("data:image/jpeg;base64,")) return <span className={styles.profilePhoto} role="img" aria-label={seat.name} style={{ backgroundImage: `url("${seat.photo}")` }} />;
  const avatar = avatars.find(avatar => avatar.id === seat.photo);
  return avatar ? <span className={styles.avatarEmoji} role="img" aria-label={`${avatar.name.en} / ${avatar.name.zh}`}>{avatar.glyph}</span> : <span>{Array.from(seat.name)[0]?.toUpperCase() || "?"}</span>;
}
export function CircleSeats({ view, lang, onProfile }: { view: GameView; lang: Language; onProfile: () => void }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const size = Math.max(350, view.seats.length * 40);
  return <><div className={styles.circleScroll} tabIndex={0} aria-label={t("Circular seating table. Scroll to see all seats.", "圆形座位表，可滚动查看所有座位。")}> <div className={styles.circleTable} style={{ width: size, height: size }}>
    <div className={styles.circleCenter}><Moon size={36} /><strong>NIGHTFALL</strong><span>{t(`${view.seats.length} players`, `${view.seats.length} 位玩家`)}</span></div>
    {view.seats.map((seat, index) => {
      const angle = index * 2 * Math.PI / view.seats.length - Math.PI / 2;
      const position = { left: `${50 + 39 * Math.cos(angle)}%`, top: `${50 + 39 * Math.sin(angle)}%` } as CSSProperties;
      return <div key={seat.id} style={position} className={`${styles.circleSeat} ${styles.seat} ${!seat.alive && view.status !== "lobby" ? styles.deadSeat : ""} ${seat.id === view.me?.seatId ? styles.mySeat : ""} ${seat.id === view.speakerSeatId ? styles.speakingSeat : ""}`}>
        <button className={styles.avatar} disabled={seat.id !== view.me?.seatId} onClick={onProfile} aria-label={seat.id === view.me?.seatId ? t("Change profile photo", "更换头像") : seat.name}><Portrait seat={seat} />{!seat.alive && <span className={styles.deadCross} aria-hidden="true">×</span>}<span className={`${styles.presence} ${seat.connected && seat.occupied ? styles.present : ""}`} title={seat.connected ? t("Connected", "在线") : t("Offline; seat retained", "离线，座位保留")} />{seat.isHost && <Crown size={15} className={styles.hostCrown} />}</button>
        {seat.isSheriff && <Medal className={styles.sheriffBadge} size={22} weight="fill" aria-label={t("Sheriff badge", "警徽")} />}<span className={styles.circleNumber}>{index + 1}</span><strong title={seat.name}>{seat.name}</strong><span className={styles.seatStatus}>{view.phase.kind === "ready" ? seat.ready ? t("Ready", "已准备") : t("Reading card", "查看身份中") : !seat.alive ? t("DEAD", "已出局") : seat.isSheriff ? t("Sheriff", "警长") : seat.id === view.me?.seatId ? t("You", "你") : !seat.connected ? t("Offline", "离线") : t("At the table", "已入座")}</span>{seat.roleId && <small>{catalogue.roles.find(role => role.id === seat.roleId)?.name[lang] || seat.roleId}</small>}
      </div>;
    })}
  </div></div>{view.seats.length > 8 && <p className={styles.hint}>{t("Slide the table to see the full circle on a small screen.", "小屏幕上可滑动座位表，查看完整圆桌。")}</p>}</>;
}
export function ProfilePicker({ lang, disabled, send, onDone }: { lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean>; onDone: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const save = async (photo: string | null) => { if (await send({ type: "setProfile", photo })) onDone(); };
  const upload = async (file?: File) => {
    if (!file) return;
    setError(""); setLoading(true);
    const url = URL.createObjectURL(file);
    try {
      if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) throw new Error();
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = 96; canvas.height = 96;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error();
      const edge = Math.min(image.naturalWidth, image.naturalHeight);
      ctx.drawImage(image, (image.naturalWidth - edge) / 2, (image.naturalHeight - edge) / 2, edge, edge, 0, 0, 96, 96);
      let photo = canvas.toDataURL("image/jpeg", .65);
      if (photo.length > 12000) photo = canvas.toDataURL("image/jpeg", .3);
      if (photo.length > 12000) throw new Error();
      await save(photo);
    } catch { setError(t("Choose a supported image under 15 MB (JPEG or PNG works best).", "请选择15 MB以内的图片，建议使用JPEG或PNG。")); }
    finally { URL.revokeObjectURL(url); setLoading(false); }
  };
  return <><p>{t("Choose an icon or upload a photo. Your photo is visible to everyone in this room.", "选择图标或上传照片。房间内所有玩家都能看到你的头像。")}</p><div className={styles.profileOptions}>{avatars.map(avatar => <button key={avatar.id} className={styles.secondaryButton} aria-label={avatar.name[lang]} title={avatar.name[lang]} disabled={disabled || loading} onClick={() => void save(avatar.id)}><Portrait seat={{ name: "", photo: avatar.id }} /></button>)}</div><label className={styles.uploadPhoto}>{t("Upload photo", "上传照片")}<input type="file" accept="image/*" disabled={disabled || loading} onChange={event => void upload(event.target.files?.[0])} /></label><button className={styles.textButton} disabled={disabled || loading} onClick={() => void save(null)}>{t("Use my initial", "使用名字首字")}</button>{error && <p role="alert">{error}</p>}</>;
}
