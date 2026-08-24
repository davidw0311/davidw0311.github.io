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
    let userScrollActive = false;
    let correctionDeadline = 0;
    let correctionTimer: number | undefined;
    let userIdleTimer: number | undefined;
    let captureFrame = 0;
    let restoreFrame = 0;

    const capture = () => {
      if (rotationPending) return;

      stableScrollTop = window.scrollY;
      anchor = findCenterAnchor();
    };

    const finishUserScroll = () => {
      if (!userScrollActive) return;

      window.clearTimeout(userIdleTimer);
      userScrollActive = false;
      capture();
    };

    const scheduleUserIdle = () => {
      window.clearTimeout(userIdleTimer);
      userIdleTimer = window.setTimeout(finishUserScroll, 320);
    };

    const scheduleCapture = () => {
      if (
        !userScrollActive
        || rotationPending
        || viewportOrientation() !== orientation
      ) return;

      window.cancelAnimationFrame(captureFrame);
      captureFrame = window.requestAnimationFrame(capture);
    };

    const trackScrollPosition = () => {
      // Safari changes scrollY while rotating, before all orientation and resize
      // events have fired. Only genuine user-driven scrolling may replace the
      // stable position used as the rotation origin.
      if (
        !userScrollActive
        || rotationPending
        || viewportOrientation() !== orientation
      ) return;

      stableScrollTop = window.scrollY;
      scheduleCapture();
      scheduleUserIdle();
    };

    const alignAnchor = (targetAnchor: CenterAnchor) => {
      if (!targetAnchor.element.isConnected) return;

      const center = viewportCenter();
      const rect = targetAnchor.element.getBoundingClientRect();
      const anchoredPoint = rect.top + rect.height * targetAnchor.ratio;
      const nextScrollTop = window.scrollY + anchoredPoint - center.y;
      window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: "auto" });
    };

    const restoreCurrentTarget = () => {
      const origin = rotationOrigin;
      const returningToOrigin = origin?.orientation === orientation;
      const targetAnchor = returningToOrigin ? origin.anchor : anchor;

      if (!returningToOrigin && !targetAnchor?.element.isConnected) return;

      const root = document.documentElement;
      const previousBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      if (returningToOrigin) {
        window.scrollTo({ top: origin.scrollTop, behavior: "auto" });
      } else if (targetAnchor) {
        alignAnchor(targetAnchor);
      }

      root.style.scrollBehavior = previousBehavior;
    };

    const finishRotation = () => {
      const origin = rotationOrigin;
      const returningToOrigin = origin?.orientation === orientation;

      window.cancelAnimationFrame(restoreFrame);
      restoreFrame = window.requestAnimationFrame(() => {
        restoreCurrentTarget();
        restoreFrame = window.requestAnimationFrame(() => {
          restoreCurrentTarget();
          rotationPending = false;
          stableScrollTop = window.scrollY;

          if (returningToOrigin) {
            anchor = origin.anchor;
            rotationOrigin = null;
          } else {
            anchor = findCenterAnchor();
          }
        });
      });
    };

    const correctThroughSafariSettling = () => {
      correctionTimer = undefined;
      if (!rotationPending) return;

      restoreCurrentTarget();

      if (performance.now() < correctionDeadline) {
        correctionTimer = window.setTimeout(correctThroughSafariSettling, 120);
      } else {
        finishRotation();
      }
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
        correctionDeadline = performance.now() + 1200;
      }

      rotationPending = true;
      window.clearTimeout(correctionTimer);
      correctionTimer = window.setTimeout(correctThroughSafariSettling, 120);
    };

    const handleResize = () => {
      scheduleRestore(viewportOrientation());
    };

    const handleOrientationChange = () => {
      scheduleRestore(viewportOrientation());
    };

    const beginUserScroll = () => {
      window.clearTimeout(correctionTimer);
      window.cancelAnimationFrame(restoreFrame);
      rotationPending = false;
      rotationOrigin = null;
      userScrollActive = true;
      orientation = viewportOrientation();
      capture();
      scheduleUserIdle();
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

    document.addEventListener("scrollend", finishUserScroll, { passive: true });
    document.addEventListener("pointerdown", beginUserScroll, { passive: true });
    document.addEventListener("pointerup", scheduleUserIdle, { passive: true });
    document.addEventListener("touchstart", beginUserScroll, { passive: true });
    document.addEventListener("touchend", scheduleUserIdle, { passive: true });
    document.addEventListener("wheel", beginUserScroll, { passive: true });
    document.addEventListener("keydown", beginUserScroll);
    document.addEventListener("keyup", scheduleUserIdle);
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientationChange, { passive: true });
    window.visualViewport?.addEventListener("resize", handleResize, { passive: true });
    window.screen.orientation?.addEventListener("change", handleOrientationChange);

    return () => {
      window.clearTimeout(correctionTimer);
      window.clearTimeout(userIdleTimer);
      stopTrackingScroll();
      anchorObserver.disconnect();
      viewportObserver.disconnect();
      window.cancelAnimationFrame(captureFrame);
      window.cancelAnimationFrame(initialFrame);
      window.cancelAnimationFrame(restoreFrame);
      document.removeEventListener("scrollend", finishUserScroll);
      document.removeEventListener("pointerdown", beginUserScroll);
      document.removeEventListener("pointerup", scheduleUserIdle);
      document.removeEventListener("touchstart", beginUserScroll);
      document.removeEventListener("touchend", scheduleUserIdle);
      document.removeEventListener("wheel", beginUserScroll);
      document.removeEventListener("keydown", beginUserScroll);
      document.removeEventListener("keyup", scheduleUserIdle);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.screen.orientation?.removeEventListener("change", handleOrientationChange);
    };
  }, [scrollY]);

  return null;
}
