import {
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { pianoLessons, type PianoLessonId } from "@/data/pianoLessons";
import styles from "../piano-party.module.css";

export const metadata: Metadata = {
  title: "Lessons | Piano Party",
  description: "Build piano note-reading skills through focused, timed lessons.",
  alternates: { canonical: "/projects/piano-party/lessons/" },
};

const lessonGroups: readonly {
  id: string;
  title: string;
  description: string;
  lessonIds: readonly PianoLessonId[];
}[] = [
  {
    id: "keyboard-map",
    title: "Keyboard map",
    description: "Build quick recognition across white keys, black keys, and the full keyboard.",
    lessonIds: [1, 2, 3],
  },
  {
    id: "treble-foundations",
    title: "Treble foundations",
    description: "Connect the staff to note names and piano keys from C4 through C5.",
    lessonIds: [4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: "upper-treble",
    title: "Upper treble",
    description: "Extend staff reading through the upper register from C5 to C6.",
    lessonIds: [12, 13, 14, 15],
  },
  {
    id: "full-range",
    title: "Full range",
    description: "Bring the complete C4 to C6 white-key range together.",
    lessonIds: [16, 17],
  },
];

const exerciseLabels = {
  "key-name": "Key to note",
  "staff-name": "Staff to note",
  "staff-key": "Staff to key",
} as const;

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
          <strong>Short, focused sessions that build one piano-reading skill at a time.</strong>
        </header>

        <div className={styles.lessonList}>
          {lessonGroups.map((group) => {
            const lessons = pianoLessons.filter((lesson) => group.lessonIds.includes(lesson.id));

            return (
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
                  <strong>{lessons.length} lessons</strong>
                </header>

                <div className={styles.lessonGroupRows}>
                  {lessons.map((lesson) => (
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
            );
          })}
        </div>
      </section>
    </main>
  );
}
