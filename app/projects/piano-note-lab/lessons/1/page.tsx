import { permanentRedirect } from "next/navigation";

export default function LegacyPianoLessonOnePage() {
  permanentRedirect("/projects/piano-party/lessons/1/");
}
