"use client";

import { cn } from "@/lib/utils";
import type { TaskDTO } from "@/lib/client/types";

/* --- Avatar with deterministic brand-hue disc ----------------------------- */
export function Avatar({
  name,
  hue,
  size = 32,
  className,
}: {
  name: string;
  hue: number;
  size?: number;
  className?: string;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn("inline-grid place-items-center rounded-lg font-bold select-none", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 72% 58%), hsl(${(hue + 40) % 360} 68% 44%))`,
        color: "#fff",
      }}
    >
      {initials}
    </span>
  );
}

/* --- Status / priority / label styling ------------------------------------ */
export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-muted text-foreground/80 border-border",
    IN_PROGRESS: "bg-[color:var(--chart-2)]/12 text-[color:var(--info)] border-[color:var(--chart-2)]/30",
    COMPLETED: "bg-[color:var(--success)]/12 text-[color:var(--success)] border-[color:var(--success)]/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", map[status])}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: status === "PENDING" ? "var(--muted-foreground)" : status === "IN_PROGRESS" ? "var(--chart-2)" : "var(--success)" }}
      />
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: string }) {
  const map: Record<string, { label: string; style: React.CSSProperties }> = {
    HIGH: { label: "High", style: { background: "color-mix(in srgb, var(--brand-coral) 14%, transparent)", color: "var(--accent-foreground)", borderColor: "color-mix(in srgb, var(--brand-coral) 35%, transparent)" } },
    MEDIUM: { label: "Medium", style: { background: "color-mix(in srgb, var(--brand-yellow) 16%, transparent)", color: "var(--warning)", borderColor: "color-mix(in srgb, var(--brand-yellow) 40%, transparent)" } },
    LOW: { label: "Low", style: { background: "var(--muted)", color: "var(--muted-foreground)", borderColor: "var(--border)" } },
  };
  const conf = map[priority] ?? map.LOW;
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold" style={conf.style}>
      {conf.label}
    </span>
  );
}

export function LabelChip({ label }: { label: { id: string; name: string; color: string } }) {
  const colorVar: Record<string, string> = {
    coral: "var(--brand-coral)",
    blue: "var(--brand-blue)",
    yellow: "var(--brand-yellow)",
    ink: "var(--brand-ink)",
    moss: "var(--success)",
  };
  const c = colorVar[label.color] ?? "var(--muted-foreground)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
      style={{ borderColor: `color-mix(in srgb, ${c} 35%, transparent)`, color: "var(--foreground)", background: `color-mix(in srgb, ${c} 8%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {label.name}
    </span>
  );
}

export function DueChip({ task }: { task: TaskDTO }) {
  if (!task.dueDate) return null;
  const due = new Date(task.dueDate);
  const today = new Date();
  const isToday = due.toDateString() === today.toDateString();
  const isPast = due < new Date(today.getFullYear(), today.getMonth(), today.getDate()) && task.status !== "COMPLETED";
  const fmt = due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        isPast ? "text-[color:var(--destructive)]" : isToday ? "text-[color:var(--warning)]" : "text-[color:var(--muted-foreground)]",
      )}
      title={isPast ? "Overdue" : undefined}
    >
      {isPast ? "⚠" : "◷"} {fmt}
    </span>
  );
}

/* --- Empty / loading / error states ---------------------------------------- */
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <div aria-hidden>{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        {hint ? <p className="mt-1 max-w-sm text-sm text-[color:var(--muted-foreground)]">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted", className)} aria-hidden />;
}

export function TaskCardSkeleton() {
  return (
    <div className="space-y-2 rounded-xl border p-4" aria-hidden>
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-5 w-3/4" />
      <div className="flex gap-2 pt-1">
        <SkeletonBlock className="h-6 w-20" />
        <SkeletonBlock className="h-6 w-16" />
        <SkeletonBlock className="h-6 w-14" />
      </div>
    </div>
  );
}

/* --- Lightweight SVG charts (no chart lib needed) --------------------------- */
export function DonutChart({
  slices,
  size = 144,
  centerLabel,
  centerSub,
}: {
  slices: { value: number; color: string; label: string }[];
  size?: number;
  centerLabel: string;
  centerSub?: string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = 56;
  const c = 2 * Math.PI * r;
  // precompute cumulative offsets (pure — React compiler safe)
  const fracs = slices.map((s) => s.value / total);
  const starts = fracs.map((_, i) => fracs.slice(0, i).reduce((a, b) => a + b, 0));
  const arcs = slices.map((s, i) => ({ ...s, startFrac: starts[i], frac: fracs[i] }));
  const subWords = centerSub ? centerSub.split(" ") : [];

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" role="img" aria-label={`${centerLabel} ${centerSub ?? ""}`}>
      <svg width={size} height={size} viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={r} fill="none" stroke="var(--muted)" strokeWidth="12" />
        {arcs.map((s) => (
          <circle
            key={s.label}
            cx="75" cy="75" r={r} fill="none"
            stroke={s.color} strokeWidth="12"
            strokeDasharray={`${s.frac * c} ${c}`}
            strokeDashoffset={-s.startFrac * c}
            transform="rotate(-90 75 75)"
            strokeLinecap="butt"
          />
        ))}
        <text
          x="75"
          y={subWords.length > 1 ? 67 : 72}
          textAnchor="middle"
          className="fill-foreground font-black"
          style={{ fontSize: 28, letterSpacing: "-0.03em" }}
        >
          {centerLabel}
        </text>
        {subWords.length > 1 ? (
          <text
            x="75"
            y="84"
            textAnchor="middle"
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fill: "var(--muted-foreground)",
            }}
          >
            <tspan x="75" dy="0">{subWords[0]}</tspan>
            <tspan x="75" dy="10">{subWords.slice(1).join(" ")}</tspan>
          </text>
        ) : subWords.length === 1 ? (
          <text
            x="75"
            y="88"
            textAnchor="middle"
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fill: "var(--muted-foreground)",
            }}
          >
            {centerSub}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

export function BarRow({
  label, value, max, color, sub,
}: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3" role="img" aria-label={`${label}: ${value}`}>
      <span className="w-24 shrink-0 truncate text-xs font-semibold" title={label}>{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-16 shrink-0 text-right text-xs tabular-nums text-[color:var(--muted-foreground)]">{sub ?? value}</span>
    </div>
  );
}
