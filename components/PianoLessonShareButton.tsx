"use client";

import { ShareNetwork } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  pianoLessonShareFileName,
  pianoLessonShareText,
  type PianoLessonShareResult,
} from "@/data/pianoLessonShare";

type ShareStatus = "preparing" | "ready" | "sharing" | "shared" | "downloaded";

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

function drawShareKeyboard(context: CanvasRenderingContext2D) {
  const x = 112;
  const y = 925;
  const width = 976;
  const height = 150;
  const whiteKeyWidth = width / 10;

  context.save();
  roundedRectangle(context, x, y, width, height, 18);
  context.clip();
  context.fillStyle = "#edf8f5";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#789795";
  context.lineWidth = 3;
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
      8,
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
  context.font = "700 24px Arial, sans-serif";
  context.fillText(label.toUpperCase(), x, 803);
  context.fillStyle = "#edf8f5";
  context.font = "700 46px Arial, sans-serif";
  context.fillText(value, x, 862);
}

function createShareImage(result: PianoLessonShareResult) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas is unavailable"));

  context.fillStyle = "#07171f";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(1030, 100, 20, 1030, 100, 620);
  glow.addColorStop(0, "rgba(121, 228, 197, 0.24)");
  glow.addColorStop(1, "rgba(121, 228, 197, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#79e4c5";
  context.font = "800 28px Arial, sans-serif";
  context.fillText("PIANO PARTY", 112, 120);

  context.fillStyle = "#edf8f5";
  context.font = "700 116px Arial, sans-serif";
  context.fillText(`Lesson ${result.lessonId}`, 104, 280);

  context.fillStyle = "#a9c2c0";
  context.font = "500 42px Arial, sans-serif";
  context.fillText(result.lessonTitle, 112, 352, 976);

  context.fillStyle = "#edf8f5";
  context.font = "700 62px Arial, sans-serif";
  context.fillText(`Completed by ${result.playerName}`, 112, 520, 976);

  const perfect = result.correctCount === result.cardCount;
  roundedRectangle(context, 112, 590, perfect ? 330 : 285, 72, 18);
  context.fillStyle = perfect ? "#79e4c5" : "rgba(237, 248, 245, 0.1)";
  context.fill();
  context.fillStyle = perfect ? "#06251e" : "#edf8f5";
  context.font = "800 26px Arial, sans-serif";
  context.fillText(perfect ? "PERFECT RUN" : "LESSON COMPLETE", 142, 637);

  drawShareStat(context, 112, "Time", result.elapsedTime);
  drawShareStat(context, 430, "Score", `${result.correctCount}/${result.cardCount}`);
  drawShareStat(context, 760, "Accuracy", `${result.accuracy}%`);
  drawShareKeyboard(context);

  context.fillStyle = "#789795";
  context.font = "500 22px Arial, sans-serif";
  context.textAlign = "center";
  context.fillText("davidw0311.github.io/projects/piano-party", 600, 1143);

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
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ShareStatus>("preparing");

  useEffect(() => {
    let active = true;
    void createShareImage(result)
      .then((file) => {
        if (!active) return;
        setShareFile(file);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("ready");
      });
    return () => {
      active = false;
    };
  }, [result]);

  const handleShare = async () => {
    if (!shareFile) return;
    const shareData = {
      files: [shareFile],
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
      downloadShareImage(shareFile);
      setStatus("downloaded");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("ready");
        return;
      }
      downloadShareImage(shareFile);
      setStatus("downloaded");
    }
  };

  const label = status === "preparing"
    ? "Preparing image"
    : status === "sharing"
      ? "Opening share"
      : status === "shared"
        ? "Shared"
        : status === "downloaded"
          ? "Image saved"
          : "Share result";

  return (
    <button
      type="button"
      disabled={!shareFile || status === "sharing"}
      onClick={handleShare}
      aria-label={`Share Piano Party Lesson ${result.lessonId} result as an image`}
    >
      <ShareNetwork size={18} weight="bold" aria-hidden="true" /> {label}
    </button>
  );
}
