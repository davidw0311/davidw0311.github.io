"use client";

import { useEffect, useState } from "react";
import { defaultLocalProgress, type LocalProgress } from "@/data/languageLearning";
import {
  languageProgressStorageKey,
  parseLanguageProgress,
} from "@/data/languageProgress";

export function usePersistentLanguageProgress() {
  const [progress, setProgress] = useState<LocalProgress>(defaultLocalProgress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setProgress(parseLanguageProgress(window.localStorage.getItem(languageProgressStorageKey)));
      } catch {
        setProgress(defaultLocalProgress);
      } finally {
        setLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(languageProgressStorageKey, JSON.stringify(progress));
    } catch {
      // Storage can be unavailable in private browsing or full. The lesson remains usable in memory.
    }
  }, [loaded, progress]);

  return [progress, setProgress] as const;
}
