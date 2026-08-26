import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Keyboard,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "../piano-note-lab.module.css";

export const metadata: Metadata = {
  title: "Lessons | Piano Party",
  description: "Build piano note-reading skills through focused, timed lessons.",
  alternates: { canonical: "/projects/piano-note-lab/lessons/" },
};

export default function PianoLessonsPage() {
  return (
    <main className={`${styles.page} ${styles.menuPage}`}>
      <nav className={styles.nav} aria-label="Piano Party lessons navigation">
        <Link href="/projects/piano-note-lab/"><ArrowLeft size={18} weight="bold" /> Piano Party</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.lessonLibrary} aria-labelledby="lessons-title">
        <header className={styles.libraryHeader}>
          <p>Guided path</p>
          <h1 id="lessons-title">Lessons.</h1>
          <strong>Short, focused sessions that build one piano-reading skill at a time.</strong>
        </header>

        <Link className={styles.lessonRow} href="/projects/piano-note-lab/lessons/1/">
          <span className={styles.lessonNumber}>01</span>
          <span className={styles.lessonRowIcon} aria-hidden="true"><Keyboard size={29} weight="thin" /></span>
          <span className={styles.lessonRowCopy}>
            <strong>White key names</strong>
            <span>21 shuffled cards. C through B appears three times.</span>
          </span>
          <span className={styles.lessonReady}><CheckCircle size={17} weight="fill" /> Ready</span>
          <ArrowRight className={styles.lessonArrow} size={19} weight="bold" aria-hidden="true" />
        </Link>

        <div className={styles.lessonEmpty}>
          <span>Next lessons</span>
          <p>This library is ready to grow with new levels and dedicated exercises.</p>
        </div>
      </section>
    </main>
  );
}
