import { route } from "@/lib/api/route";
import { db } from "@/lib/db";
import { ledTeamIds } from "@/lib/services/tasks";

/** GET /api/v1/meta — everything filter bars need in one round trip. */
export const GET = route(async ({ user }) => {
  const [users, teams, labels, leads] = await Promise.all([
    db.user.findMany({
      select: { id: true, name: true, role: true, avatarHue: true },
      orderBy: { name: "asc" },
    }),
    db.team.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    db.label.findMany({ select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
    ledTeamIds(user.id),
  ]);
  return Response.json({ users, teams, labels, ledTeamIds: leads });
});
