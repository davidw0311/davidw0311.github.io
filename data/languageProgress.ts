import {
  defaultLocalProgress,
  ensureLearningLanguages,
  languageIds,
  preferredSupportLanguage,
  type CompletionStatus,
  type LanguageId,
  type LocalProgress,
  type PronunciationMode,
} from "./languageLearning.ts";

export const languageProgressStorageKey = "dyw-language-lab-progress-v1";

const completionStatuses = new Set<CompletionStatus>([
  "not_started",
  "passed",
  "skipped",
]);

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && languageIds.includes(value as LanguageId);
}

function isPronunciationMode(value: unknown): value is PronunciationMode {
  return value === "off" || value === "native" || value === "english";
}

function parseCompleted(value: unknown): Record<string, CompletionStatus> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, CompletionStatus] => completionStatuses.has(entry[1] as CompletionStatus),
    ),
  );
}

export function parseLanguageProgress(value: string | null): LocalProgress {
  if (!value) return defaultLocalProgress;

  try {
    const parsed = JSON.parse(value) as Partial<LocalProgress>;
    const practiceLanguageId = isLanguageId(parsed.practiceLanguageId)
      ? parsed.practiceLanguageId
      : defaultLocalProgress.practiceLanguageId;
    const storedSupportLanguageId = preferredSupportLanguage(
      practiceLanguageId,
      isLanguageId(parsed.supportLanguageId)
        ? parsed.supportLanguageId
        : defaultLocalProgress.supportLanguageId,
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
      xp: typeof parsed.xp === "number" && Number.isFinite(parsed.xp) && parsed.xp >= 0
        ? parsed.xp
        : 0,
      completed: parseCompleted(parsed.completed),
      savedPhraseIds: Array.isArray(parsed.savedPhraseIds)
        ? Array.from(new Set(parsed.savedPhraseIds.filter((id): id is string => typeof id === "string")))
        : [],
      systemLanguageId: isLanguageId(parsed.systemLanguageId)
        ? parsed.systemLanguageId
        : defaultLocalProgress.systemLanguageId,
      practiceLanguageId,
      supportLanguageId,
      displayLanguageIds: [...supportingLanguageIds, practiceLanguageId],
      showRomanization: typeof parsed.showRomanization === "boolean"
        ? parsed.showRomanization
        : defaultLocalProgress.showRomanization,
      pronunciationModes,
    };
  } catch {
    return defaultLocalProgress;
  }
}

export function selectPracticeLanguage(
  progress: LocalProgress,
  practiceLanguageId: LanguageId,
): LocalProgress {
  const supportLanguageId = preferredSupportLanguage(practiceLanguageId, progress.supportLanguageId);
  return {
    ...progress,
    practiceLanguageId,
    supportLanguageId,
    displayLanguageIds: ensureLearningLanguages(
      progress.displayLanguageIds,
      practiceLanguageId,
      supportLanguageId,
    ),
  };
}

export function reorderSupportLanguages(
  progress: LocalProgress,
  orderedLanguageIds: readonly LanguageId[],
): LocalProgress {
  const nextSupportingLanguages = Array.from(new Set(orderedLanguageIds)).filter((languageId) => (
    languageId !== progress.practiceLanguageId
    && progress.displayLanguageIds.includes(languageId)
  ));

  return {
    ...progress,
    supportLanguageId: nextSupportingLanguages[0]
      ?? preferredSupportLanguage(progress.practiceLanguageId, progress.supportLanguageId),
    displayLanguageIds: [...nextSupportingLanguages, progress.practiceLanguageId],
  };
}

export function addSupportLanguage(
  progress: LocalProgress,
  languageId: LanguageId,
): LocalProgress {
  if (languageId === progress.practiceLanguageId || progress.displayLanguageIds.includes(languageId)) {
    return progress;
  }

  const supportingLanguageIds = progress.displayLanguageIds.filter(
    (candidate) => candidate !== progress.practiceLanguageId,
  );
  return {
    ...progress,
    supportLanguageId: supportingLanguageIds[0] ?? languageId,
    displayLanguageIds: [...supportingLanguageIds, languageId, progress.practiceLanguageId],
  };
}

export function removeSupportLanguage(
  progress: LocalProgress,
  languageId: LanguageId,
): LocalProgress {
  const supportingLanguageIds = progress.displayLanguageIds.filter(
    (candidate) => candidate !== progress.practiceLanguageId,
  );
  const nextSupportingLanguageIds = supportingLanguageIds.filter(
    (candidate) => candidate !== languageId,
  );
  if (nextSupportingLanguageIds.length === supportingLanguageIds.length) return progress;

  return {
    ...progress,
    supportLanguageId: nextSupportingLanguageIds[0]
      ?? preferredSupportLanguage(progress.practiceLanguageId, progress.supportLanguageId),
    displayLanguageIds: [...nextSupportingLanguageIds, progress.practiceLanguageId],
  };
}

export function toggleSavedStudyItem(progress: LocalProgress, itemId: string): LocalProgress {
  return {
    ...progress,
    savedPhraseIds: progress.savedPhraseIds.includes(itemId)
      ? progress.savedPhraseIds.filter((id) => id !== itemId)
      : [...progress.savedPhraseIds, itemId],
  };
}

export function setPronunciationPreference(
  progress: LocalProgress,
  languageId: LanguageId,
  mode: PronunciationMode,
): LocalProgress {
  return {
    ...progress,
    pronunciationModes: { ...progress.pronunciationModes, [languageId]: mode },
  };
}
