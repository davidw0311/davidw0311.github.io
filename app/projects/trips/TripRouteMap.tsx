"use client";

import { ArrowsOut, MapTrifold, X } from "@phosphor-icons/react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TripMapDay, TripMapPoint } from "@/data/trips.map";
import { useTripLanguage } from "./TripLanguage";
import styles from "./trips.module.css";
import "leaflet/dist/leaflet.css";

type RouteMapProps = {
  days: readonly TripMapDay[];
};

type MapCanvasProps = RouteMapProps & {
  activeDay: number;
  expanded?: boolean;
  language: "en" | "zh";
  overview?: boolean;
};

function uniquePoints(days: readonly TripMapDay[]) {
  const seen = new Set<string>();
  return days.flatMap((day) => [...day.points, ...(day.locations ?? [])]).filter((location) => {
    const key = location.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function appendLocationLabel(
  location: TripMapPoint,
  dayNumber: number,
  language: "en" | "zh",
) {
  const label = document.createElement("span");
  const name = language === "zh" ? location.nameZh : location.name;
  label.textContent = language === "zh" ? `第${dayNumber}天 · ${name}` : `Day ${dayNumber} · ${name}`;
  return label;
}

function MapCanvas({ days, activeDay, expanded = false, language, overview = false }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const routesRef = useRef<LayerGroup | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    async function createMap() {
      try {
        const L = await import("leaflet");
        if (cancelled || !container) return;

        const map = L.map(container, {
          attributionControl: true,
          dragging: expanded,
          doubleClickZoom: expanded,
          scrollWheelZoom: expanded,
          boxZoom: expanded,
          keyboard: expanded,
          zoomControl: expanded,
          tapHold: expanded,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          opacity: expanded ? 0.72 : 0.48,
        }).addTo(map);

        mapRef.current = map;
        routesRef.current = L.layerGroup().addTo(map);

        const initialDay = days[0];
        const initialCoordinates = expanded
          ? days.flatMap((day) => day.points.map((location) => location.coordinates))
          : initialDay.points.map((location) => location.coordinates);
        map.fitBounds(L.latLngBounds(initialCoordinates), {
          padding: expanded ? [42, 42] : [18, 18],
          animate: false,
          maxZoom: expanded ? 10 : 11,
        });
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void createMap();
    return () => {
      cancelled = true;
      routesRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [days, expanded]);

  useEffect(() => {
    let cancelled = false;

    async function drawRoutes() {
      const map = mapRef.current;
      const routeLayers = routesRef.current;
      if (!map || !routeLayers) return;

      const L = await import("leaflet");
      if (cancelled) return;

      routeLayers.clearLayers();
      const active = days.find((day) => day.dayNumber === activeDay) ?? days[0];

      days.forEach((day) => {
        L.polyline(day.points.map((location) => location.coordinates), {
          color: "#55756c",
          weight: expanded ? 2.2 : 1.6,
          opacity: expanded ? 0.45 : 0.38,
          dashArray: day.isFlight ? "5 8" : undefined,
          lineCap: "round",
        }).addTo(routeLayers);
      });

      L.polyline(active.points.map((location) => location.coordinates), {
        color: "#18a97f",
        weight: expanded ? 5 : 4,
        opacity: 0.96,
        dashArray: active.isFlight ? "7 9" : undefined,
        lineCap: "round",
      }).addTo(routeLayers);

      if (expanded) {
        const firstDayForPoint = new Map<string, number>();
        days.forEach((day) => [...day.points, ...(day.locations ?? [])].forEach((location) => {
          if (!firstDayForPoint.has(location.name)) firstDayForPoint.set(location.name, day.dayNumber);
        }));

        uniquePoints(days).forEach((location) => {
          const dayNumber = firstDayForPoint.get(location.name) ?? 1;
          const isActive = [...active.points, ...(active.locations ?? [])]
            .some((point) => point.name === location.name);
          L.circleMarker(location.coordinates, {
            radius: isActive ? 6 : 4,
            color: isActive ? "#e8fff7" : "#d6e5df",
            weight: 1.5,
            fillColor: isActive ? "#18a97f" : "#55756c",
            fillOpacity: isActive ? 1 : 0.72,
          })
            .bindTooltip(appendLocationLabel(location, dayNumber, language), {
              direction: "top",
              offset: [0, -6],
            })
            .addTo(routeLayers);
        });
      } else {
        active.points.forEach((location, index) => {
          L.circleMarker(location.coordinates, {
            radius: index === 0 || index === active.points.length - 1 ? 4.5 : 3,
            color: "#e8fff7",
            weight: 1.2,
            fillColor: "#18a97f",
            fillOpacity: 1,
          }).addTo(routeLayers);
        });
      }

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const focusCoordinates = expanded && overview
        ? days.flatMap((day) => day.points.map((location) => location.coordinates))
        : active.points.map((location) => location.coordinates);

      map.fitBounds(L.latLngBounds(focusCoordinates), {
        padding: expanded ? [42, 42] : [18, 18],
        animate: !prefersReducedMotion,
        duration: prefersReducedMotion ? undefined : 0.65,
        maxZoom: expanded ? 10 : 11,
      });
    }

    void drawRoutes();
    return () => { cancelled = true; };
  }, [activeDay, days, expanded, language, overview, ready]);

  return (
    <div className={styles.routeMapCanvas} ref={containerRef}>
      {failed && (
        <div className={styles.routeMapError} role="status">
          <MapTrifold size={24} weight="duotone" />
          <span>{language === "zh" ? "地图暂时无法加载" : "Map unavailable"}</span>
        </div>
      )}
    </div>
  );
}

export function TripRouteMap({ days }: RouteMapProps) {
  const language = useTripLanguage();
  const [activeDay, setActiveDay] = useState(days[0]?.dayNumber ?? 1);
  const [expanded, setExpanded] = useState(false);
  const [overview, setOverview] = useState(true);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const active = days.find((day) => day.dayNumber === activeDay) ?? days[0];
  const stopCount = useMemo(() => uniquePoints(days).length, [days]);

  useEffect(() => {
    const sections = days
      .map((day) => document.getElementById(`day-${day.dayNumber}`))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
      if (!visible) return;
      const dayNumber = Number(visible.target.id.replace("day-", ""));
      if (Number.isFinite(dayNumber)) setActiveDay(dayNumber);
    }, { rootMargin: "-18% 0px -70% 0px", threshold: 0 });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [days]);

  function openMap() {
    setOverview(true);
    setExpanded(true);
    dialogRef.current?.showModal();
  }

  function closeMap() {
    dialogRef.current?.close();
    setExpanded(false);
  }

  const routeName = language === "zh" ? active.routeZh : active.route;
  const expandLabel = language === "zh" ? "展开完整行程地图" : "Expand the full trip map";

  return (
    <>
      <aside className={styles.routeLens} aria-label={language === "zh" ? "当前行程路线" : "Current itinerary route"}>
        <MapCanvas days={days} activeDay={activeDay} language={language} />
        <div className={styles.routeLensCaption} aria-hidden="true">
          <span>{language === "zh" ? `第${activeDay}天` : `Day ${String(activeDay).padStart(2, "0")}`}</span>
          <strong>{routeName}</strong>
        </div>
        <button type="button" className={styles.routeLensExpand} onClick={openMap} aria-label={expandLabel} title={expandLabel}>
          <ArrowsOut size={17} weight="bold" aria-hidden="true" />
        </button>
      </aside>

      <dialog
        ref={dialogRef}
        className={styles.routeMapDialog}
        aria-labelledby="trip-map-title"
        onClose={() => setExpanded(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMap();
        }}
      >
        <div className={styles.routeMapExpanded}>
          <header className={styles.routeMapHeader}>
            <div>
              <span>{language === "zh" ? `共${stopCount}个行程地点` : `${stopCount} itinerary locations`}</span>
              <h2 id="trip-map-title">{language === "zh" ? "新西兰行程地图" : "New Zealand route map"}</h2>
            </div>
            <button type="button" onClick={closeMap} aria-label={language === "zh" ? "关闭地图" : "Close map"}>
              <X size={22} weight="bold" aria-hidden="true" />
            </button>
          </header>

          <div className={styles.routeMapStage}>
            {expanded && <MapCanvas days={days} activeDay={activeDay} expanded language={language} overview={overview} />}
          </div>

          <nav className={styles.routeMapDays} aria-label={language === "zh" ? "地图日期" : "Map days"}>
            <button
              type="button"
              aria-current={overview ? "page" : undefined}
              onClick={() => setOverview(true)}
            >
              <span>∞</span>
              <small>{language === "zh" ? "完整路线" : "Full route"}</small>
            </button>
            {days.map((day) => (
              <button
                key={day.dayNumber}
                type="button"
                aria-current={!overview && activeDay === day.dayNumber ? "step" : undefined}
                onClick={() => {
                  setActiveDay(day.dayNumber);
                  setOverview(false);
                }}
              >
                <span>{String(day.dayNumber).padStart(2, "0")}</span>
                <small>{language === "zh" ? day.routeZh : day.route}</small>
              </button>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
