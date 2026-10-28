"use client";

/**
 * useSound — Web Audio oscillator cues (pattern inspired by soundcn's
 * `use-sound` hook API, MIT © kapishdima; implementation is original,
 * zero audio files, zero dependencies).
 *
 * Cues are gated: enabled only when the user preference is ON and
 * prefers-reduced-motion is not set. Defaults OFF.
 */
import { useCallback, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { usePortal } from "@/lib/store/portal";

export type SoundCue = "tick" | "pop" | "drop" | "chime" | "whoosh";

export function useSound() {
  const enabled = usePortal((s) => s.soundEnabled);
  const reduced = useReducedMotion();
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(
    (cue: SoundCue) => {
      if (!enabled || reduced) return;
      try {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        ctxRef.current ??= new Ctor();
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") void ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const t = ctx.currentTime;
        switch (cue) {
          case "tick":
            osc.frequency.setValueAtTime(880, t);
            gain.gain.setValueAtTime(0.045, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
            osc.start(t); osc.stop(t + 0.09);
            break;
          case "pop":
            osc.type = "triangle";
            osc.frequency.setValueAtTime(520, t);
            osc.frequency.exponentialRampToValueAtTime(760, t + 0.09);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
            osc.start(t); osc.stop(t + 0.15);
            break;
          case "drop":
            osc.type = "sine";
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);
            gain.gain.setValueAtTime(0.07, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
            osc.start(t); osc.stop(t + 0.23);
            break;
          case "chime":
            osc.type = "sine";
            osc.frequency.setValueAtTime(660, t);
            osc.frequency.setValueAtTime(990, t + 0.09);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
            osc.start(t); osc.stop(t + 0.42);
            break;
          case "whoosh":
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);
            gain.gain.setValueAtTime(0.03, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
            osc.start(t); osc.stop(t + 0.3);
            break;
        }
      } catch {
        // audio unavailable — stay silent
      }
    },
    [enabled, reduced],
  );

  return play;
}
