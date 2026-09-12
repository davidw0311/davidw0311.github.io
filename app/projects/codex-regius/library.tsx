"use client";

import Link from "next/link";
import { useState } from "react";
import { MagnifyingGlass, ArrowUpRight } from "@phosphor-icons/react";
import type { RegiusStory } from "@/data/codexRegius";
import styles from "./regius.module.css";

const fold = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/þ/g, "th").replace(/ð/g, "d").replace(/æ/g, "ae").replace(/ǫ/g, "o");

type LibraryStory = Pick<RegiusStory, "slug" | "number" | "title" | "subtitle" | "group" | "minutes"> & { searchText: string };

export function StoryLibrary({ stories }: { stories: LibraryStory[] }) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const matched = stories.filter(story => (group === "all" || story.group === group) && fold(`${story.title} ${story.subtitle} ${story.searchText}`).includes(fold(search.trim())));
  return <section id="contents" className={styles.library} aria-labelledby="contents-title">
    <h2 id="contents-title">Choose a story.</h2>
    <p className={styles.libraryIntro}>Read in manuscript order, or follow your curiosity.</p>
    <div className={styles.libraryTools}>
      <div className={styles.filters} role="group" aria-label="Story collection">
        {[["all", "All stories"], ["gods", "Gods & the world"], ["heroes", "Heroes & fate"]].map(([value, label]) => <button key={value} aria-pressed={group === value} onClick={() => setGroup(value)}>{label}</button>)}
      </div>
      <label className={styles.search}><span className={styles.srOnly}>Search stories</span><MagnifyingGlass size={18} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a story, god, or hero" type="search" /></label>
    </div>
    <p className={styles.resultCount} role="status">{matched.length} {matched.length === 1 ? "entry" : "entries"}{search.trim() ? ` matching “${search.trim()}”` : " in manuscript order"}</p>
    {matched.length === 0 ? <div className={styles.empty}><h3>No stories found.</h3><p>Try a name like Odin, Thor, or Sigurðr.</p><button onClick={() => { setSearch(""); setGroup("all"); }}>Show all stories</button></div> :
      <div className={styles.collections}>{(["gods", "heroes"] as const).map(section => {
        const stories = matched.filter(story => story.group === section);
        if (!stories.length) return null;
        return <div key={section} className={styles.collection}>
          <h3>{section === "gods" ? "Gods & the world" : "Heroes & fate"}<span>{section === "gods" ? "The mythological poems" : "The heroic poems & prose links"}</span></h3>
          <ol>{stories.map(story => <li key={story.slug} value={story.number}>
            <Link href={`/projects/codex-regius/${story.slug}/`}>
              <span className={styles.storyNumber}>{String(story.number).padStart(2, "0")}</span>
              <span className={styles.storyLabel}><strong>{story.subtitle}</strong><span lang="non">{story.title}</span></span>
              <span className={styles.storyTime}>{story.minutes} min<ArrowUpRight size={17} /></span>
            </Link>
          </li>)}</ol>
        </div>;
      })}</div>}
  </section>;
}
