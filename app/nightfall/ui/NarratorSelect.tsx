"use client";

import { useEffect, useId, useState } from "react";
import { CHINESE_NARRATORS, chineseNarrator, type ChineseNarrator, type NightfallGame } from "@/lib/nightfallNarrators";
import type { Language } from "./RoomChrome";
import styles from "./narrator-select.module.css";

const storageKey = "nightfall.audio.chineseNarrator";
export function useChineseNarrator(game: NightfallGame) {
  const [narrator, setNarrator] = useState<ChineseNarrator>(() => chineseNarrator(undefined,game));
  useEffect(() => {
    const read = () => { try { setNarrator(chineseNarrator(localStorage.getItem(storageKey),game)); } catch { /* Storage is optional. */ } };
    const frame = requestAnimationFrame(read);
    const sync = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) read(); };
    window.addEventListener("storage",sync);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage",sync); };
  },[game]);
  const changeNarrator = (next: ChineseNarrator) => {
    const value = chineseNarrator(next,game); setNarrator(value);
    try { localStorage.setItem(storageKey,value); } catch { /* The choice still works for this session. */ }
  };
  return { narrator, changeNarrator };
}

export function NarratorSelect({game,narrator,onChange,lang,disabled=false}: {game:NightfallGame;narrator:ChineseNarrator;onChange:(value:ChineseNarrator)=>void;lang:Language;disabled?:boolean}) {
  const id = useId();
  const t = (en:string,zh:string) => lang === "zh" ? zh : en;
  return <div className={styles.control}><label htmlFor={id}>{t("Chinese narrator", "中文旁白")}</label>
    <select id={id} value={narrator} disabled={disabled} onChange={event=>onChange(chineseNarrator(event.target.value,game))}>
      {CHINESE_NARRATORS.filter(item=>game === "werewolf" || item.id !== "brian").map(item=><option key={item.id} value={item.id}>{item.name[lang]}</option>)}
    </select>
    <p>{t("Switch anytime; the next recording uses your new voice. Saved on this device for both games.", "随时切换，下一段播报开始使用新声音。此设备会为两款游戏保存选择。")}{lang === "en" && " English narration is unchanged."}</p>
    <a className={styles.preview} href="/assets/nightfall/narrators/" target="_blank" rel="noreferrer">{t("Listen to all narrators", "试听所有旁白")}</a>
    {narrator === "brian" && <p>{t("Original Brian recordings, with Kokoro for later announcements.", "保留原有 Brian 录音，后续新增播报使用 Kokoro。")}</p>}
  </div>;
}
