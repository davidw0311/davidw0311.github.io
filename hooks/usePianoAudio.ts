"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  noteFrequency,
  pianoAudioPath,
  type PianoNote,
} from "@/data/pianoNotes";
import { createAscendingArpeggio, type PianoArpeggioEvent } from "@/lib/pianoPlayback";

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
  const audioRefs = useRef<Set<HTMLAudioElement>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferCacheRef = useRef<Map<string, Promise<AudioBuffer>>>(new Map());
  const scheduledSourcesRef = useRef<Set<AudioScheduledSourceNode>>(new Set());
  const playbackTimersRef = useRef<Set<number>>(new Set());
  const cleanupAudioRefs = useRef<Set<() => void>>(new Set());
  const playbackGenerationRef = useRef(0);

  const stopNote = useCallback(() => {
    playbackGenerationRef.current += 1;
    playbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    playbackTimersRef.current.clear();
    scheduledSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // The source may have already ended between the click and cleanup.
      }
      source.disconnect();
    });
    scheduledSourcesRef.current.clear();
    audioRefs.current.forEach((audio) => audio.pause());
    cleanupAudioRefs.current.forEach((cleanup) => cleanup());
    cleanupAudioRefs.current.clear();
    audioRefs.current.clear();
  }, []);

  const discardAudioContext = useCallback(() => {
    const context = audioContextRef.current;
    audioContextRef.current = null;
    audioBufferCacheRef.current.clear();

    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopNote();
        discardAudioContext();
      }
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

  const trackScheduledSource = useCallback((source: AudioScheduledSourceNode) => {
    const clearSource = () => {
      scheduledSourcesRef.current.delete(source);
      source.disconnect();
    };

    scheduledSourcesRef.current.add(source);
    source.addEventListener("ended", clearSource, { once: true });
  }, []);

  const playSynthesizedTone = useCallback(async (note: PianoNote, peakVolume = 0.22) => {
    const context = await getPlayableAudioContext();
    if (!context) return;

    const now = context.currentTime + 0.01;
    const frequency = noteFrequency(note.midi);
    const output = context.createGain();
    output.gain.setValueAtTime(0.0001, now);
    output.gain.exponentialRampToValueAtTime(peakVolume, now + 0.018);
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
      trackScheduledSource(oscillator);
    });
  }, [getPlayableAudioContext, trackScheduledSource]);

  const loadAudioBuffer = useCallback((context: AudioContext, note: PianoNote) => {
    const path = pianoAudioPath(note);
    const cached = audioBufferCacheRef.current.get(path);
    if (cached) return cached;

    const buffer = fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load piano sample ${path}`);
        return response.arrayBuffer();
      })
      .then((audioData) => context.decodeAudioData(audioData))
      .catch((error) => {
        audioBufferCacheRef.current.delete(path);
        throw error;
      });

    audioBufferCacheRef.current.set(path, buffer);
    return buffer;
  }, []);

  const scheduleSynthesizedArpeggio = useCallback((
    context: AudioContext,
    arpeggio: readonly PianoArpeggioEvent[],
  ) => {
    const startAt = context.currentTime + 0.025;
    const finalAttackAt = startAt + arpeggio.at(-1)!.startOffset;
    const releaseAt = finalAttackAt + 1.08;
    const noteVolume = 0.095;

    arpeggio.forEach(({ note, startOffset }) => {
      const attackAt = startAt + startOffset;
      const output = context.createGain();
      output.gain.setValueAtTime(0.0001, attackAt);
      output.gain.exponentialRampToValueAtTime(noteVolume, attackAt + 0.018);
      output.gain.exponentialRampToValueAtTime(noteVolume * 0.58, releaseAt - 0.08);
      output.gain.exponentialRampToValueAtTime(0.0001, releaseAt);
      output.connect(context.destination);

      [
        { type: "triangle" as OscillatorType, ratio: 1, level: 0.8 },
        { type: "sine" as OscillatorType, ratio: 2, level: 0.16 },
        { type: "sine" as OscillatorType, ratio: 3, level: 0.08 },
      ].forEach(({ type, ratio, level }) => {
        const oscillator = context.createOscillator();
        const harmonicGain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(noteFrequency(note.midi) * ratio, attackAt);
        harmonicGain.gain.setValueAtTime(level, attackAt);
        oscillator.connect(harmonicGain);
        harmonicGain.connect(output);
        oscillator.start(attackAt);
        oscillator.stop(releaseAt + 0.02);
        trackScheduledSource(oscillator);
      });
    });
  }, [trackScheduledSource]);

  const playHtmlArpeggioFallback = useCallback((
    arpeggio: readonly PianoArpeggioEvent[],
    generation: number,
  ) => {
    arpeggio.forEach(({ note, startOffset }) => {
      const timer = window.setTimeout(() => {
        playbackTimersRef.current.delete(timer);
        if (generation !== playbackGenerationRef.current) return;

        const audio = new Audio(pianoAudioPath(note));
        const clearAudio = () => {
          audioRefs.current.delete(audio);
          cleanupAudioRefs.current.delete(clearAudio);
        };
        audio.preload = "auto";
        audio.volume = 0.58;
        audio.addEventListener("ended", clearAudio, { once: true });
        audio.addEventListener("error", clearAudio, { once: true });
        audioRefs.current.add(audio);
        cleanupAudioRefs.current.add(clearAudio);
        void audio.play().catch(clearAudio);
      }, startOffset * 1000);
      playbackTimersRef.current.add(timer);
    });
  }, []);

  const playArpeggiatedChord = useCallback(async (
    notes: readonly PianoNote[],
    generation: number,
  ) => {
    const arpeggio = createAscendingArpeggio(notes);
    const context = await getPlayableAudioContext();

    if (!context) {
      playHtmlArpeggioFallback(arpeggio, generation);
      return;
    }

    try {
      const buffers = await Promise.all(arpeggio.map(({ note }) => loadAudioBuffer(context, note)));
      if (generation !== playbackGenerationRef.current || context.state !== "running") return;

      const startAt = context.currentTime + 0.025;
      arpeggio.forEach(({ startOffset }, index) => {
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffers[index];
        gain.gain.value = 0.58;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(startAt + startOffset);
        trackScheduledSource(source);
      });
    } catch {
      if (generation !== playbackGenerationRef.current || context.state !== "running") return;
      scheduleSynthesizedArpeggio(context, arpeggio);
    }
  }, [getPlayableAudioContext, loadAudioBuffer, playHtmlArpeggioFallback, scheduleSynthesizedArpeggio, trackScheduledSource]);

  const playImmediateNote = useCallback((note: PianoNote, generation: number) => {
    const audio = new Audio(pianoAudioPath(note));
    let fallbackStarted = false;
    const clearAudio = () => {
      audio.removeEventListener("ended", clearAudio);
      audio.removeEventListener("error", fallback);
      audioRefs.current.delete(audio);
      cleanupAudioRefs.current.delete(clearAudio);
    };
    const fallback = () => {
      if (fallbackStarted || generation !== playbackGenerationRef.current) return;
      fallbackStarted = true;
      clearAudio();
      void playSynthesizedTone(note);
    };

    audio.preload = "auto";
    audio.volume = 0.9;
    audio.addEventListener("ended", clearAudio, { once: true });
    audio.addEventListener("error", fallback, { once: true });
    audioRefs.current.add(audio);
    cleanupAudioRefs.current.add(clearAudio);

    // Keep single-note playback inside the original tap for mobile Safari.
    void audio.play().catch(fallback);
  }, [playSynthesizedTone]);

  const playNotes = useCallback((notes: readonly PianoNote[]) => {
    if (!enabled || notes.length === 0) return;
    stopNote();
    const generation = playbackGenerationRef.current;
    if (notes.length === 1) {
      playImmediateNote(notes[0], generation);
      return;
    }

    void playArpeggiatedChord(notes, generation);
  }, [enabled, playArpeggiatedChord, playImmediateNote, stopNote]);

  const playNote = useCallback((note: PianoNote) => playNotes([note]), [playNotes]);

  return { playNote, playNotes, stopNote };
}
