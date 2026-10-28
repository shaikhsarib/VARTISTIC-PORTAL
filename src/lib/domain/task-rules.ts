/**
 * Task domain rules — ports of the legacy `testing.py` behaviors plus the
 * status model used by board/list views.
 */

export const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskRulesLike = {
  dueDate: Date | null;
  status: string;
  verified: boolean;
  delayReason: string;
};

/** ISO date at local midnight for comparison boundaries. */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Overdue (operational definition): due date before today and not yet completed.
 * The legacy test asserted `deadline < today and not verified`; completed-but-
 * unverified tasks are tracked separately as `stale` so dashboards can show both.
 */
export function isOverdue(task: TaskRulesLike, now: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  if (task.status === "COMPLETED") return false;
  return task.dueDate < startOfToday(now);
}

/** Legacy definition kept for parity: unresolved (not verified) and past due. */
export function isUnresolved(task: TaskRulesLike, now: Date = new Date()): boolean {
  if (!task.dueDate) return false;
  return task.dueDate < startOfToday(now) && !task.verified;
}

/** Legacy TEST 4: overdue or blocked tasks must carry explicit delay reasoning. */
export const DELAY_REASON_MESSAGE =
  "Overdue or blocked tasks must carry explicit delay reasoning.";

export function requiresDelayReason(task: TaskRulesLike, now: Date = new Date()): boolean {
  if (task.status === "COMPLETED") return false;
  return isOverdue(task, now);
}

/** Legacy TEST 5: self-initiated work is logged by the assignee themselves. */
export const SELF_INITIATED_MESSAGE =
  "Self-initiated extra work must be assigned to yourself.";

/** Allowed status transitions (kanban): any forward/backward move except out of verified lock. */
export function canTransition(from: string, to: string, verified: boolean): boolean {
  if (!TASK_STATUSES.includes(to as TaskStatus)) return false;
  if (verified && to !== from) return false; // verified tasks are locked
  return TASK_STATUSES.includes(from as TaskStatus);
}

export function statusTransitionError(verified: boolean): string {
  return verified
    ? "Verified tasks are locked and cannot change status."
    : "Unknown status.";
}

export function progressPercent(tasks: { status: string; verified: boolean }[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "COMPLETED" && t.verified).length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  // weighted: verified completion = 100%, completed awaiting verify = 80%, in progress = 45%
  const weight = done * 1 + (completed - done) * 0.8 + inProgress * 0.45;
  return Math.round((weight / tasks.length) * 100);
}
