"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Play, Pause, Stop, SpeakerHigh } from "@phosphor-icons/react";
import { StoryNarrator, type NarrationOptions, type NarrationSection, type SpeechHandle } from "@/lib/regiusNarration";
import { narrationAudioSession, type AudioSessionLike } from "@/lib/regiusAudioSession";
import { RecordedNarrator, type RecordedState, type RegiusRecording } from "@/lib/regiusRecordedNarration";
import { BackgroundMusic, DEFAULT_MUSIC_VOLUME, musicVolume, REGIUS_MUSIC } from "@/lib/regiusBackgroundMusic";
import styles from "./regius.module.css";

const NarrationContext = createContext<{ ready: boolean; active: number; start: (index: number) => void }>({ ready: false, active: -1, start: () => {} });
const defaults: NarrationOptions = { rate: .9, pitch: .8, voice: "", includeNorse: true };
const storageKey = "regius-narration";

export function NarrationScope({ sections, recording, children }: { sections: NarrationSection[]; recording?: RegiusRecording | null; children: ReactNode }) {
  const music = useRef<BackgroundMusic | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicLevel, setMusicLevel] = useState(DEFAULT_MUSIC_VOLUME);
  const [musicUnavailable, setMusicUnavailable] = useState(false);
  const musicPreferences = useRef({ enabled: true, volume: DEFAULT_MUSIC_VOLUME });
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recorded, setRecorded] = useState(Boolean(recording));
  const mode = useRef(Boolean(recording));
  const [deviceSupported, setDeviceSupported] = useState(false);
  const media = useRef<HTMLAudioElement>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [options, setOptions] = useState({ ...defaults, rate: recording ? 1 : defaults.rate });
  const preferences = useRef(options);
  const deviceNarrator = useRef<StoryNarrator | null>(null);
  const recordedNarrator = useRef<RecordedNarrator | null>(null);
  const current = () => mode.current ? recordedNarrator.current : deviceNarrator.current;
  const [state, setState] = useState<RecordedState>({ status: "idle", section: -1 });
  useEffect(() => {
    let cleanup = () => {};
    // Device voices and saved preferences become available after hydration.
    const frame = requestAnimationFrame(() => {
    const hasDevice = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    setDeviceSupported(hasDevice); setSupported(Boolean(recording) || hasDevice);
    try {
      const saved = JSON.parse(localStorage.getItem(recording ? `${storageKey}-recorded` : storageKey) ?? "null");
      if (saved) {
        const restored = { rate: Math.min(1.5, Math.max(.6, Number(saved.rate) || (recording ? 1 : defaults.rate))), pitch: Math.min(1.5, Math.max(.5, Number(saved.pitch) || defaults.pitch)), voice: typeof saved.voice === "string" ? saved.voice : "", includeNorse: saved.includeNorse !== false };
        preferences.current = restored; setOptions(restored);
      }
    } catch { /* Reading works with storage disabled. */ }
    if (recording) {
      try {
        const saved = JSON.parse(localStorage.getItem("regius-background-music") ?? "null");
        if (saved) musicPreferences.current = { enabled: saved.enabled !== false, volume: musicVolume(typeof saved.volume === "number" ? saved.volume : DEFAULT_MUSIC_VOLUME) };
      } catch { /* Music preferences are optional. */ }
      setMusicEnabled(musicPreferences.current.enabled); setMusicLevel(musicPreferences.current.volume);
      music.current = new BackgroundMusic({
        context: () => new AudioContext(),
        load: async (context, signal) => {
          const response = await fetch(REGIUS_MUSIC, { signal });
          if (!response.ok) throw new Error("Music unavailable");
          return context.decodeAudioData(await response.arrayBuffer());
        },
        unavailable: () => setMusicUnavailable(true),
      });
      music.current.configure(musicPreferences.current.enabled, musicPreferences.current.volume);
    }
    const audioSession = narrationAudioSession(() => (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession);
    const report = (next: RecordedState) => {
      if (!["playing", "paused", "loading"].includes(next.status)) audioSession.release();
      if (next.status === "playing") music.current?.setPlaying(true);
      else if (next.status === "paused") music.current?.setPlaying(false);
      else if (next.status !== "loading") music.current?.stop();
      setState(next);
    };
    let removeVoices = () => {};
    if (hasDevice) {
      const synth = window.speechSynthesis;
      const refresh = () => setVoices(synth.getVoices());
      refresh(); synth.addEventListener("voiceschanged", refresh);
      removeVoices = () => synth.removeEventListener("voiceschanged", refresh);
      deviceNarrator.current = new StoryNarrator({ create: text => new SpeechSynthesisUtterance(text) as unknown as SpeechHandle, speak: utterance => { audioSession.acquire(); synth.speak(utterance as SpeechSynthesisUtterance); }, cancel: () => synth.cancel(), resume: () => synth.resume(), voices: () => synth.getVoices() }, () => preferences.current, report);
    }
    let preload: HTMLAudioElement | null = null;
    if (recording && media.current) {
      const audio = media.current;
      audio.preservesPitch = true;
      preload = new Audio(); preload.preload = "auto";
      recordedNarrator.current = new RecordedNarrator(audio, recording, () => preferences.current, next => {
        if (next.status === "loading") audioSession.acquire();
        report(next);
      }, src => { if (preload) preload.src = src; });
    }
    const leave = () => { deviceNarrator.current?.stop(); recordedNarrator.current?.stop(); music.current?.stop(); };
    window.addEventListener("pagehide", leave);
    cleanup = () => {
      deviceNarrator.current?.dispose(); recordedNarrator.current?.dispose(); audioSession.release();
      deviceNarrator.current = null; recordedNarrator.current = null;
      music.current?.dispose(); music.current = null;
      if (preload) { preload.removeAttribute("src"); preload.load(); preload = null; }
      removeVoices(); window.removeEventListener("pagehide", leave);
    };
    });
    return () => { cancelAnimationFrame(frame); cleanup(); };
  }, [recording]);
  function change(next: Partial<NarrationOptions>) {
    const updated = { ...preferences.current, ...next };
    preferences.current = updated; setOptions(updated);
    if (next.rate !== undefined) recordedNarrator.current?.setRate(updated.rate);
    try { localStorage.setItem(mode.current ? `${storageKey}-recorded` : storageKey, JSON.stringify(updated)); } catch { /* Optional preference persistence. */ }
  }
  function start(index: number) { music.current?.unlock(); current()?.start(sections, index); }
  function resume() { music.current?.unlock(); current()?.resume(); }
  function changeMusic(enabled: boolean, volume: number) {
    const level = musicVolume(volume);
    musicPreferences.current = { enabled, volume: level };
    setMusicEnabled(enabled); setMusicLevel(level); setMusicUnavailable(false);
    music.current?.configure(enabled, level);
    music.current?.setPlaying(state.status === "playing");
    if (state.status === "playing" || state.status === "loading") music.current?.unlock();
    try { localStorage.setItem("regius-background-music", JSON.stringify(musicPreferences.current)); } catch { /* Optional persistence. */ }
  }
  const active = ["playing", "paused", "loading"].includes(state.status);
  function switchMode(useRecording: boolean) {
    current()?.stop(); mode.current = useRecording; setRecorded(useRecording);
    change({ rate: useRecording ? 1 : defaults.rate });
  }
  const englishVoices = voices.filter(voice => /^en\b/i.test(voice.lang));
  return <NarrationContext.Provider value={{ ready: supported === true, active: active ? state.section : -1, start }}>
    <div className={styles.narrationRoot}>
      {recording && <audio ref={media} preload="none" aria-hidden="true" onPause={() => music.current?.setPlaying(false)} />}
      <section className={styles.narrationPanel} data-active={active} aria-label="Story audio">
        <div className={styles.narrationTop}>
          <div><strong><SpeakerHigh size={19} aria-hidden="true" /> Listen to the story</strong><p role="status">{state.status === "error" ? state.error : active ? `${state.status === "paused" ? "Paused" : state.status === "loading" ? "Loading" : "Reading"} · section ${state.section + 1} of ${sections.length}` : state.status === "finished" ? "You’ve reached the end of the story." : supported === false ? "Read-aloud is unavailable in this browser." : "Start here, or choose any section below."}</p></div>
          <div className={styles.narrationActions}>
            {active ? <><button type="button" onClick={() => state.status === "paused" ? resume() : current()?.pause()}>{state.status === "paused" ? <Play size={17} /> : <Pause size={17} />}{state.status === "paused" ? "Resume" : "Pause"}</button><button type="button" onClick={() => current()?.stop()}><Stop size={17} />Stop</button></> : <button type="button" disabled={supported !== true} onClick={() => start(0)}><Play size={17} />Read story</button>}
          </div>
        </div>
        {recorded && <p className={styles.narrationHint}>Deep storyteller · AI narration</p>}
        {supported && <details className={styles.narrationSettings}><summary>Voice & reading settings</summary>
          <div className={styles.narrationFields}>
            {recording && <label>Narrator<select value={recorded ? "recorded" : "device"} onChange={event => switchMode(event.target.value === "recorded")}><option value="recorded">Deep storyteller · recorded</option>{deviceSupported && <option value="device">Device voice</option>}</select></label>}
            {!recorded && <label>English voice<select value={englishVoices.some(voice => voice.voiceURI === options.voice) ? options.voice : ""} onChange={event => change({ voice: event.target.value })}><option value="">Device default (English)</option>{englishVoices.map(voice => <option value={voice.voiceURI} key={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}</select></label>}
            <label>Speed · {options.rate.toFixed(2)}×<input aria-label="Reading speed" type="range" min="0.6" max="1.5" step="0.05" value={options.rate} onChange={event => change({ rate: Number(event.target.value) })} /></label>
            {recording && <label>Music volume · {Math.round(musicLevel * 100)}%<input aria-label="Background music volume" type="range" min="0" max="0.3" step="0.01" disabled={!musicEnabled} value={musicLevel} onChange={event => changeMusic(musicEnabled, Number(event.target.value))} /></label>}
            {!recorded && <label>Pitch · {options.pitch.toFixed(2)}<input aria-label="Voice pitch" type="range" min="0.5" max="1.5" step="0.05" value={options.pitch} onChange={event => change({ pitch: Number(event.target.value) })} /></label>}
          </div>
          <div className={styles.narrationPreferences}>{!recorded && <button type="button" onClick={() => change({ rate: .8, pitch: .6 })}>Low storyteller</button>}<label><input type="checkbox" checked={options.includeNorse} onChange={event => { change({ includeNorse: event.target.checked }); current()?.stop(); }} />Read Old Norse quotations too</label></div>
          {recording && <div className={styles.narrationPreferences}><label><input type="checkbox" checked={musicEnabled} onChange={event => changeMusic(event.target.checked, musicLevel)} />Background instrumental music</label></div>}
          {recording && <p>{musicUnavailable ? "Background music could not start. The narration can continue; toggle music off and on to retry." : "Soft plucked strings accompany the story. Music pauses with the narration; your volume and mute choices are saved."}</p>}
          <p>{recorded ? "AI narration with a naturally deep, warm voice. Old Norse uses approximate modern Icelandic pronunciation." : "Voices and pitch depend on your device. Old Norse uses an Icelandic voice when available; pronunciation is approximate. Voice changes apply at the next phrase."}</p>
          <p>Using Bluetooth? Select your speaker in your phone’s audio-output controls, then stop and restart reading. Your phone controls the audio output.</p>
        </details>}
        {!recorded && state.status === "paused" && <p className={styles.narrationHint}>Resume may repeat the current phrase so nothing is missed.</p>}
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
