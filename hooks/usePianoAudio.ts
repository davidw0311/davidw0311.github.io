"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  noteFrequency,
  pianoAudioPath,
  type PianoNote,
} from "@/data/pianoNotes";

type SafariAudioWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

async function resumeAudioContext(context: AudioContext) {
  if (context.state === "running") return true;

  const resumed = context.resume().then(
    () => context.state === "running",
    () => false,
  );

  return Promise.race([
    resumed,
    new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(context.state === "running"), 350);
    }),
  ]);
}

export function usePianoAudio(enabled = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopNote = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const discardAudioContext = useCallback(() => {
    const context = audioContextRef.current;
    audioContextRef.current = null;

    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") discardAudioContext();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", discardAudioContext);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", discardAudioContext);
      stopNote();
      discardAudioContext();
    };
  }, [discardAudioContext, stopNote]);

  useEffect(() => {
    if (!enabled) stopNote();
  }, [enabled, stopNote]);

  const createAudioContext = useCallback(() => {
    const browserWindow = window as SafariAudioWindow;
    const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    const context = new AudioContextConstructor();
    audioContextRef.current = context;
    return context;
  }, []);

  const getPlayableAudioContext = useCallback(async () => {
    let context = audioContextRef.current;

    if (!context || context.state === "closed") context = createAudioContext();
    if (!context) return null;

    if (await resumeAudioContext(context)) return context;

    if (audioContextRef.current === context) audioContextRef.current = null;
    void context.close().catch(() => undefined);
    context = createAudioContext();

    if (!context || !(await resumeAudioContext(context))) return null;
    return context;
  }, [createAudioContext]);

  const playSynthesizedTone = useCallback(async (note: PianoNote) => {
    const context = await getPlayableAudioContext();
    if (!context) return;

    const now = context.currentTime + 0.01;
    const frequency = noteFrequency(note.midi);
    const output = context.createGain();
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(0.22, now + 0.018);
    output.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    output.connect(context.destination);

    [
      { type: "triangle" as OscillatorType, ratio: 1, level: 0.8 },
      { type: "sine" as OscillatorType, ratio: 2, level: 0.16 },
      { type: "sine" as OscillatorType, ratio: 3, level: 0.08 },
    ].forEach(({ type, ratio, level }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency * ratio, now);
      gain.gain.setValueAtTime(level, now);
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(now);
      oscillator.stop(now + 1.2);
    });
  }, [getPlayableAudioContext]);

  const playNote = useCallback((note: PianoNote) => {
    if (!enabled) return;

    stopNote();
    const audio = new Audio(pianoAudioPath(note));
    let fallbackStarted = false;
    const clearAudio = () => {
      if (audioRef.current === audio) audioRef.current = null;
    };
    const fallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      clearAudio();
      void playSynthesizedTone(note);
    };

    audio.preload = "auto";
    audio.volume = 0.9;
    audio.addEventListener("ended", clearAudio, { once: true });
    audio.addEventListener("error", fallback, { once: true });
    audioRef.current = audio;

    // Keep play() in the original tap event for mobile Safari. Web Audio is
    // only used if the local recording cannot start.
    void audio.play().catch(fallback);
  }, [enabled, playSynthesizedTone, stopNote]);

  return { playNote, stopNote };
}
