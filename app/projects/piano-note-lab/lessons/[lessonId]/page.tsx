import { permanentRedirect } from "next/navigation";
import { dynamicPianoLessonIds } from "@/data/pianoLessons";

type LegacyLessonPageProps = {
  params: Promise<{ lessonId: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return dynamicPianoLessonIds.map((lessonId) => ({ lessonId: String(lessonId) }));
}

export default async function LegacyPianoLessonPage({ params }: LegacyLessonPageProps) {
  const { lessonId } = await params;
  permanentRedirect(`/projects/piano-party/lessons/${lessonId}/`);
}
