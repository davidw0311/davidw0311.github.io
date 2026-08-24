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
  languageIds,
  languages,
  scoreTranscript,
  unitProgressKey,
  type CompletionStatus,
  type LanguageId,
  type LocalProgress,
  type PhraseSegment,
} from "@/data/languageLearning";
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

type SpeechRecognitionResultEvent = Event & {
  results: ArrayLike<{ 0: { transcript: string } }>;
};

type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

const storageKey = "dyw-language-lab-progress-v1";
const thresholds: Record<Strictness, number> = { relaxed: 62, normal: 74, strict: 86 };

function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && languageIds.includes(value as LanguageId);
}

function readLocalProgress(value: string | null): LocalProgress {
  if (!value) return defaultLocalProgress;
  try {
    const parsed = JSON.parse(value) as Partial<LocalProgress>;
    const displayLanguageIds = Array.isArray(parsed.displayLanguageIds)
      ? parsed.displayLanguageIds.filter(isLanguageId)
      : defaultLocalProgress.displayLanguageIds;
    return {
      xp: typeof parsed.xp === "number" ? parsed.xp : 0,
      completed: parsed.completed && typeof parsed.completed === "object" ? parsed.completed : {},
      savedPhraseIds: Array.isArray(parsed.savedPhraseIds)
        ? parsed.savedPhraseIds.filter((id): id is string => typeof id === "string")
        : [],
      displayLanguageIds: displayLanguageIds.length > 0 ? displayLanguageIds : defaultLocalProgress.displayLanguageIds,
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
  const [practiceLanguageId, setPracticeLanguageId] = useState<LanguageId>("ja");
  const [strictness, setStrictness] = useState<Strictness>("normal");
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("Listen once, then say the sentence aloud.");
  const [activePhrase, setActivePhrase] = useState<{ languageId: LanguageId; phrase: PhraseSegment } | null>(null);
  const [translationRevealed, setTranslationRevealed] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const evaluationTimerRef = useRef<number | null>(null);

  const content = contentItems[contentIndex];
  const currentUnit = content.units[unitIndex];
  const practiceLocalization = currentUnit.localizations[practiceLanguageId];
  const progressKey = unitProgressKey(content.id, currentUnit.id, practiceLanguageId);
  const persistedStatus = progress.completed[progressKey] ?? "not_started";
  const unitIsComplete = speechState === "passed" || persistedStatus === "passed" || persistedStatus === "skipped";
  const skipAvailable = attempts >= 3;

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
    recognitionRef.current?.abort();
    if (evaluationTimerRef.current !== null) window.clearTimeout(evaluationTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const resetAttempt = useCallback((message = "Listen once, then say the sentence aloud.") => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    if (evaluationTimerRef.current !== null) window.clearTimeout(evaluationTimerRef.current);
    evaluationTimerRef.current = null;
    setSpeechState("idle");
    setAttempts(0);
    setScore(null);
    setTranscript("");
    setFeedback(message);
    setActivePhrase(null);
    setTranslationRevealed(false);
  }, []);

  const selectContent = (index: number) => {
    setContentIndex(index);
    setUnitIndex(0);
    setLessonFinished(false);
    resetAttempt();
  };

  const selectPracticeLanguage = (languageId: LanguageId) => {
    setPracticeLanguageId(languageId);
    setProgress((current) => ({
      ...current,
      displayLanguageIds: current.displayLanguageIds.includes(languageId)
        ? current.displayLanguageIds
        : [languageId, ...current.displayLanguageIds],
    }));
    setLessonFinished(false);
    resetAttempt(`Now practicing ${languages[languageId].nameEnglish}. Listen once, then speak.`);
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

  const playText = (text: string, languageId: LanguageId, rate = 1) => {
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
  };

  const finishEvaluation = (recognizedText: string) => {
    const nextScore = scoreTranscript(practiceLocalization.text, recognizedText);
    const passed = nextScore >= thresholds[strictness];
    setTranscript(recognizedText);
    setScore(nextScore);
    setAttempts((value) => value + 1);
    setSpeechState(passed ? "passed" : "failed");
    if (passed) {
      setFeedback("Nice work. The next sentence is unlocked.");
      setCompletion("passed", 10);
    } else {
      setFeedback("Try again after listening to the sentence slowly.");
    }
  };

  const startSpeaking = () => {
    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechState("error");
      setFeedback("Live speech recognition is not available here. You can still preview a successful result.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = languages[practiceLanguageId].locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setSpeechState("recording");
      setFeedback("Listening now. Speak the full sentence.");
    };
    recognition.onresult = (event) => {
      const recognizedText = event.results[0]?.[0]?.transcript ?? "";
      setSpeechState("evaluating");
      setFeedback("Comparing what the browser heard with the sample sentence.");
      evaluationTimerRef.current = window.setTimeout(() => finishEvaluation(recognizedText), reduceMotion ? 0 : 520);
    };
    recognition.onerror = (event) => {
      setSpeechState("error");
      setFeedback(event.error === "not-allowed"
        ? "Microphone access was blocked. Allow it in your browser settings and try again."
        : "The browser could not assess that attempt. It has not been counted.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setSpeechState((current) => current === "recording" ? "error" : current);
      setFeedback((current) => current === "Listening now. Speak the full sentence."
        ? "No speech was detected. Try again when you are ready."
        : current);
    };

    recognitionRef.current = recognition;
    setSpeechState("requesting_permission");
    setFeedback("Requesting microphone access. Your audio is handled by the browser for this demo.");
    try {
      recognition.start();
    } catch {
      setSpeechState("error");
      setFeedback("The microphone could not start. Wait a moment and try again.");
    }
  };

  const previewPass = () => {
    setSpeechState("passed");
    setScore(88);
    setTranscript("Sample browser transcript");
    setAttempts((value) => value + 1);
    setFeedback("Demo result previewed. The next sentence is unlocked.");
    setCompletion("passed", 10);
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
      if (selected && (current.displayLanguageIds.length === 1 || languageId === practiceLanguageId)) return current;
      return {
        ...current,
        displayLanguageIds: selected
          ? current.displayLanguageIds.filter((candidate) => candidate !== languageId)
          : [...current.displayLanguageIds, languageId],
      };
    });
  };

  const moveDisplayLanguage = (languageId: LanguageId, direction: -1 | 1) => {
    setProgress((current) => {
      const index = current.displayLanguageIds.indexOf(languageId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.displayLanguageIds.length) return current;
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
            <label htmlFor="practice-language">I want to practice</label>
            <select
              id="practice-language"
              value={practiceLanguageId}
              onChange={(event) => selectPracticeLanguage(event.target.value as LanguageId)}
            >
              {languageIds.filter((id) => id !== "en").map((id) => (
                <option key={id} value={id}>{languages[id].nameEnglish} ({languages[id].nameNative})</option>
              ))}
            </select>
            {languages[practiceLanguageId].toneSensitive ? (
              <p><WarningCircle size={16} weight="fill" aria-hidden="true" /> Tone scoring needs a speech provider in the scaled version.</p>
            ) : null}
          </div>

          <details className={styles.displaySettings}>
            <summary><ArrowsDownUp size={18} aria-hidden="true" /> Display languages</summary>
            <div className={styles.settingsBody}>
              {languageIds.map((languageId) => {
                const selected = progress.displayLanguageIds.includes(languageId);
                const selectedIndex = progress.displayLanguageIds.indexOf(languageId);
                return (
                  <div className={styles.languageSetting} key={languageId}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={selected && (progress.displayLanguageIds.length === 1 || languageId === practiceLanguageId)}
                        onChange={() => toggleDisplayLanguage(languageId)}
                      />
                      <span>{languages[languageId].nameEnglish}</span>
                    </label>
                    {selected ? (
                      <span className={styles.orderButtons}>
                        <button type="button" aria-label={`Move ${languages[languageId].nameEnglish} up`} disabled={selectedIndex === 0} onClick={() => moveDisplayLanguage(languageId, -1)}><CaretUp size={15} weight="bold" /></button>
                        <button type="button" aria-label={`Move ${languages[languageId].nameEnglish} down`} disabled={selectedIndex === progress.displayLanguageIds.length - 1} onClick={() => moveDisplayLanguage(languageId, 1)}><CaretDown size={15} weight="bold" /></button>
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

                <section className={styles.reader} aria-label="Multilingual sentence reader">
                  {progress.displayLanguageIds.map((languageId) => {
                    const localization = currentUnit.localizations[languageId];
                    const isPracticeLanguage = languageId === practiceLanguageId;
                    return (
                      <article className={isPracticeLanguage ? styles.practiceBlock : ""} key={languageId} lang={languages[languageId].locale}>
                        <header>
                          <div>
                            <span>{languages[languageId].nameNative}</span>
                            <small>{languages[languageId].nameEnglish}{isPracticeLanguage ? " practice" : ""}</small>
                          </div>
                          <button type="button" aria-label={`Play ${languages[languageId].nameEnglish} sentence`} onClick={() => playText(localization.text, languageId)}>
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
                      </article>
                    );
                  })}
                </section>

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
                        <button type="button" onClick={() => playText(activePhrase.phrase.text, activePhrase.languageId)}><SpeakerHigh size={18} weight="fill" /> Play</button>
                        <button type="button" aria-pressed={progress.savedPhraseIds.includes(activePhrase.phrase.id)} onClick={() => toggleSavedPhrase(activePhrase.phrase.id)}>
                          <BookmarkSimple size={18} weight={progress.savedPhraseIds.includes(activePhrase.phrase.id) ? "fill" : "regular"} />
                          {progress.savedPhraseIds.includes(activePhrase.phrase.id) ? "Saved" : "Save"}
                        </button>
                        <button type="button" aria-expanded={translationRevealed} onClick={() => setTranslationRevealed((value) => !value)}><Translate size={18} /> {translationRevealed ? "Hide meaning" : "Show meaning"}</button>
                      </div>
                      {translationRevealed ? <p>{activePhrase.phrase.translation}</p> : null}
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
                    <button type="button" onClick={() => playText(practiceLocalization.text, practiceLanguageId)}><SpeakerHigh size={20} weight="fill" /> Listen</button>
                    <button type="button" onClick={() => playText(practiceLocalization.text, practiceLanguageId, 0.72)}><SpeakerHigh size={20} /> Slow</button>
                  </div>

                  <div className={styles.speechActionRow}>
                    <button
                      className={`${styles.speakButton} ${speechState === "recording" ? styles.speakButtonRecording : ""}`}
                      type="button"
                      disabled={speechState === "recording" || speechState === "evaluating" || speechState === "requesting_permission"}
                      onClick={startSpeaking}
                    >
                      {speechIcon}
                      <span>{speechState === "recording" ? "Listening" : speechState === "evaluating" ? "Checking" : "Start speaking"}</span>
                    </button>

                    <div className={styles.result} aria-live="polite">
                      {speechState === "passed" ? <CheckCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      {speechState === "failed" ? <XCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      {speechState === "error" ? <WarningCircle size={30} weight="fill" aria-hidden="true" /> : null}
                      <span>
                        {score !== null ? <strong>{score}</strong> : <strong>{attempts}</strong>}
                        <small>{score !== null ? "demo score" : attempts === 1 ? "attempt" : "attempts"}</small>
                      </span>
                    </div>
                  </div>

                  {transcript ? <p className={styles.transcript}>Browser heard: <q>{transcript}</q></p> : null}

                  <div className={styles.speechFooter}>
                    <p>Prototype score only. Audio is not stored by this site.</p>
                    <div>
                      {speechState === "error" ? <button type="button" onClick={previewPass}>Preview a pass</button> : null}
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
