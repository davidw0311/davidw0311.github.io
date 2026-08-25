import type { Metadata } from "next";
import { LanguageLabShell } from "@/components/LanguageLabShell";
import styles from "./language-lab.module.css";

export const metadata: Metadata = {
  title: "Lilt Language Lab",
  description: "A multilingual, speaking-first language learning prototype with short stories and counting practice.",
  alternates: { canonical: "/projects/language-lab/" },
};

export default function LanguageLabPage() {
  return (
    <main className={styles.page}>
      <LanguageLabShell />
    </main>
  );
}
