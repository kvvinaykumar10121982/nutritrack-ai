import type { MealCategory } from "./types";

/** Meal categories in display order, with labels and emoji marks. */
export const MEALS: { id: MealCategory; label: string; icon: string }[] = [
  { id: "breakfast", label: "Breakfast", icon: "🌅" },
  { id: "lunch", label: "Lunch", icon: "🥪" },
  { id: "dinner", label: "Dinner", icon: "🍽️" },
  { id: "snack", label: "Snack", icon: "🍎" },
];

export const MEAL_IDS = MEALS.map((m) => m.id);

export function isMealCategory(v: unknown): v is MealCategory {
  return typeof v === "string" && (MEAL_IDS as string[]).includes(v);
}

export function mealLabel(id: MealCategory): string {
  return MEALS.find((m) => m.id === id)?.label ?? "Snack";
}

/** Sensible default meal based on the time of day. */
export function mealForTime(now: Date = new Date()): MealCategory {
  const h = now.getHours();
  if (h >= 4 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 21) return "dinner";
  return "snack";
}
