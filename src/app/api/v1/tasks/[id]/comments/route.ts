import { route, zodParse } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { commentSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";
import { getTaskOr404 } from "@/lib/services/tasks";
import { commentDraft, mentionDrafts } from "@/lib/domain/notifications";
import { sanitizeText } from "@/lib/domain/sanitize";
import { recordActivity } from "@/lib/services/users";

/**
 * POST /api/v1/tasks/:id/comments — threaded comment on a task.
 * Body is sanitized (all HTML stripped). Mentions (@name) and thread
 * participants generate notifications.
 */
export const POST = route(async ({ req, params, user }) => {
  const body = zodParse(commentSchema, await req.json());
  const task = await getTaskOr404(params.id);

  let parentAuthorId: string | null = null;
  if (body.parentId) {
    const parent = await db.comment.findUnique({ where: { id: body.parentId } });
    if (!parent || parent.taskId !== task.id) {
      throw new ApiError("VALIDATION_ERROR", "Parent comment not found on this task.");
    }
    parentAuthorId = parent.authorId;
  }

  const clean = sanitizeText(body.body);
  if (!clean.trim()) {
    throw new ApiError("VALIDATION_ERROR", "Comment cannot be empty.");
  }

  const comment = await db.comment.create({
    data: {
      taskId: task.id,
      authorId: user.id,
      body: clean,
      parentId: body.parentId ?? null,
    },
    include: { author: { select: { id: true, name: true, avatarHue: true } } },
  });
  await db.activity.create({
    data: { taskId: task.id, actorId: user.id, type: "COMMENT", detail: clean.slice(0, 120) },
  });

  // notifications: mentions + participants (assignee/creator) + parent author
  const allUsers = await db.user.findMany({ select: { id: true, name: true } });
  const drafts = [
    ...mentionDrafts(clean, allUsers, { id: user.id, name: user.name }, { id: task.id, key: task.key, title: task.title }),
    ...commentDraft(
      [task.assigneeId, task.createdById, parentAuthorId].filter((x): x is string => !!x),
      { id: user.id, name: user.name },
      { id: task.id, key: task.key, title: task.title },
    ),
  ];
  if (drafts.length) await db.notification.createMany({ data: drafts });
  await recordActivity(user.id);

  return Response.json({ comment }, { status: 201 });
});
