"use client";

import { useState } from "react";
import type { Language, PlayerProfile } from "./RoomChrome";
import avatars from "@/public/assets/werewolf/avatars.json";
import styles from "./shared.module.css";

export function Portrait({ seat }: { seat: PlayerProfile }) {
  if (seat.photo?.startsWith("data:image/jpeg;base64,")) return <span className={styles.profilePhoto} role="img" aria-label={seat.name} style={{ backgroundImage: `url("${seat.photo}")` }} />;
  const avatar = avatars.find(avatar => avatar.id === seat.photo);
  return avatar ? <span className={styles.avatarEmoji} role="img" aria-label={`${avatar.name.en} / ${avatar.name.zh}`}>{avatar.glyph}</span> : <span>{Array.from(seat.name)[0]?.toUpperCase() || "?"}</span>;
}
export function ProfilePicker({ lang, disabled, onSave, onDone }: { lang: Language; disabled: boolean; onSave: (photo: string | null) => Promise<boolean>; onDone: () => void }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const save = async (photo: string | null) => { if (await onSave(photo)) onDone(); };
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
