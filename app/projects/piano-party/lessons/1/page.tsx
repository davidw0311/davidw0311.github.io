import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PianoLesson } from "@/components/PianoLessonOne";
import { pianoLessonLibraryHref } from "@/data/pianoLessons";
import styles from "../../piano-party.module.css";

export const metadata: Metadata = {
  title: "Lesson 1 | Piano Party",
  description: "Learn the seven natural piano note names with a shuffled, timed exercise.",
  alternates: { canonical: "/projects/piano-party/lessons/1/" },
};

export default function PianoLessonOnePage() {
  return (
    <main className={`${styles.page} ${styles.lessonPlayPage}`}>
      <nav className={styles.nav} aria-label="Lesson 1 navigation">
        <Link href={pianoLessonLibraryHref(1)}><ArrowLeft size={18} weight="bold" /> Lessons</Link>
        <Link href="/projects/piano-party/">Piano Party</Link>
      </nav>
      <PianoLesson lessonId={1} />
    </main>
  );
}
