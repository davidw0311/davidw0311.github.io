"use client";

import { useEffect } from "react";
import { useScroll } from "motion/react";

const anchorSelector = "[data-viewport-anchor], article, details, section, footer";

type CenterAnchor = {
  element: HTMLElement;
  ratio: number;
};

function viewportCenter() {
  const viewport = window.visualViewport;

  return {
    x: (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) / 2,
    y: (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) / 2,
  };
}

function findCenterAnchor(): CenterAnchor | null {
  const center = viewportCenter();
  const target = document.elementFromPoint(center.x, center.y);
  let element = target?.closest<HTMLElement>(anchorSelector) ?? null;

  if (!element) {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(anchorSelector));
    element = candidates.reduce<HTMLElement | null>((closest, candidate) => {
      const candidateRect = candidate.getBoundingClientRect();
      const candidateDistance = Math.abs(candidateRect.top + candidateRect.height / 2 - center.y);

      if (!closest) return candidate;

      const closestRect = closest.getBoundingClientRect();
      const closestDistance = Math.abs(closestRect.top + closestRect.height / 2 - center.y);
      return candidateDistance < closestDistance ? candidate : closest;
    }, null);
  }

  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (rect.height <= 0) return null;

  return {
    element,
    ratio: Math.min(1, Math.max(0, (center.y - rect.top) / rect.height)),
  };
}

function isLandscape() {
  const viewport = window.visualViewport;
  return (viewport?.width ?? window.innerWidth) > (viewport?.height ?? window.innerHeight);
}

export function ViewportPositionKeeper() {
  const { scrollY } = useScroll();

  useEffect(() => {
    let anchor: CenterAnchor | null = null;
    let landscape = isLandscape();
    let rotationPending = false;
    let captureTimer: number | undefined;
    let restoreTimer: number | undefined;
    let captureFrame = 0;
    let restoreFrame = 0;

    const capture = () => {
      if (!rotationPending) anchor = findCenterAnchor();
    };

    const scheduleCapture = () => {
      if (rotationPending || isLandscape() !== landscape) return;

      window.clearTimeout(captureTimer);
      captureTimer = window.setTimeout(capture, 80);
    };

    const trackScrollPosition = () => {
      if (rotationPending || isLandscape() !== landscape) return;

      window.cancelAnimationFrame(captureFrame);
      captureFrame = window.requestAnimationFrame(capture);
    };

    const alignAnchor = () => {
      if (!anchor?.element.isConnected) return;

      const center = viewportCenter();
      const rect = anchor.element.getBoundingClientRect();
      const anchoredPoint = rect.top + rect.height * anchor.ratio;
      const nextScrollTop = window.scrollY + anchoredPoint - center.y;
      window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: "auto" });
    };

    const restore = () => {
      window.clearTimeout(restoreTimer);
      restoreTimer = undefined;

      if (!anchor?.element.isConnected) {
        rotationPending = false;
        capture();
        return;
      }

      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      restoreFrame = window.requestAnimationFrame(() => {
        alignAnchor();
        restoreFrame = window.requestAnimationFrame(() => {
          alignAnchor();
          root.style.scrollBehavior = previousBehavior;
          rotationPending = false;
          capture();
        });
      });
    };

    const scheduleRestore = () => {
      rotationPending = true;
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(restore, 180);
    };

    const handleResize = () => {
      const nextLandscape = isLandscape();

      if (nextLandscape !== landscape) {
        landscape = nextLandscape;
        scheduleRestore();
      } else if (rotationPending) {
        scheduleRestore();
      }
    };

    const handleOrientationChange = () => {
      landscape = isLandscape();
      scheduleRestore();
    };

    const initialFrame = window.requestAnimationFrame(() => {
      restoreFrame = window.requestAnimationFrame(capture);
    });
    const stopTrackingScroll = scrollY.on("change", trackScrollPosition);
    const anchorObserver = new IntersectionObserver(scheduleCapture, {
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    document.querySelectorAll<HTMLElement>(anchorSelector).forEach((element) => anchorObserver.observe(element));
    const viewportObserver = new ResizeObserver(handleResize);
    viewportObserver.observe(document.documentElement);

    document.addEventListener("scrollend", scheduleCapture, { passive: true });
    document.addEventListener("pointerup", scheduleCapture, { passive: true });
    document.addEventListener("touchend", scheduleCapture, { passive: true });
    document.addEventListener("keyup", scheduleCapture);
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, { passive: true });
    window.visualViewport?.addEventListener("resize", handleResize, { passive: true });
    window.screen.orientation?.addEventListener("change", handleOrientationChange);

    return () => {
      window.clearTimeout(captureTimer);
      window.clearTimeout(restoreTimer);
      stopTrackingScroll();
      anchorObserver.disconnect();
      viewportObserver.disconnect();
      window.cancelAnimationFrame(captureFrame);
      window.cancelAnimationFrame(initialFrame);
      window.cancelAnimationFrame(restoreFrame);
      document.removeEventListener("scrollend", scheduleCapture);
      document.removeEventListener("pointerup", scheduleCapture);
      document.removeEventListener("touchend", scheduleCapture);
      document.removeEventListener("keyup", scheduleCapture);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.screen.orientation?.removeEventListener("change", handleOrientationChange);
    };
  }, [scrollY]);

  return null;
}
