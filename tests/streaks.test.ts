import { describe, expect, it } from "vitest";
import { updateStreak, toISODate, yesterdayOf, POINTS_PER_ACTIVITY, POINTS_EXTRA_WORK } from "@/lib/domain/streaks";

/**
 * Port of the legacy `testing.py` TEST 3 (CONSECUTIVE STREAK CALCULATION):
 * - activity today → points only, streak unchanged
 * - activity yesterday → streak+1, points+30
 * - gap → streak resets to 1
 */
describe("streak engine (ported from testing.py)", () => {
  const today = new Date();
  const state = (streak: number, points: number, last: string) => ({ streak, points, lastActiveDate: last });

  it("increments a streak when the last activity was yesterday", () => {
    // Ritesh contributed yesterday (streak 4) → activity today → 5
    const next = updateStreak(state(4, 340, toISODate(new Date(today.getTime() - 86400000))), today);
    expect(next.streak).toBe(5);
    expect(next.points).toBe(340 + POINTS_PER_ACTIVITY);
    expect(next.lastActiveDate).toBe(toISODate(today));
  });

  it("keeps the streak unchanged when activity already recorded today", () => {
    // sarib already contributed today (streak 6) → stays 6, points still increase
    const next = updateStreak(state(6, 520, toISODate(today)), today);
    expect(next.streak).toBe(6);
    expect(next.points).toBe(520 + POINTS_PER_ACTIVITY);
  });

  it("resets the streak to 1 after a gap day", () => {
    // Rohit last active two days ago (streak 1) → stays 1 after today's activity
    const next = updateStreak(state(1, 140, toISODate(new Date(today.getTime() - 2 * 86400000))), today);
    expect(next.streak).toBe(1);
    expect(next.points).toBe(140 + POINTS_PER_ACTIVITY);
  });

  it("starts a streak from zero for a brand-new user", () => {
    const next = updateStreak(state(0, 0, ""), today);
    expect(next.streak).toBe(1);
    expect(next.points).toBe(POINTS_PER_ACTIVITY);
  });

  it("yesterdayOf is correct across month boundaries", () => {
    expect(yesterdayOf("2026-03-01")).toBe("2026-02-28");
    expect(yesterdayOf("2026-01-01")).toBe("2025-12-31");
  });

  it("exposes legacy point constants", () => {
    expect(POINTS_PER_ACTIVITY).toBe(30);
    expect(POINTS_EXTRA_WORK).toBe(50);
  });
});
