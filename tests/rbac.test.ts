import { describe, expect, it } from "vitest";
import {
  canVerify, canEditTask, canAssignTo, canManageUsers, canManageTaxonomy, isLockedByVerification,
  type Actor, type TaskLike,
} from "@/lib/auth/rbac";

/**
 * Authorization boundaries for the ADMIN / MANAGER / MEMBER model.
 * Legacy invariant preserved: members can NEVER verify (testing.py TEST 2).
 */
describe("RBAC matrix", () => {
  const admin: Actor = { id: "u0", role: "ADMIN" };
  const manager: Actor = { id: "u2", role: "MANAGER" };
  const member: Actor = { id: "u1", role: "MEMBER" };
  const other: Actor = { id: "u9", role: "MEMBER" };

  const teamA = "team-a";
  const task = (over: Partial<TaskLike> = {}): TaskLike => ({
    assigneeId: "u1",
    createdById: "u1",
    verified: false,
    teamId: teamA,
    ...over,
  });

  it("legacy TEST 2: only admin/manager can verify; member verification is denied", () => {
    expect(canVerify(admin, task(), [teamA])).toBe(true);
    expect(canVerify(manager, task(), [teamA])).toBe(true);
    expect(canVerify(member, task(), [])).toBe(false);
    expect(canVerify(admin, task({ verified: true }), [])).toBe(false); // already verified
  });

  it("manager verification is scoped to teams they lead", () => {
    expect(canVerify(manager, task(), [teamA])).toBe(true);
    expect(canVerify(manager, task({ teamId: "team-b" }), [teamA])).toBe(false);
  });

  it("edit rights: admin anywhere, manager team-scoped, member own tasks only", () => {
    expect(canEditTask(admin, task({ createdById: "someone-else", assigneeId: null }), [])).toBe(true);
    expect(canEditTask(manager, task({ createdById: "someone-else" }), [teamA])).toBe(true);
    expect(canEditTask(manager, task({ teamId: "team-b", createdById: "x" }), [teamA])).toBe(false);
    expect(canEditTask(member, task(), [])).toBe(true); // own task
    expect(canEditTask(member, task({ createdById: "other", assigneeId: "other" }), [])).toBe(false);
  });

  it("assignment: members can only self-assign or leave unassigned", () => {
    expect(canAssignTo(member, "u1", [])).toBe(true);
    expect(canAssignTo(member, null, [])).toBe(true);
    expect(canAssignTo(member, "u2", [])).toBe(false);
    expect(canAssignTo(manager, "u9", [teamA])).toBe(true);
    expect(canAssignTo(admin, "u9", [])).toBe(true);
  });

  it("user and taxonomy management are admin-only", () => {
    expect(canManageUsers(admin)).toBe(true);
    expect(canManageUsers(manager)).toBe(false);
    expect(canManageTaxonomy(admin)).toBe(true);
    expect(canManageTaxonomy(member)).toBe(false);
  });

  it("verified tasks are locked", () => {
    expect(isLockedByVerification(task({ verified: true }))).toBe(true);
    expect(isLockedByVerification(task({ verified: false }))).toBe(false);
  });
});
