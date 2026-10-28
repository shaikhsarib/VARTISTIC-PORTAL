"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * DarkArcBandsBackground — Free Background-gradient React component.
 * Blended sky, teal, amber, and rose arcs on a midnight base.
 * MIT licensed.
 */
interface DarkArcBandsBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  opacity?: number;
}

export function DarkArcBandsBackground({
  className,
  children,
  opacity = 0.85,
  ...props
}: DarkArcBandsBackgroundProps) {
  const bands = [
    { color: "#38bdf8", width: 145, bottom: "-78%", blur: 2, op: 0.35 }, // sky
    { color: "#14b8a6", width: 125, bottom: "-70%", blur: 3, op: 0.32 }, // teal
    { color: "#f59e0b", width: 105, bottom: "-62%", blur: 4, op: 0.28 }, // amber
    { color: "#f43f5e", width: 85, bottom: "-54%", blur: 4, op: 0.26 },  // rose
  ];

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-stretch justify-start bg-[#090a0f] text-neutral-100 transition-colors",
        className
      )}
      {...props}
    >
      {/* Viewport-fixed midnight backdrop: keeps sidebar, header, and content seamlessly merged */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        style={{ opacity }}
        aria-hidden
      >
        {/* Midnight base with deep radial vignette */}
        <div className="absolute inset-0 bg-[#090a0f] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(56,189,248,0.12),transparent_70%)]" />

        {/* Concentric blended arcs */}
        {bands.map((band, i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
            style={{
              width: `${band.width}vmax`,
              height: `${band.width}vmax`,
              bottom: band.bottom,
              backgroundImage: `radial-gradient(closest-side, ${band.color} 20%, transparent 75%)`,
              opacity: band.op,
              filter: `blur(${band.blur}px)`,
              WebkitMaskImage:
                "radial-gradient(closest-side, transparent calc(100% - 32px), black calc(100% - 30px))",
              maskImage:
                "radial-gradient(closest-side, transparent calc(100% - 32px), black calc(100% - 30px))",
            }}
          />
        ))}

        {/* Ambient bottom glow in rose & teal */}
        <div
          className="absolute -bottom-24 left-1/2 h-80 w-[90vw] -translate-x-1/2 rounded-full blur-[100px] pointer-events-none opacity-30"
          style={{
            background:
              "linear-gradient(90deg, #38bdf8 0%, #14b8a6 30%, #f59e0b 70%, #f43f5e 100%)",
          }}
        />

        {/* Midnight noise matrix */}
        <div
          className="absolute inset-0 opacity-18"
          style={{
            backgroundImage: "radial-gradient(#ffffff 0.75px, transparent 0.75px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Page content rendered above the fixed midnight canvas */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0">{children}</div>
    </div>
  );
}

