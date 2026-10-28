import { route } from "@/lib/api/route";
import { db } from "@/lib/db";
import { startOfToday, isOverdue, progressPercent } from "@/lib/domain/task-rules";
import { dueReminderDraft, type NotificationDraft } from "@/lib/domain/notifications";

/**
 * GET /api/v1/dashboard — aggregate stats for the overview:
 * totals, per-status, overdue, due-soon, per-user + per-team breakdowns,
 * leaderboard (streak/points), progress %, and recent activity.
 *
 * Also generates DUE_SOON / OVERDUE notifications for the current user
 * (deduped per task+type per day) so due-date reminders exist without a cron.
 */
export const GET = route(async ({ user }) => {
  const today = startOfToday();
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 2);
  soon.setHours(23, 59, 59, 999);

  const tasks = await db.task.findMany({
    select: {
      id: true, key: true, title: true, status: true, priority: true,
      dueDate: true, verified: true, isSelfInitiated: true,
      assigneeId: true, teamId: true,
      assignee: { select: { id: true, name: true, avatarHue: true } },
      team: { select: { id: true, name: true } },
    },
  });

  const byStatus = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 } as Record<string, number>;
  const byPriority = { LOW: 0, MEDIUM: 0, HIGH: 0 } as Record<string, number>;
  let overdue = 0;
  let dueSoon = 0;
  let unverified = 0;
  const perUser = new Map<string, { id: string; name: string; avatarHue: number; total: number; completed: number; inProgress: number; overdue: number }>();
  const perTeam = new Map<string, { id: string; name: string; total: number; completed: number }>();
  const dueSoonList: { id: string; key: string; title: string; dueDate: string | null; priority: string }[] = [];

  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
    const od = isOverdue({ dueDate: t.dueDate, status: t.status, verified: t.verified, delayReason: "" });
    if (od) overdue += 1;
    if (t.status === "COMPLETED" && !t.verified) unverified += 1;
    if (t.dueDate && t.dueDate >= today && t.dueDate <= soon && t.status !== "COMPLETED") {
      dueSoon += 1;
      dueSoonList.push({ id: t.id, key: t.key, title: t.title, dueDate: t.dueDate.toISOString(), priority: t.priority });
    }
    if (t.assignee) {
      const entry = perUser.get(t.assigneeId!) ?? {
        id: t.assignee.id, name: t.assignee.name, avatarHue: t.assignee.avatarHue,
        total: 0, completed: 0, inProgress: 0, overdue: 0,
      };
      entry.total += 1;
      if (t.status === "COMPLETED") entry.completed += 1;
      if (t.status === "IN_PROGRESS") entry.inProgress += 1;
      if (od) entry.overdue += 1;
      perUser.set(t.assigneeId!, entry);
    }
    const team = perTeam.get(t.teamId) ?? { id: t.team.id, name: t.team.name, total: 0, completed: 0 };
    team.total += 1;
    if (t.status === "COMPLETED") team.completed += 1;
    perTeam.set(t.teamId, team);
  }

  const leaderboard = await db.user.findMany({
    where: { role: { not: "ADMIN" } },
    select: { id: true, name: true, avatarHue: true, role: true, points: true, streak: true, lastActiveDate: true },
    orderBy: [{ points: "desc" }, { streak: "desc" }],
    take: 8,
  });

  const recentActivity = await db.activity.findMany({
    include: {
      actor: { select: { id: true, name: true, avatarHue: true } },
      task: { select: { id: true, key: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // --- due reminders for the current user (deduped per task+type+day) ---
  const myOpen = tasks.filter((t) => t.assigneeId === user.id && t.status !== "COMPLETED" && t.dueDate);
  const todayStr = today.toISOString().slice(0, 10);
  const drafts: NotificationDraft[] = [];
  for (const t of myOpen) {
    const kind = isOverdue({ dueDate: t.dueDate, status: t.status, verified: t.verified, delayReason: "" }) ? "OVERDUE" : (t.dueDate! <= soon ? "DUE_SOON" : null);
    if (!kind) continue;
    const existing = await db.notification.findFirst({
      where: { userId: user.id, taskId: t.id, type: kind, createdAt: { gte: today } },
    });
    if (!existing) {
      drafts.push(dueReminderDraft(user.id, { id: t.id, key: t.key, title: t.title }, kind));
    }
  }
  if (drafts.length) await db.notification.createMany({ data: drafts });

  return Response.json({
    totals: {
      tasks: tasks.length,
      ...byStatus,
      overdue,
      dueSoon,
      unverified,
      progress: progressPercent(tasks.map((t) => ({ status: t.status, verified: t.verified }))),
      today: todayStr,
    },
    byStatus,
    byPriority,
    perUser: [...perUser.values()].sort((a, b) => b.total - a.total),
    perTeam: [...perTeam.values()],
    leaderboard,
    dueSoonList: dueSoonList.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? "")).slice(0, 6),
    recentActivity,
  });
});
