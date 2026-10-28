/**
 * 3D-style icons for dashboard and empty states.
 * Style inspired by 3dicons.co (CC0) — soft rounded forms, layered gradients,
 * long shadows. All artwork here is original inline SVG (no external assets),
 * so it works offline and carries no license obligation beyond attribution.
 */
import { useId } from "react";

type IconProps = { size?: number; className?: string };

function Shadow({ cx, cy, rx = 26 }: { cx: number; cy: number; rx?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={6} fill="rgba(0,0,0,0.18)" />;
}

export function Orbit3D({ size = 96, className }: IconProps) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Orbit">
      <defs>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a70" />
          <stop offset="100%" stopColor="#ff5b3a" />
        </linearGradient>
      </defs>
      <Shadow cx={60} cy={104} />
      <path
        d="M18,60a42,42 0 1,0 84,0a42,42 0 1,0 -84,0Z M55,84a9,9 0 1,0 18,0a9,9 0 1,0 -18,0Z"
        fill={`url(#${id}-ring)`}
        fillRule="evenodd"
        transform="translate(2,-14) rotate(-8 60 60)"
      />
      <circle cx="38" cy="52" r="9" fill="#111111" />
      <circle cx="60" cy="30" r="9" fill="#2b59ff" />
      <circle cx="86" cy="44" r="9" fill="#ffc531" />
    </svg>
  );
}

export function Rocket3D({ size = 96, className }: IconProps) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Rocket">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d8d2c6" />
        </linearGradient>
      </defs>
      <Shadow cx={60} cy={104} />
      <path d="M60 18c14 10 20 26 20 42l-8 14H48l-8-14c0-16 6-32 20-42Z" fill={`url(#${id}-body)`} />
      <path d="M40 60l-14 18 20-4Z" fill="#ff5b3a" />
      <path d="M80 60l14 18-20-4Z" fill="#ff5b3a" />
      <circle cx="60" cy="52" r="9" fill="#2b59ff" />
      <path d="M52 78h16l-8 16Z" fill="#ffc531" />
    </svg>
  );
}

export function Magnifier3D({ size = 96, className }: IconProps) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Search">
      <defs>
        <linearGradient id={`${id}-lens`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9fb4ff" />
          <stop offset="100%" stopColor="#2b59ff" />
        </linearGradient>
      </defs>
      <Shadow cx={60} cy={104} />
      <circle cx="52" cy="50" r="28" fill={`url(#${id}-lens)`} />
      <circle cx="52" cy="50" r="18" fill="#e9efff" opacity="0.9" />
      <rect x="70" y="70" width="30" height="12" rx="6" transform="rotate(45 70 70)" fill="#111111" />
    </svg>
  );
}

export function Mailbox3D({ size = 96, className }: IconProps) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Notifications">
      <defs>
        <linearGradient id={`${id}-box`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a70" />
          <stop offset="100%" stopColor="#ff5b3a" />
        </linearGradient>
      </defs>
      <Shadow cx={60} cy={104} />
      <rect x="26" y="42" width="68" height="48" rx="14" fill={`url(#${id}-box)`} />
      <path d="M26 56c0-12 9-22 22-22h24c13 0 22 10 22 22v6H26Z" fill="#ffc531" opacity="0.95" />
      <rect x="50" y="66" width="20" height="12" rx="4" fill="#111111" opacity="0.85" />
    </svg>
  );
}

export function Cube3D({ size = 96, className }: IconProps) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Box">
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="100%" stopColor="#ffc531" />
        </linearGradient>
      </defs>
      <Shadow cx={60} cy={104} />
      <path d="M60 26l32 16v36L60 94 28 78V42Z" fill="#f6efe3" />
      <path d="M60 26l32 16-32 16-32-16Z" fill={`url(#${id}-top)`} />
      <path d="M60 58v36L28 78V42Z" fill="#e4dcc9" />
      <path d="M60 58v36l32-16V42Z" fill="#d9d0bb" />
    </svg>
  );
}

export function Shield3D({ size = 96, className }: IconProps) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Secure">
      <defs>
        <linearGradient id={`${id}-shield`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5ce0a8" />
          <stop offset="100%" stopColor="#1b7a4e" />
        </linearGradient>
      </defs>
      <Shadow cx={60} cy={104} />
      <path d="M60 18l30 12v26c0 20-13 34-30 44-17-10-30-24-30-44V30Z" fill={`url(#${id}-shield)`} />
      <path d="M46 58l10 10 20-22" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function User3D({ size = 96, className }: IconProps) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Team">
      <defs>
        <linearGradient id={`${id}-u`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a70" />
          <stop offset="100%" stopColor="#ff5b3a" />
        </linearGradient>
      </defs>
      <Shadow cx={60} cy={104} />
      <circle cx="60" cy="44" r="20" fill={`url(#${id}-u)`} />
      <path d="M24 96c4-18 18-28 36-28s32 10 36 28Z" fill="#2b59ff" />
      <circle cx="60" cy="44" r="8" fill="#ffc531" opacity="0.35" />
    </svg>
  );
}

export function Alert3D({ size = 96, className }: IconProps) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Error">
      <defs>
        <linearGradient id={`${id}-tri`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a70" />
          <stop offset="100%" stopColor="#d93a12" />
        </linearGradient>
      </defs>
      <Shadow cx={60} cy={104} />
      <path d="M60 20l40 68H20Z" fill={`url(#${id}-tri)`} />
      <rect x="55" y="44" width="10" height="26" rx="5" fill="#ffffff" />
      <circle cx="60" cy="80" r="6" fill="#ffffff" />
    </svg>
  );
}
