"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import type { LanguageId } from "@/data/languageLearning";
import { languageLearningUi } from "@/data/languageLearningUi";
import { LanguageLearningLab } from "./LanguageLearningLab";
import styles from "@/app/projects/language-lab/language-lab.module.css";

export function LanguageLabShell() {
  const [systemLanguageId, setSystemLanguageId] = useState<LanguageId>("en");
  const ui = languageLearningUi[systemLanguageId];

  return (
    <>
      <nav className={styles.nav} aria-label={ui.navigationLabel}>
        <Link href="/#space"><ArrowLeft size={18} weight="bold" /> {ui.backToSpace}</Link>
        <Link href="/#about">DYW</Link>
      </nav>

      <section className={styles.stage} aria-label={ui.appLabel}>
        <LanguageLearningLab onSystemLanguageChange={setSystemLanguageId} />
      </section>
    </>
  );
}
