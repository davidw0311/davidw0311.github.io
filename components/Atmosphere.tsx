"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

export function Atmosphere() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.5 });
  const drift = useTransform(progress, [0, 1], ["0vh", "24vh"]);
  const fade = useTransform(progress, [0.08, 0.22, 0.88], [0, 0.65, 0.18]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="atmosphere-particles"
        style={reduceMotion ? undefined : { y: drift, opacity: fade }}
      />
      <div className="depth-rail" aria-hidden="true">
        <span>Surface</span>
        <span className="depth-rail__track">
          <motion.span className="depth-rail__fill" style={{ scaleY: reduceMotion ? 1 : progress }} />
        </span>
        <span>Abyss</span>
      </div>
    </>
  );
}
