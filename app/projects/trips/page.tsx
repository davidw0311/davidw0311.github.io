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
import { newZealandTripZh } from "@/data/trips.zh";
import { TripLanguageShell } from "./TripLanguage";
import { TripNav } from "./TripNav";
import { TripText } from "./TripText";
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
    <TripLanguageShell className={styles.page}>
      <a className="skip-link" href="#trip-list">
        <TripText en="Skip to trips" zh="跳到旅行列表" />
      </a>

      <TripNav backHref="/#projects" backLabel="Projects" backLabelZh="项目" />

      <header className={styles.hubHero}>
        <Reveal className={styles.hubHeroCopy}>
          <p className={styles.eyebrow}><TripText en="Travel plans" zh="旅行计划" /></p>
          <h1><TripText en="Trips" zh="旅行" /></h1>
          <p><TripText en="Routes, timings, and the places worth slowing down for." zh="路线、时间，以及值得放慢脚步的地方。" /></p>
          <a className={styles.primaryButton} href="#trip-list">
            <TripText en="Browse trips" zh="浏览旅行" /> <ArrowUpRight size={18} weight="bold" />
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
          <h2 id="trip-list-title"><TripText en="Choose a journey" zh="选择一段旅程" /></h2>
          <p><TripText en="Each trip keeps the practical plan close while leaving room for weather and detours." zh="每段旅程都保留实用计划，也为天气和临时绕行留出空间。" /></p>
        </Reveal>

        <Reveal className={styles.tripFeature} viewportAnchor>
          <Link
            className={styles.tripFeatureImage}
            href={`/projects/trips/${newZealandTrip.slug}/`}
            aria-label={`Open ${newZealandTrip.title} / 打开${newZealandTripZh.title}`}
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
              <span><CalendarBlank size={18} /> <TripText en={newZealandTrip.dateRange} zh={newZealandTripZh.dateRange} /></span>
              <span><MapTrifold size={18} /> <TripText en="South Island" zh="南岛" /></span>
            </div>
            <h3><TripText en={newZealandTrip.title} zh={newZealandTripZh.title} /></h3>
            <p><TripText en={newZealandTrip.description} zh={newZealandTripZh.description} /></p>
            <div className={styles.tripFeatureRoute} aria-label="Trip route">
              <Compass size={20} weight="duotone" />
              <TripText
                en="Queenstown → Milford Sound → Wānaka → Aoraki → Tekapo → Christchurch"
                zh="皇后镇 → 米尔福德峡湾 → 瓦纳卡 → 奥拉基 → 蒂卡波 → 基督城"
              />
            </div>
            <Link className={styles.textLink} href={`/projects/trips/${newZealandTrip.slug}/`}>
              <TripText en="Open itinerary" zh="打开行程" /> <ArrowUpRight size={19} weight="bold" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className={styles.tripFooter}>
        <Link href="/projects/trips/"><TripText en="Trips" zh="旅行" /></Link>
        <Link href="/#about">DYW</Link>
      </footer>
    </TripLanguageShell>
  );
}
