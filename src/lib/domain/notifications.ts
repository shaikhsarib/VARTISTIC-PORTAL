/**
 * Notification generation — pure builders (unit-tested) + persistence helpers.
 * Types: ASSIGNED, MENTION, COMMENT, DUE_SOON, OVERDUE, STATUS_CHANGED, VERIFIED.
 */

export type NotificationDraft = {
  userId: string;
  actorId: string | null;
  type: "ASSIGNED" | "MENTION" | "COMMENT" | "DUE_SOON" | "OVERDUE" | "STATUS_CHANGED" | "VERIFIED";
  title: string;
  body: string;
  taskId?: string | null;
};

/** Extract @mentions from free text. Matches @name up to word boundary. */
export function extractMentions(text: string, userNames: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const name of userNames) {
    const needle = "@" + name.toLowerCase();
    const idx = lower.indexOf(needle);
    if (idx === -1) continue;
    const before = idx === 0 ? "" : lower[idx - 1];
    const after = lower[idx + needle.length];
    const isWordStart = before === "" || /[^a-z0-9_]/i.test(before);
    const isWordEnd = after === undefined || /[^a-z0-9_]/i.test(after);
    if (isWordStart && isWordEnd) found.add(name);
  }
  return [...found];
}

export function mentionDrafts(
  text: string,
  users: { id: string; name: string }[],
  actor: { id: string; name: string },
  task: { id: string; key: string; title: string },
): NotificationDraft[] {
  const mentioned = extractMentions(text, users.map((u) => u.name));
  return users
    .filter((u) => mentioned.includes(u.name) && u.id !== actor.id)
    .map<NotificationDraft>((u) => ({
      userId: u.id,
      actorId: actor.id,
      type: "MENTION",
      title: `${actor.name} mentioned you on ${task.key}`,
      body: task.title,
      taskId: task.id,
    }));
}

export function assignedDraft(
  assigneeId: string,
  actor: { id: string; name: string },
  task: { id: string; key: string; title: string },
): NotificationDraft | null {
  if (assigneeId === actor.id) return null;
  return {
    userId: assigneeId,
    actorId: actor.id,
    type: "ASSIGNED",
    title: `${actor.name} assigned you ${task.key}`,
    body: task.title,
    taskId: task.id,
  };
}

export function commentDraft(
  recipients: string[],
  actor: { id: string; name: string },
  task: { id: string; key: string; title: string },
): NotificationDraft[] {
  return [...new Set(recipients)]
    .filter((id) => id !== actor.id)
    .map<NotificationDraft>((userId) => ({
      userId,
      actorId: actor.id,
      type: "COMMENT",
      title: `${actor.name} commented on ${task.key}`,
      body: task.title,
      taskId: task.id,
    }));
}

export function statusChangedDraft(
  recipients: string[],
  actor: { id: string; name: string },
  task: { id: string; key: string; title: string },
  from: string,
  to: string,
): NotificationDraft[] {
  return [...new Set(recipients)]
    .filter((id) => id !== actor.id)
    .map<NotificationDraft>((userId) => ({
      userId,
      actorId: actor.id,
      type: "STATUS_CHANGED",
      title: `${task.key} moved ${from} → ${to}`,
      body: task.title,
      taskId: task.id,
    }));
}

export function verifiedDraft(
  recipients: string[],
  actor: { id: string; name: string },
  task: { id: string; key: string; title: string },
): NotificationDraft[] {
  return [...new Set(recipients)]
    .filter((id) => id !== actor.id)
    .map<NotificationDraft>((userId) => ({
      userId,
      actorId: actor.id,
      type: "VERIFIED",
      title: `${actor.name} verified ${task.key}`,
      body: task.title,
      taskId: task.id,
    }));
}

/** Due-soon / overdue reminder (deduped per user+task per day by the caller). */
export function dueReminderDraft(
  userId: string,
  task: { id: string; key: string; title: string },
  kind: "DUE_SOON" | "OVERDUE",
): NotificationDraft {
  return {
    userId,
    actorId: null,
    type: kind,
    title: kind === "DUE_SOON" ? `${task.key} is due within 48 hours` : `${task.key} is overdue`,
    body: task.title,
    taskId: task.id,
  };
}
