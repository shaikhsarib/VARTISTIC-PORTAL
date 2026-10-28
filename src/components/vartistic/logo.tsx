import { WORDMARK_PATH, WORDMARK_DOTS, STROKES_CONFIG } from "./wordmark";

/**
 * Vartistic logo — variation: 02 · STROKES.
 * 4 ascending slanted pill strokes at skewX(-12).
 * Strokes 1, 2, 3: themed ink/cream / currentColor.
 * Stroke 4: signature brand coral (#ff5b3a).
 */

export function LogoMark({
  size = 32,
  title,
  className,
  light = false,
}: {
  size?: number;
  title?: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-5 0 110 100"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <g transform="translate(8, 0) skewX(-12)">
        {STROKES_CONFIG.strokes.map((s, idx) => (
          <rect
            key={idx}
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
            rx={s.rx}
            fill={
              s.isAccent
                ? "var(--brand-coral, #ff5b3a)"
                : light
                ? "var(--brand-cream, #f6efe3)"
                : "currentColor"
            }
          />
        ))}
      </g>
    </svg>
  );
}

export function LogoWordmark({
  height = 26,
  className,
  light = false,
}: {
  height?: number;
  className?: string;
  light?: boolean;
}) {
  // viewBox tuned to wordmark bbox
  const width = height * (200 / 46);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 -40 200 46"
      className={className}
      role="img"
      aria-label="vartistic"
      focusable="false"
      style={{
        color: light ? "var(--brand-cream, #f6efe3)" : "var(--foreground)",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    >
      <path
        d={WORDMARK_PATH}
        fill="currentColor"
        transform="translate(-2, 0)"
      />
      {WORDMARK_DOTS.map((d) => (
        <circle key={d.cx} cx={d.cx} cy={d.cy} r={d.r} fill="var(--brand-coral, #ff5b3a)" />
      ))}
    </svg>
  );
}

export function LogoLockup({
  size = 34,
  height = 24,
  light = false,
  className,
}: {
  size?: number;
  height?: number;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} title="Vartistic" light={light} />
      <LogoWordmark height={height} light={light} />
    </div>
  );
}
