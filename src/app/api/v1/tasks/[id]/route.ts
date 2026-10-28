import { route, zodParse } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { updateTaskSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";
import { getTaskOr404, taskToDTO, TASK_INCLUDE, ledTeamIds } from "@/lib/services/tasks";
import { canAssignTo, canEditTask } from "@/lib/auth/rbac";
import {
  canTransition,
  statusTransitionError,
  requiresDelayReason,
  DELAY_REASON_MESSAGE,
  SELF_INITIATED_MESSAGE,
} from "@/lib/domain/task-rules";
import { recordActivity } from "@/lib/services/users";
import {
  assignedDraft,
  statusChangedDraft,
  type NotificationDraft,
} from "@/lib/domain/notifications";
import { sanitizeText } from "@/lib/domain/sanitize";

/** GET /api/v1/tasks/:id — full detail: comments, activity, commits. */
export const GET = route(async ({ params }) => {
  const id = params.id;
  const task = await getTaskOr404(id);
  const [comments, activities, commits] = await Promise.all([
    db.comment.findMany({
      where: { taskId: task.id },
      include: { author: { select: { id: true, name: true, avatarHue: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.activity.findMany({
      where: { taskId: task.id },
      include: { actor: { select: { id: true, name: true, avatarHue: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.commit.findMany({
      where: { taskId: task.id },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return Response.json({ task: taskToDTO(task), comments, activities, commits });
});

/** PATCH /api/v1/tasks/:id — edit with authorization, transition and legacy rules. */
export const PATCH = route(async ({ req, params, user }) => {
  const id = params.id;
  const body = zodParse(updateTaskSchema, await req.json());
  const task = await getTaskOr404(id);
  const leads = user.role === "ADMIN" ? ["*"] : await ledTeamIds(user.id);
  if (!canEditTask(user, task, leads)) {
    throw new ApiError("FORBIDDEN", "You cannot edit this task.");
  }
  if (task.verified) {
    throw new ApiError("FORBIDDEN", "Verified tasks are locked. Ask an admin to reopen it.");
  }

  // assignment rules
  if (body.assigneeId !== undefined && body.assigneeId !== task.assigneeId) {
    if (!canAssignTo(user, body.assigneeId ?? null, leads)) {
      throw new ApiError("FORBIDDEN", "Members can only assign tasks to themselves.");
    }
  }
  // legacy rule: self-initiated tasks remain self-assigned
  const nextAssignee = body.assigneeId !== undefined ? body.assigneeId : task.assigneeId;
  if (body.isSelfInitiated && nextAssignee !== user.id) {
    throw new ApiError("VALIDATION_ERROR", SELF_INITIATED_MESSAGE);
  }

  // status transition rules
  const nextStatus = body.status ?? task.status;
  if (nextStatus !== task.status && !canTransition(task.status, nextStatus, task.verified)) {
    throw new ApiError("VALIDATION_ERROR", statusTransitionError(task.verified));
  }

  // legacy TEST 4: overdue non-completed tasks must carry delay reasoning
  const nextDue = body.dueDate !== undefined ? body.dueDate : task.dueDate;
  const candidate = {
    dueDate: nextDue,
    status: nextStatus,
    verified: task.verified,
    delayReason: body.delayReason ?? task.delayReason,
  };
  if (requiresDelayReason(candidate) && !candidate.delayReason) {
    throw new ApiError("VALIDATION_ERROR", DELAY_REASON_MESSAGE);
  }

  // diff → activity entries
  const acts: { taskId: string; actorId: string; type: string; detail: string }[] = [];
  const changes: Record<string, unknown> = {};
  if (body.title !== undefined && body.title !== task.title) {
    changes.title = sanitizeText(body.title);
    acts.push({ taskId: task.id, actorId: user.id, type: "EDITED", detail: `title → "${changes.title}"` });
  }
  if (body.description !== undefined && body.description !== task.description) {
    changes.description = sanitizeText(body.description);
    acts.push({ taskId: task.id, actorId: user.id, type: "EDITED", detail: "description updated" });
  }
  if (body.priority !== undefined && body.priority !== task.priority) {
    changes.priority = body.priority;
    acts.push({ taskId: task.id, actorId: user.id, type: "PRIORITY", detail: `priority: ${task.priority} → ${body.priority}` });
  }
  if (body.dueDate !== undefined && (body.dueDate?.getTime() ?? null) !== (task.dueDate?.getTime() ?? null)) {
    changes.dueDate = body.dueDate;
    acts.push({ taskId: task.id, actorId: user.id, type: "DUE", detail: `due date → ${body.dueDate ? body.dueDate.toISOString().slice(0, 10) : "none"}` });
  }
  if (body.delayReason !== undefined && body.delayReason !== task.delayReason) {
    changes.delayReason = sanitizeText(body.delayReason);
    acts.push({ taskId: task.id, actorId: user.id, type: "EDITED", detail: "delay reason updated" });
  }
  if (body.githubLink !== undefined && body.githubLink !== task.githubLink) {
    changes.githubLink = body.githubLink;
    acts.push({ taskId: task.id, actorId: user.id, type: "EDITED", detail: "repo link updated" });
  }
  if (body.attachmentName !== undefined && body.attachmentName !== task.attachmentName) {
    changes.attachmentName = body.attachmentName;
  }
  if (body.isSelfInitiated !== undefined && body.isSelfInitiated !== task.isSelfInitiated) {
    changes.isSelfInitiated = body.isSelfInitiated;
  }
  if (body.teamId !== undefined && body.teamId !== task.teamId) {
    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      throw new ApiError("FORBIDDEN", "Only admins and managers can move tasks between teams.");
    }
    changes.teamId = body.teamId;
    acts.push({ taskId: task.id, actorId: user.id, type: "EDITED", detail: "team changed" });
  }
  if (body.status !== undefined && body.status !== task.status) {
    changes.status = body.status;
    acts.push({ taskId: task.id, actorId: user.id, type: "STATUS_CHANGED", detail: `status: ${task.status} → ${body.status}` });
  }
  if (body.labelIds !== undefined) {
    await db.taskLabel.deleteMany({ where: { taskId: task.id } });
    if (body.labelIds.length) {
      await db.taskLabel.createMany({ data: body.labelIds.map((labelId) => ({ taskId: task.id, labelId })) });
    }
    acts.push({ taskId: task.id, actorId: user.id, type: "LABEL", detail: "labels updated" });
  }

  if (body.assigneeId !== undefined && body.assigneeId !== task.assigneeId) {
    changes.assigneeId = body.assigneeId;
    const targetName = body.assigneeId ? (await db.user.findUnique({ where: { id: body.assigneeId } }))?.name : "nobody";
    acts.push({ taskId: task.id, actorId: user.id, type: "ASSIGNED", detail: `assigned to ${targetName}` });
  }

  if (Object.keys(changes).length > 0) {
    await db.task.update({ where: { id: task.id }, data: changes });
  }
  if (acts.length) await db.activity.createMany({ data: acts });

  // notifications
  const drafts: NotificationDraft[] = [];
  if (changes.assigneeId !== undefined && changes.assigneeId) {
    const d = assignedDraft(changes.assigneeId as string, { id: user.id, name: user.name }, { id: task.id, key: task.key, title: task.title });
    if (d) drafts.push(d);
  }
  if (body.status !== undefined && body.status !== task.status) {
    const recipients = [task.assigneeId, task.createdById].filter((x): x is string => !!x);
    drafts.push(...statusChangedDraft(recipients, { id: user.id, name: user.name }, { id: task.id, key: task.key, title: task.title }, task.status, body.status));
  }
  if (drafts.length) await db.notification.createMany({ data: drafts });

  await recordActivity(user.id);

  const fresh = await db.task.findUnique({ where: { id: task.id }, include: TASK_INCLUDE });
  return Response.json({ task: fresh ? taskToDTO(fresh) : null });
});
