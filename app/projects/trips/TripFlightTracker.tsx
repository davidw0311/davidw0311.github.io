"use client";

import { AirplaneTilt, ArrowSquareOut, Broadcast } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useTripLanguage } from "./TripLanguage";
import styles from "./trips.module.css";

type Flight = {
  number: string;
  trackerNumber: string;
  departure: {
    airport: string;
    airportZh: string;
    code: string;
    date: string;
    dateZh: string;
    dateTime: string;
    terminal?: string;
    time: string;
  };
  arrival: {
    airport: string;
    airportZh: string;
    code: string;
    date: string;
    dateZh: string;
    dateTime: string;
    terminal?: string;
    time: string;
  };
  aircraft: string;
  service: string;
  serviceZh: string;
};

const flights: readonly Flight[] = [
  {
    number: "NZ283",
    trackerNumber: "ANZ283",
    departure: {
      airport: "Singapore Changi",
      airportZh: "新加坡樟宜机场",
      code: "SIN",
      date: "6 Nov",
      dateZh: "11月6日",
      dateTime: "2026-11-06T18:40:00+08:00",
      terminal: "T3",
      time: "18:40",
    },
    arrival: {
      airport: "Auckland",
      airportZh: "奥克兰机场",
      code: "AKL",
      date: "7 Nov",
      dateZh: "11月7日",
      dateTime: "2026-11-07T09:35:00+13:00",
      terminal: "I",
      time: "09:35",
    },
    aircraft: "Boeing 777-300ER",
    service: "Economy, meal",
    serviceZh: "经济舱，含餐",
  },
  {
    number: "NZ623",
    trackerNumber: "ANZ623",
    departure: {
      airport: "Auckland",
      airportZh: "奥克兰机场",
      code: "AKL",
      date: "7 Nov",
      dateZh: "11月7日",
      dateTime: "2026-11-07T14:40:00+13:00",
      terminal: "D",
      time: "14:40",
    },
    arrival: {
      airport: "Queenstown",
      airportZh: "皇后镇机场",
      code: "ZQN",
      date: "7 Nov",
      dateZh: "11月7日",
      dateTime: "2026-11-07T16:35:00+13:00",
      time: "16:35",
    },
    aircraft: "Airbus A320",
    service: "Economy, snacks",
    serviceZh: "经济舱，含小食",
  },
  {
    number: "NZ064",
    trackerNumber: "ANZ64",
    departure: {
      airport: "Christchurch",
      airportZh: "基督城国际机场",
      code: "CHC",
      date: "15 Nov",
      dateZh: "11月15日",
      dateTime: "2026-11-15T17:05:00+13:00",
      time: "17:05",
    },
    arrival: {
      airport: "Singapore Changi",
      airportZh: "新加坡樟宜机场",
      code: "SIN",
      date: "15 Nov",
      dateZh: "11月15日",
      dateTime: "2026-11-15T22:40:00+08:00",
      terminal: "T3",
      time: "22:40",
    },
    aircraft: "Boeing 787-9",
    service: "Economy, meal",
    serviceZh: "经济舱，含餐",
  },
] as const;

type FlightPhase = "scheduled" | "live" | "history";

function flightPhase(flight: Flight, now: number | null): FlightPhase {
  if (now === null) return "scheduled";
  const departure = new Date(flight.departure.dateTime).getTime();
  const arrival = new Date(flight.arrival.dateTime).getTime();
  if (now > arrival + 12 * 60 * 60 * 1000) return "history";
  if (now >= departure - 48 * 60 * 60 * 1000) return "live";
  return "scheduled";
}

export function TripFlightTracker() {
  const language = useTripLanguage();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className={styles.flightTracker}>
      <header className={styles.flightTrackerHeader}>
        <Broadcast size={28} weight="duotone" aria-hidden="true" />
        <div>
          <h2>{language === "zh" ? "航班实时追踪" : "Live flight tracking"}</h2>
          <p>
            {language === "zh"
              ? "新西兰航空会在起飞前48小时开放官方实时状态；FlightAware 提供航线地图和飞行记录。"
              : "Air New Zealand opens official live status 48 hours before departure. FlightAware provides the route map and flight history."}
          </p>
        </div>
      </header>

      <div className={styles.flightJourneyGrid}>
        <FlightJourney
          flights={flights.slice(0, 2)}
          label={language === "zh" ? "去程 · 11月6日至7日" : "Outbound · 6-7 Nov"}
          language={language}
          now={now}
        />
        <FlightJourney
          flights={flights.slice(2)}
          label={language === "zh" ? "返程 · 11月15日" : "Return · 15 Nov"}
          language={language}
          now={now}
        />
      </div>
    </div>
  );
}

function FlightJourney({
  flights: journeyFlights,
  label,
  language,
  now,
}: {
  flights: readonly Flight[];
  label: string;
  language: "en" | "zh";
  now: number | null;
}) {
  return (
    <section className={styles.flightJourney} aria-label={label}>
      <h3>{label}</h3>
      <ol>
        {journeyFlights.map((flight) => {
          const phase = flightPhase(flight, now);
          const status = phase === "live"
            ? (language === "zh" ? "可查看实时状态" : "Live status available")
            : phase === "history"
              ? (language === "zh" ? "飞行记录" : "Flight history")
              : (language === "zh" ? "已排期" : "Scheduled");
          const trackerLabel = phase === "live"
            ? (language === "zh" ? "打开实时地图" : "Open live map")
            : phase === "history"
              ? (language === "zh" ? "查看飞行记录" : "View flight history")
              : (language === "zh" ? "查看航线与排期" : "View route and schedule");

          return (
            <li key={flight.number}>
              <header>
                <span className={styles.flightNumber}><AirplaneTilt size={17} weight="fill" aria-hidden="true" /> {flight.number}</span>
                <span className={styles.flightStatus} data-phase={phase} aria-live="polite">{status}</span>
              </header>

              <div className={styles.flightRoute}>
                <FlightEndpoint endpoint={flight.departure} language={language} />
                <span aria-hidden="true" />
                <FlightEndpoint endpoint={flight.arrival} language={language} />
              </div>

              <p className={styles.flightMeta}>
                <span>Air New Zealand</span>
                <span>{flight.aircraft}</span>
                <span>{language === "zh" ? flight.serviceZh : flight.service}</span>
              </p>

              <div className={styles.flightActions}>
                <a href="https://www.airnewzealand.com/en-nz/flight-status" target="_blank" rel="noreferrer">
                  {language === "zh" ? `新西兰航空状态 · 搜索 ${flight.number}` : `Air NZ status · Search ${flight.number}`}
                  <ArrowSquareOut size={15} weight="bold" aria-hidden="true" />
                </a>
                <a href={`https://www.flightaware.com/live/flight/${flight.trackerNumber}`} target="_blank" rel="noreferrer">
                  {trackerLabel}
                  <ArrowSquareOut size={15} weight="bold" aria-hidden="true" />
                </a>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function FlightEndpoint({ endpoint, language }: { endpoint: Flight["departure"]; language: "en" | "zh" }) {
  return (
    <div>
      <strong>{endpoint.code}</strong>
      <time dateTime={endpoint.dateTime}>{endpoint.time}</time>
      <span>{language === "zh" ? endpoint.dateZh : endpoint.date}</span>
      <small>{language === "zh" ? endpoint.airportZh : endpoint.airport}{endpoint.terminal ? ` · ${endpoint.terminal}` : ""}</small>
    </div>
  );
}
