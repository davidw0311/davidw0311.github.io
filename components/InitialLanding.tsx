"use client";

import { useLayoutEffect } from "react";

export function InitialLanding() {
  useLayoutEffect(() => {
    if (window.location.hash || window.scrollY > 24) return;

    const hero = document.getElementById("about");
    if (!hero) return;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: hero.offsetTop, behavior: "auto" });

    requestAnimationFrame(() => {
      root.style.scrollBehavior = previousBehavior;
    });
  }, []);

  return null;
}
