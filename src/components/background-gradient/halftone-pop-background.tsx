"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * HalftonePopBackground — Free Background-gradient React component.
 * Risograph-style halftone dots in rose, teal, and amber on cream.
 * MIT licensed.
 */
interface HalftonePopBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  dotSize?: number;
  dotSpacing?: number;
}

export function HalftonePopBackground({
  className,
  children,
  dotSize = 1.75,
  dotSpacing = 18,
  ...props
}: HalftonePopBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-stretch justify-start overflow-hidden rounded-2xl",
        "bg-[#fdfbf7] dark:bg-[#12131a] text-foreground transition-colors",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Risograph vibrant spot gradients: rose, teal, and amber */}
        <div
          className="absolute -top-24 -left-20 h-96 w-96 rounded-full opacity-35 blur-[75px] dark:opacity-25"
          style={{ background: "radial-gradient(circle, #f43f5e 20%, #fb7185 60%, transparent 80%)" }}
        />
        <div
          className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full opacity-30 blur-[85px] dark:opacity-20"
          style={{ background: "radial-gradient(circle, #0d9488 20%, #14b8a6 60%, transparent 80%)" }}
        />
        <div
          className="absolute -bottom-28 left-1/4 h-[26rem] w-[26rem] rounded-full opacity-35 blur-[80px] dark:opacity-25"
          style={{ background: "radial-gradient(circle, #f59e0b 20%, #fbbf24 60%, transparent 80%)" }}
        />

        {/* Center atmospheric blend */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[34rem] w-[34rem] rounded-full opacity-20 blur-[100px] dark:opacity-15"
          style={{
            background:
              "conic-gradient(from 180deg at 50% 50%, #f43f5e, #f59e0b, #0d9488, #f43f5e)",
          }}
        />

        {/* Risograph Halftone Dot Screen */}
        <div
          className="absolute inset-0 opacity-[0.22] dark:opacity-[0.16] mix-blend-multiply dark:mix-blend-screen"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor ${dotSize}px, transparent ${dotSize}px)`,
            backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
            backgroundPosition: "0 0, 9px 9px",
          }}
        />

        {/* Outer subtle vignette border */}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 dark:ring-white/5 pointer-events-none rounded-2xl" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col min-h-0">{children}</div>
    </div>
  );
}

