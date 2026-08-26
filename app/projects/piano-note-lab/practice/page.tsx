import { ArrowLeft, PianoKeys } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PianoNoteTrainer } from "@/components/PianoNoteTrainer";
import styles from "../piano-note-lab.module.css";

export const metadata: Metadata = {
  title: "Free Practice | Piano Party",
  description: "Practice piano keys and staff notes freely in treble and bass clef.",
  alternates: { canonical: "/projects/piano-note-lab/practice/" },
};

export default function PianoPracticePage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Free Practice navigation">
        <Link href="/projects/piano-note-lab/"><ArrowLeft size={18} weight="bold" /> Piano Party</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.stage} aria-labelledby="practice-title">
        <header className={styles.intro}>
          <div className={styles.introIcon} aria-hidden="true">
            <PianoKeys size={27} weight="thin" />
          </div>
          <div>
            <p>Free Practice</p>
            <h1 id="practice-title">Choose your challenge.</h1>
            <strong>Switch exercises whenever you like. Your score follows the whole session.</strong>
          </div>
        </header>

        <PianoNoteTrainer />
      </section>

      <section className={styles.practiceGuide} aria-labelledby="practice-guide-title">
        <div>
          <PianoKeys size={38} weight="thin" aria-hidden="true" />
          <h2 id="practice-guide-title">Read. Find. Repeat.</h2>
        </div>
        <div className={styles.guideCopy}>
          <p>Start with key names, then move to staff reading. Mixed clefs combine both skills once each one feels familiar.</p>
          <p>Practice natural notes, sharps, and flats from C3 to C5. Each answer plays aloud so sight and sound reinforce one another.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/projects/piano-note-lab/"><ArrowLeft size={18} weight="bold" /> Return to Piano Party</Link>
      </footer>
    </main>
  );
}
