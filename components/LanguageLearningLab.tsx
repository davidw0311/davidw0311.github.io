"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookmarkSimple,
  BookOpenText,
  CheckCircle,
  DotsSixVertical,
  Microphone,
  NumberCircleOne,
  Plus,
  SpeakerHigh,
  SpinnerGap,
  Translate,
  Trash,
  WarningCircle,
  X,
  XCircle,
} from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
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
  type LocalizedUnit,
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

type AssessmentResult = {
  passed: boolean;
  score: number;
  transcript?: string;
  message?: string;
};

const storageKey = "dyw-language-lab-progress-v1";
const pronunciationApiUrl = process.env.NEXT_PUBLIC_PRONUNCIATION_API_URL?.trim();
const maximumRecordingMs = 12_000;

type SupportLanguageCardProps = {
  languageId: LanguageId;
  localization: LocalizedUnit;
  activePhraseId?: string;
  playing: boolean;
  showRomanization: boolean;
  canMove: boolean;
  reduceMotion: boolean;
  onPlay: () => void;
  onOpenPhrase: (phrase: PhraseSegment) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
};

function SupportLanguageCard({
  languageId,
  localization,
  activePhraseId,
  playing,
  showRomanization,
  canMove,
  reduceMotion,
  onPlay,
  onOpenPhrase,
  onRemove,
  onMove,
}: SupportLanguageCardProps) {
  const reorderControls = useDragControls();
  const swipeControls = useDragControls();
  const x = useMotionValue(0);
  const removeOpacity = useTransform(x, [-82, -28, 0], [1, 0.35, 0]);

  return (
    <Reorder.Item
      as="div"
      value={languageId}
      className={styles.supportLanguageItem}
      dragListener={false}
      dragControls={reorderControls}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 38 }}
    >
      <motion.div className={styles.removeLanguageBackground} style={{ opacity: removeOpacity }} aria-hidden="true">
        <Trash size={17} weight="fill" />
        <span>Remove</span>
      </motion.div>
      <motion.article
        className={styles.supportLanguageCard}
        lang={languages[languageId].locale}
        style={{ x }}
        drag="x"
        dragListener={false}
        dragControls={swipeControls}
        dragConstraints={{ left: -84, right: 0 }}
        dragElastic={0.06}
        dragSnapToOrigin
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-no-swipe]")) return;
          swipeControls.start(event);
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -58 || info.velocity.x < -520) onRemove();
        }}
      >
        <header>
          <div>
            <span>{languages[languageId].nameNative}</span>
            <small>{languages[languageId].nameEnglish}</small>
          </div>
        </header>
        <p className={styles.sentence}>
          {localization.segments.map((phrase) => (
            <button
              type="button"
              key={phrase.id}
              className={activePhraseId === phrase.id ? styles.activePhrase : ""}
              onClick={() => onOpenPhrase(phrase)}
            >
              {phrase.text}
            </button>
          ))}
        </p>
        {showRomanization && localization.romanization ? <p className={styles.romanization}>{localization.romanization}</p> : null}
        <button
          type="button"
          className={styles.supportAudioButton}
          data-no-swipe
          aria-label={`Play ${languages[languageId].nameEnglish} sentence`}
          aria-pressed={playing}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onPlay}
        >
          <SpeakerHigh size={17} weight="fill" />
        </button>
        <button
          type="button"
          className={styles.dragHandle}
          data-no-swipe
          aria-label={`Reorder ${languages[languageId].nameEnglish}. Use arrow keys to move or Delete to remove.`}
          aria-describedby="support-language-help"
          onPointerDown={(event) => {
            event.stopPropagation();
            if (canMove) reorderControls.start(event);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onMove(-1);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              onMove(1);
            } else if (event.key === "Delete" || event.key === "Backspace") {
              event.preventDefault();
              onRemove();
            }
          }}
        >
          <DotsSixVertical size={19} weight="bold" />
        </button>
      </motion.article>
    </Reorder.Item>
  );
}

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
    const storedSupportLanguageId = preferredSupportLanguage(
      practiceLanguageId,
      isLanguageId(parsed.supportLanguageId) ? parsed.supportLanguageId : defaultLocalProgress.supportLanguageId,
    );
    const storedDisplayLanguageIds = Array.isArray(parsed.displayLanguageIds)
      ? parsed.displayLanguageIds.filter(isLanguageId)
      : defaultLocalProgress.displayLanguageIds;
    const supportingLanguageIds = Array.from(new Set(storedDisplayLanguageIds))
      .filter((languageId) => languageId !== practiceLanguageId);
    const supportLanguageId = supportingLanguageIds.includes(storedSupportLanguageId)
      ? storedSupportLanguageId
      : supportingLanguageIds[0] ?? storedSupportLanguageId;
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      completed: parsed.completed && typeof parsed.completed === "object" ? parsed.completed : {},
      savedPhraseIds: Array.isArray(parsed.savedPhraseIds)
        ? parsed.savedPhraseIds.filter((id): id is string => typeof id === "string")
        : [],
      practiceLanguageId,
      supportLanguageId,
      displayLanguageIds: [...supportingLanguageIds, practiceLanguageId],
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
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [activePhrase, setActivePhrase] = useState<{ languageId: LanguageId; phrase: PhraseSegment } | null>(null);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
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
  const readingFocusActive = speechState === "requesting_permission" || speechState === "recording";
  const supportLanguageIds = progress.displayLanguageIds.filter((languageId) => languageId !== practiceLanguageId);
  const availableLanguageIds = languageIds.filter((languageId) => (
    languageId !== practiceLanguageId && !supportLanguageIds.includes(languageId)
  ));

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

  useEffect(() => {
    if (!lessonOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [lessonOpen]);

  const stopPlayback = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setPlayingSampleId(null);
  }, []);

  const resetAttempt = useCallback((message = "") => {
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

  const openLesson = (index: number) => {
    selectContent(index);
    setLessonOpen(true);
  };

  const returnToLibrary = () => {
    setLessonOpen(false);
    setLanguagePickerOpen(false);
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
    setLanguagePickerOpen(false);
    setLessonFinished(false);
    resetAttempt();
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
          strictness: "normal",
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
    void startSpeaking();
  };

  const releaseSpeaking = () => {
    if (!holdActiveRef.current) return;
    holdActiveRef.current = false;
    const recording = recordingRef.current;
    if (recording) void evaluateRecording(recording);
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

  const reorderSupportLanguages = (orderedLanguageIds: LanguageId[]) => {
    setProgress((current) => {
      const nextSupportingLanguages = orderedLanguageIds.filter((languageId) => (
        languageId !== current.practiceLanguageId
        && current.displayLanguageIds.includes(languageId)
      ));
      return {
        ...current,
        supportLanguageId: nextSupportingLanguages[0]
          ?? preferredSupportLanguage(current.practiceLanguageId, current.supportLanguageId),
        displayLanguageIds: [...nextSupportingLanguages, current.practiceLanguageId],
      };
    });
  };

  const moveSupportLanguage = (languageId: LanguageId, direction: -1 | 1) => {
    const index = supportLanguageIds.indexOf(languageId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= supportLanguageIds.length) return;
    const next = [...supportLanguageIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    reorderSupportLanguages(next);
  };

  const addSupportLanguage = (languageId: LanguageId) => {
    setProgress((current) => {
      if (languageId === current.practiceLanguageId || current.displayLanguageIds.includes(languageId)) return current;
      const currentSupportingLanguages = current.displayLanguageIds.filter((candidate) => candidate !== current.practiceLanguageId);
      const nextSupportingLanguages = [...currentSupportingLanguages, languageId];
      return {
        ...current,
        supportLanguageId: currentSupportingLanguages[0] ?? languageId,
        displayLanguageIds: [...nextSupportingLanguages, current.practiceLanguageId],
      };
    });
    setLanguagePickerOpen(false);
  };

  const removeSupportLanguage = (languageId: LanguageId) => {
    setActivePhrase((current) => current?.languageId === languageId ? null : current);
    setProgress((current) => {
      const currentSupportingLanguages = current.displayLanguageIds.filter((candidate) => candidate !== current.practiceLanguageId);
      const nextSupportingLanguages = currentSupportingLanguages.filter((candidate) => candidate !== languageId);
      if (nextSupportingLanguages.length === currentSupportingLanguages.length) return current;
      return {
        ...current,
        supportLanguageId: nextSupportingLanguages[0]
          ?? preferredSupportLanguage(current.practiceLanguageId, current.supportLanguageId),
        displayLanguageIds: [...nextSupportingLanguages, current.practiceLanguageId],
      };
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
        {lessonOpen ? (
          <div className={styles.lessonIdentity}>
            <button type="button" className={styles.backToLibrary} aria-label="Back to lessons" onClick={returnToLibrary}>
              <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              <span>Lessons</span>
            </button>
            <div>
              <span>{content.type === "story" ? "Story" : "Counting"}</span>
              <h1 id="active-lesson-title">{content.title}</h1>
            </div>
          </div>
        ) : (
          <div className={styles.brandBlock}>
            <span className={styles.brandMark} aria-hidden="true">L</span>
            <div>
              <strong>Lilt</strong>
              <span>speaking lab</span>
            </div>
          </div>
        )}
        <div className={styles.headerStats} aria-label="Local learning progress">
          <span>{progress.xp} XP</span>
          <span>{progress.savedPhraseIds.length} saved</span>
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {!lessonOpen ? (
          <motion.section
            key="library"
            className={styles.landing}
            aria-labelledby="library-title"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
          >
            <div className={styles.landingHeading}>
              <div>
                <h1 id="library-title">Choose a short lesson</h1>
                <p>Pick a scene, then practice every sentence by speaking it.</p>
              </div>
              <div className={styles.practiceLanguage}>
                <div className={styles.languageChoice}>
                  <label htmlFor="practice-language">Learning language</label>
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
                {languages[practiceLanguageId].toneSensitive ? (
                  <p><WarningCircle size={16} weight="fill" aria-hidden="true" /> Azure does not return a separate tone score for this language.</p>
                ) : null}
              </div>
            </div>

            <div className={styles.lessonCards} aria-label="Available lessons">
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
                    aria-label={`Open ${item.title}`}
                    onClick={() => openLesson(index)}
                  >
                    <span className={styles.lessonCardIcon}><Icon size={25} weight="fill" aria-hidden="true" /></span>
                    <span className={styles.lessonCardCopy}>
                      <small>{item.type === "story" ? "Story" : "Counting"} / {item.estimatedMinutes} min</small>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </span>
                    <span className={styles.lessonCardAction}>
                      <small>{completed > 0 ? `${completed} of ${item.units.length} complete` : `${item.units.length} prompts`}</small>
                      <span>{completed > 0 && completed < item.units.length ? "Continue" : "Start"} <ArrowRight size={17} weight="bold" aria-hidden="true" /></span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="lesson"
            className={styles.lessonView}
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: 10 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
          >
            <section className={styles.lesson} id="language-lesson" aria-labelledby="active-lesson-title">
          <div className={styles.lessonTopline}>
            <span>{languages[practiceLanguageId].nameEnglish} practice</span>
            <div className={styles.unitCount} aria-label={`${completionCount} of ${content.units.length} prompts complete`}>
              <strong>Prompt {unitIndex + 1} of {content.units.length}</strong>
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
                  <button type="button" onClick={returnToLibrary}>Choose another lesson</button>
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
                <div className={styles.referencePane}>
                  {currentUnit.number ? (
                    <div className={styles.numberPrompt} aria-label={`Number ${currentUnit.number}`}>
                      <span>Say this number</span>
                      <strong>{currentUnit.number}</strong>
                    </div>
                  ) : null}

                  <motion.section
                  className={styles.reader}
                  aria-label="Support language reader"
                  aria-hidden={readingFocusActive}
                  inert={readingFocusActive}
                  animate={{ opacity: readingFocusActive ? 0 : 1, scale: readingFocusActive ? 0.99 : 1 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className={styles.srOnly} id="support-language-help">Swipe a language left to remove it. Drag its handle to reorder it.</p>
                  <Reorder.Group
                    as="div"
                    axis="y"
                    values={supportLanguageIds}
                    onReorder={reorderSupportLanguages}
                    className={styles.supportLanguageList}
                  >
                    {supportLanguageIds.map((languageId, index) => (
                      <SupportLanguageCard
                        key={languageId}
                        languageId={languageId}
                        localization={currentUnit.localizations[languageId]}
                        activePhraseId={activePhrase?.phrase.id}
                        playing={playingSampleId === `sentence:${content.slug}:${currentUnit.id}:${languageId}:normal`}
                        showRomanization={progress.showRomanization}
                        canMove={supportLanguageIds.length > 1}
                        reduceMotion={Boolean(reduceMotion)}
                        onPlay={() => playSentence(languageId)}
                        onOpenPhrase={(phrase) => openPhrase(languageId, phrase)}
                        onRemove={() => removeSupportLanguage(languageId)}
                        onMove={(direction) => {
                          const nextIndex = index + direction;
                          if (nextIndex >= 0 && nextIndex < supportLanguageIds.length) moveSupportLanguage(languageId, direction);
                        }}
                      />
                    ))}
                  </Reorder.Group>

                  <div className={styles.languageManager}>
                    <button
                      type="button"
                      className={styles.addLanguageButton}
                      aria-label="Add a language"
                      aria-expanded={languagePickerOpen}
                      onClick={() => setLanguagePickerOpen((open) => !open)}
                    >
                      <Plus size={15} weight="bold" aria-hidden="true" />
                      <span>Add language</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {languagePickerOpen ? (
                        <motion.div
                          className={styles.languagePicker}
                          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
                        >
                          <strong>Add a language</strong>
                          <div>
                            {availableLanguageIds.length > 0 ? availableLanguageIds.map((languageId) => (
                              <button type="button" key={languageId} onClick={() => addSupportLanguage(languageId)}>
                                <span>{languages[languageId].nameNative}</span>
                                <small>{languages[languageId].nameEnglish}</small>
                              </button>
                            )) : <span className={styles.allLanguagesAdded}>All languages added</span>}
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={progress.showRomanization}
                              onChange={(event) => setProgress((current) => ({ ...current, showRomanization: event.target.checked }))}
                            />
                            <span>Show romanization</span>
                          </label>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                  </motion.section>

                  <AnimatePresence>
                    {activePhrase ? (
                      <motion.aside
                        className={styles.phrasePanel}
                        aria-label="Phrase details"
                        aria-hidden={readingFocusActive}
                        inert={readingFocusActive}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: readingFocusActive ? 0 : 1, y: 0, scale: readingFocusActive ? 0.99 : 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <button type="button" className={styles.closePhraseButton} aria-label="Close phrase details" onClick={() => setActivePhrase(null)}>
                          <X size={16} weight="bold" aria-hidden="true" />
                        </button>
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
                </div>

                <section className={styles.speakingPanel} aria-labelledby="speaking-title">
                  <h2 id="speaking-title">Say it aloud</h2>

                  <div className={styles.practicePrompt} lang={languages[practiceLanguageId].locale}>
                    <div>
                      <span>{languages[practiceLanguageId].nameNative}</span>
                      <small>{languages[practiceLanguageId].nameEnglish} practice</small>
                    </div>
                    <p>{practiceLocalization.text}</p>
                    {progress.showRomanization && practiceLocalization.romanization ? (
                      <small className={styles.practiceRomanization}>{practiceLocalization.romanization}</small>
                    ) : null}
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

                  <div className={styles.speechMessages}>
                    {transcript ? <p className={styles.transcript}>Azure heard: <q>{transcript}</q></p> : null}
                    {speechState !== "idle" && feedback ? <p className={styles.speechFeedback} aria-live="polite">{feedback}</p> : null}
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
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
