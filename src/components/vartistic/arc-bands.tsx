/**
 * ArcBandsBackground — adapted from opensourceui.in "ArcBandsBackground"
 * (MIT license, © opensourceui.in contributors; recipe: five static radial
 * band arcs rising from the bottom edge, pure CSS, zero canvas).
 * Recolored to the Vartistic palette; band colors read as tokens so the
 * treatment works in light and dark themes. See NOTICE.md.
 */
export function ArcBandsBackground({ opacity = 0.5 }: { opacity?: number }) {
  const bands = [
    "var(--brand-coral)",
    "var(--brand-yellow)",
    "var(--brand-blue)",
    "var(--brand-coral-deep)",
    "var(--brand-cream)",
  ];
  const widths = [150, 130, 115, 95, 75]; // vmax per layer
  return (
    <div className="arc-bands" aria-hidden style={{ opacity }}>
      {bands.map((color, i) => (
        <div
          key={i}
          className="arc-band"
          style={{
            width: `${widths[i]}vmax`,
            height: `${widths[i]}vmax`,
            backgroundImage: `radial-gradient(closest-side, ${color} 24%, transparent 72%)`,
            opacity: 0.16 + i * 0.05,
            bottom: `-${90 - i * 9}%`,
          }}
        />
      ))}
      {/* subtle paper grain dot matrix */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          opacity: 0.5,
        }}
      />
    </div>
  );
}
