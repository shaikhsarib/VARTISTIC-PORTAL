"use client";

/**
 * Kanban board — dnd-kit drag & drop with a fully keyboard-accessible
 * alternative: cards are buttons; opening a card reveals a "Move to" select
 * (same status transition API as dragging), announced via live region.
 */
import { useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors,
  useDroppable, useDraggable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { motion, useReducedMotion } from "framer-motion";
import { useTasks, useUpdateTask } from "@/lib/client/hooks";
import { useSound } from "@/hooks/use-sound";
import { useViewParams } from "@/lib/client/use-view-params";
import { FiltersBar } from "../filters-bar";
import { Avatar, DueChip, EmptyState, PriorityChip, TaskCardSkeleton } from "../ui";
import { TaskDetailSheet } from "../task-detail-sheet";
import { Cube3D } from "@/components/icons3d/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical } from "lucide-react";
import type { TaskDTO } from "@/lib/client/types";

const COLUMNS = [
  { id: "PENDING", label: "Pending" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "COMPLETED", label: "Completed" },
] as const;

export function BoardView() {
  const { filters } = useViewParams();
  const { data, isLoading } = useTasks(filters);
  const update = useUpdateTask();
  const play = useSound();
  const reduced = useReducedMotion();
  const [active, setActive] = useState<TaskDTO | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const tasks = data?.tasks ?? [];
  const byStatus = (s: string) => tasks.filter((t) => t.status === s);

  function onDragStart(e: DragStartEvent) {
    const t = tasks.find((x) => x.id === e.active.id);
    setActive(t ?? null);
    play("tick");
  }

  async function onDragEnd(e: DragEndEvent) {
    setActive(null);
    const overId = e.over?.id as string | undefined;
    const task = tasks.find((x) => x.id === e.active.id);
    if (!overId || !task || overId === task.status) return;
    if (!COLUMNS.some((c) => c.id === overId)) return;
    try {
      await update.mutateAsync({ id: task.id, body: { status: overId } });
      play(overId === "COMPLETED" ? "chime" : "drop");
      setAnnouncement(`${task.key} moved to ${overId.replace("_", " ").toLowerCase()}`);
    } catch {
      setAnnouncement(`Could not move ${task.key}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Board</h1>
        <p className="text-xs text-[color:var(--muted-foreground)]">
          Drag cards between columns, or open a card and use “Move to” (keyboard-friendly).
        </p>
      </div>
      <FiltersBar />
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((c) => (
            <div key={c} className="space-y-3">{[0, 1].map((i) => <TaskCardSkeleton key={i} />)}</div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<Cube3D size={110} />}
          title="No tasks match these filters"
          hint="Try clearing filters, or create the first task for this view."
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActive(null)}
        >
          <div className="grid items-start gap-4 md:grid-cols-3">
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.id}
                id={col.id}
                label={col.label}
                tasks={byStatus(col.id)}
                onOpen={setOpenTaskId}
                reduced={!!reduced}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={reduced ? null : undefined}>
            {active ? (
              <div className="w-72 rotate-2 rounded-xl border bg-card p-3 shadow-xl">
                <TaskCardBody task={active} onOpen={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <TaskDetailSheet taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  );
}

function BoardColumn({
  id, label, tasks, onOpen, reduced,
}: { id: string; label: string; tasks: TaskDTO[]; onOpen: (id: string) => void; reduced: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${label} column, ${tasks.length} tasks`}
      className={`glass rounded-2xl p-3 transition-colors ${isOver ? "ring-2 ring-[color:var(--brand-coral)]/50" : ""}`}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-extrabold uppercase tracking-wide">{label}</h2>
        <span className="rounded-full bg-card px-2 py-0.5 font-mono text-xs font-bold" aria-hidden>{tasks.length}</span>
      </header>
      <div className="space-y-2.5">
        {tasks.map((t) => <BoardCard key={t.id} task={t} onOpen={onOpen} reduced={reduced} />)}
        {!tasks.length ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-xs italic text-[color:var(--muted-foreground)]">
            Drop here or move via a card&apos;s menu
          </p>
        ) : null}
      </div>
    </section>
  );
}

function BoardCard({ task, onOpen, reduced }: { task: TaskDTO; onOpen: (id: string) => void; reduced: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <motion.div
      ref={setNodeRef}
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`group rounded-xl border bg-card p-3 shadow-sm ${task.overdue ? "border-[color:var(--destructive)]/40" : ""} ${task.verified ? "opacity-90" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes} {...listeners}
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-[color:var(--muted-foreground)] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Drag ${task.key}`}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <TaskCardBody task={task} onOpen={() => onOpen(task.id)} />
        </div>
      </div>
    </motion.div>
  );
}

function TaskCardBody({ task, onOpen }: { task: TaskDTO; onOpen: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-semibold text-[color:var(--muted-foreground)]">
        <span className="font-mono text-[color:var(--brand-coral)]">{task.key}</span>
        {task.overdue ? <span className="rounded bg-[color:var(--destructive)]/10 px-1.5 py-0.5 font-bold text-[color:var(--destructive)]">Overdue</span> : null}
        {task.isSelfInitiated ? <span className="rounded bg-primary/10 px-1.5 py-0.5 font-bold text-primary">+50 XP</span> : null}
        {task.verified ? <span className="rounded bg-[color:var(--success)]/12 px-1.5 py-0.5 font-bold text-[color:var(--success)]">Verified</span> : null}
      </div>
      <button onClick={onOpen} className="mt-1 block w-full text-left text-sm font-bold leading-snug hover:text-[color:var(--brand-coral)]">
        {task.title}
      </button>
      {task.delayReason && task.overdue ? (
        <p className="mt-1 line-clamp-2 text-xs italic text-[color:var(--warning)]" title={task.delayReason}>
          ⚠ {task.delayReason}
        </p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <PriorityChip priority={task.priority} />
        <DueChip task={task} />
        {task.labels.slice(0, 2).map((l) => (
          <span key={l.id} className="rounded-full border px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--muted-foreground)]">
            {l.name}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1.5">
          {task.commentCount > 0 ? <span className="text-[11px] font-semibold text-[color:var(--muted-foreground)]">💬 {task.commentCount}</span> : null}
          {task.assignee ? <Avatar name={task.assignee.name} hue={task.assignee.avatarHue} size={22} /> : null}
        </span>
      </div>
      <div className="mt-2">
        <KeyboardMoveSelect task={task} />
      </div>
    </div>
  );
}

/** Keyboard-accessible status change (equivalent to drag & drop). */
function KeyboardMoveSelect({ task }: { task: TaskDTO }) {
  const update = useUpdateTask();
  const play = useSound();
  return (
    <Select
      value={task.status}
      onValueChange={async (v) => {
        if (v === task.status) return;
        try {
          await update.mutateAsync({ id: task.id, body: { status: v } });
          play(v === "COMPLETED" ? "chime" : "drop");
        } catch { /* error surfaced by toasts elsewhere */ }
      }}
    >
      <SelectTrigger className="h-7 w-full text-[11px] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100" aria-label={`Move ${task.key} to another column`}>
        <span className="text-[color:var(--muted-foreground)]">Move to…</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
        <SelectItem value="COMPLETED">Completed</SelectItem>
      </SelectContent>
    </Select>
  );
}
