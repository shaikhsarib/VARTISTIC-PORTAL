/**
 * Streak & points engine — exact port of the legacy `testing.py` rules
 * (Task 3: CONSECUTIVE STREAK CALCULATION) so behavior is preserved 1:1.
 *
 * Rules:
 * - Activity already recorded today → points only, streak unchanged.
 * - Activity yesterday → streak += 1, points += 30.
 * - Otherwise (gap / first ever) → streak resets to 1, points += 30.
 */
export const POINTS_PER_ACTIVITY = 30;
export const POINTS_EXTRA_WORK = 50; // legacy "Log Extra Work (+50 XP)"
export const POINTS_TASK_COMPLETED = 30;
export const POINTS_TASK_VERIFIED = 40;

export type StreakState = {
  streak: number;
  points: number;
  lastActiveDate: string; // "YYYY-MM-DD" or ""
};

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function yesterdayOf(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}

export function updateStreak(state: StreakState, activeDate: Date): StreakState {
  const todayStr = toISODate(activeDate);
  const yesterdayStr = toISODate(new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() - 1));

  if (state.lastActiveDate === todayStr) {
    return { ...state, points: state.points + POINTS_PER_ACTIVITY };
  }
  if (state.lastActiveDate === yesterdayStr) {
    return {
      ...state,
      streak: state.streak + 1,
      points: state.points + POINTS_PER_ACTIVITY,
      lastActiveDate: todayStr,
    };
  }
  return {
    ...state,
    streak: 1,
    points: state.points + POINTS_PER_ACTIVITY,
    lastActiveDate: todayStr,
  };
}
