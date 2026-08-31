"use client";

import { useEffect, useRef, useState } from "react";
import { TripText } from "./TripText";
import styles from "./trips.module.css";

type TripDayNavItem = {
  dayNumber: number;
  date: string;
  dateZh: string;
};

export function TripDayNav({ days }: { days: readonly TripDayNavItem[] }) {
  const [activeDay, setActiveDay] = useState(days[0]?.dayNumber ?? 1);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const daySections = days
      .map((day) => document.getElementById(`day-${day.dayNumber}`))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];

        if (!visibleEntry) {
          return;
        }

        const nextDay = Number(visibleEntry.target.id.replace("day-", ""));
        if (Number.isFinite(nextDay)) {
          setActiveDay(nextDay);
        }
      },
      {
        rootMargin: "-18% 0px -70% 0px",
        threshold: 0,
      },
    );

    daySections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [days]);

  useEffect(() => {
    const nav = navRef.current;
    const activeLink = nav?.querySelector<HTMLElement>(`[data-day="${activeDay}"]`);

    if (!nav || !activeLink || nav.scrollWidth <= nav.clientWidth) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({
      left: activeLink.offsetLeft - nav.clientWidth / 2 + activeLink.clientWidth / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeDay]);

  return (
    <nav ref={navRef} className={styles.dayNav} aria-label="Jump to a day / 跳到指定日期">
      {days.map((day) => (
        <a
          key={day.dayNumber}
          href={`#day-${day.dayNumber}`}
          data-day={day.dayNumber}
          aria-current={activeDay === day.dayNumber ? "step" : undefined}
          aria-label={`Go to day ${day.dayNumber}, ${day.date} / 前往第${day.dayNumber}天，${day.dateZh}`}
        >
          <span>{String(day.dayNumber).padStart(2, "0")}</span>
          <small><TripText en={day.date} zh={day.dateZh} /></small>
        </a>
      ))}
    </nav>
  );
}
