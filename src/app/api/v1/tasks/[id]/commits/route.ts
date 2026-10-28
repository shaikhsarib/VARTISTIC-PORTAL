import { route, zodParse } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { commitSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";
import { getTaskOr404 } from "@/lib/services/tasks";
import { recordActivity } from "@/lib/services/users";

/**
 * POST /api/v1/tasks/:id/commits — legacy "commits tray": the assignee logs
 * code pushes (hash + message) against their task. Admins/managers may log
 * on behalf of the assignee.
 */
export const POST = route(async ({ req, params, user }) => {
  const body = zodParse(commitSchema, await req.json());
  const task = await getTaskOr404(params.id);

  const isSelf = task.assigneeId === user.id;
  const isAdminOrManager = user.role === "ADMIN" || user.role === "MANAGER";
  if (!isSelf && !isAdminOrManager) {
    throw new ApiError("FORBIDDEN", "Only the assignee can log commits on this task.");
  }

  const commit = await db.commit.create({
    data: {
      taskId: task.id,
      authorId: user.id,
      hash: body.hash,
      msg: body.msg,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  await db.activity.create({
    data: { taskId: task.id, actorId: user.id, type: "COMMIT", detail: `${commit.hash} — ${commit.msg}` },
  });
  await recordActivity(user.id);

  return Response.json({ commit }, { status: 201 });
});
