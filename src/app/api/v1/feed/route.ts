import { route, zodParse } from "@/lib/api/route";
import { feedPostSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/services/users";
import { sanitizeText } from "@/lib/domain/sanitize";

/** GET /api/v1/feed — standup broadcast (Progress / Commit / Blocker). */
export const GET = route(async () => {
  const posts = await db.feedPost.findMany({
    include: { author: { select: { id: true, name: true, avatarHue: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return Response.json({ posts });
});

/** POST /api/v1/feed — publish a live daily update (legacy standup feed). */
export const POST = route(async ({ req, user }) => {
  const body = zodParse(feedPostSchema, await req.json());
  const post = await db.feedPost.create({
    data: { authorId: user.id, type: body.type, text: sanitizeText(body.text) },
    include: { author: { select: { id: true, name: true, avatarHue: true, role: true } } },
  });
  await recordActivity(user.id);
  return Response.json({ post }, { status: 201 });
});
