import { describe, expect, it } from "vitest";
import {
  isOverdue, isUnresolved, requiresDelayReason, canTransition,
  DELAY_REASON_MESSAGE, progressPercent,
} from "@/lib/domain/task-rules";

/** Legacy TEST 4 + 5 invariants and the status transition rules. */
describe("task rules", () => {
  const now = new Date(2026, 9, 28, 10, 0, 0); // fixed date: 2026-10-28
  const daysAgo = (n: number) => new Date(2026, 9, 28 - n, 12, 0, 0);
  const daysAhead = (n: number) => new Date(2026, 9, 28 + n, 12, 0, 0);

  const task = (over: Partial<Parameters<typeof isOverdue>[0]> = {}) => ({
    dueDate: daysAgo(1),
    status: "PENDING",
    verified: false,
    delayReason: "",
    ...over,
  });

  it("legacy TEST 4: overdue tasks are detected (dueDate < today, not completed)", () => {
    expect(isOverdue(task(), now)).toBe(true);
    expect(isOverdue(task({ status: "COMPLETED" }), now)).toBe(false);
    expect(isOverdue(task({ dueDate: daysAhead(1) }), now)).toBe(false);
    expect(isOverdue(task({ dueDate: null }), now)).toBe(false);
  });

  it("legacy parity: isUnresolved matches testing.py (deadline < today and not verified)", () => {
    expect(isUnresolved(task(), now)).toBe(true);
    expect(isUnresolved(task({ status: "COMPLETED" }), now)).toBe(true); // completed but unverified
    expect(isUnresolved(task({ verified: true }), now)).toBe(false);
  });

  it("delay reasoning is required for overdue non-completed tasks", () => {
    expect(requiresDelayReason(task(), now)).toBe(true);
    expect(requiresDelayReason(task({ status: "COMPLETED" }), now)).toBe(false);
    expect(requiresDelayReason(task({ dueDate: daysAhead(2) }), now)).toBe(false);
  });

  it("exposes the exact legacy delay-reason message", () => {
    expect(DELAY_REASON_MESSAGE).toBe("Overdue or blocked tasks must carry explicit delay reasoning.");
  });

  it("status transitions are valid within the kanban set and locked when verified", () => {
    expect(canTransition("PENDING", "IN_PROGRESS", false)).toBe(true);
    expect(canTransition("IN_PROGRESS", "COMPLETED", false)).toBe(true);
    expect(canTransition("COMPLETED", "IN_PROGRESS", false)).toBe(true); // reopen allowed pre-verify
    expect(canTransition("PENDING", "DONE", false)).toBe(false); // unknown status
    expect(canTransition("PENDING", "IN_PROGRESS", true)).toBe(false); // verified lock
  });

  it("progress weighting: verified > completed > in-progress", () => {
    const allDone = [
      { status: "COMPLETED", verified: true },
      { status: "COMPLETED", verified: true },
    ];
    expect(progressPercent(allDone)).toBe(100);
    expect(progressPercent([])).toBe(0);
    const mixed = [
      { status: "PENDING", verified: false },
      { status: "IN_PROGRESS", verified: false },
      { status: "COMPLETED", verified: true },
    ];
    const p = progressPercent(mixed);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(100);
  });
});
