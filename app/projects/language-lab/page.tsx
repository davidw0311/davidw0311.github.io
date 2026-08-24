import { ArrowLeft, Microphone } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { LanguageLearningLab } from "@/components/LanguageLearningLab";
import styles from "./language-lab.module.css";

export const metadata: Metadata = {
  title: "Lilt Language Lab",
  description: "A multilingual, speaking-first language learning prototype with short stories and counting practice.",
  alternates: { canonical: "/projects/language-lab/" },
};

export default function LanguageLabPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Language lab navigation">
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Back to space</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.stage} aria-labelledby="language-lab-title">
        <header className={styles.intro}>
          <div className={styles.introIcon} aria-hidden="true"><Microphone size={24} weight="fill" /></div>
          <div>
            <p>Interactive project</p>
            <h1 id="language-lab-title">Learn by saying it.</h1>
            <strong>Read, listen, inspect, and speak through a few tiny multilingual lessons.</strong>
          </div>
        </header>

        <LanguageLearningLab />
      </section>

      <section className={styles.prototypeNote} aria-labelledby="prototype-note-title">
        <h2 id="prototype-note-title">What this version proves</h2>
        <div>
          <p>The reader, phrase interactions, audio playback, speech gate, local progress, and content model all run without a database.</p>
          <p>Reliable pronunciation and tone assessment require a server-side provider. This prototype uses browser transcription only and labels its score accordingly.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Return to space</Link>
      </footer>
    </main>
  );
}
