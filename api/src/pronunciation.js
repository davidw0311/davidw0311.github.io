const supportedLocales = new Set([
  "en-US",
  "es-ES",
  "fr-FR",
  "ja-JP",
  "ko-KR",
  "ms-MY",
  "ta-IN",
  "zh-CN",
  "zh-HK",
]);
const passingScores = { relaxed: 62, normal: 74, strict: 86 };

const maximumBase64Length = 1_200_000;
const minimumAudioBytes = 1_600;
const maximumAudioBytes = 900_000;

function parseAssessmentRequest(body) {
  if (!body || typeof body !== "object") throw new Error("invalid-request");

  const { audioBase64, locale, referenceText, strictness = "normal" } = body;
  if (typeof audioBase64 !== "string" || audioBase64.length > maximumBase64Length || !/^[A-Za-z0-9+/]*={0,2}$/.test(audioBase64)) {
    throw new Error("invalid-audio");
  }
  if (!supportedLocales.has(locale)) throw new Error("unsupported-locale");
  if (typeof referenceText !== "string" || referenceText.trim().length === 0 || referenceText.length > 400) {
    throw new Error("invalid-reference");
  }
  if (!Object.hasOwn(passingScores, strictness)) throw new Error("invalid-strictness");

  const audio = Buffer.from(audioBase64, "base64");
  if (audio.length < minimumAudioBytes || audio.length > maximumAudioBytes) throw new Error("invalid-audio");
  if (audio.toString("ascii", 0, 4) !== "RIFF" || audio.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("invalid-audio");
  }

  return { audio, locale, referenceText: referenceText.trim(), strictness };
}

function pronunciationHeader(referenceText) {
  return Buffer.from(JSON.stringify({
    ReferenceText: referenceText,
    GradingSystem: "HundredMark",
    Granularity: "Word",
    Dimension: "Comprehensive",
    EnableMiscue: "True",
  })).toString("base64");
}

function normalizeAzureResult(payload, strictness) {
  const best = payload?.NBest?.[0];
  const assessment = best?.PronunciationAssessment ?? best;
  const rawScore = assessment?.PronScore ?? assessment?.AccuracyScore;
  if (typeof rawScore !== "number") throw new Error("unscored-response");

  const score = Math.round(rawScore);
  const passed = score >= passingScores[strictness];
  const words = Array.isArray(best.Words) ? best.Words.slice(0, 40).map((entry) => {
    const wordAssessment = entry.PronunciationAssessment ?? entry;
    return {
      word: entry.Word,
      accuracyScore: wordAssessment.AccuracyScore,
      errorType: wordAssessment.ErrorType,
    };
  }) : [];

  return {
    passed,
    score,
    accuracyScore: assessment.AccuracyScore,
    fluencyScore: assessment.FluencyScore,
    completenessScore: assessment.CompletenessScore,
    prosodyScore: assessment.ProsodyScore,
    transcript: best.Display ?? payload.DisplayText ?? "",
    message: passed
      ? "Nice work. The next sentence is unlocked."
      : score < 55
        ? "Listen once more, then try the full sentence slowly."
        : "Very close. Try once more with a steady rhythm.",
    words,
  };
}

module.exports = {
  normalizeAzureResult,
  parseAssessmentRequest,
  passingScores,
  pronunciationHeader,
  supportedLocales,
};
