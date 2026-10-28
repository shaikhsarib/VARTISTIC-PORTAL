/**
 * Role-based access control matrix — pure functions, unit-tested.
 *
 * Role model (documented decision, to review):
 * - ADMIN: org-wide authority. Manages users, teams, labels, any task; verifies any task.
 *   Inherits the legacy "validation-only authority": only ADMIN/MANAGER may verify.
 * - MANAGER: team-scoped authority. Creates/assigns tasks, edits any task in a team they
 *   lead, verifies tasks in their teams. Cannot manage org users or global labels.
 * - MEMBER: self-scoped. Creates tasks (assigned to self or unassigned, including
 *   self-initiated "extra work"), edits own tasks, logs commits, comments anywhere,
 *   changes status of tasks assigned to them. Can NEVER verify.
 */

export type Role = "ADMIN" | "MANAGER" | "MEMBER";

export type Actor = {
  id: string;
  role: Role;
};

export type TaskLike = {
  assigneeId: string | null;
  createdById: string;
  verified: boolean;
  teamId: string;
};

/** Roles allowed to verify a task (legacy: admin validation-only authority). */
export function canVerify(actor: Actor, task: TaskLike, leadTeamIds: string[]): boolean {
  if (task.verified) return false;
  if (actor.role === "ADMIN") return true;
  if (actor.role === "MANAGER") return leadTeamIds.includes(task.teamId);
  return false;
}

export function canEditTask(actor: Actor, task: TaskLike, leadTeamIds: string[]): boolean {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "MANAGER") return leadTeamIds.includes(task.teamId);
  return task.createdById === actor.id || task.assigneeId === actor.id;
}

/** Who can change status: same matrix as editing; members only on own tasks. */
export const canChangeStatus = canEditTask;

/** Assignment: admins/managers can assign anyone; members can only self-assign. */
export function canAssignTo(actor: Actor, targetUserId: string | null, leadTeamIds: string[]): boolean {
  if (actor.role === "ADMIN") return true;
  if (actor.role === "MANAGER") return true; // team membership validated at service level
  return targetUserId === actor.id || targetUserId === null;
}

/** User management (role changes, deactivation) is admin-only. */
export function canManageUsers(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/** Global label/team management is admin-only. */
export function canManageTaxonomy(actor: Actor): boolean {
  return actor.role === "ADMIN";
}

/** Task creation: everyone can create; members must assign to self or leave unassigned. */
export function canCreateTask(actor: Actor): boolean {
  return actor.role === "ADMIN" || actor.role === "MANAGER" || actor.role === "MEMBER";
}

/** Immutable fields members cannot touch once a task is verified (audit lock). */
export function isLockedByVerification(task: TaskLike): boolean {
  return task.verified;
}
