import { permanentRedirect } from "next/navigation";

export default function LegacyPianoNoteLabPage() {
  permanentRedirect("/projects/piano-party/");
}
