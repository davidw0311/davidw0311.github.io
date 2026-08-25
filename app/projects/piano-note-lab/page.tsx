import { ArrowLeft, PianoKeys } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PianoNoteTrainer } from "@/components/PianoNoteTrainer";
import styles from "./piano-note-lab.module.css";

export const metadata: Metadata = {
  title: "Piano Party",
  description: "A focused piano note trainer for learning natural, sharp, and flat keys in treble and bass clef.",
  alternates: { canonical: "/projects/piano-note-lab/" },
};

export default function PianoNoteLabPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Piano Party navigation">
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Back to space</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.stage} aria-labelledby="piano-lab-title">
        <header className={styles.intro}>
          <div className={styles.introIcon} aria-hidden="true">
            <PianoKeys size={27} weight="thin" />
          </div>
          <div>
            <p>Interactive project</p>
            <h1 id="piano-lab-title">Piano Party.</h1>
            <strong>Build quick note recognition on the keyboard, treble clef, and bass clef.</strong>
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
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Return to future projects</Link>
      </footer>
    </main>
  );
}
