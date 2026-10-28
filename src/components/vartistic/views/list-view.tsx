"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTasks } from "@/lib/client/hooks";
import { useViewParams } from "@/lib/client/use-view-params";
import { FiltersBar } from "../filters-bar";
import { Avatar, DueChip, EmptyState, LabelChip, PriorityChip, StatusChip, TaskCardSkeleton } from "../ui";
import { TaskDetailSheet } from "../task-detail-sheet";
import { Magnifier3D } from "@/components/icons3d/icons";

/** List view — same dataset + filters as the board, dense table presentation. */
export function ListView() {
  const { filters } = useViewParams();
  const { data, isLoading, isError, error } = useTasks(filters);
  const reduced = useReducedMotion();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Tasks</h1>
        {data ? (
          <p className="text-sm text-[color:var(--muted-foreground)]" aria-live="polite">
            {data.count} task{data.count === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
      <FiltersBar />

      {isError ? (
        <EmptyState
          icon={<Magnifier3D size={110} />}
          title="Couldn't load tasks"
          hint={error instanceof Error ? error.message : "Check your connection and retry."}
          action={
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" onClick={() => window.location.reload()}>
              Retry
            </button>
          }
        />
      ) : isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          {[0, 1, 2, 3, 4].map((i) => <TaskCardSkeleton key={i} />)}
        </div>
      ) : !data?.tasks.length ? (
        <EmptyState
          icon={<Magnifier3D size={110} />}
          title="No tasks found"
          hint="Nothing matches these filters. Clear them or create a new task."
        />
      ) : (
        <div className="glass overflow-x-auto rounded-2xl" role="region" aria-label="Task list">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Tasks with status, assignee, priority, labels and due dates</caption>
            <thead>
              <tr className="border-b bg-muted/60 text-xs uppercase tracking-wide text-[color:var(--muted-foreground)]">
                <th scope="col" className="px-4 py-3 font-bold">Task</th>
                <th scope="col" className="px-4 py-3 font-bold">Status</th>
                <th scope="col" className="px-4 py-3 font-bold">Priority</th>
                <th scope="col" className="px-4 py-3 font-bold">Assignee</th>
                <th scope="col" className="px-4 py-3 font-bold">Labels</th>
                <th scope="col" className="px-4 py-3 font-bold">Due</th>
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.2) }}
                  className={`cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50 ${t.overdue ? "bg-[color:var(--destructive)]/[0.04]" : ""}`}
                  onClick={() => setOpenTaskId(t.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") setOpenTaskId(t.id); }}
                  tabIndex={0}
                  aria-label={`Open ${t.key}: ${t.title}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[color:var(--brand-coral)]">{t.key}</span>
                      <span className="font-semibold">{t.title}</span>
                      {t.verified ? <span className="rounded bg-[color:var(--success)]/12 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--success)]">Verified</span> : null}
                      {t.overdue ? <span className="rounded bg-[color:var(--destructive)]/10 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--destructive)]">Overdue</span> : null}
                    </div>
                    {t.delayReason && t.overdue ? (
                      <p className="mt-0.5 text-xs italic text-[color:var(--warning)]">⚠ {t.delayReason}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3"><StatusChip status={t.status} /></td>
                  <td className="px-4 py-3"><PriorityChip priority={t.priority} /></td>
                  <td className="px-4 py-3">
                    {t.assignee ? (
                      <span className="flex items-center gap-2">
                        <Avatar name={t.assignee.name} hue={t.assignee.avatarHue} size={24} />
                        <span className="text-xs font-semibold">{t.assignee.name}</span>
                      </span>
                    ) : <span className="text-xs italic text-[color:var(--muted-foreground)]">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3"><span className="flex flex-wrap gap-1">{t.labels.map((l) => <LabelChip key={l.id} label={l} />)}</span></td>
                  <td className="px-4 py-3"><DueChip task={t} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskDetailSheet taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  );
}
