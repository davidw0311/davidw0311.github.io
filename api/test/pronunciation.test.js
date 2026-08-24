const assert = require("node:assert/strict");
const test = require("node:test");
const { normalizeAzureResult, parseAssessmentRequest, pronunciationHeader } = require("../src/pronunciation.js");

function wavBase64(byteLength = 2_000) {
  const bytes = Buffer.alloc(byteLength);
  bytes.write("RIFF", 0, "ascii");
  bytes.write("WAVE", 8, "ascii");
  return bytes.toString("base64");
}

test("accepts a bounded WAV request", () => {
  const result = parseAssessmentRequest({
    audioBase64: wavBase64(),
    locale: "ja-JP",
    referenceText: "こんにちは",
    strictness: "normal",
  });
  assert.equal(result.audio.length, 2_000);
  assert.equal(result.locale, "ja-JP");
});

test("rejects unsupported locales and non-WAV payloads", () => {
  assert.throws(() => parseAssessmentRequest({
    audioBase64: wavBase64(), locale: "xx-XX", referenceText: "hello", strictness: "normal",
  }), /unsupported-locale/);
  assert.throws(() => parseAssessmentRequest({
    audioBase64: Buffer.alloc(2_000).toString("base64"), locale: "en-US", referenceText: "hello", strictness: "normal",
  }), /invalid-audio/);
});

test("encodes the documented assessment options", () => {
  const decoded = JSON.parse(Buffer.from(pronunciationHeader("hola"), "base64").toString("utf8"));
  assert.equal(decoded.ReferenceText, "hola");
  assert.equal(decoded.GradingSystem, "HundredMark");
  assert.equal(decoded.Granularity, "Word");
  assert.equal(decoded.EnableMiscue, "True");
});

test("normalizes Azure scores against the selected strictness", () => {
  const result = normalizeAzureResult({
    NBest: [{
      Display: "こんにちは",
      PronunciationAssessment: { PronScore: 78, AccuracyScore: 80, FluencyScore: 76, CompletenessScore: 100 },
      Words: [],
    }],
  }, "normal");
  assert.equal(result.score, 78);
  assert.equal(result.passed, true);
  assert.equal(result.transcript, "こんにちは");
});

test("normalizes the flat score shape returned by the short-audio REST API", () => {
  const result = normalizeAzureResult({
    NBest: [{
      Display: "Hola.",
      PronScore: 71.4,
      AccuracyScore: 73,
      FluencyScore: 69,
      CompletenessScore: 100,
      Words: [{ Word: "hola", AccuracyScore: 73, ErrorType: "None" }],
    }],
  }, "normal");
  assert.equal(result.score, 71);
  assert.equal(result.passed, false);
  assert.deepEqual(result.words[0], { word: "hola", accuracyScore: 73, errorType: "None" });
});
