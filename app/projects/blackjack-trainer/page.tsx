import { ArrowLeft, CardsThree } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { BlackjackTrainer } from "@/components/BlackjackTrainer";
import styles from "./blackjack.module.css";

export const metadata: Metadata = {
  title: "Blackjack Strategy Lab",
  description: "An interactive blackjack basic strategy trainer for 4-8 deck S17 games with DAS and late surrender.",
  alternates: { canonical: "/projects/blackjack-trainer/" },
};

export default function BlackjackTrainerPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Blackjack trainer navigation">
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Back to space</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.playStage} aria-labelledby="trainer-title">
        <header className={styles.intro}>
          <p>Interactive project</p>
          <h1 id="trainer-title">Blackjack Strategy Lab.</h1>
          <strong>Practice every core decision and learn why the chart recommends each move.</strong>
        </header>

        <BlackjackTrainer />
      </section>

      <section className={styles.strategyNotes} aria-labelledby="strategy-notes-title">
        <div className={styles.notesIntro}>
          <CardsThree size={38} weight="thin" aria-hidden="true" />
          <h2 id="strategy-notes-title">The chart behind the game</h2>
          <p>The trainer encodes all 350 decisions in the supplied basic strategy workbook.</p>
        </div>

        <div className={styles.rulesGrid}>
          <div>
            <h3>Table rules</h3>
            <ul>
              <li>Four to eight decks</li>
              <li>Dealer stands on soft 17</li>
              <li>Double after split is allowed</li>
              <li>Late surrender is available</li>
            </ul>
          </div>
          <div>
            <h3>Training method</h3>
            <p>Each hand is a focused strategy decision. Feedback names the correct action, explains the matchup, and records your accuracy and streak.</p>
            <p className={styles.disclaimer}>Basic strategy improves decision quality but cannot guarantee a winning hand. This project is for training only.</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Return to future projects</Link>
      </footer>
    </main>
  );
}
