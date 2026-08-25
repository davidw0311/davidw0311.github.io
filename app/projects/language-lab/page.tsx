import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { LanguageLearningLab } from "@/components/LanguageLearningLab";
import styles from "./language-lab.module.css";

export const metadata: Metadata = {
  title: "Lilt Language Lab",
  description: "A multilingual, speaking-first language learning prototype with short stories and counting practice.",
  alternates: { canonical: "/projects/language-lab/" },
};

export default function LanguageLabPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Language lab navigation">
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> Back to space</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.stage} aria-label="Lilt language learning app">
        <LanguageLearningLab />
      </section>
    </main>
  );
}
