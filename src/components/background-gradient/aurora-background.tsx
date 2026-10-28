"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * AuroraBackground — Free Background-gradient React component.
 * Soft aurora wash with lime, mint, cyan, and blue blobs over a warm paper base.
 * MIT licensed.
 */
interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-stretch justify-start bg-[#faf7f2] text-[#17150f] transition-colors",
        className
      )}
      {...props}
    >
      {/* Viewport-fixed aurora backdrop: keeps sidebar, header, and content seamlessly merged */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
        {/* Warm paper gradient base */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/60 via-[#faf7f2] to-[#f4eee5]" />

        {/* Soft aurora wash blobs: lime, mint, cyan, and blue */}
        <div
          className={cn(
            "absolute -inset-[20px] opacity-45 blur-[85px] will-change-transform",
            "[background-image:var(--aurora-gradient)]",
            "[background-size:250%_200%]",
            "animate-aurora"
          )}
          style={{
            ["--aurora-gradient" as string]: `
              radial-gradient(ellipse 55% 45% at 18% 22%, #84cc16 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 78% 28%, #10b981 0%, transparent 55%),
              radial-gradient(ellipse 60% 50% at 42% 76%, #06b6d4 0%, transparent 60%),
              radial-gradient(ellipse 52% 46% at 86% 72%, #3b82f6 0%, transparent 55%),
              radial-gradient(ellipse 42% 42% at 16% 82%, #14b8a6 0%, transparent 50%)
            `,
          }}
        />

        {/* Subtle paper grain matrix for a clean riso/paper texture */}
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: "radial-gradient(#111111 0.75px, transparent 0.75px)",
            backgroundSize: "24px 24px",
          }}
        />

        {showRadialGradient && (
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        )}
      </div>

      {/* Page content rendered above the fixed aurora canvas */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0">{children}</div>
    </div>
  );
}

