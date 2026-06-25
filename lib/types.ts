// Shared types for the calorie tracker.

/** A food item in the static catalog. Macros are per the given serving size. */
export type Food = {
  id: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
};

/** Which meal an entry belongs to. */
export type MealCategory = "breakfast" | "lunch" | "dinner" | "snack";

/** A food that has been logged. Extends Food with an entry id + timestamp. */
export type LogEntry = Food & {
  entryId: string;
  loggedAt: string; // ISO 8601 timestamp
  meal: MealCategory;
};

/** Shape of the lowdb JSON database. */
export type DBData = {
  log: LogEntry[];
};

/** Running totals for a set of log entries. */
export type Totals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

/** Per-macro gram targets derived from the calorie goal. */
export type MacroTargets = {
  protein: number;
  carbs: number;
  fat: number;
};

/** A single food identified by an AI nutrition lookup. */
export type NutritionItem = {
  name: string;
  servingSize: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
};

/** Structured result returned by the AI nutrition lookup routes. */
export type NutritionResult = {
  items: NutritionItem[];
  total: Totals;
  notes?: string;
};
