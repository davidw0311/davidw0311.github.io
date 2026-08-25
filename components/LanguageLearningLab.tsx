"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowsDownUp,
  BookmarkSimple,
  BookOpenText,
  CaretDown,
  CaretUp,
  CheckCircle,
  Microphone,
  NumberCircleOne,
  SpeakerHigh,
  SpinnerGap,
  Translate,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  contentItems,
  defaultLocalProgress,
  ensureLearningLanguages,
  languageIds,
  languages,
  preferredSupportLanguage,
  unitProgressKey,
  type CompletionStatus,
  type LanguageId,
  type LocalProgress,
  type PhraseSegment,
} from "@/data/languageLearning";
import { blobToBase64, startAudioRecording, type AudioRecording } from "@/lib/browserAudioRecorder";
import { phraseAudioPath, sentenceAudioPath, type SentenceAudioSpeed } from "@/lib/languageAudio";
import styles from "./LanguageLearningLab.module.css";

type SpeechState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "evaluating"
  | "passed"
  | "failed"
  | "error";
type Strictness = "relaxed" | "normal" | "strict";

type AssessmentResult = {
  passed: boolean;
  score: number;
  transcript?: string;
  message?: string;
};

const storageKey = "dyw-language-lab-progress-v1";
const pronunciationApiUrl = process.env.NEXT_PUBLIC_PRONUNCIATION_API_URL?.trim();
const maximumRecordingMs = 12_000;

function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && languageIds.includes(value as LanguageId);
}

function readLocalProgress(value: string | null): LocalProgress {
  if (!value) return defaultLocalProgress;
  try {
    const parsed = JSON.parse(value) as Partial<LocalProgress>;
    const practiceLanguageId = isLanguageId(parsed.practiceLanguageId)
      ? parsed.practiceLanguageId
      : defaultLocalProgress.practiceLanguageId;
    const supportLanguageId = preferredSupportLanguage(
      practiceLanguageId,
      isLanguageId(parsed.supportLanguageId) ? parsed.supportLanguageId : defaultLocalProgress.supportLanguageId,
    );
    const displayLanguageIds = Array.isArray(parsed.displayLanguageIds)
      ? parsed.displayLanguageIds.filter(isLanguageId)
      : defaultLocalProgress.displayLanguageIds;
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      completed: parsed.completed && typeof parsed.completed === "object" ? parsed.completed : {},
      savedPhraseIds: Array.isArray(parsed.savedPhraseIds)
        ? parsed.savedPhraseIds.filter((id): id is string => typeof id === "string")
        : [],
      practiceLanguageId,
      supportLanguageId,
      displayLanguageIds: ensureLearningLanguages(
        displayLanguageIds.length > 0 ? displayLanguageIds : defaultLocalProgress.displayLanguageIds,
        practiceLanguageId,
        supportLanguageId,
      ),
      showRomanization: parsed.showRomanization ?? true,
    };
  } catch {
    return defaultLocalProgress;
  }
}

export function LanguageLearningLab() {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState<LocalProgress>(defaultLocalProgress);
  const [ready, setReady] = useState(false);
  const [contentIndex, setContentIndex] = useState(0);
  const [unitIndex, setUnitIndex] = useState(0);
  const [strictness, setStrictness] = useState<Strictness>("normal");
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("Listen once, then hold the button while you say the sentence.");
  const [activePhrase, setActivePhrase] = useState<{ languageId: LanguageId; phrase: PhraseSegment } | null>(null);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const recordingRef = useRef<AudioRecording | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdActiveRef = useRef(false);

  const practiceLanguageId = progress.practiceLanguageId;
  const supportLanguageId = progress.supportLanguageId;
  const content = contentItems[contentIndex];
  const currentUnit = content.units[unitIndex];
  const practiceLocalization = currentUnit.localizations[practiceLanguageId];
  const activePhraseMeaning = activePhrase && activePhrase.languageId !== supportLanguageId && supportLanguageId !== "en"
    ? currentUnit.localizations[supportLanguageId].text
    : activePhrase?.phrase.translation;
  const activePhraseMeaningLanguage = activePhrase && activePhrase.languageId !== supportLanguageId && supportLanguageId !== "en"
    ? languages[supportLanguageId].nameEnglish
    : "English";
  const progressKey = unitProgressKey(content.id, currentUnit.id, practiceLanguageId);
  const persistedStatus = progress.completed[progressKey] ?? "not_started";
  const unitIsComplete = speechState === "passed" || persistedStatus === "passed" || persistedStatus === "skipped";
  const skipAvailable = attempts >= 3;
  const readingFocusActive = speechState === "requesting_permission" || speechState === "recording";
  const visibleLanguageIds = readingFocusActive ? [practiceLanguageId] : progress.displayLanguageIds;
  const settingsLanguageIds = [
    ...progress.displayLanguageIds,
    ...languageIds.filter((languageId) => !progress.displayLanguageIds.includes(languageId)),
  ];

  const completionCount = useMemo(
    () => content.units.filter((candidate) => {
      const status = progress.completed[unitProgressKey(content.id, candidate.id, practiceLanguageId)];
      return status === "passed" || status === "skipped";
    }).length,
    [content, practiceLanguageId, progress.completed],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgress(readLocalProgress(window.localStorage.getItem(storageKey)));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, ready]);

  useEffect(() => () => {
    holdActiveRef.current = false;
    void recordingRef.current?.cancel();
    if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
  }, []);

  const stopPlayback = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setPlayingSampleId(null);
  }, []);

  const resetAttempt = useCallback((message = "Listen once, then hold the button while you say the sentence.") => {
    holdActiveRef.current = false;
    stopPlayback();
    void recordingRef.current?.cancel();
    recordingRef.current = null;
    if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = null;
    setSpeechState("idle");
    setAttempts(0);
    setScore(null);
    setTranscript("");
    setFeedback(message);
    setActivePhrase(null);
    setTranslationRevealed(false);
  }, [stopPlayback]);

  const selectContent = (index: number) => {
    setContentIndex(index);
    setUnitIndex(0);
    setLessonFinished(false);
    resetAttempt();
  };

  const selectPracticeLanguage = (languageId: LanguageId) => {
    setProgress((current) => {
      const nextSupportLanguageId = preferredSupportLanguage(languageId, current.supportLanguageId);
      return {
        ...current,
        practiceLanguageId: languageId,
        supportLanguageId: nextSupportLanguageId,
        displayLanguageIds: ensureLearningLanguages(
          current.displayLanguageIds,
          languageId,
          nextSupportLanguageId,
        ),
      };
    });
    setLessonFinished(false);
    resetAttempt(`Now practicing ${languages[languageId].nameEnglish}. Listen once, then hold to speak.`);
  };

  const selectSupportLanguage = (languageId: LanguageId) => {
    if (languageId === practiceLanguageId) return;
    setProgress((current) => ({
      ...current,
      supportLanguageId: languageId,
      displayLanguageIds: ensureLearningLanguages(
        current.displayLanguageIds,
        current.practiceLanguageId,
        languageId,
      ),
    }));
    setActivePhrase(null);
  };

  const setCompletion = (status: Exclude<CompletionStatus, "not_started">, earnedXp: number) => {
    setProgress((current) => {
      const existing = current.completed[progressKey];
      const alreadyCompleted = existing === "passed" || existing === "skipped";
      return {
        ...current,
        xp: alreadyCompleted ? current.xp : current.xp + earnedXp,
        completed: { ...current.completed, [progressKey]: status },
      };
    });
  };

  const playBrowserVoice = useCallback((text: string, languageId: LanguageId, rate = 1) => {
    if (!("speechSynthesis" in window)) {
      setFeedback("Audio playback is unavailable in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languages[languageId].locale;
    utterance.rate = rate;
    const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith(languageId));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const playSample = useCallback((
    sampleId: string,
    source: string,
    text: string,
    languageId: LanguageId,
    fallbackRate = 1,
  ) => {
    stopPlayback();
    const audio = new Audio(source);
    let fallbackStarted = false;
    const fallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      audioRef.current = null;
      setPlayingSampleId(null);
      playBrowserVoice(text, languageId, fallbackRate);
    };
    audio.preload = "auto";
    audio.addEventListener("playing", () => setPlayingSampleId(sampleId), { once: true });
    audio.addEventListener("ended", () => {
      if (audioRef.current === audio) audioRef.current = null;
      setPlayingSampleId((current) => current === sampleId ? null : current);
    }, { once: true });
    audio.addEventListener("error", fallback, { once: true });
    audioRef.current = audio;
    void audio.play().catch(fallback);
  }, [playBrowserVoice, stopPlayback]);

  const playSentence = (
    languageId: LanguageId,
    speed: SentenceAudioSpeed = "normal",
  ) => {
    const localization = currentUnit.localizations[languageId];
    const sampleId = `sentence:${content.slug}:${currentUnit.id}:${languageId}:${speed}`;
    playSample(
      sampleId,
      sentenceAudioPath(content.slug, currentUnit.id, languageId, speed),
      localization.text,
      languageId,
      speed === "slow" ? 0.72 : 1,
    );
  };

  const finishEvaluation = (result: AssessmentResult) => {
    setTranscript(result.transcript ?? "");
    setScore(Math.round(result.score));
    setAttempts((value) => value + 1);
    setSpeechState(result.passed ? "passed" : "failed");
    if (result.passed) {
      setFeedback(result.message ?? "Nice work. The next sentence is unlocked.");
      setCompletion("passed", 10);
    } else {
      setFeedback(result.message ?? "Try again after listening to the sentence slowly.");
    }
  };

  const evaluateRecording = async (recording: AudioRecording) => {
    holdActiveRef.current = false;
    if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = null;
    recordingRef.current = null;
    setSpeechState("evaluating");
    setFeedback("Sending this short recording for pronunciation assessment.");

    try {
      const audio = await recording.stop();
      if (audio.size < 1_600) throw new Error("no-audio");

      const response = await fetch(pronunciationApiUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: await blobToBase64(audio),
          locale: languages[practiceLanguageId].locale,
          referenceText: practiceLocalization.text,
          strictness,
        }),
      });
      const result = await response.json().catch(() => null) as (AssessmentResult & { error?: string }) | null;

      if (!response.ok || !result || typeof result.score !== "number") {
        throw new Error(result?.error ?? `assessment-${response.status}`);
      }
      finishEvaluation(result);
    } catch (error) {
      setSpeechState("error");
      setFeedback(error instanceof Error && error.message === "no-audio"
        ? "The recording was too short. Hold the button long enough to say the full sentence."
        : "The assessment service could not score that attempt. Your attempt was not counted; please try again.");
    }
  };

  const startSpeaking = async () => {
    if (!pronunciationApiUrl) {
      holdActiveRef.current = false;
      setSpeechState("error");
      setFeedback("Speech assessment is not configured for this deployment yet.");
      return;
    }

    setSpeechState("requesting_permission");
    setFeedback("Keep holding while microphone access starts.");
    try {
      const recording = await startAudioRecording();
      recordingRef.current = recording;
      if (!holdActiveRef.current) {
        void evaluateRecording(recording);
        return;
      }
      setSpeechState("recording");
      setFeedback("Listening now. Keep holding while you say the full sentence.");
      recordingTimerRef.current = window.setTimeout(() => void evaluateRecording(recording), maximumRecordingMs);
    } catch (error) {
      holdActiveRef.current = false;
      setSpeechState("error");
      setFeedback(error instanceof DOMException && error.name === "NotAllowedError"
        ? "Microphone access was blocked. Allow it in your browser settings and try again."
        : "The microphone could not start in this browser. Try current Chrome, Edge, Firefox, or Safari.");
    }
  };

  const beginSpeaking = () => {
    if (holdActiveRef.current || speechState === "requesting_permission" || speechState === "recording" || speechState === "evaluating") return;
    holdActiveRef.current = true;
    stopPlayback();
    setActivePhrase(null);
    setTranslationRevealed(false);
    void startSpeaking();
  };

  const releaseSpeaking = () => {
    if (!holdActiveRef.current) return;
    holdActiveRef.current = false;
    const recording = recordingRef.current;
    if (recording) void evaluateRecording(recording);
  };

  const skipUnit = () => {
    setSpeechState("passed");
    setScore(null);
    setFeedback("Sentence skipped. You can return to practice it later.");
    setCompletion("skipped", 0);
  };

  const goToUnit = (index: number) => {
    if (index < 0 || index >= content.units.length) return;
    setUnitIndex(index);
    resetAttempt();
  };

  const continueLesson = () => {
    if (unitIndex < content.units.length - 1) {
      goToUnit(unitIndex + 1);
      return;
    }
    setLessonFinished(true);
  };

  const toggleDisplayLanguage = (languageId: LanguageId) => {
    setProgress((current) => {
      const selected = current.displayLanguageIds.includes(languageId);
      if (selected && (
        current.displayLanguageIds.length === 1
        || languageId === practiceLanguageId
        || languageId === supportLanguageId
      )) return current;
      return {
        ...current,
        displayLanguageIds: ensureLearningLanguages(
          selected
            ? current.displayLanguageIds.filter((candidate) => candidate !== languageId)
            : [...current.displayLanguageIds, languageId],
          current.practiceLanguageId,
          current.supportLanguageId,
        ),
      };
    });
  };

  const moveDisplayLanguage = (languageId: LanguageId, direction: -1 | 1) => {
    setProgress((current) => {
      const index = current.displayLanguageIds.indexOf(languageId);
      const nextIndex = index + direction;
      const lastSupportingIndex = current.displayLanguageIds.length - 2;
      if (
        languageId === current.practiceLanguageId
        || index < 0
        || nextIndex < 0
        || nextIndex > lastSupportingIndex
      ) return current;
      const next = [...current.displayLanguageIds];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return { ...current, displayLanguageIds: next };
    });
  };

  const toggleSavedPhrase = (phraseId: string) => {
    setProgress((current) => ({
      ...current,
      savedPhraseIds: current.savedPhraseIds.includes(phraseId)
        ? current.savedPhraseIds.filter((id) => id !== phraseId)
        : [...current.savedPhraseIds, phraseId],
    }));
  };

  const openPhrase = (languageId: LanguageId, phrase: PhraseSegment) => {
    setActivePhrase({ languageId, phrase });
    setTranslationRevealed(false);
  };

  const speechIcon = speechState === "recording"
    ? <span className={styles.recordingMark} aria-hidden="true" />
    : speechState === "evaluating" || speechState === "requesting_permission"
      ? <SpinnerGap className={styles.spinner} size={24} weight="bold" aria-hidden="true" />
      : <Microphone size={24} weight="fill" aria-hidden="true" />;

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <div className={styles.brandBlock}>
          <span className={styles.brandMark} aria-hidden="true">L</span>
          <div>
            <strong>Lilt</strong>
            <span>speaking lab</span>
          </div>
        </div>
        <div className={styles.headerStats} aria-label="Local learning progress">
          <span>{progress.xp} XP</span>
          <span>{progress.savedPhraseIds.length} saved</span>
        </div>
      </header>

      <div className={styles.appGrid}>
        <aside className={styles.library} aria-labelledby="library-title">
          <div className={styles.libraryHeading}>
            <div>
              <h2 id="library-title">Try a tiny lesson</h2>
              <p>Three local samples. No account needed.</p>
            </div>
            <span className={styles.localBadge}>On this device</span>
          </div>

          <div className={styles.contentList}>
            {contentItems.map((item, index) => {
              const completed = item.units.filter((candidate) => {
                const status = progress.completed[unitProgressKey(item.id, candidate.id, practiceLanguageId)];
                return status === "passed" || status === "skipped";
              }).length;
              const Icon = item.type === "story" ? BookOpenText : NumberCircleOne;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={index === contentIndex ? styles.activeContent : ""}
                  aria-pressed={index === contentIndex}
                  onClick={() => selectContent(index)}
                >
                  <Icon size={25} weight={index === contentIndex ? "fill" : "regular"} aria-hidden="true" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.estimatedMinutes} min, {item.units.length} prompts</small>
                  </span>
                  {completed > 0 ? <em>{completed}/{item.units.length}</em> : <ArrowRight size={18} aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className={styles.practiceLanguage}>
            <div className={styles.languageChoice}>
              <label htmlFor="practice-language">I want to practice</label>
              <select
                id="practice-language"
                value={practiceLanguageId}
                onChange={(event) => selectPracticeLanguage(event.target.value as LanguageId)}
              >
                {languageIds.map((id) => (
                  <option key={id} value={id}>
                    {id === "en" ? languages[id].nameEnglish : `${languages[id].nameEnglish} (${languages[id].nameNative})`}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.languageChoice}>
              <label htmlFor="support-language">Show help in</label>
              <select
                id="support-language"
                value={supportLanguageId}
                onChange={(event) => selectSupportLanguage(event.target.value as LanguageId)}
              >
                {languageIds.filter((id) => id !== practiceLanguageId).map((id) => (
                  <option key={id} value={id}>
                    {id === "en" ? languages[id].nameEnglish : `${languages[id].nameEnglish} (${languages[id].nameNative})`}
                  </option>
                ))}
              </select>
            </div>
            {languages[practiceLanguageId].toneSensitive ? (
              <p><WarningCircle size={16} weight="fill" aria-hidden="true" /> Azure assesses this locale, but does not return a separate tone score.</p>
            ) : null}
          </div>

          <details className={styles.displaySettings}>
            <summary><ArrowsDownUp size={18} aria-hidden="true" /> Display languages</summary>
            <div className={styles.settingsBody}>
              {settingsLanguageIds.map((languageId) => {
                const selected = progress.displayLanguageIds.includes(languageId);
                const selectedIndex = progress.displayLanguageIds.indexOf(languageId);
                return (
                  <div className={styles.languageSetting} key={languageId}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={selected && (
                          progress.displayLanguageIds.length === 1
                          || languageId === practiceLanguageId
                          || languageId === supportLanguageId
                        )}
                        onChange={() => toggleDisplayLanguage(languageId)}
                      />
                      <span>{languages[languageId].nameEnglish}</span>
                    </label>
                    {selected ? (
                      <span className={styles.orderButtons}>
                        <button type="button" aria-label={`Move ${languages[languageId].nameEnglish} up`} disabled={languageId === practiceLanguageId || selectedIndex === 0} onClick={() => moveDisplayLanguage(languageId, -1)}><CaretUp size={15} weight="bold" /></button>
                        <button type="button" aria-label={`Move ${languages[languageId].nameEnglish} down`} disabled={languageId === practiceLanguageId || selectedIndex >= progress.displayLanguageIds.length - 2} onClick={() => moveDisplayLanguage(languageId, 1)}><CaretDown size={15} weight="bold" /></button>
                      </span>
                    ) : null}
                  </div>
                );
              })}
              <label className={styles.romanizationToggle}>
                <input
                  type="checkbox"
                  checked={progress.showRomanization}
                  onChange={(event) => setProgress((current) => ({ ...current, showRomanization: event.target.checked }))}
                />
                <span>Show romanization</span>
              </label>
            </div>
          </details>
        </aside>

        <section className={styles.lesson} id="language-lesson" aria-labelledby="active-lesson-title">
          <div className={styles.lessonTopline}>
            <div>
              <span>{content.type === "story" ? "Story" : "Counting"}</span>
              <h2 id="active-lesson-title">{content.title}</h2>
            </div>
            <div className={styles.unitCount} aria-label={`${completionCount} of ${content.units.length} prompts complete`}>
              <strong>{unitIndex + 1}/{content.units.length}</strong>
              <div className={styles.progressSegments} aria-hidden="true">
                {content.units.map((candidate, index) => {
                  const status = progress.completed[unitProgressKey(content.id, candidate.id, practiceLanguageId)];
                  return <i key={candidate.id} className={status === "passed" || status === "skipped" ? styles.completeSegment : index === unitIndex ? styles.currentSegment : ""} />;
                })}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {lessonFinished ? (
              <motion.section
                key="finished"
                className={styles.finishState}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              >
                <CheckCircle size={54} weight="fill" aria-hidden="true" />
                <h2>Sample complete</h2>
                <p>You worked through {content.units.length} prompts in {languages[practiceLanguageId].nameEnglish}. Progress is saved on this device.</p>
                <div>
                  <button type="button" onClick={() => { setLessonFinished(false); goToUnit(0); }}>Practice again</button>
                  <button type="button" onClick={() => selectContent((contentIndex + 1) % contentItems.length)}>Try another sample</button>
                </div>
              </motion.section>
            ) : (
              <motion.div
                key={`${content.id}-${currentUnit.id}-${practiceLanguageId}`}
                className={styles.lessonBody}
                initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.24 }}
              >
                {currentUnit.number ? (
                  <div className={styles.numberPrompt} aria-label={`Number ${currentUnit.number}`}>
                    <span>Say this number</span>
                    <strong>{currentUnit.number}</strong>
                  </div>
                ) : null}

                <motion.section
                  layout
                  className={`${styles.reader} ${readingFocusActive ? styles.readerFocused : ""}`}
                  aria-label={readingFocusActive ? `${languages[practiceLanguageId].nameEnglish} sentence reader` : "Multilingual sentence reader"}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <AnimatePresence initial={false} mode="popLayout">
                  {visibleLanguageIds.map((languageId) => {
                    const localization = currentUnit.localizations[languageId];
                    const isPracticeLanguage = languageId === practiceLanguageId;
                    return (
                      <motion.article
                        layout="position"
                        className={isPracticeLanguage ? styles.practiceBlock : ""}
                        key={languageId}
                        lang={languages[languageId].locale}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: -8 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <header>
                          <div>
                            <span>{languages[languageId].nameNative}</span>
                            <small>{languages[languageId].nameEnglish}{isPracticeLanguage ? " practice" : ""}</small>
                          </div>
                          <button
                            type="button"
                            aria-label={`Play ${languages[languageId].nameEnglish} sentence`}
                            aria-pressed={playingSampleId === `sentence:${content.slug}:${currentUnit.id}:${languageId}:normal`}
                            onClick={() => playSentence(languageId)}
                          >
                            <SpeakerHigh size={21} weight="fill" />
                          </button>
                        </header>
                        <p className={styles.sentence}>
                          {localization.segments.map((phrase) => (
                            <button
                              type="button"
                              key={phrase.id}
                              className={activePhrase?.phrase.id === phrase.id ? styles.activePhrase : ""}
                              onClick={() => openPhrase(languageId, phrase)}
                            >
                              {phrase.text}
                            </button>
                          ))}
                        </p>
                        {progress.showRomanization && localization.romanization ? <p className={styles.romanization}>{localization.romanization}</p> : null}
                      </motion.article>
                    );
                  })}
                  </AnimatePresence>
                </motion.section>

                <AnimatePresence>
                  {activePhrase ? (
                    <motion.aside
                      className={styles.phrasePanel}
                      aria-label="Phrase details"
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    >
                      <div>
                        <span>{languages[activePhrase.languageId].nameEnglish} phrase</span>
                        <strong lang={languages[activePhrase.languageId].locale}>{activePhrase.phrase.text}</strong>
                      </div>
                      <div className={styles.phraseActions}>
                        <button
                          type="button"
                          aria-pressed={playingSampleId === `phrase:${activePhrase.phrase.id}`}
                          onClick={() => playSample(
                            `phrase:${activePhrase.phrase.id}`,
                            phraseAudioPath(content.slug, currentUnit.id, activePhrase.languageId, activePhrase.phrase.id),
                            activePhrase.phrase.text,
                            activePhrase.languageId,
                          )}
                        ><SpeakerHigh size={18} weight="fill" /> Play</button>
                        <button type="button" aria-pressed={progress.savedPhraseIds.includes(activePhrase.phrase.id)} onClick={() => toggleSavedPhrase(activePhrase.phrase.id)}>
                          <BookmarkSimple size={18} weight={progress.savedPhraseIds.includes(activePhrase.phrase.id) ? "fill" : "regular"} />
                          {progress.savedPhraseIds.includes(activePhrase.phrase.id) ? "Saved" : "Save"}
                        </button>
                        <button type="button" aria-expanded={translationRevealed} onClick={() => setTranslationRevealed((value) => !value)}><Translate size={18} /> {translationRevealed ? "Hide meaning" : "Show meaning"}</button>
                      </div>
                      {translationRevealed ? <p><small>Meaning in {activePhraseMeaningLanguage}</small>{activePhraseMeaning}</p> : null}
                    </motion.aside>
                  ) : null}
                </AnimatePresence>

                <section className={styles.speakingPanel} aria-labelledby="speaking-title">
                  <div className={styles.speakingIntro}>
                    <div>
                      <h2 id="speaking-title">Say it aloud</h2>
                      <p>{feedback}</p>
                    </div>
                    <label>
                      <span>Strictness</span>
                      <select value={strictness} onChange={(event) => setStrictness(event.target.value as Strictness)}>
                        <option value="relaxed">Relaxed</option>
                        <option value="normal">Normal</option>
                        <option value="strict">Strict</option>
                      </select>
                    </label>
                  </div>

                  <div className={styles.audioActions}>
                    <button
                      type="button"
                      aria-pressed={playingSampleId === `sentence:${content.slug}:${currentUnit.id}:${practiceLanguageId}:normal`}
                      onClick={() => playSentence(practiceLanguageId)}
                    ><SpeakerHigh size={20} weight="fill" /> Listen</button>
                    <button
                      type="button"
                      aria-pressed={playingSampleId === `sentence:${content.slug}:${currentUnit.id}:${practiceLanguageId}:slow`}
                      onClick={() => playSentence(practiceLanguageId, "slow")}
                    ><SpeakerHigh size={20} /> Slow</button>
                    <span className={styles.voiceSource}>Azure neural voice</span>
                  </div>

                  <div className={styles.speechActionRow}>
                    <button
                      className={`${styles.speakButton} ${speechState === "recording" ? styles.speakButtonRecording : ""}`}
                      type="button"
                      aria-label="Hold to speak and release to assess"
                      aria-pressed={readingFocusActive}
                      disabled={speechState === "evaluating"}
                      onClick={(event) => event.preventDefault()}
                      onPointerDown={(event) => {
                        if (event.button !== 0) return;
                        event.preventDefault();
                        event.currentTarget.setPointerCapture(event.pointerId);
                        beginSpeaking();
                      }}
                      onPointerUp={(event) => {
                        event.preventDefault();
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                          event.currentTarget.releasePointerCapture(event.pointerId);
                        }
                        releaseSpeaking();
                      }}
                      onPointerCancel={releaseSpeaking}
                      onKeyDown={(event) => {
                        if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                          event.preventDefault();
                          beginSpeaking();
                        }
                      }}
                      onKeyUp={(event) => {
                        if (event.key === " " || event.key === "Enter") {
                          event.preventDefault();
                          releaseSpeaking();
                        }
                      }}
                      onBlur={releaseSpeaking}
                    >
                      {speechIcon}
                      <span>{speechState === "recording"
                        ? "Release to assess"
                        : speechState === "requesting_permission"
                          ? "Keep holding"
                          : speechState === "evaluating"
                            ? "Checking"
                            : "Hold to speak"}</span>
                    </button>

                    <div className={styles.result} aria-live="polite">
                      {speechState === "passed" ? <CheckCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      {speechState === "failed" ? <XCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      {speechState === "error" ? <WarningCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      <span>
                        {score !== null ? <strong>{score}</strong> : <strong>{attempts}</strong>}
                        <small>{score !== null ? "pronunciation" : attempts === 1 ? "attempt" : "attempts"}</small>
                      </span>
                    </div>
                  </div>

                  {transcript ? <p className={styles.transcript}>Azure heard: <q>{transcript}</q></p> : null}

                  <div className={styles.speechFooter}>
                    <p>Short audio is sent to Azure Speech for scoring and is not stored by this app.</p>
                    <div>
                      {speechState === "error" ? <button type="button" onClick={() => { setSpeechState("idle"); setFeedback("Ready when you are. Hold the button and say the full sentence."); }}>Try again</button> : null}
                      {speechState === "failed" ? <button type="button" onClick={() => setSpeechState("idle")}>Retry</button> : null}
                      {skipAvailable && !unitIsComplete ? <button type="button" onClick={skipUnit}>Skip for now</button> : null}
                    </div>
                  </div>
                </section>

                <nav className={styles.unitNavigation} aria-label="Lesson sentence navigation">
                  <button type="button" disabled={unitIndex === 0} onClick={() => goToUnit(unitIndex - 1)}><ArrowLeft size={18} weight="bold" /> Previous</button>
                  <button type="button" className={styles.continueButton} disabled={!unitIsComplete} onClick={continueLesson}>
                    {unitIndex === content.units.length - 1 ? "Finish sample" : "Next sentence"} <ArrowRight size={18} weight="bold" />
                  </button>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
