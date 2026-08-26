import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PianoLesson } from "@/components/PianoLessonOne";
import styles from "../../piano-party.module.css";

export const metadata: Metadata = {
  title: "Lesson 3 | Piano Party",
  description: "Practice every white and black piano key name with a shuffled, timed exercise.",
  alternates: { canonical: "/projects/piano-party/lessons/3/" },
};

export default function PianoLessonThreePage() {
  return (
    <main className={`${styles.page} ${styles.lessonPlayPage}`}>
      <nav className={styles.nav} aria-label="Lesson 3 navigation">
        <Link href="/projects/piano-party/lessons/"><ArrowLeft size={18} weight="bold" /> Lessons</Link>
        <Link href="/projects/piano-party/">Piano Party</Link>
      </nav>
      <PianoLesson lessonId={3} />
    </main>
  );
}
