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

      <TripNav backHref="/#space" backLabel="Space" backLabelZh="未来空间" />

      <header className={styles.hubIntro}>
        <Reveal className={styles.hubIntroCopy}>
          <p className={styles.eyebrow}><TripText en="Travel plans" zh="旅行计划" /></p>
          <h1><TripText en="Trips" zh="旅行" /></h1>
          <p><TripText en="Routes, timings, and the places worth slowing down for." zh="路线、时间，以及值得放慢脚步的地方。" /></p>
        </Reveal>
      </header>

      <section id="trip-list" className={styles.tripList} aria-label="Trips / 旅行">
        <Reveal className={styles.tripFeature} viewportAnchor>
          <Link
            className={styles.tripFeatureCard}
            href={`/projects/trips/${newZealandTrip.slug}/`}
            aria-label={`Open ${newZealandTrip.title} / 打开${newZealandTripZh.title}`}
          >
            <div className={styles.tripFeatureImage}>
              <Image
                src={newZealandTrip.heroImage}
                alt={newZealandTrip.heroImageAlt}
                fill
                preload
                sizes="(max-width: 767px) calc(100vw - 32px), 58vw"
              />
            </div>

            <div className={styles.tripFeatureCopy}>
              <div className={styles.tripFeatureMeta}>
                <span><CalendarBlank size={18} /> <TripText en={newZealandTrip.dateRange} zh={newZealandTripZh.dateRange} /></span>
                <span><MapTrifold size={18} /> <TripText en="South Island" zh="南岛" /></span>
              </div>
              <h2><TripText en={newZealandTrip.title} zh={newZealandTripZh.title} /></h2>
              <p><TripText en={newZealandTrip.description} zh={newZealandTripZh.description} /></p>
              <div className={styles.tripFeatureRoute} aria-label="Trip route">
                <Compass size={20} weight="duotone" />
                <TripText
                  en="Queenstown → Milford Sound → Wānaka → Aoraki → Tekapo → Christchurch"
                  zh="皇后镇 → 米尔福德峡湾 → 瓦纳卡 → 奥拉基 → 蒂卡波 → 基督城"
                />
              </div>
              <span className={styles.textLink}>
                <TripText en="Open itinerary" zh="打开行程" /> <ArrowUpRight size={19} weight="bold" />
              </span>
            </div>
          </Link>
        </Reveal>
      </section>

      <footer className={styles.tripFooter}>
        <Link href="/projects/trips/"><TripText en="Trips" zh="旅行" /></Link>
        <Link href="/#about">DYW</Link>
      </footer>
    </TripLanguageShell>
  );
}
