import { route } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { getTaskOr404, ledTeamIds, taskToDTO, TASK_INCLUDE } from "@/lib/services/tasks";
import { canVerify } from "@/lib/auth/rbac";
import { verifiedDraft } from "@/lib/domain/notifications";
import { recordActivity } from "@/lib/services/users";
import { POINTS_TASK_VERIFIED } from "@/lib/domain/streaks";

/**
 * POST /api/v1/tasks/:id/verify — admin/manager verification only
 * (legacy rule: members can never verify). Grants +40 XP to the assignee.
 */
export const POST = route(async ({ params, user }) => {
  const task = await getTaskOr404(params.id);
  const leads = user.role === "ADMIN" ? ["*"] : await ledTeamIds(user.id);
  if (!canVerify(user, task, leads)) {
    throw new ApiError("FORBIDDEN", "Only admins and team managers can verify tasks.");
  }
  if (task.status !== "COMPLETED") {
    throw new ApiError("VALIDATION_ERROR", "Only completed tasks can be verified.");
  }

  await db.task.update({
    where: { id: task.id },
    data: { verified: true, verifiedById: user.id, verifiedAt: new Date() },
  });
  await db.activity.create({
    data: { taskId: task.id, actorId: user.id, type: "VERIFIED", detail: `verified by ${user.name}` },
  });
  if (task.assigneeId) {
    await recordActivity(task.assigneeId, POINTS_TASK_VERIFIED);
  }
  const recipients = [task.assigneeId, task.createdById].filter((x): x is string => !!x);
  const drafts = verifiedDraft(recipients, { id: user.id, name: user.name }, { id: task.id, key: task.key, title: task.title });
  if (drafts.length) await db.notification.createMany({ data: drafts });

  const fresh = await db.task.findUnique({ where: { id: task.id }, include: TASK_INCLUDE });
  return Response.json({ task: fresh ? taskToDTO(fresh) : null });
});
