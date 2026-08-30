import {
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import {
  pianoLessonGroups,
  type PianoLessonExerciseMode,
} from "@/data/pianoLessons";
import styles from "../piano-party.module.css";

export const metadata: Metadata = {
  title: "Lessons | Piano Party",
  description: "Build piano note-reading and chord skills through focused, timed lessons.",
  alternates: { canonical: "/projects/piano-party/lessons/" },
};

const exerciseLabels = {
  "key-name": "Key to note",
  "staff-name": "Staff to note",
  "staff-key": "Staff to key",
  "chord-key": "Name to chord",
  "chord-name": "Chord to name",
  "chord-mixed": "Mixed chord review",
} as const satisfies Record<PianoLessonExerciseMode, string>;

export default function PianoLessonsPage() {
  return (
    <main className={`${styles.page} ${styles.menuPage}`}>
      <nav className={styles.nav} aria-label="Piano Party lessons navigation">
        <Link href="/projects/piano-party/"><ArrowLeft size={18} weight="bold" /> Piano Party</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.lessonLibrary} aria-labelledby="lessons-title">
        <header className={styles.libraryHeader}>
          <p>Guided path</p>
          <h1 id="lessons-title">Lessons.</h1>
          <strong>Short, focused sessions that build piano-reading and chord skills one step at a time.</strong>
        </header>

        <div className={styles.lessonList}>
          {pianoLessonGroups.map((group) => (
            <section
              className={styles.lessonGroup}
              aria-labelledby={`lesson-group-${group.id}`}
              key={group.id}
            >
              <header className={styles.lessonGroupHeader}>
                <div>
                  <h2 id={`lesson-group-${group.id}`}>{group.title}</h2>
                  <p>{group.description}</p>
                </div>
                <strong>{group.lessons.length} lessons</strong>
              </header>

              <div className={styles.lessonGroupRows}>
                {group.lessons.map((lesson) => (
                  <Link
                    className={styles.lessonRow}
                    href={`/projects/piano-party/lessons/${lesson.id}/`}
                    key={lesson.id}
                  >
                    <span className={styles.lessonNumber} aria-hidden="true">
                      {String(lesson.id).padStart(2, "0")}
                    </span>
                    <span className={styles.lessonRowCopy}>
                      <span className={styles.lessonLabel}>{exerciseLabels[lesson.exerciseMode]}</span>
                      <strong>{lesson.title}</strong>
                      <span className={styles.lessonDescription}>{lesson.libraryDescription}</span>
                    </span>
                    <span className={styles.lessonAction}>
                      Start <ArrowRight className={styles.lessonArrow} size={18} weight="bold" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
