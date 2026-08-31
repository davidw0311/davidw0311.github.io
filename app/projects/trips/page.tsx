import {
  ArrowUpRight,
  CalendarBlank,
  Compass,
  MapTrifold,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { newZealandTrip } from "@/data/trips";
import { TripNav } from "./TripNav";
import styles from "./trips.module.css";

export const metadata: Metadata = {
  title: "Trips",
  description: "Travel plans and day-by-day itineraries from David Yuchen Wang.",
  alternates: { canonical: "/projects/trips/" },
  openGraph: {
    title: "Trips",
    description: "Travel plans and day-by-day itineraries from David Yuchen Wang.",
    images: [
      {
        url: newZealandTrip.heroImage,
        alt: newZealandTrip.heroImageAlt,
      },
    ],
  },
};

export default function TripsPage() {
  return (
    <main className={styles.page}>
      <a className="skip-link" href="#trip-list">
        Skip to trips
      </a>

      <TripNav backHref="/#projects" backLabel="Projects" />

      <header className={styles.hubHero}>
        <Reveal className={styles.hubHeroCopy}>
          <p className={styles.eyebrow}>Travel plans</p>
          <h1>Trips</h1>
          <p>Routes, timings, and the places worth slowing down for.</p>
          <a className={styles.primaryButton} href="#trip-list">
            Browse trips <ArrowUpRight size={18} weight="bold" />
          </a>
        </Reveal>

        <Reveal className={styles.hubHeroImage} delay={0.1}>
          <Image
            src="/assets/generated/trips/new-zealand-2026/tekapo-night.webp"
            alt="The Milky Way above a quiet alpine lake near Lake Tekapo"
            fill
            preload
            sizes="(max-width: 767px) calc(100vw - 32px), 55vw"
          />
        </Reveal>
      </header>

      <section id="trip-list" className={styles.tripList} aria-labelledby="trip-list-title">
        <Reveal className={styles.sectionIntro}>
          <h2 id="trip-list-title">Choose a journey</h2>
          <p>Each trip keeps the practical plan close while leaving room for weather and detours.</p>
        </Reveal>

        <Reveal className={styles.tripFeature} viewportAnchor>
          <Link
            className={styles.tripFeatureImage}
            href={`/projects/trips/${newZealandTrip.slug}/`}
            aria-label={`Open ${newZealandTrip.title}`}
          >
            <Image
              src={newZealandTrip.heroImage}
              alt={newZealandTrip.heroImageAlt}
              fill
              sizes="(max-width: 767px) calc(100vw - 32px), 58vw"
            />
          </Link>

          <div className={styles.tripFeatureCopy}>
            <div className={styles.tripFeatureMeta}>
              <span><CalendarBlank size={18} /> {newZealandTrip.dateRange}</span>
              <span><MapTrifold size={18} /> South Island</span>
            </div>
            <h3>{newZealandTrip.title}</h3>
            <p>{newZealandTrip.description}</p>
            <div className={styles.tripFeatureRoute} aria-label="Trip route">
              <Compass size={20} weight="duotone" />
              <span>Queenstown → Milford Sound → Wānaka → Aoraki → Tekapo → Christchurch</span>
            </div>
            <Link className={styles.textLink} href={`/projects/trips/${newZealandTrip.slug}/`}>
              Open itinerary <ArrowUpRight size={19} weight="bold" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className={styles.tripFooter}>
        <Link href="/projects/trips/">Trips</Link>
        <Link href="/#about">DYW</Link>
      </footer>
    </main>
  );
}
