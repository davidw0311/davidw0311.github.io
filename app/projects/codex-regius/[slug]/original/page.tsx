import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListBullets } from "@phosphor-icons/react/dist/ssr";
import { regiusStories } from "@/data/codexRegius";
import { getRegiusOriginal, type OriginalBlock } from "@/data/codexRegiusOriginals";
import { glossaryForStory, usedGlossary } from "@/data/codexRegiusTerms";
import { GlossaryScope } from "../../glossary";
import { createGlossedText } from "../../glossed-text";
import { SourceReader } from "../../source-reader";
import styles from "../../regius.module.css";

export function generateStaticParams() { return regiusStories.map(story => ({ slug: story.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = regiusStories.find(story => story.slug === slug);
  return story ? { title: `${story.title} · Full original & translation`, description: `Read the complete Old Norse text of ${story.title} and Henry Adams Bellows’s English translation, with a tap-to-explain glossary.`, alternates: { canonical: `/projects/codex-regius/${slug}/original/` } } : {};
}

export default async function OriginalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = regiusStories.find(story => story.slug === slug);
  const original = getRegiusOriginal(slug);
  if (!story || !original) notFound();
  const glossary = usedGlossary(glossaryForStory(slug), [...original.norse, ...original.english].map(block => block.text));
  const renderText = createGlossedText(glossary);
  const renderBlocks = (blocks: OriginalBlock[]) => blocks.map((block, i) => <p className={styles.sourceBlock} data-kind={block.kind} key={i}>
    {block.stanza && <span className={styles.sourceStanza} lang="en">Stanza {block.stanza}</span>}{renderText({ text: block.text })}
  </p>);
  return <main id="book-content" className={styles.sourcePage}>
    <nav className={styles.readingNav} aria-label="Collection navigation"><Link href={`/projects/codex-regius/${slug}/`}><ArrowLeft size={18} /> The retelling</Link><Link href="/projects/codex-regius/#contents"><ListBullets size={18} /> All stories</Link></nav>
    <header className={styles.sourceHeading}>
      <p className={styles.eyebrow}>The complete text</p>
      <h1 lang="non">{story.title}</h1>
      <p>{story.subtitle}</p>
    </header>
    <details className={styles.editionDetails}><summary>About these two editions</summary><p>{original.note}</p><p>Original wording is retained. Obvious transcription errors in stanza numbering have been corrected. Spelling and names differ from the modern retelling.</p></details>
    <GlossaryScope entries={glossary}>
      <SourceReader
        norse={<section className={styles.sourceColumn} lang="non" aria-labelledby="norse-heading"><h2 id="norse-heading" lang="en">Old Norse</h2><p className={styles.editionNote} lang="en">{original.norseEdition} · <a href={original.norseSource} target="_blank" rel="noopener noreferrer">Source ↗</a></p>{renderBlocks(original.norse)}</section>}
        english={<section className={styles.sourceColumn} lang="en" aria-labelledby="english-heading"><h2 id="english-heading">English translation</h2><p className={styles.editionNote}>Henry Adams Bellows · First published 1923 · <a href={original.englishSource} target="_blank" rel="noopener noreferrer">Source & commentary ↗</a></p>{renderBlocks(original.english)}</section>}
      />
    </GlossaryScope>
    <div className={styles.storyEnd} aria-hidden="true">⁂</div>
    <div className={styles.readingEditions}><Link href={`/projects/codex-regius/${slug}/`}><ArrowLeft size={17} /> Return to the retelling</Link></div>
  </main>;
}
