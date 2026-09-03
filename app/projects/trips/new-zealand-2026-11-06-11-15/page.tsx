import {
  AirplaneTilt,
  Bed,
  Binoculars,
  CalendarBlank,
  CarProfile,
  Clock,
  CloudSun,
  ForkKnife,
  GlobeHemisphereEast,
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
import { newZealandTripZh, type TripDayTranslation } from "@/data/trips.zh";
import { newZealandTripMapDays } from "@/data/trips.map";
import { TripDayNav } from "../TripDayNav";
import { TripFlightTracker } from "../TripFlightTracker";
import { TripLanguageShell } from "../TripLanguage";
import { TripNav } from "../TripNav";
import { TripRouteMap } from "../TripRouteMap";
import { TripText } from "../TripText";
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
    <TripLanguageShell className={styles.page}>
      <a className="skip-link" href="#daily-plan">
        <TripText en="Skip to daily plan" zh="跳到每日行程" />
      </a>

      <TripNav backHref="/projects/trips/" backLabel="Trips" backLabelZh="旅行" />

      <header className={styles.itineraryHero}>
        <Reveal className={styles.itineraryHeroCopy}>
          <p className={styles.eyebrow}><TripText en={newZealandTrip.region} zh={newZealandTripZh.region} /></p>
          <h1 aria-label={`${newZealandTrip.title} / ${newZealandTripZh.title}`}>
            <span aria-hidden="true"><TripText en="New Zealand" zh="新西兰" /></span>
            <span aria-hidden="true">2026 11.06-11.15</span>
          </h1>
          <p><TripText en={newZealandTrip.description} zh={newZealandTripZh.description} /></p>
          <a className={styles.primaryButton} href="#daily-plan">
            <TripText en="View daily plan" zh="查看每日行程" /> <CalendarBlank size={18} weight="bold" />
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
          <h2 id="route-title"><TripText en="The route, at a glance" zh="路线概览" /></h2>
          <p><TripText en="One overnight flight, two nights each in Queenstown and Te Anau, then an alpine drive north to Christchurch." zh="一趟过夜航班，在皇后镇和蒂阿瑙各住两晚，然后沿高山公路向北前往基督城。" /></p>
        </Reveal>

        <Reveal className={styles.overviewStats} viewportAnchor>
          {newZealandTrip.overview.map((item, index) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span><TripText en={item.label} zh={newZealandTripZh.overview[index].label} /></span>
            </div>
          ))}
        </Reveal>

        <Reveal className={styles.routeTrack} viewportAnchor>
          {newZealandTrip.routeStops.map((stop, index) => (
            <a
              className={styles.routeStop}
              key={stop.place}
              href={stop.mapUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${stop.place} map / ${newZealandTripZh.routeStops[index].place}地图`}
            >
              <MapPin size={21} weight="fill" aria-hidden="true" />
              <strong><TripText en={stop.place} zh={newZealandTripZh.routeStops[index].place} /></strong>
              <span><TripText en={stop.nights} zh={newZealandTripZh.routeStops[index].nights} /></span>
            </a>
          ))}
        </Reveal>
      </section>

      <Reveal className={styles.flightTrackingSection} viewportAnchor>
        <div id="flight-tracking">
          <TripFlightTracker />
        </div>
      </Reveal>

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
          <h2 id="confirm-title"><TripText en="Confirm before departure" zh="出发前请确认" /></h2>
          <p><TripText en="The schedule defines the journey, but it does not include booking references or confirmation status." zh="行程已经确定路线，但没有包含预订编号或确认状态。" /></p>
          <ul>
            {newZealandTrip.detailsMissing.map((detail, index) => (
              <li key={detail}><TripText en={detail} zh={newZealandTripZh.detailsMissing[index]} /></li>
            ))}
          </ul>
          <div className={styles.practicalNotice}>
            <WarningCircle size={21} weight="bold" aria-hidden="true" />
            <span><TripText en="Book Deer Park Heights, Skyline, the Milford Sound cruise, and the noted restaurants before departure." zh="出发前请预订鹿苑高地、Skyline、米尔福德峡湾游船和行程中标注的餐厅。" /></span>
          </div>
        </Reveal>
      </section>

      <section id="daily-plan" className={styles.timelineSection} aria-labelledby="daily-plan-title">
        <Reveal className={styles.timelineHeader}>
          <h2 id="daily-plan-title"><TripText en="Day by day" zh="每日行程" /></h2>
          <p><TripText en="Times stay exact where the source provides them. Weather-dependent options remain clearly marked." zh="原始行程提供的时间会保持不变，需要看天气的选项也会清楚标注。" /></p>
        </Reveal>

        <div className={styles.dayMapToolbar}>
          <TripDayNav
            days={newZealandTrip.days.map((day, index) => ({
              dayNumber: day.dayNumber,
              date: day.date,
              dateZh: newZealandTripZh.days[index].date,
            }))}
          />
          <TripRouteMap days={newZealandTripMapDays} />
        </div>

        <JourneyChapter title="Arrival and Fiordland" titleZh="抵达与峡湾地区" days={firstChapter} translations={newZealandTripZh.days.slice(0, 5)} />
        <JourneyChapter title="The alpine road north" titleZh="沿高山公路向北" days={secondChapter} translations={newZealandTripZh.days.slice(5)} />
      </section>

      <section className={styles.sourceNotes} aria-labelledby="notes-title">
        <Reveal className={styles.sourceNotesInner} viewportAnchor>
          <MapTrifold size={34} weight="duotone" aria-hidden="true" />
          <h2 id="notes-title"><TripText en="Use the schedule as a framework" zh="把行程作为灵活框架" /></h2>
          <p><TripText en="Weather and seasonal opening hours can change the best order around Aoraki and Tekapo. Keep the alpine days flexible." zh="天气和季节性营业时间可能改变奥拉基和蒂卡波周边的最佳顺序，请灵活安排高山路段。" /></p>
          <ul>
            {newZealandTrip.sourceNotes.map((note, index) => (
              <li key={note}><TripText en={note} zh={newZealandTripZh.sourceNotes[index]} /></li>
            ))}
          </ul>
        </Reveal>
      </section>

      <footer className={styles.tripFooter}>
        <Link href="/projects/trips/"><TripText en="Trips" zh="旅行" /></Link>
        <span><TripText en={newZealandTrip.dateRange} zh={newZealandTripZh.dateRange} /></span>
        <Link href="/#about">DYW</Link>
      </footer>
    </TripLanguageShell>
  );
}

function JourneyChapter({
  title,
  titleZh,
  days,
  translations,
}: {
  title: string;
  titleZh: string;
  days: readonly TripDay[];
  translations: readonly TripDayTranslation[];
}) {
  return (
    <div className={styles.journeyChapter}>
      <Reveal className={styles.chapterHeading}>
        <h3><TripText en={title} zh={titleZh} /></h3>
      </Reveal>
      {days.map((day, index) => (
        <DayPlan key={day.dayNumber} day={day} translation={translations[index]} />
      ))}
    </div>
  );
}

function DayPlan({ day, translation }: { day: TripDay; translation: TripDayTranslation }) {
  const image = day.dayNumber === 5
    ? {
        src: "/assets/generated/trips/new-zealand-2026/milford-sound.webp",
        alt: "Mitre Peak and waterfalls seen from the water at Milford Sound",
        caption: { en: "Milford Sound after rain", zh: "雨后的米尔福德峡湾" },
        portrait: true,
      }
    : day.dayNumber === 8
      ? {
          src: "/assets/generated/trips/new-zealand-2026/tekapo-night.webp",
          alt: "The Milky Way above a mountain lake near Lake Tekapo",
          caption: { en: "Clear-sky option at Lake Tekapo", zh: "蒂卡波湖晴夜观星选项" },
          portrait: false,
        }
      : null;

  return (
    <Reveal className={styles.dayReveal} viewportAnchor>
      <article id={`day-${day.dayNumber}`} className={styles.day}>
        <div className={styles.dayStamp}>
          <span><TripText en={`Day ${day.dayNumber}`} zh={`第${day.dayNumber}天`} /></span>
          <time dateTime={day.dateTime}><TripText en={day.date} zh={translation.date} /></time>
          <small><TripText en={day.weekday} zh={translation.weekday} /></small>
        </div>

        <div>
          <header className={styles.dayHeader}>
            <h3><TripText en={day.route} zh={translation.route} /></h3>
            <div className={styles.dayMeta}>
              {day.stay && (
                <span><Bed size={18} weight="duotone" /> <TripText en={day.stay} zh={translation.stay ?? day.stay} /></span>
              )}
              {day.drive && (
                <span><Clock size={18} weight="duotone" /> <TripText en={day.drive} zh={translation.drive ?? day.drive} /></span>
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
                  <strong><TripText en={item.title} zh={translation.items[index].title} /></strong>
                  {item.detail && <p><TripText en={item.detail} zh={translation.items[index].detail ?? item.detail} /></p>}
                  {item.links && (
                    <div className={styles.scheduleLinks}>
                      {item.links.map((link) => (
                        <a
                          key={`${link.kind}-${link.label}`}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.kind === "map"
                            ? <MapPin size={15} weight="fill" aria-hidden="true" />
                            : <GlobeHemisphereEast size={15} weight="bold" aria-hidden="true" />}
                          <TripText en={link.label} zh={link.labelZh} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {image && (
            <figure className={image.portrait ? styles.dayMediaPortrait : styles.dayMediaLandscape}>
              <div>
                <Image src={image.src} alt={image.alt} fill sizes="(max-width: 767px) calc(100vw - 32px), 48vw" />
              </div>
              <figcaption><TripText en={image.caption.en} zh={image.caption.zh} /></figcaption>
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
    case "food":
      return <ForkKnife {...props} />;
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
