"use client";

/**
 * Calendar view — month grid of tasks by due date.
 * - Month is URL-persisted (?m=YYYY-MM) so views are shareable
 * - Days show task chips (priority-colored); clicking opens the detail sheet
 * - Fully keyboard accessible: every chip is a button, grid is a table
 */
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTasks } from "@/lib/client/hooks";
import { useViewParams } from "@/lib/client/use-view-params";
import { TaskDetailSheet } from "../task-detail-sheet";
import { EmptyState, SkeletonBlock } from "../ui";
import { Cube3D } from "@/components/icons3d/icons";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, 1);
}

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: "var(--brand-coral)",
  MEDIUM: "var(--brand-yellow)",
  LOW: "var(--brand-blue)",
};

export function CalendarView() {
  const { params, setParams } = useViewParams();
  const { data, isLoading } = useTasks({}); // full set; grouping is client-side
  const reduced = useReducedMotion();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const monthParam = params.get("m");
  const valid = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : monthKey(new Date());
  const monthDate = useMemo(() => parseMonthKey(valid), [valid]);

  const byDay = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>["tasks"]>();
    for (const t of data?.tasks ?? []) {
      if (!t.dueDate) continue;
      const key = t.dueDate.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [data]);

  // grid: weeks starting Monday
  const cells = useMemo(() => {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday=0
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const out: { date: Date | null }[] = [];
    for (let i = 0; i < startOffset; i++) out.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ date: new Date(monthDate.getFullYear(), monthDate.getMonth(), d) });
    }
    while (out.length % 7 !== 0) out.push({ date: null });
    return out;
  }, [monthDate]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const monthTasks = [...byDay.entries()].flatMap(([day, ts]) =>
    day.startsWith(valid) ? ts : [],
  );

  function shiftMonth(delta: number) {
    const next = new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1);
    setParams({ m: monthKey(next), view: "calendar" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Calendar</h1>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            {monthTasks.length} task{monthTasks.length === 1 ? "" : "s"} due in{" "}
            {monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setParams({ m: monthKey(new Date()), view: "calendar" })}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl" role="region" aria-label="Month calendar">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <caption className="sr-only">
              Tasks by due date for {monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </caption>
            <thead>
              <tr>
                {WEEKDAYS.map((d) => (
                  <th key={d} scope="col" className="border-b bg-muted/50 px-2 py-2 text-left text-xs font-bold uppercase tracking-wide text-[color:var(--muted-foreground)]">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: cells.length / 7 }, (_, w) => (
                <tr key={w}>
                  {cells.slice(w * 7, w * 7 + 7).map(({ date }, i) => {
                    if (!date) {
                      return <td key={i} className="h-24 border-b border-r bg-muted/20 p-1.5 last:border-r-0" aria-hidden />;
                    }
                    const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                    const dayTasks = byDay.get(dayStr) ?? [];
                    const isToday = dayStr === todayStr;
                    const isWeekend = [0, 6].includes(date.getDay());
                    return (
                      <td
                        key={i}
                        className={`h-24 min-w-[96px] border-b border-r p-1.5 align-top last:border-r-0 ${
                          isWeekend ? "bg-muted/20" : ""
                        } ${isToday ? "bg-[color:var(--brand-coral)]/[0.06] ring-1 ring-inset ring-[color:var(--brand-coral)]/40" : ""}`}
                      >
                        <div className="flex items-center justify-between px-0.5">
                          <span className={`text-xs font-bold tabular-nums ${isToday ? "text-[color:var(--brand-coral)]" : "text-[color:var(--muted-foreground)]"}`}>
                            {date.getDate()}
                          </span>
                          {isToday ? <span className="text-[9px] font-extrabold uppercase text-[color:var(--brand-coral)]">today</span> : null}
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayTasks.slice(0, 3).map((t) => (
                            <motion.button
                              key={t.id}
                              initial={reduced ? false : { opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              onClick={() => setOpenTaskId(t.id)}
                              className="flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-semibold hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
                              style={{ background: `color-mix(in srgb, ${PRIORITY_COLOR[t.priority] ?? "var(--muted-foreground)"} 14%, transparent)` }}
                              aria-label={`Open ${t.key}: ${t.title}, due ${dayStr}`}
                            >
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: PRIORITY_COLOR[t.priority] ?? "var(--muted-foreground)" }}
                                aria-hidden
                              />
                              <span className="truncate">{t.title}</span>
                              {t.overdue ? <span className="ml-auto shrink-0 font-bold text-[color:var(--destructive)]" aria-label="overdue">!</span> : null}
                            </motion.button>
                          ))}
                          {dayTasks.length > 3 ? (
                            <p className="px-1.5 text-[10px] font-semibold text-[color:var(--muted-foreground)]">
                              +{dayTasks.length - 3} more
                            </p>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && monthTasks.length === 0 ? (
        <EmptyState
          icon={<Cube3D size={100} />}
          title="No tasks due this month"
          hint="Use Today to jump back, or create a task with a due date in this month."
        />
      ) : null}

      <TaskDetailSheet taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  );
}
