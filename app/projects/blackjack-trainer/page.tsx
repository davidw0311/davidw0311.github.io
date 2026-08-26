import { ArrowLeft, CardsThree } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { BlackjackTrainer } from "@/components/BlackjackTrainer";
import styles from "./blackjack.module.css";

export const metadata: Metadata = {
  title: "Back to Blackjack",
  description: "An interactive blackjack strategy trainer with focused drills and a configurable, card-by-card bankroll simulator.",
  alternates: { canonical: "/projects/blackjack-trainer/" },
};

export default function BlackjackTrainerPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Back to Blackjack navigation">
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Back to space</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.playStage} aria-labelledby="trainer-title">
        <header className={styles.intro}>
          <p>Interactive project</p>
          <h1 id="trainer-title">Back to Blackjack</h1>
          <strong>Practice every core decision and learn why the chart recommends each move.</strong>
        </header>

        <BlackjackTrainer />
      </section>

      <section className={styles.strategyNotes} aria-labelledby="strategy-notes-title">
        <div className={styles.notesIntro}>
          <CardsThree size={38} weight="thin" aria-hidden="true" />
          <h2 id="strategy-notes-title">The chart behind the game</h2>
          <p>The trainer encodes all 350 decisions in the supplied workbook and plays configured simulation rounds to completion.</p>
        </div>

        <div className={styles.rulesGrid}>
          <div>
            <h3>Table rules</h3>
            <ul>
              <li>One to eight decks</li>
              <li>Cut card, fresh shoe, or continuous shuffle</li>
              <li>Configurable dealer, double, split, and surrender rules</li>
              <li>Table limits, flat betting, insurance, and payout options</li>
            </ul>
          </div>
          <div>
            <h3>Training method</h3>
            <p>Practice single decisions or play complete rounds with visible hits, dealer draws, split hands, doubles, and bankroll settlement.</p>
            <p className={styles.disclaimer}>Coaching follows the supplied multi-deck chart while gameplay enforces your configured table rules. This project is for training only.</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Return to future projects</Link>
      </footer>
    </main>
  );
}
