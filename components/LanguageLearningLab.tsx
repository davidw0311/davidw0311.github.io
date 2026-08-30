"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle,
  Microphone,
  NumberCircleOne,
  Plus,
  SpeakerHigh,
  SpinnerGap,
  TextAa,
  Translate,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import {
  AnimatePresence,
  motion,
  Reorder,
  useReducedMotion,
} from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  contentItems,
  contentItemsForPracticeLanguage,
  languageIds,
  languages,
  unitProgressKey,
  type ContentItem,
  type CurriculumSectionId,
  type LanguageId,
  type PhraseSegment,
  type PronunciationMode,
} from "@/data/languageLearning";
import {
  formatUi,
  languageLearningUi,
  type LanguageLearningUiCopy,
} from "@/data/languageLearningUi";
import {
  addSupportLanguage as withAddedSupportLanguage,
  removeSupportLanguage as withRemovedSupportLanguage,
  reorderSupportLanguages as withReorderedSupportLanguages,
  selectPracticeLanguage as withPracticeLanguage,
  setPronunciationPreference as withPronunciationPreference,
  toggleSavedStudyItem as withToggledSavedStudyItem,
  toggleSupportLanguage as withToggledSupportLanguage,
} from "@/data/languageProgress";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useLanguageAudioPlayback } from "@/hooks/useLanguageAudioPlayback";
import { usePersistentLanguageProgress } from "@/hooks/usePersistentLanguageProgress";
import { usePronunciationAssessment } from "@/hooks/usePronunciationAssessment";
import { requestMicrophoneAccess } from "@/lib/browserAudioRecorder";
import { sentenceAudioPath, type SentenceAudioSpeed } from "@/lib/languageAudio";
import {
  PhraseStudyPanel,
  type ActivePhrase,
} from "./language-lab/PhraseStudyPanel";
import { LearningLanguageSelection } from "./language-lab/LearningLanguageSelection";
import { LessonFlowProgress } from "./language-lab/LessonFlowProgress";
import { LessonLanguageSetup } from "./language-lab/LessonLanguageSetup";
import { SupportLanguageCard } from "./language-lab/SupportLanguageCard";
import styles from "./LanguageLearningLab.module.css";

const pronunciationApiUrl = process.env.NEXT_PUBLIC_PRONUNCIATION_API_URL?.trim();

type LanguageLearningLabProps = {
  onSystemLanguageChange?: (languageId: LanguageId) => void;
};

type LanguageLabScreen = "language" | "library" | "setup" | "lesson";

const curriculumSectionOrder: readonly CurriculumSectionId[] = [
  "shared",
  "ja-hiragana",
  "ja-hiragana-variants",
  "ja-hiragana-words",
  "ja-katakana",
  "ja-katakana-variants",
  "ja-katakana-words",
  "ko-jamo",
  "ko-blocks",
  "ko-words",
];

function localizedContentText(content: ContentItem, ui: LanguageLearningUiCopy) {
  if (content.type === "script_drill") {
    return { title: content.title, description: ui.scriptLessonHelp };
  }
  return ui.content[content.id] ?? { title: content.title, description: content.description };
}

function curriculumSectionTitle(sectionId: CurriculumSectionId, ui: LanguageLearningUiCopy) {
  if (sectionId === "shared") return ui.everydayLessons;
  if (sectionId === "ja-hiragana") return ui.hiragana;
  if (sectionId === "ja-hiragana-variants") return ui.hiraganaVariants;
  if (sectionId === "ja-hiragana-words") return ui.hiraganaWords;
  if (sectionId === "ja-katakana") return ui.katakana;
  if (sectionId === "ja-katakana-variants") return ui.katakanaVariants;
  if (sectionId === "ja-katakana-words") return ui.katakanaWords;
  if (sectionId === "ko-jamo") return ui.hangulLetters;
  if (sectionId === "ko-blocks") return ui.syllableBlocks;
  return ui.commonWords;
}

function contentTypeLabel(content: ContentItem, ui: LanguageLearningUiCopy) {
  if (content.type === "story") return ui.story;
  if (content.type === "number_drill") return ui.counting;
  return ui.scriptPractice;
}

export function LanguageLearningLab({ onSystemLanguageChange }: LanguageLearningLabProps = {}) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = usePersistentLanguageProgress();
  const [contentIndex, setContentIndex] = useState(0);
  const [unitIndex, setUnitIndex] = useState(0);
  const [activePhrase, setActivePhrase] = useState<ActivePhrase | null>(null);
  const [lessonFinished, setLessonFinished] = useState(false);
  const [lessonLanguagePickerOpen, setLessonLanguagePickerOpen] = useState(false);
  const [systemLanguagePickerOpen, setSystemLanguagePickerOpen] = useState(false);
  const [screen, setScreen] = useState<LanguageLabScreen>("language");
  const [lessonStarting, setLessonStarting] = useState(false);
  const [lessonEntryError, setLessonEntryError] = useState("");
  const [audioFeedback, setAudioFeedback] = useState("");
  const microphoneReadyRef = useRef(false);

  const practiceLanguageId = progress.practiceLanguageId;
  const systemLanguageId = progress.systemLanguageId;
  const ui = languageLearningUi[systemLanguageId];
  const supportLanguageId = progress.supportLanguageId;
  const content = contentItems[contentIndex];
  const contentText = localizedContentText(content, ui);
  const currentUnit = content.units[unitIndex];
  const practiceLocalization = currentUnit.localizations[practiceLanguageId];
  const progressKey = unitProgressKey(content.id, currentUnit.id, practiceLanguageId);
  const handlePassedAssessment = useCallback(() => {
    setProgress((current) => {
      const existing = current.completed[progressKey];
      const alreadyCompleted = existing === "passed" || existing === "skipped";
      return {
        ...current,
        xp: alreadyCompleted ? current.xp : current.xp + 10,
        completed: { ...current.completed, [progressKey]: "passed" },
      };
    });
  }, [progressKey, setProgress]);
  const handleAudioUnavailable = useCallback(() => {
    setAudioFeedback(ui.audioUnavailable);
  }, [ui.audioUnavailable]);
  const {
    playingSampleId,
    playSample,
    stopPlayback,
  } = useLanguageAudioPlayback(handleAudioUnavailable);
  const {
    attempts,
    beginSpeaking,
    feedback,
    readingFocusActive,
    releaseSpeaking,
    resetAttempt: resetSpeechAttempt,
    score,
    speechState,
    transcript,
  } = usePronunciationAssessment({
    apiUrl: pronunciationApiUrl,
    practiceLanguageId,
    referenceText: practiceLanguageId === "zht"
      ? currentUnit.localizations.zh.text
      : practiceLocalization.text,
    ui,
    onBeforeRecord: stopPlayback,
    onPassed: handlePassedAssessment,
  });
  const persistedStatus = progress.completed[progressKey] ?? "not_started";
  const unitIsComplete = speechState === "passed" || persistedStatus === "passed" || persistedStatus === "skipped";
  const supportLanguageIds = progress.displayLanguageIds.filter((languageId) => languageId !== practiceLanguageId);
  const availableContentItems = useMemo(
    () => contentItemsForPracticeLanguage(practiceLanguageId),
    [practiceLanguageId],
  );
  const nextContentItem = useMemo(() => {
    const currentIndex = availableContentItems.findIndex((item) => item.id === content.id);
    return currentIndex >= 0 ? availableContentItems[currentIndex + 1] : undefined;
  }, [availableContentItems, content.id]);
  const availableContentSections = useMemo(() => curriculumSectionOrder.flatMap((sectionId) => {
    const items = availableContentItems.filter((item) => (item.sectionId ?? "shared") === sectionId);
    return items.length > 0 ? [{ sectionId, items }] : [];
  }), [availableContentItems]);
  const lessonOpen = screen === "lesson";
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
    const previousLanguage = document.documentElement.lang;
    document.documentElement.lang = languages[systemLanguageId].locale;
    onSystemLanguageChange?.(systemLanguageId);
    return () => {
      document.documentElement.lang = previousLanguage;
    };
  }, [onSystemLanguageChange, systemLanguageId]);

  const resetAttempt = useCallback((message = "") => {
    stopPlayback();
    resetSpeechAttempt(message);
    setActivePhrase(null);
    setAudioFeedback("");
  }, [resetSpeechAttempt, stopPlayback]);

  const closeLanguagePickers = useCallback(() => {
    setLessonLanguagePickerOpen(false);
    setSystemLanguagePickerOpen(false);
  }, []);
  useEscapeKey(
    lessonLanguagePickerOpen || systemLanguagePickerOpen,
    closeLanguagePickers,
  );
  useBodyScrollLock(lessonOpen);

  const selectContent = (index: number) => {
    setContentIndex(index);
    setUnitIndex(0);
    setLessonFinished(false);
    resetAttempt();
  };

  const chooseLesson = (index: number) => {
    setSystemLanguagePickerOpen(false);
    setLessonEntryError("");
    selectContent(index);
    setScreen("setup");
  };

  const showLessonLibrary = () => {
    closeLanguagePickers();
    setLessonEntryError("");
    setScreen("library");
  };

  const showLanguageSelection = () => {
    closeLanguagePickers();
    setLessonEntryError("");
    setScreen("language");
  };

  const startLesson = async () => {
    if (lessonStarting) return;
    setLessonStarting(true);
    setLessonEntryError("");
    try {
      if (!microphoneReadyRef.current) {
        await requestMicrophoneAccess();
        microphoneReadyRef.current = true;
      }
      setLessonLanguagePickerOpen(false);
      setSystemLanguagePickerOpen(false);
      setScreen("lesson");
    } catch (error) {
      setLessonEntryError(error instanceof DOMException && error.name === "NotAllowedError"
        ? ui.microphoneBlocked
        : ui.microphoneError);
    } finally {
      setLessonStarting(false);
    }
  };

  const returnToLibrary = () => {
    showLessonLibrary();
    resetAttempt();
  };

  const startNextLesson = () => {
    if (!nextContentItem) return;
    const nextIndex = contentItems.findIndex((item) => item.id === nextContentItem.id);
    if (nextIndex < 0) return;
    closeLanguagePickers();
    selectContent(nextIndex);
    setScreen("lesson");
  };

  const selectPracticeLanguage = (languageId: LanguageId) => {
    const firstAvailableContent = contentItemsForPracticeLanguage(languageId)[0];
    if (firstAvailableContent) {
      const nextContentIndex = contentItems.findIndex((item) => item.id === firstAvailableContent.id);
      if (nextContentIndex >= 0) setContentIndex(nextContentIndex);
    }
    setProgress((current) => withPracticeLanguage(current, languageId));
    setUnitIndex(0);
    setLessonFinished(false);
    resetAttempt();
  };

  const playSentence = (
    languageId: LanguageId,
    speed: SentenceAudioSpeed = "normal",
  ) => {
    const localization = currentUnit.localizations[languageId];
    const sampleId = `sentence:${content.slug}:${currentUnit.id}:${languageId}:${speed}`;
    setAudioFeedback("");
    playSample({
      sampleId,
      source: content.audioSource === "browser"
        ? undefined
        : sentenceAudioPath(content.slug, currentUnit.id, languageId, speed),
      text: localization.text,
      languageId,
      fallbackRate: speed === "slow" ? 0.72 : 1,
    });
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
    setProgress((current) => withReorderedSupportLanguages(current, orderedLanguageIds));
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
    setProgress((current) => withAddedSupportLanguage(current, languageId));
    setLessonLanguagePickerOpen(false);
  };

  const removeSupportLanguage = (languageId: LanguageId) => {
    setActivePhrase((current) => current?.languageId === languageId ? null : current);
    setProgress((current) => withRemovedSupportLanguage(current, languageId));
  };

  const toggleDisplayLanguage = (languageId: LanguageId) => {
    if (languageId === practiceLanguageId) return;
    setActivePhrase((current) => current?.languageId === languageId ? null : current);
    setProgress((current) => withToggledSupportLanguage(current, languageId));
  };

  const selectSystemLanguage = (languageId: LanguageId) => {
    setProgress((current) => ({ ...current, systemLanguageId: languageId }));
    setSystemLanguagePickerOpen(false);
  };

  const toggleSavedPhrase = (phraseId: string) => {
    setProgress((current) => withToggledSavedStudyItem(current, phraseId));
  };

  const openPhrase = (languageId: LanguageId, phrase: PhraseSegment) => {
    setActivePhrase({ languageId, phrase });
  };

  const setPronunciationMode = (languageId: LanguageId, mode: PronunciationMode) => {
    setProgress((current) => withPronunciationPreference(current, languageId, mode));
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
              <span>{contentTypeLabel(content, ui)}</span>
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
        {screen === "language" ? (
          <LearningLanguageSelection
            practiceLanguageId={practiceLanguageId}
            ui={ui}
            onSelect={selectPracticeLanguage}
            onProceed={showLessonLibrary}
          />
        ) : screen === "library" ? (
          <motion.section
            key="library"
            className={styles.landing}
            aria-labelledby="library-title"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
          >
            <div className={`${styles.setupIntro} ${styles.librarySetupIntro}`}>
              <button type="button" className={styles.setupBackButton} onClick={showLanguageSelection}>
                <ArrowLeft size={18} weight="bold" aria-hidden="true" />
                <span>{ui.learningLanguage}</span>
              </button>
              <div className={styles.setupIntroCopy}>
                <span>{languages[practiceLanguageId].nameNative}</span>
                <h1 id="library-title">{ui.chooseLesson}</h1>
                <p>{practiceLanguageId === "ja" || practiceLanguageId === "ko" ? ui.chooseScriptLessonHelp : ui.chooseLessonHelp}</p>
              </div>
              <LessonFlowProgress activeStep="lessons" ui={ui} />
            </div>

            <div className={styles.lessonCatalog} aria-label={ui.availableLessons}>
              {availableContentSections.map(({ sectionId, items }) => {
                const sectionTitle = curriculumSectionTitle(sectionId, ui);
                return (
                  <section className={styles.lessonSection} key={sectionId} aria-labelledby={`lesson-section-${sectionId}`}>
                    <header>
                      <h2 id={`lesson-section-${sectionId}`}>{sectionTitle}</h2>
                      <span>{formatUi(ui.lessonCount, { count: items.length })}</span>
                    </header>
                    <div
                      className={`${styles.lessonCards} ${styles.sectionLessonCards}`}
                      data-count={Math.min(items.length, 3)}
                    >
                      {items.map((item) => {
                        const itemIndex = contentItems.findIndex((candidate) => candidate.id === item.id);
                        const completed = item.units.filter((candidate) => {
                          const status = progress.completed[unitProgressKey(item.id, candidate.id, practiceLanguageId)];
                          return status === "passed" || status === "skipped";
                        }).length;
                        const Icon = item.type === "story"
                          ? BookOpenText
                          : item.type === "number_drill" ? NumberCircleOne : TextAa;
                        const itemText = localizedContentText(item, ui);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-label={formatUi(ui.openLesson, { lesson: itemText.title })}
                            onClick={() => chooseLesson(itemIndex)}
                          >
                            <span className={styles.lessonCardIcon}><Icon size={30} weight="fill" aria-hidden="true" /></span>
                            <span className={styles.lessonCardCopy}>
                              <small>{contentTypeLabel(item, ui)} / {formatUi(ui.minutes, { count: item.estimatedMinutes })}</small>
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
                  </section>
                );
              })}
            </div>
          </motion.section>
        ) : screen === "setup" ? (
          <LessonLanguageSetup
            content={content}
            contentText={contentText}
            practiceLanguageId={practiceLanguageId}
            supportLanguageIds={supportLanguageIds}
            lessonStarting={lessonStarting}
            lessonEntryError={lessonEntryError}
            ui={ui}
            onToggleDisplayLanguage={toggleDisplayLanguage}
            onProceed={() => void startLesson()}
            onBack={showLessonLibrary}
          />
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
                  {nextContentItem ? (
                    <button type="button" className={styles.nextLessonButton} onClick={startNextLesson}>
                      {ui.nextLesson} <ArrowRight size={18} weight="bold" aria-hidden="true" />
                    </button>
                  ) : null}
                  <button type="button" onClick={() => { setLessonFinished(false); goToUnit(0); }}>{ui.practiceAgain}</button>
                  <button
                    type="button"
                    className={!nextContentItem ? styles.nextLessonButton : undefined}
                    onClick={returnToLibrary}
                  >
                    {ui.chooseAnotherLesson}
                  </button>
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
                      aria-expanded={lessonLanguagePickerOpen}
                      onClick={() => setLessonLanguagePickerOpen((open) => !open)}
                    >
                      <Plus size={15} weight="bold" aria-hidden="true" />
                      <span>{ui.addLanguage}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {lessonLanguagePickerOpen ? (
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
                      <PhraseStudyPanel
                        key={`${activePhrase.languageId}:${activePhrase.phrase.id}`}
                        activePhrase={activePhrase}
                        audioSource={content.audioSource ?? "azure"}
                        contentSlug={content.slug}
                        currentUnit={currentUnit}
                        playingSampleId={playingSampleId}
                        progress={progress}
                        readingFocusActive={readingFocusActive}
                        reduceMotion={Boolean(reduceMotion)}
                        supportLanguageId={supportLanguageId}
                        ui={ui}
                        onClose={() => setActivePhrase(null)}
                        onPlaySample={(options) => {
                          setAudioFeedback("");
                          playSample(options);
                        }}
                        onSetPronunciationMode={setPronunciationMode}
                        onToggleSaved={toggleSavedPhrase}
                      />
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
                    <span className={styles.voiceSource} role={audioFeedback ? "status" : undefined}>
                      {audioFeedback || (content.audioSource === "browser" ? ui.browserVoice : ui.azureVoice)}
                    </span>
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
