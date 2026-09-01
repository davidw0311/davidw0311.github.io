import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { gardenGenera, getGenusCover } from "@/data/carnivorousGarden";
import styles from "./GardenPreview.module.css";

export function GardenPreview() {
  return (
    <section className={styles.preview} aria-labelledby="garden-preview-title">
      <div className={styles.header}>
        <div>
          <h3 id="garden-preview-title">My Carnivorous Garden</h3>
          <p>A living index of the sundews, flytraps, butterworts, and pitchers in my care.</p>
        </div>
        <Link className={styles.openLink} href="/my-carnivorous-garden/">
          View garden <ArrowUpRight size={17} weight="bold" />
        </Link>
      </div>

      <div className={styles.track} aria-label="Carnivorous plant genera">
        {gardenGenera.map((genus) => {
          const cover = getGenusCover(genus);
          return (
            <Link
              key={genus.id}
              className={styles.card}
              href={`/my-carnivorous-garden/#${genus.slug}`}
              aria-label={`Open My Carnivorous Garden at ${genus.scientificName}, ${genus.commonName}`}
            >
              <span className={styles.image}>
                <Image
                  src={cover.src}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 80vw, 290px"
                />
              </span>
              <span className={styles.cardText}>
                <i>{genus.scientificName}</i>
                <small>{genus.commonName}</small>
              </span>
              <ArrowUpRight className={styles.cardArrow} size={19} weight="bold" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
