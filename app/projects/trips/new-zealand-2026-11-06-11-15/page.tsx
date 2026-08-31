import {
  AirplaneTilt,
  Bed,
  Binoculars,
  CalendarBlank,
  CarProfile,
  Clock,
  CloudSun,
  MapPin,
  MapTrifold,
  PersonSimpleHike,
  Ticket,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import {
  newZealandTrip,
  type TripDay,
  type TripItemKind,
} from "@/data/trips";
import { TripNav } from "../TripNav";
import styles from "../trips.module.css";

export const metadata: Metadata = {
  title: newZealandTrip.title,
  description: newZealandTrip.description,
  alternates: {
    canonical: `/projects/trips/${newZealandTrip.slug}/`,
  },
  openGraph: {
    title: newZealandTrip.title,
    description: newZealandTrip.description,
    images: [
      {
        url: newZealandTrip.heroImage,
        alt: newZealandTrip.heroImageAlt,
      },
    ],
  },
};

export default function NewZealandTripPage() {
  const firstChapter = newZealandTrip.days.slice(0, 5);
  const secondChapter = newZealandTrip.days.slice(5);

  return (
    <main className={styles.page}>
      <a className="skip-link" href="#daily-plan">
        Skip to daily plan
      </a>

      <TripNav backHref="/projects/trips/" backLabel="Trips" />

      <header className={styles.itineraryHero}>
        <Reveal className={styles.itineraryHeroCopy}>
          <p className={styles.eyebrow}>{newZealandTrip.region}</p>
          <h1 aria-label={newZealandTrip.title}>
            <span aria-hidden="true">New Zealand</span>
            <span aria-hidden="true">2026 11.06-11.15</span>
          </h1>
          <p>{newZealandTrip.description}</p>
          <a className={styles.primaryButton} href="#daily-plan">
            View daily plan <CalendarBlank size={18} weight="bold" />
          </a>
        </Reveal>

        <Reveal className={styles.itineraryHeroImage} delay={0.1}>
          <Image
            src={newZealandTrip.heroImage}
            alt={newZealandTrip.heroImageAlt}
            fill
            preload
            sizes="(max-width: 767px) calc(100vw - 32px), 56vw"
          />
        </Reveal>
      </header>

      <section className={styles.routeOverview} aria-labelledby="route-title">
        <Reveal className={styles.sectionIntro}>
          <h2 id="route-title">The route, at a glance</h2>
          <p>One overnight flight, three Queenstown nights, and a northbound alpine drive to Christchurch.</p>
        </Reveal>

        <Reveal className={styles.overviewStats} viewportAnchor>
          {newZealandTrip.overview.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </Reveal>

        <Reveal className={styles.routeTrack} viewportAnchor>
          {newZealandTrip.routeStops.map((stop) => (
            <div className={styles.routeStop} key={stop.place}>
              <MapPin size={21} weight="fill" aria-hidden="true" />
              <strong>{stop.place}</strong>
              <span>{stop.nights}</span>
            </div>
          ))}
        </Reveal>
      </section>

      <section className={styles.practical} aria-labelledby="confirm-title">
        <Reveal className={styles.practicalImage} viewportAnchor>
          <Image
            src="/assets/generated/trips/new-zealand-2026/milford-sound.webp"
            alt="Rainforest cliffs and waterfalls rising above Milford Sound"
            fill
            sizes="(max-width: 767px) calc(100vw - 32px), 42vw"
          />
        </Reveal>

        <Reveal className={styles.practicalCopy} delay={0.08} viewportAnchor>
          <Ticket size={30} weight="duotone" aria-hidden="true" />
          <h2 id="confirm-title">Confirm before departure</h2>
          <p>The schedule defines the journey, but it does not include booking references or confirmation status.</p>
          <ul>
            {newZealandTrip.detailsMissing.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <div className={styles.practicalNotice}>
            <WarningCircle size={21} weight="bold" aria-hidden="true" />
            <span>Reserve an early Milford Sound sailing if possible. The exact cruise time is still open.</span>
          </div>
        </Reveal>
      </section>

      <section id="daily-plan" className={styles.timelineSection} aria-labelledby="daily-plan-title">
        <Reveal className={styles.timelineHeader}>
          <h2 id="daily-plan-title">Day by day</h2>
          <p>Times stay exact where the source provides them. Weather-dependent options remain clearly marked.</p>
        </Reveal>

        <nav className={styles.dayNav} aria-label="Jump to a day">
          {newZealandTrip.days.map((day) => (
            <a key={day.dayNumber} href={`#day-${day.dayNumber}`} aria-label={`Go to day ${day.dayNumber}, ${day.date}`}>
              <span>{String(day.dayNumber).padStart(2, "0")}</span>
              <small>{day.date}</small>
            </a>
          ))}
        </nav>

        <JourneyChapter title="Arrival and Fiordland" days={firstChapter} />
        <JourneyChapter title="The alpine road north" days={secondChapter} />
      </section>

      <section className={styles.sourceNotes} aria-labelledby="notes-title">
        <Reveal className={styles.sourceNotesInner} viewportAnchor>
          <MapTrifold size={34} weight="duotone" aria-hidden="true" />
          <h2 id="notes-title">Use the schedule as a framework</h2>
          <p>Local weather can change the best order around Aoraki and Tekapo. Keep the clear-sky options flexible.</p>
          <ul>
            {newZealandTrip.sourceNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Reveal>
      </section>

      <footer className={styles.tripFooter}>
        <Link href="/projects/trips/">Trips</Link>
        <span>{newZealandTrip.dateRange}</span>
        <Link href="/#about">DYW</Link>
      </footer>
    </main>
  );
}

function JourneyChapter({ title, days }: { title: string; days: readonly TripDay[] }) {
  return (
    <div className={styles.journeyChapter}>
      <Reveal className={styles.chapterHeading}>
        <h3>{title}</h3>
      </Reveal>
      {days.map((day) => (
        <DayPlan key={day.dayNumber} day={day} />
      ))}
    </div>
  );
}

function DayPlan({ day }: { day: TripDay }) {
  const image = day.dayNumber === 5
    ? {
        src: "/assets/generated/trips/new-zealand-2026/milford-sound.webp",
        alt: "Mitre Peak and waterfalls seen from the water at Milford Sound",
        caption: "Milford Sound after rain",
        portrait: true,
      }
    : day.dayNumber === 8
      ? {
          src: "/assets/generated/trips/new-zealand-2026/tekapo-night.webp",
          alt: "The Milky Way above a mountain lake near Lake Tekapo",
          caption: "Clear-sky option at Lake Tekapo",
          portrait: false,
        }
      : null;

  return (
    <Reveal className={styles.dayReveal} viewportAnchor>
      <article id={`day-${day.dayNumber}`} className={styles.day}>
        <div className={styles.dayStamp}>
          <span>Day {day.dayNumber}</span>
          <time dateTime={day.dateTime}>{day.date}</time>
          <small>{day.weekday}</small>
        </div>

        <div>
          <header className={styles.dayHeader}>
            <h3>{day.route}</h3>
            <div className={styles.dayMeta}>
              {day.stay && (
                <span><Bed size={18} weight="duotone" /> {day.stay}</span>
              )}
              {day.drive && (
                <span><Clock size={18} weight="duotone" /> {day.drive}</span>
              )}
            </div>
          </header>

          <ol className={styles.schedule}>
            {day.items.map((item, index) => (
              <li key={`${item.title}-${index}`} className={item.kind === "warning" ? styles.scheduleWarning : undefined}>
                <span className={styles.scheduleIcon} aria-hidden="true">
                  <TripItemIcon kind={item.kind} />
                </span>
                {item.time && <time className={styles.scheduleTime}>{item.time}</time>}
                <div>
                  <strong>{item.title}</strong>
                  {item.detail && <p>{item.detail}</p>}
                </div>
              </li>
            ))}
          </ol>

          {image && (
            <figure className={image.portrait ? styles.dayMediaPortrait : styles.dayMediaLandscape}>
              <div>
                <Image src={image.src} alt={image.alt} fill sizes="(max-width: 767px) calc(100vw - 32px), 48vw" />
              </div>
              <figcaption>{image.caption}</figcaption>
            </figure>
          )}
        </div>
      </article>
    </Reveal>
  );
}

function TripItemIcon({ kind }: { kind: TripItemKind }) {
  const props = { size: 20, weight: "duotone" as const };

  switch (kind) {
    case "flight":
      return <AirplaneTilt {...props} />;
    case "drive":
      return <CarProfile {...props} />;
    case "stop":
      return <MapPin {...props} />;
    case "warning":
      return <WarningCircle {...props} />;
    case "weather":
      return <CloudSun {...props} />;
    case "activity":
      return <PersonSimpleHike {...props} />;
    default:
      return <Binoculars {...props} />;
  }
}
