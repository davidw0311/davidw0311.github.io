import { permanentRedirect } from "next/navigation";

export default function LegacyPianoLessonsPage() {
  permanentRedirect("/projects/piano-party/lessons/");
}
