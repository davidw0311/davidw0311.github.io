"use client";

import { ShareNetwork, X } from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  pianoLessonShareMistakeCount,
  pianoLessonSharePerformanceLabel,
  pianoLessonShareText,
  type PianoLessonShareResult,
} from "@/data/pianoLessonShare";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import {
  createPianoLessonShareImage,
  downloadPianoLessonShareImage,
  pianoLessonShareImageSize,
} from "@/lib/pianoLessonShareImage";
import styles from "./PianoLessonShareButton.module.css";

type ShareStatus = "preparing" | "ready" | "sharing" | "shared" | "downloaded" | "unavailable";
type ShareAsset = { file: File; previewUrl: string };

export function PianoLessonShareButton({ result }: { result: PianoLessonShareResult }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [shareAsset, setShareAsset] = useState<ShareAsset | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [status, setStatus] = useState<ShareStatus>("preparing");

  useEffect(() => {
    let active = true;
    void createPianoLessonShareImage(result)
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
    closeRef.current?.focus();
    return () => trigger?.focus();
  }, [previewOpen]);

  const closePreview = useCallback(() => setPreviewOpen(false), []);
  useBodyScrollLock(previewOpen);
  useEscapeKey(previewOpen, closePreview);

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
      downloadPianoLessonShareImage(shareAsset.file);
      setStatus("downloaded");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("ready");
        return;
      }
      downloadPianoLessonShareImage(shareAsset.file);
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
  const performanceLabel = pianoLessonSharePerformanceLabel(result).toLowerCase();
  const { height: previewHeight } = pianoLessonShareImageSize(result.noteResults.length);

  const preview = previewOpen && shareAsset ? createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePreview();
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
            <p>Lesson {result.lessonId}, with {mistakeCount} {mistakeCount === 1 ? "mistake" : "mistakes"} in the full {performanceLabel} report.</p>
          </div>
          <button
            ref={closeRef}
            className={styles.closeButton}
            type="button"
            onClick={closePreview}
            aria-label="Close share card preview"
          >
            <X size={20} weight="bold" aria-hidden="true" />
          </button>
        </header>

        <div className={styles.previewFrame}>
          <Image
            className={styles.previewImage}
            src={shareAsset.previewUrl}
            alt={`Preview of Piano Party Lesson ${result.lessonId} share card with the complete ${performanceLabel} report`}
            width={1200}
            height={previewHeight}
            unoptimized
          />
        </div>

        <footer className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={closePreview}>
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
