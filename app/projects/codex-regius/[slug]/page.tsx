import type { Metadata } from "next";
import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ListBullets } from "@phosphor-icons/react/dist/ssr";
import { regiusStories } from "@/data/codexRegius";
import { glossaryForStory, usedGlossary } from "@/data/codexRegiusTerms";
import { RememberStory } from "../reader";
import { GlossaryScope } from "../glossary";
import { createGlossedText } from "../glossed-text";
import styles from "../regius.module.css";

export function generateStaticParams() { return regiusStories.map(story => ({ slug: story.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = regiusStories.find(story => story.slug === slug);
  if (!story) return {};
  return { title: `${story.subtitle} · Codex Regius`, description: story.paragraphs[0].split(/(?<=\.) /).slice(0, 2).join(" "), alternates: { canonical: `/projects/codex-regius/${slug}/` }, openGraph: { title: `${story.subtitle} · Codex Regius`, url: `/projects/codex-regius/${slug}/`, images: [story.image ?? "/assets/codex-regius/voluspa.webp"] } };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = regiusStories.find(story => story.slug === slug);
  if (!story) notFound();
  const previous = regiusStories[story.number - 2];
  const next = regiusStories[story.number];
  const glossary = usedGlossary(glossaryForStory(slug), [...story.paragraphs, ...story.quotes.flatMap(quote => [quote.norse, quote.english])]);
  const renderText = createGlossedText(glossary);
  return <main id="book-content" className={styles.readingPage}>
    <RememberStory slug={slug} />
    <nav className={styles.readingNav} aria-label="Collection navigation"><Link href="/projects/codex-regius/#contents"><ListBullets size={19} /> All stories</Link><span>{String(story.number).padStart(2, "0")} / 31</span></nav>
    <article className={styles.article}>
      <header className={styles.storyHeading}>
        <p className={styles.eyebrow}>{story.group === "gods" ? "Gods & the world" : "Heroes & fate"} · {story.minutes} min read</p>
        <h1>{story.subtitle}</h1>
        <p className={styles.originalTitle} lang="non">{story.title}</p>
      </header>
      <div className={styles.readingEditions}><Link href={`/projects/codex-regius/${slug}/original/`}>Read the full original & translation <ArrowRight size={17} /></Link><p>Tap an underlined name for a short explanation.</p></div>
      {story.image && <figure className={styles.storyArt}><Image src={story.image} alt={story.imageAlt ?? "Illustration from the original booklet"} width={1122} height={1402} priority sizes="(max-width: 767px) calc(100vw - 44px), 480px" /></figure>}
      <GlossaryScope entries={glossary}>
      <div className={styles.prose}>{story.paragraphs.map((paragraph, i) => <Fragment key={i}>
        <p>{renderText({ text: paragraph })}</p>
        {story.quotes.filter(quote => quote.after === i + 1).map(quote => <figure className={styles.excerpt} key={quote.stanza}>
          <figcaption>Old Norse · {quote.stanza.startsWith("Prose") ? quote.stanza : `Stanza ${quote.stanza}`}</figcaption>
          <blockquote lang="non">{renderText({ text: quote.norse })}</blockquote>
          <div className={styles.translation}><span>English</span><p lang="en">{renderText({ text: quote.english })}</p></div>
        </figure>)}
      </Fragment>)}</div>
      </GlossaryScope>
      <div className={styles.storyEnd} aria-hidden="true">⁂</div>
      <section className={styles.sourceNote} aria-labelledby="retelling-note">
        <h2 id="retelling-note">About this retelling</h2>
        <p>{story.note}</p>
        <p>The Old Norse follows a normalized edition, rather than the manuscript’s exact spelling. The English beneath each quotation is a new rendering for this reader. Stanza numbers follow the linked Norse text.</p>
        <div className={styles.sourceLinks}><Link href={`/projects/codex-regius/${slug}/original/`}>Full original & English translation →</Link><a href={story.norseSource} target="_blank" rel="noopener noreferrer">Old Norse source ↗</a><a href={story.translationSource} target="_blank" rel="noopener noreferrer">Translation source ↗</a></div>
        <p>{story.kind} · {story.wordCount.toLocaleString("en")} English words · Reading time at 170 words per minute</p>
      </section>
    </article>
    <nav className={styles.chapterNav} aria-label="Story navigation">
      {previous ? <Link href={`/projects/codex-regius/${previous.slug}/`}><span><ArrowLeft size={16} /> Previous story</span><strong>{previous.subtitle}</strong></Link> : <Link href="/projects/codex-regius/#contents"><span><ListBullets size={16} /> The collection</span><strong>Browse all stories</strong></Link>}
      {next ? <Link href={`/projects/codex-regius/${next.slug}/`} className={styles.nextStory}><span>Up next <ArrowRight size={16} /></span><strong>{next.subtitle}</strong></Link> : <Link href="/projects/codex-regius/#contents" className={styles.nextStory}><span>End of the collection <ArrowRight size={16} /></span><strong>Return to all stories</strong></Link>}
    </nav>
  </main>;
}
