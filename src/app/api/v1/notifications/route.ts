import { route, zodParse } from "@/lib/api/route";
import { readNotificationsSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";

/** GET /api/v1/notifications — newest first, with unread count. */
export const GET = route(async ({ user }) => {
  const [notifications, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      include: {
        actor: { select: { id: true, name: true, avatarHue: true } },
        task: { select: { id: true, key: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return Response.json({ notifications, unread });
});

/** POST /api/v1/notifications/read — mark {ids} or everything read. */
export const POST = route(async ({ req, user }) => {
  const body = zodParse(readNotificationsSchema, await req.json());
  const where = body.all
    ? { userId: user.id, readAt: null }
    : { userId: user.id, id: { in: body.ids ?? [] }, readAt: null };
  const result = await db.notification.updateMany({ where, data: { readAt: new Date() } });
  return Response.json({ updated: result.count });
});
