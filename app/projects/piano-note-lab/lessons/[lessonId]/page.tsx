import { permanentRedirect } from "next/navigation";
import { pianoLessons } from "@/data/pianoLessons";

type LegacyLessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

const newLessonIds = pianoLessons.filter(({ id }) => id >= 4).map(({ id }) => id);

export const dynamicParams = false;

export function generateStaticParams() {
  return newLessonIds.map((lessonId) => ({ lessonId: String(lessonId) }));
}

export default async function LegacyPianoLessonPage({ params }: LegacyLessonPageProps) {
  const { lessonId } = await params;
  permanentRedirect(`/projects/piano-party/lessons/${lessonId}/`);
}
