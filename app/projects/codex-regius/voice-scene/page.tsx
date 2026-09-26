import type { Metadata } from "next";
import Link from "next/link";
import sample from "@/data/regiusDramaSample.json";
import styles from "./scene.module.css";

export const metadata: Metadata = {
  title: "Völuspá · A scene in three voices",
  robots: { index: false, follow: false },
};

function timestamp(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function VoiceScenePage() {
  return (
    <main id="book-content" className={styles.page}>
      <Link className={styles.back} href="/projects/codex-regius/audio-lab/">← The listening room</Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Völuspá · A scene in three voices</p>
        <h1>{sample.title}</h1>
        <p>The opening, reimagined for a storyteller, an old god, and a woman who remembers the world before him.</p>
      </header>
      <section className={styles.player} aria-labelledby="listen-heading">
        <div className={styles.playerHeading}>
          <h2 id="listen-heading">Listen to the scene</h2>
          <span>{timestamp(sample.duration)} · English</span>
        </div>
        <audio controls preload="metadata" src={sample.src} aria-label="Völuspá opening with narrator, Odin and the seeress" aria-describedby="scene-transcript">
          <a href={sample.src}>Listen to the MP3</a>
        </audio>
        <p>Three AI voices created with Qwen3-TTS. Voices only, so you can hear each character clearly.</p>
        <a href={sample.src} download="voluspa-three-voices.mp3">Download the sample</a>
      </section>
      <section id="scene-transcript" className={styles.transcript} aria-label="Scene transcript">
        {sample.lines.map((line) => (
          <article key={line.id} className={styles.line}>
            <div className={styles.speaker}>
              <h2>{line.speaker}</h2>
              <span>{timestamp(line.start)}</span>
            </div>
            <p className={styles.description}>{line.description}</p>
            <p className={styles.dialogue}>{line.id === "narrator" ? line.text : `“${line.text}”`}</p>
          </article>
        ))}
      </section>
      <footer className={styles.note}>
        <p>{sample.note}</p>
        <Link href="/projects/codex-regius/voluspa/">Read Völuspá →</Link>
      </footer>
    </main>
  );
}
