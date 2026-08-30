import { ArrowLeft, MusicNotes } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PianoChordChart } from "@/components/PianoChordChart";
import styles from "../piano-party.module.css";

export const metadata: Metadata = {
  title: "Chord Chart | Piano Party",
  description: "Explore every major, minor, and diminished piano triad on an interactive keyboard.",
  alternates: { canonical: "/projects/piano-party/chords/" },
};

export default function PianoChordChartPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Chord Chart navigation">
        <Link href="/projects/piano-party/"><ArrowLeft size={18} weight="bold" /> Piano Party</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.stage} aria-labelledby="chord-chart-title">
        <header className={styles.intro}>
          <div className={styles.introIcon} aria-hidden="true">
            <MusicNotes size={27} weight="thin" />
          </div>
          <div>
            <p>Chord reference</p>
            <h1 id="chord-chart-title">See every triad.</h1>
            <strong>Select a major, minor, or diminished chord to reveal its notes on the piano.</strong>
          </div>
        </header>

        <PianoChordChart />
      </section>
    </main>
  );
}
