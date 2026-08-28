"use client";

import { ShareNetwork, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  pianoLessonShareFileName,
  pianoLessonShareMistakeCount,
  pianoLessonShareText,
  type PianoLessonShareResult,
} from "@/data/pianoLessonShare";
import styles from "./PianoLessonShareButton.module.css";

type ShareStatus = "preparing" | "ready" | "sharing" | "shared" | "downloaded" | "unavailable";
type ShareAsset = { file: File; previewUrl: string };

function roundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawShareKeyboard(context: CanvasRenderingContext2D, y: number) {
  const x = 112;
  const width = 976;
  const height = 92;
  const whiteKeyWidth = width / 10;

  context.save();
  roundedRectangle(context, x, y, width, height, 14);
  context.clip();
  context.fillStyle = "#edf8f5";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#789795";
  context.lineWidth = 2;
  for (let index = 1; index < 10; index += 1) {
    context.beginPath();
    context.moveTo(x + index * whiteKeyWidth, y);
    context.lineTo(x + index * whiteKeyWidth, y + height);
    context.stroke();
  }

  const blackKeyPositions = [1, 2, 4, 5, 6, 8, 9];
  context.fillStyle = "#102a34";
  for (const position of blackKeyPositions) {
    roundedRectangle(
      context,
      x + position * whiteKeyWidth - whiteKeyWidth * 0.29,
      y,
      whiteKeyWidth * 0.58,
      height * 0.62,
      7,
    );
    context.fill();
  }
  context.restore();
}

function drawShareStat(
  context: CanvasRenderingContext2D,
  x: number,
  label: string,
  value: string,
) {
  context.fillStyle = "#789795";
  context.font = "700 22px Arial, sans-serif";
  context.fillText(label.toUpperCase(), x, 564);
  context.fillStyle = "#edf8f5";
  context.font = "700 43px Arial, sans-serif";
  context.fillText(value, x, 620);
}

function drawNoteReport(context: CanvasRenderingContext2D, result: PianoLessonShareResult) {
  const reportTop = 710;
  const rowStart = 808;
  const rowHeight = 52;

  context.fillStyle = "#edf8f5";
  context.font = "700 32px Arial, sans-serif";
  context.fillText("Note report", 112, reportTop);
  context.fillStyle = "#789795";
  context.font = "500 21px Arial, sans-serif";
  context.fillText("Ranked by mistakes, then average recognition time", 112, reportTop + 36);

  context.font = "700 19px Arial, sans-serif";
  context.fillText("RANK", 112, 786);
  context.fillText("NOTE", 210, 786);
  context.textAlign = "right";
  context.fillText("MISTAKES", 720, 786);
  context.fillText("AVG. TIME", 930, 786);
  context.fillText("CARDS", 1088, 786);

  result.noteResults.forEach((note, index) => {
    const y = rowStart + index * rowHeight;
    if (note.mistakes > 0) {
      context.fillStyle = "rgba(255, 157, 151, 0.09)";
      roundedRectangle(context, 96, y - 34, 1008, 47, 9);
      context.fill();
    }

    context.strokeStyle = "rgba(217, 241, 237, 0.14)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(112, y + 18);
    context.lineTo(1088, y + 18);
    context.stroke();

    context.textAlign = "left";
    context.fillStyle = "#789795";
    context.font = "600 23px Arial, sans-serif";
    context.fillText(String(index + 1), 112, y);
    context.fillStyle = note.mistakes > 0 ? "#ffb3ae" : "#edf8f5";
    context.font = "700 25px Arial, sans-serif";
    context.fillText(note.noteName.replace("/", " / "), 210, y);

    context.textAlign = "right";
    context.fillStyle = note.mistakes > 0 ? "#ffb3ae" : "#a9c2c0";
    context.font = "700 23px Arial, sans-serif";
    context.fillText(String(note.mistakes), 720, y);
    context.fillStyle = "#a9c2c0";
    context.fillText(note.averageRecognitionTime, 930, y);
    context.fillText(String(note.attempts), 1088, y);
  });

  context.textAlign = "left";
}

function shareImageHeight(noteCount: number) {
  const keyboardY = Math.max(1120, 850 + noteCount * 52);
  return { height: keyboardY + 190, keyboardY };
}

function createShareImage(result: PianoLessonShareResult) {
  const canvas = document.createElement("canvas");
  const { height, keyboardY } = shareImageHeight(result.noteResults.length);
  canvas.width = 1200;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas is unavailable"));

  context.fillStyle = "#07171f";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(1030, 100, 20, 1030, 100, 620);
  glow.addColorStop(0, "rgba(121, 228, 197, 0.24)");
  glow.addColorStop(1, "rgba(121, 228, 197, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, 700);

  context.fillStyle = "#79e4c5";
  context.font = "800 26px Arial, sans-serif";
  context.fillText("PIANO PARTY", 112, 88);

  context.fillStyle = "#edf8f5";
  context.font = "700 94px Arial, sans-serif";
  context.fillText(`Lesson ${result.lessonId}`, 106, 210);

  context.fillStyle = "#a9c2c0";
  context.font = "500 34px Arial, sans-serif";
  context.fillText(result.lessonTitle, 112, 267, 976);

  context.fillStyle = "#edf8f5";
  context.font = "700 48px Arial, sans-serif";
  context.fillText(`Completed by ${result.playerName}`, 112, 368, 976);

  const perfect = result.correctCount === result.cardCount;
  roundedRectangle(context, 112, 410, perfect ? 300 : 265, 62, 16);
  context.fillStyle = perfect ? "#79e4c5" : "rgba(237, 248, 245, 0.1)";
  context.fill();
  context.fillStyle = perfect ? "#06251e" : "#edf8f5";
  context.font = "800 23px Arial, sans-serif";
  context.fillText(perfect ? "PERFECT RUN" : "LESSON COMPLETE", 140, 451);

  drawShareStat(context, 112, "Time", result.elapsedTime);
  drawShareStat(context, 430, "Score", `${result.correctCount}/${result.cardCount}`);
  drawShareStat(context, 760, "Accuracy", `${result.accuracy}%`);

  context.strokeStyle = "rgba(217, 241, 237, 0.18)";
  context.beginPath();
  context.moveTo(112, 665);
  context.lineTo(1088, 665);
  context.stroke();

  drawNoteReport(context, result);
  drawShareKeyboard(context, keyboardY);

  context.fillStyle = "#789795";
  context.font = "500 20px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("davidw0311.github.io/projects/piano-party", 600, keyboardY + 142);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not create lesson image"));
        return;
      }
      resolve(new File([blob], pianoLessonShareFileName(result.lessonId), { type: "image/png" }));
    }, "image/png");
  });
}

function downloadShareImage(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function PianoLessonShareButton({ result }: { result: PianoLessonShareResult }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [shareAsset, setShareAsset] = useState<ShareAsset | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState<ShareStatus>("preparing");

  useEffect(() => {
    let active = true;
    void createShareImage(result)
      .then((file) => {
        if (!active) return;
        setShareAsset({ file, previewUrl: URL.createObjectURL(file) });
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("unavailable");
      });
    return () => {
      active = false;
    };
  }, [result]);

  useEffect(() => () => {
    if (shareAsset) URL.revokeObjectURL(shareAsset.previewUrl);
  }, [shareAsset]);

  useEffect(() => {
    if (!previewOpen) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      trigger?.focus();
    };
  }, [previewOpen]);

  const handleShare = async () => {
    if (!shareAsset) return;
    const shareData = {
      files: [shareAsset.file],
      title: `Piano Party Lesson ${result.lessonId}`,
      text: pianoLessonShareText(result),
    };

    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        setStatus("sharing");
        await navigator.share(shareData);
        setStatus("shared");
        return;
      }
      downloadShareImage(shareAsset.file);
      setStatus("downloaded");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("ready");
        return;
      }
      downloadShareImage(shareAsset.file);
      setStatus("downloaded");
    }
  };

  const triggerLabel = status === "preparing"
    ? "Preparing image"
    : status === "unavailable"
      ? "Image unavailable"
      : "Preview result";
  const shareLabel = status === "sharing"
    ? "Opening share"
    : status === "shared"
      ? "Shared"
      : status === "downloaded"
        ? "Image saved"
        : "Share image";
  const mistakeCount = pianoLessonShareMistakeCount(result);
  const { height: previewHeight } = shareImageHeight(result.noteResults.length);

  const preview = previewOpen && shareAsset ? createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setPreviewOpen(false);
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-share-preview-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="lesson-share-preview-title">Share card preview</h2>
            <p>Lesson {result.lessonId}, with {mistakeCount} {mistakeCount === 1 ? "mistake" : "mistakes"} in the full note report.</p>
          </div>
          <button
            ref={closeRef}
            className={styles.closeButton}
            type="button"
            onClick={() => setPreviewOpen(false)}
            aria-label="Close share card preview"
          >
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        </header>

        <div className={styles.previewFrame}>
          <Image
            className={styles.previewImage}
            src={shareAsset.previewUrl}
            alt={`Preview of Piano Party Lesson ${result.lessonId} share card with the complete note report`}
            width={1200}
            height={previewHeight}
            unoptimized
          />
        </div>

        <footer className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => setPreviewOpen(false)}>
            Back
          </button>
          <button
            type="button"
            className={styles.shareButton}
            disabled={status === "sharing"}
            onClick={handleShare}
          >
            <ShareNetwork size={18} weight="bold" aria-hidden="true" /> {shareLabel}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={!shareAsset || status === "sharing" || status === "unavailable"}
        onClick={() => setPreviewOpen(true)}
        aria-label={`Preview Piano Party Lesson ${result.lessonId} result image before sharing`}
      >
        <ShareNetwork size={18} weight="bold" aria-hidden="true" /> {triggerLabel}
      </button>
      {preview}
    </>
  );
}
