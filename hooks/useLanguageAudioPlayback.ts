"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speechLocale, type LanguageId } from "@/data/languageLearning";

type PlaySampleOptions = {
  sampleId: string;
  source: string;
  text: string;
  languageId: LanguageId;
  fallbackRate?: number;
};

export function useLanguageAudioPlayback(onUnavailable: () => void) {
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cleanupAudioRef = useRef<(() => void) | null>(null);
  const playbackGenerationRef = useRef(0);

  const stopPlayback = useCallback(() => {
    playbackGenerationRef.current += 1;
    const activeAudio = audioRef.current;

    // Pause before cleanup clears audioRef, otherwise a rapid second tap can
    // lose the first element while it continues playing in the background.
    activeAudio?.pause();
    if (activeAudio) activeAudio.currentTime = 0;
    cleanupAudioRef.current?.();
    cleanupAudioRef.current = null;
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setPlayingSampleId(null);
  }, []);

  useEffect(() => stopPlayback, [stopPlayback]);

  const playBrowserVoice = useCallback((
    text: string,
    languageId: LanguageId,
    rate = 1,
  ) => {
    if (!("speechSynthesis" in window)) {
      onUnavailable();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceLocale = speechLocale(languageId);
    utterance.lang = voiceLocale;
    utterance.rate = rate;
    const normalizedLocale = voiceLocale.toLowerCase();
    const languagePrefix = normalizedLocale.split("-")[0];
    const availableVoices = window.speechSynthesis.getVoices();
    utterance.voice = availableVoices.find((voice) => voice.lang.toLowerCase() === normalizedLocale)
      ?? availableVoices.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix))
      ?? null;
    window.speechSynthesis.speak(utterance);
  }, [onUnavailable]);

  const playSample = useCallback(({
    sampleId,
    source,
    text,
    languageId,
    fallbackRate = 1,
  }: PlaySampleOptions) => {
    stopPlayback();
    const generation = playbackGenerationRef.current;
    const audio = new Audio(source);
    let fallbackStarted = false;

    const isCurrent = () => playbackGenerationRef.current === generation;
    const clearAudio = () => {
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      if (audioRef.current === audio) audioRef.current = null;
      if (cleanupAudioRef.current === clearAudio) cleanupAudioRef.current = null;
    };
    const handlePlaying = () => {
      if (isCurrent()) setPlayingSampleId(sampleId);
    };
    const handleEnded = () => {
      clearAudio();
      if (isCurrent()) setPlayingSampleId((current) => current === sampleId ? null : current);
    };
    const handleError = () => {
      if (fallbackStarted || !isCurrent()) return;
      fallbackStarted = true;
      audio.pause();
      audio.currentTime = 0;
      clearAudio();
      setPlayingSampleId(null);
      playBrowserVoice(text, languageId, fallbackRate);
    };

    audio.preload = "auto";
    audio.addEventListener("playing", handlePlaying, { once: true });
    audio.addEventListener("ended", handleEnded, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    audioRef.current = audio;
    cleanupAudioRef.current = clearAudio;
    void audio.play().catch(handleError);
  }, [playBrowserVoice, stopPlayback]);

  return { playingSampleId, playSample, stopPlayback };
}
