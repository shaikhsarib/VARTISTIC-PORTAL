"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WORDMARK_PATH as WORDMARK_PATH_LOCAL, WORDMARK_DOTS, STROKES_CONFIG } from "./wordmark";

/**
 * Choreographed Preloader — medium, cinematic reveal of the 02 · STROKES logo:
 * 1. 0.15s - 0.70s: The 4 slanted pill strokes rise & pop in sequence with spring physics
 * 2. 0.70s: 4th coral accent stroke springs up with bounce
 * 3. 0.95s: Vartistic wordmark slides smoothly up and settles
 * 4. 1.80s: Stays visible so motion is fully appreciated, then smoothly dissolves
 */
export function Preloader({ done }: { done: boolean }) {
  const reduced = useReducedMotion();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Guarantee minimum visible time so user can clearly see and appreciate the motion
  useEffect(() => {
    if (reduced) {
      setMinTimeElapsed(true);
      return;
    }
    // 1.8s allows the complete stroke sequence + wordmark to play out elegantly
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [reduced]);

  // Fade out only after both the minimum animation time has played AND data is ready
  const isDismissing = done && minTimeElapsed;

  useEffect(() => {
    if (!isDismissing) return;
    // Allow 650ms for the smooth fade transition to finish before unmounting
    const t = setTimeout(() => setHidden(true), reduced ? 200 : 650);
    return () => clearTimeout(t);
  }, [isDismissing, reduced]);

  // Absolute safety cap so it never gets stuck
  useEffect(() => {
    const safety = setTimeout(() => setHidden(true), 3500);
    return () => clearTimeout(safety);
  }, []);

  if (hidden) return null;

  if (reduced) {
    return (
      <div
        aria-hidden
        className="fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-300"
        style={{ opacity: isDismissing ? 0 : 1 }}
      >
        <StrokesMark static />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] grid place-items-center bg-background"
      style={{
        opacity: isDismissing ? 0 : 1,
        transition: "opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: isDismissing ? "none" : "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-7"
      >
        <StrokesMark />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg width="180" height="42" viewBox="0 -40 200 46" role="presentation">
            <path
              d={WORDMARK_PATH_LOCAL}
              fill="var(--brand-ink, #111111)"
              className="dark:hidden"
            />
            <path
              d={WORDMARK_PATH_LOCAL}
              fill="var(--brand-cream, #f6efe3)"
              className="hidden dark:block"
            />
            {WORDMARK_DOTS.map((d) => (
              <circle
                key={d.cx}
                cx={d.cx}
                cy={d.cy}
                r={d.r}
                fill="var(--brand-coral, #ff5b3a)"
              />
            ))}
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

function StrokesMark({ static: isStatic = false }: { static?: boolean }) {
  if (isStatic) {
    return (
      <svg width="84" height="84" viewBox="-5 0 110 100" role="presentation">
        <g transform="translate(8, 0) skewX(-12)">
          {STROKES_CONFIG.strokes.map((s, idx) => (
            <rect
              key={idx}
              x={s.x}
              y={s.y}
              width={s.width}
              height={s.height}
              rx={s.rx}
              fill={s.isAccent ? "var(--brand-coral, #ff5b3a)" : "var(--foreground, #111111)"}
            />
          ))}
        </g>
      </svg>
    );
  }

  return (
    <svg width="84" height="84" viewBox="-5 0 110 100" role="presentation">
      <g transform="translate(8, 0) skewX(-12)">
        {STROKES_CONFIG.strokes.map((s, idx) => {
          // Staggered timing across the 4 strokes
          const delays = [0.15, 0.32, 0.50, 0.70];
          const delay = delays[idx] ?? 0.15;

          return (
            <motion.rect
              key={idx}
              x={s.x}
              y={s.y}
              width={s.width}
              height={s.height}
              rx={s.rx}
              fill={s.isAccent ? "var(--brand-coral, #ff5b3a)" : "var(--foreground, #111111)"}
              initial={{ scaleY: 0, opacity: 0, y: 15 }}
              animate={{ scaleY: 1, opacity: 1, y: 0 }}
              transition={{
                delay,
                duration: s.isAccent ? 0.55 : 0.45,
                type: "spring",
                stiffness: s.isAccent ? 240 : 280,
                damping: s.isAccent ? 14 : 18,
              }}
              style={{ transformOrigin: `${s.x + s.width / 2}px ${s.y + s.height}px` }}
            />
          );
        })}
      </g>
    </svg>
  );
}
