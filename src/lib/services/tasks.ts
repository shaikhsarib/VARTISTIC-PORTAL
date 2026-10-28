/**
 * Task data services + the pure filter → Prisma WHERE builder (unit-tested).
 */
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api/errors";
import { isOverdue, startOfToday } from "@/lib/domain/task-rules";
import type { Prisma } from "@prisma/client";

export type TaskFilterInput = {
  q?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  assigneeId?: string | null;
  teamId?: string;
  labelId?: string;
  dueWithinDays?: number;
  overdue?: "true" | "false";
  selfInitiated?: "true" | "false";
  mine?: "true" | "false";
  sort?: "due" | "created" | "priority" | "title";
  dir?: "asc" | "desc";
};

/** Pure builder — maps validated query params onto a Prisma where clause. */
export function buildTaskWhere(filter: TaskFilterInput, viewer: { id: string }): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};
  if (filter.q) {
    where.OR = [
      { title: { contains: filter.q } },
      { description: { contains: filter.q } },
      { key: { contains: filter.q } },
    ];
  }
  if (filter.status) where.status = filter.status;
  if (filter.priority) where.priority = filter.priority;
  if (filter.assigneeId === "none") where.assigneeId = null;
  else if (filter.assigneeId) where.assigneeId = filter.assigneeId;
  if (filter.teamId) where.teamId = filter.teamId;
  if (filter.labelId) where.labels = { some: { labelId: filter.labelId } };
  if (filter.selfInitiated === "true") where.isSelfInitiated = true;
  if (filter.mine === "true") where.assigneeId = viewer.id;
  if (filter.dueWithinDays !== undefined) {
    const to = new Date(startOfToday());
    to.setDate(to.getDate() + filter.dueWithinDays);
    to.setHours(23, 59, 59, 999);
    where.dueDate = { gte: startOfToday(), lte: to };
  }
  if (filter.overdue === "true") {
    where.dueDate = { ...(where.dueDate as object ?? {}), lt: startOfToday() };
    where.status = { not: "COMPLETED" };
  }
  return where;
}

export function buildTaskOrderBy(filter: TaskFilterInput): Prisma.TaskOrderByWithRelationInput[] {
  const dir = filter.dir === "desc" ? "desc" : "asc";
  switch (filter.sort) {
    case "created":
      return [{ createdAt: dir }];
    case "priority":
      // SQLite orders strings alphabetically; HIGH/LOW/MEDIUM mapped in-memory by callers
      return [{ priority: dir }, { dueDate: "asc" }];
    case "title":
      return [{ title: dir }];
    case "due":
    default:
      return [{ dueDate: "asc" }, { createdAt: "desc" }];
  }
}

export const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, avatarHue: true, role: true } },
  createdBy: { select: { id: true, name: true, avatarHue: true } },
  verifiedBy: { select: { id: true, name: true } },
  team: { select: { id: true, name: true, slug: true } },
  labels: { include: { label: true } },
  comments: { select: { id: true } },
} satisfies Prisma.TaskInclude;

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof TASK_INCLUDE }>;

/** Next human key: TSK-### continuing the legacy numbering. */
export async function nextTaskKey(): Promise<string> {
  let n = 101;
  for (let i = 0; i < 200; i++) {
    const key = `TSK-${n}`;
    const exists = await db.task.findUnique({ where: { key } });
    if (!exists) return key;
    n++;
  }
  return `TSK-${Date.now().toString().slice(-6)}`;
}

export async function getTaskOr404(idOrKey: string): Promise<TaskWithRelations> {
  const task = await db.task.findFirst({
    where: { OR: [{ id: idOrKey }, { key: idOrKey }] },
    include: TASK_INCLUDE,
  });
  if (!task) throw new ApiError("NOT_FOUND", "Task not found.");
  return task;
}

/** Team ids the user leads (manager scoping). */
export async function ledTeamIds(userId: string): Promise<string[]> {
  const memberships = await db.teamMember.findMany({ where: { userId, isLead: true } });
  return memberships.map((m) => m.teamId);
}

export function taskToDTO(task: TaskWithRelations): Record<string, unknown> {
  return {
    id: task.id,
    key: task.key,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    overdue: isOverdue({ dueDate: task.dueDate, status: task.status, verified: task.verified, delayReason: task.delayReason }),
    delayReason: task.delayReason,
    isSelfInitiated: task.isSelfInitiated,
    githubLink: task.githubLink,
    attachmentName: task.attachmentName,
    verified: task.verified,
    verifiedBy: task.verifiedBy ? { id: task.verifiedBy.id, name: task.verifiedBy.name } : null,
    verifiedAt: task.verifiedAt?.toISOString() ?? null,
    assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name, avatarHue: task.assignee.avatarHue, role: task.assignee.role } : null,
    createdBy: task.createdBy ? { id: task.createdBy.id, name: task.createdBy.name, avatarHue: task.createdBy.avatarHue } : null,
    team: task.team,
    labels: task.labels.map((tl) => ({ id: tl.label.id, name: tl.label.name, color: tl.label.color })),
    commentCount: task.comments.length,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
