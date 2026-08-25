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
  speechLocale,
  unitProgressKey,
  type CompletionStatus,
  type LanguageId,
  type LocalizedUnit,
  type LocalProgress,
  type PhraseSegment,
  type PronunciationMode,
} from "@/data/languageLearning";
import {
  formatUi,
  languageLearningUi,
  type LanguageLearningUiCopy,
} from "@/data/languageLearningUi";
import {
  tokenizeLanguageStudyText,
  type LanguageStudyToken,
} from "@/data/languageStudyTokens";
import {
  getEnglishPronunciationGuide,
  getNativePronunciationGuide,
  nativePronunciationSystems,
  type NativePronunciationSystem,
} from "@/data/languagePronunciation";
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
  ui: LanguageLearningUiCopy;
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
  ui,
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
        <span>{ui.remove}</span>
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
            <small>{languages[languageId].locale}</small>
          </div>
        </header>
        <p className={styles.sentence}>
          {localization.segments.map((phrase) => (
            <button
              type="button"
              key={phrase.id}
              className={activePhraseId === phrase.id ? styles.activePhrase : ""}
              data-no-swipe
              onPointerDown={(event) => event.stopPropagation()}
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
          aria-label={formatUi(ui.playSentence, { language: languages[languageId].nameNative })}
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
          aria-label={formatUi(ui.reorderLanguage, { language: languages[languageId].nameNative })}
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

function isPronunciationMode(value: unknown): value is PronunciationMode {
  return value === "off" || value === "native" || value === "english";
}

function nativePronunciationLabel(
  system: NativePronunciationSystem,
  ui: LanguageLearningUiCopy,
): string {
  if (system === "pinyin") return ui.pinyin;
  if (system === "jyutping") return ui.jyutping;
  if (system === "hiragana") return ui.hiragana;
  if (system === "romanization") return ui.romanizationLabel;
  return ui.transliteration;
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
    const pronunciationModes = parsed.pronunciationModes && typeof parsed.pronunciationModes === "object"
      ? Object.fromEntries(
        languageIds.flatMap((languageId) => {
          const mode = parsed.pronunciationModes?.[languageId];
          return isPronunciationMode(mode) ? [[languageId, mode]] : [];
        }),
      ) as Partial<Record<LanguageId, PronunciationMode>>
      : {};
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      completed: parsed.completed && typeof parsed.completed === "object" ? parsed.completed : {},
      savedPhraseIds: Array.isArray(parsed.savedPhraseIds)
        ? parsed.savedPhraseIds.filter((id): id is string => typeof id === "string")
        : [],
      systemLanguageId: isLanguageId(parsed.systemLanguageId)
        ? parsed.systemLanguageId
        : defaultLocalProgress.systemLanguageId,
      practiceLanguageId,
      supportLanguageId,
      displayLanguageIds: [...supportingLanguageIds, practiceLanguageId],
      showRomanization: parsed.showRomanization ?? true,
      pronunciationModes,
    };
  } catch {
    return defaultLocalProgress;
  }
}

type LanguageLearningLabProps = {
  onSystemLanguageChange?: (languageId: LanguageId) => void;
};

export function LanguageLearningLab({ onSystemLanguageChange }: LanguageLearningLabProps = {}) {
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
  const [activeStudyToken, setActiveStudyToken] = useState<{
    languageId: LanguageId;
    token: LanguageStudyToken;
  } | null>(null);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [systemLanguagePickerOpen, setSystemLanguagePickerOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const recordingRef = useRef<AudioRecording | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const holdActiveRef = useRef(false);

  const practiceLanguageId = progress.practiceLanguageId;
  const systemLanguageId = progress.systemLanguageId;
  const ui = languageLearningUi[systemLanguageId];
  const supportLanguageId = progress.supportLanguageId;
  const content = contentItems[contentIndex];
  const contentText = ui.content[content.id] ?? { title: content.title, description: content.description };
  const currentUnit = content.units[unitIndex];
  const practiceLocalization = currentUnit.localizations[practiceLanguageId];
  const activePhraseMeaning = activePhrase && activePhrase.languageId !== supportLanguageId && supportLanguageId !== "en"
    ? currentUnit.localizations[supportLanguageId].text
    : activePhrase?.phrase.translation;
  const activePhraseMeaningLanguage = activePhrase && activePhrase.languageId !== supportLanguageId && supportLanguageId !== "en"
    ? languages[supportLanguageId].nameNative
    : languages.en.nameNative;
  const activePronunciationLanguageId = activePhrase?.languageId;
  const activePronunciationLocalization = activePronunciationLanguageId
    ? currentUnit.localizations[activePronunciationLanguageId]
    : null;
  const activeNativePronunciation = activePhrase && activePronunciationLocalization
    ? getNativePronunciationGuide(
      activePhrase.languageId,
      activePhrase.phrase,
      activePronunciationLocalization,
      activeStudyToken?.token,
    )
    : null;
  const activeEnglishPronunciation = activePhrase && activePronunciationLocalization
    ? getEnglishPronunciationGuide(
      activePhrase.languageId,
      activePhrase.phrase,
      activePronunciationLocalization,
      activeStudyToken?.token,
    )
    : null;
  const activePronunciationMode = activePronunciationLanguageId
    ? progress.pronunciationModes[activePronunciationLanguageId] ?? "off"
    : "off";
  const activePronunciationGuide = activePronunciationMode === "native"
    ? activeNativePronunciation
    : activePronunciationMode === "english" ? activeEnglishPronunciation : null;
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

  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    document.documentElement.lang = languages[systemLanguageId].locale;
    onSystemLanguageChange?.(systemLanguageId);
    return () => {
      document.documentElement.lang = previousLanguage;
    };
  }, [onSystemLanguageChange, systemLanguageId]);

  useEffect(() => {
    if (!languagePickerOpen && !systemLanguagePickerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setLanguagePickerOpen(false);
      setSystemLanguagePickerOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [languagePickerOpen, systemLanguagePickerOpen]);

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
    setActiveStudyToken(null);
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
    setSystemLanguagePickerOpen(false);
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
      setFeedback(ui.audioUnavailable);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceLocale = speechLocale(languageId);
    utterance.lang = voiceLocale;
    utterance.rate = rate;
    const voiceLocaleLower = voiceLocale.toLowerCase();
    const voiceLanguage = voiceLocaleLower.split("-")[0];
    const availableVoices = window.speechSynthesis.getVoices();
    const voice = availableVoices.find((candidate) => candidate.lang.toLowerCase() === voiceLocaleLower)
      ?? availableVoices.find((candidate) => candidate.lang.toLowerCase().startsWith(voiceLanguage));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, [ui.audioUnavailable]);

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
      setFeedback(ui.passedFeedback);
      setCompletion("passed", 10);
    } else {
      setFeedback(ui.retryFeedback);
    }
  };

  const evaluateRecording = async (recording: AudioRecording) => {
    holdActiveRef.current = false;
    if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = null;
    recordingRef.current = null;
    setSpeechState("evaluating");
    setFeedback(ui.sendingRecording);

    try {
      const audio = await recording.stop();
      if (audio.size < 1_600) throw new Error("no-audio");

      const response = await fetch(pronunciationApiUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: await blobToBase64(audio),
          locale: speechLocale(practiceLanguageId),
          referenceText: practiceLanguageId === "zht"
            ? currentUnit.localizations.zh.text
            : practiceLocalization.text,
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
        ? ui.recordingTooShort
        : ui.assessmentError);
    }
  };

  const startSpeaking = async () => {
    if (!pronunciationApiUrl) {
      holdActiveRef.current = false;
      setSpeechState("error");
      setFeedback(ui.assessmentNotConfigured);
      return;
    }

    setSpeechState("requesting_permission");
    setFeedback(ui.startingMicrophone);
    try {
      const recording = await startAudioRecording();
      recordingRef.current = recording;
      if (!holdActiveRef.current) {
        void evaluateRecording(recording);
        return;
      }
      setSpeechState("recording");
      setFeedback(ui.listeningNow);
      recordingTimerRef.current = window.setTimeout(() => void evaluateRecording(recording), maximumRecordingMs);
    } catch (error) {
      holdActiveRef.current = false;
      setSpeechState("error");
      setFeedback(error instanceof DOMException && error.name === "NotAllowedError"
        ? ui.microphoneBlocked
        : ui.microphoneError);
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
    setActiveStudyToken((current) => current?.languageId === languageId ? null : current);
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

  const toggleDisplayLanguage = (languageId: LanguageId) => {
    if (languageId === practiceLanguageId) return;
    if (supportLanguageIds.includes(languageId)) {
      removeSupportLanguage(languageId);
      return;
    }
    setProgress((current) => {
      const currentSupportingLanguages = current.displayLanguageIds.filter((candidate) => candidate !== current.practiceLanguageId);
      return {
        ...current,
        supportLanguageId: currentSupportingLanguages[0] ?? languageId,
        displayLanguageIds: [...currentSupportingLanguages, languageId, current.practiceLanguageId],
      };
    });
  };

  const selectSystemLanguage = (languageId: LanguageId) => {
    setProgress((current) => ({ ...current, systemLanguageId: languageId }));
    setSystemLanguagePickerOpen(false);
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
    setActiveStudyToken(null);
    setTranslationRevealed(false);
  };

  const openStudyToken = (
    languageId: LanguageId,
    token: LanguageStudyToken,
  ) => {
    setActiveStudyToken({ languageId, token });
  };

  const setPronunciationMode = (languageId: LanguageId, mode: PronunciationMode) => {
    setProgress((current) => ({
      ...current,
      pronunciationModes: { ...current.pronunciationModes, [languageId]: mode },
    }));
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
            <button type="button" className={styles.backToLibrary} aria-label={ui.lessons} onClick={returnToLibrary}>
              <ArrowLeft size={18} weight="bold" aria-hidden="true" />
              <span>{ui.lessons}</span>
            </button>
            <div>
              <span>{content.type === "story" ? ui.story : ui.counting}</span>
              <h1 id="active-lesson-title">{contentText.title}</h1>
            </div>
          </div>
        ) : (
          <div className={styles.brandBlock}>
            <span className={styles.brandMark} aria-hidden="true">L</span>
            <div>
              <strong>Lilt</strong>
              <span>{ui.brandSubtitle}</span>
            </div>
          </div>
        )}
        <div className={styles.headerActions}>
          <div className={styles.headerStats} aria-label={ui.localProgress}>
            <span>{formatUi(ui.xp, { count: progress.xp })}</span>
            <span>{formatUi(ui.savedCount, { count: progress.savedPhraseIds.length })}</span>
          </div>
          <div className={styles.systemLanguageControl}>
            <button
              type="button"
              className={styles.systemLanguageButton}
              aria-label={ui.changeSystemLanguage}
              aria-expanded={systemLanguagePickerOpen}
              title={ui.changeSystemLanguage}
              onClick={() => setSystemLanguagePickerOpen((open) => !open)}
            >
              <Translate size={20} weight="bold" aria-hidden="true" />
            </button>
            <AnimatePresence initial={false}>
              {systemLanguagePickerOpen ? (
                <motion.div
                  className={styles.systemLanguagePicker}
                  role="dialog"
                  aria-label={ui.systemLanguage}
                  initial={reduceMotion ? false : { opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
                >
                  <strong>{ui.systemLanguage}</strong>
                  <div>
                    {languageIds.map((languageId) => (
                      <button
                        type="button"
                        key={languageId}
                        aria-pressed={systemLanguageId === languageId}
                        onClick={() => selectSystemLanguage(languageId)}
                      >
                        <span>{languages[languageId].nameNative}</span>
                        {systemLanguageId === languageId ? <CheckCircle size={17} weight="fill" aria-hidden="true" /> : null}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
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
                <h1 id="library-title">{ui.chooseLesson}</h1>
                <p>{ui.chooseLessonHelp}</p>
              </div>
              <div className={styles.languageSetup}>
                <div className={styles.languageChoice}>
                  <label htmlFor="practice-language">{ui.learningLanguage}</label>
                  <select
                    id="practice-language"
                    value={practiceLanguageId}
                    onChange={(event) => selectPracticeLanguage(event.target.value as LanguageId)}
                  >
                    {languageIds.map((id) => (
                      <option key={id} value={id}>
                        {languages[id].nameNative}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.displayLanguageChoice}>
                  <span>{ui.displayedLanguages}</span>
                  <button
                    type="button"
                    aria-label={ui.chooseDisplayedLanguages}
                    aria-expanded={languagePickerOpen}
                    onClick={() => setLanguagePickerOpen((open) => !open)}
                  >
                    <span>{supportLanguageIds.length > 0
                      ? supportLanguageIds.slice(0, 2).map((id) => languages[id].nameNative).join(", ")
                      : ui.noDisplayedLanguages}</span>
                    {supportLanguageIds.length > 2 ? <small>+{supportLanguageIds.length - 2}</small> : null}
                    <Plus size={15} weight="bold" aria-hidden="true" />
                  </button>
                  <AnimatePresence initial={false}>
                    {languagePickerOpen ? (
                      <motion.div
                        className={styles.displayLanguagePicker}
                        role="group"
                        aria-label={ui.chooseDisplayedLanguages}
                        initial={reduceMotion ? false : { opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
                      >
                        <strong>{ui.chooseDisplayedLanguages}</strong>
                        <div>
                          {languageIds.filter((id) => id !== practiceLanguageId).map((languageId) => {
                            const selected = supportLanguageIds.includes(languageId);
                            return (
                              <button
                                type="button"
                                key={languageId}
                                aria-pressed={selected}
                                onClick={() => toggleDisplayLanguage(languageId)}
                              >
                                <span>{languages[languageId].nameNative}</span>
                                {selected ? <CheckCircle size={17} weight="fill" aria-hidden="true" /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                {languages[practiceLanguageId].toneSensitive ? (
                  <p><WarningCircle size={16} weight="fill" aria-hidden="true" /> {ui.toneWarning}</p>
                ) : null}
              </div>
            </div>

            <div className={styles.lessonCards} aria-label={ui.availableLessons}>
              {contentItems.map((item, index) => {
                const completed = item.units.filter((candidate) => {
                  const status = progress.completed[unitProgressKey(item.id, candidate.id, practiceLanguageId)];
                  return status === "passed" || status === "skipped";
                }).length;
                const Icon = item.type === "story" ? BookOpenText : NumberCircleOne;
                const itemText = ui.content[item.id] ?? { title: item.title, description: item.description };
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={formatUi(ui.openLesson, { lesson: itemText.title })}
                    onClick={() => openLesson(index)}
                  >
                    <span className={styles.lessonCardIcon}><Icon size={25} weight="fill" aria-hidden="true" /></span>
                    <span className={styles.lessonCardCopy}>
                      <small>{item.type === "story" ? ui.story : ui.counting} / {formatUi(ui.minutes, { count: item.estimatedMinutes })}</small>
                      <strong>{itemText.title}</strong>
                      <span>{itemText.description}</span>
                    </span>
                    <span className={styles.lessonCardAction}>
                      <small>{completed > 0
                        ? formatUi(ui.completedCount, { count: completed, total: item.units.length })
                        : formatUi(ui.promptsCount, { count: item.units.length })}</small>
                      <span>{completed > 0 && completed < item.units.length ? ui.continue : ui.start} <ArrowRight size={17} weight="bold" aria-hidden="true" /></span>
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
            <span>{formatUi(ui.practiceIn, { language: languages[practiceLanguageId].nameNative })}</span>
            <div className={styles.unitCount} aria-label={formatUi(ui.completedCount, { count: completionCount, total: content.units.length })}>
              <strong>{formatUi(ui.promptProgress, { count: unitIndex + 1, total: content.units.length })}</strong>
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
                <h2>{ui.sampleComplete}</h2>
                <p>{formatUi(ui.sampleCompleteBody, { count: content.units.length, language: languages[practiceLanguageId].nameNative })}</p>
                <div>
                  <button type="button" onClick={() => { setLessonFinished(false); goToUnit(0); }}>{ui.practiceAgain}</button>
                  <button type="button" onClick={returnToLibrary}>{ui.chooseAnotherLesson}</button>
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
                    <div className={styles.numberPrompt} aria-label={`${ui.sayThisNumber}: ${currentUnit.number}`}>
                      <span>{ui.sayThisNumber}</span>
                      <strong>{currentUnit.number}</strong>
                    </div>
                  ) : null}

                  <motion.section
                  className={styles.reader}
                  aria-label={ui.supportReader}
                  aria-hidden={readingFocusActive}
                  inert={readingFocusActive}
                  animate={{ opacity: readingFocusActive ? 0 : 1, scale: readingFocusActive ? 0.99 : 1 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className={styles.srOnly} id="support-language-help">{ui.supportHelp}</p>
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
                        ui={ui}
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
                      aria-label={ui.addLanguage}
                      aria-expanded={languagePickerOpen}
                      onClick={() => setLanguagePickerOpen((open) => !open)}
                    >
                      <Plus size={15} weight="bold" aria-hidden="true" />
                      <span>{ui.addLanguage}</span>
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
                          <strong>{ui.addLanguage}</strong>
                          <div>
                            {availableLanguageIds.length > 0 ? availableLanguageIds.map((languageId) => (
                              <button type="button" key={languageId} onClick={() => addSupportLanguage(languageId)}>
                                <span>{languages[languageId].nameNative}</span>
                                <small>{languages[languageId].locale}</small>
                              </button>
                            )) : <span className={styles.allLanguagesAdded}>{ui.allLanguagesAdded}</span>}
                          </div>
                          <label>
                            <input
                              type="checkbox"
                              checked={progress.showRomanization}
                              onChange={(event) => setProgress((current) => ({ ...current, showRomanization: event.target.checked }))}
                            />
                            <span>{ui.showRomanization}</span>
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
                        aria-label={activeStudyToken
                          ? activeStudyToken.token.kind === "character" ? ui.characterDetails : ui.wordDetails
                          : ui.phraseDetails}
                        aria-hidden={readingFocusActive}
                        inert={readingFocusActive}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: readingFocusActive ? 0 : 1, y: 0, scale: readingFocusActive ? 0.99 : 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                        transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <button
                          type="button"
                          className={styles.closePhraseButton}
                          aria-label={activeStudyToken
                            ? activeStudyToken.token.kind === "character" ? ui.closeCharacterDetails : ui.closeWordDetails
                            : ui.closePhraseDetails}
                          onClick={() => {
                            setActivePhrase(null);
                            setActiveStudyToken(null);
                          }}
                        >
                          <X size={16} weight="bold" aria-hidden="true" />
                        </button>
                        {activeStudyToken ? (
                          <>
                            <button
                              type="button"
                              className={styles.backToPhraseButton}
                              aria-label={ui.backToPhrase}
                              onClick={() => setActiveStudyToken(null)}
                            >
                              <ArrowLeft size={16} weight="bold" aria-hidden="true" />
                            </button>
                            <div>
                              <span>{formatUi(
                                activeStudyToken.token.kind === "character" ? ui.characterIn : ui.wordIn,
                                { language: languages[activeStudyToken.languageId].nameNative },
                              )}</span>
                              <strong
                                className={activeStudyToken.token.kind === "character" ? styles.characterGlyph : styles.wordGlyph}
                                lang={languages[activeStudyToken.languageId].locale}
                              >
                                {activeStudyToken.token.text}
                              </strong>
                            </div>
                            <div className={styles.phraseActions}>
                              <button
                                type="button"
                                aria-pressed={progress.savedPhraseIds.includes(activeStudyToken.token.id)}
                                onClick={() => toggleSavedPhrase(activeStudyToken.token.id)}
                              >
                                <BookmarkSimple size={18} weight={progress.savedPhraseIds.includes(activeStudyToken.token.id) ? "fill" : "regular"} />
                                {progress.savedPhraseIds.includes(activeStudyToken.token.id) ? ui.saved : ui.save}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span>{formatUi(ui.phraseIn, { language: languages[activePhrase.languageId].nameNative })}</span>
                              <strong className={styles.phraseStudyText} lang={languages[activePhrase.languageId].locale}>
                                {tokenizeLanguageStudyText(activePhrase.phrase.text, activePhrase.languageId).map((chunk, index) => chunk.type === "study" ? (
                                  <button
                                    type="button"
                                    key={`${chunk.token.id}-${index}`}
                                    className={progress.savedPhraseIds.includes(chunk.token.id) ? styles.savedStudyToken : ""}
                                    aria-pressed={progress.savedPhraseIds.includes(chunk.token.id)}
                                    onClick={() => openStudyToken(activePhrase.languageId, chunk.token)}
                                  >
                                    {chunk.token.text}
                                  </button>
                                ) : <span key={`text-${index}`}>{chunk.text}</span>)}
                              </strong>
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
                              ><SpeakerHigh size={18} weight="fill" /> {ui.play}</button>
                              <button type="button" aria-pressed={progress.savedPhraseIds.includes(activePhrase.phrase.id)} onClick={() => toggleSavedPhrase(activePhrase.phrase.id)}>
                                <BookmarkSimple size={18} weight={progress.savedPhraseIds.includes(activePhrase.phrase.id) ? "fill" : "regular"} />
                                {progress.savedPhraseIds.includes(activePhrase.phrase.id) ? ui.saved : ui.save}
                              </button>
                              <button type="button" aria-expanded={translationRevealed} onClick={() => setTranslationRevealed((value) => !value)}><Translate size={18} /> {translationRevealed ? ui.hideMeaning : ui.showMeaning}</button>
                            </div>
                            {translationRevealed ? <p><small>{formatUi(ui.meaningIn, { language: activePhraseMeaningLanguage })}</small>{activePhraseMeaning}</p> : null}
                          </>
                        )}
                        {activePronunciationLanguageId && (activeNativePronunciation || activeEnglishPronunciation) ? (
                          <div className={styles.pronunciationBlock}>
                            <div
                              className={styles.pronunciationOptions}
                              role="group"
                              aria-label={ui.pronunciationGuide}
                            >
                              <span>{ui.pronunciationGuide}</span>
                              <button
                                type="button"
                                aria-pressed={activePronunciationMode === "off"}
                                onClick={() => setPronunciationMode(activePronunciationLanguageId, "off")}
                              >
                                {ui.pronunciationOff}
                              </button>
                              {activeNativePronunciation && nativePronunciationSystems[activePronunciationLanguageId] ? (
                                <button
                                  type="button"
                                  aria-pressed={activePronunciationMode === "native"}
                                  onClick={() => setPronunciationMode(activePronunciationLanguageId, "native")}
                                >
                                  {nativePronunciationLabel(nativePronunciationSystems[activePronunciationLanguageId], ui)}
                                </button>
                              ) : null}
                              {activeEnglishPronunciation ? (
                                <button
                                  type="button"
                                  aria-pressed={activePronunciationMode === "english"}
                                  onClick={() => setPronunciationMode(activePronunciationLanguageId, "english")}
                                >
                                  {ui.englishPhonetics}
                                </button>
                              ) : null}
                            </div>
                            {activePronunciationGuide ? (
                              <p className={styles.pronunciationReading}>
                                <small>
                                  {activePronunciationMode === "native" && nativePronunciationSystems[activePronunciationLanguageId]
                                    ? nativePronunciationLabel(nativePronunciationSystems[activePronunciationLanguageId], ui)
                                    : ui.englishPhonetics}
                                  {activeStudyToken && activePronunciationGuide.scope === "phrase" ? ` · ${ui.phraseGuide}` : ""}
                                </small>
                                {activePronunciationGuide.text}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </motion.aside>
                    ) : null}
                  </AnimatePresence>
                </div>

                <section className={styles.speakingPanel} aria-labelledby="speaking-title">
                  <h2 id="speaking-title">{ui.sayItAloud}</h2>

                  <div className={styles.practicePrompt} lang={languages[practiceLanguageId].locale}>
                    <div>
                      <span>{languages[practiceLanguageId].nameNative}</span>
                      <small>{formatUi(ui.practiceIn, { language: languages[practiceLanguageId].nameNative })}</small>
                    </div>
                    <p>
                      {practiceLocalization.segments.map((phrase) => {
                        const saved = progress.savedPhraseIds.includes(phrase.id);
                        return (
                          <button
                            type="button"
                            key={phrase.id}
                            className={`${activePhrase?.phrase.id === phrase.id ? styles.activePhrase : ""} ${saved ? styles.savedPracticePhrase : ""}`}
                            aria-pressed={saved}
                            onClick={() => openPhrase(practiceLanguageId, phrase)}
                          >
                            {phrase.text}
                          </button>
                        );
                      })}
                    </p>
                    {progress.showRomanization && practiceLocalization.romanization ? (
                      <small className={styles.practiceRomanization}>{practiceLocalization.romanization}</small>
                    ) : null}
                  </div>

                  <div className={styles.audioActions}>
                    <button
                      type="button"
                      aria-pressed={playingSampleId === `sentence:${content.slug}:${currentUnit.id}:${practiceLanguageId}:normal`}
                      onClick={() => playSentence(practiceLanguageId)}
                    ><SpeakerHigh size={20} weight="fill" /> {ui.listen}</button>
                    <button
                      type="button"
                      aria-pressed={playingSampleId === `sentence:${content.slug}:${currentUnit.id}:${practiceLanguageId}:slow`}
                      onClick={() => playSentence(practiceLanguageId, "slow")}
                    ><SpeakerHigh size={20} /> {ui.slow}</button>
                    <span className={styles.voiceSource}>{ui.azureVoice}</span>
                  </div>

                  <div className={styles.speechActionRow}>
                    <button
                      className={`${styles.speakButton} ${speechState === "recording" ? styles.speakButtonRecording : ""}`}
                      type="button"
                      aria-label={ui.holdToSpeakAria}
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
                        ? ui.releaseToAssess
                        : speechState === "requesting_permission"
                          ? ui.keepHolding
                          : speechState === "evaluating"
                            ? ui.checking
                            : ui.holdToSpeak}</span>
                    </button>

                    <div className={styles.result} aria-live="polite">
                      {speechState === "passed" ? <CheckCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      {speechState === "failed" ? <XCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      {speechState === "error" ? <WarningCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      <span>
                        {score !== null ? <strong>{score}</strong> : <strong>{attempts}</strong>}
                        <small>{score !== null ? ui.pronunciation : attempts === 1 ? ui.attempt : ui.attempts}</small>
                      </span>
                    </div>
                  </div>

                  <div className={styles.speechMessages}>
                    {transcript ? <p className={styles.transcript}>{ui.azureHeard} <q>{transcript}</q></p> : null}
                    {speechState !== "idle" && feedback ? <p className={styles.speechFeedback} aria-live="polite">{feedback}</p> : null}
                  </div>
                </section>

                <nav className={styles.unitNavigation} aria-label={ui.lessonNavigation}>
                  <button type="button" disabled={unitIndex === 0} onClick={() => goToUnit(unitIndex - 1)}><ArrowLeft size={18} weight="bold" /> {ui.previous}</button>
                  <button type="button" className={styles.continueButton} disabled={!unitIsComplete} onClick={continueLesson}>
                    {unitIndex === content.units.length - 1 ? ui.finishSample : ui.nextSentence} <ArrowRight size={18} weight="bold" />
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
