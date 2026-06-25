import type { LogEntry, MacroTargets, Totals } from "./types";

/** Default daily calorie goal (kcal) when the user hasn't set one. */
export const DEFAULT_CALORIE_GOAL = 2000;

/** True if an ISO timestamp falls on the same calendar day as `now`. */
export function isSameDay(iso: string, now: Date = new Date()): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** Sum macros + calories over a list of log entries. */
export function sumTotals(entries: LogEntry[]): Totals {
  return entries.reduce<Totals>(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Round to at most 1 decimal place for display. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Format a number with thousands separators (e.g. 1234 -> "1,234"). */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Macro gram targets from a calorie goal using a balanced 30/40/30 split
 * (protein/carbs/fat). Protein & carbs are 4 kcal/g, fat is 9 kcal/g.
 */
export function macroTargets(goal: number): MacroTargets {
  return {
    protein: Math.round((goal * 0.3) / 4),
    carbs: Math.round((goal * 0.4) / 4),
    fat: Math.round((goal * 0.3) / 9),
  };
}

/** Color status for the calorie goal: green (on track) → amber (close) → red (over). */
export function calorieStatus(ratio: number): "good" | "warn" | "over" {
  if (ratio > 1) return "over";
  if (ratio >= 0.85) return "warn";
  return "good";
}

/** Today's date formatted like "Thursday, June 25". */
export function formatToday(now: Date = new Date()): string {
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
