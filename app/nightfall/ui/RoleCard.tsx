"use client";

import type { ReactNode } from "react";
import { LockKey } from "@phosphor-icons/react";
import type { Language } from "./RoomChrome";
import styles from "./shared.module.css";

export function RoleCard({ name, subtitle, icon, lang, revealed = true, onToggle }: { name: string; subtitle?: string; icon: ReactNode; lang: Language; revealed?: boolean; onToggle?: () => void }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const content = <>{revealed ? icon : <LockKey size={56} weight="thin"/>}<strong>{revealed ? name : t("A secret worth keeping", "你的秘密身份")}</strong><span>{revealed ? subtitle : t("Tap to reveal your role", "点击查看身份")}</span></>;
  return onToggle ? <button className={styles.roleCard} aria-pressed={revealed} onClick={onToggle}>{content}</button> : <div className={styles.roleCard}>{content}</div>;
}
