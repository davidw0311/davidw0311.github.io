import type { ReactNode } from "react";
import localFont from "next/font/local";
import { BookFrame } from "./reader";
import styles from "./regius.module.css";

const bookFont = localFont({ src: "./fonts/EBGaramond.ttf", variable: "--font-regius", display: "swap" });

export default function RegiusLayout({ children }: { children: ReactNode }) {
  return <div className={`${bookFont.variable} ${styles.book}`}><BookFrame>{children}</BookFrame></div>;
}
