import type { Food, LogEntry, MealCategory, NutritionItem } from "./types";
import { isSameDay } from "./utils";

// Browser-side food log (localStorage). Used so the app fully works on Vercel
// without a writable server filesystem. The server /api/log routes remain for a
// future switch to a hosted DB (Upstash/Vercel KV) for cross-device sync.

const KEY = "nutritrack:log";

function readAll(): LogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(log: LogEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(log));
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Today's entries, newest first. */
export function loadToday(): LogEntry[] {
  return readAll()
    .filter((e) => isSameDay(e.loggedAt))
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

/** Add a catalog food to a meal; returns the new entry. */
export function addFoodEntry(food: Food, meal: MealCategory): LogEntry {
  const entry: LogEntry = {
    ...food,
    entryId: crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
    meal,
  };
  writeAll([entry, ...readAll()]);
  return entry;
}

/** Add an arbitrary (AI-found) item to a meal; numbers are sanitized. */
export function addItemEntry(item: NutritionItem, meal: MealCategory): LogEntry {
  const entry: LogEntry = {
    id: crypto.randomUUID(),
    name: String(item.name || "").trim() || "Food",
    servingSize: String(item.servingSize || "").trim() || "1 serving",
    calories: num(item.calories),
    protein: num(item.protein),
    carbs: num(item.carbs),
    fat: num(item.fat),
    entryId: crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
    meal,
  };
  writeAll([entry, ...readAll()]);
  return entry;
}

/** Remove a single entry. */
export function removeEntry(entryId: string): void {
  writeAll(readAll().filter((e) => e.entryId !== entryId));
}

/** Clear all of today's entries. */
export function clearToday(): void {
  writeAll(readAll().filter((e) => !isSameDay(e.loggedAt)));
}
