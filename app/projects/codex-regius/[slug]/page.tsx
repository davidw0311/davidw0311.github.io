import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ListBullets } from "@phosphor-icons/react/dist/ssr";
import { regiusStories } from "@/data/codexRegius";
import { RememberStory } from "../reader";
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
  return <main id="book-content" className={styles.readingPage}>
    <RememberStory slug={slug} />
    <nav className={styles.readingNav} aria-label="Collection navigation"><Link href="/projects/codex-regius/#contents"><ListBullets size={19} /> All stories</Link><span>{String(story.number).padStart(2, "0")} / 31</span></nav>
    <article className={styles.article}>
      <header className={styles.storyHeading}>
        <p className={styles.eyebrow}>{story.group === "gods" ? "Gods & the world" : "Heroes & fate"} · {story.minutes} min read</p>
        <h1>{story.subtitle}</h1>
        <p className={styles.originalTitle} lang="non">{story.title}</p>
      </header>
      {story.image && <figure className={styles.storyArt}><Image src={story.image} alt={story.imageAlt ?? "Illustration from the original booklet"} width={1122} height={1402} priority sizes="(max-width: 767px) calc(100vw - 44px), 480px" /></figure>}
      {story.excerpt && <aside className={styles.excerpt} aria-label="Selected Old Norse"><span>In the original language</span><blockquote lang="non">{story.excerpt}</blockquote></aside>}
      <div className={styles.prose}>{story.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
      <div className={styles.storyEnd} aria-hidden="true">⁂</div>
      <p className={styles.sourceNote}>Modern retelling · Original booklet, page {story.sourcePage}<br />{story.kind}</p>
    </article>
    <nav className={styles.chapterNav} aria-label="Story navigation">
      {previous ? <Link href={`/projects/codex-regius/${previous.slug}/`}><span><ArrowLeft size={16} /> Previous story</span><strong>{previous.subtitle}</strong></Link> : <Link href="/projects/codex-regius/#contents"><span><ListBullets size={16} /> The collection</span><strong>Browse all stories</strong></Link>}
      {next ? <Link href={`/projects/codex-regius/${next.slug}/`} className={styles.nextStory}><span>Up next <ArrowRight size={16} /></span><strong>{next.subtitle}</strong></Link> : <Link href="/projects/codex-regius/#contents" className={styles.nextStory}><span>End of the collection <ArrowRight size={16} /></span><strong>Return to all stories</strong></Link>}
    </nav>
  </main>;
}
