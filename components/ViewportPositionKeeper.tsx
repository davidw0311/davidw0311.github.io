"use client";

import { useEffect } from "react";
import { useScroll } from "motion/react";

const anchorSelector = "[data-viewport-anchor], article, details, section, footer";

type CenterAnchor = {
  element: HTMLElement;
  ratio: number;
};

type ViewportOrientation = "portrait" | "landscape";

type RotationOrigin = {
  anchor: CenterAnchor | null;
  orientation: ViewportOrientation;
  scrollTop: number;
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

function viewportOrientation(): ViewportOrientation {
  const viewport = window.visualViewport;
  return (viewport?.width ?? window.innerWidth) > (viewport?.height ?? window.innerHeight)
    ? "landscape"
    : "portrait";
}

export function ViewportPositionKeeper() {
  const { scrollY } = useScroll();

  useEffect(() => {
    let anchor: CenterAnchor | null = null;
    let orientation = viewportOrientation();
    let rotationOrigin: RotationOrigin | null = null;
    let rotationPending = false;
    let stableScrollTop = window.scrollY;
    let captureBlockedUntil = 0;
    let captureTimer: number | undefined;
    let restoreTimer: number | undefined;
    let captureFrame = 0;
    let restoreFrame = 0;

    const capture = () => {
      if (rotationPending || performance.now() < captureBlockedUntil) return;

      stableScrollTop = window.scrollY;
      anchor = findCenterAnchor();
    };

    const scheduleCapture = () => {
      if (
        rotationPending
        || viewportOrientation() !== orientation
        || performance.now() < captureBlockedUntil
      ) return;

      window.clearTimeout(captureTimer);
      captureTimer = window.setTimeout(capture, 80);
    };

    const trackScrollPosition = () => {
      if (rotationPending || viewportOrientation() !== orientation) return;

      stableScrollTop = window.scrollY;
      window.cancelAnimationFrame(captureFrame);
      captureFrame = window.requestAnimationFrame(capture);
    };

    const alignAnchor = (targetAnchor: CenterAnchor) => {
      if (!targetAnchor.element.isConnected) return;

      const center = viewportCenter();
      const rect = targetAnchor.element.getBoundingClientRect();
      const anchoredPoint = rect.top + rect.height * targetAnchor.ratio;
      const nextScrollTop = window.scrollY + anchoredPoint - center.y;
      window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: "auto" });
    };

    const restore = () => {
      window.clearTimeout(restoreTimer);
      restoreTimer = undefined;

      const origin = rotationOrigin;
      const returningToOrigin = origin?.orientation === orientation;
      const targetAnchor = returningToOrigin ? origin.anchor : anchor;

      if (!returningToOrigin && !targetAnchor?.element.isConnected) {
        rotationPending = false;
        capture();
        return;
      }

      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      restoreFrame = window.requestAnimationFrame(() => {
        if (returningToOrigin) {
          window.scrollTo({ top: origin.scrollTop, behavior: "auto" });
        } else if (targetAnchor) {
          alignAnchor(targetAnchor);
        }

        restoreFrame = window.requestAnimationFrame(() => {
          if (returningToOrigin) {
            window.scrollTo({ top: origin.scrollTop, behavior: "auto" });
          } else if (targetAnchor) {
            alignAnchor(targetAnchor);
          }

          root.style.scrollBehavior = previousBehavior;
          rotationPending = false;
          stableScrollTop = window.scrollY;
          captureBlockedUntil = performance.now() + 600;

          if (returningToOrigin) {
            anchor = origin.anchor;
            rotationOrigin = null;
          }
        });
      });
    };

    const scheduleRestore = (nextOrientation: ViewportOrientation) => {
      const orientationChanged = nextOrientation !== orientation;
      if (!orientationChanged && !rotationPending) return;

      if (orientationChanged) {
        if (!rotationPending && !rotationOrigin) {
          rotationOrigin = {
            anchor,
            orientation,
            scrollTop: stableScrollTop,
          };
        }

        orientation = nextOrientation;
      }

      rotationPending = true;
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(restore, 180);
    };

    const handleResize = () => {
      scheduleRestore(viewportOrientation());
    };

    const handleOrientationChange = () => {
      scheduleRestore(viewportOrientation());
    };

    const resetRotationCycle = () => {
      if (!rotationPending) rotationOrigin = null;
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
    document.addEventListener("pointerdown", resetRotationCycle, { passive: true });
    document.addEventListener("pointerup", scheduleCapture, { passive: true });
    document.addEventListener("touchstart", resetRotationCycle, { passive: true });
    document.addEventListener("touchend", scheduleCapture, { passive: true });
    document.addEventListener("wheel", resetRotationCycle, { passive: true });
    document.addEventListener("keydown", resetRotationCycle);
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
      document.removeEventListener("pointerdown", resetRotationCycle);
      document.removeEventListener("pointerup", scheduleCapture);
      document.removeEventListener("touchstart", resetRotationCycle);
      document.removeEventListener("touchend", scheduleCapture);
      document.removeEventListener("wheel", resetRotationCycle);
      document.removeEventListener("keydown", resetRotationCycle);
      document.removeEventListener("keyup", scheduleCapture);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.screen.orientation?.removeEventListener("change", handleOrientationChange);
    };
  }, [scrollY]);

  return null;
}
