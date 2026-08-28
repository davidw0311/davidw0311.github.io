"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speechLocale, type LanguageId } from "@/data/languageLearning";
import type { LanguageLearningUiCopy } from "@/data/languageLearningUi";
import {
  blobToBase64,
  startAudioRecording,
  type AudioRecording,
} from "@/lib/browserAudioRecorder";

export type SpeechState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "evaluating"
  | "passed"
  | "failed"
  | "error";

export type AssessmentResult = {
  passed: boolean;
  score: number;
  transcript?: string;
  message?: string;
};

type UsePronunciationAssessmentOptions = {
  apiUrl?: string;
  practiceLanguageId: LanguageId;
  referenceText: string;
  ui: LanguageLearningUiCopy;
  onBeforeRecord: () => void;
  onPassed: (result: AssessmentResult) => void;
  maximumRecordingMs?: number;
};

export function usePronunciationAssessment({
  apiUrl,
  practiceLanguageId,
  referenceText,
  ui,
  onBeforeRecord,
  onPassed,
  maximumRecordingMs = 12_000,
}: UsePronunciationAssessmentOptions) {
  const [speechState, setSpeechState] = useState<SpeechState>("idle");
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const recordingRef = useRef<AudioRecording | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const holdActiveRef = useRef(false);
  const requestGenerationRef = useRef(0);
  const assessmentAbortRef = useRef<AbortController | null>(null);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const disposeResources = useCallback(() => {
    holdActiveRef.current = false;
    requestGenerationRef.current += 1;
    assessmentAbortRef.current?.abort();
    assessmentAbortRef.current = null;
    clearRecordingTimer();
    const recording = recordingRef.current;
    recordingRef.current = null;
    void recording?.cancel();
  }, [clearRecordingTimer]);

  useEffect(() => disposeResources, [disposeResources]);

  const resetAttempt = useCallback((message = "") => {
    disposeResources();
    setSpeechState("idle");
    setAttempts(0);
    setScore(null);
    setTranscript("");
    setFeedback(message);
  }, [disposeResources]);

  const finishEvaluation = useCallback((result: AssessmentResult) => {
    setTranscript(result.transcript ?? "");
    setScore(Math.round(result.score));
    setAttempts((value) => value + 1);
    setSpeechState(result.passed ? "passed" : "failed");
    setFeedback(result.passed ? ui.passedFeedback : ui.retryFeedback);
    if (result.passed) onPassed(result);
  }, [onPassed, ui.passedFeedback, ui.retryFeedback]);

  const evaluateRecording = useCallback(async (
    recording: AudioRecording,
    generation: number,
  ) => {
    holdActiveRef.current = false;
    clearRecordingTimer();
    if (recordingRef.current === recording) recordingRef.current = null;
    if (generation !== requestGenerationRef.current) {
      await recording.cancel();
      return;
    }

    setSpeechState("evaluating");
    setFeedback(ui.sendingRecording);
    const abortController = new AbortController();
    assessmentAbortRef.current?.abort();
    assessmentAbortRef.current = abortController;

    try {
      const audio = await recording.stop();
      if (generation !== requestGenerationRef.current) return;
      if (audio.size < 1_600) throw new Error("no-audio");
      if (!apiUrl) throw new Error("not-configured");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: await blobToBase64(audio),
          locale: speechLocale(practiceLanguageId),
          referenceText,
          strictness: "normal",
        }),
        signal: abortController.signal,
      });
      const result = await response.json().catch(() => null) as (AssessmentResult & { error?: string }) | null;

      if (generation !== requestGenerationRef.current) return;
      if (!response.ok || !result || typeof result.score !== "number") {
        throw new Error(result?.error ?? `assessment-${response.status}`);
      }
      finishEvaluation(result);
    } catch (error) {
      if (abortController.signal.aborted || generation !== requestGenerationRef.current) return;
      setSpeechState("error");
      setFeedback(error instanceof Error && error.message === "no-audio"
        ? ui.recordingTooShort
        : error instanceof Error && error.message === "not-configured"
          ? ui.assessmentNotConfigured
          : ui.assessmentError);
    } finally {
      if (assessmentAbortRef.current === abortController) assessmentAbortRef.current = null;
    }
  }, [apiUrl, clearRecordingTimer, finishEvaluation, practiceLanguageId, referenceText, ui]);

  const startSpeaking = useCallback(async (generation: number) => {
    if (!apiUrl) {
      holdActiveRef.current = false;
      setSpeechState("error");
      setFeedback(ui.assessmentNotConfigured);
      return;
    }

    setSpeechState("requesting_permission");
    setFeedback(ui.startingMicrophone);
    try {
      const recording = await startAudioRecording();
      if (generation !== requestGenerationRef.current) {
        await recording.cancel();
        return;
      }
      recordingRef.current = recording;
      if (!holdActiveRef.current) {
        void evaluateRecording(recording, generation);
        return;
      }
      setSpeechState("recording");
      setFeedback(ui.listeningNow);
      recordingTimerRef.current = window.setTimeout(
        () => void evaluateRecording(recording, generation),
        maximumRecordingMs,
      );
    } catch (error) {
      if (generation !== requestGenerationRef.current) return;
      holdActiveRef.current = false;
      setSpeechState("error");
      setFeedback(error instanceof DOMException && error.name === "NotAllowedError"
        ? ui.microphoneBlocked
        : ui.microphoneError);
    }
  }, [apiUrl, evaluateRecording, maximumRecordingMs, ui]);

  const beginSpeaking = useCallback(() => {
    if (
      holdActiveRef.current
      || speechState === "requesting_permission"
      || speechState === "recording"
      || speechState === "evaluating"
    ) return;

    holdActiveRef.current = true;
    requestGenerationRef.current += 1;
    const generation = requestGenerationRef.current;
    onBeforeRecord();
    void startSpeaking(generation);
  }, [onBeforeRecord, speechState, startSpeaking]);

  const releaseSpeaking = useCallback(() => {
    if (!holdActiveRef.current) return;
    holdActiveRef.current = false;
    const recording = recordingRef.current;
    if (recording) void evaluateRecording(recording, requestGenerationRef.current);
  }, [evaluateRecording]);

  return {
    attempts,
    beginSpeaking,
    feedback,
    readingFocusActive: speechState === "requesting_permission" || speechState === "recording",
    releaseSpeaking,
    resetAttempt,
    score,
    speechState,
    transcript,
  };
}
