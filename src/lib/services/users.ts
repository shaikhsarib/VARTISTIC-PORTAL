/**
 * User services — streak/points recording (ported legacy rule) + persistence.
 */
import { db } from "@/lib/db";
import { updateStreak, toISODate } from "@/lib/domain/streaks";

/** Record activity for a user: updates streak + points exactly like legacy testing.py. */
export async function recordActivity(userId: string, extraPoints = 0): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const next = updateStreak(
    { streak: user.streak, points: user.points, lastActiveDate: user.lastActiveDate ?? "" },
    new Date(),
  );
  await db.user.update({
    where: { id: userId },
    data: { streak: next.streak, points: next.points + extraPoints, lastActiveDate: toISODate(new Date()) },
  });
}
