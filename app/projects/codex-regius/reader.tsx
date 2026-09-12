"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowLeft, BookOpen, Moon, Sun, TextAa } from "@phosphor-icons/react";
import styles from "./regius.module.css";

const lastStoryKey = "regius-last-story";
const subscribe = (listener: () => void) => {
  window.addEventListener("storage", listener);
  window.addEventListener("regius-reading", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("regius-reading", listener);
  };
};
function lastStory() {
  try { return localStorage.getItem(lastStoryKey) ?? ""; } catch { return ""; }
}

export function BookFrame({ children }: { children: ReactNode }) {
  const [night, setNight] = useState(false);
  const [size, setSize] = useState("regular");
  return <div className={styles.frame} data-theme={night ? "night" : "day"} data-size={size}>
    <a href="#book-content" className={styles.skip}>Skip to reading</a>
    <header className={styles.header}>
      <Link href="/#space" className={styles.back}><ArrowLeft size={18} /> <span>Space</span></Link>
      <Link href="/projects/codex-regius/" className={styles.brand}>Codex Regius</Link>
      <div className={styles.tools}>
        <details className={styles.settings}>
          <summary aria-label="Reading text size"><TextAa size={23} /></summary>
          <div className={styles.settingsPanel}>
            <span>Text size</span>
            <div role="group" aria-label="Text size">{["regular", "large", "larger"].map((option, i) =>
              <button key={option} aria-label={`${option} text`} aria-pressed={size === option} onClick={() => setSize(option)} style={{ fontSize: 16 + i * 4 }}>A</button>
            )}</div>
          </div>
        </details>
        <button className={styles.themeToggle} aria-label={night ? "Use day theme" : "Use night theme"} onClick={() => setNight(!night)}>{night ? <Sun size={21} /> : <Moon size={21} />}</button>
      </div>
    </header>
    {children}
    <footer className={styles.footer}>
      <BookOpen size={22} weight="light" />
      <p>Old stories, a little closer.</p>
      <Link href="/projects/codex-regius/#about-book">About this edition</Link>
      <Link href="/#space">Back to Space <ArrowLeft size={14} /></Link>
    </footer>
  </div>;
}

export function RememberStory({ slug }: { slug: string }) {
  useEffect(() => {
    try { localStorage.setItem(lastStoryKey, slug); window.dispatchEvent(new Event("regius-reading")); } catch { /* Reading works without browser storage. */ }
  }, [slug]);
  return null;
}

export function ContinueReading({ stories }: { stories: { slug: string; subtitle: string }[] }) {
  const slug = useSyncExternalStore(subscribe, lastStory, () => "");
  const story = stories.find(story => story.slug === slug);
  if (!story) return null;
  return <Link className={styles.resume} href={`/projects/codex-regius/${story.slug}/`}>
    <BookOpen size={21} /><span>Last opened<strong>{story.subtitle}</strong></span><span aria-hidden="true">↗</span>
  </Link>;
}
