import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { gardenGenera, getGenusCover } from "@/data/carnivorousGarden";
import { GardenCollection } from "./GardenCollection";
import styles from "./garden.module.css";

const heroImage = getGenusCover(gardenGenera[0]);

export const metadata: Metadata = {
  title: "My Carnivorous Garden",
  description: "David Yuchen Wang's growing collection of carnivorous plants, with species photographs, facts, and practical care notes.",
  alternates: { canonical: "/my-carnivorous-garden/" },
  openGraph: {
    title: "My Carnivorous Garden | David Yuchen Wang",
    description: "A growing collection of flytraps, sundews, butterworts, and pitcher plants.",
    url: "https://davidw0311.github.io/my-carnivorous-garden/",
    images: [{ url: heroImage.src, width: 1600, height: 1067, alt: heroImage.alt }],
    type: "website",
  },
};

export default function CarnivorousGardenPage() {
  return (
    <>
      <a className="skip-link" href="#garden-content">Skip to garden</a>
      <header className={styles.nav}>
        <Link className={styles.mark} href="/" aria-label="David Yuchen Wang, home">DYW</Link>
        <nav aria-label="Garden navigation">
          <Link href="/#interests"><ArrowLeft size={17} weight="bold" /> Portfolio</Link>
        </nav>
      </header>

      <main id="garden-content" className={styles.page}>
        <section className={styles.hero} aria-labelledby="garden-title">
          <div className={styles.heroCopy}>
            <h1 id="garden-title">My Carnivorous Garden</h1>
            <p>A growing record of traps, pitchers, sticky leaves, and the conditions that keep each plant thriving.</p>
            <a className={styles.heroLink} href="#collection">
              Browse collection <ArrowRight size={18} weight="bold" />
            </a>
          </div>
          <figure className={styles.heroFigure}>
            <span className={styles.heroImage}>
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                fill
                preload
                sizes="(max-width: 767px) calc(100vw - 32px), 48vw"
              />
            </span>
            <figcaption>Five genera, ten plants, and room for the collection to grow.</figcaption>
          </figure>
        </section>

        <aside className={styles.climateNote} aria-labelledby="climate-note-title">
          <h2 id="climate-note-title">A warm-climate note</h2>
          <p>
            <i>Dionaea</i> and <i>Sarracenia</i> need a managed cool winter rest in an equatorial climate.
            <i> Nepenthes</i>, <i>Drosera paradoxa</i>, and the Mexican butterwort hybrid should stay warm.
          </p>
        </aside>

        <GardenCollection />

        <footer className={styles.footer}>
          <p>The garden index will keep changing as plants grow, flower, and are identified more precisely.</p>
          <Link href="/#interests"><ArrowLeft size={17} weight="bold" /> Back to photography</Link>
        </footer>
      </main>
    </>
  );
}
