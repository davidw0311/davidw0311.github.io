import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { regiusSource } from "@/data/codexRegius";
import { StoryLibrary } from "./library";
import { ContinueReading } from "./reader";
import styles from "./regius.module.css";

export const metadata: Metadata = {
  title: "Codex Regius · Stories of gods & heroes",
  description: "An illustrated collection of 31 short retellings from the Codex Regius of the Poetic Edda. Read Norse stories in a spacious, phone-friendly edition.",
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
    <div className={styles.editionLine}><span>31 short retellings</span><span>9 original illustrations</span><a href="#contents">Explore the collection <ArrowRight size={16} /></a></div>
    <div className={styles.resumeWrap}><ContinueReading /></div>
    <StoryLibrary />
    <section id="about-book" className={styles.about}>
      <div><h2>A very old book.<br />A new way in.</h2><p>This collection follows the poem sequence of the Codex Regius, the medieval Icelandic manuscript of the Poetic Edda. First come the gods and the making of their world. Then come the heroes, their loves, and their losses.</p></div>
      <div><p>These are modern English retellings from the companion ChatGPT booklet, preserved here with its AI-generated illustrations and selected Old Norse excerpts. They explain the stories rather than translate the poems directly.</p><p>The collection includes 29 poem entries and two prose links. The missing leaves of the manuscript, known as the Great Lacuna, leave a break in the story of Sigurðr.</p><div className={styles.sourceLinks}><a href="/assets/codex-regius/codex-regius-short-stories.pdf" download><DownloadSimple size={19} /> Original PDF <span>(3.9 MB)</span></a><a href={regiusSource} target="_blank" rel="noopener noreferrer">Source conversation ↗</a></div></div>
    </section>
  </main>;
}
