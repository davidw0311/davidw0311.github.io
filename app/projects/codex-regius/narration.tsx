"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Play, Pause, Stop, SpeakerHigh } from "@phosphor-icons/react";
import { StoryNarrator, type NarrationOptions, type NarrationSection, type NarrationState, type SpeechHandle } from "@/lib/regiusNarration";
import { narrationAudioSession, type AudioSessionLike } from "@/lib/regiusAudioSession";
import styles from "./regius.module.css";

const NarrationContext = createContext<{ ready: boolean; active: number; start: (index: number) => void }>({ ready: false, active: -1, start: () => {} });
const defaults: NarrationOptions = { rate: .9, pitch: .8, voice: "", includeNorse: true };
const storageKey = "regius-narration";

export function NarrationScope({ sections, children }: { sections: NarrationSection[]; children: ReactNode }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [options, setOptions] = useState(defaults);
  const preferences = useRef(options);
  const narrator = useRef<StoryNarrator | null>(null);
  const [state, setState] = useState<NarrationState>({ status: "idle", section: -1 });
  useEffect(() => {
    let cleanup = () => {};
    // Device voices and saved preferences become available after hydration.
    const frame = requestAnimationFrame(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) { setSupported(false); return; }
    setSupported(true);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (saved) {
        const restored = { rate: Math.min(1.5, Math.max(.6, Number(saved.rate) || defaults.rate)), pitch: Math.min(1.5, Math.max(.5, Number(saved.pitch) || defaults.pitch)), voice: typeof saved.voice === "string" ? saved.voice : "", includeNorse: saved.includeNorse !== false };
        preferences.current = restored; setOptions(restored);
      }
    } catch { /* Reading works with storage disabled. */ }
    const synth = window.speechSynthesis;
    const audioSession = narrationAudioSession(() => (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession);
    const refresh = () => setVoices(synth.getVoices());
    refresh(); synth.addEventListener("voiceschanged", refresh);
    const reader = new StoryNarrator({ create: text => new SpeechSynthesisUtterance(text) as unknown as SpeechHandle, speak: utterance => { audioSession.acquire(); synth.speak(utterance as SpeechSynthesisUtterance); }, cancel: () => synth.cancel(), resume: () => synth.resume(), voices: () => synth.getVoices() }, () => preferences.current, next => {
      if (next.status !== "playing" && next.status !== "paused") audioSession.release();
      setState(next);
    });
    narrator.current = reader;
    const leave = () => reader.stop();
    window.addEventListener("pagehide", leave);
    cleanup = () => { reader.dispose(); audioSession.release(); narrator.current = null; synth.removeEventListener("voiceschanged", refresh); window.removeEventListener("pagehide", leave); };
    });
    return () => { cancelAnimationFrame(frame); cleanup(); };
  }, []);
  function change(next: Partial<NarrationOptions>) {
    const updated = { ...preferences.current, ...next };
    preferences.current = updated; setOptions(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* Optional preference persistence. */ }
  }
  function start(index: number) { narrator.current?.start(sections, index); }
  const active = state.status === "playing" || state.status === "paused";
  const englishVoices = voices.filter(voice => /^en\b/i.test(voice.lang));
  return <NarrationContext.Provider value={{ ready: supported === true, active: active ? state.section : -1, start }}>
    <div className={styles.narrationRoot}>
      <section className={styles.narrationPanel} data-active={active} aria-label="Story audio">
        <div className={styles.narrationTop}>
          <div><strong><SpeakerHigh size={19} aria-hidden="true" /> Listen to the story</strong><p role="status">{state.status === "error" ? state.error : active ? `${state.status === "paused" ? "Paused" : "Reading"} · section ${state.section + 1} of ${sections.length}` : state.status === "finished" ? "You’ve reached the end of the story." : supported === false ? "Read-aloud is unavailable in this browser." : "Start here, or choose any section below."}</p></div>
          <div className={styles.narrationActions}>
            {active ? <><button type="button" onClick={() => state.status === "playing" ? narrator.current?.pause() : narrator.current?.resume()}>{state.status === "playing" ? <Pause size={17} /> : <Play size={17} />}{state.status === "playing" ? "Pause" : "Resume"}</button><button type="button" onClick={() => narrator.current?.stop()}><Stop size={17} />Stop</button></> : <button type="button" disabled={supported !== true} onClick={() => start(0)}><Play size={17} />Read story</button>}
          </div>
        </div>
        {supported && <details className={styles.narrationSettings}><summary>Voice & reading settings</summary>
          <div className={styles.narrationFields}>
            <label>English voice<select value={englishVoices.some(voice => voice.voiceURI === options.voice) ? options.voice : ""} onChange={event => change({ voice: event.target.value })}><option value="">Device default (English)</option>{englishVoices.map(voice => <option value={voice.voiceURI} key={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label>
            <label>Speed · {options.rate.toFixed(2)}×<input aria-label="Reading speed" type="range" min="0.6" max="1.5" step="0.05" value={options.rate} onChange={event => change({ rate: Number(event.target.value) })} /></label>
            <label>Pitch · {options.pitch.toFixed(2)}<input aria-label="Voice pitch" type="range" min="0.5" max="1.5" step="0.05" value={options.pitch} onChange={event => change({ pitch: Number(event.target.value) })} /></label>
          </div>
          <div className={styles.narrationPreferences}><button type="button" onClick={() => change({ rate: .8, pitch: .6 })}>Low storyteller</button><label><input type="checkbox" checked={options.includeNorse} onChange={event => { change({ includeNorse: event.target.checked }); narrator.current?.stop(); }} />Read Old Norse quotations too</label></div>
          <p>Voices and pitch depend on your device. Old Norse uses an Icelandic voice when available; pronunciation is approximate. Voice changes apply at the next phrase.</p>
          <p>Using Bluetooth? Select your speaker in your phone’s audio-output controls, then stop and restart reading. The phone controls where its speech voice plays.</p>
        </details>}
        {state.status === "paused" && <p className={styles.narrationHint}>Resume may repeat the current phrase so nothing is missed.</p>}
      </section>
      {children}
    </div>
  </NarrationContext.Provider>;
}

export function NarrationSectionView({ index, label, children }: { index: number; label: string; children: ReactNode }) {
  const narration = useContext(NarrationContext);
  return <div className={styles.narrationSection} data-reading={narration.active === index} id={`story-section-${index + 1}`}>
    <button type="button" className={styles.readFromHere} disabled={!narration.ready} onClick={() => narration.start(index)} aria-label={`Read from here: ${label}`}><Play size={13} aria-hidden="true" />Read from here<span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span></button>
    {children}
  </div>;
}
