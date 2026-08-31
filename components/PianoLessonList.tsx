"use client";

import {
  type MouseEvent,
  type PropsWithChildren,
  useLayoutEffect,
  useRef,
} from "react";
import styles from "@/app/projects/piano-party/piano-party.module.css";

const lessonScrollStorageKey = "piano-party-lesson-list-position";

type SavedLessonPosition = {
  lessonId: string;
  listScrollTop: number;
  pageScrollY: number;
};

function lessonIdFromHash() {
  const match = window.location.hash.match(/^#lesson-(\d+)$/);
  return match?.[1] ?? null;
}

function readSavedPosition(): SavedLessonPosition | null {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(lessonScrollStorageKey) ?? "null");
    if (
      !saved
      || typeof saved.lessonId !== "string"
      || typeof saved.listScrollTop !== "number"
      || typeof saved.pageScrollY !== "number"
    ) return null;
    return saved;
  } catch {
    return null;
  }
}

export function PianoLessonList({ children }: PropsWithChildren) {
  const listRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const hashLessonId = lessonIdFromHash();
    const saved = readSavedPosition();

    if (saved && (!hashLessonId || hashLessonId === saved.lessonId)) {
      list.scrollTop = saved.listScrollTop;
      window.scrollTo({ top: saved.pageScrollY });
      return;
    }

    if (hashLessonId) {
      document.getElementById(`lesson-${hashLessonId}`)?.scrollIntoView({ block: "center" });
    }
  }, []);

  const rememberLessonPosition = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const lessonLink = target.closest<HTMLElement>("[data-piano-lesson-id]");
    const lessonId = lessonLink?.dataset.pianoLessonId;
    if (!lessonId || !listRef.current) return;

    try {
      window.sessionStorage.setItem(lessonScrollStorageKey, JSON.stringify({
        lessonId,
        listScrollTop: listRef.current.scrollTop,
        pageScrollY: window.scrollY,
      } satisfies SavedLessonPosition));
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}#lesson-${lessonId}`,
      );
    } catch {
      // Navigation remains functional when storage or history is restricted.
    }
  };

  return (
    <div className={styles.lessonList} ref={listRef} onClickCapture={rememberLessonPosition}>
      {children}
    </div>
  );
}
