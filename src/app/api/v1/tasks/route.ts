import { route, zodParse } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { createTaskSchema, taskQuerySchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";
import {
  buildTaskOrderBy,
  buildTaskWhere,
  nextTaskKey,
  taskToDTO,
  TASK_INCLUDE,
} from "@/lib/services/tasks";
import { recordActivity } from "@/lib/services/users";
import { canAssignTo, canCreateTask } from "@/lib/auth/rbac";
import { assignedDraft } from "@/lib/domain/notifications";
import { sanitizeText } from "@/lib/domain/sanitize";
import { POINTS_EXTRA_WORK } from "@/lib/domain/streaks";

/** GET /api/v1/tasks — filterable, sortable task list (all params validated). */
export const GET = route(async ({ req, user }) => {
  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const filter = zodParse(taskQuerySchema, raw);
  const where = buildTaskWhere(filter, user);
  const tasks = await db.task.findMany({
    where,
    orderBy: buildTaskOrderBy(filter),
    include: TASK_INCLUDE,
    take: 300,
  });
  let dtos = tasks.map(taskToDTO);
  if (filter.sort === "priority") {
    const weight: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    dtos = dtos.sort((a, b) => weight[a.priority as string] - weight[b.priority as string]);
  }
  return Response.json({ tasks: dtos, count: dtos.length });
});

/** POST /api/v1/tasks — create with role-based assignment rules. */
export const POST = route(async ({ req, user }) => {
  const body = zodParse(createTaskSchema, await req.json());
  if (!canCreateTask(user)) throw new ApiError("FORBIDDEN", "You cannot create tasks.");

  // members may only assign to themselves or leave unassigned
  if (!canAssignTo(user, body.assigneeId ?? null, [])) {
    throw new ApiError("FORBIDDEN", "Members can only create tasks assigned to themselves.");
  }

  // legacy rule: self-initiated extra work is always self-assigned
  if (body.isSelfInitiated && body.assigneeId !== user.id) {
    throw new ApiError("VALIDATION_ERROR", "Self-initiated extra work must be assigned to yourself.");
  }

  // team must exist; managers/members create within teams they belong to, admin anywhere
  const team = await db.team.findUnique({ where: { id: body.teamId } });
  if (!team) throw new ApiError("VALIDATION_ERROR", "Unknown team.", [
    { field: "teamId", message: "Unknown team" },
  ]);
  if (user.role !== "ADMIN") {
    const membership = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: user.id } },
    });
    if (!membership) throw new ApiError("FORBIDDEN", "You can only create tasks in your own teams.");
  }

  // overdue-at-creation tasks need a delay reason (legacy TEST 4)
  const now = new Date();
  if (body.dueDate && body.dueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()) && body.status !== "COMPLETED" && !body.delayReason) {
    throw new ApiError("VALIDATION_ERROR", "Overdue or blocked tasks must carry explicit delay reasoning.");
  }

  const key = await nextTaskKey();
  const task = await db.task.create({
    data: {
      key,
      title: sanitizeText(body.title),
      description: sanitizeText(body.description ?? ""),
      status: body.status ?? "PENDING",
      priority: body.priority ?? "MEDIUM",
      dueDate: body.dueDate ?? null,
      delayReason: sanitizeText(body.delayReason ?? ""),
      isSelfInitiated: body.isSelfInitiated ?? false,
      githubLink: body.githubLink ?? null,
      attachmentName: body.attachmentName ?? null,
      assigneeId: body.assigneeId ?? null,
      createdById: user.id,
      teamId: team.id,
      labels: body.labelIds?.length
        ? { create: body.labelIds.map((labelId) => ({ labelId })) }
        : undefined,
    },
    include: TASK_INCLUDE,
  });

  const acts = [
    { taskId: task.id, actorId: user.id, type: "CREATED", detail: `created ${key}` },
  ];
  if (body.assigneeId) {
    acts.push({ taskId: task.id, actorId: user.id, type: "ASSIGNED", detail: `assigned to ${task.assignee?.name ?? "member"}` });
  }
  await db.activity.createMany({ data: acts });

  if (body.assigneeId) {
    const draft = assignedDraft(body.assigneeId, { id: user.id, name: user.name }, { id: task.id, key, title: task.title });
    if (draft) await db.notification.create({ data: draft });
  }
  await recordActivity(user.id, body.isSelfInitiated ? POINTS_EXTRA_WORK : 0);

  return Response.json({ task: taskToDTO(task) }, { status: 201 });
});
