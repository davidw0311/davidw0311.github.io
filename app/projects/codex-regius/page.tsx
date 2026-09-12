import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { regiusSource, regiusStories } from "@/data/codexRegius";
import { StoryLibrary } from "./library";
import { ContinueReading } from "./reader";
import styles from "./regius.module.css";

export const metadata: Metadata = {
  title: "Codex Regius · Stories of gods & heroes",
  description: "31 expanded retellings from the Codex Regius, with Old Norse passages and English translations. An illustrated, phone-friendly reader for the Poetic Edda.",
  alternates: { canonical: "/projects/codex-regius/" },
  openGraph: { title: "Codex Regius", description: "Stories of gods, heroes, and the fate of a world.", url: "/projects/codex-regius/", images: [{ url: "/assets/codex-regius/voluspa.webp", width: 1122, height: 1402 }] },
};

export default function RegiusPage() {
  return <main id="book-content">
    <section className={styles.cover} aria-labelledby="cover-title">
      <div className={styles.coverCopy}>
        <p className={styles.eyebrow}>The Poetic Edda · An illustrated reader</p>
        <h1 id="cover-title">Codex<br />Regius</h1>
        <p className={styles.coverDescription}>Stories of gods, heroes,<br />and the fate of a world.</p>
        <Link className={styles.primary} href="/projects/codex-regius/voluspa/">Begin reading <ArrowRight size={20} /></Link>
      </div>
      <figure className={styles.coverArt}>
        <Image src="/assets/codex-regius/voluspa.webp" alt="Odin and a seeress look upon visions of the world’s creation, destruction, and rebirth" width={1122} height={1402} priority sizes="(max-width: 767px) 85vw, 420px" />
      </figure>
    </section>
    <div className={styles.editionLine}><span>31 expanded retellings</span><span>Old Norse & English</span><a href="#contents">Explore the collection <ArrowRight size={16} /></a></div>
    <div className={styles.resumeWrap}><ContinueReading stories={regiusStories.map(({ slug, subtitle }) => ({ slug, subtitle }))} /></div>
    <StoryLibrary stories={regiusStories.map(({ slug, number, title, subtitle, group, minutes, paragraphs }) => ({ slug, number, title, subtitle, group, minutes, searchText: paragraphs.join(" ") }))} />
    <section id="about-book" className={styles.about}>
      <div><h2>A very old book.<br />A new way in.</h2><p>This collection follows the poem sequence of the Codex Regius, the medieval Icelandic manuscript of the Poetic Edda. First come the gods and the making of their world. Then come the heroes, their loves, and their losses.</p></div>
      <div><p>The stories have been expanded from the original ChatGPT booklet and checked against Old Norse editions and Henry Adams Bellows’s 1923 translation. These are modern prose retellings, with passages in normalized Old Norse and new English renderings immediately beneath. The nine AI-generated illustrations come from the original booklet.</p><p>Tap an underlined name for a short explanation. Every story also opens into its complete Old Norse text and English translation, with editions you can switch between as you read.</p><p>Most full narratives take around seven to eight minutes at a measured reading pace. Brief poems and the two prose links remain shorter. The collection follows 29 poem entries and two prose links; the missing manuscript leaves, known as the Great Lacuna, remain a break in Sigurðr’s story.</p><div className={styles.sourceLinks}><a href="/assets/codex-regius/codex-regius-short-stories.pdf" download><DownloadSimple size={19} /> Original short booklet <span>(PDF · 3.9 MB)</span></a><a href={regiusSource} target="_blank" rel="noopener noreferrer">Source conversation ↗</a></div><p className={styles.bookletNote}>The PDF preserves the earlier, shorter edition. The expanded stories are available in this web reader.</p></div>
    </section>
  </main>;
}
