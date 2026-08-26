import { permanentRedirect } from "next/navigation";

export default function LegacyPianoPracticePage() {
  permanentRedirect("/projects/piano-party/practice/");
}
