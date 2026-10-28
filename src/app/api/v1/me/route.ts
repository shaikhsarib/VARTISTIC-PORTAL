import { route, zodParse } from "@/lib/api/route";
import { updateMeSchema } from "@/lib/validation/schemas";
import { db } from "@/lib/db";
import { ledTeamIds } from "@/lib/services/tasks";

/** GET /api/v1/me — current profile + teams I lead (for UI capability flags). */
export const GET = route(async ({ user }) => {
  const [me, leads] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        title: true,
        profileCompleted: true,
        avatarHue: true,
        points: true,
        streak: true,
        lastActiveDate: true,
        github: true,
        repo: true,
        soundEnabled: true,
        createdAt: true,
      } as any,
    }) as Promise<any>,
    ledTeamIds(user.id),
  ]);
  return Response.json({ user: me, ledTeamIds: leads });
});

/** PATCH /api/v1/me — profile setup, preferences, and identity. */
export const PATCH = route(async ({ req, user }) => {
  const body = zodParse(updateMeSchema, await req.json());
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.avatarHue !== undefined ? { avatarHue: body.avatarHue } : {}),
      ...(body.profileCompleted !== undefined ? { profileCompleted: body.profileCompleted } : {}),
      ...(body.soundEnabled !== undefined ? { soundEnabled: body.soundEnabled } : {}),
      ...(body.github !== undefined ? { github: body.github } : {}),
      ...(body.repo !== undefined ? { repo: body.repo } : {}),
    } as any,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      title: true,
      profileCompleted: true,
      avatarHue: true,
      soundEnabled: true,
      github: true,
      repo: true,
    } as any,
  });
  return Response.json({ user: updated });
});
