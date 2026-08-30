import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  MusicNotes,
  PianoKeys,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./piano-party.module.css";

export const metadata: Metadata = {
  title: "Piano Party",
  description: "Practice piano skills, explore an interactive chord chart, or work through structured lessons.",
  alternates: { canonical: "/projects/piano-party/" },
};

export default function PianoPartyPage() {
  return (
    <main className={`${styles.page} ${styles.menuPage}`}>
      <nav className={styles.nav} aria-label="Piano Party navigation">
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Back to space</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.menuStage} aria-labelledby="piano-party-title">
        <header className={styles.intro}>
          <div className={styles.introIcon} aria-hidden="true">
            <PianoKeys size={27} weight="thin" />
          </div>
          <div>
            <p>Choose your path</p>
            <h1 id="piano-party-title">Piano Party.</h1>
            <strong>Build fast note recognition through open practice, a complete chord chart, or guided lessons.</strong>
          </div>
        </header>

        <div className={styles.modeList} aria-label="Piano Party modes">
          <Link className={styles.modeOption} href="/projects/piano-party/practice/">
            <span className={styles.modeIcon} aria-hidden="true"><PianoKeys size={32} weight="thin" /></span>
            <span className={styles.modeCopy}>
              <small>Explore freely</small>
              <strong>Free Practice</strong>
              <span>Train key names, staff notes, treble clef, and bass clef at your own pace.</span>
            </span>
            <span className={styles.modeAction}>Open practice <ArrowRight size={18} weight="bold" /></span>
          </Link>

          <Link className={`${styles.modeOption} ${styles.chartOption}`} href="/projects/piano-party/chords/">
            <span className={styles.modeIcon} aria-hidden="true"><MusicNotes size={32} weight="thin" /></span>
            <span className={styles.modeCopy}>
              <small>Look it up</small>
              <strong>Chord Chart</strong>
              <span>Explore all major, minor, and diminished triads and see every chord on the keyboard.</span>
            </span>
            <span className={styles.modeAction}>Open chart <ArrowRight size={18} weight="bold" /></span>
          </Link>

          <Link className={`${styles.modeOption} ${styles.lessonOption}`} href="/projects/piano-party/lessons/">
            <span className={styles.modeIcon} aria-hidden="true"><GraduationCap size={32} weight="thin" /></span>
            <span className={styles.modeCopy}>
              <small>Follow a sequence</small>
              <strong>Lessons</strong>
              <span>Complete focused exercises, race the clock, and finish with a lesson report.</span>
            </span>
            <span className={styles.modeAction}>View lessons <ArrowRight size={18} weight="bold" /></span>
          </Link>
        </div>
      </section>
    </main>
  );
}
