import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { PianoLesson } from "@/components/PianoLessonOne";
import {
  dynamicPianoLessonIds,
  getPianoLesson,
  pianoLessonLibraryHref,
  type PianoLessonId,
} from "@/data/pianoLessons";
import styles from "../../piano-party.module.css";

type LessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return dynamicPianoLessonIds.map((lessonId) => ({ lessonId: String(lessonId) }));
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { lessonId: lessonIdParam } = await params;
  const lessonId = Number(lessonIdParam) as PianoLessonId;
  const lesson = getPianoLesson(lessonId);

  return {
    title: `Lesson ${lesson.id} | Piano Party`,
    description: lesson.libraryDescription,
    alternates: { canonical: `/projects/piano-party/lessons/${lesson.id}/` },
  };
}

export default async function PianoLessonPage({ params }: LessonPageProps) {
  const { lessonId: lessonIdParam } = await params;
  const lessonId = Number(lessonIdParam) as PianoLessonId;
  const lesson = getPianoLesson(lessonId);

  return (
    <main className={`${styles.page} ${styles.lessonPlayPage}`}>
      <nav className={styles.nav} aria-label={`Lesson ${lesson.id} navigation`}>
        <Link href={pianoLessonLibraryHref(lesson.id)}><ArrowLeft size={18} weight="bold" /> Lessons</Link>
        <Link href="/projects/piano-party/">Piano Party</Link>
      </nav>
      <PianoLesson lessonId={lesson.id} />
    </main>
  );
}
