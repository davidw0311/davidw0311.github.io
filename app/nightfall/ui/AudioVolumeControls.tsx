"use client";

import { useEffect, useId, useState } from "react";
import { MusicNotes, SpeakerHigh } from "@phosphor-icons/react";
import { audioLevels, DEFAULT_AUDIO_LEVELS, MAX_AUDIO_VOLUME, type AudioLevels } from "@/lib/nightfallAudioMixer";
import type { Language } from "./RoomChrome";
import styles from "./audio-volume.module.css";

const storageKey = "nightfall.audio.levels";
export function useAudioLevels() {
  const [levels, setLevels] = useState<AudioLevels>(DEFAULT_AUDIO_LEVELS);
  useEffect(() => {
    const read = () => { try { setLevels(audioLevels(JSON.parse(localStorage.getItem(storageKey) || "null"))); } catch { /* Defaults remain usable without storage. */ } };
    const frame = requestAnimationFrame(read);
    const sync = (event: StorageEvent) => { if (event.key === storageKey || event.key === null) read(); };
    window.addEventListener("storage", sync);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", sync); };
  }, []);
  const changeLevels = (next: AudioLevels) => {
    const value = audioLevels(next); setLevels(value);
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* The controls still work without storage. */ }
  };
  return { levels, changeLevels };
}

export function AudioVolumeControls({ levels, onChange, lang, disabled = false }: { levels: AudioLevels; onChange: (next: AudioLevels) => void; lang: Language; disabled?: boolean }) {
  const id = useId();
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return <fieldset className={styles.controls} disabled={disabled}><legend>{t("Volume on this device", "本机音量")}</legend>
    {(["voiceVolume", "musicVolume"] as const).map(key => {
      const voice = key === "voiceVolume", value = Math.round(levels[key] * 100);
      return <div className={styles.channel} key={key}><label htmlFor={`${id}-${key}`}>{voice ? <SpeakerHigh size={18}/> : <MusicNotes size={18}/>}<span>{voice ? t("Narrator volume", "旁白音量") : t("Background music volume", "背景音乐音量")}</span><output htmlFor={`${id}-${key}`}>{value}%</output></label><input id={`${id}-${key}`} type="range" min={0} max={MAX_AUDIO_VOLUME * 100} step={5} value={value} aria-valuetext={value === 0 ? t("Muted", "静音") : `${value}%`} onChange={event => onChange({...levels,[key]:Number(event.target.value)/100})}/></div>;
    })}
    <p>{t("0% mutes · 100% original level · up to 200% boost. Music softens during narration.", "0%静音 · 100%原始音量 · 最高200%增强。旁白播放时，音乐会自动减弱。")}</p>
  </fieldset>;
}
