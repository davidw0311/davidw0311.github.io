import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PianoLesson } from "@/components/PianoLessonOne";
import { pianoLessonLibraryHref } from "@/data/pianoLessons";
import styles from "../../piano-party.module.css";

export const metadata: Metadata = {
  title: "Lesson 2 | Piano Party",
  description: "Learn every black piano key name with a shuffled, timed exercise.",
  alternates: { canonical: "/projects/piano-party/lessons/2/" },
};

export default function PianoLessonTwoPage() {
  return (
    <main className={`${styles.page} ${styles.lessonPlayPage}`}>
      <nav className={styles.nav} aria-label="Lesson 2 navigation">
        <Link href={pianoLessonLibraryHref(2)}><ArrowLeft size={18} weight="bold" /> Lessons</Link>
        <Link href="/projects/piano-party/">Piano Party</Link>
      </nav>
      <PianoLesson lessonId={2} />
    </main>
  );
}
